<#
.SYNOPSIS
Makes the website's copy of the deck, for build-deck.ps1 to export.

.DESCRIPTION
Order: the main deck (slides 1-35), a thank-you slide, an appendix divider,
then every later slide as the appendix. The two new slides reuse slide 2's
header, title and footer, in a section of their own. The appendix slides are
hidden, so a slideshow skips them and the web viewer offers each of their
sections as a show/hide toggle. The source deck is opened read-only and never
changed; the copy can still be edited in PowerPoint.

.EXAMPLE
./scripts/make-web-deck.ps1 slide-deck/presentation_22nd_oct.pptx slide-deck/presentation_web.pptx
#>
param(
    [Parameter(Mandatory)] [string] $Source,
    [Parameter(Mandatory)] [string] $Out
)
$ErrorActionPreference = 'Stop'

$TEMPLATE_SLIDE = 2
# The template's eyebrow, logo, "Aerosearch", title and footer; everything else is removed.
$TEMPLATE_KEEP = 'Text 0', 'Image 0', 'Text 1', 'Text 2', 'Text 10'
$THANKS = @{ Eyebrow = 'CLOSING'; Title = 'Thank you.' }
$APPENDIX = @{ Eyebrow = 'APPENDIX'; Title = 'Supporting detail.' }
$MAIN_LAST = 35
$CLOSING_SECTION = 'Closing'

function New-TitleSlide($deck, [hashtable] $text) {
    $slide = $deck.Slides($TEMPLATE_SLIDE).Duplicate().Item(1)
    for ($i = $slide.Shapes.Count; $i -ge 1; $i--) {
        if ($slide.Shapes($i).Name -notin $TEMPLATE_KEEP) { $slide.Shapes($i).Delete() }
    }
    $slide.Shapes('Text 0').TextFrame.TextRange.Text = $text.Eyebrow
    $slide.Shapes('Text 2').TextFrame.TextRange.Text = $text.Title
    $slide.SlideID
}

$Source = (Resolve-Path $Source).Path
$Out = Join-Path (Resolve-Path (Split-Path $Out -Parent)).Path (Split-Path $Out -Leaf)
$app = New-Object -ComObject PowerPoint.Application
$deck = $app.Presentations.Open($Source, -1, 0, 0)
try {
    $deck.SaveAs($Out)
    # Slide numbers as in the source deck, before the new slides shift them.
    foreach ($s in $deck.Slides) { $s.SlideShowTransition.Hidden = [int]($s.SlideIndex -gt $MAIN_LAST) }
    $closing = $deck.SectionProperties.AddSection($deck.Slides($MAIN_LAST).sectionIndex + 1, $CLOSING_SECTION)
    foreach ($text in $APPENDIX, $THANKS) {
        $deck.Slides.FindBySlideID((New-TitleSlide $deck $text)).MoveToSectionStart($closing)
    }
    $deck.Save()
    Write-Host "$($MAIN_LAST + 2) slides shown, $($deck.Slides.Count - $MAIN_LAST - 2) appendix slides hidden -> $Out"
}
finally {
    $deck.Close()
    $app.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}

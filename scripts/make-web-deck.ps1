<#
.SYNOPSIS
Makes the website's copy of the deck, for build-deck.ps1 to export.

.DESCRIPTION
Order: the deck's visible slides, a thank-you slide, the full commercial
proposal (54-55), an appendix divider, the other hidden slides apart from the
fundraise (31-36), and the Phase-1 proposal (56-57) last. The two new slides
reuse slide 2's header, title and footer. The source deck is opened
read-only and never changed; the copy can still be edited in PowerPoint.

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
$AFTER_THANKS = 54, 55
$APPENDIX_FIRST = 39, 40, 41, 42, 43, 44, 49
$APPENDIX_LAST = 56, 57

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
    # Slide numbers as in the source deck; ids survive the moves below.
    $ids = @{}
    $visible = foreach ($s in $deck.Slides) {
        $ids[$s.SlideIndex] = $s.SlideID
        if (-not $s.SlideShowTransition.Hidden) { $s.SlideID }
    }
    $shown = $AFTER_THANKS + $APPENDIX_FIRST + $APPENDIX_LAST | ForEach-Object { $ids[$_] }
    $order = @($visible) + (New-TitleSlide $deck $THANKS) + $shown[0..1] +
        (New-TitleSlide $deck $APPENDIX) + $shown[2..($shown.Count - 1)]

    for ($i = 0; $i -lt $order.Count; $i++) {
        $slide = $deck.Slides.FindBySlideID($order[$i])
        $slide.SlideShowTransition.Hidden = 0
        $slide.MoveTo($i + 1)
    }
    $deck.Save()
    Write-Host "$($order.Count) slides shown, $($deck.Slides.Count - $order.Count) left hidden -> $Out"
}
finally {
    $deck.Close()
    $app.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}

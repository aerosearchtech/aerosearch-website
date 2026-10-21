<#
.SYNOPSIS
Exports a .pptx for the web deck viewer: one WebP per visible slide, the
slide videos remuxed for streaming, and deck.json saying where each video sits.

.DESCRIPTION
PowerPoint renders the slides, so they look exactly as they do in the deck.
Videos are copied unchanged (no re-encode) with their index moved to the front
so the browser can start playing before the whole file arrives. Hidden slides
are exported too, tagged with their section, for the viewer to show or hide a
section at a time. Needs PowerPoint and ffmpeg on PATH.

.EXAMPLE
./scripts/build-deck.ps1 slide-deck/presentation_22nd_oct.pptx public/demo/presentation
#>
param(
    [Parameter(Mandatory)] [string] $Pptx,
    [Parameter(Mandatory)] [string] $Out,
    [int] $Width = 1920
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$MSO_GROUP = 6
$MSO_MEDIA = 16
$PP_MEDIA_MOVIE = 3
$WEBP_QUALITY = 90

function Read-Entry($zip, [string] $name) {
    $reader = [IO.StreamReader]::new($zip.GetEntry($name).Open())
    try { $reader.ReadToEnd() } finally { $reader.Dispose() }
}

# A relationship target is relative to its part's folder, e.g. ../media/x.mp4.
function Join-PartPath([string] $dir, [string] $target) {
    $parts = [Collections.Generic.List[string]]::new([string[]]($dir -split '/'))
    foreach ($p in $target -split '/') {
        if ($p -eq '..') { $parts.RemoveAt($parts.Count - 1) } else { $parts.Add($p) }
    }
    $parts -join '/'
}

# Relationship id -> package path, for one part.
function Read-Rels($zip, [string] $part) {
    $dir = $part.Substring(0, $part.LastIndexOf('/'))
    $leaf = $part.Substring($dir.Length + 1)
    $map = @{}
    foreach ($r in ([xml](Read-Entry $zip "$dir/_rels/$leaf.rels")).Relationships.Relationship) {
        if ($r.TargetMode -ne 'External') { $map[$r.Id] = Join-PartPath $dir $r.Target }
    }
    $map
}

# Shape id -> embedded video file and its crop (fractions left, top, right, bottom).
function Get-SlideVideos($zip, [string] $part) {
    $rels = Read-Rels $zip $part
    $videos = @{}
    foreach ($pic in [regex]::Matches((Read-Entry $zip $part), '<p:pic>.*?</p:pic>', 'Singleline')) {
        $link = [regex]::Match($pic.Value, '<a:videoFile r:link="(rId\d+)"')
        if (-not $link.Success) { continue }
        $id = [regex]::Match($pic.Value, '<p:cNvPr id="(\d+)"').Groups[1].Value
        $rect = [regex]::Match($pic.Value, '<a:srcRect([^/]*)/>').Groups[1].Value
        $crop = foreach ($side in 'l', 't', 'r', 'b') {
            $m = [regex]::Match($rect, " $side=`"(-?\d+)`"")
            if ($m.Success) { [int]$m.Groups[1].Value / 100000 } else { 0 }
        }
        $videos[$id] = @{ Part = $rels[$link.Groups[1].Value]; Crop = @($crop) }
    }
    $videos
}

function Get-Movies($shapes) {
    foreach ($sh in $shapes) {
        if ($sh.Type -eq $MSO_GROUP) { Get-Movies $sh.GroupItems }
        elseif ($sh.Type -eq $MSO_MEDIA -and $sh.MediaType -eq $PP_MEDIA_MOVIE) { $sh }
    }
}

function Invoke-Ffmpeg([string[]] $arguments) {
    & ffmpeg -y -v error @arguments
    if ($LASTEXITCODE) { throw "ffmpeg failed: $arguments" }
}

$Pptx = (Resolve-Path $Pptx).Path
New-Item -ItemType Directory -Force "$Out/slides", "$Out/video" | Out-Null
$Out = (Resolve-Path $Out).Path
$tmp = New-Item -ItemType Directory -Force (Join-Path $env:TEMP "build-deck-$PID")

$zip = [IO.Compression.ZipFile]::OpenRead($Pptx)
$app = New-Object -ComObject PowerPoint.Application
$deck = $app.Presentations.Open($Pptx, $true, $false, $false)
try {
    # Slide id -> slide part, through the presentation's own slide list.
    $presRels = Read-Rels $zip 'ppt/presentation.xml'
    $slideParts = @{}
    foreach ($m in [regex]::Matches((Read-Entry $zip 'ppt/presentation.xml'), '<p:sldId id="(\d+)" r:id="(rId\d+)"')) {
        $slideParts[$m.Groups[1].Value] = $presRels[$m.Groups[2].Value]
    }

    $W = $deck.PageSetup.SlideWidth
    $H = $deck.PageSetup.SlideHeight
    $height = [int][math]::Round($Width * $H / $W)
    $copied = @{}
    $n = 0
    $slides = foreach ($slide in $deck.Slides) {
        $n++
        $name = '{0:D2}' -f $n
        $png = Join-Path $tmp "$name.png"
        $slide.Export($png, 'PNG', $Width, $height)
        Invoke-Ffmpeg @('-i', $png, '-c:v', 'libwebp', '-quality', $WEBP_QUALITY, "$Out/slides/$name.webp")

        $embedded = Get-SlideVideos $zip $slideParts[[string]$slide.SlideID]
        $videos = foreach ($sh in Get-Movies $slide.Shapes) {
            $v = $embedded[[string]$sh.Id]
            if (-not $v -or -not $v.Part) { throw "slide $($slide.SlideIndex): video '$($sh.Name)' is not embedded" }
            $file = Split-Path $v.Part -Leaf
            if (-not $copied[$file]) {
                $raw = Join-Path $tmp $file
                [IO.Compression.ZipFileExtensions]::ExtractToFile($zip.GetEntry($v.Part), $raw, $true)
                Invoke-Ffmpeg @('-i', $raw, '-c', 'copy', '-movflags', '+faststart', "$Out/video/$file")
                $copied[$file] = $true
            }
            [ordered]@{
                src = "video/$file"
                x = [math]::Round($sh.Left / $W, 5)
                y = [math]::Round($sh.Top / $H, 5)
                w = [math]::Round($sh.Width / $W, 5)
                h = [math]::Round($sh.Height / $H, 5)
                crop = $v.Crop
                muted = [bool]$sh.MediaFormat.Muted
                loop = [bool]$sh.AnimationSettings.PlaySettings.LoopUntilStopped
            }
        }
        Write-Host "slide $name (deck slide $($slide.SlideIndex)): $(@($videos).Count) videos"
        $entry = [ordered]@{ image = "slides/$name.webp"; videos = @($videos) }
        if ($slide.SlideShowTransition.Hidden) { $entry.section = $deck.SectionProperties.Name($slide.sectionIndex) }
        $entry
    }

    $json = [ordered]@{ width = $Width; height = $height; slides = @($slides) } | ConvertTo-Json -Depth 6
    [IO.File]::WriteAllText("$Out/deck.json", $json, [Text.UTF8Encoding]::new($false))
    Write-Host "$n slides, $($copied.Count) videos -> $Out"
}
finally {
    $deck.Close()
    $app.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
    $zip.Dispose()
    Remove-Item -Recurse -Force $tmp
}

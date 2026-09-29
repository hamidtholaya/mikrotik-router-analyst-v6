Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\HAMID\.gemini\antigravity-ide\brain\70684b26-f628-4047-956c-928a9f562c93\mikrotik_app_icon_1790705512462.jpg"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-And-Save($targetPath, $width, $height, $isRound = $false) {
    $parent = Split-Path $targetPath -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $width, $height)
        $g.SetClip($path)
    }

    $g.DrawImage($srcImg, 0, 0, $width, $height)
    $g.Dispose()

    $destBmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Created: $targetPath ($($width)x$($height))"
}

# Android Mipmap densities
$densities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$resDir = "android\app\src\main\res"

foreach ($k in $densities.Keys) {
    $size = $densities[$k]
    # Standard square icon
    Resize-And-Save "$resDir\$k\ic_launcher.png" $size $size $false
    # Round icon for Android 7.1+
    Resize-And-Save "$resDir\$k\ic_launcher_round.png" $size $size $true
    # Adaptive foreground icon (108dp base: mdpi=108, hdpi=162, xhdpi=216, xxhdpi=324, xxxhdpi=432)
    $fgSize = [int]($size * 2.25)
    Resize-And-Save "$resDir\$k\ic_launcher_foreground.png" $fgSize $fgSize $false
}

# Web & Public Assets
Resize-And-Save "public\icon-512.png" 512 512 $false
Resize-And-Save "public\icon-192.png" 192 192 $false
Resize-And-Save "public\favicon.png" 48 48 $false
Resize-And-Save "public\app-icon.png" 512 512 $false

$srcImg.Dispose()
Write-Host "All icons generated successfully!"

$ErrorActionPreference = "Stop"

$Desktop = [Environment]::GetFolderPath("Desktop")
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VbsPath = Join-Path $ScriptDir "Launch.vbs"
$ShortcutPath = Join-Path $Desktop "Calendario Ibero.lnk"

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)

$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"" + $VbsPath + "`""
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Calendario Académico Ibero"
$Shortcut.WindowStyle = 7

$Shortcut.Save()

Write-Host "Acceso directo creado: $ShortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "Arrancando aplicacion..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

& $VbsPath

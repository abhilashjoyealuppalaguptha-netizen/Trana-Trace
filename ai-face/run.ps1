$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    & ".\setup.ps1"
}

& ".\.venv\Scripts\python.exe" recognize.py @args

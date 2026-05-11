$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Python = Get-Command python -ErrorAction SilentlyContinue
if (-not $Python) {
    $Python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $Python) {
    throw "Python 3 is required. Install Python 3.10+ and re-run ai-face\setup.ps1."
}

if (-not (Test-Path ".venv")) {
    & $Python.Source -m venv .venv
}

& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt

if (-not (Test-Path "config.json")) {
    Copy-Item "config.example.json" "config.json"
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

New-Item -ItemType Directory -Force -Path "faces" | Out-Null
New-Item -ItemType Directory -Force -Path "captured" | Out-Null

Write-Host "AI face module setup complete."
Write-Host "Next: add your authorized face photo at ai-face\faces\owner.jpg and set the API key in config.json or .env."

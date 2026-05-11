import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_example_config_is_valid_json():
    data = json.loads((ROOT / "config.example.json").read_text(encoding="utf-8"))
    assert data["backend_url"].endswith("/api/ai/alert")
    assert data["owner_image"] == "faces/owner.jpg"


def test_recognizer_help_runs():
    result = subprocess.run(
        [sys.executable, str(ROOT / "recognize.py"), "--help"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0
    assert "TRANA-TRACE AI face recognition module" in result.stdout

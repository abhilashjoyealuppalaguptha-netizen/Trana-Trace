#!/usr/bin/env python3
"""
TRANA-TRACE AI face recognition module.

Runs against a laptop webcam, USB camera, or ESP32-CAM stream/capture URL.
When an unknown face is detected, it saves a snapshot and sends an authenticated
alert to the backend /api/ai/alert endpoint.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, request


ROOT = Path(__file__).resolve().parent
DEFAULT_CONFIG = ROOT / "config.json"
DEFAULT_OWNER = ROOT / "faces" / "owner.jpg"
DEFAULT_CAPTURED_DIR = ROOT / "captured"


@dataclass
class Settings:
    backend_url: str
    api_key: str
    source: str
    owner_image: Path
    captured_dir: Path
    tolerance: float
    cooldown_seconds: int
    frame_interval_seconds: float
    location_lat: float
    location_lng: float


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        clean = line.strip()
        if not clean or clean.startswith("#") or "=" not in clean:
            continue
        key, value = clean.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def setting(config: dict[str, Any], key: str, default: Any) -> Any:
    env_key = f"TRANA_{key.upper()}"
    return os.environ.get(env_key, config.get(key, default))


def build_settings(args: argparse.Namespace) -> Settings:
    load_env_file(ROOT / ".env")
    config_path = Path(args.config or DEFAULT_CONFIG)
    config = load_json(config_path)

    owner_image = Path(args.owner_image or setting(config, "owner_image", str(DEFAULT_OWNER)))
    captured_dir = Path(args.captured_dir or setting(config, "captured_dir", str(DEFAULT_CAPTURED_DIR)))
    if not owner_image.is_absolute():
        owner_image = ROOT / owner_image
    if not captured_dir.is_absolute():
        captured_dir = ROOT / captured_dir

    return Settings(
        backend_url=str(args.backend_url or setting(config, "backend_url", "http://127.0.0.1:3001/api/ai/alert")),
        api_key=str(args.api_key or setting(config, "api_key", "")),
        source=str(args.source or setting(config, "source", "0")),
        owner_image=owner_image,
        captured_dir=captured_dir,
        tolerance=float(args.tolerance or setting(config, "tolerance", 0.5)),
        cooldown_seconds=int(args.cooldown_seconds or setting(config, "cooldown_seconds", 30)),
        frame_interval_seconds=float(args.frame_interval_seconds or setting(config, "frame_interval_seconds", 0.5)),
        location_lat=float(args.location_lat or setting(config, "location_lat", 17.087741)),
        location_lng=float(args.location_lng or setting(config, "location_lng", 82.068706)),
    )


def import_vision_modules():
    try:
        import cv2  # type: ignore
        import face_recognition  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as exc:
        missing = exc.name or "dependency"
        raise SystemExit(
            f"Missing Python dependency: {missing}. "
            "Install with: python -m pip install -r ai-face/requirements.txt"
        ) from exc
    return cv2, face_recognition, np


def encode_owner(face_recognition: Any, owner_image: Path) -> Any:
    if not owner_image.exists():
        raise SystemExit(
            f"Owner image not found: {owner_image}\n"
            "Add an authorized face photo at ai-face/faces/owner.jpg before live recognition."
        )

    image = face_recognition.load_image_file(str(owner_image))
    encodings = face_recognition.face_encodings(image)
    if not encodings:
        raise SystemExit(f"No face found in owner image: {owner_image}")
    return encodings[0]


def source_value(source: str) -> int | str:
    return int(source) if source.isdigit() else source


def is_snapshot_url(source: str) -> bool:
    lowered = source.lower()
    return lowered.startswith(("http://", "https://")) and (
        "/capture" in lowered or lowered.endswith((".jpg", ".jpeg", ".png"))
    )


def fetch_snapshot_frame(cv2: Any, np: Any, source: str) -> Any | None:
    try:
        with request.urlopen(source, timeout=8) as response:
            image_bytes = response.read()
    except error.URLError as exc:
        print(f"[ai-face] snapshot fetch failed: {exc}", file=sys.stderr)
        return None

    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(buffer, cv2.IMREAD_COLOR)


def save_snapshot(cv2: Any, frame: Any, captured_dir: Path) -> Path:
    captured_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = captured_dir / f"unknown_{timestamp}.jpg"
    cv2.imwrite(str(path), frame)
    return path


def image_to_data_url(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def post_ai_alert(settings: Settings, event: str, confidence: float | None, snapshot: Path | None) -> None:
    payload = {
        "event": event,
        "confidence": confidence,
        "image_url": image_to_data_url(snapshot) if snapshot else None,
        "location": {"lat": settings.location_lat, "lng": settings.location_lng},
    }

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        settings.backend_url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": settings.api_key,
        },
    )

    try:
        with request.urlopen(req, timeout=8) as response:
            print(f"[backend] alert posted: HTTP {response.status}")
    except error.URLError as exc:
        print(f"[backend] alert post failed: {exc}", file=sys.stderr)


def run_self_test(settings: Settings) -> None:
    print("[self-test] configuration loaded")
    print(f"[self-test] backend_url={settings.backend_url}")
    print(f"[self-test] source={settings.source}")
    print(f"[self-test] owner_image={settings.owner_image}")
    print(f"[self-test] captured_dir={settings.captured_dir}")
    if not settings.api_key:
        raise SystemExit("[self-test] missing api_key; set TRANA_API_KEY or config.json api_key")
    print("[self-test] api_key present")


def run_recognition(settings: Settings) -> None:
    cv2, face_recognition, np = import_vision_modules()
    owner_encoding = encode_owner(face_recognition, settings.owner_image)
    settings.captured_dir.mkdir(parents=True, exist_ok=True)

    snapshot_mode = is_snapshot_url(settings.source)
    capture = None
    if not snapshot_mode:
        capture = cv2.VideoCapture(source_value(settings.source))
        if not capture.isOpened():
            raise SystemExit(f"Unable to open camera source: {settings.source}")

    last_alert_at = 0.0
    print("[ai-face] recognition loop started")

    try:
        while True:
            if snapshot_mode:
                frame = fetch_snapshot_frame(cv2, np, settings.source)
                ok = frame is not None
            else:
                ok, frame = capture.read()

            if not ok:
                print("[ai-face] frame read failed; retrying")
                time.sleep(1)
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            locations = face_recognition.face_locations(rgb_frame)
            encodings = face_recognition.face_encodings(rgb_frame, locations)

            for face_encoding in encodings:
                distances = face_recognition.face_distance([owner_encoding], face_encoding)
                distance = float(distances[0])
                is_owner = distance <= settings.tolerance

                if is_owner:
                    print(f"[ai-face] authorized face detected distance={distance:.3f}")
                    continue

                now = time.time()
                if now - last_alert_at < settings.cooldown_seconds:
                    continue

                confidence = max(0.0, min(1.0, 1.0 - distance))
                snapshot = save_snapshot(cv2, frame, settings.captured_dir)
                print(f"[ai-face] unknown face detected snapshot={snapshot}")
                post_ai_alert(settings, "unknown_face", confidence, snapshot)
                last_alert_at = now

            time.sleep(settings.frame_interval_seconds)
    except KeyboardInterrupt:
        print("\n[ai-face] stopped")
    finally:
        if capture is not None:
            capture.release()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TRANA-TRACE AI face recognition module")
    parser.add_argument("--config", help="Path to config.json")
    parser.add_argument("--backend-url", help="Backend /api/ai/alert URL")
    parser.add_argument("--api-key", help="Backend DEVICE_API_KEY")
    parser.add_argument("--source", help="Camera index, RTSP URL, ESP32-CAM stream URL, or ESP32-CAM /capture URL")
    parser.add_argument("--owner-image", help="Authorized owner face image")
    parser.add_argument("--captured-dir", help="Directory for unknown-face snapshots")
    parser.add_argument("--tolerance", type=float, help="Face match tolerance; lower is stricter")
    parser.add_argument("--cooldown-seconds", type=int, help="Seconds between unknown-face alerts")
    parser.add_argument("--frame-interval-seconds", type=float, help="Sleep between processed frames")
    parser.add_argument("--location-lat", type=float, help="Fallback latitude for AI alerts")
    parser.add_argument("--location-lng", type=float, help="Fallback longitude for AI alerts")
    parser.add_argument("--self-test", action="store_true", help="Validate config without opening camera")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = build_settings(args)

    if args.self_test:
        run_self_test(settings)
        return

    run_recognition(settings)


if __name__ == "__main__":
    main()

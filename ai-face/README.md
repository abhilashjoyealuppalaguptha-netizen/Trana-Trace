# TRANA-TRACE AI Face Recognition

This module compares live camera frames against `faces/owner.jpg`. If a face does not match the owner, it saves a snapshot in `captured/` and posts an authenticated alert to the backend `/api/ai/alert` endpoint.

## Setup

```powershell
cd ai-face
.\setup.ps1
```

If PowerShell blocks scripts on your machine, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Edit `config.json`:

* Set `api_key` to the same `DEVICE_API_KEY` used by `backend/.env`.
* Set `source` to `0` for a laptop webcam, an ESP32-CAM stream URL such as `http://192.168.4.1:81/stream`, or a snapshot URL such as `http://192.168.4.1/capture`.
* Add the authorized owner's face photo at `faces/owner.jpg`.

`faces/owner.jpg` is intentionally ignored by git because it is private biometric data. The repository includes the folder and placeholder instructions, but each team member should provide their own local owner image.

## Run

Validate configuration without camera access:

```powershell
.\run.ps1 --self-test
```

Start recognition:

```powershell
.\run.ps1
```

Run lightweight module tests:

```powershell
.\.venv\Scripts\python.exe -m pytest tests
```

## ESP32-CAM Notes

Use the ESP32-CAM CameraWebServer sketch or equivalent firmware that exposes either an MJPEG stream or a `/capture` JPEG endpoint. Set `source` in `config.json` to that URL. The Python recognizer handles frame capture, classification, snapshot save, and backend alert POST.

## Backend Alert Contract

```http
POST /api/ai/alert
X-Api-Key: <DEVICE_API_KEY>
Content-Type: application/json
```

```json
{
  "event": "unknown_face",
  "confidence": 0.82,
  "image_url": "data:image/jpeg;base64,...",
  "location": { "lat": 17.087741, "lng": 82.068706 }
}
```

# Extension Points

## AI Theft Detection Hook

External AI modules can report suspicious activity to:

```http
POST /api/ai/alert
X-API-Key: <DEVICE_API_KEY>
Content-Type: application/json
```

```json
{
  "event": "unknown_face",
  "confidence": 0.91,
  "image_url": "https://example.com/intruder.jpg",
  "location": { "lat": 17.087741, "lng": 82.068706 }
}
```

The backend stores the AI event, switches the dashboard to `DANGER`, emits a WebSocket `AI_ALERT`, and appends a log entry. This lets ESP32-CAM, OpenCV, cloud vision, or future on-device models integrate without changing the FPGA FSM.

## eSIM/GSM Communication Hook

The hardware power design reserves an optional boosted wireless rail for an A9G/LTE/eSIM module. The firmware contract should remain the same as WiFi updates: send authenticated JSON to `/api/device/update` with `wifi`, `fpga_alert`, `battery`, `telegram_sent`, and `location`.

## Secure Deployment Path

Production deployments should set `DEVICE_API_KEY`, use HTTPS/WSS behind a reverse proxy, rotate Telegram credentials, and keep local firmware secrets in `Hardware/Fpga_code/config.h`.

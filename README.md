# TRANA-TRACE
> GPS-Based Covert Tracking & Emergency Alert System  
> **FPGA · NodeMCU ESP8266 · Node.js · React**

---

## Overview

Trana-Trace is a real-time GPS tracking and emergency alert device designed for personal safety scenarios. It combines an FPGA-based state machine, a NodeMCU (ESP8266) microcontroller, a NEO-6M GPS module, and a live web dashboard to provide covert tracking, SOS alerting, and remote monitoring.

A key feature is the **Fake-Off (Stealth) mode** — the device physically appears powered down while it continues tracking silently in the background and sends a Telegram alert with the live location.

---

## Project Structure

```
Trana-Trace/
├── gpsbot.ino          # Arduino firmware — GPS, FPGA serial, Telegram, HTTP POST
├── gpsfile.v           # FPGA top-level — wires together all sub-modules
├── mod1.v              # LED pulse generator — drives 6 LEDs based on FSM state
├── mod2.v              # UART TX — sends FSM state byte to NodeMCU at 9600 baud
├── mod3.v              # Trana FSM — core 4-state finite state machine
├── mod4.v              # Click detector — debounce + click-window counter
├── backend/
│   ├── server.js       # Node.js + Express + WebSocket + Redis server
│   └── package.json
└── frontend/
    └── src/
        ├── pages/      # Dashboard, Alerts, Login, Profile, Settings
        ├── components/ # LiveMap, StatusPanel, ActivityFeed, SOSButton, Sidebar
        └── hooks/      # useRealtime.js — WebSocket + REST state management
```

---

## Hardware Architecture

**Components:** FPGA (27 MHz), NodeMCU ESP8266, NEO-6M GPS module, SSD1306 OLED (128×64), push button, 6× LEDs

**Signal flow:**
```
Button → FPGA click detector → FSM → UART TX
  → NodeMCU RX → HTTP POST → Redis + WebSocket broadcast
    → React Dashboard + Telegram Alert
```

### FPGA State Machine

| State | Value | Click Pattern | OLED Display | LED Behaviour | Alert |
|-------|-------|---------------|--------------|---------------|-------|
| NORMAL | 0 | — | Live GPS coords | All OFF | None |
| FAKE_OFF | 1 | 1 click (from NORMAL) | Screen blank | Slow single blink | Stealth Telegram |
| EMERGENCY | 2 | 2 clicks (from FAKE_OFF) | `!!! SOS !!!` | Fast full flash | SOS Telegram |
| REAL_OFF | 3 | 2 clicks (from NORMAL) | SYSTEM POWERED OFF | All OFF | None |

Transitions are triggered by click patterns within a **1-second window**. Debounce filter runs at ~20ms (540,000 cycles at 27 MHz). State bytes are sent over UART on every state change.

---

## Firmware (`gpsbot.ino`)

The NodeMCU firmware runs a continuous loop:

- Reads GPS NMEA sentences via SoftwareSerial from the NEO-6M module
- Falls back to hardcoded coordinates (Aditya University campus) if GPS lock is unavailable
- Reads the FPGA state byte over a second SoftwareSerial port
- Sends a Telegram message on transition to STEALTH (1) or EMERGENCY (2)
- POSTs a JSON payload to the backend `/update` endpoint every loop iteration
- Updates the SSD1306 OLED display based on current state

**Libraries required:** `TinyGPSPlus`, `Adafruit_SSD1306`, `UniversalTelegramBot`, `ESP8266HTTPClient`, `SoftwareSerial`

---

## Backend (`server.js`)

| Detail | Value |
|--------|-------|
| Runtime | Node.js + Express |
| State store | Redis — `HSET device:TT-01` |
| Realtime | WebSocket (`ws` library) — broadcasts to all dashboard clients |
| `POST /update` | Primary hardware ingestion endpoint |
| `GET /device` | Returns current device state from Redis |
| `POST /api/sos` | Manual SOS trigger from the dashboard UI |

On each hardware POST, the server updates Redis, calculates status (`OFFLINE` / `ACTIVE` / `DANGER`), and broadcasts a `LOCATION_UPDATE` WebSocket event. FPGA threat detections are pushed as `NEW_LOG` events.

---

## Frontend (React Dashboard)

Built with **React + Vite + Tailwind CSS + Framer Motion + Leaflet**.

- Live GPS map via Leaflet — updates in real-time from WebSocket
- Status panel showing WiFi link, FPGA threat status, and device state
- Activity feed — last 50 log entries
- SOS button — triggers manual alert from the dashboard
- Auto-reconnecting WebSocket with 3-second retry

---

## Setup & Running

### 1. Backend

> Requires Redis running on `localhost:6379` (or set `REDIS_URL` env var)

```bash
cd backend
npm install
node server.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Firmware

1. Create a `config.h` file with your credentials:
```cpp
#define WIFI_SSID     "your_ssid"
#define WIFI_PASSWORD "your_password"
#define BOT_TOKEN     "your_telegram_bot_token"
#define CHAT_ID       "your_chat_id"
```
2. Update `serverURL` in `gpsbot.ino` to your backend IP and port
3. Flash to NodeMCU via Arduino IDE with ESP8266 board support
4. Synthesize and upload Verilog files to your FPGA

---

## ⚠️ Security Notes

> **Never commit credentials to source control.**  
> Move WiFi SSID/password, Telegram bot token, and chat ID into `config.h` and add it to `.gitignore` before pushing.

- Backend endpoints have no authentication — restrict to local network or add API key middleware before any public deployment
- Frontend WebSocket uses `ws://` — switch to `wss://` for HTTPS deployments

---

## Known Limitations

- Battery level is hardcoded to `100%` (hardware spec fixed for current revision)
- GPS falls back to static campus coordinates when satellite lock is unavailable
- Duplicate `/update` and `/api/device/update` endpoints exist — `/api/device/update` is deprecated
- No authentication on backend REST or WebSocket endpoints

---

*Trana-Trace · Device ID: TT-01 · Built at  Technical Hub ,Aditya University*

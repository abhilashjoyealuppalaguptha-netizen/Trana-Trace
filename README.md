# TRANA-TRACE

**GPS-Based Covert Tracking & Emergency Alert System**

> _Technologies: VLSI · IoT · Embedded · Full Stack Development_

---

## What is Trana-Trace?

Trana-Trace is a covert GPS tracking and emergency alert system designed for personal safety. It combines FPGA-based deterministic state control, IoT communication via NodeMCU ESP8266, and a real-time React dashboard.

**Key Innovation — Fake-Off Mode:** The device continues covert tracking even when it appears powered off. An unauthorized shutdown attempt triggers automatic intruder detection and an instant Telegram alert to trusted contacts.

---

## Features

- Live GPS tracking with real-time dashboard (Leaflet maps)
- Emergency alert transmission via Telegram Bot API
- **Stealth (Fake-Off) Mode** — device appears OFF while tracking continues
- FPGA-based intruder detection via hardware state machine (FSM)
- WebSocket-based real-time dashboard updates with auto-reconnection
- Manual SOS trigger from dashboard with audio alarm
- Browser push notifications on DANGER status
- System reset endpoint for returning device to secure state
- HMAC-SHA256 token authentication with timing-safe comparison

---

## Hardware Components

| Component | Function |
|---|---|
| FPGA (Tang Nano / equivalent) | Controls FSM, click detection, hardware debounce |
| NodeMCU ESP8266 | WiFi communication, backend connectivity, GPS reading, Telegram alerts |
| NEO-6M GPS Module | Provides real-time GPS coordinates |
| OLED Display (128×64) | Displays current device status |
| Push Button | User input for state transitions |

---

## FSM States

| State | Trigger | Behaviour |
|---|---|---|
| **NORMAL** | Default | Live GPS active; OLED ON showing coordinates |
| **FAKE_OFF** | Single click | OLED blank; covert tracking continues; Telegram alert sent |
| **EMERGENCY** | `batt_low` signal or manual SOS | `fpga_alert=1`; OLED shows `!!! SOS !!!`; exits only on hardware reset |
| **REAL_OFF** | Double click | OLED shows "SYSTEM POWERED OFF"; single click returns to NORMAL |

State transitions are managed by `trana_fsm.v` and click detection by `click_detector.v` with a 20 ms hardware debounce (540,000 cycles at 27 MHz).

---

## Architecture

```
Button Press
    └─► FPGA FSM (click detection + debounce)
            └─► UART 9600 bps
                    └─► NodeMCU ESP8266
                            ├─► NEO-6M GPS Read
                            ├─► POST /api/device/update
                            │       └─► Redis (hSet)
                            │               └─► WebSocket broadcast
                            │                       └─► React Dashboard
                            └─► Telegram Alert (on FAKE_OFF / EMERGENCY)
```

---

## Project Structure

```
Trana-Trace/
├── Hardware/
│   └── Fpga_code/
│       ├── trana_fsm.v              # Main FSM (4 states)
│       ├── click_detector.v         # Debounce + click count logic
│       ├── uart_tx.v                # UART transmitter (9600 bps)
│       ├── led_pulse_gen.v          # LED state indicator
│       ├── top.v                    # Top-level module
│       ├── trana_trace_firmware.ino # NodeMCU Arduino firmware
│       ├── config.example.h         # WiFi/API/Telegram config template
│       ├── tb_trana_fsm.v           # FSM testbench
│       ├── tb_click_detector.v      # Click detector testbench
│       └── tb_uart_tx.v             # UART testbench
├── backend/
│   ├── server.js                    # Express + WebSocket + Redis backend
│   ├── package.json
│   ├── .env.example                 # Environment variable template
│   ├── diagnose_db.js               # Redis diagnostics utility
│   ├── simulate_alert.js            # Alert simulation for testing
│   └── test_flow.js                 # End-to-end flow test
└── frontend/                        # React 19 + Vite + Tailwind dashboard
```

---

## Setup & Installation

### 1. Hardware — FPGA

1. Synthesize and flash the Verilog files in `Hardware/Fpga_code/` to your Tang Nano (or equivalent) FPGA.
2. Connect the push button, OLED display, and UART pins as defined in `top.v`.
3. Wire the FPGA UART TX pin to the NodeMCU RX (SoftwareSerial, pin 13).

### 2. Hardware — NodeMCU Firmware

1. Copy `config.example.h` to `config.h` and fill in your values:
   ```c
   #define WIFI_SSID     "your_wifi_ssid"
   #define WIFI_PASSWORD "your_wifi_password"
   #define BOT_TOKEN     "your_telegram_bot_token"
   #define CHAT_ID       "your_telegram_chat_id"
   #define SERVER_URL    "http://your-backend-ip:3001"
   #define DEVICE_API_KEY "your_device_api_key"
   ```
2. Flash `trana_trace_firmware.ino` via Arduino IDE with ESP8266 board support.
3. Required libraries: `TinyGPSPlus`, `Adafruit_SSD1306`, `UniversalTelegramBot`, `ESP8266HTTPClient`.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
node server.js
```

**Environment variables (`.env`):**

```env
REDIS_URL=redis://localhost:6379
PORT=3001
DEVICE_API_KEY=replace_with_strong_device_api_key
AUTH_USERNAMES=your_username
AUTH_PASSWORD=replace_with_strong_dashboard_password
AUTH_TOKEN_SECRET=replace_with_long_random_token_secret
```

> **Redis must be running** before starting the backend (`redis-server`).

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and log in with the credentials from `.env`.

---

## API Reference

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login` | POST | None | Returns HMAC-SHA256 token (12 hr expiry) |
| `/device` | GET | None | Returns current device state from Redis |
| `/api/device/update` | POST | `x-api-key` | Receives GPS + state from NodeMCU |
| `/api/sos` | POST | Bearer or api-key | Manual SOS — sets `status=DANGER`, `fpga_alert=1` |
| `/api/reset-system` | POST | Bearer or api-key | Resets device to secure defaults |

---

## WebSocket Events

| Event | Direction | Trigger |
|---|---|---|
| `INITIAL_STATE` | Server → Client | New WebSocket connection |
| `LOCATION_UPDATE` | Server → Client | POST to `/api/device/update` |
| `STATUS_CHANGE` | Server → Client | SOS or system reset |
| `NEW_LOG` | Server → Client | FPGA alert or manual SOS |

---

## Technical Specifications

| Parameter | Value |
|---|---|
| FPGA Clock | 27 MHz |
| UART Baud Rate | 9600 bps |
| Debounce Delay | 20 ms (540,000 cycles) |
| Click Detection Window | 1 second (27,000,000 cycles) |
| GPS Module | NEO-6M |
| Display | 128 × 64 px OLED |
| Auth Token Expiry | 12 hours |
| Default Fallback Location | lat: 17.087741, lng: 82.068706 |
| Backend Port | 3001 (configurable) |
| Database | Redis (default: `redis://localhost:6379`) |

---

## Security Notes

- Device API key (`DEVICE_API_KEY`) must be kept secret — it authenticates hardware POST requests.
- Dashboard auth uses HMAC-SHA256 tokens; passwords are compared with `crypto.timingSafeEqual` to prevent timing attacks.
- The `.env` file must never be committed — it is listed in `.gitignore`.
- `config.h` (containing WiFi credentials and Telegram token) must never be committed — only `config.example.h` is tracked.

---

## Known Limitations

- EMERGENCY state has no software exit path — only a hardware reset (`rst`) exits it. This is by design.
- REAL_OFF is a near-shutdown state, not true power-off. True power-off requires physically disconnecting power.
- GPS fallback coordinates (`BOOT_FALLBACK_LAT/LON`) are transmitted when no GPS fix is available.
- `batt_low` is hardwired to `1'b0` in `top.v` for the current demo — real battery monitoring requires ADC integration.

---

## Future Enhancements

- Real battery ADC integration and `batt_low` signal routing in FPGA
- Multi-device dashboard support (beyond single device `TT-01`)
- Geofencing alerts when device exits a defined area
- Historical GPS trail storage and playback
- End-to-end encryption for all device-to-backend communication
- Mobile companion app (React Native)

---

## Team Naviel

| Name | Roll Number | Contribution |
|---|---|---|
| G. Likhita | 24B11EC099 | FPGA Verilog Design, FSM Implementation |
| K. Tanuja | 24B11EC146 | FSM Implementation and Verification |
| P. Sowmya | 24B11EC253 | Backend (Node.js, Redis, WebSocket) |
| U. Abhilash Joyeal | 24B11EC324 | IoT Developer |
| G. Guru Nandhini | 24B11EC085 | Embedded Developer |
| B. Dheeraja | 24B11EC024 | Frontend Developer |

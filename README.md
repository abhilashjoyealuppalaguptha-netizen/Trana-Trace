# TRANA-TRACE AI

> AI-Powered GPS-Based Covert Tracking & Emergency Alert System
> **FPGA · ESP8266 · ESP32-CAM · OpenCV · Node.js · React**

---

# Overview

TRANA-TRACE AI is a real-time covert tracking and emergency alert system designed for personal safety and anti-theft applications. The project combines FPGA-based hardware control, GPS tracking, AI-powered face recognition, and a live web dashboard for intelligent monitoring and emergency response.

The system supports a unique **Fake-Off (Stealth) Mode**, where the device physically appears powered off while secretly continuing GPS tracking and sending emergency alerts in the background.

An integrated AI Face Recognition module detects unauthorized users using an ESP32-CAM and OpenCV. If an unknown person attempts access, the system automatically activates stealth tracking, captures the intruder image, and sends live alerts with GPS location.

---

# Key Features

* Real-time GPS tracking
* FPGA-based finite state machine
* Fake-Off stealth tracking mode
* Emergency SOS mode
* AI Face Recognition using OpenCV
* Intruder image capture
* Telegram alert integration
* Live React dashboard
* WebSocket real-time updates
* OLED status display
* Redis-based state storage
* Auto-reconnecting frontend

---

# Project Structure

```text
Trana-Trace-AI/
├── gpsbot.ino              # NodeMCU firmware — GPS, FPGA serial, Telegram, HTTP POST
├── gpsfile.v               # FPGA top-level integration
├── mod1.v                  # LED pulse generator
├── mod2.v                  # UART TX module
├── mod3.v                  # Main FSM logic
├── mod4.v                  # Click detector + debounce
├── ai-face/
│   ├── faces/
│   │   └── owner.jpg       # Authorized user image
│   ├── recognize.py        # Face recognition engine
│   ├── captured/           # Stores intruder snapshots
│   └── requirements.txt
├── backend/
│   ├── server.js           # Express + WebSocket + Redis backend
│   └── package.json
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        └── hooks/
```

---

# Hardware Architecture

## Components

* FPGA (27 MHz)
* NodeMCU ESP8266
* ESP32-CAM
* NEO-6M GPS module
* SSD1306 OLED Display
* Push Button
* 6× LEDs

---

# System Signal Flow

```text
Button → FPGA Click Detector → FSM → UART TX
        ↓
NodeMCU ESP8266 → HTTP POST → Redis + WebSocket
        ↓
React Dashboard + Telegram Alerts

ESP32-CAM → OpenCV Face Recognition
        ↓
Authorized / Unauthorized Detection
        ↓
FPGA Trigger → Stealth Mode + Intruder Alert
```

---

# FPGA State Machine

| State     | Value | Trigger                          | OLED Display         | LED Behaviour     | Alert            |
| --------- | ----- | -------------------------------- | -------------------- | ----------------- | ---------------- |
| NORMAL    | 0     | Authorized owner                 | Live GPS coordinates | All OFF           | None             |
| FAKE_OFF  | 1     | Unknown face / single click      | Screen blank         | Slow single blink | Stealth Telegram |
| EMERGENCY | 2     | SOS / multiple failed detections | `!!! SOS !!!`        | Fast flashing     | SOS Telegram     |
| REAL_OFF  | 3     | Double click from NORMAL         | SYSTEM POWERED OFF   | All OFF           | None             |

Transitions occur within a 1-second click window. FPGA debounce filtering runs at approximately 20ms.

---

# AI Face Recognition Module

The AI module uses OpenCV and the `face_recognition` library to compare live camera frames with stored authorized user images.

## Face Recognition Workflow

```text
ESP32-CAM → Capture Frame
        ↓
OpenCV Face Detection
        ↓
Face Encoding Comparison
        ↓
Known / Unknown Decision
        ↓
Trigger FPGA State Change
```

---

# Unauthorized Access Response

If an unknown face is detected:

* Stealth mode automatically activates
* GPS tracking continues silently
* Intruder image is captured
* Telegram alert is sent
* Dashboard updates in real time

---

# Firmware (`gpsbot.ino`)

The NodeMCU firmware continuously:

* Reads GPS data from NEO-6M
* Reads FPGA state bytes via UART
* Sends Telegram alerts
* Uploads device state to backend
* Updates OLED display
* Receives AI-triggered alerts

## Required Libraries

```text
TinyGPSPlus
Adafruit_SSD1306
UniversalTelegramBot
ESP8266HTTPClient
SoftwareSerial
```

---

# Backend (`server.js`)

| Detail   | Value                            |
| -------- | -------------------------------- |
| Runtime  | Node.js + Express                |
| Database | Redis                            |
| Realtime | WebSocket (`ws`)                 |
| REST API | `/update`, `/device`, `/api/sos` |
| Alerts   | Telegram integration             |

## Backend Responsibilities

* Store live device data
* Broadcast WebSocket updates
* Handle SOS requests
* Process AI face recognition alerts
* Manage device logs

---

# Frontend Dashboard

Built using:

* React
* Vite
* Tailwind CSS
* Framer Motion
* Leaflet

## Dashboard Features

* Live GPS map
* Device state monitoring
* FPGA threat status
* Activity feed
* Intruder snapshot display
* Live alert notifications
* Manual SOS trigger

---

# Setup & Running

## 1. Backend

Requires Redis running locally.

```bash
cd backend
npm install
node server.js
```

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 3. AI Face Recognition Module

Install Python dependencies:

```bash
pip install opencv-python face_recognition numpy
```

Run the recognition engine:

```bash
cd ai-face
python recognize.py
```

---

## 4. Firmware Setup

Create a `config.h` file:

```cpp
#define WIFI_SSID     "your_ssid"
#define WIFI_PASSWORD "your_password"
#define BOT_TOKEN     "your_telegram_bot_token"
#define CHAT_ID       "your_chat_id"
```

Then:

1. Update backend IP inside `gpsbot.ino`
2. Flash firmware to NodeMCU ESP8266
3. Upload face recognition code to ESP32-CAM
4. Synthesize and upload Verilog files to FPGA

---

# Telegram Alert Example

```text
⚠ ALERT: Unauthorized person detected!

Stealth mode activated.
Live GPS tracking enabled.

Location:
https://maps.google.com/?q=LAT,LON
```

---

# Security Notes

* Never commit credentials to GitHub
* Add `config.h` to `.gitignore`
* Use HTTPS and `wss://` for deployment
* Add authentication before production deployment

---

# Known Limitations

* Battery monitoring is currently simulated
* GPS fallback uses static coordinates without satellite lock
* Face recognition accuracy depends on lighting conditions
* Backend APIs currently lack authentication

---

# Future Improvements

* Cloud database integration
* Mobile application support
* Geo-fencing
* Voice activation
* Mask detection
* Multi-user face database
* Battery optimization
* GSM fallback communication

---

# Technologies Used

| Category         | Technologies             |
| ---------------- | ------------------------ |
| Embedded Systems | FPGA, ESP8266, ESP32-CAM |
| AI / ML          | OpenCV, face_recognition |
| Frontend         | React, Tailwind CSS      |
| Backend          | Node.js, Express, Redis  |
| Communication    | WebSocket, Telegram API  |
| Tracking         | GPS NEO-6M               |

---

# Final Abstract

TRANA-TRACE AI is an intelligent covert tracking and emergency alert system designed for personal safety and anti-theft applications. The project integrates FPGA-based control logic, GPS tracking, ESP8266 communication, AI-powered facial recognition, and a real-time web dashboard. Using OpenCV-based face recognition, the system identifies unauthorized users and automatically activates stealth tracking mode while capturing intruder images and sending live GPS alerts through Telegram and a monitoring dashboard. The combination of embedded systems, IoT, artificial intelligence, and real-time communication creates a powerful smart security solution for modern safety applications.

---

# Team & Development

**Project Name:** TRANA-TRACE AI
**Device ID:** TT-01
**Built at:** Technical Hub, Aditya University

---

#ifndef CONFIG_H
#define CONFIG_H

// ─────────────────────────────────────────────────────────────────────────────
// TRANA TRACE — Device Configuration
// Copy this file to config_local.h and fill in your values.
// config_local.h is listed in .gitignore and will never be committed.
// ─────────────────────────────────────────────────────────────────────────────

// WiFi credentials
#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

// Backend server URL (no trailing slash)
// Example: "http://192.168.1.100:3001/update"
#define SERVER_URL     "http://YOUR_SERVER_IP:3001/update"

// API key — must match DEVICE_API_KEY in backend/.env
#define API_KEY        "YOUR_API_KEY_HERE"

// Telegram Bot credentials
// Create a bot via @BotFather on Telegram to get BOT_TOKEN.
// Send any message to your bot, then visit:
//   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
// to find your CHAT_ID.
#define BOT_TOKEN      "YOUR_TELEGRAM_BOT_TOKEN"
#define CHAT_ID        "YOUR_TELEGRAM_CHAT_ID"

#endif // CONFIG_H

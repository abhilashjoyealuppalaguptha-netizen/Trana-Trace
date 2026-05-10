#ifndef CONFIG_H
#define CONFIG_H

// ─────────────────────────────────────────────────────────────────────────────
// TRANA TRACE — Device Configuration
// Copy this file to config_local.h and fill in your values.
// config_local.h is listed in .gitignore and will never be committed.
// ─────────────────────────────────────────────────────────────────────────────

// WiFi credentials
#define WIFI_SSID      "Moto"
#define WIFI_PASSWORD  "vardhanguru"

// Backend server URL (no trailing slash)
// Example: "http://192.168.1.100:3001/update"
#define SERVER_URL     "http://10.171.252.228:3001/update"

// API key — must match DEVICE_API_KEY in backend/.env
#define API_KEY        "TT-01"

// Telegram Bot credentials
// Create a bot via @BotFather on Telegram to get BOT_TOKEN.
// Send any message to your bot, then visit:
//   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
// to find your CHAT_ID.
#define BOT_TOKEN      "8696098274:AAFs_fApNQ27_MfS0b1DkogkqpsShWA4FKY"
#define CHAT_ID        "7454524513"

#endif // CONFIG_H

#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// TRANA TRACE — Configuration Template
// =============================================================================
// DO NOT put real credentials here. This file is committed to git.
//
// SETUP INSTRUCTIONS:
//   1. Copy this file:   cp config.h config_local.h
//   2. Fill in your real values in config_local.h
//   3. config_local.h is git-ignored — it will never be committed
// =============================================================================

// WiFi credentials
#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

// Backend server URL
#define SERVER_URL     "http://YOUR_SERVER_IP:3001/update"

// API key — must match DEVICE_API_KEY in backend/.env
#define API_KEY        "YOUR_API_KEY_HERE"

// Telegram Bot credentials
#define BOT_TOKEN      "YOUR_TELEGRAM_BOT_TOKEN"
#define CHAT_ID        "YOUR_TELEGRAM_CHAT_ID"

#endif // CONFIG_H

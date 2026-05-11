#ifndef CONFIG_H
#define CONFIG_H

// Copy this file to config.h and fill in local values before flashing.
// Hardware/Fpga_code/config.h is intentionally ignored by git.

#define WIFI_SSID      "your_wifi_ssid"
#define WIFI_PASSWORD  "your_wifi_password"

// Preferred backend endpoint.
#define SERVER_URL     "http://192.168.1.100:3001/api/device/update"

// Must match DEVICE_API_KEY in backend/.env.
#define API_KEY        "replace_with_strong_device_api_key"

// Telegram Bot credentials.
#define BOT_TOKEN      "your_telegram_bot_token"
#define CHAT_ID        "your_telegram_chat_id"

// Battery calibration for NodeMCU A0.
// Adjust these values after measuring your divider output.
#define BATTERY_ADC_EMPTY  650
#define BATTERY_ADC_FULL   980

#endif

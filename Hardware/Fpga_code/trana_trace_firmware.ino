#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ESP8266HTTPClient.h>
#include "config.h"

#ifndef BOOT_FALLBACK_LAT
#define BOOT_FALLBACK_LAT "17.087741"
#endif

#ifndef BOOT_FALLBACK_LON
#define BOOT_FALLBACK_LON "82.068706"
#endif


#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);


SoftwareSerial gpsSerial(14, 12);
TinyGPSPlus gps;


SoftwareSerial fpgaSerial(13, 15);


byte currentState   = 0;
byte previousState  = 255;
byte lastValidState = 0;
bool alertSent      = false;


String latStr = "Searching...";
String lonStr = "Searching...";
String gpsSource = "BOOT-FALLBACK";
String lastValidLatStr = BOOT_FALLBACK_LAT;
String lastValidLonStr = BOOT_FALLBACK_LON;
bool hasGpsFix = false;

unsigned long lastDisplayUpdate = 0;
unsigned long lastWifiCheck     = 0;
unsigned long lastTelegramTime  = 0;



WiFiClientSecure secureClient;
UniversalTelegramBot bot(BOT_TOKEN, secureClient);


void connectWiFi() {
    Serial.print("Connecting WiFi");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi OK ");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}


bool sendTelegram(String msg) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected ");
        return false;
    }
    Serial.println("Sending Telegram...");
    secureClient.setFingerprint("BB DC 45 2A 07 E3 4A 71 33 40 F7 9A 62 3D 5F EB C8 7E F2 08");
    bool ok = bot.sendMessage(CHAT_ID, msg, "");
    if (ok) {
        Serial.println("Telegram SENT ");
        return true;
    } else {
        Serial.println("Telegram FAILED ");
        return false;
    }
}


String buildJSON() {

    bool wifiStatus = (WiFi.status() == WL_CONNECTED);
    int batteryPercent = readBatteryPercent();

    String json = "{";
    json += "\"device_id\":\"TT-01\",";
    json += "\"wifi\":" + String(wifiStatus ? "true" : "false") + ",";
    json += "\"fpga_alert\":" + String(currentState) + ",";
    json += "\"telegram_sent\":" + String(alertSent ? "true" : "false") + ",";
    json += "\"battery\":" + String(batteryPercent) + ",";
    json += "\"location\":{";
    json += "\"lat\":" + latStr + ",";
    json += "\"lng\":" + lonStr;
    json += "},";
    json += "\"gps_source\":\"" + gpsSource + "\"";
    json += "}";

    return json;
}

int readBatteryPercent() {
    int raw = analogRead(A0);
    int percent = map(raw, BATTERY_ADC_EMPTY, BATTERY_ADC_FULL, 0, 100);
    return constrain(percent, 0, 100);
}


void sendToServer(String json) {

    if (WiFi.status() != WL_CONNECTED) return;

    WiFiClient client;
    HTTPClient http;

    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Api-Key", API_KEY);

    int code = http.POST(json);

    Serial.print("HTTP Response: ");
    Serial.println(code);

    http.end();
}

// ───── Setup ─────────────────────────────────────
void setup() {
    Serial.begin(9600);
    gpsSerial.begin(9600);
    fpgaSerial.begin(9600);

    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("OLED Failed ❌");
        while (true);
    }

    display.clearDisplay();
    display.setTextColor(WHITE);

    showConnecting();

    connectWiFi();
    showNormal();
}

// ───── Main Loop ─────────────────────────────────
void loop() {

    // ── GPS Read ────────────────────────────────
    gpsSerial.listen();
    unsigned long gpsStart = millis();

    while (millis() - gpsStart < 200) {
        while (gpsSerial.available()) {
            gps.encode(gpsSerial.read());
        }
    }

    if (gps.location.isValid() && gps.location.age() < 2000) {
        latStr = String(gps.location.lat(), 6);
        lonStr = String(gps.location.lng(), 6);
        lastValidLatStr = latStr;
        lastValidLonStr = lonStr;
        hasGpsFix = true;
        gpsSource = "NEO-6M";
        Serial.println("📡 Location accessed NEO-6M");
    } else if (hasGpsFix) {
        latStr = lastValidLatStr;
        lonStr = lastValidLonStr;
        gpsSource = "LAST-KNOWN";
        Serial.println("GPS lock unavailable; using last known fix");
    } else {
        latStr = lastValidLatStr;
        lonStr = lastValidLonStr;
        gpsSource = "BOOT-FALLBACK";
        Serial.println("GPS lock unavailable; using boot fallback until first fix");
    }

    // ── FPGA Read ───────────────────────────────
    fpgaSerial.listen();
    unsigned long fpgaStart = millis();

    while (millis() - fpgaStart < 100) {
        while (fpgaSerial.available()) {

            byte received = fpgaSerial.read();

            Serial.print("RAW BYTE: ");
            Serial.println(received, BIN);

            if (received == 2 && lastValidState != 0 && lastValidState != 1) {
                Serial.println("Ignoring false EMERGENCY");
                continue;
            }

            if (received <= 3) {
                currentState   = received;
                lastValidState = received;

                Serial.print("STATE ACCEPTED: ");
                Serial.println(currentState);
            }
        }
    }

    // ── State Change ────────────────────────────
    if (currentState != previousState) {
        previousState = currentState;
        alertSent = false;

        Serial.print("DISPLAY STATE: ");
        Serial.println(currentState);

        updateDisplay();
    }

    // ── Refresh Screen ──────────────────────────
    if (currentState == 0 && millis() - lastDisplayUpdate > 2000) {
        lastDisplayUpdate = millis();
        showNormal();
    }

    // ── WiFi Check ──────────────────────────────
    if (millis() - lastWifiCheck > 30000) {
        lastWifiCheck = millis();
        connectWiFi();
    }

    // ── Telegram Alerts ─────────────────────────
// ── Telegram Alerts ─────────────────────────────
if (!alertSent) {
    if (currentState == 1) {
        String msg = "🔴 STEALTH MODE ACTIVATED\n";
        msg += "Device appears OFF but tracking.\n";
        msg += "Lat: " + latStr + "\n";
        msg += "Lon: " + lonStr + "\n";
        msg += "https://maps.google.com/?q=" + latStr + "," + lonStr;
        if (sendTelegram(msg)) {
            alertSent = true;
        }
    } else if (currentState == 2) {
        String msg = "🆘 SOS EMERGENCY!\n";
        msg += "Immediate help needed!\n";
        msg += "Lat: " + latStr + "\n";
        msg += "Lon: " + lonStr + "\n";
        msg += "https://maps.google.com/?q=" + latStr + "," + lonStr;
        if (sendTelegram(msg)) {
            alertSent = true;
        }
    }
}
    // ── JSON + SEND ─────────────────────────────
    String json = buildJSON();
    Serial.println(json);

    sendToServer(json);
}

// ───── Display ───────────────────────────────────
void updateDisplay() {
    switch (currentState) {
        case 0: showNormal(); break;
        case 1: showFakeOff(); break;
        case 2: showEmergency(); break;
        case 3: showRealOff(); break;
    }
}

void showConnecting() {
    display.clearDisplay();
    display.setCursor(0, 20);
    display.println("Connecting WiFi...");
    display.display();
}

void showNormal() {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Trana-Trace Active");
    display.println(latStr);
    display.println(lonStr);
    display.display();
}

void showFakeOff() {
    display.clearDisplay();
    display.display();
}

void showEmergency() {
    display.clearDisplay();
    display.setCursor(0, 20);
    display.println("!!! SOS !!!");
    display.println(latStr);
    display.println(lonStr);
    display.display();
}

void showRealOff() {
    display.clearDisplay();
    display.setCursor(0, 20);
    display.println("SYSTEM POWERED OFF");
    display.display();
}

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define RXD2 21
#define TXD2 20
HardwareSerial A9G(1);

// ── Real-time data (no hardcoding) ───────────────
String networkName = "Searching...";
String timeStr     = "--:--";
String dateStr     = "-- --- ----";
int    batteryPct  = 0;
String latStr      = "No Fix";
String lonStr      = "No Fix";
bool   gpsFixed    = false;

// ── A9G query timers ─────────────────────────────
unsigned long lastNetworkQuery  = 0;
unsigned long lastTimeQuery     = 0;
unsigned long lastBatteryQuery  = 0;
unsigned long lastGPSQuery      = 0;
unsigned long lastGPSEnable     = 0;

bool gpsEnabled = false;

// ══════════════════════════════════════════════
void sendAT(String cmd) {
    A9G.println(cmd);
    Serial.println("AT >> " + cmd);
    delay(300);
}

String readA9G(int timeout = 2000) {
    String response = "";
    unsigned long start = millis();
    while (millis() - start < timeout) {
        while (A9G.available()) {
            char c = A9G.read();
            response += c;
        }
    }
    response.trim();
    if (response.length() > 0) {
        Serial.println("A9G << " + response);
    }
    return response;
}

// ══════════════════════════════════════════════
void initA9G() {
    Serial.println("Initializing A9G...");

    // Wait for A9G to boot
    delay(3000);

    // Basic check
    sendAT("AT");
    delay(500);

    // Enable verbose error reporting
    sendAT("AT+CMEE=2");

    // Get network operator
    sendAT("AT+COPS?");

    // Get time from network
    sendAT("AT+CCLK?");

    // Get battery level
    sendAT("AT+CBC");

    // Enable GPS power
    sendAT("AT+GPS=1");
    gpsEnabled = true;
    lastGPSEnable = millis();
    Serial.println("GPS powered on");

    // Start GPS session
    delay(1000);
    sendAT("AT+GPSRD=1");
}

// ══════════════════════════════════════════════
void queryNetwork() {
    sendAT("AT+COPS?");
    String r = readA9G();
    // +COPS: 0,0,"Jio 4G",7
    if (r.indexOf("+COPS:") != -1) {
        int q1 = r.indexOf('"');
        int q2 = r.indexOf('"', q1 + 1);
        if (q1 != -1 && q2 != -1) {
            networkName = r.substring(q1 + 1, q2);
            Serial.println("Network: " + networkName);
        }
    }
}

// ══════════════════════════════════════════════
void queryTime() {
    sendAT("AT+CCLK?");
    String r = readA9G();
    // +CCLK: "26/05/08,12:34:56+22"
    if (r.indexOf("+CCLK:") != -1) {
        int q1 = r.indexOf('"');
        int q2 = r.indexOf('"', q1 + 1);
        if (q1 != -1 && q2 != -1) {
            String dt = r.substring(q1 + 1, q2);
            // dt = "26/05/08,12:34:56+22"
            // Extract time HH:MM
            int comma = dt.indexOf(',');
            if (comma != -1) {
                timeStr = dt.substring(comma + 1, comma + 6);

                // Extract date YY/MM/DD → DD Mon YYYY
                String datePart = dt.substring(0, comma);
                // datePart = "26/05/08"
                String yy = "20" + datePart.substring(0, 2);
                String mm = datePart.substring(3, 5);
                String dd = datePart.substring(6, 8);

                String months[] = {"Jan","Feb","Mar","Apr","May","Jun",
                                   "Jul","Aug","Sep","Oct","Nov","Dec"};
                int mIdx = mm.toInt() - 1;
                if (mIdx >= 0 && mIdx < 12)
                    dateStr = dd + " " + months[mIdx] + " " + yy;

                Serial.println("Time: " + timeStr + "  Date: " + dateStr);
            }
        }
    }
}

// ══════════════════════════════════════════════
void queryBattery() {
    sendAT("AT+CBC");
    String r = readA9G();
    // +CBC: 0,85,4150
    if (r.indexOf("+CBC:") != -1) {
        int first  = r.indexOf(',');
        int second = r.indexOf(',', first + 1);
        if (first != -1 && second != -1) {
            batteryPct = r.substring(first + 1, second).toInt();
            Serial.println("Battery: " + String(batteryPct) + "%");
        }
    }
}

// ══════════════════════════════════════════════
void queryGPS() {
    sendAT("AT+LOCATION=2");
    String r = readA9G(3000);
    // Response: +LOCATION: 16.974928,81.784533
    if (r.indexOf("+LOCATION:") != -1) {
        int colon = r.indexOf(':');
        int comma = r.indexOf(',', colon);
        if (colon != -1 && comma != -1) {
            latStr   = r.substring(colon + 2, comma);
            lonStr   = r.substring(comma + 1);
            lonStr.trim();
            gpsFixed = true;
            Serial.println("GPS: " + latStr + ", " + lonStr);
        }
    } else {
        Serial.println("GPS: No fix yet");
        gpsFixed = false;
    }
}

// ══════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(2000);

    A9G.begin(115200, SERIAL_8N1, RXD2, TXD2);

    Wire.begin(6, 7);
    delay(500);

    Serial.println("Starting OLED...");
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("OLED FAILED!");
        while (true);
    }
    Serial.println("OLED Started!");

    display.ssd1306_command(SSD1306_DISPLAYON);
    display.dim(false);
    display.clearDisplay();
    display.display();
    delay(500);

    // Init A9G and get initial data
    initA9G();
    queryNetwork();
    queryTime();
    queryBattery();

    showNormalScreen();
    printMenu();
}

// ══════════════════════════════════════════════
void loop() {
    // ── Serial input handler ──────────────────
    if (Serial.available()) {
        char input = Serial.read();
        while (Serial.available()) Serial.read();

        Serial.print("You pressed: ");
        Serial.println(input);

        switch (input) {
            case '0':
                Serial.println("FAKE SWITCH OFF");
                showFakePowerOff();
                break;
            case '1':
                Serial.println("REAL SWITCH OFF");
                showRealPowerOff();
                break;
            case '2':
                Serial.println("DEACTIVATE");
                showDeactivate();
                break;
            case '3':
                Serial.println("BATTERY LOW");
                showBatteryLow();
                break;
            case 'h':
            case 'H':
                Serial.println("HOME SCREEN");
                showNormalScreen();
                break;
            default:
                Serial.println("Wrong! Use 0,1,2,3 or H");
                printMenu();
                break;
        }
    }

    // ── Periodic A9G data refresh ─────────────
    unsigned long now = millis();

    // Network every 30 seconds
    if (now - lastNetworkQuery > 30000) {
        lastNetworkQuery = now;
        queryNetwork();
    }

    // Time every 60 seconds
    if (now - lastTimeQuery > 60000) {
        lastTimeQuery = now;
        queryTime();
        showNormalScreen(); // refresh display with new time
    }

    // Battery every 30 seconds
    if (now - lastBatteryQuery > 30000) {
        lastBatteryQuery = now;
        queryBattery();
    }

    // GPS every 5 seconds
    if (now - lastGPSQuery > 5000) {
        lastGPSQuery = now;
        queryGPS();
    }

    // Read any unsolicited A9G responses
    updateDataFromA9G();
}

// ══════════════════════════════════════════════
void printMenu() {
    Serial.println("================================");
    Serial.println("  ENTER NUMBER TO CONTROL:");
    Serial.println("  0 = Fake Switch Off");
    Serial.println("  1 = Real Switch Off");
    Serial.println("  2 = Deactivate");
    Serial.println("  3 = Battery Low Warning");
    Serial.println("  H = Home Screen");
    Serial.println("================================");
}

// ══════════════════════════════════════════════
void showNormalScreen() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Network top left
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print(networkName);

    // Battery top right
    display.setCursor(95, 0);
    display.print(batteryPct);
    display.print("%");
    drawBatteryIcon(118, 0, batteryPct);

    // Time center big
    display.setTextSize(3);
    int timeX = (128 - (timeStr.length() * 18)) / 2;
    display.setCursor(timeX, 18);
    display.print(timeStr);

    // Date bottom center
    display.setTextSize(1);
    int dateX = (128 - (dateStr.length() * 6)) / 2;
    display.setCursor(dateX, 52);
    display.print(dateStr);

    display.display();
    Serial.println("Home Screen shown!");
}

// ══════════════════════════════════════════════
void showFakePowerOff() {
    display.clearDisplay();
    display.display();
    Serial.println("Fake Off - Screen Blank");
    Serial.println("ESP32 still running!");
    Serial.println("Type H to bring back");
}

// ══════════════════════════════════════════════
void showRealPowerOff() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(25, 20);
    display.print("Switching Off...");
    display.display();
    delay(1500);
    display.clearDisplay();
    display.display();
    Serial.println("Deep Sleep...");
    delay(500);
    esp_deep_sleep_start();
}

// ══════════════════════════════════════════════
void showDeactivate() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(20, 20);
    display.print("Deactivating...");
    display.display();
    delay(1000);
    display.clearDisplay();
    display.display();
    sendAT("AT+CPOF");
    Serial.println("Deactivated!");
    Serial.println("Type H to reactivate");
}

// ══════════════════════════════════════════════
void showBatteryLow() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Battery outline
    display.drawRect(10, 15, 50, 25, SSD1306_WHITE);
    display.fillRect(60, 22, 5, 11, SSD1306_WHITE);
    display.fillRect(12, 17, 6, 21, SSD1306_WHITE);

    // Warning !
    display.setTextSize(3);
    display.setCursor(80, 10);
    display.print("!");

    // Real battery percentage
    display.setTextSize(1);
    display.setCursor(10, 45);
    display.print("Battery: ");
    display.print(batteryPct);
    display.print("% - LOW!");
    display.setCursor(5, 56);
    display.print("Please charge device");

    display.display();
    Serial.println("Battery Low shown!");
}

// ══════════════════════════════════════════════
void drawBatteryIcon(int x, int y, int pct) {
    display.drawRect(x - 14, y, 13, 7, SSD1306_WHITE);
    display.fillRect(x - 1, y + 2, 2, 3, SSD1306_WHITE);
    int fill = map(pct, 0, 100, 0, 10);
    display.fillRect(x - 13, y + 1, fill, 5, SSD1306_WHITE);
}

// ══════════════════════════════════════════════
void updateDataFromA9G() {
    if (A9G.available()) {
        String response = A9G.readStringUntil('\n');
        response.trim();

        if (response.length() == 0) return;

        Serial.println("A9G unsolicited: " + response);

        // Network update
        if (response.startsWith("+COPS:")) {
            int q1 = response.indexOf('"');
            int q2 = response.indexOf('"', q1 + 1);
            if (q1 != -1 && q2 != -1)
                networkName = response.substring(q1 + 1, q2);
        }

        // Time update
        if (response.startsWith("+CCLK:")) {
            int q1 = response.indexOf('"');
            int q2 = response.indexOf('"', q1 + 1);
            if (q1 != -1 && q2 != -1) {
                String dt     = response.substring(q1 + 1, q2);
                int    comma  = dt.indexOf(',');
                if (comma != -1)
                    timeStr = dt.substring(comma + 1, comma + 6);
            }
        }

        // Battery update
        if (response.startsWith("+CBC:")) {
            int first  = response.indexOf(',');
            int second = response.indexOf(',', first + 1);
            if (first != -1 && second != -1)
                batteryPct = response.substring(first + 1, second).toInt();
        }

        // GPS location update
        if (response.startsWith("+LOCATION:")) {
            int colon = response.indexOf(':');
            int comma = response.indexOf(',', colon);
            if (colon != -1 && comma != -1) {
                latStr   = response.substring(colon + 2, comma);
                lonStr   = response.substring(comma + 1);
                lonStr.trim();
                gpsFixed = true;
            }
        }
    }
}
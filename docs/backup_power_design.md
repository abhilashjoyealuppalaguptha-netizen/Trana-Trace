# Backup Power Module Hardware Design

## Purpose

The backup power module keeps TRANA-TRACE alive after a thief attempts a normal shutdown or removes the visible supply path. In FAKE_OFF mode, only user-visible indicators are disabled; the FPGA, GPS, and wireless alert path remain powered.

## Power Architecture

```text
3.7 V LiPo 2000 mAh
  |
  +-- TP4056 charger/protection board
  |
  +-- 3.3 V LDO rail -> Tang Nano 9K FPGA
  |
  +-- 3.3 V LDO rail -> ESP8266/NodeMCU + OLED
  |
  +-- Optional boost/GSM rail -> future A9G or LTE/eSIM module
```

## Stealth Switching

The FPGA state machine controls the visible load rail.

```text
FPGA fake_pwr_en GPIO -> 1 kOhm base resistor -> 2N2222A transistor
2N2222A switched rail -> OLED + visible LEDs
Always-on rail -> FPGA + ESP8266 + GPS
```

When the FSM enters FAKE_OFF, `fake_pwr_en` disables the OLED and LED rail. The device appears off, while the always-on rail continues GPS acquisition, UART state transfer, Telegram alerts, and backend uploads.

## Battery Monitoring

Battery voltage is measured by the ESP8266 ADC through a calibrated resistor divider. The firmware maps the ADC reading to a 0-100 percent battery value and sends it in every `/api/device/update` payload.

Recommended divider and thresholds:

| Item | Value |
| --- | --- |
| Divider | 100 kOhm / 100 kOhm |
| Full ADC calibration | `BATTERY_ADC_FULL` in `config.h` |
| Empty ADC calibration | `BATTERY_ADC_EMPTY` in `config.h` |
| Low battery action | Backend dashboard warning; FPGA `batt_low` can trigger EMERGENCY |

## Bill of Materials

| Component | Example part | Purpose |
| --- | --- | --- |
| Battery | 3.7 V 2000 mAh LiPo | Backup energy source |
| Charger/protection | TP4056 + DW01A | Charging and over-discharge protection |
| LDO | MCP1700-3302E or AMS1117-3.3 | 3.3 V regulated rails |
| Switch transistor | 2N2222A or AO3400 MOSFET | Visible rail cutoff |
| Bulk capacitors | 100 uF, 10 V | Wireless transmit current buffering |
| Decoupling capacitors | 100 nF ceramic | Local high-frequency filtering |

## Integration Notes

The current prototype documents the backup module as a discrete add-on so it can be reviewed independently of the FPGA and NodeMCU firmware. The final PCB should place the charger, always-on rail, switched-visible rail, ADC divider, and programming headers on a single board.

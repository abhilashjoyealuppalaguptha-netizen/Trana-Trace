\# Backup Power Module — Hardware Design



\## Purpose

Ensures TRANA TRACE keeps transmitting GPS alerts even when the thief attempts to power off the device or the battery runs critically low.



\## Power Architecture

\[3.7V LiPo 2000mAh]

│

├──► TP4056 (charging + protection)

│

├──► XL6009 Boost → 4.2V → A9G GSM/GPS (always powered)

│

├──► MCP1700 LDO #1 → 3.3V → Tang Nano 9K FPGA

│

└──► MCP1700 LDO #2 → 3.3V → ESP32-C3 + OLED

\## Stealth Switch (FAKE\_OFF mechanism)



When FSM enters FAKE\_OFF, FPGA pulls fake\_pwr\_en LOW.

A 2N2222 transistor cuts power to OLED and LEDs only.

A9G, ESP32, and FPGA continue running — device looks OFF from outside.



Battery(+) ──► 2N2222 Collector ──► OLED + LED rail

FPGA GPIO  ──► 2N2222 Base (1kΩ)

GND        ──► 2N2222 Emitter
## Battery Monitoring (ADC)

Voltage divider on ESP32-C3 GPIO3:

\- 100kΩ / 100kΩ divider scales 4.2V → 2.1V for ADC

\- Low battery threshold: V\_adc < 1.6V (\~10% charge)

\- ESP32 signals FPGA via UART → triggers EMERGENCY state



\## Components



| Component     | Model           | Purpose                        |

|---------------|-----------------|--------------------------------|

| Battery       | 3.7V 2000mAh    | Main power source              |

| Charger       | TP4056 + DW01A  | Charging + over-discharge cut  |

| Boost         | XL6009          | 3.7V → 4.2V for A9G           |

| LDO (x2)      | MCP1700-3302E   | 3.3V regulated rails           |

| Switch        | 2N2222A NPN     | Stealth power cut              |

| Bulk Cap (x5) | 100µF 10V       | GSM TX spike absorption        |

| Decoupling    | 100nF ceramic   | HF noise bypass                |



\## Total BOM Cost: \~₹560

EOF


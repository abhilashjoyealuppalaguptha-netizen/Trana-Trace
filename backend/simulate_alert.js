require('dotenv').config();

async function simulateAlert() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001/update';
    const apiKey = process.env.DEVICE_API_KEY || '';

    console.log("🚀 Simulating FPGA Alert (fpga_alert: 1)...");
    console.log(`   Target: ${serverUrl}`);

    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                wifi: true,
                fpga_alert: 1,
                telegram_sent: false,
                location: { lat: 17.087741, lng: 82.068706 }
            })
        });
        const data = await response.json();
        console.log("✅ Server Response:", data);
    } catch (error) {
        console.error("❌ Failed to send alert:", error.message);
    }
}

simulateAlert();

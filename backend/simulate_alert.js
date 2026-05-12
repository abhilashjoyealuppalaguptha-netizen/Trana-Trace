async function simulateAlert() {
    console.log("🚀 Simulating FPGA Alert (fpga_alert: 1)...");
    try {
        const response = await fetch('http://10.171.252.58:3001/update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': 'trana-secret-tt01' 
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

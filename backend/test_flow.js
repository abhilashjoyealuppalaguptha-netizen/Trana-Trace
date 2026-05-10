const { createClient } = require('redis');

const DEVICE_ID = "TT-01";
const BACKEND_URL = 'http://localhost:3001/update';

async function testFlow() {
    const redisClient = createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
    
    try {
        console.log('--- TEST 1: SEND THREAT (FPGA=1) ---');
        await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wifi: true, fpga_alert: 1, location: { lat: 10, lng: 20 } })
        });
        
        let data = await redisClient.hGetAll(`device:${DEVICE_ID}`);
        console.log(`Redis Status: ${data.status}, FPGA Alert: ${data.fpga_alert}`);
        if (data.status !== 'DANGER') throw new Error('Failed to set DANGER state');

        console.log('\n--- TEST 2: SEND CLEAR (FPGA=0) ---');
        await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wifi: true, fpga_alert: 0, location: { lat: 10, lng: 20 } })
        });
        
        data = await redisClient.hGetAll(`device:${DEVICE_ID}`);
        console.log(`Redis Status: ${data.status}, FPGA Alert: ${data.fpga_alert}`);
        if (data.status !== 'ACTIVE') throw new Error('Failed to reset to ACTIVE state');

        console.log('\n✅ DATABASE FLOW IS WORKING PERFECTLY');
        
    } catch (err) {
        console.error('\n❌ FLOW ERROR:', err.message);
    } finally {
        await redisClient.quit();
    }
}

testFlow();

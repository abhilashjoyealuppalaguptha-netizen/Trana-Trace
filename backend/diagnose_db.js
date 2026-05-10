const { createClient } = require('redis');

const DEVICE_ID = "TT-01";

async function diagnose() {
    const redisClient = createClient({
        url: 'redis://localhost:6379'
    });
    
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis');
        
        const data = await redisClient.hGetAll(`device:${DEVICE_ID}`);
        console.log('\n--- CURRENT DATABASE STATE ---');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.fpga_alert === '1' || data.status === 'DANGER') {
            console.log('\n⚠️  STALE THREAT DETECTED. Resetting now...');
            await redisClient.hSet(`device:${DEVICE_ID}`, {
                fpga_alert: "0",
                status: "ACTIVE",
                last_updated: new Date().toISOString()
            });
            console.log('✅ State Reset to ACTIVE');
        } else {
            console.log('\n✅ State is already ACTIVE in database.');
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await redisClient.quit();
    }
}

diagnose();

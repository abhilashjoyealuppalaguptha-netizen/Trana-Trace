const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Redis setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

// Global settings
const DEVICE_ID = "TT-01";
const API_KEY = process.env.DEVICE_API_KEY || "trana-secret-tt01";
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    console.log(`[AUTH] Rejected request — invalid API key`);
    return res.status(401).json({ error: "Unauthorized — invalid or missing X-Api-Key header" });
  }
  next();
}
let clients = new Set();

// Helper to determine status based on hardware logic
function calculateStatus(data) {
  const wifi = String(data.wifi).toLowerCase();
  if (wifi === 'false') return "OFFLINE";
  
  const alert = parseInt(data.fpga_alert, 10);
  if (alert === 1) return "DANGER";
  
  return "ACTIVE";
}

// Broadcast helper
function broadcastUpdate(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// REST Endpoints
app.get('/device', async (req, res) => {
  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    if (deviceData.location) deviceData.location = JSON.parse(deviceData.location);
    
    // Normalize for JSON response
    const normalized = {
      ...deviceData,
      battery: parseInt(deviceData.battery || 100, 10),
      fpga_alert: parseInt(deviceData.fpga_alert || 0, 10),
      wifi: deviceData.wifi === 'true',
      telegram_sent: deviceData.telegram_sent === 'true'
    };
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: "Redis fetch failure" });
  }
});

// Unified Update Logic (Used by both endpoints)
async function handleHardwareUpdate(req, res) {
  try {
    const { wifi, fpga_alert, telegram_sent, location, battery, gps_source } = req.body;
    const timestamp = new Date().toISOString();
    
    console.log(`\n[${new Date().toLocaleTimeString()}] 📥 HARDWARE UPDATE RECEIVED`);
    console.log(` -> Path: ${req.path}`);
    console.log(` -> Data: WiFi=${wifi}, FPGA=${fpga_alert}, Tel=${telegram_sent}, Bat=${battery}, GPS=${gps_source}`);
    console.log(` -> Loc: ${JSON.stringify(location)}`);

    const status = calculateStatus({ wifi, fpga_alert });
    
    const deviceUpdate = {
      wifi: String(wifi),
      fpga_alert: String(fpga_alert),
      telegram_sent: String(telegram_sent),
      location: JSON.stringify(location),
      status: status,
      battery: String(battery != null ? battery : 100),
      gps_source: String(gps_source || 'UNKNOWN'),
      last_updated: timestamp
    };

    await redisClient.hSet(`device:${DEVICE_ID}`, deviceUpdate);

    const broadcastData = {
      ...deviceUpdate,
      id: DEVICE_ID,
      location: location,
      battery: parseInt(battery != null ? battery : 100, 10),
      wifi: wifi === true || wifi === 'true',
      fpga_alert: parseInt(fpga_alert, 10),
      telegram_sent: telegram_sent === true || telegram_sent === 'true'
    };

    broadcastUpdate({ type: 'LOCATION_UPDATE', payload: broadcastData });

    if (parseInt(fpga_alert, 10) === 1) {
      const logEntry = `[${new Date().toLocaleTimeString()}] FPGA THREAT DETECTED`;
      await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
      broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
      console.log(" 🚨 THREAT BROADCAST SENT");
    }

    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error(" ❌ Update Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Hardware endpoint — no API key required (firmware cannot send custom headers easily)
app.post('/update', handleHardwareUpdate);
// Software/internal endpoint — API key required for security
app.post('/api/device/update', requireApiKey, handleHardwareUpdate);

app.post('/api/sos',requireApiKey, async (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] 🆘 MANUAL SOS TRIGGERED`);
  try {
    await redisClient.hSet(`device:${DEVICE_ID}`, { status: "DANGER", fpga_alert: "1" });
    const logEntry = `[${new Date().toLocaleTimeString()}] MANUAL SOS TRIGGERED`;
    await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
    
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    broadcastUpdate({ type: 'STATUS_CHANGE', payload: { ...deviceData, id: DEVICE_ID } });
    broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reset-system', requireApiKey, async (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] 🧹 SYSTEM RESET REQUESTED`);
    try {
        const resetData = {
            id: DEVICE_ID,
            status: "ACTIVE",
            battery: "100",
            wifi: "true",
            fpga_alert: "0",
            telegram_sent: "false",
            location: JSON.stringify({ lat: 17.087741, lng: 82.068706 }),
            last_updated: new Date().toISOString()
        };
        await redisClient.hSet(`device:${DEVICE_ID}`, resetData);
        
        const broadcastData = {
            ...resetData,
            location: { lat: 17.087741, lng: 82.068706 },
            battery: 100,
            wifi: true,
            fpga_alert: 0,
            telegram_sent: false
        };
        
        broadcastUpdate({ type: 'STATUS_CHANGE', payload: broadcastData });
        broadcastUpdate({ type: 'NEW_LOG', payload: "SYSTEM STATE MANUALLY RESET TO SECURE" });
        
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// WebSocket Connection
wss.on('connection', async (ws) => {
  clients.add(ws);
  console.log(`[WS] Client Connected. Total: ${clients.size}`);
  
  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    const normalized = {
      ...deviceData,
      id: DEVICE_ID,
      location: deviceData.location ? JSON.parse(deviceData.location) : { lat: 17.087741, lng: 82.068706 },
      battery: parseInt(deviceData.battery || 100, 10),
      fpga_alert: parseInt(deviceData.fpga_alert || 0, 10),
      wifi: deviceData.wifi === 'true'
    };
    ws.send(JSON.stringify({ type: 'INITIAL_STATE', payload: normalized }));
  } catch (e) {
    console.error("[WS] Sync Error:", e);
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client Disconnected. Total: ${clients.size}`);
  });
});

async function initRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis Database');
    const exists = await redisClient.exists(`device:${DEVICE_ID}`);
    if (!exists) {
      await redisClient.hSet(`device:${DEVICE_ID}`, {
        id: DEVICE_ID,
        status: "ACTIVE",
        battery: "100",
        wifi: "true",
        fpga_alert: "0",
        telegram_sent: "false",
        location: JSON.stringify({ lat: 17.087741, lng: 82.068706 })
      });
    }
  } catch (e) {
    console.error("❌ Redis Init Error:", e);
  }
}

initRedis();

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TRANA-TRACE BACKEND ONLINE`);
  console.log(`📡 Listening at http://0.0.0.0:${PORT}`);
  console.log(`🔗 API endpoints: /update, /api/device/update`);
});
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

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Global settings
const DEVICE_ID = "TT-01";
let clients = new Set();

// Initial state if not in Redis
const defaultDeviceState = {
  id: DEVICE_ID,
  status: "OFFLINE",
  battery: 100,
  wifi: "false",
  fpga_alert: "0",
  telegram_sent: "false",
  location: JSON.stringify({ lat: 17.087741, lng: 82.068706 }) // Aditya University
};

// Helper to determine status based on hardware logic
function calculateStatus(data) {
  if (!data.wifi) return "OFFLINE";
  if (data.fpga_alert === 1) return "DANGER";
  return "ACTIVE";
}

// REST Endpoints
app.get('/device', async (req, res) => {
  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    if (deviceData.location) {
      deviceData.location = JSON.parse(deviceData.location);
    }
    // Type casting
    if (deviceData.battery) deviceData.battery = parseInt(deviceData.battery, 10);
    if (deviceData.fpga_alert) deviceData.fpga_alert = parseInt(deviceData.fpga_alert, 10);
    deviceData.wifi = deviceData.wifi === 'true';
    deviceData.telegram_sent = deviceData.telegram_sent === 'true';

    res.json(deviceData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch from Redis" });
  }
});

// Hardware Update Endpoint (NodeMCU calls this)
app.post('/api/device/update', async (req, res) => {
  try {
    const { wifi, fpga_alert, telegram_sent, location } = req.body;

    const status = calculateStatus({ wifi, fpga_alert });
    const last_updated = new Date().toISOString();

    const deviceUpdate = {
      wifi: String(wifi),
      fpga_alert: String(fpga_alert),
      telegram_sent: String(telegram_sent),
      location: JSON.stringify(location),
      status: status,
      battery: "100", // Fixed as per hardware spec
      last_updated: last_updated
    };

    await redisClient.hSet(`device:${DEVICE_ID}`, deviceUpdate);

    // Broadcast to UI
    const broadcastData = {
      ...deviceUpdate,
      id: DEVICE_ID,
      location: location,
      battery: 100,
      wifi: wifi,
      fpga_alert: fpga_alert,
      telegram_sent: telegram_sent
    };

    broadcastUpdate({ type: 'LOCATION_UPDATE', payload: broadcastData });

    if (fpga_alert === 1) {
      const logEntry = `[${new Date().toLocaleTimeString()}] FPGA THREAT DETECTED`;
      await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
      broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
    }

    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("Hardware update error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/sos', async (req, res) => {
  // Keeping SOS for manual UI testing if needed, but hardware is primary
  try {
    await redisClient.hSet(`device:${DEVICE_ID}`, { status: "DANGER" });
    const logEntry = `[${new Date().toLocaleTimeString()}] MANUAL SOS TRIGGERED`;
    await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    broadcastUpdate({ type: 'STATUS_CHANGE', payload: deviceData });
    broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Broadcast helper
function broadcastUpdate(message) {
  const data = JSON.stringify(message);
  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// WebSocket Connection
wss.on('connection', async (ws) => {
  clients.add(ws);
  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    if (deviceData.location) deviceData.location = JSON.parse(deviceData.location);
    
    // Type casting for UI
    if (deviceData.battery) deviceData.battery = parseInt(deviceData.battery, 10);
    if (deviceData.fpga_alert) deviceData.fpga_alert = parseInt(deviceData.fpga_alert, 10);
    deviceData.wifi = deviceData.wifi === 'true';
    deviceData.telegram_sent = deviceData.telegram_sent === 'true';

    ws.send(JSON.stringify({ type: 'INITIAL_STATE', payload: deviceData }));
  } catch (e) {
    console.error("WS Initial state error:", e);
  }

  ws.on('close', () => {
    clients.delete(ws);
  });
});

async function initRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
    const exists = await redisClient.exists(`device:${DEVICE_ID}`);
    if (!exists) {
      await redisClient.hSet(`device:${DEVICE_ID}`, defaultDeviceState);
    }
  } catch (e) {
    console.error("Redis init error:", e);
  }
}

initRedis();

// Consolidated Hardware Update Endpoint (Matches user's NodeMCU config)
app.post('/update', async (req, res) => {
  try {
    // Normalize incoming data (Handle both boolean/number and string formats)
    const rawWifi = req.body.wifi;
    const rawFpga = req.body.fpga_alert;
    const rawTelegram = req.body.telegram_sent;
    const location = req.body.location;

    const wifi = rawWifi === true || rawWifi === "true";
    const fpga_alert = parseInt(rawFpga, 10);
    const telegram_sent = rawTelegram === true || rawTelegram === "true";
    
    console.log(`📡 DATA: WiFi=${wifi}, FPGA=${fpga_alert}, Tel=${telegram_sent}, Loc=${JSON.stringify(location)}`);

    const status = calculateStatus({ wifi, fpga_alert });
    const last_updated = new Date().toISOString();
    
    const deviceUpdate = {
      wifi: String(wifi),
      fpga_alert: String(fpga_alert),
      telegram_sent: String(telegram_sent),
      location: JSON.stringify(location),
      status: status,
      battery: "100", 
      last_updated: last_updated
    };

    await redisClient.hSet(`device:${DEVICE_ID}`, deviceUpdate);

    // Broadcast to UI
    const broadcastData = {
      ...deviceUpdate,
      id: DEVICE_ID,
      location: location,
      battery: 100,
      wifi: wifi,
      fpga_alert: fpga_alert,
      telegram_sent: telegram_sent
    };

    broadcastUpdate({ type: 'LOCATION_UPDATE', payload: broadcastData });
    
    if (fpga_alert === 1) {
      const logEntry = `[${new Date().toLocaleTimeString()}] FPGA THREAT DETECTED`;
      await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
      broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
    }

    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("Hardware update error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
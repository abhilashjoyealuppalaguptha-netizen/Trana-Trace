const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('redis');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

const DEVICE_ID = "TT-01";
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || "trana-trace-dev-key";
const AUTH_USERNAMES = (process.env.AUTH_USERNAMES || "")
  .split(',')
  .map((username) => username.trim().toLowerCase())
  .filter(Boolean);
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || DEVICE_API_KEY;
const DEFAULT_LOCATION = { lat: 17.087741, lng: 82.068706 };
let clients = new Set();

function requireApiKey(req, res, next) {
  const providedKey = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (providedKey !== DEVICE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized device request" });
  }
  next();
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(body).digest('base64url');
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireDashboardAuth(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized dashboard request" });
  }
  next();
}

function requireAnyAuth(req, res, next) {
  const apiKey = req.get('x-api-key');
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (apiKey === DEVICE_API_KEY || verifyToken(token)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized request" });
}

function normalizeBattery(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 100;
  return Math.min(100, Math.max(0, parsed));
}

function calculateStatus(data) {
  const wifi = String(data.wifi).toLowerCase();
  if (wifi === 'false') return "OFFLINE";

  const alert = parseInt(data.fpga_alert, 10);
  if (alert === 1) return "DANGER";

  return "ACTIVE";
}

function broadcastUpdate(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

app.post('/api/auth/login', (req, res) => {
  const { username = "", password = "" } = req.body;
  const configured = AUTH_USERNAMES.length > 0 && AUTH_PASSWORD.length > 0;
  const usernameAllowed = AUTH_USERNAMES.includes(String(username).trim().toLowerCase());

  if (!configured) {
    return res.status(503).json({ error: "Authentication is not configured" });
  }

  if (!usernameAllowed || password !== AUTH_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({
    sub: String(username).trim().toLowerCase(),
    exp: Date.now() + (12 * 60 * 60 * 1000)
  });

  res.json({ token, expires_in: 43200 });
});

app.get('/device', async (req, res) => {
  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    if (deviceData.location) deviceData.location = JSON.parse(deviceData.location);

    res.json({
      ...deviceData,
      battery: parseInt(deviceData.battery || 100, 10),
      fpga_alert: parseInt(deviceData.fpga_alert || 0, 10),
      wifi: deviceData.wifi === 'true',
      telegram_sent: deviceData.telegram_sent === 'true'
    });
  } catch (error) {
    res.status(500).json({ error: "Redis fetch failure" });
  }
});

async function handleHardwareUpdate(req, res) {
  try {
    const { wifi, fpga_alert, telegram_sent, location, battery, gps_source } = req.body;
    const timestamp = new Date().toISOString();
    const batteryPercent = normalizeBattery(battery);
    const safeLocation = location || DEFAULT_LOCATION;
    const status = calculateStatus({ wifi, fpga_alert });

    const deviceUpdate = {
      wifi: String(wifi),
      fpga_alert: String(fpga_alert),
      telegram_sent: String(telegram_sent),
      location: JSON.stringify(safeLocation),
      status,
      battery: String(batteryPercent),
      gps_source: String(gps_source || 'UNKNOWN'),
      last_updated: timestamp
    };

    await redisClient.hSet(`device:${DEVICE_ID}`, deviceUpdate);

    const broadcastData = {
      ...deviceUpdate,
      id: DEVICE_ID,
      location: safeLocation,
      battery: batteryPercent,
      wifi: wifi === true || wifi === 'true',
      fpga_alert: parseInt(fpga_alert, 10),
      telegram_sent: telegram_sent === true || telegram_sent === 'true'
    };

    broadcastUpdate({ type: 'LOCATION_UPDATE', payload: broadcastData });

    if (parseInt(fpga_alert, 10) === 1) {
      const logEntry = `[${new Date().toLocaleTimeString()}] FPGA THREAT DETECTED`;
      await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);
      broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });
    }

    res.status(200).json({ success: true, status, battery: batteryPercent });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

app.post('/api/device/update', requireApiKey, handleHardwareUpdate);

app.post('/api/sos', requireDashboardAuth, async (req, res) => {
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

app.post('/api/ai/alert', requireApiKey, async (req, res) => {
  const timestamp = new Date().toISOString();
  const { event = "unknown_face", confidence = null, image_url = null, location = DEFAULT_LOCATION } = req.body;

  try {
    const deviceUpdate = {
      status: "DANGER",
      fpga_alert: "1",
      ai_event: String(event),
      ai_confidence: confidence === null ? "" : String(confidence),
      intruder_image_url: image_url || "",
      location: JSON.stringify(location),
      last_updated: timestamp
    };

    await redisClient.hSet(`device:${DEVICE_ID}`, deviceUpdate);

    const logEntry = `[${new Date().toLocaleTimeString()}] AI ALERT: ${event}`;
    await redisClient.lPush(`logs:${DEVICE_ID}`, logEntry);

    broadcastUpdate({
      type: 'AI_ALERT',
      payload: {
        ...deviceUpdate,
        id: DEVICE_ID,
        location,
        fpga_alert: 1,
        confidence,
        image_url
      }
    });
    broadcastUpdate({ type: 'NEW_LOG', payload: logEntry });

    res.status(200).json({ success: true, status: "DANGER" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reset-system', requireAnyAuth, async (req, res) => {
  try {
    const resetData = {
      id: DEVICE_ID,
      status: "ACTIVE",
      battery: "100",
      wifi: "true",
      fpga_alert: "0",
      telegram_sent: "false",
      location: JSON.stringify(DEFAULT_LOCATION),
      last_updated: new Date().toISOString()
    };
    await redisClient.hSet(`device:${DEVICE_ID}`, resetData);

    broadcastUpdate({
      type: 'STATUS_CHANGE',
      payload: {
        ...resetData,
        location: DEFAULT_LOCATION,
        battery: 100,
        wifi: true,
        fpga_alert: 0,
        telegram_sent: false
      }
    });
    broadcastUpdate({ type: 'NEW_LOG', payload: "SYSTEM STATE MANUALLY RESET TO SECURE" });

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

wss.on('connection', async (ws) => {
  clients.add(ws);

  try {
    const deviceData = await redisClient.hGetAll(`device:${DEVICE_ID}`);
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      payload: {
        ...deviceData,
        id: DEVICE_ID,
        location: deviceData.location ? JSON.parse(deviceData.location) : DEFAULT_LOCATION,
        battery: parseInt(deviceData.battery || 100, 10),
        fpga_alert: parseInt(deviceData.fpga_alert || 0, 10),
        wifi: deviceData.wifi === 'true'
      }
    }));
  } catch (e) {
    console.error("[WS] Sync Error:", e);
  }

  ws.on('close', () => {
    clients.delete(ws);
  });
});

async function initRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis Database');
    const exists = await redisClient.exists(`device:${DEVICE_ID}`);
    if (!exists) {
      await redisClient.hSet(`device:${DEVICE_ID}`, {
        id: DEVICE_ID,
        status: "ACTIVE",
        battery: "100",
        wifi: "true",
        fpga_alert: "0",
        telegram_sent: "false",
        gps_source: "UNKNOWN",
        location: JSON.stringify(DEFAULT_LOCATION)
      });
    }
  } catch (e) {
    console.error("Redis Init Error:", e);
  }
}

initRedis();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TRANA-TRACE backend listening at http://0.0.0.0:${PORT}`);
  console.log(`Protected endpoints: /api/device/update, /api/sos, /api/ai/alert`);
});

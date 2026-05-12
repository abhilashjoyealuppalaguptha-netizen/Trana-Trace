import { useState, useEffect, useRef, useCallback } from 'react';

export function useRealtime() {
  const [deviceState, setDeviceState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const ws = useRef(null);
  const retryCount = useRef(0);
  const prevStatus = useRef(null);
  const apiKey = import.meta.env.VITE_API_KEY || '';

  // Audio Context for Tactical Alarm
  const playAlarm = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.error("Audio alarm failed:", e);
    }
  }, []);

  const sendNotification = useCallback((title, body, critical = false) => {
    console.log(`[Notification] Attempting to send: ${title}`);
    
    if (critical) {
      playAlarm();
    }

    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return;
    }
    
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'trana-alert',
        silent: false
      });
    } else {
      console.warn(`[Notification] Permission is ${Notification.permission}`);
    }
  }, [playAlarm]);

  const testNotification = () => {
    if (!("Notification" in window)) {
      alert("Notifications not supported in this browser");
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        sendNotification("📡 SYSTEM TEST", "Notifications and Audio Alarms are active.", true);
      } else {
        alert(`Notification permission: ${permission}. Please enable in browser settings.`);
      }
    });
  };

  // Separate effect for Status Change Notifications
  useEffect(() => {
    if (deviceState?.status === 'DANGER' && prevStatus.current !== 'DANGER') {
      sendNotification("⚠️ CRITICAL THREAT DETECTED", `Device ${deviceState.id} has entered DANGER state.`, true);
    }
    prevStatus.current = deviceState?.status;
  }, [deviceState, sendNotification]);

  useEffect(() => {
    let hostname = window.location.hostname;
    if (hostname === 'localhost') hostname = '127.0.0.1';
    
    const apiBase = `http://${hostname}:3001`;
    const wsBase = `ws://${hostname}:3001`;

    console.log(`[Realtime] Connecting to ${wsBase}`);

    fetch(`${apiBase}/device`)
      .then(res => res.json())
      .then(data => {
        console.log("[Realtime] REST Initial state received");
        setDeviceState(data);
      })
      .catch(err => console.error("[Realtime] REST Fetch error:", err));

    const connectWS = () => {
      console.log("[Realtime] Opening WebSocket...");
      ws.current = new WebSocket(wsBase);
      
      ws.current.onopen = () => {
        console.log("[Realtime] WebSocket Connected");
        setWsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log(`[Realtime] Received ${message.type}`);
        
        if (['INITIAL_STATE', 'STATUS_CHANGE', 'LOCATION_UPDATE'].includes(message.type)) {
           setDeviceState(message.payload);
        } else if (message.type === 'NEW_LOG') {
           setLogs(prev => [message.payload, ...prev].slice(0, 50));
           if (message.payload.includes('THREAT') || message.payload.includes('SOS')) {
             sendNotification("🚨 SECURITY ALERT", message.payload, true);
           }
        }
      };

      ws.current.onerror = (err) => {
        console.error("[Realtime] WebSocket Error:", err);
      };

    ws.current.onclose = (e) => {
      console.warn(`[Realtime] WebSocket Closed: ${e.code} ${e.reason}`);
      setWsConnected(false);
      // Exponential backoff: 3s, 6s, 12s, 24s, max 30s
      const delay = Math.min(3000 * Math.pow(2, retryCount.current), 30000);
      console.log(`[Realtime] Reconnecting in ${delay/1000}s...`);
      retryCount.current += 1;
      setTimeout(connectWS, delay);
      };
    };

    connectWS();
    return () => {
      console.log("[Realtime] Cleaning up WebSocket");
      ws.current?.close();
    };
  }, [sendNotification]);

  return { deviceState, logs, wsConnected, triggerSOS: async () => {
    try {
      let hostname = window.location.hostname;
      if (hostname === 'localhost') hostname = '127.0.0.1';
      await fetch(`http://${hostname}:3001/api/sos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
          'X-Api-Key': apiKey
        }
      });
    } catch (err) {
      console.error("SOS trigger failed", err);
    }
  }, testNotification };
}





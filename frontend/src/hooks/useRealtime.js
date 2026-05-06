import { useState, useEffect, useRef } from 'react';

export function useRealtime() {
  const [deviceState, setDeviceState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const apiBase = `http://${hostname}:3001`;
    const wsBase = `ws://${hostname}:3001`;

    fetch(`${apiBase}/device`)
      .then(res => res.json())
      .then(data => setDeviceState(data))
      .catch(err => console.error("REST Fetch error:", err));

    const connectWS = () => {
      ws.current = new WebSocket(wsBase);
      
      ws.current.onopen = () => setWsConnected(true);

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (['INITIAL_STATE', 'STATUS_CHANGE', 'LOCATION_UPDATE'].includes(message.type)) {
           setDeviceState(message.payload);
        } else if (message.type === 'NEW_LOG') {
           setLogs(prev => [message.payload, ...prev].slice(0, 50));
        }
      };

      ws.current.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();
    return () => ws.current?.close();
  }, []);

  const triggerSOS = async () => {
    try {
      const hostname = window.location.hostname;
      await fetch(`http://${hostname}:3001/api/sos`, { method: 'POST' });
    } catch (err) {
      console.error("SOS trigger failed", err);
    }
  };

  return { deviceState, logs, wsConnected, triggerSOS };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AntigravityCard from './AntigravityCard';
import { Crosshair, Navigation, MapPin, User, Clock, Route, AlertTriangle } from 'lucide-react';

// Device (IoT) marker — red pulsing
const deviceIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#FF0033;border-radius:50%;
    box-shadow:0 0 20px 8px rgba(255,0,51,0.5),0 0 40px 15px rgba(255,0,51,0.2);
    border:3px solid rgba(255,255,255,0.95);position:relative;">
    <div style="position:absolute;inset:-12px;border:2px solid rgba(255,0,51,0.4);
    border-radius:50%;animation:gps-ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
  </div>
  <style>@keyframes gps-ping{0%{transform:scale(1);opacity:.8}75%,100%{transform:scale(2.8);opacity:0}}</style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Guardian marker — blue
const guardianIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#3B82F6;border-radius:50%;
    box-shadow:0 0 20px 8px rgba(59,130,246,0.5),0 0 40px 15px rgba(59,130,246,0.2);
    border:3px solid rgba(255,255,255,0.95);position:relative;">
    <div style="position:absolute;inset:-12px;border:2px solid rgba(59,130,246,0.4);
    border-radius:50%;animation:guardian-ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
  </div>
  <style>@keyframes guardian-ping{0%{transform:scale(1);opacity:.8}75%,100%{transform:scale(2.8);opacity:0}}</style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Fits the map to show both markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 16, { animate: true });
    }
  }, [positions[0]?.[0], positions[0]?.[1], positions[1]?.[0], positions[1]?.[1]]);
  return null;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export default function LiveMap({ deviceState, isDanger }) {
  const [guardianPos, setGuardianPos] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [route, setRoute] = useState(null); // [{lat,lng}, ...]
  const [routeInfo, setRouteInfo] = useState(null); // {distance, duration}
  const [loadingRoute, setLoadingRoute] = useState(false);
  const watchId = useRef(null);

  // Start watching guardian's browser location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Browser does not support geolocation.');
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGuardianPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId.current);
  }, []);

  // Fetch route from OSRM when both positions are available
  const fetchRoute = useCallback(async (from, to) => {
    try {
      setLoadingRoute(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const r = data.routes[0];
        const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRoute(coords);
        setRouteInfo({ distance: r.distance, duration: r.duration });
      }
    } catch (e) {
      console.error('OSRM routing error:', e);
    } finally {
      setLoadingRoute(false);
    }
  }, []);

  const deviceLoc = deviceState?.location;
  const deviceLat = deviceLoc ? parseFloat(deviceLoc.lat) : null;
  const deviceLng = deviceLoc ? parseFloat(deviceLoc.lng) : null;

  useEffect(() => {
    if (guardianPos && deviceLat && deviceLng) {
      fetchRoute(guardianPos, { lat: deviceLat, lng: deviceLng });
    }
  }, [guardianPos?.lat, guardianPos?.lng, deviceLat, deviceLng]);

  if (!deviceState || !deviceLat || isNaN(deviceLat)) {
    return (
      <AntigravityCard className="h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="hex-spinner" />
          <span className="font-orbitron text-[#FF0033]/60 tracking-widest uppercase text-xs">Awaiting GPS Signal...</span>
        </div>
      </AntigravityCard>
    );
  }

  const deviceCenter = [deviceLat, deviceLng];
  const allPositions = guardianPos
    ? [deviceCenter, [guardianPos.lat, guardianPos.lng]]
    : [deviceCenter];

  return (
    <AntigravityCard isDanger={isDanger} delay={0.3} className="flex-1 min-h-[750px] w-full p-2 relative overflow-hidden flex flex-col">

      {/* Top overlay: Device coords + Google Maps link */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-start justify-between pointer-events-none">
        <div className="bg-black/90 backdrop-blur-xl border border-[#FF0033]/30 rounded-xl px-4 py-2.5 flex flex-col gap-1 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-[#FF0033]" />
            <span className="text-[9px] font-orbitron text-[#FF0033] tracking-[0.15em] font-bold">LIVE GPS TRACKING</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          {/* Device coords */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF0033]" />
            <span className="font-mono text-[#FF0033]/90 text-[10px] tracking-wider">
              DEVICE: {deviceLat.toFixed(5)}, {deviceLng.toFixed(5)}
            </span>
          </div>
          {/* Guardian coords */}
          {guardianPos ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-mono text-blue-400/90 text-[10px] tracking-wider">
                YOU: {guardianPos.lat.toFixed(5)}, {guardianPos.lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="font-mono text-gray-500 text-[10px] tracking-wider">
                {geoError ? `GPS ERROR: ${geoError}` : 'ACQUIRING YOUR LOCATION...'}
              </span>
            </div>
          )}
        </div>

        <a
          href={`https://www.google.com/maps?q=${deviceLat},${deviceLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black/90 backdrop-blur-xl border border-[#FF0033]/25 rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-[#FF0033]/60 transition-all group pointer-events-auto"
        >
          <Navigation className="w-3.5 h-3.5 text-[#FF0033] group-hover:text-white transition-colors" />
          <span className="text-[9px] font-orbitron text-gray-400 tracking-[0.1em] group-hover:text-white transition-colors">GOOGLE MAPS ↗</span>
        </a>
      </div>

      {/* Route info bar — shows distance + ETA */}
      {routeInfo && (
        <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
          <div className="bg-black/90 backdrop-blur-xl border border-blue-500/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Route className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-[9px] font-orbitron text-blue-400/70 tracking-widest uppercase">Fastest Route to Device</div>
                <div className="text-xs font-mono text-white font-bold tracking-wider">
                  {formatDistance(routeInfo.distance)}
                  <span className="text-gray-500 mx-2">·</span>
                  {formatDuration(routeInfo.duration)} away
                </div>
              </div>
            </div>
            {isDanger && (
              <div className="flex items-center gap-2 bg-[#FF0033]/20 border border-[#FF0033]/40 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF0033] animate-pulse" />
                <span className="text-[9px] font-orbitron text-[#FF0033] font-bold tracking-widest">DANGER ZONE</span>
              </div>
            )}
          </div>
        </div>
      )}
      {loadingRoute && !routeInfo && guardianPos && (
        <div className="absolute bottom-6 left-6 z-[400] pointer-events-none">
          <div className="bg-black/90 backdrop-blur-xl border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <div className="hex-spinner scale-75" />
            <span className="text-[9px] font-orbitron text-blue-400/70 tracking-widest uppercase">Calculating Route...</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden mt-2 relative z-0 border border-[#FF0033]/10">
        <MapContainer
          center={deviceCenter}
          zoom={14}
          zoomControl={true}
          className="h-full w-full"
          style={{ background: '#1a1a1a' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* IoT Device marker */}
          <Marker position={deviceCenter} icon={deviceIcon}>
            <Popup>
              <div className="text-xs font-mono text-center">
                <strong>📡 IoT Device (TT-01)</strong><br />
                {deviceLat.toFixed(6)}, {deviceLng.toFixed(6)}
              </div>
            </Popup>
          </Marker>

          {/* Guardian marker */}
          {guardianPos && (
            <Marker position={[guardianPos.lat, guardianPos.lng]} icon={guardianIcon}>
              <Popup>
                <div className="text-xs font-mono text-center">
                  <strong>👤 You (Guardian)</strong><br />
                  {guardianPos.lat.toFixed(6)}, {guardianPos.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* OSRM route line */}
          {route && (
            <Polyline
              positions={route}
              color={isDanger ? '#FF0033' : '#3B82F6'}
              weight={4}
              opacity={0.85}
              dashArray={isDanger ? '8, 6' : undefined}
            />
          )}

          <FitBounds positions={allPositions} />
        </MapContainer>
      </div>
    </AntigravityCard>
  );
}

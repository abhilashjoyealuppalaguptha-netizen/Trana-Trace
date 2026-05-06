import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Wifi, WifiOff, ShieldOff, ShieldAlert, ShieldCheck, 
  Clock, MapPin, ChevronRight, Search, BellRing, Zap,
  EyeOff, Radio, Send, SendHorizonal
} from 'lucide-react';

// Derive real-time alerts from the current hardware device state
function buildAlertsFromState(deviceState, logs) {
  const alerts = [];
  if (!deviceState) return alerts;

  const loc = deviceState.location;
  const coords = loc
    ? { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) }
    : { lat: 0, lng: 0 };
  const locStr = coords.lat ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Unknown';

  // 1. FPGA Threat alert
  if (deviceState.fpga_alert === 1 || deviceState.fpga_alert === '1') {
    alerts.push({
      id: 'HW-FPGA-001',
      type: 'threat',
      severity: 'critical',
      title: 'FPGA THREAT DETECTED',
      description: 'Tang Nano 9K FPGA module has flagged an active threat signal. Immediate response required.',
      coords,
      location: locStr,
      timestamp: deviceState.last_updated || new Date().toISOString(),
      active: true,
      source: 'FPGA',
    });
  }

  // 2. Telegram failure alert (threat active but alert unsent)
  if (
    (deviceState.fpga_alert === 1 || deviceState.fpga_alert === '1') &&
    (deviceState.telegram_sent === false || deviceState.telegram_sent === 'false')
  ) {
    alerts.push({
      id: 'HW-COMM-001',
      type: 'comm_failure',
      severity: 'high',
      title: 'TELEGRAM ALERT FAILED',
      description: 'FPGA threat was detected but NodeMCU failed to dispatch the Telegram emergency alert. Communication gateway may be unreachable.',
      coords,
      location: locStr,
      timestamp: deviceState.last_updated || new Date().toISOString(),
      active: true,
      source: 'NodeMCU',
    });
  }

  // 3. WiFi offline alert
  if (deviceState.wifi === false || deviceState.wifi === 'false') {
    alerts.push({
      id: 'HW-WIFI-001',
      type: 'connectivity',
      severity: 'warning',
      title: 'DEVICE WIFI DISCONNECTED',
      description: 'NodeMCU has lost internet connectivity. Live telemetry and Telegram alerts are unavailable until reconnected.',
      coords,
      location: locStr,
      timestamp: deviceState.last_updated || new Date().toISOString(),
      active: true,
      source: 'NodeMCU',
    });
  }

  // 4. Resolved: FPGA safe + Telegram sent
  if (
    (deviceState.fpga_alert === 0 || deviceState.fpga_alert === '0') &&
    (deviceState.telegram_sent === true || deviceState.telegram_sent === 'true')
  ) {
    alerts.push({
      id: 'HW-OK-001',
      type: 'threat_deactivated',
      severity: 'resolved',
      title: 'SYSTEM CLEAR — ALL SAFE',
      description: 'No active FPGA threat. Telegram alert channel is operational and confirmed active.',
      coords,
      location: locStr,
      timestamp: deviceState.last_updated || new Date().toISOString(),
      active: false,
      source: 'System',
    });
  }

  // 5. System online / WiFi stable
  if (deviceState.wifi === true || deviceState.wifi === 'true') {
    alerts.push({
      id: 'HW-ONLINE-001',
      type: 'connectivity',
      severity: 'info',
      title: 'DEVICE ONLINE',
      description: `NodeMCU is connected and transmitting live telemetry. Status: ${deviceState.status || 'ACTIVE'}.`,
      coords,
      location: locStr,
      timestamp: deviceState.last_updated || new Date().toISOString(),
      active: false,
      source: 'NodeMCU',
    });
  }

  // 6. Convert activity logs to historical alert entries
  if (logs && logs.length > 0) {
    logs.slice(0, 10).forEach((log, i) => {
      alerts.push({
        id: `LOG-${i + 1}`,
        type: log.includes('THREAT') ? 'threat' : 'connectivity',
        severity: log.includes('THREAT') ? 'high' : 'info',
        title: log,
        description: 'Event captured from live hardware activity stream.',
        coords,
        location: locStr,
        timestamp: new Date().toISOString(),
        active: false,
        source: 'Activity Log',
      });
    });
  }

  return alerts;
}

const FILTER_TABS = [
  { key: 'all', label: 'ALL', icon: BellRing },
  { key: 'threat', label: 'THREATS', icon: ShieldAlert },
  { key: 'connectivity', label: 'CONNECTIVITY', icon: Wifi },
  { key: 'threat_deactivated', label: 'RESOLVED', icon: ShieldCheck },
];

function getAlertStyle(alert) {
  if (!alert.active) {
    return {
      border: 'border-gray-700/40',
      bg: 'bg-[#0a0a0a]',
      icon: ShieldOff,
      iconColor: 'text-gray-500',
      badge: 'bg-gray-800 text-gray-400 border-gray-700',
      badgeText: 'RESOLVED',
      glow: '',
    };
  }
  switch (alert.severity) {
    case 'critical':
      return {
        border: 'border-[#FF0033]/50',
        bg: 'bg-[#FF0033]/5',
        icon: ShieldAlert,
        iconColor: 'text-[#FF0033] animate-pulse',
        badge: 'bg-[#FF0033]/20 text-[#FF0033] border-[#FF0033]/40',
        badgeText: 'CRITICAL',
        glow: 'shadow-[0_0_20px_-5px_rgba(255,0,51,0.3)]',
      };
    case 'high':
      return {
        border: 'border-[#FF0033]/40',
        bg: 'bg-[#FF0033]/[0.03]',
        icon: AlertTriangle,
        iconColor: 'text-[#FF0033]',
        badge: 'bg-[#FF0033]/15 text-[#FF0033]/90 border-[#FF0033]/30',
        badgeText: 'HIGH',
        glow: 'shadow-[0_0_15px_-5px_rgba(255,0,51,0.2)]',
      };
    case 'warning':
      return {
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/[0.03]',
        icon: WifiOff,
        iconColor: 'text-orange-400',
        badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        badgeText: 'WARNING',
        glow: '',
      };
    default:
      return {
        border: 'border-blue-500/20',
        bg: 'bg-blue-500/[0.02]',
        icon: Radio,
        iconColor: 'text-blue-400',
        badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        badgeText: 'INFO',
        glow: '',
      };
  }
}

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Alerts({ isDanger, deviceState, logs = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);

  const alerts = buildAlertsFromState(deviceState, logs);

  const filtered = alerts.filter(alert => {
    const matchesFilter = activeFilter === 'all' || alert.type === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = alerts.filter(a => a.active).length;
  const threatCount = alerts.filter(a => a.type === 'threat' && a.active).length;
  const connCount = alerts.filter(a => a.type === 'connectivity' && a.active).length;
  const resolvedCount = alerts.filter(a => !a.active).length;

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-8 bg-[#FF0033] rounded-full shadow-glow-sm" />
          <h1 className="text-3xl font-orbitron font-black tracking-[0.15em] text-white">
            ALERTS
          </h1>
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 bg-[#FF0033]/20 text-[#FF0033] border border-[#FF0033]/40 rounded-full px-3 py-0.5 text-xs font-orbitron font-bold tracking-wider animate-pulse"
            >
              {activeCount} ACTIVE
            </motion.span>
          )}
        </div>
        <p className="text-gray-500 font-mono text-xs tracking-widest uppercase ml-4 pl-1">
          Real-time hardware telemetry · FPGA · NodeMCU · GPS
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'TOTAL ACTIVE', value: activeCount, color: activeCount > 0 ? 'text-[#FF0033]' : 'text-white', borderColor: 'border-[#FF0033]/20' },
          { label: 'THREATS', value: threatCount, color: 'text-[#FF0033]', borderColor: 'border-[#FF0033]/30' },
          { label: 'CONNECTIVITY', value: connCount, color: 'text-orange-400', borderColor: 'border-orange-500/20' },
          { label: 'RESOLVED', value: resolvedCount, color: 'text-gray-400', borderColor: 'border-gray-700/30' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={`glass-card rounded-xl p-4 border ${stat.borderColor}`}
          >
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
            <div className={`text-2xl font-orbitron font-black ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-[11px] uppercase tracking-widest transition-all duration-300 ${
                activeFilter === tab.key
                  ? 'bg-[#FF0033]/10 border-[#FF0033]/40 text-[#FF0033] shadow-[inset_0_0_15px_rgba(255,0,51,0.1)]'
                  : 'border-[#FF0033]/10 text-gray-500 hover:border-[#FF0033]/25 hover:text-gray-300 bg-[#050505]'
              }`}
            >
              <tab.icon style={{ width: '14px', height: '14px' }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="pl-10 pr-4 py-2 bg-[#050505] border border-[#FF0033]/15 rounded-lg text-sm text-gray-300 font-mono tracking-wider placeholder:text-gray-700 focus:outline-none focus:border-[#FF0033]/40 transition-all w-64"
          />
        </div>
      </div>

      {/* No device connected state */}
      {!deviceState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <Radio className="w-10 h-10 text-gray-700 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500 font-orbitron tracking-widest text-sm">AWAITING HARDWARE CONNECTION</p>
          <p className="text-gray-700 font-mono text-xs mt-1 tracking-wider">No data received from IoT device yet</p>
        </motion.div>
      )}

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((alert, idx) => {
            const style = getAlertStyle(alert);
            const isExpanded = expandedAlert === alert.id;
            const IconComponent = style.icon;

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                className={`glass-card rounded-xl border ${style.border} ${style.bg} ${style.glow} cursor-pointer transition-all duration-300 hover:border-[#FF0033]/50 group`}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl border ${style.border} flex items-center justify-center flex-shrink-0 ${alert.active ? 'bg-[#FF0033]/5' : 'bg-[#111]'}`}>
                    <IconComponent className={`${style.iconColor}`} style={{ width: '20px', height: '20px' }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className={`text-[9px] font-orbitron font-bold tracking-[0.2em] px-2.5 py-0.5 rounded border ${style.badge}`}>
                        {style.badgeText}
                      </span>
                      <span className="text-[9px] font-mono text-gray-600 tracking-wider bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        {alert.source}
                      </span>
                      <span className="text-[10px] font-mono text-gray-600 tracking-wider">{alert.id}</span>
                    </div>
                    <h3 className={`text-sm font-orbitron font-bold tracking-wider ${alert.active ? 'text-white' : 'text-gray-400'}`}>
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
                        <Clock style={{ width: '12px', height: '12px' }} />
                        {timeAgo(alert.timestamp)}
                      </span>
                      {alert.coords.lat !== 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
                          <MapPin style={{ width: '12px', height: '12px' }} />
                          {alert.coords.lat.toFixed(5)}, {alert.coords.lng.toFixed(5)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0 mt-1 ${isExpanded ? 'rotate-90 text-[#FF0033]' : 'group-hover:text-gray-400'}`} />
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 border-t border-[#FF0033]/10">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1.5">DESCRIPTION</div>
                            <p className="text-sm text-gray-400 leading-relaxed">{alert.description}</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1">COORDINATES</div>
                              <p className="text-sm text-[#FF0033] font-mono">{alert.location}</p>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1">TIMESTAMP</div>
                              <p className="text-sm text-gray-400 font-mono">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-1">SOURCE</div>
                              <p className="text-sm text-gray-300 font-mono">{alert.source}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {deviceState && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <EyeOff className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-orbitron tracking-widest text-sm">NO ALERTS FOUND</p>
            <p className="text-gray-700 font-mono text-xs mt-1 tracking-wider">Adjust filters or search criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

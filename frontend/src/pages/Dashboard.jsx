import StatusPanel from '../components/StatusPanel';
import LiveMap from '../components/LiveMap';
import ActivityFeed from '../components/ActivityFeed';
import SOSButton from '../components/SOSButton';
import { motion } from 'framer-motion';
import { MapPin, Activity, Shield, Clock, Wifi } from 'lucide-react';

export default function Dashboard({ deviceState, logs, wsConnected, triggerSOS, isDanger, isOffline }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-8 bg-[#FF0033] rounded-full shadow-glow-sm" />
          <h1 className="text-3xl font-orbitron font-black tracking-[0.15em] text-white">
            DASHBOARD
          </h1>
        </div>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: MapPin, label: 'LOCATION', value: deviceState?.location && typeof deviceState.location === 'object' && typeof deviceState.location.lat === 'number' ? `${deviceState.location.lat.toFixed(4)}, ${deviceState.location.lng.toFixed(4)}` : '—', color: 'text-[#FF0033]' },
          { icon: Activity, label: 'STATE', value: deviceState?.status || '—', color: isDanger ? 'text-[#FF0033] animate-pulse' : 'text-green-400' },
          { icon: Wifi, label: 'WIFI LINK', value: deviceState?.wifi ? 'CONNECTED' : 'DISCONNECTED', color: deviceState?.wifi ? 'text-green-400' : 'text-[#FF0033]' },
          { icon: Shield, label: 'FPGA THREAT', value: deviceState?.fpga_alert === 1 ? 'THREAT' : 'SECURE', color: deviceState?.fpga_alert === 1 ? 'text-[#FF0033] animate-pulse' : 'text-green-400' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-[#FF0033]/40 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-lg border border-[#FF0033]/20 bg-[#FF0033]/5 flex items-center justify-center group-hover:border-[#FF0033]/40 transition-colors">
              <stat.icon className="w-4.5 h-4.5 text-[#FF0033]/70" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em]">{stat.label}</div>
              <div className={`text-sm font-orbitron font-bold tracking-wider ${stat.color}`}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-0 items-center mt-6 relative min-h-0">
        {/* Left Column (Status & Feed) */}
        <div className="flex flex-col gap-6 arc-cutout-right py-4 h-full z-10">
          <StatusPanel deviceState={deviceState} wsConnected={wsConnected} />
          <ActivityFeed logs={logs} isDanger={isDanger} />
        </div>

        {/* Center Column (SOS Button) */}
        <div className="flex justify-center items-center relative z-20" style={{ transform: 'translateY(-100px)' }}>
          <SOSButton onClick={triggerSOS} isDanger={isDanger} />
        </div>

        {/* Right Column (Live Map) */}
        <div className="flex flex-col gap-6 arc-cutout-left py-4 h-full z-10">
          <LiveMap deviceState={deviceState} isDanger={isDanger} />
        </div>
      </div>
    </div>
  );
}

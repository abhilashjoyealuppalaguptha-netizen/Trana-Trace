import StatusPanel from '../components/StatusPanel';
import LiveMap from '../components/LiveMap';
import ActivityFeed from '../components/ActivityFeed';
import SOSButton from '../components/SOSButton';
import { motion } from 'framer-motion';
import { MapPin, Activity, Shield, Wifi } from 'lucide-react';

export default function Dashboard({ deviceState, logs, wsConnected, triggerSOS, testNotification, isDanger, isOffline }) {
  const stats = [
    { 
      icon: MapPin, 
      label: 'MY DEVICE LOCATION', 
      value: deviceState?.location && typeof deviceState.location === 'object' && typeof deviceState.location.lat === 'number' 
        ? `${deviceState.location.lat.toFixed(5)}, ${deviceState.location.lng.toFixed(5)}` 
        : 'ACQUIRING...', 
      color: 'text-[#FF0033]',
      sub: 'LAT / LNG COORDINATES'
    },
    { 
      icon: Activity, 
      label: 'SYSTEM STATE', 
      value: deviceState?.status || 'UNKNOWN', 
      color: isDanger ? 'text-[#FF0033] animate-pulse' : 'text-green-400',
      sub: isDanger ? 'CRITICAL ALERT ACTIVE' : 'SYSTEM NOMINAL'
    },
    { 
      icon: Wifi, 
      label: 'UPLINK STATUS', 
      value: deviceState?.wifi ? 'CONNECTED' : 'OFFLINE', 
      color: deviceState?.wifi ? 'text-green-400' : 'text-[#FF0033]',
      sub: deviceState?.wifi ? 'SIGNAL STRENGTH: 100%' : 'CONNECTION SEVERED'
    },
    { 
      icon: Shield, 
      label: 'THREAT LOGIC', 
      value: deviceState?.fpga_alert === 1 ? 'THREAT' : 'SECURE', 
      color: deviceState?.fpga_alert === 1 ? 'text-[#FF0033] animate-pulse' : 'text-green-400',
      sub: 'FPGA CORE MONITORING'
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#FF0033] rounded-full shadow-[0_0_15px_rgba(255,0,51,0.6)]" />
            <div>
              <h1 className="text-4xl font-orbitron font-black tracking-[0.2em] text-white">
                <span className="text-[#FF0033]/50">DASHBOARD</span>
              </h1>
            </div>
          </div>
          
          <motion.button
            onClick={testNotification}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-[#FF0033]/10 border border-[#FF0033]/30 rounded-lg text-[10px] font-orbitron font-bold text-[#FF0033] tracking-[0.2em] hover:bg-[#FF0033]/20 transition-all shadow-[0_0_15px_rgba(255,0,51,0.1)]"
          >
            TEST NOTIFICATIONS
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-2xl p-5 border-l-4 border-l-[#FF0033]/30 flex flex-col gap-3 group hover:border-[#FF0033]/60 transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_-10px_rgba(255,0,51,0.2)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl border border-[#FF0033]/20 bg-[#FF0033]/5 flex items-center justify-center group-hover:border-[#FF0033]/50 group-hover:bg-[#FF0033]/10 transition-all">
                <stat.icon className="w-6 h-6 text-[#FF0033]" />
              </div>
              <div className="text-[8px] font-mono text-gray-700 tracking-[0.2em] border border-gray-800 rounded px-1.5 py-0.5">
                MT-0{idx + 1}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className={`text-xl font-orbitron font-black tracking-wider ${stat.color} truncate`}>
                {stat.value}
              </div>
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                {stat.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex-1 min-h-[600px] relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
        
        {/* Left Column (Status & Feed) - Fixed Height to prevent SOS drift */}
        <div className="h-[650px] flex flex-col gap-6 arc-cutout-right py-4 z-10 pr-8">
          <StatusPanel deviceState={deviceState} wsConnected={wsConnected} />
          <ActivityFeed logs={logs} isDanger={isDanger} />
        </div>

        {/* Center Column (SOS Button) - Stable positioning */}
        <div className="w-[380px] flex justify-center relative z-20">
           <div className="sticky top-[15%] h-fit">
              <div className="relative" style={{ transform: 'translateY(120px)' }}>
                <SOSButton onClick={triggerSOS} isDanger={isDanger} />
                
                {/* Decorative scanning circle around SOS */}
                <div className="absolute inset-[-40px] border border-[#FF0033]/10 rounded-full animate-spin-slow pointer-events-none" />
                <div className="absolute inset-[-60px] border border-[#FF0033]/5 rounded-full animate-reverse-spin pointer-events-none" />
              </div>
           </div>
        </div>

        {/* Right Column (Live Map) - Fixed Height matching left */}
        <div className="h-[650px] flex flex-col gap-6 arc-cutout-left py-4 z-10 pl-8">
          <LiveMap deviceState={deviceState} isDanger={isDanger} />
        </div>
      </div>
    </div>
  );
}
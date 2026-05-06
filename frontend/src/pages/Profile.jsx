import { motion } from 'framer-motion';
import { 
  User, Shield, MapPin, Radio, Battery, Wifi, 
  Fingerprint, Eye, Clock, Activity, ChevronRight,
  Crosshair
} from 'lucide-react';

export default function Profile({ deviceState }) {
  const profileData = {
    operativeId: 'TT-01',
    codename: 'NEXUS PRIME',
    clearanceLevel: 'ALPHA-7',
    unit: 'TRANA DEFENSE SYSTEMS',
    assignedZone: 'Aditya University, ADB Road Surampalem',
    coordinates: { lat: 17.087741, lng: 82.068706 },
    enrollmentDate: '2026-01-15',
    lastActive: '2026-05-03 17:45:12',
    biometricStatus: 'VERIFIED',
    securityHash: 'a9f2c8...e3d1b7',
  };

  const InfoRow = ({ icon: Icon, label, value, valueClass = 'text-gray-200', danger = false }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#FF0033]/10 last:border-0 group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center group-hover:border-[#FF0033]/30 transition-colors">
          <Icon className="text-[#FF0033]/60" style={{ width: '14px', height: '14px' }} />
        </div>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <span className={`text-sm font-mono font-medium tracking-wider ${danger ? 'text-[#FF0033] animate-pulse' : valueClass}`}>
        {value}
      </span>
    </div>
  );

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
            PROFILE
          </h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & ID Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Decorative corner lines */}
            <div className="absolute top-0 left-0 w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#FF0033]/40 to-transparent" />
              <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-[#FF0033]/40 to-transparent" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#FF0033]/40 to-transparent" />
              <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-[#FF0033]/40 to-transparent" />
            </div>

            {/* Avatar */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-[#FF0033]/20 blur-xl animate-pulse-slow" />
              <div className="relative w-28 h-28 rounded-full border-2 border-[#FF0033]/40 bg-gradient-to-br from-[#FF0033]/10 to-[#0a0a0a] flex items-center justify-center shadow-glow">
                <User className="w-12 h-12 text-[#FF0033]/70" />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#050505] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>

            <h2 className="font-orbitron font-black text-xl tracking-[0.2em] text-white mb-1">
              {profileData.codename}
            </h2>
            <span className="text-[10px] font-mono text-[#FF0033]/70 tracking-[0.3em] uppercase">
              OPERATIVE {profileData.operativeId}
            </span>

            <div className="mt-5 w-full border-t border-[#FF0033]/15 pt-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#FF0033]" />
                <span className="text-[10px] font-orbitron tracking-[0.2em] text-[#FF0033]">
                  CLEARANCE: {profileData.clearanceLevel}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 flex flex-col gap-6"
        >
          {/* Device & System Info */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-orbitron font-bold tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF0033]" />
              DEVICE TELEMETRY
            </h3>
            <div className="space-y-0">
              <InfoRow icon={Radio} label="Device ID" value={deviceState?.id || profileData.operativeId} />
              <InfoRow icon={Activity} label="Status" value={deviceState?.status || 'STANDBY'} danger={deviceState?.status === 'DANGER'} />
              <InfoRow icon={Battery} label="Battery" value={deviceState?.battery ? `${deviceState.battery}%` : '—'} valueClass={deviceState?.battery < 20 ? 'text-[#FF0033]' : 'text-gray-200'} />
              <InfoRow icon={Wifi} label="Signal" value={deviceState?.signal || '—'} />
              <InfoRow 
                icon={MapPin} 
                label="Location" 
                value={deviceState?.location ? `${deviceState.location.lat.toFixed(6)}, ${deviceState.location.lng.toFixed(6)}` : '—'} 
                valueClass="text-[#FF0033]/80"
              />
            </div>
          </div>

          {/* Operative Details */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-orbitron font-bold tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FF0033]" />
              OPERATIVE DETAILS
            </h3>
            <div className="space-y-0">
              <InfoRow icon={Shield} label="Unit" value={profileData.unit} />
              <InfoRow icon={Clock} label="Enrolled" value={profileData.enrollmentDate} valueClass="text-gray-400" />
              <InfoRow icon={Activity} label="Last Active" value={profileData.lastActive} valueClass="text-gray-400 text-xs" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

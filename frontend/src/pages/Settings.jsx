import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Bell, MapPin, Shield, Wifi, 
  Eye, Volume2, Smartphone, Clock, Zap, Database,
  ToggleLeft, ToggleRight, ChevronRight, Save
} from 'lucide-react';

const INITIAL_SETTINGS = {
  // Notifications
  sosAlerts: true,
  threatAlerts: true,
  batteryAlerts: true,
  geofenceAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
  
  // Tracking
  trackingInterval: '2.5',
  highPrecisionGps: true,
  pathHistory: true,
  geofenceRadius: '500',
  
  // Security
  encryptedComms: true,
  biometricAuth: true,
  autoLock: true,
  lockTimeout: '5',
  
  // Display
  darkMode: true,
  animationsEnabled: true,
  compactView: false,
  showCoordinates: true,
};

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="focus:outline-none"
    >
      {enabled ? (
        <ToggleRight className="w-8 h-8 text-[#FF0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.4)]" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-gray-600 hover:text-gray-500 transition-colors" />
      )}
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#FF0033]/8 last:border-0 group">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center group-hover:border-[#FF0033]/30 transition-colors">
          <Icon className="text-[#FF0033]/60" style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <div className="text-sm text-gray-200 font-medium tracking-wide">{label}</div>
          {description && (
            <div className="text-[10px] font-mono text-gray-600 tracking-wider mt-0.5">{description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="bg-[#0a0a0a] border border-[#FF0033]/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 font-mono tracking-wider focus:outline-none focus:border-[#FF0033]/40 focus:shadow-[0_0_10px_-3px_rgba(255,0,51,0.2)] transition-all appearance-none cursor-pointer"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      title: 'NOTIFICATIONS',
      icon: Bell,
      desc: 'ALERT PREFERENCES',
      items: [
        { icon: Shield, label: 'SOS Alerts', desc: 'Receive SOS trigger notifications', key: 'sosAlerts', type: 'toggle' },
        { icon: Eye, label: 'Threat Alerts', desc: 'Hostile detection notifications', key: 'threatAlerts', type: 'toggle' },
        { icon: Zap, label: 'Battery Alerts', desc: 'Low power level warnings', key: 'batteryAlerts', type: 'toggle' },
      ],
    },
    {
      title: 'TRACKING',
      icon: MapPin,
      desc: 'GPS & LOCATION',
      items: [
        { icon: MapPin, label: 'High Precision GPS', desc: 'Use enhanced satellite triangulation', key: 'highPrecisionGps', type: 'toggle' },
        { icon: Database, label: 'Path History', desc: 'Store movement trail data', key: 'pathHistory', type: 'toggle' },
      ],
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 bg-[#FF0033] rounded-full shadow-glow-sm" />
              <h1 className="text-3xl font-orbitron font-black tracking-[0.15em] text-white">
                SETTINGS
              </h1>
            </div>
            <p className="text-gray-500 font-mono text-xs tracking-widest uppercase ml-4 pl-1">
              System configuration & preferences
            </p>
          </div>
          
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-orbitron text-sm tracking-wider transition-all duration-300 ${
              saved 
                ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]'
                : 'bg-[#FF0033]/10 border-[#FF0033]/40 text-[#FF0033] hover:bg-[#FF0033]/20 hover:shadow-[0_0_15px_-3px_rgba(255,0,51,0.3)]'
            }`}
          >
            <Save style={{ width: '16px', height: '16px' }} />
            {saved ? 'SAVED' : 'SAVE'}
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.08 }}
            className="glass-card rounded-2xl p-6"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#FF0033]/15">
              <div className="w-9 h-9 rounded-xl border border-[#FF0033]/30 bg-[#FF0033]/10 flex items-center justify-center">
                <section.icon className="w-4.5 h-4.5 text-[#FF0033]" style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 className="text-sm font-orbitron font-bold tracking-[0.15em] text-white">{section.title}</h3>
                <span className="text-[9px] font-mono text-gray-600 tracking-[0.2em]">{section.desc}</span>
              </div>
            </div>

            {/* Settings Items */}
            <div>
              {section.items.map(item => (
                <SettingRow key={item.key} icon={item.icon} label={item.label} description={item.desc}>
                  {item.type === 'toggle' ? (
                    <ToggleSwitch 
                      enabled={settings[item.key]} 
                      onToggle={() => toggle(item.key)} 
                    />
                  ) : (
                    <SelectInput 
                      value={settings[item.key]} 
                      onChange={(e) => update(item.key, e.target.value)}
                      options={item.options}
                    />
                  )}
                </SettingRow>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

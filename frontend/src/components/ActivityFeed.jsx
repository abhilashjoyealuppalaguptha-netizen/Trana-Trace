import AntigravityCard from './AntigravityCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, AlertCircle } from 'lucide-react';

export default function ActivityFeed({ logs, isDanger }) {
  return (
    <AntigravityCard isDanger={isDanger} delay={0.2} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FF0033]/15">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#FF0033]" />
          <h2 className="text-sm font-orbitron text-white tracking-[0.15em] font-bold uppercase">Activity Log</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-mono text-gray-500 tracking-widest uppercase">Live Monitoring</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {logs.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-full gap-4 py-12"
            >
              <div className="hex-spinner opacity-40" />
              <span className="text-gray-600 font-mono text-[10px] tracking-[0.3em] uppercase">Securing data stream...</span>
            </motion.div>
          )}
          {logs.map((log, i) => {
            const isSOS = log.includes('SOS') || log.includes('THREAT');
            return (
              <motion.div
                key={`${log}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm py-3.5 px-5 rounded-xl font-mono border-l-[4px] transition-all duration-300 relative overflow-hidden group ${
                   isSOS 
                   ? 'bg-[#FF0033]/15 border-[#FF0033] text-white shadow-[0_4px_15px_-3px_rgba(255,0,51,0.2)]' 
                   : 'bg-[#0a0a0a] border-white/10 text-gray-300 hover:border-[#FF0033]/40'
                }`}
              >
                {isSOS && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF0033]/5 to-transparent pointer-events-none" />
                )}
                <div className="flex items-start gap-3 relative z-10">
                  {isSOS ? (
                    <AlertCircle className="w-4 h-4 text-[#FF0033] mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF0033]/40 mt-1.5 flex-shrink-0 group-hover:bg-[#FF0033] transition-colors" />
                  )}
                  <div className="flex flex-col gap-1">
                    <span className={`text-[11px] leading-relaxed tracking-tight ${isSOS ? 'font-bold' : ''}`}>{log}</span>
                    <span className="text-[8px] opacity-40 font-mono tracking-widest uppercase">Verified Uplink</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AntigravityCard>
  );
}


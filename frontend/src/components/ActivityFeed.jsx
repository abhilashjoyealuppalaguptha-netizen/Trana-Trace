import AntigravityCard from './AntigravityCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, AlertCircle } from 'lucide-react';

export default function ActivityFeed({ logs, isDanger }) {
  return (
    <AntigravityCard isDanger={isDanger} delay={0.2} className="flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#FF0033]/15">
        <Terminal className="w-4 h-4 text-[#FF0033]" />
        <h2 className="text-sm font-orbitron text-white tracking-[0.15em] font-bold uppercase">Activity Log</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
        <AnimatePresence>
          {logs.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-full gap-3 py-8"
            >
              <div className="hex-spinner" />
              <span className="text-gray-600 font-mono text-xs tracking-widest uppercase">Waiting for activity...</span>
            </motion.div>
          )}
          {logs.map((log, i) => {
            const isSOS = log.includes('SOS');
            return (
              <motion.div
                key={`${log}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`text-sm py-3 px-4 rounded-lg font-mono border-l-[3px] transition-all duration-300 ${
                   isSOS 
                   ? 'bg-[#FF0033]/10 border-[#FF0033] text-white shadow-[inset_0_0_20px_rgba(255,0,51,0.1)]' 
                   : 'bg-[#0a0a0a] border-[#FF0033]/30 text-gray-400 hover:text-gray-300 hover:bg-[#FF0033]/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isSOS ? (
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF0033] animate-pulse flex-shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF0033]/40 flex-shrink-0" />
                  )}
                  <span className="text-xs">{log}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AntigravityCard>
  );
}

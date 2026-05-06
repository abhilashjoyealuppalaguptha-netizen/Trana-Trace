import AntigravityCard from './AntigravityCard';
import { Activity, Battery, Wifi, WifiOff, Radio, Shield, Signal } from 'lucide-react';

export default function StatusPanel({ deviceState, wsConnected }) {
  if (!deviceState) return (
    <AntigravityCard className="h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="hex-spinner" />
        <span className="text-gray-600 font-orbitron uppercase tracking-widest text-xs">Awaiting Link...</span>
      </div>
    </AntigravityCard>
  );

  const isDanger = deviceState.status === 'DANGER';
  const batteryLow = deviceState.battery < 20;

  return (
    <AntigravityCard isDanger={isDanger} delay={0.1} className="flex flex-col gap-0 flex-shrink-0">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#FF0033]/15">
        <Shield className="w-4 h-4 text-[#FF0033]" />
        <h2 className="text-sm font-orbitron text-white tracking-[0.15em] font-bold uppercase">System Status</h2>
      </div>
      
      {/* WiFi Connection (Hardware Signal) */}
      <div className="flex items-center justify-between py-3 border-b border-[#FF0033]/8 group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center">
            {deviceState.wifi 
              ? <Wifi className="w-3.5 h-3.5 text-green-400" /> 
              : <WifiOff className="w-3.5 h-3.5 text-[#FF0033]" />
            }
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">WiFi Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${deviceState.wifi ? 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-[#FF0033] animate-pulse shadow-glow-sm'}`} />
          <span className={`text-sm font-mono font-medium tracking-wider ${deviceState.wifi ? 'text-green-400' : 'text-[#FF0033]'}`}>
            {deviceState.wifi ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* FPGA Threat Detection */}
      <div className="flex items-center justify-between py-3 border-b border-[#FF0033]/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center">
            <Shield className={`w-3.5 h-3.5 ${deviceState.fpga_alert === 1 ? 'text-[#FF0033] animate-pulse' : 'text-green-400'}`} />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">FPGA Threat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-orbitron font-bold tracking-[0.15em] text-sm ${deviceState.fpga_alert === 1 ? 'text-[#FF0033] animate-pulse' : 'text-green-400'}`}>
            {deviceState.fpga_alert === 1 ? 'THREAT' : 'SAFE'}
          </span>
        </div>
      </div>

      {/* Telegram Status */}
      <div className="flex items-center justify-between py-3 border-b border-[#FF0033]/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center">
            <Signal className={`w-3.5 h-3.5 ${deviceState.telegram_sent ? 'text-green-400' : 'text-gray-600'}`} />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Telegram Status</span>
        </div>
        <span className={`text-sm font-mono font-medium tracking-wider ${deviceState.telegram_sent ? 'text-green-400' : 'text-gray-500'}`}>
          {deviceState.telegram_sent ? 'ALERT SENT' : 'IDLE'}
        </span>
      </div>

      {/* Communication Failure Warning */}
      {deviceState.fpga_alert === 1 && !deviceState.telegram_sent && (
        <div className="mt-4 p-3 bg-[#FF0033]/10 border border-[#FF0033]/30 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-[#FF0033] flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-orbitron font-black text-[#FF0033] tracking-widest">COMM FAILURE</div>
            <div className="text-[9px] font-mono text-gray-400 tracking-wider">TELEGRAM GATEWAY UNREACHABLE</div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between py-3 border-b border-[#FF0033]/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center">
            <Activity className={`w-3.5 h-3.5 ${isDanger ? 'text-[#FF0033] animate-pulse' : 'text-green-400'}`} />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">System State</span>
        </div>
        <span className={`font-orbitron font-bold tracking-[0.15em] text-sm ${isDanger ? 'text-[#FF0033] animate-pulse neon-red' : 'text-green-400'}`}>
          {deviceState.status}
        </span>
      </div>

      {/* Battery (Static) */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#FF0033]/15 bg-[#FF0033]/5 flex items-center justify-center">
            <Battery className="w-3.5 h-3.5 text-green-400" />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Hardware Power</span>
        </div>
        <span className="font-orbitron font-bold text-sm tracking-wider text-green-400">
          EXTERNAL (100%)
        </span>
      </div>
    </AntigravityCard>
  );
}

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function SOSButton({ onClick, isDanger }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative z-10 w-[320px] h-[320px] rounded-full font-orbitron font-black text-4xl tracking-[0.25em] uppercase border-[8px] flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.8)] ${
        isDanger 
          ? "bg-[#FF0033] text-white border-white" 
          : "bg-[#8A0019] text-gray-200 border-[#3D000B] hover:bg-[#B30024] hover:border-[#4A000D]"
      }`}
    >
      <AlertTriangle style={{ width: '56px', height: '56px' }} strokeWidth={2.5} />
      <span>SOS</span>
    </motion.button>
  );
}

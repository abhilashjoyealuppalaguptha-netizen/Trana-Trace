import { motion } from 'framer-motion';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AntigravityCard({ children, className, isDanger = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: [0, -3, 0], 
        opacity: 1, 
      }}
      transition={{ 
        y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay },
        opacity: { duration: 0.5, delay },
      }}
      whileHover={{
         y: -4,
         scale: 1.01,
         transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className={cn(
        "glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300",
        isDanger && "border-[#FF0033]/40 shadow-[0_0_25px_-5px_rgba(255,0,51,0.3)]",
        className
      )}
    >
      {/* Top edge glow */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF0033]/${isDanger ? '50' : '20'} to-transparent`} />
      
      {/* Danger mode corner pulse */}
      {isDanger && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FF0033] animate-pulse shadow-glow-sm m-3" />
      )}
      
      {children}
    </motion.div>
  );
}

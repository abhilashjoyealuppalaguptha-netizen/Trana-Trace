import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

export default function Layout({ isDanger, isOffline }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-gray-200 relative flex bg-[#000000]">


      {/* Subtle vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)'
      }} />

      <AnimatePresence>
        {!isOffline && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Corner accents */}
            <div className="fixed top-0 left-0 w-24 h-24 pointer-events-none z-[2]">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#FF0033]/40 to-transparent" />
              <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-[#FF0033]/40 to-transparent" />
            </div>
            <div className="fixed top-0 right-0 w-24 h-24 pointer-events-none z-[2]">
              <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#FF0033]/40 to-transparent" />
              <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-[#FF0033]/40 to-transparent" />
            </div>
            <div className="fixed bottom-0 left-0 w-24 h-24 pointer-events-none z-[2]">
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#FF0033]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 h-full w-[1px] bg-gradient-to-t from-[#FF0033]/40 to-transparent" />
            </div>
            <div className="fixed bottom-0 right-0 w-24 h-24 pointer-events-none z-[2]">
              <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#FF0033]/40 to-transparent" />
              <div className="absolute bottom-0 right-0 h-full w-[1px] bg-gradient-to-t from-[#FF0033]/40 to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar isDanger={isDanger} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className={`flex-1 h-screen overflow-y-auto relative z-10 transition-opacity duration-1000 ${isOffline ? 'opacity-30 grayscale' : 'opacity-100'}`}>
        {/* Top bar with breadcrumb-like info */}
        <div className="sticky top-0 z-30 border-b border-[#FF0033]/10 bg-[#000000]/80 backdrop-blur-xl">
          <div className="px-6 py-3 flex items-center justify-between relative">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-[#FF0033]/10 rounded-lg transition-colors border border-transparent hover:border-[#FF0033]/30 flex items-center justify-center relative z-10"
            >
              <Menu className="w-5 h-5 text-[#FF0033]" />
            </button>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-orbitron font-black tracking-[0.3em] bg-gradient-to-r from-red-600 via-[#FF0033] to-red-900 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">
                TRANA-TRACE
              </span>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <Outlet />
        </div>
        
        {isOffline && (
           <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm">
             <div className="text-center">
               <h2 className="text-5xl font-orbitron tracking-widest text-[#FF0033] font-bold uppercase neon-red animate-pulse">
                 CONNECTION SEVERED
               </h2>
               <p className="text-gray-500 font-mono text-sm mt-4 tracking-widest uppercase">
                 Attempting reconnection...
               </p>
               <div className="hex-spinner mx-auto mt-4" />
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

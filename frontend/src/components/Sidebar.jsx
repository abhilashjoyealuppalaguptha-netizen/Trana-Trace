import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isDanger, isOpen, setIsOpen }) {
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'TACTICAL OVERVIEW' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alerts', desc: 'THREAT MONITOR' },
    { to: '/profile', icon: User, label: 'Profile', desc: 'OPERATIVE ID' },
    { to: '/settings', icon: Settings, label: 'Settings', desc: 'SYS CONFIG' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <div className={`fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#030303] ${isDanger ? 'border-[#FF0033]/60 shadow-[2px_0_25px_-3px_rgba(255,0,51,0.4)]' : 'border-[#FF0033]/15'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Red accent line at top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#FF0033] to-transparent opacity-60" />

      {/* Logo */}
      <div className="p-6 border-b border-[#FF0033]/15">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div>
            <h1 className="font-orbitron font-black text-2xl tracking-[0.25em] text-white leading-none">TRANA-TRACE</h1>
          </div>
        </motion.div>
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {links.map((link, idx) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <NavLink
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `
                group relative flex items-center gap-3.5 px-4 py-3 rounded-lg border font-inter transition-all duration-300 overflow-hidden
                ${isActive 
                  ? 'bg-[#FF0033]/10 border-[#FF0033]/40 text-white shadow-[inset_0_0_20px_rgba(255,0,51,0.15)]' 
                  : 'border-transparent text-gray-500 hover:text-white hover:border-[#FF0033]/20 hover:bg-[#FF0033]/5'}
              `}
            >
              {/* Active indicator bar */}
              {location.pathname === link.to || (link.to === '/' && location.pathname === '/') ? (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#FF0033] rounded-r shadow-glow"
                />
              ) : null}
              
              <link.icon className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                location.pathname === link.to || (link.to === '/' && location.pathname === '/') 
                  ? 'text-[#FF0033]' 
                  : 'group-hover:text-[#FF0033]'
              }`} style={{ width: '18px', height: '18px' }} />
              
              <div className="flex flex-col">
                <span className="text-sm font-medium tracking-wide">{link.label}</span>
                <span className={`text-[9px] tracking-widest uppercase transition-colors ${
                  location.pathname === link.to || (link.to === '/' && location.pathname === '/')
                    ? 'text-[#FF0033]/60'
                    : 'text-gray-600 group-hover:text-gray-500'
                }`}>{link.desc}</span>
              </div>
            </NavLink>
          </motion.div>
        ))}
      </nav>

    </div>
    </>
  );
}

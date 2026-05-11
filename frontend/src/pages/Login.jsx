import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import createGlobe from 'cobe';

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const canvasRef = useRef();

  // Initialize globe animation
  useEffect(() => {
    let phi = 0;
    
    if (!canvasRef.current) return;
      
    const width = window.innerWidth * 2;
    const height = window.innerHeight * 2;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width,
      height: height,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.1], // Dark grey/black land
      markerColor: [1, 0, 0.2],
      glowColor: [0.5, 0, 0.1], // Dark red glow
      markers: [],
      scale: 1.1,
      offset: [0, window.innerHeight * 0.2], // Shift down slightly
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      }
    });

    return () => {
      globe.destroy();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let hostname = window.location.hostname;
      if (hostname === 'localhost') hostname = '127.0.0.1';

      const response = await fetch(`http://${hostname}:3001/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        setError('Invalid credentials');
        return;
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('auth', 'true');
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
      setError('Login service unavailable');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Globe Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ pointerEvents: 'none', width: '100%', height: '100%', display: 'block' }} />

      {/* Vignette */}
      <div className="absolute inset-0 z-0 shadow-[inset_0_0_150px_rgba(0,0,0,1)] pointer-events-none" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-8 bg-black/60 backdrop-blur-xl border border-[#FF0033]/30 rounded-2xl shadow-[0_0_50px_-10px_rgba(255,0,51,0.2)]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#FF0033] blur-xl opacity-20 rounded-full animate-pulse" />
            <Fingerprint className="w-12 h-12 text-[#FF0033] relative z-10" />
          </div>
          <h2 className="text-2xl font-orbitron font-bold text-white tracking-wider">TRANA‑TRACE</h2>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-mono">Guardian Access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username or Gmail"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-[#111] border border-[#FF0033]/20 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF0033]/50 font-mono text-sm tracking-wider transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#111] border border-[#FF0033]/20 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF0033]/50 font-mono text-sm tracking-wider transition-colors"
            required
          />
          {error && <p className="text-[#FF0033] text-sm text-center font-mono tracking-wider animate-pulse">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 mt-4 bg-[#FF0033]/20 border border-[#FF0033]/50 hover:bg-[#FF0033]/40 text-[#FF0033] hover:text-white font-orbitron font-bold tracking-[0.2em] rounded transition-all duration-300 shadow-[0_0_15px_-5px_rgba(255,0,51,0.5)]"
          >
            INITIALIZE UPLINK
          </button>
        </form>
      </motion.div>
    </div>
  );
}

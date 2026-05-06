/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: "#FF0033",
        darkbg: "#000000",
        panel: "#050505",
        panellight: "#0A0A0A",
        offline: "#2A0000",
        'red-dim': "#330011",
        'red-mid': "#660022",
        surface: "#0A0A0A",
        'surface-light': "#111111",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace", "Consolas"],
      },
      boxShadow: {
        'glow': '0 0 15px 2px rgba(255, 0, 51, 0.5)',
        'glow-intense': '0 0 30px 10px rgba(255, 0, 51, 0.8)',
        'glow-subtle': '0 0 8px 1px rgba(255, 0, 51, 0.3)',
        'glow-sm': '0 0 5px 1px rgba(255, 0, 51, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(255, 0, 51, 0.1)',
      },
      dropShadow: {
        'glow': '0 0 10px rgba(255, 0, 51, 0.5)',
        'glow-intense': '0 0 20px rgba(255, 0, 51, 0.8)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}

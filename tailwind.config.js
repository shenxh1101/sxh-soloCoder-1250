/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0f',
          bgAlt: '#12121a',
          card: '#16161f',
          border: '#2a2a3a',
          primary: '#00ffd5',
          secondary: '#a855f7',
          error: '#ff4757',
          success: '#2ed573',
          warning: '#ffa502',
          text: '#e0e0e0',
          textMuted: '#888899',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 255, 213, 0.3), 0 0 20px rgba(0, 255, 213, 0.1)',
        'neon-purple': '0 0 10px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.1)',
        'neon-red': '0 0 10px rgba(255, 71, 87, 0.3), 0 0 20px rgba(255, 71, 87, 0.1)',
        'neon-green': '0 0 10px rgba(46, 213, 115, 0.3), 0 0 20px rgba(46, 213, 115, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.3s ease-in-out',
        'fadeInUp': 'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 213, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 213, 0.6), 0 0 30px rgba(0, 255, 213, 0.3)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

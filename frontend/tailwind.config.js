/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        exyo: {
          black: '#0B0B0B',
          dark: '#141414',
          darker: '#0B0B0B',
          surface: '#1A1A1A',
          hover: '#1F1F1F',
          gray: '#E5E5E5',
          muted: '#808080',
          red: '#E50914',
          'red-dark': '#B20710',
          'red-hover': '#F6121D',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '24px',
      },
      spacing: {
        'nav': '84px',
        'section': '80px',
      },
      screens: {
        '3xl': '1800px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slowZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        fadeIn: 'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        slowZoom: 'slowZoom 20s ease-out forwards',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to top, #0B0B0B 0%, rgba(11,11,11,0.85) 20%, rgba(11,11,11,0.4) 45%, transparent 100%)',
        'hero-gradient-left': 'linear-gradient(to right, rgba(11,11,11,0.95) 0%, rgba(11,11,11,0.6) 45%, transparent 100%)',
        'hero-gradient-top': 'linear-gradient(to bottom, rgba(11,11,11,0.4) 0%, transparent 30%)',
      },
      transitionTimingFunction: {
        'netflix': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

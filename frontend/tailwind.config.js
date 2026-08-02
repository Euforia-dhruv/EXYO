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
          black: '#0A0A0A',
          dark: '#141414',
          darker: '#0A0A0A',
          secondary: '#1A1A1A',
          gray: '#E5E5E5',
          muted: '#808080',
          red: '#E50914',
          'red-dark': '#B20710',
          'red-hover': '#F6121D',
          hover: '#2A2A2A',
          border: '#262626',
        },
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'hero-md': ['5.5rem', { lineHeight: '0.95', fontWeight: '800', letterSpacing: '-0.02em' }],
        'hero-lg': ['6.5rem', { lineHeight: '0.9', fontWeight: '800', letterSpacing: '-0.03em' }],
        'section': ['1.75rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.02em' }],
        'row-title': ['1.25rem', { lineHeight: '1.4', fontWeight: '700' }],
      },
      spacing: {
        'nav': '68px',
        'hero-content': '5vw',
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
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
        'hero-gradient': 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.8) 15%, rgba(20,20,20,0.4) 40%, rgba(20,20,20,0) 100%)',
        'hero-gradient-left': 'linear-gradient(to right, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.6) 50%, transparent 100%)',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
      borderRadius: {
        'netflix': '4px',
      },
      transitionTimingFunction: {
        'netflix': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

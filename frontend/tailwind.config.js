/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'exyo-red': '#E50914',
        'exyo-dark': '#141414',
        'exyo-secondary': '#1a1a1a',
        'exyo-gray': '#B3B3B3',
        'exyo-hover': '#404040',
      },
    },
  },
  plugins: [],
}

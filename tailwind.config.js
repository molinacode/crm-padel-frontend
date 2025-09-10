/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',      // slate-900
          surface: '#1e293b', // slate-800
          surface2: '#334155', // slate-700
          text: '#f1f5f9',   // slate-100
          text2: '#cbd5e1',  // slate-300
          border: '#475569',  // slate-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
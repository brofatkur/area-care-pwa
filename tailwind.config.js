/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        boffice: {
          blue: '#1e3a8a',
          dark: '#0f172a',
          surface: '#1e293b',
          border: '#334155'
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,ts,tsx}',
    './entrypoints/**/*.{html,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blurify: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          900: '#064e3b'
        }
      }
    }
  },
  plugins: []
};

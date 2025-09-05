/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.html",
    "./src/components/**/*.{ts,js}",
    "./src/engine/**/*.{ts,js}",
    "./src/types/**/*.{ts,js}"
  ],
  theme: {
    extend: {
      colors: {
        'excalidraw-primary': '#6965db',
        'excalidraw-gray': {
          10: '#f8f9fa',
          20: '#f1f3f4',
          30: '#e9ecef',
          40: '#dee2e6',
          50: '#ced4da',
          60: '#adb5bd',
          70: '#6c757d',
          80: '#495057',
          90: '#343a40',
          100: '#212529',
        }
      }
    },
  },
  plugins: [],
}

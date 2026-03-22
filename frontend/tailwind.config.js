/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        panel: '0 24px 80px rgba(2, 8, 23, 0.45)',
      },
    },
  },
  plugins: [],
}

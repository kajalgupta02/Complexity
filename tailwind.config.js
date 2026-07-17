/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use 'class' strategy for explicit dark mode toggle
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0eeff',
          100: '#e1deff',
          200: '#c7c1ff',
          300: '#a499ff',
          400: '#7c5cff', // Main accent color from original design
          500: '#6638ff',
          600: '#5821e7',
          700: '#4817be',
          800: '#3c1697',
          900: '#341578',
        },
        secondary: {
          400: '#21d4fd', // Secondary accent color from original design
        },
        success: {
          400: '#3ddc97',
        },
        warning: {
          400: '#ffcc00',
        },
        danger: {
          400: '#ff4d6d',
        },
      },
    },
  },
  plugins: [],
}

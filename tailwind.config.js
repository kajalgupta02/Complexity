/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: {
            DEFAULT: 'var(--color-bg-primary)',
            dark: 'var(--color-bg-primary-dark)',
          },
          secondary: {
            DEFAULT: 'var(--color-bg-secondary)',
            dark: 'var(--color-bg-secondary-dark)',
          },
          tertiary: {
            DEFAULT: 'var(--color-bg-tertiary)',
            dark: 'var(--color-bg-tertiary-dark)',
          },
          elevated: {
            DEFAULT: 'var(--color-bg-elevated)',
            dark: 'var(--color-bg-elevated-dark)',
          },
        },
        // Text colors
        text: {
          primary: {
            DEFAULT: 'var(--color-text-primary)',
            dark: 'var(--color-text-primary-dark)',
          },
          secondary: {
            DEFAULT: 'var(--color-text-secondary)',
            dark: 'var(--color-text-secondary-dark)',
          },
          tertiary: {
            DEFAULT: 'var(--color-text-tertiary)',
            dark: 'var(--color-text-tertiary-dark)',
          },
          muted: {
            DEFAULT: 'var(--color-text-muted)',
            dark: 'var(--color-text-muted-dark)',
          },
        },
        // Accent colors
        accent: {
          50: '#f0eeff',
          100: '#e1deff',
          200: '#c7c1ff',
          300: '#a499ff',
          400: '#7c5cff',
          500: '#6638ff',
          600: '#5821e7',
          700: '#4817be',
          800: '#3c1697',
          900: '#341578',
        },
        highlight: {
          50: '#e0fcff',
          100: '#c0f9ff',
          200: '#80f2ff',
          300: '#40ebff',
          400: '#00e4ff',
          500: '#00cbe6',
          600: '#00a3cc',
          700: '#007cb3',
          800: '#005499',
          900: '#002d80',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#3ddc97',
          500: '#10b981',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
        glow: 'var(--shadow-glow)',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      transitionTimingFunction: {
        'emphasized-in': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'emphasized-out': 'cubic-bezier(0.8, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

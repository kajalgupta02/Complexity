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
        surface: {
          base: 'var(--bg-base)',
          DEFAULT: 'var(--bg-surface)',
          overlay: 'var(--bg-overlay)',
        },
        'border-subtle': 'var(--border-subtle)',
        'accent-primary': 'var(--accent-primary)',
        'accent-glow': 'var(--accent-glow)',
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
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        highlight: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
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

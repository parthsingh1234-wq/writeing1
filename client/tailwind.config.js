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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36aff8',
          500: '#0c93e7',
          600: '#0275c5',
          700: '#035da1',
          800: '#074f85',
          900: '#0c426e',
          950: '#082a49',
        },
        vault: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.35)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

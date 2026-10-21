/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1220', // Background
          900: '#111C2E', // Secondary panels
          850: '#16233B', // Card surfaces
          800: '#1E2D4A', // Hover/elevated surfaces
          700: '#2A3C5F', // Active/selected states
        },
        border: {
          subtle: '#1E293B',
          DEFAULT: '#24344D',
          highlight: '#3B82F6',
        },
        cyan: {
          accent: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.25)',
      },
    },
  },
  plugins: [],
}

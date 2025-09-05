import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b0b0c',
          100: '#0f0f10',
          200: '#151517',
          300: '#1b1b1e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config



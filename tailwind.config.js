/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sb-dark': '#0f172a',
        'sb-card': '#1e293b',
        'sb-border': '#334155',
        'sb-accent': '#3b82f6',
        'sb-warn': '#f59e0b',
        'sb-danger': '#ef4444',
        'sb-success': '#22c55e',
        'sb-info': '#06b6d4',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

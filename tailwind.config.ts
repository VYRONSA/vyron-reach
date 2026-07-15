/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vyron: {
          dark: "#050D1A",      // Sidebar Dark
          navy: "#071A33",      // Sidebar Gradient
          blue: "#2563EB",      // Primary Blue
          cyan: "#22D3EE",      // Brand Cyan
          bg: "#F6F8FB",        // Premium Background
          text: "#0F172A",      // Primary Text
          muted: "#64748B",     // Muted Text
        }
      },
      borderRadius: {
        'card': '28px',
        'panel': '34px',
      },
      boxShadow: {
        'vyron': '0 20px 40px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
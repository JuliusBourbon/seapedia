/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        text: '#0F172A',
        textSecondary: '#64748B',
        background: '#F8FAFC',
        backgroundElement: '#FFFFFF',
        backgroundSelected: '#E2E8F0',
        border: '#E2E8F0',
        card: '#FFFFFF',
        placeholder: '#94A3B8',
        primary: {
          DEFAULT: '#0D9488', // Teal 600
          muted: '#2DD4BF', // Teal 400
          mutedDark: '#14B8A6', // Teal 500
        },
        secondary: {
          DEFAULT: '#0EA5E9', // Sky 500
          dark: '#38BDF8', // Sky 400
        },
        success: {
          DEFAULT: '#10B981', // Emerald 500
          dark: '#34D399', // Emerald 400
        },
        danger: {
          DEFAULT: '#EF4444', // Red 500
          dark: '#F87171', // Red 400
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber 500
          dark: '#FBBF24', // Amber 400
        },
      },
    },
  },
  plugins: [],
};

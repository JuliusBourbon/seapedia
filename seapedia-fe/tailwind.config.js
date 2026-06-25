/** @type {import('tailwindcss').Config} */
const { Colors } = require('./src/constants/colors');
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // Safelist to fix bug that Tailwind not compiling classes
  safelist: [
    {
      pattern: /(bg|text|border)-(primary|secondary|tertiary|neutral|primaryShades|secondaryShades|tertiaryShades)(-\d+)?/,
    },
    {
      pattern: /^[pm][trblxy]?-\d+$/,
    },
    {
      pattern: /^(font|text)-(thin|light|normal|medium|semibold|bold|extrabold|sm|base|lg|xl|2xl|3xl|4xl)$/,
    },
    {
      pattern: /^flex-(row|col|1|wrap)$/,
    },
    {
      pattern: /^[wh]-.+$/,
    }
  ],

  theme: {
    extend: {
      colors: {
        ...Colors,
      },
    },
  },
  plugins: [],
};

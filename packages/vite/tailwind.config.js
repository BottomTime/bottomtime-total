import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  backgroundImage: "url('/reef-tortuga.webp')",
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,

      grey: colors.stone,
      blue: colors.blue,
      red: colors.red[600],

      primary: colors.sky[500],
      secondary: colors.sky[200],
      warn: colors.amber[500],
      danger: colors.red[500],
      success: colors.emerald[500],
      link: {
        hover: colors.teal[500],
        DEFAULT: colors.teal[600],
      },
    },
    fontFamily: {
      content: [
        'Rubik',
        'system-ui',
        'Avenir',
        'Helvetica',
        'Arial',
        'sans-serif',
      ],
      title: [
        'Exo',
        'Impact',
        'Haettenschweiler',
        'Arial Narrow Bold',
        'sans-serif',
      ],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {},
  },
  plugins: [],
};

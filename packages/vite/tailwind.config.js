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

      primary: {
        dark: colors.blue[600],
        hover: colors.blue[300],
        DEFAULT: colors.sky[500],
      },
      secondary: {
        dark: colors.sky[400],
        hover: colors.sky[100],
        DEFAULT: colors.sky[200],
      },
      warn: {
        dark: colors.amber[600],
        hover: colors.amber[400],
        DEFAULT: colors.amber[500],
      },
      danger: {
        dark: colors.red[500],
        hover: colors.red[300],
        DEFAULT: colors.red[400],
      },
      success: colors.emerald[500],
      link: {
        hover: colors.teal[500],
        DEFAULT: colors.teal[600],
      },
    },
    fontFamily: {
      content: [
        'Alegreya Sans',
        'system-ui',
        'Avenir',
        'Helvetica',
        'Arial',
        'sans-serif',
      ],
      title: ['"Exo 2"', 'Lobster', 'Arial Narrow Bold', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      backgroundImage: {
        tortuga: "url('/img/reef-tortuga.webp')",
        lionfish: "url('/img/lion-fish.webp')",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{mst,ts}'],
  theme: {
    fontFamily: {
      content: [
        '"Alegreya Sans"',
        'system-ui',
        'Avenir',
        'Helvetica',
        'Arial',
        'sans-serif',
      ],
      title: ['"Exo 2"', 'Lobster', 'Arial Narrow Bold', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {},
  },
  plugins: [],
};

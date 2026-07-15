/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // blood-red brand color
          dark: '#991B1B',
          light: '#FCA5A5',
        },
      },
    },
  },
  plugins: [],
};

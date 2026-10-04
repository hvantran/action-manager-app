/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@hvantran/ui-component-library/preset')],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@hvantran/ui-component-library/**/*.{js,mjs,ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [],
};

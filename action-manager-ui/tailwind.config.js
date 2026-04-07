/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          secondary: '#4b5563',
        },
      },
    },
  },
  plugins: [],
}


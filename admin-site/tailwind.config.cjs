/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#091413',
        primary: {
          DEFAULT: '#285A48',
          dark: '#1e4537',
          light: '#408A71',
        },
        secondary: '#408A71',
        accent: '#B0E4CC',
        surface: '#112220',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

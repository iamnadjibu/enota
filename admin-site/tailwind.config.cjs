/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../shared/theme/tailwind-preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/**/*.{js,jsx}',
  ],
  plugins: [require('@tailwindcss/typography')],
}

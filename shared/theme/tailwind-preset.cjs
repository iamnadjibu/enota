/**
 * Shared Tailwind preset for the public site and the admin site.
 * Colours are taken from the eNOTA logo.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#06110E',
        surface: { DEFAULT: '#0D1D19', light: '#132823' },
        primary: { DEFAULT: '#035F40', dark: '#024A32', light: '#17815D' },
        secondary: '#17815D',
        accent: { DEFAULT: '#93E2BA', soft: '#C6F0DA' },
        ink: '#F4FBF8',
        muted: '#A8BDB4', // readable secondary text on dark (≈ 9:1)
        subtle: '#7E968C', // hints and captions (≈ 5.6:1)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(147, 226, 186, 0.35)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  // plugins are added by each app's tailwind.config (they resolve their own node_modules)
}

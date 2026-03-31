/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#C8F135',
          dark: '#a8d020',
        },
        surface: {
          DEFAULT: '#111111',
          card: '#1A1A1A',
          border: '#2A2A2A',
        },
      },
      animation: {
        'bar-fill': 'barFill 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        barFill: { from: { width: '0%' }, to: { width: 'var(--bar-width)' } },
        pop: { '0%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

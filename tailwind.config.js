/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712', // deeper dark
          900: '#0B1220', // main background (soft dark)
          850: '#0F172A', // sub-surface
          800: '#111827', // cards/surfaces
          700: '#1F2937', // card hover/lighter surface
          600: '#374151', // muted borders
        },
        brand: {
          primary: '#3B82F6', // modern SaaS blue
          secondary: '#94A3B8', // muted secondary text
          accent: '#22C55E', // success green
          'grad-start': '#22C55E',
          'grad-mid': '#06B6D4',
          'grad-end': '#3B82F6',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #22C55E, #06B6D4, #3B82F6)',
      },
      boxShadow: {
        'saas-card': '0 10px 25px rgba(0, 0, 0, 0.3)',
        'saas-hover': '0 20px 35px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

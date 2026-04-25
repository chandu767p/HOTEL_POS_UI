/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#111827',
        border: '#1f2937',
        text: {
          primary: '#f1f5f9', // slate-100
          secondary: '#94a3b8', // slate-400
          muted: '#64748b', // slate-500
        },
        brand: {
          primary: '#3b82f6', // blue-500
          success: '#10b981', // emerald-500
          warning: '#f59e0b', // amber-500
          danger: '#ef4444', // red-500
          info: '#6366f1', // indigo-500
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'flat': 'none',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};

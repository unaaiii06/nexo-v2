/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        fg: 'rgb(var(--fg) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent-2) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        'on-accent': 'var(--on-accent)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Las esquinas escalan con la personalización (--rk)
      borderRadius: {
        md: 'calc(0.375rem * var(--rk, 1))',
        lg: 'calc(0.5rem * var(--rk, 1))',
        xl: 'calc(0.75rem * var(--rk, 1))',
        '2xl': 'calc(1rem * var(--rk, 1))',
        '3xl': 'calc(1.5rem * var(--rk, 1))',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      screens: { xs: '400px' },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{vue,ts}', './dashboard.html', './sidepanel.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#4F46E5',
          700: '#4338CA'
        }
      }
    }
  },
  plugins: []
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17241f',
        forest: '#183c32',
        leaf: '#d7ee8b',
        cream: '#f7f8f4',
        muted: '#78827c',
        line: '#e8ece6',
      },
      boxShadow: {
        soft: '0 12px 35px rgba(25, 44, 34, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

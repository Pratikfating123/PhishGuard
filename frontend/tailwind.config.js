/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#176B63', deep: '#10564F', mint: '#E7F5E9', pale: '#F1F8F1', soft: '#F7FAF8' },
        ink: { DEFAULT: '#172B29', muted: '#5C6B67' },
        line: '#E5ECE8',
        danger: '#C83D4D', warning: '#D99227', success: '#26815F', info: '#3478B9',
      },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
}

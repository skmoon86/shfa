/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 동물의 숲 느낌의 부드러운 팔레트
        leaf: {
          50: '#f1faec',
          100: '#dff3d3',
          200: '#bfe6a8',
          300: '#97d275',
          400: '#73bd4d',
          500: '#56a232',
          600: '#418125',
          700: '#346320',
          800: '#2c4f1f',
          900: '#26431e',
        },
        sand: {
          50: '#fbf7ee',
          100: '#f3ead2',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

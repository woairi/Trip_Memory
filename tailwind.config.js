/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

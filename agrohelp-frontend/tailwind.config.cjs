/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Arial'],
        display: ['Poppins', 'Inter', 'ui-sans-serif'],
      },
      colors: {
        leaf: { 50: '#eef9f1', 100: '#d8f1e1', 200: '#aee0c1', 300: '#83cea1', 400: '#57bd82', 500: '#2cad63', 600: '#1f8c4e', 700: '#176b3b', 800: '#0f4a28', 900: '#092d19' },
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(34,197,94,.35)',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 20 20'><path fill='%23eee' d='M0 0h1v1H0z'/></svg>\")",
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#1a1d27',
        surface2: '#22263a',
        border: '#2e3350',
      }
    },
  },
  plugins: [],
}

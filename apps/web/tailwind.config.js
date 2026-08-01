/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        news: ["Iowan Old Style", "Baskerville", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"]
      },
      boxShadow: {
        paper: "0 24px 50px -32px rgba(15, 23, 42, 0.25)"
      }
    }
  },
  plugins: []
};

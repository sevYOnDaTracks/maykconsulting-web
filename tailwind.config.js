/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Outfit", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 64px rgba(0, 194, 168, 0.26)",
      },
    },
  },
  plugins: [],
};

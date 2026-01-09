/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./contexts/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#2ECC71",
        "background-light": "#F8F9FA",
        "background-dark": "#101828",
        "content-dark": "#182235",
        "border-dark": "#374151",
        "instagram-purple": "#833AB4",
        "instagram-red": "#E1306C",
        "instagram-orange": "#F77737",
      },
      fontFamily: {
        "display": ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}
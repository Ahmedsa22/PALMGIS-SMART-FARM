/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette PalmGIS — vert palmier + accent doré
        primary: {
          50:  "#e7efe8",
          100: "#c3d9c5",
          200: "#9dc19f",
          300: "#75a878",
          400: "#559758",
          500: "#2E5E3E",  // couleur principale
          600: "#285536",
          700: "#20472c",
          800: "#183922",
          900: "#0e2a17",
        },
        accent: {
          DEFAULT: "#B08D57",  // doré dattes
          light:   "#c9a96e",
          dark:    "#8a6d3e",
        },
      },
    },
  },
  plugins: [],
}
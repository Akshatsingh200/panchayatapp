/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  "#fff8f0",
          100: "#fdecd6",
          200: "#fad4a4",
          300: "#f6b467",
          400: "#f19032",
          500: "#ee7612",
          600: "#df5b08",
          700: "#b8430a",
          800: "#933611",
          900: "#772e11",
        },
        soil: {
          50:  "#faf5f0",
          100: "#f3e8da",
          200: "#e7cfb2",
          300: "#d6ae83",
          400: "#c38a53",
          500: "#b67035",
          600: "#a95c2a",
          700: "#8c4624",
          800: "#723924",
          900: "#5e3020",
        },
        leaf: {
          50:  "#f2f8f0",
          100: "#dfeedd",
          200: "#c0debb",
          300: "#93c58e",
          400: "#64a65e",
          500: "#448840",
          600: "#336d30",
          700: "#2a5727",
          800: "#244622",
          900: "#1e3b1d",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Roboto", "sens-serif"],
        poppins: ["Poppins", "sens-serif"],
        space: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        primary: "#000000",
        secondary: "#FFB727",
      },
      opacity: {
        10: "0.1",
        20: "0.2",
        30: "0.3",
        40: "0.4",
        50: "0.5",
        60: "0.6",
        70: "0.7",
        80: "0.8",
        90: "0.9",
      },
      animation: {
        "custom-bounce": "bounce-in-parent 2s infinite",
        zoom: "zoom 1s ease-in-out infinite", // 👈 New zoom animation
        "spin-pause": "spin-pause 5s ease-in-out infinite", // 👈 New spin animation
      },
      keyframes: {
        "bounce-in-parent": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        zoom: {
          // 👈 New zoom keyframes
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "spin-pause": {
          // 👈 New spin keyframes
          "0%, 20%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(360deg)" },
          "80%, 100%": { transform: "rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};

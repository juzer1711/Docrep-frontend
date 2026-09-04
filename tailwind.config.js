/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          900: "#1C2321",
          700: "#3A4440",
          500: "#5C6B65",
          200: "#D8DCD9"
        },
        paper: {
          50: "#F7F6F3",
          100: "#EFEDE7"
        },
        amber: {
          600: "#C9862B",
          500: "#E8A33D",
          100: "#FBE7C6"
        },
        moss: {
          600: "#3F6650",
          100: "#DCEAE1"
        },
        rust: {
          600: "#B5482F",
          100: "#F5DAD2"
        },
        sky: {
          600: "#3D6B8C",
          100: "#DCE7EE"
        }
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"]
      },
      minHeight: {
        touch: "48px"
      }
    }
  },
  plugins: []
};

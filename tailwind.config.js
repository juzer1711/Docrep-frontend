/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        // Texto, títulos y elementos estructurales
        graphite: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          200: "#CBD5E1",
        },

        // Fondos generales de la aplicación
        paper: {
          50: "#F8FAFC",
          100: "#F1F5F9",
        },

        // Azul institucional DOCREP
        // Uso: botones principales, enlaces, foco y acciones
        sky: {
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          100: "#DBEAFE",
        },

        // Verde institucional
        // Uso: estados correctos, recepción validada,
        // confirmaciones y acciones exitosas
        moss: {
          700: "#047857",
          600: "#059669",
          500: "#10B981",
          100: "#D1FAE5",
        },

        // Errores y estados críticos
        rust: {
          700: "#B91C1C",
          600: "#DC2626",
          500: "#EF4444",
          100: "#FEE2E2",
        },

        // Acento secundario.
        // Se conserva para no romper componentes existentes,
        // pero deja de ser el color principal de la aplicación.
        amber: {
          600: "#2563EB",
          500: "#3B82F6",
          100: "#DBEAFE",
        },
      },

      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },

      minHeight: {
        touch: "48px",
      },
    },
  },

  plugins: [],
};
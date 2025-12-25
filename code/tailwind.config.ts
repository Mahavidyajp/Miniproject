import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        safe: {
          DEFAULT: "hsl(var(--safe))",
          foreground: "hsl(var(--safe-foreground))",
        },
        alert: {
          DEFAULT: "hsl(var(--alert))",
          foreground: "hsl(var(--alert-foreground))",
        },
        emergency: {
          DEFAULT: "hsl(var(--emergency))",
          foreground: "hsl(var(--emergency-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        calc: {
          bg: "hsl(var(--calc-bg))",
          display: "hsl(var(--calc-display))",
          button: "hsl(var(--calc-button))",
          "button-hover": "hsl(var(--calc-button-hover))",
          operator: "hsl(var(--calc-operator))",
          "operator-hover": "hsl(var(--calc-operator-hover))",
          text: "hsl(var(--calc-text))",
          "text-muted": "hsl(var(--calc-text-muted))",
        },
        notes: {
          bg: "hsl(var(--notes-bg))",
          card: "hsl(var(--notes-card))",
          border: "hsl(var(--notes-border))",
          hover: "hsl(var(--notes-hover))",
          text: "hsl(var(--notes-text))",
          muted: "hsl(var(--notes-muted))",
          accent: "hsl(var(--notes-accent))",
          "accent-foreground": "hsl(var(--notes-accent-foreground))",
        },
        weather: {
          bg: "hsl(var(--weather-bg))",
          card: "hsl(var(--weather-card))",
          border: "hsl(var(--weather-border))",
          hover: "hsl(var(--weather-hover))",
          "text-dark": "hsl(var(--weather-text-dark))",
          "text-muted": "hsl(var(--weather-text-muted))",
          accent: "hsl(var(--weather-accent))",
          "sky-light": "hsl(var(--weather-sky-light))",
          "sky-dark": "hsl(var(--weather-sky-dark))",
          text: "hsl(var(--weather-text))",
          sun: "hsl(var(--weather-sun))",
          cloud: "hsl(var(--weather-cloud))",
          rain: "hsl(var(--weather-rain))",
          snow: "hsl(var(--weather-snow))",
          storm: "hsl(var(--weather-storm))",
          wind: "hsl(var(--weather-wind))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

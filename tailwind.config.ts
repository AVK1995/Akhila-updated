import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Brand palette — premium clinical feminine
        cream: {
          50: "#FDFBF7",
          100: "#FAF6EE",
          200: "#F5EFE2",
          300: "#EDE3CE",
          400: "#E0D2B2",
        },
        wine: {
          50: "#FBF3F5",
          100: "#F5E1E6",
          200: "#E7BCC5",
          300: "#D592A0",
          400: "#B85F73",
          500: "#933D52",
          600: "#732A3D",
          700: "#5A1E30",
          800: "#421624",
          900: "#2D0E18",
        },
        gold: {
          50: "#FBF7EC",
          100: "#F5EDD0",
          200: "#EDDFA1",
          300: "#E2CB6E",
          400: "#D4B247",
          500: "#C19632",
          600: "#A07825",
          700: "#7C5B1E",
          800: "#5A431B",
          900: "#3D2D14",
        },
        ink: {
          50: "#F7F4F2",
          100: "#E7E0DC",
          200: "#C9BCB4",
          300: "#A89589",
          400: "#7E6B61",
          500: "#5D4D45",
          600: "#433732",
          700: "#2E2522",
          800: "#1A1412",
          900: "#0D0908",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display tokens — tightened for a premium, less-shouty feel.
        // Cap sizes reduced by ~25-30% from initial scale so headlines read
        // as refined editorial rather than ad-billboard.
        "display-2xl": ["clamp(1.85rem, 4vw + 0.65rem, 3.25rem)", { lineHeight: "1.04", letterSpacing: "-0.024em" }],
        "display-xl":  ["clamp(1.6rem, 3vw + 0.55rem, 2.5rem)",   { lineHeight: "1.08", letterSpacing: "-0.021em" }],
        "display-lg":  ["clamp(1.4rem, 2.2vw + 0.5rem, 2rem)",    { lineHeight: "1.12", letterSpacing: "-0.018em" }],
        "display-md":  ["clamp(1.2rem, 1.6vw + 0.4rem, 1.55rem)", { lineHeight: "1.18", letterSpacing: "-0.014em" }],
      },
      letterSpacing: {
        "tightest-2": "-0.035em",
      },
      boxShadow: {
        "premium-sm": "0 1px 2px 0 rgba(45, 14, 24, 0.04), 0 1px 3px 0 rgba(45, 14, 24, 0.06)",
        "premium": "0 2px 4px -1px rgba(45, 14, 24, 0.04), 0 8px 24px -4px rgba(45, 14, 24, 0.08)",
        "premium-lg": "0 4px 8px -2px rgba(45, 14, 24, 0.05), 0 16px 40px -8px rgba(45, 14, 24, 0.12)",
        "premium-xl": "0 8px 16px -4px rgba(45, 14, 24, 0.06), 0 32px 64px -12px rgba(45, 14, 24, 0.16)",
        "gold-glow": "0 0 0 1px rgba(193, 150, 50, 0.12), 0 8px 24px -8px rgba(193, 150, 50, 0.3)",
        "wine-glow": "0 0 0 1px rgba(115, 42, 61, 0.16), 0 12px 32px -10px rgba(115, 42, 61, 0.4)",
        "inset-soft": "inset 0 1px 2px rgba(45, 14, 24, 0.04)",
      },
      backgroundImage: {
        "cream-grain": "radial-gradient(at 30% 20%, rgba(245, 239, 226, 0.6) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(237, 223, 161, 0.25) 0px, transparent 50%)",
        "wine-gradient": "linear-gradient(135deg, #5A1E30 0%, #732A3D 50%, #933D52 100%)",
        "gold-gradient": "linear-gradient(135deg, #D4B247 0%, #C19632 50%, #A07825 100%)",
        "section-fade": "linear-gradient(180deg, transparent 0%, rgba(250, 246, 238, 0.8) 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.8s ease-out both",
        "shimmer": "shimmer 2.5s linear infinite",
        "shimmer-slow": "shimmer 6s linear infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "float-soft": "floatSoft 9s ease-in-out infinite",
        "pulse-ring": "pulseRing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-ring-strong": "pulseRingStrong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "marquee": "marquee 45s linear infinite",
        "marquee-fast": "marquee 28s linear infinite",
        "breathe": "breathe 3.2s ease-in-out infinite",
        "drift-up": "driftUp 14s linear infinite",
        "sheen": "sheen 2.8s ease-in-out infinite",
        "gradient-pan": "gradientPan 8s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        floatSoft: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(8px, -12px) scale(1.04)" },
          "66%": { transform: "translate(-6px, -6px) scale(0.98)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        pulseRingStrong: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 12px 32px -10px rgba(115, 42, 61, 0.45), 0 0 0 0 rgba(193, 150, 50, 0.6)" },
          "50%": { transform: "scale(1.035)", boxShadow: "0 18px 44px -12px rgba(115, 42, 61, 0.55), 0 0 0 12px rgba(193, 150, 50, 0)" },
        },
        driftUp: {
          "0%": { transform: "translateY(20px) translateX(0) scale(0.6)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translateY(-120vh) translateX(20px) scale(1)", opacity: "0" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)", opacity: "0" },
          "30%": { opacity: "0.45" },
          "100%": { transform: "translateX(220%) skewX(-12deg)", opacity: "0" },
        },
        gradientPan: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

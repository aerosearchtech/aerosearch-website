import type { Config } from "tailwindcss";
import { colors } from "./src/theme/colors";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: colors.night,
        soil: colors.soil,
        ridge: colors.ridge,
        line: colors.line,
        bone: colors.bone,
        "bone-muted": colors.boneMuted,
        "bone-faint": colors.boneFaint,
        signal: colors.signal,
        "signal-dim": colors.signalDim,
        survey: colors.survey,
        mark: colors.mark,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        mark: ["var(--font-mark)", "var(--font-sans)", "sans-serif"],
      },
      letterSpacing: {
        label: "0.2em",
        wide: "0.32em",
      },
      maxWidth: {
        content: "1240px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        // Gimbal slew: a scan footprint tracking across the ground.
        slew: {
          "0%, 100%": { transform: "translateX(-38%)" },
          "50%": { transform: "translateX(38%)" },
        },
        // Two identical halves; -50% lands exactly on the seam.
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // The mark under load. Clockwise, because it is a rotorcraft from above.
        rotor: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "hold-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
        slew: "slew 9s ease-in-out infinite",
        marquee: "marquee 42s linear infinite",
        rotor: "rotor 1.4s linear infinite",
        // `both` keeps it invisible through the delay, so a scene that arrives
        // quickly never flashes a loader on its way in.
        "hold-in": "hold-in 0.35s ease-out 0.25s both",
      },
    },
  },
  plugins: [],
};

export default config;

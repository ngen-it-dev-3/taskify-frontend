// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // ... other config
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
    },
  },
};

export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        storm: "#0f3d5e",
        surge: "#1d4ed8",
        ember: "#b45309",
        alert: "#b91c1c",
        mist: "#e2e8f0",
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#112239",
        mist: "#d9ecff",
        sky: "#7bc2ff",
        sun: "#ffd166",
        coral: "#ff8a5b",
        pine: "#1c5d4f",
      },
      boxShadow: {
        card: "0 18px 45px rgba(17, 34, 57, 0.10)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(17,34,57,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17,34,57,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;

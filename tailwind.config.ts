import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      primary: "hsl(151, 67%, 72%)",
      secondary: "hsl(132, 34%, 56%)",
      accent: "hsl(157, 13%, 66%)",
      accent2: "hsl(131, 8%, 58%)",
      white: "hsl(68, 53%, 92%)",
      black: "hsl(220, 24%, 12%)",
      gray: "hsl(60, 9%, 32%)",
      danger: "hsl(348, 63%, 65%)",
      warn: "hsl(40, 100%, 67%)",
      info: "hsl(200, 100%, 49%)",
    },
    extend: {},
  },
  plugins: [],
} satisfies Config;

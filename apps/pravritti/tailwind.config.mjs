import preset from "@pravritti/config/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
};

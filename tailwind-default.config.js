/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,css}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    fontFamily: {
      body: ['var(--font-roboto)', 'sans-serif'],
      heading: ['var(--font-playfair)', 'serif'],
    },
  },
};

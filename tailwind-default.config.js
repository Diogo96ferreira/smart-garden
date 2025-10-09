/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx,css}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#0f172a', // texto padrão
        primary: {
          DEFAULT: '#22c55e', // verde principal 🌿
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f0fdf4', // verde muito claro
          foreground: '#166534', // texto verde escuro
        },
        accent: {
          DEFAULT: '#86efac', // verde suave para hover/detalhes
          foreground: '#065f46',
        },
        muted: {
          DEFAULT: '#d1fae5', // verde pastel (borda e backgrounds)
          foreground: '#064e3b',
        },
        border: '#e5e7eb',
        destructive: '#ef4444',
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      fontFamily: {
        body: ['var(--font-roboto)', 'sans-serif'],
        heading: ['var(--font-fredoka)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

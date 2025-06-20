/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lato)'],
        serif: ['var(--font-eb-garamond)'],
      },
      colors: {
        primary: '#2c3e50',
        background: '#f8f4e9',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 
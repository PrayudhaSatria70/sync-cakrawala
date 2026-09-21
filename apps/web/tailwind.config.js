/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: '#16324F',
        teal: '#087EA4',
        cyan: '#DDF3F8',
        success: '#18A874',
        warning: '#F4A62A',
        danger: '#EF6A6A',
        surface: '#F3F8FC',
        border: '#DCE7EF',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

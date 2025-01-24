/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './static/src/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
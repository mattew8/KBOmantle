/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        kbo: {
          blue: '#1e3a8a',
          green: '#059669',
          orange: '#ea580c',
        }
      }
    }
  },
  plugins: []
};
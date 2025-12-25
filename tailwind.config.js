/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spotify-inspired dark palette
        'mosh': {
          'black': '#000000',
          'darker': '#121212',
          'dark': '#181818',
          'card': '#282828',
          'hover': '#333333',
          'border': '#404040',
          'muted': '#6b7280',
          'text': '#b3b3b3',
          'light': '#ffffff',
          'accent': '#1db954', // Spotify green
          'accent-hover': '#1ed760',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Paths are now relative to this file (which is in src/renderer)
  content: [
    './**/*.{js,ts,jsx,tsx,html}',
    './index.html'
  ],
  darkMode: 'class', // Enable dark mode based on class
  theme: {
    extend: {
      colors: {
        // Based on the Shuttle Details mockups
        "primary": "#007ACC",
        
        "background-light": "#F0F0F0",
        "background-dark": "#1E1E1E",
        
        "panel-light": "#FFFFFF",
        "panel-dark": "#2A2A2A",

        // Using "surface" for the dashboard-specific card backgrounds
        "surface-light": "#FFFFFF",
        "surface-dark": "#2A2A2A", 

        "border-light": "#E0E0E0",
        "border-dark": "#3C3C3C",
        
        "text-light-primary": "#1F1F1F",
        "text-dark-primary": "#D4D4D4",
        
        "text-light-secondary": "#6B7280",
        "text-dark-secondary": "#9CA3AF",

        // Add colors for consistency
        "amber": {
          "400": "#fbbf24",
          "500": "#f59e0b",
          "600": "#d97706"
        },
      },
      fontFamily: {
        "display": ["Inter", ...fontFamily.sans],
        "mono": ["Roboto Mono", ...fontFamily.mono]
      },
      borderRadius: {
        "lg": "0.5rem",
        "xl": "0.75rem",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/js/**/*.{js,jsx,ts,tsx}",
    "./resources/views/**/*.blade.php",
    "./app/**/*.php",
    "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#041562',
        'brand-blue': '#11468F',
        'brand-blue-hover': '#0d3873',
        'brand-red': '#DA1212',
        'brand-red-hover': '#b00f0f',
        'brand-neutral': '#EEEEEE',
        'brand-neutral-border': '#EEEEEE',
        'primary-dark': '#041562',
        'primary': '#11468F',
        'accent': '#DA1212',
        'neutral-light': '#EEEEEE',
      },
      borderRadius: {
        'sm': '3px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'pill': '9999px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      fontFamily: {
        'sans': ['Inter', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(4, 21, 98, 0.05), 0 1px 2px -1px rgba(4, 21, 98, 0.05)',
        'card': '0 2px 4px 0 rgba(4, 21, 98, 0.06), 0 1px 2px -1px rgba(4, 21, 98, 0.04)',
        'elevated': '0 10px 15px -3px rgba(4, 21, 98, 0.08), 0 4px 6px -4px rgba(4, 21, 98, 0.04)',
      },
    },
  },
  plugins: [],
} 
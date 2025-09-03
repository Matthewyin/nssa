/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./public/**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        'apple-blue': '#007AFF',
        'apple-gray': '#8E8E93',
        'apple-light-gray': '#F2F2F7',
      },
      maxWidth: {
        '6xl': '72rem',
        '7xl': '80rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'apple': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'apple-dark': '0 4px 20px rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

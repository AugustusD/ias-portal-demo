import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      tablet: '768px',
      md: '768px',
      desktop: '1025px',
      lg: '1025px',
      xl: '1280px',
      wide: '1440px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        gold: {
          DEFAULT: '#B69A5A',
          hover: '#A08A4A',
          light: '#CDB47A',
          dark: '#8A7440',
        },
        yellow: {
          DEFAULT: '#f3cf47',
          hover: '#e6bf2f',
        },
        cream: {
          DEFAULT: '#F9F6F0',
          dark: '#F0EBE1',
        },
        offwhite: '#F5F2EE',
        ink: {
          DEFAULT: '#0A0908',
          soft: '#1A1916',
        },
        stone: {
          50: '#FAFAF9',
          100: '#F5F2EE',
          200: '#E8E3DB',
          300: '#CEC6BA',
          400: '#A89D8E',
          500: '#8A7D6E',
          600: '#6B5E4F',
          700: '#4E4337',
          800: '#332C23',
          900: '#1A1611',
        },
      },
      fontFamily: {
        heading: ['var(--font-ubuntu)', 'sans-serif'],
        body: ['var(--font-titillium)', 'sans-serif'],
      },
      maxWidth: {
        container: '1440px',
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base/Background
        cream: {
          50: '#FFFDF9',
          100: '#FFF9F0',
          200: '#FFF5E5',
          300: '#FFF0DA',
          400: '#FFEBD0',
          500: '#FFE6C5',
        },
        // Primary (Sage/Olive)
        sage: {
          50: '#F4F7F4',
          100: '#E8EFE8',
          200: '#D1DFD1',
          300: '#8FB48F',
          400: '#658F65',
          500: '#4A724A',
          600: '#3B5C3B',
          700: '#2C452C',
        },
        // Secondary/Accent (Terracotta)
        terracotta: {
          50: '#FBF3F1',
          100: '#F7E6E2',
          200: '#EECDC5',
          300: '#D18E7C',
          400: '#B36452',
          500: '#A04B24',
          600: '#8A3F1F',
          700: '#6D3219',
        },
        // Primary Accent (Ochre)
        ochre: {
          50: '#FDF8F2',
          100: '#FAEFDE',
          200: '#F5DFBD',
          300: '#E5B06E',
          400: '#CC8736',
          500: '#CC6F1A',
          600: '#B35A0F',
          700: '#8C460D',
        },
        // Secondary Accent (Muted Lavender)
        lavender: {
          50: '#F7F6FA',
          100: '#EEEAF5',
          200: '#DDD5EB',
          300: '#B2A4D4',
          400: '#9B8BC4',
          500: '#8471B4',
          600: '#6D5A9D',
          700: '#564579',
        },
        // Warm Gray/Taupe Scale
        taupe: {
          50: '#F8F7F7',
          100: '#F0EFEF',
          200: '#E1DFDF',
          300: '#BFBCBC',
          400: '#847E82',
          500: '#6C686C',
          600: '#555255',
          700: '#3E3C3E',
        },
        // Neutrals/Text
        charcoal: {
          50: '#F5F6F7',
          100: '#EBEDEF',
          200: '#D8DDE2',
          300: '#1F2C36',
          400: '#1E2A33',
          500: '#15202A',
          600: '#0D161D',
          700: '#060D12',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
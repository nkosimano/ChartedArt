/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Production Color Palette (v2, 2025)
        
        // Primary Brand - Sage (hsl(120, 17%, 38%) = #517267)
        sage: {
          50: '#F2F7F2',
          100: '#E4EFE4',
          200: '#C9DFC9',
          300: '#8FBC8F',
          400: '#517267', // Primary brand color
          500: '#4A794A',
          600: '#3C633C',
          700: '#2E4C2E',
        },
        
        // Background - Cream (hsl(48, 100%, 97%) = #FFF8E2)
        cream: {
          50: '#FFF8E2', // Primary background
          100: '#FFF3D6',
          200: '#FAF3E0',
        },
        
        // Accent - Terracotta (hsl(18, 53%, 54%) = #DB866B)
        terracotta: {
          50: '#FDF4F2',
          100: '#FAE9E5',
          200: '#F5D3CB',
          300: '#E97451',
          400: '#DB866B', // Accent color
          500: '#B44726',
          600: '#933A1F',
          700: '#722C18',
        },
        
        // Support - Lavender (hsl(245, 35%, 74%) = #B8A9D0)
        lavender: {
          50: '#F5F3F9',
          100: '#EBE7F3',
          200: '#D7CFE7',
          300: '#B8A9D0', // Support color
          400: '#9A87BD',
          500: '#7C65AA',
          600: '#5E4397',
          700: '#4A3578',
        },
        
        // Text/UI - Charcoal (hsl(217, 19%, 27%) = #33424B)
        charcoal: {
          50: '#F5F6F7',
          100: '#EBEDEF',
          200: '#D7DBDF',
          300: '#33424B', // Primary text
          400: '#2C3841',
          500: '#232E35',
          600: '#1A242A',
          700: '#131B20',
        },
        
        // Success - Soft Green (hsl(122, 39%, 49%) = #57AA7A)
        green: {
          50: '#F0F9F4',
          100: '#D3EEDD', // Light success background
          200: '#A7DDB8',
          300: '#7BCC93',
          400: '#57AA7A', // Success color
          500: '#4A9368',
          600: '#3D7C56',
          700: '#306544',
        },
        
        // Error - Warming Red (hsl(4, 64%, 52%) = #E05E5E)
        red: {
          50: '#FEF2F2',
          100: '#FDE8E1', // Light error background
          200: '#FBD1C8',
          300: '#F9BAAF',
          400: '#E05E5E', // Error color
          500: '#C74545',
          600: '#AE2C2C',
          700: '#951313',
        },
        
        // Warning - Amber (hsl(43, 90%, 55%) = #FAC82C)
        amber: {
          50: '#FFFBF0',
          100: '#FFF8E1', // Light warning background
          200: '#FFEDB3',
          300: '#FFE285',
          400: '#FAC82C', // Warning color
          500: '#E1B000',
          600: '#C89800',
          700: '#AF8000',
        },
        
        // Info - Soft Blue (hsl(203, 47%, 74%) = #A2DDEF)
        blue: {
          50: '#F0F9FD',
          100: '#E3F7FF', // Light info background
          200: '#C7EFFF',
          300: '#ABE7FF',
          400: '#A2DDEF', // Info color
          500: '#7AC5E0',
          600: '#52ADD1',
          700: '#2A95C2',
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
}
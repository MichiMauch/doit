/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/dashboard.tsx',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#FFF2E5',
          100: '#FFE5CC', 
          200: '#FFD8B3',
          300: '#FFCB99',
          400: '#FFA534',
          500: '#E6942F',
          600: '#CC832A',
          700: '#B37225',
          800: '#996120',
          900: '#80501B',
        },
        
        // Semantic Colors
        success: {
          50: '#E6F9E5',
          100: '#CCF0CC',
          200: '#B3E6B3',
          300: '#99DD99',
          400: '#80D580',
          500: '#66CC66',
          600: '#5CB35C',
          700: '#529952',
          800: '#478047',
          900: '#3D663D',
        },
        
        warning: {
          50: '#FFFBE5',
          100: '#FFF2CC',
          200: '#FFE9B3',
          300: '#FFE099',
          400: '#FFD780',
          500: '#FFCE66',
          600: '#E6B95C',
          700: '#CC9F52',
          800: '#B38547',
          900: '#996B3D',
        },
        
        danger: {
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FFB3B3',
          300: '#FF9999',
          400: '#FF8080',
          500: '#FF6666',
          600: '#E65C5C',
          700: '#CC5252',
          800: '#B34747',
          900: '#993D3D',
        },
        
        // Neutral Grays
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#2E2E2E',
          900: '#1F2937',
        },
        
        // UI Colors
        background: '#F9FAFB',
        card: '#FFFFFF',
        border: '#E0E0E0',
        input: '#F3F4F6',
        ring: '#FFA534',
        foreground: '#2E2E2E',
        'muted-foreground': '#6B7280',
      },
      fontFamily: {
        sans: ['var(--font-red-hat-display)', 'Red Hat Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        audiowide: ['var(--font-audiowide)', 'Audiowide', 'cursive'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
/**
 * Unified Design System
 * Based on primary color #FFA534 with comprehensive color palette
 */

// Core Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#FFF2E5',
    100: '#FFE5CC', 
    200: '#FFD8B3',
    300: '#FFCB99',
    400: '#FFA534',    // Main brand color
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
    500: '#66CC66',    // Success green
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
    500: '#FFCE66',    // Warning yellow
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
    500: '#FF6666',    // Accent red
    600: '#E65C5C',
    700: '#CC5252',
    800: '#B34747',
    900: '#993D3D',
  },
  
  // Neutral Grays
  gray: {
    50: '#F9FAFB',     // Background
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#2E2E2E',    // Text
    900: '#1F2937',
  },
  
  // UI Colors
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E0E0E0',
  input: '#F3F4F6',
  ring: '#FFA534',
  text: '#2E2E2E',
  'text-muted': '#6B7280',
}

// Typography Scale
export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Red Hat Display', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    audiowide: ['Audiowide', 'cursive'],
  },
  
  // Font Sizes
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
}

// Spacing Scale
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
}

// Border Radius
export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
}

// Shadows
export const boxShadow = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

// Component Styles
export const components = {
  button: {
    base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
    variants: {
      primary: 'bg-primary-400 hover:bg-primary-500 text-white shadow-sm',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm',
      ghost: 'hover:bg-gray-100 text-gray-700',
      danger: 'bg-danger-500 hover:bg-danger-600 text-white shadow-sm',
    },
    sizes: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }
  },
  
  card: {
    base: 'rounded-lg border border-gray-200 bg-white shadow-sm',
    variants: {
      default: 'p-6',
      compact: 'p-4',
      spacious: 'p-8',
    }
  },
  
  input: {
    base: 'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      error: 'border-danger-400 focus:border-danger-400 focus:ring-danger-100',
      success: 'border-success-400 focus:border-success-400 focus:ring-success-100',
    }
  },
  
  badge: {
    base: 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
    variants: {
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      danger: 'bg-danger-100 text-danger-800',
      gray: 'bg-gray-100 text-gray-800',
    }
  }
}

// Animation Durations
export const animation = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
}

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
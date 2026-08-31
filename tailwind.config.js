/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ground / surfaces
        ground: '#F7FAFC',
        surface: '#FFFFFF',
        hairline: '#E2E8F0',
        // Ink
        ink: {
          primary: '#0F2942',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        // Accent (water teal)
        accent: {
          DEFAULT: '#0E7490',
          light: '#0891B2',
        },
        // CGWB tier colors (reserved for risk indicators only)
        cgwb: {
          safe: '#16A34A',
          'semi-critical': '#EAB308',
          critical: '#F97316',
          'over-exploited': '#DC2626',
          saline: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.25rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(1.375rem, 2.5vw, 2rem)', { lineHeight: '1.2' }],
        'display-sm': ['clamp(1.125rem, 2vw, 1.375rem)', { lineHeight: '1.25' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
        'stat': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'elevated': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        'card': '0.75rem',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.45s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'data-pulse': 'dataPulse 1.5s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0.001', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0.001', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        dataPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(0.97)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
      },
    },
  },
  plugins: [],
}
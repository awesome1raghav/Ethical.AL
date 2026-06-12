import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#000000',
        foreground: '#f8f9fa',
        card: {
          DEFAULT: '#0A0A0A',
          foreground: '#f8f9fa',
        },
        popover: {
          DEFAULT: '#000000',
          foreground: '#f8f9fa',
        },
        primary: {
          DEFAULT: '#f8f9fa',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#111111',
          foreground: '#f8f9fa',
        },
        muted: {
          DEFAULT: '#adb5bd',
          foreground: '#6c757d',
        },
        accent: {
          DEFAULT: '#f8f9fa',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#FF5A5A',
          foreground: '#f8f9fa',
        },
        border: 'rgba(222,226,230,0.08)',
        input: 'rgba(222,226,230,0.06)',
        ring: '#adb5bd',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
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
} satisfies Config;
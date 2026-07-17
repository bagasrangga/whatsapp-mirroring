/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // WhatsApp-inspired design system from ui-ux-pro-max
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#6366F1',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#059669',
          foreground: '#FFFFFF',
        },
        background: '#FFFFFF',
        foreground: '#0F172A',
        muted: {
          DEFAULT: '#F1F5FD',
          foreground: '#64748B',
        },
        border: '#E4ECFC',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        ring: '#2563EB',
        // WhatsApp-specific colors
        wa: {
          green: '#25D366',
          'green-dark': '#128C7E',
          'green-light': '#DCF8C6', // outgoing message bubble
          'teal': '#075E54',
          'sidebar': '#F0F2F5',
          'sidebar-dark': '#111B21',
          'chat-bg': '#E5DDD5',
          'chat-bg-dark': '#0D1417',
          'bubble-out': '#DCF8C6',
          'bubble-in': '#FFFFFF',
          'bubble-out-dark': '#005C4B',
          'bubble-in-dark': '#202C33',
          'timestamp': '#667781',
          'read': '#53BDEB',
        },
        // Status colors
        status: {
          'opsi-1': '#3B82F6',    // Blue
          'opsi-2': '#8B5CF6',    // Purple
          'ga-jadi': '#EF4444',   // Red
          'mahal': '#F59E0B',     // Amber
          'none': '#94A3B8',      // Slate
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.4' }],
        'sm': ['13px', { lineHeight: '1.5' }],
        'base': ['15px', { lineHeight: '1.6' }],
        'lg': ['17px', { lineHeight: '1.5' }],
        'xl': ['19px', { lineHeight: '1.4' }],
        '2xl': ['22px', { lineHeight: '1.3' }],
      },
      spacing: {
        // Density 7/10 — Standard-Dense
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px',
        // WhatsApp bubble radii
        'bubble': '7.5px',
      },
      boxShadow: {
        'bubble': '0 1px 0.5px rgba(0,0,0,0.13)',
        'panel': '0 2px 8px rgba(0,0,0,0.08)',
        'modal': '0 8px 32px rgba(0,0,0,0.16)',
        'sidebar': '1px 0 0 #E4ECFC',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '450': '450ms',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in-left': 'slideInLeft 300ms cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.16,1,0.3,1)',
        'bounce-in': 'bounceIn 400ms cubic-bezier(0.16,1,0.3,1)',
        'progress': 'progress 1.5s ease-in-out infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-16px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

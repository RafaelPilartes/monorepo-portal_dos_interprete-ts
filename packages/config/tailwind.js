// Tailwind preset shared by the four apps. Theme tokens come from the
// current SPA so moved screens keep their look (foundation.md §D).
import animate from 'tailwindcss-animate'

/** @param {string} name */
const token = (name) => `hsl(var(--${name}))`
/** @param {string} name */
const pair = (name) => ({ DEFAULT: token(name), foreground: token(`${name}-foreground`) })

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'] },
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: pair('primary'),
        secondary: pair('secondary'),
        destructive: pair('destructive'),
        muted: pair('muted'),
        accent: pair('accent'),
        popover: pair('popover'),
        card: pair('card'),
        success: pair('success'),
        warning: pair('warning'),
        impact: { DEFAULT: token('impact'), light: token('impact-light') },
        sidebar: {
          DEFAULT: token('sidebar-background'),
          foreground: token('sidebar-foreground'),
          primary: token('sidebar-primary'),
          'primary-foreground': token('sidebar-primary-foreground'),
          accent: token('sidebar-accent'),
          'accent-foreground': token('sidebar-accent-foreground'),
          border: token('sidebar-border'),
          ring: token('sidebar-ring'),
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
}

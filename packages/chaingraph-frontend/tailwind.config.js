/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enable dark mode support
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // UI Theme Colors
        ui: {
          // Main background colors
          background: {
            light: '#f5f5f5',
            dark: '#161616', // Main dark background
          },
          // Secondary background (for panels, cards etc)
          surface: {
            light: '#ffffff',
            dark: '#1e1e1e', // Slightly lighter than background
          },
          // Accent surface (for hover states, active items)
          accent: {
            light: '#f0f0f0',
            dark: '#242424', // Even lighter, for contrast
          },
          // Border colors
          border: {
            light: '#e5e5e5',
            dark: '#2a2a2a',
          },
        },
        // Functional colors
        flow: {
          // For nodes and connections
          execute: {
            light: '#22c55e',
            DEFAULT: '#16a34a',
            dark: '#15803d',
          },
          data: {
            light: '#3b82f6',
            DEFAULT: '#2563eb',
            dark: '#1d4ed8',
          },
          stream: {
            light: '#f59e0b',
            DEFAULT: '#d97706',
            dark: '#b45309',
          },
        },
        // Status colors
        status: {
          success: {
            light: '#22c55e',
            DEFAULT: '#16a34a',
            dark: '#15803d',
          },
          error: {
            light: '#ef4444',
            DEFAULT: '#dc2626',
            dark: '#b91c1c',
          },
          warning: {
            light: '#f59e0b',
            DEFAULT: '#d97706',
            dark: '#b45309',
          },
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

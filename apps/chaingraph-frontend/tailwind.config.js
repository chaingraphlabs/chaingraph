/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}', // This catches all files, but we can be more specific
    './src/components/**/*.{ts,tsx}',
    './src/components/ui/**/*.{ts,tsx}',
    './src/components/flow/**/*.{ts,tsx}',
    './src/exports.tsx', // Important to include the exports file
    './src/lib.css', // Include your CSS entry file
    './src/index.css', // Include your CSS entry file
    './src/safelist/**/*.{ts,tsx}', // Include safelist explicitly
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
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
        // Flow specific colors
        flow: {
          execute: 'hsl(var(--flow-execute))',
          data: 'hsl(var(--flow-data))',
          stream: 'hsl(var(--flow-stream))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Base node shadows
        'node': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'node-dark': '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',

        // Selection glow effects
        'node-selected': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), 0 0 15px rgba(var(--glow-color), 0.35)',
        'node-selected-dark': '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(var(--glow-color), 0.5)',

        // Card shadows
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-selected': `
          0 0 0 1px hsl(var(--primary)/0.2),
          0 0 12px -2px hsl(var(--primary)/0.4)
        `,
        'card-selected-dark': `
          0 0 0 1px hsl(var(--primary)/0.3),
          0 0 12px -2px hsl(var(--primary)/0.6)
        `,

        // Additional utility shadows
        'soft': '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',

        // Node port shadows
        'port-connected': '0 0 0 2px hsl(var(--background)), 0 0 0 4px currentColor',
      },
      fontFamilyfontFamily: {
        sans: ['Inter var', 'Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59,130,246,0.5)' },
          '50%': { boxShadow: '0 0 18px rgba(59,130,246,0.7)' },
        },
        'update-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
          '50%': { boxShadow: '0 0 20px 2px rgba(34,197,94,0.8)' },
          '100%': { boxShadow: '0 0 12px 1px rgba(34,197,94,0.6)' },
        },
        'update-fade': {
          from: { boxShadow: '0 0 12px 1px rgba(34,197,94,0.6)' },
          to: { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow': 'glow 3s ease-in-out infinite',
        'update-pulse': 'update-pulse 200ms ease-out forwards',
        'update-fade': 'update-fade 400ms ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

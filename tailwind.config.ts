import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4ECDC4',
          light: '#7EDDD6',
          dark: '#3BB8B0',
          50: 'rgba(78, 205, 196, 0.08)',
          100: 'rgba(78, 205, 196, 0.15)',
        },
        accent: {
          DEFAULT: '#FF8A80',
          light: 'rgba(255, 138, 128, 0.1)',
        },
        success: '#A8E6CF',
        info: '#81D4FA',
        warning: '#FFD93D',
        danger: '#FF8A80',
        bg: {
          DEFAULT: '#F5F5F0',
          warm: '#FAF9F6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#FAFAFA',
        },
        text: {
          primary: '#2D3436',
          secondary: '#636E72',
          tertiary: '#B2BEC3',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#DFE6E9',
          light: '#E8ECEF',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['DIN Alternate', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: '10px',
        sm: '12px',
        base: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      maxWidth: {
        content: '1200px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
        md: '0 2px 8px rgba(0, 0, 0, 0.05)',
        lg: '0 4px 16px rgba(0, 0, 0, 0.08)',
        xl: '0 8px 32px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;

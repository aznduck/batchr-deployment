
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				ice: {
					DEFAULT: '#EBF4F8',
					50: '#F7FBFD',
					100: '#EBF4F8',
					200: '#C5E0EA',
					300: '#9FCBDD',
					400: '#78B5CF',
					500: '#52A0C1',
					600: '#3984A3',
					700: '#2A6379',
					800: '#1C434F',
					900: '#0E2126',
					foreground: '#1C434F'
				},
				strawberry: {
					DEFAULT: '#FFE5EA',
					foreground: '#9A2C41'
				},
				chocolate: {
					DEFAULT: '#E8D9C9',
					foreground: '#634832'
				},
				vanilla: {
					DEFAULT: '#FFF8E1',
					foreground: '#8A7645'
				},
				cookie: {
					DEFAULT: '#F0E6D2',
					foreground: '#6B583F'
				},
				rocky: {
					DEFAULT: '#E1D9D6',
					foreground: '#5F4C47'
				},
				danger: {
					DEFAULT: '#FDDAD6',
					foreground: '#A42A1B'
				},
				warning: {
					DEFAULT: '#FFF1D6',
					foreground: '#95631D'
				},
				success: {
					DEFAULT: '#DEFFDC',
					foreground: '#256F1E'
				},
			},
			keyframes: {
				"accordion-down": {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				"accordion-up": {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				"fade-in": {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				"fade-out": {
					from: { opacity: '1', transform: 'translateY(0)' },
					to: { opacity: '0', transform: 'translateY(8px)' },
				},
				"scale-in": {
					from: { opacity: '0', transform: 'scale(0.97)' },
					to: { opacity: '1', transform: 'scale(1)' },
				},
				"scale-out": {
					from: { opacity: '1', transform: 'scale(1)' },
					to: { opacity: '0', transform: 'scale(0.97)' },
				},
				"slide-in": {
					from: { opacity: '0', transform: 'translateX(20px)' },
					to: { opacity: '1', transform: 'translateX(0)' },
				},
				"slide-out": {
					from: { opacity: '1', transform: 'translateX(0)' },
					to: { opacity: '0', transform: 'translateX(20px)' },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-out",
				"fade-out": "fade-out 0.3s ease-out",
				"scale-in": "scale-in 0.2s ease-out",
				"scale-out": "scale-out 0.2s ease-out",
				"slide-in": "slide-in 0.3s ease-out",
				"slide-out": "slide-out 0.3s ease-out",
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
		}
	},
	safelist: [
		'bg-vanilla/40', 'border-vanilla/60', 'text-vanilla-foreground', 'text-vanilla-foreground/80', 'text-vanilla-foreground/70',
		'bg-chocolate/40', 'border-chocolate/60', 'text-chocolate-foreground', 'text-chocolate-foreground/80', 'text-chocolate-foreground/70',
		'bg-strawberry/40', 'border-strawberry/60', 'text-strawberry-foreground', 'text-strawberry-foreground/80', 'text-strawberry-foreground/70',
		'bg-cookie/40', 'border-cookie/60', 'text-cookie-foreground', 'text-cookie-foreground/80', 'text-cookie-foreground/70',
		'bg-rocky/40', 'border-rocky/60', 'text-rocky-foreground', 'text-rocky-foreground/80', 'text-rocky-foreground/70',
		'bg-ice/40', 'border-ice/60', 'text-ice-foreground', 'text-ice-foreground/80', 'text-ice-foreground/70',
		'hover:text-vanilla-foreground', 'hover:bg-vanilla/60',
		'hover:text-chocolate-foreground', 'hover:bg-chocolate/60',
		'hover:text-strawberry-foreground', 'hover:bg-strawberry/60',
		'hover:text-cookie-foreground', 'hover:bg-cookie/60',
		'hover:text-rocky-foreground', 'hover:bg-rocky/60',
		'hover:text-ice-foreground', 'hover:bg-ice/60',
		'border-vanilla-foreground/30', 'bg-vanilla/30',
		'border-chocolate-foreground/30', 'bg-chocolate/30',
		'border-strawberry-foreground/30', 'bg-strawberry/30',
		'border-cookie-foreground/30', 'bg-cookie/30',
		'border-rocky-foreground/30', 'bg-rocky/30',
		'border-ice-foreground/30', 'bg-ice/30',
	],
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

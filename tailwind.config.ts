
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
			padding: {
				DEFAULT: '1rem',
				sm: '2rem',
				lg: '4rem',
				xl: '5rem',
				'2xl': '6rem',
			},
			screens: {
				'2xl': '1400px'
			}
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
				linkbox: {
					blue: '#4285F4',
					red: '#EA4335',
					yellow: '#FBBC05',
					green: '#34A853',
					purple: '#9b87f5',
					indigo: '#7E69AB',
					teal: '#4CC9BE',
					gray: '#8E9196',
					darkgray: '#4A4E55',
				},
				// Landing page specific colors (linktr.ee inspired)
				landing: {
					'gradient-start': '#667eea',
					'gradient-end': '#764ba2',
					'accent-purple': '#8B5CF6',
					'accent-blue': '#3B82F6',
					'accent-pink': '#EC4899',
					'neutral-50': '#FAFAFA',
					'neutral-100': '#F5F5F5',
					'neutral-900': '#171717',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-in': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				// Landing page animations
				'gradient-shift': {
					'0%, 100%': { 
						'background-position': '0% 50%' 
					},
					'50%': { 
						'background-position': '100% 50%' 
					}
				},
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px)' 
					},
					'50%': { 
						transform: 'translateY(-10px)' 
					}
				},
				'scale-bounce': {
					'0%, 100%': { 
						transform: 'scale(1)' 
					},
					'50%': { 
						transform: 'scale(1.05)' 
					}
				},
				'slide-up': {
					'0%': { 
						transform: 'translateY(30px)', 
						opacity: '0' 
					},
					'100%': { 
						transform: 'translateY(0)', 
						opacity: '1' 
					}
				},
				'slide-in-left': {
					'0%': { 
						transform: 'translateX(-30px)', 
						opacity: '0' 
					},
					'100%': { 
						transform: 'translateX(0)', 
						opacity: '1' 
					}
				},
				'slide-in-right': {
					'0%': { 
						transform: 'translateX(30px)', 
						opacity: '0' 
					},
					'100%': { 
						transform: 'translateX(0)', 
						opacity: '1' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				// Landing page animations
				'gradient-shift': 'gradient-shift 6s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'scale-bounce': 'scale-bounce 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.6s ease-out',
				'slide-in-left': 'slide-in-left 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.6s ease-out',
				'pulse-slow': 'pulse 3s ease-in-out infinite',
			},
			fontFamily: {
				sans: ['"Noto Sans KR"', 'sans-serif'],
				heading: ['"Pretendard"', 'sans-serif'],
			},
			backgroundImage: {
				// Landing page gradients
				'gradient-hero': 'linear-gradient(135deg, var(--tw-gradient-stops))',
				'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-landing': 'linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)',
				'gradient-interactive': 'linear-gradient(45deg, #8B5CF6, #3B82F6, #EC4899, #8B5CF6)',
			},
			backgroundSize: {
				'400%': '400% 400%',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

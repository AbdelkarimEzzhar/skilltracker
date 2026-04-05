/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#3B82F6',
                'primary-dark': '#1E40AF',
                'secondary': '#8B5CF6',
                'success': '#10B981',
                'warning': '#F59E0B',
                'error': '#EF4444',
            },
            fontFamily: {
                sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

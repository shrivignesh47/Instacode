/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            screens: {
                'xs': '475px',
            },
            spacing: {
                'safe-area-pb': 'env(safe-area-inset-bottom)',
            },
        },
    },
    plugins: [
        function({ addUtilities }) {
            addUtilities({
                '.safe-area-pb': {
                    paddingBottom: 'env(safe-area-inset-bottom)',
                },
                '.line-clamp-2': {
                    overflow: 'hidden',
                    display: '-webkit-box',
                    '-webkit-box-orient': 'vertical',
                    '-webkit-line-clamp': '2',
                },
                '.line-clamp-3': {
                    overflow: 'hidden',
                    display: '-webkit-box',
                    '-webkit-box-orient': 'vertical',
                    '-webkit-line-clamp': '3',
                },
            });
        },
    ],
};
import { getColorSettings } from '../functions/colorSettings';

// Generate dynamic Tailwind config based on API colors
export const generateTailwindConfig = async () => {
    try {
        const response = await getColorSettings();
        if (response.success && response.settings) {
            const { primary, secondary } = response.settings;
            
            return {
                content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
                theme: {
                    extend: {
                        fontFamily: {
                            roboto: ["Roboto", "sens-serif"],
                            poppins: ["Poppins", "sens-serif"],
                            space: ["Space Grotesk", "sans-serif"],
                        },
                        colors: {
                            primary: primary || "#000000",
                            secondary: secondary || "#FFB727",
                        },
                        opacity: {
                            10: "0.1",
                            20: "0.2",
                            30: "0.3",
                            40: "0.4",
                            50: "0.5",
                            60: "0.6",
                            70: "0.7",
                            80: "0.8",
                            90: "0.9",
                        },
                        animation: {
                            "custom-bounce": "bounce-in-parent 2s infinite",
                        },
                        keyframes: {
                            "bounce-in-parent": {
                                "0%, 100%": { transform: "translateY(0)" },
                                "50%": { transform: "translateY(-5px)" },
                            },
                        },
                    },
                },
                plugins: [],
            };
        }
    } catch (error) {
        console.error('Error generating Tailwind config:', error);
        // Return default config if API fails
        return {
            content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
            theme: {
                extend: {
                    fontFamily: {
                        roboto: ["Roboto", "sens-serif"],
                        poppins: ["Poppins", "sens-serif"],
                        space: ["Space Grotesk", "sans-serif"],
                    },
                    colors: {
                        primary: "#000000",
                        secondary: "#FFB727",
                    },
                    opacity: {
                        10: "0.1",
                        20: "0.2",
                        30: "0.3",
                        40: "0.4",
                        50: "0.5",
                        60: "0.6",
                        70: "0.7",
                        80: "0.8",
                        90: "0.9",
                    },
                    animation: {
                        "custom-bounce": "bounce-in-parent 2s infinite",
                    },
                    keyframes: {
                        "bounce-in-parent": {
                            "0%, 100%": { transform: "translateY(0)" },
                            "50%": { transform: "translateY(-5px)" },
                        },
                    },
                },
            },
            plugins: [],
        };
    }
};

// Apply colors to existing Tailwind classes
export const applyColorsToTailwind = (primary, secondary) => {
    const style = document.createElement('style');
    style.textContent = `
        .bg-primary { background-color: ${primary} !important; }
        .text-primary { color: ${primary} !important; }
        .border-primary { border-color: ${primary} !important; }
        .bg-secondary { background-color: ${secondary} !important; }
        .text-secondary { color: ${secondary} !important; }
        .border-secondary { border-color: ${secondary} !important; }
    `;
    
    // Remove existing dynamic styles
    const existingStyle = document.getElementById('dynamic-tailwind-colors');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    style.id = 'dynamic-tailwind-colors';
    document.head.appendChild(style);
}; 
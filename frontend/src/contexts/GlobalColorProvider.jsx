import React, { createContext, useContext, useEffect, useState } from 'react';
import { getColorSettings } from '../functions/colorSettings';

const GlobalColorContext = createContext();

export const useGlobalColors = () => {
    const context = useContext(GlobalColorContext);
    if (!context) {
        throw new Error('useGlobalColors must be used within a GlobalColorProvider');
    }
    return context;
};

export const GlobalColorProvider = ({ children }) => {
    const [colors, setColors] = useState({
        primary: '#000000',
        secondary: '#FFB727'
    });

    const applyColorsGlobally = (newColors) => {
        const { primary, secondary } = newColors;
        
        // Create comprehensive CSS overrides
        const style = document.createElement('style');
        style.textContent = `
            /* CSS Custom Properties */
            :root {
                --color-primary: ${primary};
                --color-secondary: ${secondary};
            }
            
            /* Override Tailwind classes with !important */
            .bg-primary { background-color: ${primary} !important; }
            .text-primary { color: ${primary} !important; }
            .border-primary { border-color: ${primary} !important; }
            .hover\\:bg-primary:hover { background-color: ${primary} !important; }
            .hover\\:text-primary:hover { color: ${primary} !important; }
            .hover\\:border-primary:hover { border-color: ${primary} !important; }
            .focus\\:border-primary:focus { border-color: ${primary} !important; }
            .focus\\:ring-primary:focus { --tw-ring-color: ${primary} !important; }
            
            .bg-secondary { background-color: ${secondary} !important; }
            .text-secondary { color: ${secondary} !important; }
            .border-secondary { border-color: ${secondary} !important; }
            .hover\\:bg-secondary:hover { background-color: ${secondary} !important; }
            .hover\\:text-secondary:hover { color: ${secondary} !important; }
            .hover\\:border-secondary:hover { border-color: ${secondary} !important; }
            .focus\\:border-secondary:focus { border-color: ${secondary} !important; }
            .focus\\:ring-secondary:focus { --tw-ring-color: ${secondary} !important; }
            
            /* Opacity variants */
            .bg-primary\\/80 { background-color: ${primary}cc !important; }
            .bg-primary\\/90 { background-color: ${primary}e6 !important; }
            .bg-secondary\\/80 { background-color: ${secondary}cc !important; }
            .bg-secondary\\/90 { background-color: ${secondary}e6 !important; }
            
            /* Border variants */
            .border-b-primary { border-bottom-color: ${primary} !important; }
            .border-t-primary { border-top-color: ${primary} !important; }
            .border-l-primary { border-left-color: ${primary} !important; }
            .border-r-primary { border-right-color: ${primary} !important; }
            
            .border-b-secondary { border-bottom-color: ${secondary} !important; }
            .border-t-secondary { border-top-color: ${secondary} !important; }
            .border-l-secondary { border-left-color: ${secondary} !important; }
            .border-r-secondary { border-right-color: ${secondary} !important; }
            
            /* Ring/outline variants */
            .ring-primary { --tw-ring-color: ${primary} !important; }
            .ring-secondary { --tw-ring-color: ${secondary} !important; }
            
            /* Shadow variants */
            .shadow-primary { box-shadow: 0 1px 3px 0 ${primary}1a, 0 1px 2px 0 ${primary}0f !important; }
            .shadow-secondary { box-shadow: 0 1px 3px 0 ${secondary}1a, 0 1px 2px 0 ${secondary}0f !important; }
        `;
        
        // Remove existing dynamic styles
        const existingStyle = document.getElementById('global-dynamic-colors');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.id = 'global-dynamic-colors';
        document.head.appendChild(style);
        
        // console.log('Global colors applied:', { primary, secondary });
    };

    useEffect(() => {
        const loadAndApplyColors = async () => {
            try {
                const response = await getColorSettings();
                if (response.success && response.settings) {
                    setColors(response.settings);
                    applyColorsGlobally(response.settings);
                }
            } catch (error) {
                console.error('Error loading global colors:', error);
                // Apply default colors if API fails
                applyColorsGlobally(colors);
            }
        };
        
        loadAndApplyColors();
        
        // Re-apply colors when window gains focus (in case user switches tabs)
        const handleFocus = () => {
            loadAndApplyColors();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const updateGlobalColors = (newColors) => {
        setColors(newColors);
        applyColorsGlobally(newColors);
    };

    const value = {
        colors,
        updateGlobalColors,
        applyColorsGlobally
    };

    return (
        <GlobalColorContext.Provider value={value}>
            {children}
        </GlobalColorContext.Provider>
    );
}; 
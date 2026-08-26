// Generate CSS custom properties from color settings
export const generateCSSVariables = (colorSettings) => {
    if (!colorSettings) return '';
    
    return `
        :root {
            --color-primary: ${colorSettings.primary || '#000000'};
            --color-secondary: ${colorSettings.secondary || '#FFB727'};
            --color-main: ${colorSettings.main || '#02076C'};
            --color-accent: ${colorSettings.accent || '#F59728'};
            --color-success: ${colorSettings.success || '#10B981'};
            --color-error: ${colorSettings.error || '#EF4444'};
            --color-warning: ${colorSettings.warning || '#F59E0B'};
            --color-info: ${colorSettings.info || '#3B82F6'};
        }
    `;
};

// Apply dynamic colors to the document
export const applyDynamicColors = (colorSettings) => {
    const cssVariables = generateCSSVariables(colorSettings);
    
    // Remove existing dynamic style tag if it exists
    const existingStyle = document.getElementById('dynamic-colors');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Create new style tag
    const styleTag = document.createElement('style');
    styleTag.id = 'dynamic-colors';
    styleTag.textContent = cssVariables;
    
    // Add to document head
    document.head.appendChild(styleTag);
};

// Get computed color value
export const getComputedColor = (colorVariable) => {
    return getComputedStyle(document.documentElement).getPropertyValue(colorVariable);
}; 
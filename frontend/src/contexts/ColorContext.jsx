import React, { createContext, useContext, useState, useEffect } from 'react';
import { getColorSettings } from '../functions/colorSettings';
import { applyDynamicColors } from '../utils/dynamicColors';

const ColorContext = createContext();

export const useColors = () => {
    const context = useContext(ColorContext);
    if (!context) {
        throw new Error('useColors must be used within a ColorProvider');
    }
    return context;
};

export const ColorProvider = ({ children }) => {
    const [colors, setColors] = useState({
        primary: '#000000',
        secondary: '#FFB727',
        main: '#02076C',
        accent: '#F59728',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadColorSettings();
    }, []);

    const loadColorSettings = async () => {
        try {
            setLoading(true);
            const response = await getColorSettings();
            if (response.success && response.settings) {
                setColors(response.settings);
                applyDynamicColors(response.settings);
            }
        } catch (error) {
            console.error('Error loading color settings:', error);
            // Apply default colors if API fails
            applyDynamicColors(colors);
        } finally {    
            setLoading(false);
        }
    };

    const updateColors = (newColors) => {
        setColors(newColors);
        applyDynamicColors(newColors);
    };

    const value = {
        colors,
        updateColors,
        loading
    };

    return (
        <ColorContext.Provider value={value}>
            {children}
        </ColorContext.Provider>
    );
}; 
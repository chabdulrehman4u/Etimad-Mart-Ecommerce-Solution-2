import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getColorSettings, updateColorSettings, resetColorSettings } from '../../functions/colorSettings';
import { useGlobalColors } from '../../contexts/GlobalColorProvider';

const AdminColorSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [colors, setColors] = useState({
        primary: '#000000',
        secondary: '#FFB727'
    });

    // Use the global colors context
    const { updateGlobalColors } = useGlobalColors();

    useEffect(() => {
        fetchColorSettings();
    }, []);

    const fetchColorSettings = async () => {
        try {
            setLoading(true);
            const response = await getColorSettings();
            if (response.success && response.settings) {
                setColors(response.settings);
            }
        } catch (error) {
            console.error('Error fetching color settings:', error);
            toast.error('Failed to load color settings');
        } finally {
            setLoading(false);
        }
    };

    const handleColorChange = (colorKey, value) => {
        const newColors = { ...colors, [colorKey]: value };
        setColors(newColors);
        
        // Apply colors immediately for real-time preview using global context
        updateGlobalColors(newColors);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await updateColorSettings(colors);
            if (response.success) {
                toast.success('Color settings saved successfully!');
                // Apply colors immediately without page reload using global context
                updateGlobalColors(colors);
            }
        } catch (error) {
            console.error('Error saving color settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save color settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            setSaving(true);
            const response = await resetColorSettings();
            if (response.success) {
                setColors(response.settings);
                toast.success('Color settings reset to default!');
                // Apply default colors immediately using global context
                updateGlobalColors(response.settings);
            }
        } catch (error) {
            console.error('Error resetting color settings:', error);
            toast.error('Failed to reset color settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Color Settings</h1>
                    <p className="text-gray-600">Customize your website's primary and secondary colors.</p>
                </div>

                <div className="space-y-6">
                    {/* Primary Color */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 mb-1">
                                    Primary Color
                                </label>
                                <p className="text-sm text-gray-500">Main brand color for buttons, links, and primary elements</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={colors.primary}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={colors.primary}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        
                        {/* Color Preview */}
                        <div className="flex items-center space-x-4">
                            <div
                                className="w-full h-12 rounded border border-gray-300"
                                style={{ backgroundColor: colors.primary }}
                            />
                            <div className="text-sm text-gray-500">
                                {colors.primary}
                            </div>
                        </div>
                    </motion.div>

                    {/* Secondary Color */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 mb-1">
                                    Secondary Color
                                </label>
                                <p className="text-sm text-gray-500">Accent color for highlights, CTAs, and secondary elements</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={colors.secondary}
                                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                                    className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={colors.secondary}
                                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                                    className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="#FFB727"
                                />
                            </div>
                        </div>
                        
                        {/* Color Preview */}
                        <div className="flex items-center space-x-4">
                            <div
                                className="w-full h-12 rounded border border-gray-300"
                                style={{ backgroundColor: colors.secondary }}
                            />
                            <div className="text-sm text-gray-500">
                                {colors.secondary}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 mt-8"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <span className="flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Saving...
                            </span>
                        ) : (
                            'Save Changes'
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReset}
                        disabled={saving}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        Reset to Default
                    </motion.button>
                </motion.div>

                {/* Live Preview Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200"
                >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-lg mb-2" style={{ backgroundColor: colors.primary }} />
                            <p className="text-sm font-medium">Primary Color</p>
                            <p className="text-xs text-gray-500">{colors.primary}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-lg mb-2" style={{ backgroundColor: colors.secondary }} />
                            <p className="text-sm font-medium">Secondary Color</p>
                            <p className="text-xs text-gray-500">{colors.secondary}</p>
                        </div>
                    </div>
                    
                    {/* Example Elements */}
                    <div className="mt-6 space-y-3">
                        <button 
                            className="px-4 py-2 rounded text-white font-medium"
                            style={{ backgroundColor: colors.primary }}
                        >
                            Primary Button
                        </button>
                        <button 
                            className="px-4 py-2 rounded text-white font-medium"
                            style={{ backgroundColor: colors.secondary }}
                        >
                            Secondary Button
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AdminColorSettings; 
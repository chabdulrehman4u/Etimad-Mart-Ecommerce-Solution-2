import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Get current color settings (public)
export const getColorSettings = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/colorSettings`);
        return response.data;
    } catch (error) {
        console.error('Error fetching color settings:', error);
        throw error;
    }
};

// Update color settings (admin only)
export const updateColorSettings = async (colorData) => {
    try {
        const response = await axios.put(`${BASE_URL}/colorSettings/update`, colorData, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error updating color settings:', error);
        throw error;
    }
};

// Reset color settings to default (admin only)
export const resetColorSettings = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/colorSettings/reset`, {}, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error resetting color settings:', error);
        throw error;
    }
}; 
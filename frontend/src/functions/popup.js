import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// ===== PUBLIC FUNCTIONS =====

// Get active popup for current page/user
export const getActivePopup = async (page = 'home', userType = 'guest') => {
    try {
        const response = await axios.get(`${BASE_URL}/popup/active`, {
            params: { page, userType }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching active popup:', error);
        throw error;
    }
};

// Track popup interaction (click or dismissal)
export const trackPopupInteraction = async (popupId, type) => {
    try {
        const response = await axios.post(`${BASE_URL}/popup/${popupId}/track`, {
            type // 'click' or 'dismissal'
        });
        return response.data;
    } catch (error) {
        console.error('Error tracking popup interaction:', error);
        throw error;
    }
};

// ===== ADMIN FUNCTIONS =====

// Get all popups (admin only)
export const getAllPopups = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/popup`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all popups:', error);
        throw error;
    }
};

// Create new popup (admin only)
export const createPopup = async (popupData) => {
    try {
        const formData = new FormData();
        
        // Add text fields
        Object.keys(popupData).forEach(key => {
            if (key === 'image' && popupData[key] instanceof File) {
                formData.append('image', popupData[key]);
            } else if (key !== 'image') {
                if (typeof popupData[key] === 'object') {
                    formData.append(key, JSON.stringify(popupData[key]));
                } else {
                    formData.append(key, popupData[key]);
                }
            }
        });

        const response = await axios.post(`${BASE_URL}/popup`, formData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating popup:', error);
        throw error;
    }
};

// Update popup (admin only)
export const updatePopup = async (popupId, popupData) => {
    try {
        const formData = new FormData();
        
        // Add text fields
        Object.keys(popupData).forEach(key => {
            if (key === 'image' && popupData[key] instanceof File) {
                formData.append('image', popupData[key]);
            } else if (key !== 'image') {
                if (typeof popupData[key] === 'object') {
                    formData.append(key, JSON.stringify(popupData[key]));
                } else {
                    formData.append(key, popupData[key]);
                }
            }
        });

        const response = await axios.put(`${BASE_URL}/popup/${popupId}`, formData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating popup:', error);
        throw error;
    }
};

// Delete popup (admin only)
export const deletePopup = async (popupId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/popup/${popupId}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting popup:', error);
        throw error;
    }
};

// Toggle popup status (admin only)
export const togglePopupStatus = async (popupId) => {
    try {
        const response = await axios.patch(`${BASE_URL}/popup/${popupId}/toggle`, {}, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling popup status:', error);
        throw error;
    }
};

// Get popup analytics (admin only)
export const getPopupAnalytics = async (popupId) => {
    try {
        const response = await axios.get(`${BASE_URL}/popup/${popupId}/analytics`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching popup analytics:', error);
        throw error;
    }
};

// Get all popups analytics summary (admin only)
export const getPopupsAnalyticsSummary = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/popup/analytics/summary`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        throw error;
    }
}; 
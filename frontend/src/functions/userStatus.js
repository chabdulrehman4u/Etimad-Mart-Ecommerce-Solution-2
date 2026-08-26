import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Update user status (admin only)
export const updateUserStatus = async (userId, status) => {
    try {
        const response = await axios.put(`${BASE_URL}/user/update-status/${userId}`, 
            { status },
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
};

// Update user's last active timestamp
export const updateLastActive = async () => {
    try {
        const response = await axios.patch(`${BASE_URL}/user/last-active`, {}, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error updating last active:', error);
        throw error;
    }
}; 
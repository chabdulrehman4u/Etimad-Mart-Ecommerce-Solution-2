import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Get user notifications
export const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
    try {
        const response = await axios.get(`${BASE_URL}/notification/user/${userId}`, {
            params: { page, limit, unreadOnly },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Get unread notification count
export const getUnreadCount = async (userId) => {
    try {
        const response = await axios.get(`${BASE_URL}/notification/unread/${userId}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw error;
    }
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
    try {
        const response = await axios.patch(`${BASE_URL}/notification/read/${notificationId}`, 
            { userId },
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
    try {
        const response = await axios.patch(`${BASE_URL}/notification/read-all/${userId}`, {}, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Delete notification
export const deleteNotification = async (notificationId, userId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/notification/${notificationId}`, {
            data: { userId },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}; 
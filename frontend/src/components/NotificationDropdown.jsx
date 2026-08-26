import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from '../functions/notification';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ userId, onNotificationUpdate, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch notifications
    const fetchNotifications = async (page = 1, append = false) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getUserNotifications(userId, page, 10);
            
            if (append) {
                setNotifications(prev => [...prev, ...response.notifications]);
            } else {
                setNotifications(response.notifications);
            }
            
            setCurrentPage(response.currentPage);
            setHasMore(response.currentPage < response.totalPages);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Load notifications on component mount
    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    // Handle mark as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId, userId);
            setNotifications(prev => 
                prev.map(notification => 
                    notification._id === notificationId 
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
            onNotificationUpdate();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead(userId);
            setNotifications(prev => 
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            onNotificationUpdate();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Handle delete notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            await deleteNotification(notificationId, userId);
            setNotifications(prev => 
                prev.filter(notification => notification._id !== notificationId)
            );
            onNotificationUpdate();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Handle load more
    const handleLoadMore = () => {
        if (hasMore && !loading) {
            fetchNotifications(currentPage + 1, true);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_placed':
                return '🛒';
            case 'order_shipped':
                return '📦';
            case 'order_delivered':
                return '✅';
            case 'order_cancelled':
                return '❌';
            case 'user_status':
                return '👤';
            case 'admin_order':
                return '💰';
            case 'role_change':
                return '👑';
            default:
                return '🔔';
        }
    };

    // Get notification color based on type
    const getNotificationColor = (type) => {
        switch (type) {
            case 'order_placed':
                return 'text-blue-600';
            case 'order_shipped':
                return 'text-orange-600';
            case 'order_delivered':
                return 'text-green-600';
            case 'order_cancelled':
                return 'text-red-600';
            case 'user_status':
                return 'text-purple-600';
            case 'admin_order':
                return 'text-green-600';
            case 'role_change':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg  shadow-lg border border-gray-200 max-h-[80vh] sm:max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center gap-2">
                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-1"
                        aria-label="Close notifications"
                    >
                        <FaTimes className="text-base sm:text-base" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                    <div className="p-3 sm:p-4 text-center text-gray-500">
                        <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        <span className="text-xs sm:text-sm">Loading notifications...</span>
                    </div>
                ) : error ? (
                    <div className="p-3 sm:p-4 text-center text-red-500">
                        <span className="text-xs sm:text-sm">{error}</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-3 sm:p-4 text-center text-gray-500">
                        <span className="text-xs sm:text-sm">No notifications yet</span>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                                    !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex items-start gap-2 sm:gap-3">
                                    {/* Notification Icon */}
                                    <div className={`text-xl sm:text-2xl ${getNotificationColor(notification.type)} flex-shrink-0`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    
                                    {/* Notification Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-xs sm:text-sm font-medium ${
                                                    !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification._id)}
                                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <FaCheck className="text-xs" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteNotification(notification._id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete notification"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                    >
                        {loading ? 'Loading...' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown; 
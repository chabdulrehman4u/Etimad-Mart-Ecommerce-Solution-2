import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadCount } from '../functions/notification';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const lastCountRef = useRef(0);
    const dropdownRef = useRef(null);
    const { user } = useSelector((state) => state.auth);

    // Fetch unread count
    const fetchUnreadCount = async (isBackgroundRefresh = false) => {
        if (!user?._id) return;
        
        try {
            if (!isBackgroundRefresh) {
                setIsLoading(true);
            }
            // console.log('Fetching unread count for user:', user._id);
            const response = await getUnreadCount(user._id);
            // console.log('Unread count response:', response);
            const newCount = response.unreadCount || 0;
            
            // Only update if count actually changed
            if (newCount !== lastCountRef.current) {
                // console.log('Notification count changed from', lastCountRef.current, 'to', newCount);
                setUnreadCount(newCount);
                lastCountRef.current = newCount;
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    };

    // Fetch unread count on component mount and when user changes
    useEffect(() => {
        fetchUnreadCount();
        
        // Set up interval to refresh unread count every 30 seconds for real-time updates
        const interval = setInterval(() => fetchUnreadCount(true), 30000);
        
        // Listen for custom event to refresh notifications
        const handleRefreshNotifications = () => {
            // console.log('Received refreshNotifications event');
            fetchUnreadCount(true);
        };
        
        window.addEventListener('refreshNotifications', handleRefreshNotifications);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('refreshNotifications', handleRefreshNotifications);
        };
    }, [user?._id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle notification bell click
    const handleBellClick = () => {
        if (!user?._id) {
            // Redirect to login if user is not authenticated
            window.location.href = '/login';
            return;
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Handle notification count update (called from dropdown)
    const handleNotificationUpdate = () => {
        fetchUnreadCount(true); // Background refresh, no loader
    };

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="relative hidden lg:block" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors duration-200 focus:outline-none"
                aria-label="Notifications"
            >
                <FaBell className="text-xl" />
                
                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
                
                {/* Loading Indicator - Only show during initial load */}
                {isLoading && isInitialLoad && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
                

            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                         className="fixed rounded-tl-full rounded-tr-full sm:absolute right-2 sm:right-0 top-28 sm:top-auto sm:mt-2 z-[9998] w-[calc(100vw-1rem)] sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200"
                    >
                        <NotificationDropdown 
                            userId={user._id}
                            onNotificationUpdate={handleNotificationUpdate}
                            onClose={() => setIsDropdownOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell; 
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaUser, FaUserShield, FaUserTimes, FaUserCheck, FaUserClock } from 'react-icons/fa';
import { updateUserStatus } from '../../functions/userStatus';
import { getUnreadCount } from '../../functions/notification';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user: currentUser } = useSelector((state) => state.auth);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/user/getAll', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            } else {
                setError('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle status update
    const handleStatusUpdate = async (userId, newStatus) => {
        try {
            const response = await updateUserStatus(userId, newStatus);
            if (response.success) {
                toast.success(`User status updated to ${newStatus}`);
                fetchUsers(); // Refresh the list
                
                // Force refresh notification count immediately
                try {
                    // Small delay to ensure backend has created the notification
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const notificationResponse = await getUnreadCount(currentUser._id);
                    console.log('Updated notification count:', notificationResponse);
                    
                    // Dispatch event to update notification bell
                    window.dispatchEvent(new CustomEvent('refreshNotifications'));
                } catch (notificationError) {
                    console.error('Error refreshing notifications:', notificationError);
                }
            } else {
                toast.error('Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            toast.error('Failed to update user status');
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <FaUserCheck className="text-green-500" />;
            case 'inactive':
                return <FaUserClock className="text-yellow-500" />;
            case 'suspended':
                return <FaUserTimes className="text-red-500" />;
            default:
                return <FaUser className="text-gray-500" />;
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            case 'suspended':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-main rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-red-500 text-center">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 px-4 md:px-6 py-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-3xl text-main font-bold text-center mb-6">
                    User Management
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {users.map((user) => (
                        <motion.div
                            key={user._id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                        >
                            {/* User Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {user.role === 'admin' ? (
                                        <FaUserShield className="text-2xl text-blue-500" />
                                    ) : (
                                        <FaUser className="text-2xl text-gray-500" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                {getStatusIcon(user.status)}
                            </div>

                            {/* User Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Role:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Joined:</span>
                                    <span className="text-sm text-gray-900">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {user.lastActive && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Last Active:</span>
                                        <span className="text-sm text-gray-900">
                                            {new Date(user.lastActive).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Update Buttons */}
                            {user._id !== currentUser?._id && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(user._id, 'active')}
                                        disabled={user.status === 'active'}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            user.status === 'active'
                                                ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                    >
                                        Activate
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(user._id, 'inactive')}
                                        disabled={user.status === 'inactive'}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            user.status === 'inactive'
                                                ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed'
                                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                        }`}
                                    >
                                        Deactivate
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(user._id, 'suspended')}
                                        disabled={user.status === 'suspended'}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            user.status === 'suspended'
                                                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                    >
                                        Suspend
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {users.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers; 
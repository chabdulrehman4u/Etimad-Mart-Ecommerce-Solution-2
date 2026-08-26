import React, { useEffect, useState } from 'react';
import { CiEdit, CiTrash } from 'react-icons/ci';
import { getAllUsers, updateUserRole, deleteUser } from '../../functions/auth';
import { toast } from 'react-hot-toast'

const AllUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchAllUsers = async () => {
        try {
            setLoading(true)
            const response = await getAllUsers();
            setUsers(response?.users)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log("Error in fething all users", error)
        }
    }

    useEffect(() => {
        fetchAllUsers()
    }, [])

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Optimistically update the UI
            const updatedUsers = users.map((user) =>
                user._id === userId ? { ...user, role: newRole } : user
            );
            setUsers(updatedUsers);
            setEditingUserId(null); // Close the dropdown after selecting a role

            const response = await updateUserRole(userId, newRole);
            toast.success(response?.message || `User ${userId} role updated to: ${newRole}`)
        } catch (error) {
            console.error('Error updating user role:', error);

            // Revert the UI change if the API call fails
            const revertedUsers = users.map((user) =>
                user._id === userId ? { ...user, role: user.role } : user
            );
            setUsers(revertedUsers);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                setLoading(true);
                const response = await deleteUser(userId);
                if (response?.success) {
                    setUsers(users.filter(user => user._id !== userId));
                    toast.success(response?.message || "User deleted successfully");
                } else {
                    toast.error(response?.message || "Failed to delete user");
                }
            } catch (error) {
                toast.error("Error deleting user");
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) return <p className='text-center text-lg text-main'>Loading...</p>
    if (users?.length === 0) return <p className='text-center text-lg text-main'>No users found</p>

    const handleEditClick = (userId) => {
        if (editingUserId === userId) {
            setEditingUserId(null); // Close dropdown if clicking the same user
        } else {
            setEditingUserId(userId); // Open dropdown for the clicked user
        }
    };

    return (
        <div className="container mx-auto px-1 md:px-4 py-3 md:py-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-main">
                All Users[{`${users?.length}`}]
            </h1>

            {/* Check if there are no users */}
            {users?.length === 0 ? (
                <div className="text-center text-lg text-red-500">No users available</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border text-sm sm:text-base">Username</th>
                                <th className="px-4 py-2 border text-sm sm:text-base">Email</th>
                                <th className="px-4 py-2 border text-sm sm:text-base">Role</th>
                                <th className="px-4 py-2 border text-sm sm:text-base">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user) => (
                                <tr key={user._id} className='text-center'>
                                    <td className="px-4 py-2 border text-sm sm:text-base font-semibold capitalize">
                                        {user?.username}
                                    </td>
                                    <td className="px-4 py-2 border text-sm sm:text-base">
                                        {user?.email}
                                    </td>
                                    <td className="px-4 py-2 border text-sm sm:text-base">
                                        {editingUserId === user._id ? (
                                            <select
                                                className="px-2 py-2 border w-full sm:w-auto"
                                                value={user?.role}
                                                onChange={(e) =>
                                                    handleRoleChange(user?._id, e.target.value)
                                                }
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="user">User</option>
                                            </select>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                {user?.role}
                                                <CiEdit
                                                    className="text-green-600 cursor-pointer"
                                                    onClick={() => handleEditClick(user._id)}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border text-sm sm:text-base">
                                        <button
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="text-red-600 hover:text-red-800 transition"
                                            title="Delete"
                                        >
                                            <CiTrash size={22} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AllUsers;

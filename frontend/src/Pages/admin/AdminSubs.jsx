import React, { useState, useEffect } from 'react';
import { FaTrashAlt, FaUpload } from 'react-icons/fa';
import { CiEdit , CiTrash } from 'react-icons/ci';
import { createSub, getAllSubs, deleteSub, editSub } from '../../functions/subs';
import toast from 'react-hot-toast';
import { getAllCategories } from '../../functions/categories';

const AdminSubs = () => {
    const [subName, setSubName] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editSubId, setEditSubId] = useState(null);

    // Fetch all categories
    const fetchAllCategories = async () => {
        try {
            setLoading(true);
            const response = await getAllCategories();
            setCategories(response?.categories);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.log("Error in fetching all categories", error);
        }
    };

    // Fetch all subcategories
    const fetchSubs = async () => {
        try {
            const response = await getAllSubs();
            if (response?.success) {
                setSubs(response?.subCategories);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCategories();
        fetchSubs();
    }, []);

    // Handle image file selection
    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    // Reset form
    const resetForm = () => {
        setSubName('');
        setMetaDescription('');
        setImageFile(null);
        setSelectedCategory('');
        setEditMode(false);
        setEditSubId(null);
    };

    // Handle create or edit
    const handleCreateOrEditSubCategory = async () => {
        if (!subName.trim() || !selectedCategory || (!imageFile && !editMode)) {
            toast.error('Please provide all credentials: subcategory name, category, and image.');
            return;
        }
        const formData = new FormData();
        formData.append('name', subName);
        formData.append('category', selectedCategory);
        formData.append('metaDescription', metaDescription);
        if (imageFile) formData.append('image', imageFile);
        try {
            setLoading(true);
            let response;
            if (editMode && editSubId) {
                response = await editSub(editSubId, formData);
            } else {
                response = await createSub(formData);
            }
            if (response?.success) {
                resetForm();
                fetchSubs();
                toast.success(response?.message);
            }
        } catch (error) {
            console.error('Error creating/updating subcategory:', error);
            toast.error(error?.response?.data?.message || 'Failed to create/update subcategory.');
        } finally {
            setLoading(false);
        }
    };

    // Handle subcategory deletion
    const handleDeleteSub = async (id) => {
        try {
            setLoading(true)
            const response = await deleteSub(id);
            if (response?.success) {
                setSubs(subs.filter(sub => sub._id !== id));
                toast.success(response?.message);
                setLoading(false)
            }
        } catch (error) {
            setLoading(false)
            console.error("Error deleting subcategory:", error);
            toast.error('Failed to delete subcategory.');
        }
    };

    // Handle edit
    const handleEditSub = (sub) => {
        setSubName(sub.name);
        setMetaDescription(sub.metaDescription || '');
        setSelectedCategory(sub.category?._id || sub.category);
        setEditMode(true);
        setEditSubId(sub._id);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-2">
            <h3 className='text-main text-3xl font-extrabold text-center pb-6'>
                {editMode ? 'Edit Subcategory' : 'Create New Subcategory'}
            </h3>

            {/* Input Fields and Button */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="Enter subcategory name"
                    className="border-2 outline-none border-gray-200 p-3 rounded-lg w-full focus:border-main focus:ring-1 focus:ring-main transition-all duration-300"
                />
                <input
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Enter meta description"
                    className="border-2 outline-none border-gray-200 p-3 rounded-lg w-full focus:border-main focus:ring-1 focus:ring-main transition-all duration-300"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border-2 outline-none border-gray-200 p-3 rounded-lg w-full focus:border-main focus:ring-2 focus:ring-main transition-all duration-300"
                >
                    <option value="" disabled>Select a category</option>
                    {categories.map((category) => (
                        <option key={category?._id} value={category?._id}>
                            {category?.name}
                        </option>
                    ))}
                </select>
                <div className="flex flex-col w-full md:w-1/3 items-center justify-center">
                    {/* Image Preview */}
                    {(editMode && !imageFile && subs.length && editSubId) && (() => {
                        const sub = subs.find(s => s._id === editSubId);
                        if (sub && sub.image) {
                            return (
                                <img src={sub.image} alt="Current" className="w-20 h-20 object-cover rounded-lg mb-2 border" />
                            );
                        }
                        return null;
                    })()}
                    {/* New Image Preview */}
                    {imageFile && (
                        <img
                            src={URL.createObjectURL(imageFile)}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg mb-2 border"
                        />
                    )}
                    <label
                        htmlFor="image-input"
                        className="cursor-pointer outline-none text-main p-3 border-2 border-main hover:bg-secondary hover:text-white rounded-lg opacity-80 hover:opacity-100 transition-all duration-300 w-full flex items-center justify-center gap-2"
                    >
                        <FaUpload />
                        {imageFile ? 'Image selected' : (editMode ? 'Change Image (optional)' : 'Select Image')}
                    </label>
                    <input
                        id="image-input"
                        type="file"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </div>
                <button
                    onClick={handleCreateOrEditSubCategory}
                    disabled={loading}
                    className="bg-secondary opacity-80 hover:bg-opacity-90 text-white p-3 rounded-lg transition-all duration-300 w-full md:w-1/3 flex items-center justify-center gap-2"
                >
                    {editMode ? 'Update Subcategory' : 'Add Subcategory'}
                </button>
                {editMode && (
                    <button
                        onClick={resetForm}
                        className="bg-gray-300 text-gray-700 p-3 rounded-lg transition-all duration-300 w-full md:w-1/3 flex items-center justify-center gap-2"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Display Subcategories */}
            <h2 className='text-center text-2xl pb-2 font-extrabold text-main'>
                All Subcategories ({subs?.length})
            </h2>

            {loading ? (
                <div className="w-full flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-main opacity-90"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {subs.map((sub) => (
                        <div
                            key={sub._id}
                            className="flex  justify-between bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={sub?.image}
                                    alt={sub?.name}
                                    loading="lazy"
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                    <h3 className="text-xl capitalize font-semibold">{sub?.name}</h3>
                                    <p className="text-sm text-gray-500">{sub?.category?.name}</p>
                                    {sub?.metaDescription && (
                                        <p className="text-xs text-gray-400 mt-1">{sub.metaDescription}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <button
                                    onClick={() => handleEditSub(sub)}
                                    className="text-green-500 hover:text-green-700 transition"
                                    title="Edit"
                                >
                                    <CiEdit size={20} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSub(sub._id)}
                                    className="mt-2 text-red-600  hover:text-red-800 transition-all duration-300 flex items-center justify-center gap-2"
                                    title="Delete"
                                >
                                    <CiTrash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSubs;
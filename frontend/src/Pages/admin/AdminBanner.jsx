import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CiEdit } from "react-icons/ci";
import { IoTrash } from 'react-icons/io5';
import { addBanner, deleteBanner, getAdminBanners, updateBanner } from '../../functions/banner';

const AdminBanner = () => {
    const [banners, setBanners] = useState([]);
    const [image, setImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [link, setLink] = useState("");
    const [alt, setAlt] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const data = await getAdminBanners();
            if (data) setBanners(data);
        } catch (error) {
            console.log("Error in fetching banners", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        setPreviewImage(URL.createObjectURL(file)); // Show preview of the new selected image
    };

    const handleAddBanner = async (e) => {
        e.preventDefault();
        if (!image || !link) return alert("Image and link are required!");

        const formData = new FormData();
        formData.append("image", image);
        formData.append("link", link);
        formData.append("alt", (alt || '').trim());
        formData.append("isActive", isActive);

        setLoading(true);
        const response = await addBanner(formData);
        if (response) {
            fetchBanners();
            resetForm();
        }
        setLoading(false);
    };

    const handleUpdateBanner = async (e) => {
        e.preventDefault();
        if (!link) return alert("Link is required!");

        const formData = new FormData();
        if (image) formData.append("image", image);
        formData.append("link", link);
        formData.append("alt", (alt || '').trim());
        formData.append("isActive", isActive);

        try {
            setLoading(true);
            const response = await updateBanner(formData, editId);
            if (response) {
                toast.success("Banner updated.");
                fetchBanners();
                resetForm();
            }
        } catch (error) {
            toast.error("Failed to update");
            console.log("Error in updating banner", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner) => {
        setEditMode(true);
        setEditId(banner._id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLink(banner.link);
        setIsActive(banner.isActive);
        setPreviewImage(banner.image); // Show the existing image
        setAlt(banner.alt || "");
    };

    const handleDelete = async (id) => {
        try {
            if (!window.confirm("Are you sure you want to delete this banner?")) return;
            setLoading(true);
            const response = await deleteBanner(id);
            if (response) {
                fetchBanners();
                toast.success("Banner deleted");
            }
        } catch (error) {
            toast.error("Failed to delete");
            console.log("Error in deleting banner", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setImage(null);
        setPreviewImage(null);
        setLink("");
        setAlt("");
        setIsActive(true);
        setEditMode(false);
        setEditId(null);
    };

    return (
        <div className="max-w-full mx-auto px-6 py-3 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-center mb-4 text-main">Manage Banners</h1>

            {/* Loader */}
            {loading && (
                <div className="flex justify-center items-center my-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Add / Update Banner Form */}
            <form
                onSubmit={editMode ? handleUpdateBanner : handleAddBanner}
                className="bg-white p-6 rounded-lg shadow-md mb-6"
            >
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Banner Image</label>
                    <input
                        type="file"
                        onChange={handleImageChange}
                        className="w-full border rounded-lg p-2"
                    />
                </div>

                {/* Image Preview */}
                {previewImage && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600">Preview:</p>
                        <img src={previewImage} alt={alt || 'Preview'} className="w-32 h-16 object-cover rounded-lg" />
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Alt Text</label>
                    <input
                        type="text"
                        value={alt}
                        onChange={(e) => setAlt(e.target.value)}
                        className="w-full border rounded-lg p-2"
                        placeholder="Describe the banner (SEO alt text)"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Banner Link</label>
                    <input
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="w-full border rounded-lg p-2"
                        placeholder="Enter banner link"
                    />
                </div>

                <div className="mb-4 flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5"
                    />
                    <label className="text-sm font-medium text-gray-600">Active</label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-secondary/80  hover:bg-secondary text-primary py-2 rounded-lg transition"
                    disabled={loading}
                >
                    {editMode ? "Update Banner (1920x680)" : "Add Banner (1920x680)"}
                </button>
            </form>

            {/* Banners List */}
            <div className="max-w-full bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">All Banners</h2>
                {banners.length === 0 ? (
                    <p className="text-gray-600 text-center">No banners available</p>
                ) : (
                    <div className="space-y-4">
                        {banners.map((banner) => (
                            <div key={banner._id} className="flex flex-col md:flex-row max-w-full items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <img
                                    src={banner.image}
                                    alt={banner.alt || 'Banner'}
                                    loading="lazy"
                                    className="w-32 h-16 object-contain rounded-lg"
                                />
                                <div className="flex-1 ml-4 mt-4 md:mt-0">
                                    <a href={banner.link} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline inline-block w-[260px] md:max-w-full break-words">
                                        {banner.link}
                                    </a>
                                    {banner.alt && (
                                        <p className="text-xs text-gray-500 mt-1">Alt: {banner.alt}</p>
                                    )}

                                    <p className="text-sm text-gray-500">{banner.isActive ? "Active" : "Inactive"}</p>
                                </div>

                                <div className="flex gap-10 md:gap-4 mt-4 md:mt-0">
                                    <button
                                        onClick={() => handleEdit(banner)}
                                        className="text-green-500 hover:text-green-700"
                                    >
                                        <CiEdit className="text-xl md:text-2xl font-extrabold" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <IoTrash className="text-xl md:text-2xl font-extrabold" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBanner;

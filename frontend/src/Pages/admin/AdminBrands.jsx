import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoAdd, IoClose } from "react-icons/io5";
import { createBrand, deleteBrand, getAllBrands, updateBrand } from '../../functions/brand';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    alt: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchBrands();
    window.scrollTo(0, 0);
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await getAllBrands();
      if (response.brands) {
        setBrands(response.brands);
      }
    } catch (error) {
      toast.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('alt', (formData.alt || '').trim());
      
      if (selectedImage) {
        submitData.append('logo', selectedImage);
      }

      console.log('Submitting brand data:', formData);

      if (editingBrand) {
        await updateBrand(editingBrand._id, submitData);
        toast.success("Brand updated successfully!");
      } else {
        await createBrand(submitData);
        toast.success("Brand created successfully!");
      }

      setShowForm(false);
      setEditingBrand(null);
      resetForm();
      fetchBrands();
    } catch (error) {
      console.error('Error submitting brand:', error);
      toast.error(error.message || "Operation failed");
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name.replace(/-/g, ' '),
      alt: brand.alt || '',
    });
    setImagePreview(brand.logo || "");
    setSelectedImage(null);
    setShowForm(true);
  };

  const handleDelete = async (brandId) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      try {
        await deleteBrand(brandId);
        toast.success("Brand deleted successfully!");
        fetchBrands();
      } catch (error) {
        toast.error("Failed to delete brand");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      alt: "",
    });
    setSelectedImage(null);
    setImagePreview("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Brand Management
            </h1>
            <p className="text-gray-600">
              Create and manage brand logos for your website
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowForm(true);
              setEditingBrand(null);
              resetForm();
            }}
            className="bg-secondary/80 text-primary px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <IoAdd className="w-5 h-5" />
            Create Brand
          </motion.button>
        </div>

        {/* Brands List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              All Brands ({brands.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <motion.tr
                    key={brand._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {brand.logo && (
                          <img
                            src={brand.logo}
                            alt={brand.alt || brand.name}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {brand.name.replace(/-/g, ' ')}
                          </div>
                          {brand.alt && (
                            <div className="text-xs text-gray-500">Alt: {brand.alt}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {brand.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-green-600 hover:text-green-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <CiEdit size={22} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <CiTrash size={22} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {editingBrand ? "Edit Brand" : "Create New Brand"}
                    </h2>
                    <button
                      onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <IoClose className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Brand Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter brand name"
                      required
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      name="alt"
                      value={formData.alt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Brand logo alt (e.g., 'Acme logo')"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Logo {!editingBrand && '*'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended size: 200x200 px. {editingBrand && "Leave empty to keep current image."}
                    </p>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt={formData.alt || 'Preview'}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-secondary text-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {editingBrand ? "Update Brand" : "Create Brand"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminBrands;

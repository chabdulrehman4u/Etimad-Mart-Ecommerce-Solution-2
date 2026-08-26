import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CiEdit, CiTrash } from "react-icons/ci";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import {
    IoAdd,
    IoClose,
    IoStatsChart
} from "react-icons/io5";
import {
    createPopup,
    deletePopup,
    getAllPopups,
    getPopupsAnalyticsSummary,
    togglePopupStatus,
    updatePopup,
} from "../../functions/popup";

const AdminPopups = () => {
  const [popups, setPopups] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    productLink: "",
    buttonText: "Shop Now",
    isActive: true,
    displaySettings: {
      delay: 3000,
      frequency: "once",
      showOnMobile: true,
      showOnDesktop: true,
    },
    targeting: {
      showOnPages: ["all"],
      excludePages: [],
      userType: "all",
    },
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchPopups();
    fetchAnalytics();
    window.scrollTo(0, 0);
  }, []);

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const response = await getAllPopups();
      if (response.success) {
        setPopups(response.popups);
      }
    } catch (error) {
      toast.error("Failed to fetch popups");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await getPopupsAnalyticsSummary();
      if (response.success) {
        setAnalytics(response.summary);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
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
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        image: selectedImage,
      };

      console.log('Submitting popup data:', submitData);
      console.log('Targeting data:', submitData.targeting);
      console.log('Display settings:', submitData.displaySettings);

      if (editingPopup) {
        await updatePopup(editingPopup._id, submitData);
        toast.success("Popup updated successfully!");
      } else {
        await createPopup(submitData);
        toast.success("Popup created successfully!");
      }

      setShowForm(false);
      setEditingPopup(null);
      resetForm();
      fetchPopups();
    } catch (error) {
      console.error('Error submitting popup:', error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (popup) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      content: popup.content,
      productLink: popup.productLink || "",
      buttonText: popup.buttonText || "Shop Now",
      isActive: popup.isActive,
      displaySettings: popup.displaySettings,
      targeting: {
        showOnPages: popup.targeting?.showOnPages || ["all"],
        excludePages: popup.targeting?.excludePages || [],
        userType: popup.targeting?.userType || "all",
      },
      startDate: popup.startDate
        ? new Date(popup.startDate).toISOString().split("T")[0]
        : "",
      endDate: popup.endDate
        ? new Date(popup.endDate).toISOString().split("T")[0]
        : "",
    });
    setImagePreview(popup.image || "");
    setSelectedImage(null);
    setShowForm(true);
  };

  const handleDelete = async (popupId) => {
    if (window.confirm("Are you sure you want to delete this popup?")) {
      try {
        await deletePopup(popupId);
        toast.success("Popup deleted successfully!");
        fetchPopups();
      } catch (error) {
        toast.error("Failed to delete popup");
      }
    }
  };

  const handleToggleStatus = async (popupId) => {
    try {
      await togglePopupStatus(popupId);
      toast.success("Popup status updated!");
      fetchPopups();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      productLink: "",
      buttonText: "Shop Now",
      isActive: true,
      displaySettings: {
        delay: 3000,
        frequency: "once",
        showOnMobile: true,
        showOnDesktop: true,
      },
      targeting: {
        showOnPages: ["all"],
        excludePages: [],
        userType: "all",
      },
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
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
              Popup Management
            </h1>
            <p className="text-gray-600">
              Create and manage popup banners for your website
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowForm(true);
              setEditingPopup(null);
              resetForm();
            }}
            className="bg-secondary/80 text-primary px-6 py-3 rounded-lg font-medium hover:bg-secondarytransition-colors flex items-center gap-2"
          >
            <IoAdd className="w-5 h-5" />
            Create Popup
          </motion.button>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {analytics.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{item.title}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {item.impressions}
                  </p>
                </div>
                <IoStatsChart className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                CTR: {item.ctr}% | Clicks: {item.clicks}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Popups List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Popups</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analytics
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
                {popups.map((popup) => (
                  <motion.tr
                    key={popup._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {popup.image && (
                          <img
                            src={popup.image}
                            alt={popup.title}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {popup.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {popup.content.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(popup._id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          popup.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {popup.isActive ? (
                          <FaToggleOn className="w-4 h-4" />
                        ) : (
                          <FaToggleOff className="w-4 h-4" />
                        )}
                        {popup.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>
                          Impressions: {popup.analytics?.impressions || 0}
                        </div>
                        <div>Clicks: {popup.analytics?.clicks || 0}</div>
                        <div className="text-gray-500">
                          CTR: {popup.ctr || 0}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(popup.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(popup)}
                          className="p-2 text-green-600 hover:text-green-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <CiEdit size={22} />
                        </button>
                        <button
                          onClick={() => handleDelete(popup._id)}
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
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {editingPopup ? "Edit Popup" : "Create New Popup"}
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
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text
                      </label>
                      <input
                        type="text"
                        name="buttonText"
                        value={formData.buttonText}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Link
                    </label>
                    <input
                      type="url"
                      name="productLink"
                      value={formData.productLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/product"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Popup Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended size: 480x300 px.
                    </p>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Display Settings */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Display Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delay (seconds)
                        </label>
                        <input
                          type="number"
                          name="displaySettings.delay"
                          value={formData.displaySettings.delay / 1000}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) * 1000;
                            setFormData((prev) => ({
                              ...prev,
                              displaySettings: {
                                ...prev.displaySettings,
                                delay: value,
                              },
                            }));
                          }}
                          min="0"
                          max="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency
                        </label>
                        <select
                          name="displaySettings.frequency"
                          value={formData.displaySettings.frequency}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="always">Always</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Page Targeting */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Page Targeting
                    </h3>

                    {/* Show On Pages */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Show On Pages
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { value: "all", label: "All Pages" },
                          { value: "home", label: "Home Page" },
                          { value: "product", label: "Product Pages" },
                          { value: "category", label: "Category Pages" },
                          { value: "shop", label: "Shop Page" },
                          { value: "cart", label: "Cart Page" },
                          { value: "search", label: "Search Page" },
                          { value: "order-history", label: "Order History" },
                          { value: "login", label: "Login Page" },
                          { value: "signup", label: "Signup Page" },
                        ].map((page) => (
                          <label
                            key={page.value}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={(formData.targeting?.showOnPages || []).includes(
                                page.value
                              )}
                              onChange={(e) => {
                                const currentShowOnPages = formData.targeting?.showOnPages || [];
                                const newShowOnPages = e.target.checked
                                  ? [
                                      ...currentShowOnPages,
                                      page.value,
                                    ]
                                  : currentShowOnPages.filter(
                                      (p) => p !== page.value
                                    );

                                // If "All Pages" is selected, remove other selections
                                if (page.value === "all" && e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targeting: {
                                      ...prev.targeting,
                                      showOnPages: ["all"],
                                    },
                                  }));
                                } else if (page.value !== "all") {
                                  // Remove "all" if specific pages are selected
                                  const filteredPages = newShowOnPages.filter(
                                    (p) => p !== "all"
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    targeting: {
                                      ...prev.targeting,
                                      showOnPages:
                                        filteredPages.length > 0
                                          ? filteredPages
                                          : ["all"],
                                    },
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">
                              {page.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Exclude Pages */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exclude From Pages
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { value: "checkout", label: "Checkout Page" },
                          { value: "admin", label: "Admin Pages" },
                          { value: "login", label: "Login Page" },
                          { value: "signup", label: "Signup Page" },
                          { value: "order-history", label: "Order History" },
                        ].map((page) => (
                          <label
                            key={page.value}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={(formData.targeting?.excludePages || []).includes(
                                page.value
                              )}
                              onChange={(e) => {
                                const currentExcludePages = formData.targeting?.excludePages || [];
                                const newExcludePages = e.target.checked
                                  ? [
                                      ...currentExcludePages,
                                      page.value,
                                    ]
                                  : currentExcludePages.filter(
                                      (p) => p !== page.value
                                    );

                                setFormData((prev) => ({
                                  ...prev,
                                  targeting: {
                                    ...prev.targeting,
                                    excludePages: newExcludePages,
                                  },
                                }));
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">
                              {page.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* User Type Targeting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Type
                      </label>
                      <select
                        name="targeting.userType"
                        value={formData.targeting.userType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Users</option>
                        <option value="guest">Guest Users Only</option>
                        <option value="registered">
                          Registered Users Only
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
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
                      {editingPopup ? "Update Popup" : "Create Popup"}
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

export default AdminPopups;

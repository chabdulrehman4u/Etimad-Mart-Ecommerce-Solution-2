import React, { useState, useEffect } from "react";
import { CiEdit, CiTrash } from "react-icons/ci";
import {
  createCategory,
  getAllCategories,
  deleteCategory,
  editCategory,
} from "../../functions/categories";
import toast from "react-hot-toast";

const AdminCategories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [alt, setAlt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response?.success) {
        setCategories(response?.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const resetForm = () => {
    setCategoryName("");
    setMetaDescription("");
    setAlt("");
    setImageFile(null);
    setEditMode(false);
    setEditCategoryId(null);
  };

  const handleCreateOrEditCategory = async () => {
    if (categoryName.trim() && (imageFile || editMode)) {
      const formData = new FormData();
      formData.append("name", categoryName);
      formData.append("metaDescription", metaDescription);
      formData.append("alt", (alt || '').trim());
      if (imageFile) formData.append("image", imageFile);

      try {
        setLoading(true);
        let response;
        if (editMode && editCategoryId) {
          response = await editCategory(editCategoryId, formData);
        } else {
          response = await createCategory(formData);
        }
        if (response?.success) {
          resetForm();
          setLoading(false);
          fetchCategories();
          toast.success(response?.message);
        }
      } catch (error) {
        console.error("Error creating/updating category:", error);
        toast.error(error?.response?.data?.message);
      }
    } else {
      toast.error("Please provide category name and image");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await deleteCategory(id);
      if (response?.success) {
        setCategories(categories.filter((cat) => cat._id !== id));
      }
      toast.success(response?.message);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleEditCategory = (cat) => {
    setCategoryName(cat.name);
    setMetaDescription(cat.metaDescription || "");
    setAlt(cat.alt || "");
    setEditMode(true);
    setEditCategoryId(cat._id);
    setImageFile(null); // User can choose to update image
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <div className="w-full bg-white shadow-lg rounded-lg p-6 mb-8">
        <h3 className="text-primary text-3xl font-extrabold text-center pb-6">
          {editMode ? "Edit Category" : "Create New Category"}
        </h3>

        {/* Input Fields and Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="border outline-none border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-200 transition"
          />
          <input
            type="text"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Enter meta description"
            className="border outline-none border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-200 transition"
          />
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text for category image"
            className="border outline-none border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-200 transition"
          />
          <div className="flex flex-col w-full md:w-1/3 items-center justify-center">
            {/* Image Preview */}
            {editMode &&
              !imageFile &&
              categories.length &&
              editCategoryId &&
              (() => {
                const cat = categories.find((c) => c._id === editCategoryId);
                if (cat && cat.Image) {
                  return (
                    <img
                      src={cat.Image}
                      alt={cat.alt || 'Current'}
                      className="w-20 h-20 object-cover rounded-md mb-2 border"
                    />
                  );
                }
                return null;
              })()}
            {/* New Image Preview */}
            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)}
                alt={alt || 'Preview'}
                className="w-20 h-20 object-cover rounded-md mb-2 border"
              />
            )}
            <label
              htmlFor="image-input"
              className="cursor-pointer outline-none text-primary p-3 border-2 border-main hover:bg-main hover:text-white rounded-md opacity-80 hover:bg-opacity-90 transition w-full flex items-center justify-center"
            >
              {imageFile
                ? "Image selected"
                : editMode
                ? "Change Image (optional)"
                : "Select Image"}
            </label>
            <input
              id="image-input"
              type="file"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <button
            onClick={handleCreateOrEditCategory}
            className="bg-secondary opacity-80 hover:bg-opacity-90 text-white p-3 rounded-md transition w-full md:w-1/3 flex items-center justify-center"
          >
            {loading
              ? editMode
                ? "Updating..."
                : "Adding..."
              : editMode
              ? "Update Category"
              : "Add Category"}
          </button>
          {editMode && (
            <button
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 p-3 rounded-md transition w-full md:w-1/3 flex items-center justify-center"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      <hr className="my-6 border-gray-200" />
      <h2 className="text-center text-2xl pb-2 font-extrabold text-primary">
        All Categories ({`${categories?.length}`})
      </h2>

      {loading ? (
        <div className="w-full flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-main opacity-90"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 hover:shadow-xl hover:scale-[1.01] transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={cat?.Image}
                  alt={cat?.alt || cat?.name}
                  loading="lazy"
                  className="w-20 h-20 border-2 border-gray-200 rounded-md"
                />
                <div>
                  <h3 className="text-xl capitalize font-semibold">{cat?.name}</h3>
                  {cat?.alt && (
                    <p className="text-xs text-gray-500 mt-1">Alt: {cat.alt}</p>
                  )}
                  {cat?.metaDescription && (
                    <p className="text-xs text-gray-400 mt-1">
                      {cat.metaDescription}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleEditCategory(cat)}
                  className="text-green-500 hover:text-green-700 transition"
                  title="Edit"
                >
                  <CiEdit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="text-red-600  hover:text-red-800 transition"
                  title="Delete"
                >
                  <CiTrash size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;

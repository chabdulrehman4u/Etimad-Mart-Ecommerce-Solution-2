import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getCategories,
} from "../../functions/blog";
import { uploadImage } from "../../functions/media";
import { CiEdit, CiTrash } from "react-icons/ci";
import { FaEye, FaUpload, FaTrash } from "react-icons/fa";

const initialState = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  metaDescription: "",
  featuredImage: "",
  author: "Admin",
  category: "General",
  tags: [],
  isPublished: false,
};

const AdminBlog = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mode, setMode] = useState("list"); // 'list', 'create', 'edit'
  const [editingId, setEditingId] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchBlogs = async () => {
    try {
      const data = await getAllBlogs();
      setBlogs(data);
    } catch (err) {
      setMessage("Error fetching blogs");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.log("Error fetching categories");
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContentChange = (value) => {
    setForm((prev) => ({ ...prev, content: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setMessage('');
    try {
      const result = await uploadImage(file, 'blog-featured');
      setForm((prev) => ({ ...prev, featuredImage: result.url }));
      setMessage('Image uploaded successfully!');
    } catch (err) {
      setMessage(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, featuredImage: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "edit" && editingId) {
        await updateBlog(editingId, form);
        setMessage("Blog post updated successfully!");
      } else {
        await createBlog(form);
        setMessage("Blog post created successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setMode("list");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchBlogs();
      fetchCategories();
    } catch (err) {
      setMessage(err.message || "Error saving blog post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setForm({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      metaDescription: blog.metaDescription,
      featuredImage: blog.featuredImage,
      author: blog.author,
      category: blog.category,
      tags: blog.tags || [],
      isPublished: blog.isPublished,
    });
    setEditingId(blog._id);
    setMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog post?"))
      return;
    setLoading(true);
    setMessage("");
    try {
      await deleteBlog(id);
      setMessage("Blog post deleted successfully!");
      fetchBlogs();
    } catch (err) {
      setMessage(err.message || "Error deleting blog post");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialState);
    setEditingId(null);
    setMode("list");
  };

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  useEffect(() => {
    if (mode === "create" && form.title && !form.slug) {
      setForm((prev) => ({ ...prev, slug: generateSlug(form.title) }));
    }
  }, [form.title, mode]);

  // --- Form UI ---
  if (mode === "create" || mode === "edit") {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-bold mb-6">
          {mode === "edit" ? "Edit Blog Post" : "Create Blog Post"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Slug *</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="e.g. my-blog-post"
                required
                disabled={mode === "edit"}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Excerpt</label>
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              rows={2}
              placeholder="Short summary (shown in blog listing)"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Content *</label>
            <ReactQuill
              value={form.content}
              onChange={handleContentChange}
              theme="snow"
              className="bg-white blog-quill-editor"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>

          {/* Featured Image Upload */}
          <div>
            <label className="block font-medium mb-1">Featured Image</label>
            {form.featuredImage ? (
              <div className="relative">
                <img
                  src={form.featuredImage}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                  title="Remove image"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="featured-image-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="featured-image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FaUpload className="text-4xl text-gray-400" />
                  <span className="text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload featured image'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Author</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                list="categories"
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block font-medium mb-1">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="flex-1 border px-3 py-2 rounded"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Meta Description</label>
            <textarea
              name="metaDescription"
              value={form.metaDescription}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              maxLength={160}
              placeholder="SEO description (max 160 chars)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              id="isPublished"
            />
            <label htmlFor="isPublished">Published</label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading
                ? mode === "edit"
                  ? "Updating..."
                  : "Creating..."
                : mode === "edit"
                ? "Update Post"
                : "Create Post"}
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          {message && (
            <div className={`mt-3 text-center text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    );
  }

  // --- List UI ---
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Blog Posts</h2>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            setMode("create");
            setForm(initialState);
            setEditingId(null);
          }}
        >
          Add Blog Post
        </button>
      </div>
      {message && (
        <div className={`mb-4 text-center text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Category</th>
              <th className="py-2 px-4 border-b">Author</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Views</th>
              <th className="py-2 px-4 border-b">Created</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No blog posts found.
                </td>
              </tr>
            )}
            {blogs.map((blog) => (
              <tr key={blog._id} className="hover:bg-gray-50 text-center">
                <td className="py-2 px-4 border-b font-semibold text-left">
                  {blog.title}
                </td>
                <td className="py-2 px-4 border-b">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {blog.category}
                  </span>
                </td>
                <td className="py-2 px-4 border-b text-sm">{blog.author}</td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      blog.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {blog.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span className="flex items-center justify-center gap-1">
                    <FaEye className="text-gray-500" />
                    {blog.viewCount}
                  </span>
                </td>
                <td className="py-2 px-4 border-b text-xs text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 border-b">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="p-2 rounded hover:bg-yellow-100 text-yellow-600 hover:text-yellow-800 transition"
                      onClick={() => handleEdit(blog)}
                      disabled={loading}
                      title="Edit"
                    >
                      <CiEdit size={22} />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                      onClick={() => handleDelete(blog._id)}
                      disabled={loading}
                      title="Delete"
                    >
                      <CiTrash size={22} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBlog;

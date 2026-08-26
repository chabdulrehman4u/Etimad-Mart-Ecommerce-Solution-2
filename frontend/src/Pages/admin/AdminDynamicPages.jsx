import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getAllPages,
  createPage,
  updatePage,
  deletePage,
} from "../../functions/pages";
import { CiEdit, CiTrash } from "react-icons/ci";

const initialState = {
  title: "",
  slug: "",
  metaDescription: "",
  content: "",
  isPublished: true,
};

const AdminDynamicPages = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState([]);
  const [mode, setMode] = useState("list"); // 'list', 'create', 'edit'
  const [editingId, setEditingId] = useState(null);

  const fetchPages = async () => {
    try {
      const data = await getAllPages();
      setPages(data);
    } catch (err) {
      setMessage("Error fetching pages");
    }
  };

  useEffect(() => {
    fetchPages();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "edit" && editingId) {
        await updatePage(editingId, form);
        setMessage("Page updated successfully!");
      } else {
        await createPage(form);
        setMessage("Page added successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setMode("list");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchPages();
    } catch (err) {
      setMessage(err.message || "Error saving page");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page) => {
    setForm({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription,
      content: page.content,
      isPublished: page.isPublished,
    });
    setEditingId(page._id);
    setMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    setLoading(true);
    setMessage("");
    try {
      await deletePage(id);
      setMessage("Page deleted successfully!");
      fetchPages();
    } catch (err) {
      setMessage(err.message || "Error deleting page");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialState);
    setEditingId(null);
    setMode("list");
  };

  // --- UI ---
  if (mode === "create" || mode === "edit") {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-bold mb-6">
          {mode === "edit" ? "Edit Page" : "Create Dynamic Page"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-1">Title</label>
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
            <label className="block font-medium mb-1">Slug</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="e.g. about-us"
              required
              disabled={mode === "edit"}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Meta Description</label>
            <textarea
              name="metaDescription"
              value={form.metaDescription}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              maxLength={160}
              placeholder="Short summary for SEO (max 160 chars)"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Content</label>
            <ReactQuill
              value={form.content}
              onChange={handleContentChange}
              theme="snow"
              className="bg-white"
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
                ? "Update Page"
                : "Create Page"}
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
            <div className="mt-3 text-center text-sm text-green-600">
              {message}
            </div>
          )}
        </form>
      </div>
    );
  }

  // --- List UI ---
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Pages</h2>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            setMode("create");
            setForm(initialState);
            setEditingId(null);
          }}
        >
          Add Page
        </button>
      </div>
      {message && (
        <div className="mb-4 text-center text-sm text-green-600">{message}</div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Slug</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Created</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No pages found.
                </td>
              </tr>
            )}
            {pages.map((page) => (
              <tr key={page._id} className="hover:bg-gray-50 text-center">
                <td className="py-2 px-4 border-b font-semibold">
                  {page.title}
                </td>
                <td className="py-2 px-4 border-b text-blue-600">
                  /{page.slug}
                </td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      page.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {page.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b text-xs text-gray-400">
                  {new Date(page.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 border-b flex gap-2">
                  <button
                    className="p-2 rounded hover:bg-yellow-100 text-yellow-600 hover:text-yellow-800 transition"
                    onClick={() => handleEdit(page)}
                    disabled={loading}
                    title="Edit"
                  >
                    <CiEdit size={22} />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                    onClick={() => handleDelete(page._id)}
                    disabled={loading}
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
    </div>
  );
};

export default AdminDynamicPages;

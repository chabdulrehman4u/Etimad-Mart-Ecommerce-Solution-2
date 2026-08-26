import React, { useEffect, useMemo, useState } from "react";
import {
  createLogo,
  updateLogo,
  getAdminLogos,
  deleteLogo,
} from "../../functions/logo";
import { FaPlus } from "react-icons/fa";
import { CiEdit, CiTrash } from "react-icons/ci";
import toast from "react-hot-toast";

const AdminLogo = () => {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null); // logo object or null

  // form state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isEnable, setIsEnable] = useState(true);

  const resetForm = () => {
    setEditing(null);
    setFile(null);
    setPreview("");
    setIsEnable(true);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (logo) => {
    setEditing(logo);
    setIsEnable(Boolean(logo?.isEnable));
    setPreview(logo?.image || "");
    setFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const loadLogos = async () => {
    try {
      setLoading(true);
      const res = await getAdminLogos();
      // backend returns { logos }
      setLogos(res?.logos || []);
    } catch (e) {
      toast.error("Failed to load logos");
      // console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editing) {
        await updateLogo(editing._id, { image: file || undefined, isEnable });
        toast.success("Logo updated");
      } else {
        if (!file) {
          toast.error("Please select a logo image");
          return;
        }
        await createLogo({ image: file, isEnable });
        toast.success("Logo created");
      }
      closeModal();
      await loadLogos();
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  // toggle removed per request

  const handleDelete = async (logo) => {
    const ok = window.confirm("Delete this logo?");
    if (!ok) return;
    try {
      await deleteLogo(logo._id);
      toast.success("Logo deleted");
      setLogos((prev) => prev.filter((l) => l._id !== logo._id));
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const activeLogoId = useMemo(
    () => logos.find((l) => l.isEnable)?.["_id"],
    [logos]
  );

  return (
    <div className="space-y-5 mt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Logo Management</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-md hover:bg-gray-700"
        >
          <FaPlus className="text-base" /> New Logo
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded shadow p-3">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : logos.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No logos yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <div
                key={logo._id}
                className="border rounded-md bg-gray-50 flex flex-col shadow-sm overflow-hidden"
              >
                <div className="aspect-video bg-white flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.image}
                    alt="logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-3 flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      logo.isEnable
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {logo.isEnable ? "Active" : "Inactive"}
                  </span>
                  {activeLogoId === logo._id && (
                    <span className="text-[10px] text-green-700">
                      (current)
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(logo)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-200 shrink-0"
                      title="Edit"
                    >
                      <CiEdit className="text-base" />
                    </button>
                    <button
                      onClick={() => handleDelete(logo)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-100 text-red-600 shrink-0"
                      title="Delete"
                    >
                      <CiTrash className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 top-5 z-[1000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={submitting ? undefined : closeModal}
          />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-lg p-4 z-[1001]">
            <h2 className="text-lg font-semibold mb-3">
              {editing ? "Update Logo" : "Create Logo"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                {preview ? (
                  <div className="mb-2 border rounded flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="preview"
                      className="max-h-40 object-contain"
                    />
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm"
                />
                {!editing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a logo image(910x270)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isEnable"
                  type="checkbox"
                  checked={isEnable}
                  onChange={(e) => setIsEnable(e.target.checked)}
                />
                <label htmlFor="isEnable" className="text-sm">
                  Active
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-2 rounded border hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded text-white ${
                    submitting ? "bg-gray-400" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {submitting ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogo;

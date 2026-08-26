import React, { useEffect, useMemo, useState } from "react";
import {
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminToggleCoupon,
  adminDeleteCoupon,
} from "../../functions/coupon";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiEdit2 } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { CiEdit, CiTrash } from "react-icons/ci";
import { getAllCategories } from "../../functions/categories";

const initialForm = {
  code: "",
  type: "percent", // 'percent' | 'fixed'
  value: 10,
  maxDiscount: 0,
  minOrder: 0,
  startsAt: "",
  expiresAt: "",
  usageLimit: 0,
  perUserLimit: 0,
  active: true,
  notes: "",
  // Leave empty for sitewide; otherwise, apply only to selected categories
  allowedCategoryIds: [],
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("any"); // any|true|false

  // Categories for targeting
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (q.trim()) params.q = q.trim();
      if (active !== "any") params.active = active;
      const res = await adminListCoupons(params);
      setCoupons(res?.items || []);
      setTotal(res?.total || 0);
    } catch (e) {
      toast.error(e?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, active]);

  // Fetch categories once for the selector
  useEffect(() => {
    const fetchCats = async () => {
      try {
        setCatsLoading(true);
        const res = await getAllCategories();
        if (res?.success && Array.isArray(res?.categories)) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        setCatsLoading(false);
      }
    };
    fetchCats();
  }, []);

  const resetAndClose = () => {
    setModalOpen(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || "",
      type: c.type || "percent",
      value: c.value ?? 0,
      maxDiscount: c.maxDiscount ?? 0,
      minOrder: c.minOrder ?? 0,
      startsAt: c.startsAt ? c.startsAt.substring(0, 16) : "",
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 16) : "",
      usageLimit: c.usageLimit ?? 0,
      perUserLimit: c.perUserLimit ?? 0,
      active: Boolean(c.active),
      notes: c.notes || "",
      allowedCategoryIds: Array.isArray(c.allowedCategoryIds)
        ? c.allowedCategoryIds.map((id) => String(id))
        : [],
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (!form.code.trim()) {
        toast.error("Code is required");
        return;
      }
      if (!["percent", "fixed"].includes(form.type)) {
        toast.error("Invalid type");
        return;
      }
      if (Number.isNaN(Number(form.value))) {
        toast.error("Value must be a number");
        return;
      }
      setSaving(true);
      const payload = {
        ...form,
        value: Number(form.value),
        maxDiscount: Number(form.maxDiscount || 0),
        minOrder: Number(form.minOrder || 0),
        usageLimit: Number(form.usageLimit || 0),
        perUserLimit: Number(form.perUserLimit || 0),
        startsAt: form.startsAt ? new Date(form.startsAt) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
        allowedCategoryIds: Array.isArray(form.allowedCategoryIds)
          ? form.allowedCategoryIds.filter(Boolean)
          : [],
      };
      if (editingId) {
        await adminUpdateCoupon(editingId, payload);
        toast.success("Coupon updated");
      } else {
        await adminCreateCoupon(payload);
        toast.success("Coupon created");
      }
      resetAndClose();
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    try {
      await adminToggleCoupon(id);
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to toggle");
    }
  };

  const remove = async (id) => {
    const ok = window.confirm("Delete this coupon?");
    if (!ok) return;
    try {
      await adminDeleteCoupon(id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded bg-primary text-secondary hover:bg-secondary hover:text-primary"
          >
            New Coupon
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code..."
              className="w-full md:w-64 border outline-none focus:ring-0 rounded px-3 py-2"
            />
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="any">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button
              onClick={() => {
                setPage(1);
                load();
              }}
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Min Order</th>
                <th className="px-3 py-2">Max Discount</th>
                <th className="px-3 py-2">Starts</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-3 py-4" colSpan={10}>
                    Loading…
                  </td>
                </tr>
              ) : coupons.length ? (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="px-3 py-2 font-semibold">{c.code}</td>
                    <td className="px-3 py-2 capitalize">{c.type}</td>
                    <td className="px-3 py-2">
                      {c.type === "percent"
                        ? `${c.value}%`
                        : `Rs.${Number(c.value).toLocaleString()}`}
                    </td>
                    <td className="px-3 py-2">
                      {Array.isArray(c.allowedCategoryIds) && c.allowedCategoryIds.length > 0
                        ? `${c.allowedCategoryIds.length} categor${c.allowedCategoryIds.length > 1 ? "ies" : "y"}`
                        : "Sitewide"}
                    </td>
                    <td className="px-3 py-2">
                      Rs.{Number(c.minOrder || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {Number(c.maxDiscount || 0) > 0
                        ? `Rs.${Number(c.maxDiscount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {c.startsAt ? new Date(c.startsAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          c.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end items-center gap-3">
                        {/* Active switch */}
                        <label
                          className="inline-flex items-center cursor-pointer"
                          title={c.active ? "Active" : "Inactive"}
                        >
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!!c.active}
                            onChange={() => toggle(c._id)}
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 relative transition-colors">
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                          </div>
                        </label>

                        {/* Edit icon */}
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded  hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          aria-label="Edit coupon"
                          title="Edit"
                        >
                          <CiEdit
                            className=" text-green-500 hover:text-green-700"
                            size={20}
                          />
                        </button>

                        {/* Delete icon */}
                        <button
                          onClick={() => remove(c._id)}
                          className="p-2 rounded hover:bg-red-50 border border-transparent hover:border-red-200"
                          aria-label="Delete coupon"
                          title="Delete"
                        >
                          <CiTrash className="text-red-600" size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4" colSpan={10}>
                    No coupons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} • {total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <select
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {Array.from({ length: totalPages }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 md:p-7 max-h-[95vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingId ? "Edit Coupon" : "New Coupon"}
              </h3>
              <button
                onClick={() => !saving && resetAndClose()}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. SAVE10"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Uppercase recommended. Unique.
                </p>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (Rs.)</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: Number(e.target.value) }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {form.type === "percent" ? "%" : "Rs"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Max Discount (Rs.)
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxDiscount: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">0 = no cap</p>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Min Order (Rs.)
                </label>
                <input
                  type="number"
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      usageLimit: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">0 = unlimited</p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Per User Limit
                </label>
                <input
                  type="number"
                  value={form.perUserLimit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      perUserLimit: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">0 = unlimited</p>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiresAt: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 flex items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                  />{" "}
                  Active
                </label>
              </div>
              {/* Category targeting */}
              <div className="md:col-span-12">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 mb-1">Applies to categories</label>
                  <div className="text-[11px] text-gray-500">
                    {form.allowedCategoryIds?.length ? (
                      <>
                        Selected: {form.allowedCategoryIds.length} • Empty = sitewide
                        <button
                          type="button"
                          className="ml-2 underline text-primary"
                          onClick={() => setForm((f) => ({ ...f, allowedCategoryIds: [] }))}
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      "Sitewide (select categories to limit)"
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-auto border rounded-lg p-2">
                  {catsLoading ? (
                    <div className="text-sm text-gray-500 p-2">Loading categories…</div>
                  ) : categories?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((cat) => {
                        const checked = form.allowedCategoryIds?.includes(String(cat._id));
                        return (
                          <label key={cat._id} className="inline-flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={(e) => {
                                const id = String(cat._id);
                                setForm((f) => {
                                  const set = new Set(f.allowedCategoryIds || []);
                                  if (e.target.checked) set.add(id);
                                  else set.delete(id);
                                  return { ...f, allowedCategoryIds: Array.from(set) };
                                });
                              }}
                            />
                            <span className="capitalize">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2">No categories found</div>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">Only items in selected categories will be discounted. Delivery is never discounted for category-specific coupons.</p>
              </div>
              <div className="md:col-span-12">
                <label className="block text-xs text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => !saving && resetAndClose()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Coupons;

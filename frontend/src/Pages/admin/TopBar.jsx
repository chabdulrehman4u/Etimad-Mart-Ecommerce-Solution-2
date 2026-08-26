import React, { useEffect, useState } from "react";
import TopbarTextForm from "../../components/forms/TopBarForm";
import {
  addText,
  updateTopBar,
  gettAllTexts,
  deleteBarText,
} from "../../functions/topbar";
import { CiEdit, CiTrash } from "react-icons/ci";
import { toast } from "react-hot-toast";

const AdminTopbarText = () => {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchTexts = async () => {
    setLoading(true);
    const res = await gettAllTexts();
    setTexts(res?.allBarTexts || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const handleAdd = async (data) => {
    try {
      setLoading(true);
      await addText({ text: data.text, enabled: data.enabled });
      fetchTexts();
      setLoading(false);
      setEditItem(null);
      toast.success("Text added.");
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Error in adding text.");
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (data) => {
    try {
      setLoading(true);
      await updateTopBar(
        { text: data.text, enabled: data.enabled },
        editItem._id
      );
      toast.success("Text updated.");
      setEditItem(null);
      fetchTexts();
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Error in updating text");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this text?")) {
      setLoading(true);
      await deleteBarText(id);
      toast.success("Text deleted.");
      fetchTexts();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* <h1 className="text-3xl font-bold mb-6 text-center">
        Topbar Text Management
      </h1> */}
      <div className="mb-8">
        <TopbarTextForm
          initialValues={
            editItem
              ? { text: editItem.text, enabled: editItem.isEnable }
              : { text: "", enabled: false }
          }
          onSubmit={editItem ? handleUpdate : handleAdd}
          loading={loading}
          mode={editItem ? "edit" : "add"}
        />
        {editItem && (
          <button
            className="mt-2 text-sm text-gray-500 underline"
            onClick={() => setEditItem(null)}
          >
            Cancel Edit
          </button>
        )}
      </div>
      <h2 className="text-xl font-semibold mb-4">All Topbar Texts</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-4">
          {texts.map((item) => (
            <li
              key={item._id}
              className="flex items-center justify-between bg-white p-4 rounded shadow"
            >
              <div>
                <div className="font-medium">{item.text}</div>
                <div className="text-sm text-gray-500">
                  {item.isEnable ? "Enabled" : "Disabled"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={() => handleEdit(item)}
                  title="Edit"
                >
                  <CiEdit size={22} />
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(item._id)}
                  title="Delete"
                >
                  <CiTrash size={22} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminTopbarText;

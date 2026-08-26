import React, { useState, useEffect } from "react";

const TopbarTextForm = ({
  initialValues = { text: "", enabled: false },
  onSubmit,
  loading = false,
  mode = "add",
}) => {
  const [text, setText] = useState(initialValues.text);
  const [enabled, setEnabled] = useState(initialValues.enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    setText(initialValues.text);
    setEnabled(initialValues.enabled);
  }, [initialValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Text is required.");
      return;
    }
    setError("");
    onSubmit({ text, enabled });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 shadow-lg rounded-xl max-w-2xl w-full mx-auto p-8 flex flex-col gap-6"
    >
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
        {mode === "edit" ? "Edit Topbar Text" : "Add Topbar Text"}
      </h2>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Topbar Text
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter topbar text"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-4">
        <label className="text-gray-700 font-semibold">Enable</label>
        <button
          type="button"
          className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
            enabled ? "bg-yellow-400" : "bg-gray-300"
          }`}
          onClick={() => setEnabled((prev) => !prev)}
        >
          <span
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
              enabled ? "translate-x-7" : ""
            }`}
          />
        </button>
        <span className="ml-2 text-base text-gray-500">
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-yellow-500 hover:to-yellow-600 transition"
      >
        {loading ? "Saving..." : mode === "edit" ? "Update" : "Add"}
      </button>
    </form>
  );
};

export default TopbarTextForm;

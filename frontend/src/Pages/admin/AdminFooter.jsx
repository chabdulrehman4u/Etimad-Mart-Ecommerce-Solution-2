import React, { useEffect, useState } from "react";
import FooterForm, { defaultFooter } from "../../components/forms/FooterForm";
import { getFooter, updateFooter } from "../../functions/footer";
import {toast} from 'react-hot-toast'

const AdminFooter = () => {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch footer data on mount
  useEffect(() => {
    const fetchFooter = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getFooter();
        // console.log("Footer data--->", res);
        if (res && res.footer) {
          setFooterData({
            ...res.footer,
            // Parse JSON fields if needed (for backward compatibility)
            quickLinks: Array.isArray(res.footer.quickLinks)
              ? res.footer.quickLinks
              : JSON.parse(res.footer.quickLinks || "[]"),
            contactInfo:
              typeof res.footer.contactInfo === "object"
                ? res.footer.contactInfo
                : JSON.parse(res.footer.contactInfo || "{}"),
            socialLinks: Array.isArray(res.footer.socialLinks)
              ? res.footer.socialLinks
              : JSON.parse(res.footer.socialLinks || "[]"),
          });
        }
      } catch (err) {
        setError("Failed to fetch footer data.");
      } finally {
        setLoading(false);
      }
    };
    fetchFooter();
  }, []);

  // Handle form submit
  const handleSubmit = async (formData) => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await updateFooter(formData);
      if (res && res.footer) {
        setSuccess("Footer updated successfully!");
        setFooterData({
          ...res.footer,
          quickLinks: Array.isArray(res.footer.quickLinks)
            ? res.footer.quickLinks
            : JSON.parse(res.footer.quickLinks || "[]"),
          contactInfo:
            typeof res.footer.contactInfo === "object"
              ? res.footer.contactInfo
              : JSON.parse(res.footer.contactInfo || "{}"),
          socialLinks: Array.isArray(res.footer.socialLinks)
            ? res.footer.socialLinks
            : JSON.parse(res.footer.socialLinks || "[]"),
        });
        toast.success("Footer updated.")
      } else {
        setError("Failed to update footer.");
      }
    } catch (err) {
      setError("Failed to update footer.");
      toast.error("Error in updating footer.",err.message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* <h1 className="text-3xl font-bold mb-6 text-center">Footer Management</h1> */}
      {loading && (
        <div className="text-center text-yellow-600 font-semibold mb-4">
          Loading...
        </div>
      )}
      {success && (
        <div className="text-center text-green-600 font-semibold mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="text-center text-red-600 font-semibold mb-4">
          {error}
        </div>
      )}
      <FooterForm
        initialValues={footerData || defaultFooter}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default AdminFooter;

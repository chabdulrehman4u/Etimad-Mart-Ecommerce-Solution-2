import React, { useState, useRef, useEffect } from 'react';

const defaultFooter = {
  logoUrl: '',
  aboutText: '',
  quickLinks: [{ label: '', url: '' }],
  contactInfo: { address: '', whatsapp: '', phone: '', email: '' },
  socialLinks: [{ icon: '', url: '' }],
  copyright: '',
};

const FooterForm = ({ initialValues = defaultFooter, onSubmit, loading = false }) => {
  const [form, setForm] = useState(initialValues);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(initialValues?.logoUrl || '');
  const fileInputRef = useRef();
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initialValues);
    setLogoPreview(initialValues?.logoUrl || '');
    setLogoFile(null); // Optionally reset file input when initial values change
  }, [initialValues]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contactInfo.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Quick Links
  const handleQuickLinkChange = (idx, field, value) => {
    setForm((prev) => {
      const updated = [...prev.quickLinks];
      updated[idx][field] = value;
      return { ...prev, quickLinks: updated };
    });
  };
  const addQuickLink = () => {
    setForm((prev) => ({ ...prev, quickLinks: [...prev.quickLinks, { label: '', url: '' }] }));
  };
  const removeQuickLink = (idx) => {
    setForm((prev) => {
      const updated = prev.quickLinks.filter((_, i) => i !== idx);
      return { ...prev, quickLinks: updated };
    });
  };

  // Social Links
  const handleSocialLinkChange = (idx, field, value) => {
    setForm((prev) => {
      const updated = [...prev.socialLinks];
      updated[idx][field] = value;
      return { ...prev, socialLinks: updated };
    });
  };
  const addSocialLink = () => {
    setForm((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, { icon: '', url: '' }] }));
  };
  const removeSocialLink = (idx) => {
    setForm((prev) => {
      const updated = prev.socialLinks.filter((_, i) => i !== idx);
      return { ...prev, socialLinks: updated };
    });
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!form.aboutText || !form.contactInfo.address || !form.copyright) {
      setError('Please fill all required fields.');
      return;
    }
    setError('');
    // Prepare form data for API (with file)
    const data = new FormData();
    if (logoFile) data.append('logo', logoFile);
    data.append('aboutText', form.aboutText);
    data.append('copyright', form.copyright);
    data.append('quickLinks', JSON.stringify(form.quickLinks));
    data.append('contactInfo', JSON.stringify(form.contactInfo));
    data.append('socialLinks', JSON.stringify(form.socialLinks));
    if (onSubmit) onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white max-w-2xl mx-auto p-8 rounded-xl shadow-lg space-y-8 border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-2">Edit Footer</h2>
      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-2">
        <label className="font-semibold text-gray-700">Footer Logo</label>
        {logoPreview && (
          <img src={logoPreview} alt="Logo Preview" className="h-20 w-auto rounded shadow mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleLogoChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
        />
      </div>
      {/* About Text */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1">About Text <span className="text-red-500">*</span></label>
        <textarea
          name="aboutText"
          value={form.aboutText}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Enter about/footer tagline"
          required
        />
      </div>
      {/* Quick Links */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Quick Links</label>
        <div className="space-y-2">
          {form.quickLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.label}
                onChange={e => handleQuickLinkChange(idx, 'label', e.target.value)}
                placeholder="Label"
                className="border border-gray-300 rounded px-2 py-1 w-1/3"
              />
              <input
                type="text"
                value={link.url}
                onChange={e => handleQuickLinkChange(idx, 'url', e.target.value)}
                placeholder="URL"
                className="border border-gray-300 rounded px-2 py-1 w-2/3"
              />
              <button type="button" onClick={() => removeQuickLink(idx)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
            </div>
          ))}
          <button type="button" onClick={addQuickLink} className="mt-2 px-3 py-1 bg-secondary/85 text-primary rounded hover:bg-secondary">+ Add Link</button>
        </div>
      </div>
      {/* Contact Info */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Contact Information</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            name="contactInfo.address"
            value={form.contactInfo.address}
            onChange={handleChange}
            placeholder="Address"
            className="border border-gray-300 rounded px-3 py-2"
            required
          />
          <input
            type="text"
            name="contactInfo.whatsapp"
            value={form.contactInfo.whatsapp}
            onChange={handleChange}
            placeholder="WhatsApp"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            name="contactInfo.phone"
            value={form.contactInfo.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="email"
            name="contactInfo.email"
            value={form.contactInfo.email}
            onChange={handleChange}
            placeholder="Email"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      {/* Social Links */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Social Links</label>
        <div className="space-y-2">
          {form.socialLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.icon}
                onChange={e => handleSocialLinkChange(idx, 'icon', e.target.value)}
                placeholder="Icon (e.g. facebook, instagram)"
                className="border border-gray-300 rounded px-2 py-1 w-1/3"
              />
              <input
                type="text"
                value={link.url}
                onChange={e => handleSocialLinkChange(idx, 'url', e.target.value)}
                placeholder="URL"
                className="border border-gray-300 rounded px-2 py-1 w-2/3"
              />
              <button type="button" onClick={() => removeSocialLink(idx)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
            </div>
          ))}
          <button type="button" onClick={addSocialLink} className="mt-2 px-3 py-1 bg-secondary/85 text-primary rounded hover:bg-secondary">+ Add Social</button>
        </div>
      </div>
      {/* Copyright */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1">Copyright <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="copyright"
          value={form.copyright}
          onChange={handleChange}
          placeholder="e.g. © 2025. All Rights Reserved."
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        />
      </div>
      {error && <div className="text-red-500 text-center font-semibold">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r  from-secondary/80 to-secondary/85 text-primary py-3 rounded-lg font-bold text-lg shadow hover:from-secondary/90 hover:to-secondary transition"
      >
        {loading ? "Saving..." : "Save "}
      </button>
    </form>
  );
};

export { defaultFooter };
export default FooterForm;

import React, { useState, useEffect, useRef, useMemo } from "react";
import { IoAddCircle, IoTrash } from "react-icons/io5";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { uploadDescriptionImage } from '../../functions/product';
import { getProductRedirects } from '../../functions/product';

const EditProductForm = ({
  buttonText,
  onSubmit,
  formTitle,
  defaultValues,
  categories,
  subCategories,
  tags,
  brands,
}) => {
  // console.log("Default values for product---------->", defaultValues);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    weight: "",
    images: [],
    metaDescription: "",
    categories: [],
    subCategory: "",
    price: "",
    salePrice: null,
    brand: "",
    stock: "",
    tags: [],
    variants: [{ name: "", values: [{ value: "", image: "", price: "" }] }],
    faqs: [],
    specialOfferEnabled: false,
    specialOfferPrice: "",
    specialOfferStart: "",
    specialOfferEnd: "",
    volumeTierEnabled: false,
    volumeTiers: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newImageAltMap, setNewImageAltMap] = useState({});
  const [existingImageAltMap, setExistingImageAltMap] = useState({});
  const [expandedAltIndex, setExpandedAltIndex] = useState(null);
  const [expandedVariantAlt, setExpandedVariantAlt] = useState(null); // {vi, vxi}
  const [freeShipping, setFreeShipping] = useState(false);
  const [tempSpecialOfferStart, setTempSpecialOfferStart] = useState(null);
  const [tempSpecialOfferEnd, setTempSpecialOfferEnd] = useState(null);
  const [specialOfferStartSet, setSpecialOfferStartSet] = useState(false);
  const [specialOfferEndSet, setSpecialOfferEndSet] = useState(false);
  // Deal of the Day local state helpers
  const [dodEnabled, setDodEnabled] = useState(false);
  const quillRef = useRef();
  const [showRedirectsModal, setShowRedirectsModal] = useState(false);
  const [redirects, setRedirects] = useState([]);
  const [redirectsLoading, setRedirectsLoading] = useState(false);

  useEffect(() => {
    if (defaultValues) {
      const toDateTimeLocal = (value) => {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        // Local datetime in the format expected by datetime-local
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      // Transform defaultValues to match the formData structure
      const transformedVariants = defaultValues.variants.map((variant) => ({
        name: variant.name,
        values: variant.values.map((val) => ({
          value: val.value,
          image: val.image,
          price: val.price,
          alt: val.alt || '',
        })),
      }));

      setFreeShipping(defaultValues.freeShipping || false);

      setFormData({
        ...defaultValues,
        slug: defaultValues.slug || "",
        variants: transformedVariants,
        brand: defaultValues.brand?.name || "",
        metaDescription: defaultValues.metaDescription || "",
        faqs: Array.isArray(defaultValues.faqs)
          ? defaultValues.faqs.map(f => ({ question: f.question || "", answer: f.answer || "" }))
          : [],
        categories: Array.isArray(defaultValues.categories) 
          ? defaultValues.categories.map(cat => ({ _id: cat._id, name: cat.name }))
          : defaultValues.category 
            ? [{ _id: defaultValues.category._id, name: defaultValues.category.name }]
            : [],
        subCategory:
          defaultValues.subCategory?._id || defaultValues.subCategory || "",
        specialOfferEnabled: defaultValues.specialOfferEnabled || false,
        specialOfferPrice: defaultValues.specialOfferPrice || "",
        specialOfferStart: defaultValues.specialOfferStart || "",
        specialOfferEnd: defaultValues.specialOfferEnd || "",
        volumeTierEnabled: defaultValues.volumeTierEnabled || false,
        volumeTiers: Array.isArray(defaultValues.volumeTiers)
          ? defaultValues.volumeTiers.map(t => ({
              quantity: t.quantity,
              price: t.price,
              image: t.image || null,
            }))
          : [],
        // Deal of the Day defaults
        isDod: defaultValues.isDod || false,
        dodPrice: defaultValues.dodPrice || "",
        dodStart: toDateTimeLocal(defaultValues.dodStart),
        dodEnd: toDateTimeLocal(defaultValues.dodEnd),
      });

      // Handle images: string URL, File, or object { url, publicId }
      setImagePreviews(
        (defaultValues.images || []).map((img) => {
          if (typeof img === "string") {
            // Pre-existing schema: direct URL string
            return img;
          }
          if (img instanceof File) {
            // Newly added file in client state
            return URL.createObjectURL(img);
          }
          if (img && typeof img === "object" && (img.url || img.secure_url)) {
            // New schema from backend: object with url/publicId
            return img.url || img.secure_url;
          }
          return null;
        }).filter(Boolean)
      );

      // Build map of existing image alts for editing
      try {
        const map = {};
        (defaultValues.images || []).forEach((img) => {
          if (img && typeof img === 'object') {
            const key = img.public_id || img.publicId || img.url || img.secure_url;
            if (key) map[key] = img.alt || '';
          }
        });
        setExistingImageAltMap(map);
      } catch {}

      setTempSpecialOfferStart(
        defaultValues.specialOfferStart
          ? new Date(defaultValues.specialOfferStart)
          : null
      );
      setTempSpecialOfferEnd(
        defaultValues.specialOfferEnd
          ? new Date(defaultValues.specialOfferEnd)
          : null
      );
      setSpecialOfferStartSet(!!defaultValues.specialOfferStart);
      setSpecialOfferEndSet(!!defaultValues.specialOfferEnd);

      setDodEnabled(!!defaultValues.isDod);
    }
  }, [defaultValues]);

  // Fetch redirects when modal is opened
  useEffect(() => {
    if (showRedirectsModal) {
      let toParam = '';
      if (defaultValues?.category && defaultValues.category.slug) {
        toParam = `/category/${defaultValues.category.slug}`;
      } else if (defaultValues?.slug) {
        toParam = `/product/${defaultValues.slug}`;
      }
      if (toParam) {
        setRedirectsLoading(true);
        getProductRedirects(toParam)
          .then((data) => setRedirects(data))
          .finally(() => setRedirectsLoading(false));
      }
    }
  }, [showRedirectsModal, defaultValues?.slug, defaultValues?.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Volume tiers handlers
  const handleTierChange = (index, field, value) => {
    const updated = [...formData.volumeTiers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, volumeTiers: updated }));
  };

  const handleTierImageChange = (index, file) => {
    const updated = [...formData.volumeTiers];
    updated[index] = { ...updated[index], image: file };
    setFormData(prev => ({ ...prev, volumeTiers: updated }));
  };

  const addTier = () => {
    setFormData(prev => ({ ...prev, volumeTiers: [...prev.volumeTiers, { quantity: "", price: "", image: null }] }));
  };

  const removeTier = (index) => {
    setFormData(prev => ({ ...prev, volumeTiers: prev.volumeTiers.filter((_, i) => i !== index) }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Filter out duplicates based on file name
    const newImages = files.filter(
      (file) =>
        !formData.images.some((img) =>
          typeof img === "string" ? false : img.name === file.name
        )
    );

    // Append new images
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    // Update image previews
    setImagePreviews((prev) => [
      ...prev,
      ...newImages.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleImageRemove = (index) => {
    // Remove both the preview and the actual image
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(imagePreviews);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImagePreviews(items);

    // Also reorder the actual image files in formData.images
    const newImages = Array.from(formData.images);
    const [reorderedImage] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedImage);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleVariantChange = (variantIndex, valueIndex, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].values[valueIndex][field] = value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleFaqChange = (index, field, value) => {
    const updated = [...formData.faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, faqs: updated }));
  };

  const addFaq = () => {
    setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }));
  };

  const removeFaq = (index) => {
    setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: "", values: [{ value: "", image: "" }] },
      ],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addVariantValue = (variantIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].values.push({ value: "", image: "" });
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeVariantValue = (variantIndex, valueIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].values = updatedVariants[
      variantIndex
    ].values.filter((_, i) => i !== valueIndex);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleTagSelect = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));
  };

  const handleTagRemove = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  };

  const handleCategoryRemove = (category) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c._id !== category._id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submissionData = new FormData();
    submissionData.append("title", formData.title);
    submissionData.append("description", formData.description);
    submissionData.append("longDescription", formData.longDescription);
    submissionData.append("price", formData.price);
    submissionData.append("salePrice", formData.salePrice);
    submissionData.append("weight", formData.weight);
    submissionData.append("brand", formData.brand);
    submissionData.append("stock", formData.stock);
    submissionData.append("subCategory", formData.subCategory);
    submissionData.append("metaDescription", formData.metaDescription);
    // console.log("Submitting subcategory----------->", formData.subCategory);
    if (formData.slug) {
      submissionData.append("slug", formData.slug);
    }

    // Volume tiers payload
    submissionData.append("volumeTierEnabled", formData.volumeTierEnabled);
    let tierImageCounter = 0;
    const tiersPayload = (formData.volumeTiers || [])
      .filter(t => t.quantity && t.price)
      .map(t => {
        const entry = { quantity: Number(t.quantity), price: Number(t.price) };
        if (t.image && t.image instanceof File) {
          submissionData.append('volumeTierImages', t.image);
          entry.imageIndex = tierImageCounter;
          tierImageCounter += 1;
        } else if (typeof t.image === 'string' && t.image.startsWith('http')) {
          entry.image = t.image;
        }
        return entry;
      });
    submissionData.append('volumeTiers', JSON.stringify(tiersPayload));

    // Handle categories
    if (formData.categories && formData.categories.length > 0) {
      submissionData.append("categories", JSON.stringify(formData.categories.map(cat => cat.name || cat)));
    } else {
      console.error("No categories selected.");
    }
    // Add tags
    submissionData.append(
      "tags",
      (formData.tags || []).map((tag) => tag.name).join(",")
    );

    // Add variants and their images
    if (
      JSON.stringify(formData.variants) !==
      JSON.stringify(defaultValues.variants)
    ) {
      // console.log("Variants have changed, processing update...");
      // console.log("Current formData.variants:", formData.variants);
      // console.log("Default values variants:", defaultValues.variants);

      const variantsWithImages = formData.variants.map(
        (variant, variantIndex) => {
          const variantData = {
            name: variant.name,
            values: variant.values.map((val, valueIndex) => {
              const valueData = {
                value: val.value,
                price: val.price, // Include price in the variant data
                alt: (val.alt || '').trim(),
              };

              // Handle variant images: preserve existing URLs, upload new files
              if (val.image && val.image instanceof File) {
                // New file upload
                console.log(
                  `Uploading new image for variant "${variant.name}" value "${val.value}":`,
                  val.image.name
                );
                submissionData.append(
                  `variantImages`,
                  val.image,
                  `${variant.name}-${val.value}-${val.image.name}`
                );
                valueData.image = val.image.name; // This will be replaced by Cloudinary URL in backend
              } else if (
                typeof val.image === "string" &&
                val.image.startsWith("http")
              ) {
                // Existing Cloudinary URL - preserve it
                console.log(
                  `Preserving existing Cloudinary URL for variant "${variant.name}" value "${val.value}":`,
                  val.image
                );
                valueData.image = val.image;
              } else if (typeof val.image === "string") {
                // Fallback for other string values
                console.log(
                  `Using fallback string image for variant "${variant.name}" value "${val.value}":`,
                  val.image
                );
                valueData.image = val.image;
              } else {
                console.log(
                  `No image found for variant "${variant.name}" value "${val.value}"`
                );
              }

              return valueData;
            }),
          };

          return variantData;
        }
      );

      console.log("Final variants data being sent:", variantsWithImages);
      submissionData.append("variants", JSON.stringify(variantsWithImages));
    } else {
      console.log("No variant changes detected, skipping variant update");
    }

    // Add new images and collect their alts in the same order
    const newImageAlts = [];
    formData.images.forEach((image) => {
      if (image instanceof File) {
        submissionData.append("images", image);
        newImageAlts.push((newImageAltMap[image.name] || '').trim());
      }
    });
    if (newImageAlts.length > 0) {
      submissionData.append('newImageAlts', JSON.stringify(newImageAlts));
    }

    // Add FAQs payload (always send, can be empty array)
    const faqsPayload = (formData.faqs || [])
      .map(f => ({ question: (f.question || '').trim(), answer: (f.answer || '').trim() }))
      .filter(f => f.question && f.answer);
    submissionData.append('faqs', JSON.stringify(faqsPayload));

    // Add imageAltUpdates for existing images (identified by public_id or url)
    const updates = [];
    (formData.images || []).forEach((img) => {
      if (!(img instanceof File)) {
        // image as string url or object
        if (typeof img === 'string') {
          const alt = existingImageAltMap[img];
          if (alt !== undefined) updates.push({ url: img, alt: (alt || '').trim() });
        } else if (img && typeof img === 'object') {
          const key = img.public_id || img.publicId || img.url || img.secure_url;
          const alt = existingImageAltMap[key];
          if (key && alt !== undefined) updates.push({ public_id: img.public_id || img.publicId || undefined, url: img.url || img.secure_url || undefined, alt: (alt || '').trim() });
        }
      }
    });
    if (updates.length > 0) {
      submissionData.append('imageAltUpdates', JSON.stringify(updates));
    }

    // Add existing image references (support string URLs and objects { url, public_id })
    const existingImageRefs = (formData.images || [])
      .filter((image) => !(image instanceof File))
      .map((image) => {
        if (typeof image === "string") {
          return { url: image };
        }
        if (image && typeof image === "object") {
          return {
            url: image.url || image.secure_url || "",
            public_id: image.public_id || image.publicId || "",
          };
        }
        return null;
      })
      .filter(Boolean);
    submissionData.append("existingImages", JSON.stringify(existingImageRefs));

    // Add freeShipping value
    submissionData.append("freeShipping", freeShipping);

    submissionData.append("specialOfferEnabled", formData.specialOfferEnabled);
    if (formData.specialOfferEnabled) {
      submissionData.append("specialOfferPrice", formData.specialOfferPrice);
      if (formData.specialOfferStart)
        submissionData.append("specialOfferStart", formData.specialOfferStart);
      if (formData.specialOfferEnd)
        submissionData.append("specialOfferEnd", formData.specialOfferEnd);
    }

    // Deal of the Day payload
    submissionData.append('isDod', formData.isDod);
    if (formData.isDod && formData.dodPrice) {
      submissionData.append('dodPrice', formData.dodPrice);
      if (formData.dodStart) submissionData.append('dodStart', formData.dodStart);
      if (formData.dodEnd) submissionData.append('dodEnd', formData.dodEnd);
    }

    // Debug: Log freeShipping and also  all FormData entries
    // console.log("[EditProductForm] freeShipping value:", freeShipping);
    // for (let pair of submissionData.entries()) {
    //   console.log(`[EditProductForm] FormData: ${pair[0]} =`, pair[1]);
    // }

    onSubmit(submissionData);
    setTimeout(() => {
      resetForm();
    }, 7000);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      longDescription: "",
      weight: "",
      images: [],
      category: "",
      subcategory: "",
      price: "",
      salePrice: "",
      brand: "",
      stock: "",
      tags: [],
      variants: [{ name: "", values: [{ value: "", image: "" }] }],
      specialOfferEnabled: false,
      specialOfferPrice: "",
      specialOfferStart: "",
      specialOfferEnd: "",
    });

    // Revoke image URLs to free memory
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedHTML = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();

    if (pastedHTML) {
      quill.clipboard.dangerouslyPasteHTML(range.index, pastedHTML.trim());
    } else if (plainText) {
      quill.clipboard.dangerouslyPasteHTML(
        range.index,
        plainText.replace(/\n/g, "<br>")
      );
    }
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleLongDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, longDescription: value }));
  };

  // Custom image handler for Quill (long description)
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          const url = await uploadDescriptionImage(file);
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection();
          editor.insertEmbed(range.index, 'image', url);
        } catch (err) {
          // You can use toast.error if you import toast
          alert('Image upload failed');
        }
      }
    };
  };

  // Memoize modules so it doesn't get recreated on every render
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      }
    }
  }), []);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[600px] md:w-[800px] my-4 mx-auto p-6 bg-white shadow-lg rounded-lg"
    >
      <h2 className="text-2xl text-center font-semibold mb-4 text-primaryondary">
        {formTitle}
      </h2>

      {/* Title */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Expanded alt editor for variant images */}
      {expandedVariantAlt && (
        <div className="mt-3 p-3 border rounded-md bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Variant Image Alt Text</span>
            <button type="button" className="text-sm text-blue-600" onClick={() => setExpandedVariantAlt(null)}>Close</button>
          </div>
          <textarea
            rows={3}
            value={formData.variants[expandedVariantAlt.vi]?.values[expandedVariantAlt.vxi]?.alt || ''}
            onChange={(e)=>{
              handleVariantChange(expandedVariantAlt.vi, expandedVariantAlt.vxi, 'alt', e.target.value);
            }}
            placeholder="Describe this variant image for accessibility and SEO"
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
      )}

      {/* Volume Price Tiers */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-primaryondary">
          <input
            type="checkbox"
            checked={formData.volumeTierEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, volumeTierEnabled: e.target.checked }))}
            className="mr-2"
          />
          Enable Volume Price Tiers
        </label>

        {formData.volumeTierEnabled && (
          <div className="space-y-4">
            {formData.volumeTiers.map((tier, idx) => (
              <div key={idx} className="border border-gray-200 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={tier.quantity}
                    onChange={(e) => handleTierChange(idx, 'quantity', e.target.value)}
                    className="w-full border px-4 py-2 rounded-md"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Tier Price"
                    value={tier.price}
                    onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                    className="w-full border px-4 py-2 rounded-md"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleTierImageChange(idx, file);
                    }}
                    className="w-full border px-4 py-2 rounded-md"
                  />
                </div>
                {tier.image && (
                  <div className="mt-2">
                    <img
                      src={tier.image instanceof File ? URL.createObjectURL(tier.image) : tier.image}
                      alt="Tier Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => removeTier(idx)} className="text-red-600 flex items-center gap-1">
                    <IoTrash /> Remove Tier
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addTier} className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-md">
              <IoAddCircle /> Add Tier
            </button>
          </div>
        )}
      </div>

      {/* See Old Redirects Button */}
      <div className="mb-4">
        <button
          type="button"
          className="bg-secondary text-primary px-4 py-2 rounded shadow hover:bg-secondary/80 font-semibold"
          onClick={() => setShowRedirectsModal(true)}
        >
          See Old Redirects
        </button>
      </div>

      {/* Redirects Modal */}
      {showRedirectsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-xl text-gray-500 hover:text-red-500"
              onClick={() => setShowRedirectsModal(false)}
            >
              &times;
            </button>
            <h3 className="font-bold text-lg mb-4 text-primaryondary">Old Redirects</h3>
            <div className="overflow-x-auto">
              {redirectsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : !defaultValues?.category || !defaultValues.category.slug ? (
                <div className="text-center py-8 text-gray-500">No category found for this product. Redirects cannot be displayed.</div>
              ) : redirects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No redirects found for this product.</div>
              ) : (
                redirects.map((r, idx) => (
                  <div key={idx} className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <span className="font-semibold text-gray-700">From:</span>
                      <a
                        href={`/product/${r.from}`}
                        className="text-blue-700 break-all underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`/product/${r.from}`}
                      </a>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                      <span className="font-semibold text-gray-700">To:</span>
                      <a
                        href={r.to}
                        className="text-green-700 break-all underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.to}
                      </a>
                      <span className="ml-4 font-semibold text-gray-700">Redirect Count:</span>
                      <span className="font-bold">{r.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slug */}
      <div className="mb-4">
        <label className="block font-medium mb-2 text-primaryondary">
          Slug (Optional)
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
          placeholder="Auto-generated if left empty"
        />
      </div>

      {/* Deal of the Day */}
      <div className="mb-6 border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
        <label className="flex items-center gap-2 font-medium mb-3 text-primaryondary">
          <input
            type="checkbox"
            checked={formData.isDod}
            onChange={(e) => setFormData(prev => ({ ...prev, isDod: e.target.checked }))}
            className="h-4 w-4"
          />
          <span>Enable Deal of the Day (special price)</span>
        </label>

        {formData.isDod && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">DOD Price</label>
              <input
                type="number"
                min="0"
                name="dodPrice"
                value={formData.dodPrice}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Special price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start (optional)</label>
              <input
                type="datetime-local"
                name="dodStart"
                value={formData.dodStart}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End (optional)</label>
              <input
                type="datetime-local"
                name="dodEnd"
                value={formData.dodEnd}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block font-medium mb-2 text-primaryondary">Description</label>
        <div className="h-56 ">
          <ReactQuill
            value={formData.description}
            onChange={handleDescriptionChange}
            className="flex-1 h-36 md:h-[10rem]"
            modules={{
              toolbar: [
                [{ font: [] }],
                [{ size: ["small", false, "large", "huge"] }],
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["clean"],
              ],
            }}
            onPaste={handlePaste}
          />
        </div>
      </div>

      {/* Long Description */}
      <div className="mb-4">
        <label className="block font-medium mb-2 text-primaryondary">Long Description</label>
        <div className="mb-2 text-yellow-700 text-xs font-semibold">
          <span>⚠️</span> Images are uploaded immediately. Please only upload images you intend to keep in the description.
        </div>
        <div className="h-80 mb-20">
          <ReactQuill
            ref={quillRef}
            value={formData.longDescription}
            onChange={handleLongDescriptionChange}
            className="h-full"
            modules={modules}
            onPaste={handlePaste}
          />
        </div>
      </div>

      {/* Meta Description */}
      <div className="mb-4">
        <label className="block font-medium mb-2 text-primaryondary">
          Meta Description
        </label>
        <textarea
          name="metaDescription"
          value={formData.metaDescription}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
          placeholder="Enter a short summary for SEO (max 165 characters)"
          maxLength={165}
        />
      </div>

      {/* FAQs */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-primaryondary">FAQs</label>
        <div className="space-y-4">
          {formData.faqs.map((f, idx) => (
            <div key={idx} className="border border-gray-200 p-4 rounded-md">
              <input
                type="text"
                placeholder="Question"
                value={f.question}
                onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                className="w-full border px-4 py-2 rounded-md mb-2"
              />
              <textarea
                placeholder="Answer"
                value={f.answer}
                onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                className="w-full border px-4 py-2 rounded-md"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => removeFaq(idx)} className="text-red-600 flex items-center gap-1">
                  <IoTrash /> Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addFaq} className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-md">
            <IoAddCircle /> Add FAQ
          </button>
        </div>
      </div>

      {/* Weight */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Weight</label>
        <input
          type="number"
          name="weight"
          value={formData.weight}
          placeholder="weight in kgs..."
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Brand */}

      <div className="mb-4">
        <label className="block font-medium mb-2">Brand</label>
        <select
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="">{defaultValues?.brand?.name}</option>
          {brands?.map((brand, index) => (
            <option key={index} value={brand?.name}>
              {brand?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {categories?.map((category, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCategorySelect(category)}
              disabled={formData?.categories?.some(c => c._id === category._id)}
              className={`px-4 py-2 rounded-full border-2 border-gray-300 ${
                formData?.categories?.some(c => c._id === category._id) 
                  ? 'bg-gray-300 text-black cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {category?.name}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {formData?.categories?.map((category, index) => (
            <div key={index} className="flex items-center gap-2 bg-secondary opacity-90 text-white px-4 py-1 rounded-full">
              <span>{category?.name}</span>
              <button
                type="button"
                onClick={() => handleCategoryRemove(category)}
                className="text-sm font-semibold hover:text-red-200"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* sub Category */}
      <div className="mb-4">
        <label className="block font-medium mb-2">subCategory</label>
        <select
          name="subCategory"
          value={formData.subCategory}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="">{defaultValues?.subCategory?.name}</option>
          {subCategories?.map((sub, index) => (
            <option key={index} value={sub?._id}>
              {sub?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags Selection */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleTagSelect(tag)}
              className={`px-4 py-2 rounded-full border-2 border-gray-300 ${
                formData?.tags?.includes(tag)
                  ? "bg-gray-300 text-black"
                  : "bg-white text-black"
              }`}
            >
              {tag?.name}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {formData?.tags?.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary opacity-90 text-primary px-4 py-1 rounded-full"
            >
              <span>{tag?.name}</span>{" "}
              {/* Access the name property of the tag */}
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="text-sm font-semibold"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Price</label>
        <input
          type="text"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Sale Price */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Sale Price</label>
        <input
          type="text"
          name="salePrice"
          value={formData.salePrice}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Special Offer Section */}
      <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 shadow-sm">
        <label className="flex items-center gap-2 mb-2 font-semibold text-yellow-700">
          <input
            type="checkbox"
            name="specialOfferEnabled"
            checked={formData.specialOfferEnabled}
            onChange={handleChange}
            className="accent-yellow-500 w-5 h-5"
          />
          Enable Special Offer
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-yellow-800 font-medium mb-1">
              Special Offer Price
            </label>
            <input
              type="number"
              name="specialOfferPrice"
              value={formData.specialOfferPrice}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
              placeholder="e.g. 999"
              min="0"
              disabled={!formData.specialOfferEnabled}
            />
          </div>
          <div>
            <label className="block text-yellow-800 font-medium mb-1">
              Start Date & Time
            </label>
            <div className="flex items-center gap-2">
              <ReactDatePicker
                selected={tempSpecialOfferStart}
                onChange={(date) => {
                  setTempSpecialOfferStart(date);
                  setSpecialOfferStartSet(false);
                }}
                showTimeSelect
                timeIntervals={5}
                dateFormat="Pp"
                disabled={!formData.specialOfferEnabled}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    specialOfferStart: tempSpecialOfferStart
                      ? tempSpecialOfferStart.toISOString()
                      : "",
                  }));
                  setSpecialOfferStartSet(!!tempSpecialOfferStart);
                }}
                disabled={
                  !tempSpecialOfferStart || !formData.specialOfferEnabled
                }
                className="px-3 py-1 bg-yellow-500 text-primary rounded"
              >
                Set
              </button>
              {specialOfferStartSet && (
                <span className="text-green-600 ml-1" title="Time set">
                  ✔
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-yellow-800 font-medium mb-1">
              End Date & Time
            </label>
            <div className="flex items-center gap-2">
              <ReactDatePicker
                selected={tempSpecialOfferEnd}
                onChange={(date) => {
                  setTempSpecialOfferEnd(date);
                  setSpecialOfferEndSet(false);
                }}
                showTimeSelect
                timeIntervals={5}
                dateFormat="Pp"
                disabled={!formData.specialOfferEnabled}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    specialOfferEnd: tempSpecialOfferEnd
                      ? tempSpecialOfferEnd.toISOString()
                      : "",
                  }));
                  setSpecialOfferEndSet(!!tempSpecialOfferEnd);
                }}
                disabled={!tempSpecialOfferEnd || !formData.specialOfferEnabled}
                className="px-3 py-1 bg-yellow-500 text-primary rounded"
              >
                Set
              </button>
              {specialOfferEndSet && (
                <span className="text-green-600 ml-1" title="Time set">
                  ✔
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="mb-6">
        <label className="block font-semibold text-lg mb-4">
          Product Variants
        </label>

        {formData.variants.map((variant, variantIndex) => (
          <div
            key={variantIndex}
            className="border border-gray-300 bg-white shadow-sm p-4 rounded-lg mb-6"
          >
            <input
              type="text"
              placeholder="Variant name (e.g. Color, Size)"
              value={variant.name}
              onChange={(e) => {
                const updatedVariants = [...formData.variants];
                updatedVariants[variantIndex].name = e.target.value;
                setFormData((prev) => ({ ...prev, variants: updatedVariants }));
              }}
              className="w-full border border-gray-300 font-semibold px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
            />

            {variant.values.map((value, valueIndex) => (
              <div
                key={valueIndex}
                className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Value (e.g. Red, Large)"
                    value={value.value || ""}
                    onChange={(e) =>
                      handleVariantChange(
                        variantIndex,
                        valueIndex,
                        "value",
                        e.target.value
                      )
                    }
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={value.price || ""}
                    onChange={(e) =>
                      handleVariantChange(
                        variantIndex,
                        valueIndex,
                        "price",
                        e.target.value
                      )
                    }
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div className="mb-3">
                  <label className="block font-medium mb-1">
                    Variant Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const updatedVariants = [...formData.variants];
                        updatedVariants[variantIndex].values[valueIndex].image =
                          file;
                        setFormData((prev) => ({
                          ...prev,
                          variants: updatedVariants,
                        }));
                      }
                    }}
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {value.image && (
                    <div className="mt-3 relative inline-block w-28 h-32 border rounded-md bg-white">
                      <img
                        src={
                          value.image instanceof File
                            ? URL.createObjectURL(value.image)
                            : value.image
                        }
                        alt="Variant Preview"
                        className="w-28 h-24 object-cover rounded-t-md border-b"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedVariants = [...formData.variants];
                          updatedVariants[variantIndex].values[
                            valueIndex
                          ].image = "";
                          setFormData((prev) => ({
                            ...prev,
                            variants: updatedVariants,
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Remove image"
                      >
                        ×
                      </button>
                      {/* Compact alt input under variant tile */}
                      <input
                        type="text"
                        value={value.alt || ''}
                        onChange={(e)=> {
                          handleVariantChange(variantIndex, valueIndex, 'alt', e.target.value);
                        }}
                        onFocus={() => setExpandedVariantAlt({ vi: variantIndex, vxi: valueIndex })}
                        placeholder="Alt..."
                        className="absolute bottom-0 left-0 right-0 text-[10px] px-2 py-1 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => addVariantValue(variantIndex)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-primary px-4 py-2 rounded-md text-sm"
                  >
                    <IoAddCircle /> Add Value
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariantValue(variantIndex, valueIndex)}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-primary px-4 py-2 rounded-md text-sm"
                  >
                    <IoTrash /> Remove Value
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => removeVariant(variantIndex)}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-primary px-4 py-2 rounded-md"
              >
                <IoTrash /> Remove Variant
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-primary px-5 py-2 rounded-md text-base"
        >
          <IoAddCircle /> Add Variant
        </button>
      </div>

      {/* Stock */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Stock</label>
        <input
          type="text"
          name="stock"
          value={formData.stock}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Product Images */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Product Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <div className="flex flex-wrap gap-2 mt-4">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  className="flex flex-wrap gap-2"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {imagePreviews.map((preview, index) => (
                    <Draggable
                      key={preview}
                      draggableId={preview}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative w-24 h-28 rounded-md overflow-hidden border border-gray-200 bg-white"
                        >
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-20 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageRemove(index)}
                            className="absolute top-1 right-1 bg-red-500 text-primary rounded-full p-1 text-xs"
                          >
                            <IoTrash />
                          </button>
                          {/* Compact alt input under tile */}
                          <input
                            type="text"
                            value={(() => {
                              const base = formData.images[index];
                              if (base instanceof File) return newImageAltMap[base.name] || '';
                              const key = typeof base === 'string' ? base : (base?.public_id || base?.publicId || base?.url || base?.secure_url);
                              return existingImageAltMap[key] || '';
                            })()}
                            onChange={(e) => {
                              const base = formData.images[index];
                              const val = e.target.value;
                              if (base instanceof File) {
                                setNewImageAltMap(prev => ({ ...prev, [base.name]: val }));
                              } else {
                                const key = typeof base === 'string' ? base : (base?.public_id || base?.publicId || base?.url || base?.secure_url);
                                if (key) setExistingImageAltMap(prev => ({ ...prev, [key]: val }));
                              }
                            }}
                            onFocus={() => setExpandedAltIndex(index)}
                            placeholder="Alt..."
                            className="absolute bottom-0 left-0 right-0 text-[10px] px-2 py-1 border-t outline-none"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        {/* Expanded alt editor for product images */}
        {expandedAltIndex !== null && (
          <div className="mt-3 p-3 border rounded-md bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Image {expandedAltIndex + 1} Alt Text</span>
              <button type="button" className="text-sm text-blue-600" onClick={() => setExpandedAltIndex(null)}>Close</button>
            </div>
            <textarea
              rows={3}
              value={(() => {
                const base = formData.images[expandedAltIndex];
                if (base instanceof File) return newImageAltMap[base.name] || '';
                const key = typeof base === 'string' ? base : (base?.public_id || base?.publicId || base?.url || base?.secure_url);
                return existingImageAltMap[key] || '';
              })()}
              onChange={(e)=>{
                const base = formData.images[expandedAltIndex];
                const val = e.target.value;
                if (base instanceof File) {
                  setNewImageAltMap(prev => ({ ...prev, [base.name]: val }));
                } else {
                  const key = typeof base === 'string' ? base : (base?.public_id || base?.publicId || base?.url || base?.secure_url);
                  if (key) setExistingImageAltMap(prev => ({ ...prev, [key]: val }));
                }
              }}
              placeholder="Describe this image for accessibility and SEO"
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
        )}
      </div>

      {/* Alt text for newly added images */}
      {formData.images?.some(img => img instanceof File) && (
        <div className="mb-4">
          <label className="block font-medium mb-2">Alt text for new images</label>
          <div className="space-y-2">
            {formData.images.map((img, idx) => (
              img instanceof File ? (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 truncate max-w-[140px]">{img.name}</span>
                  <input
                    type="text"
                    value={newImageAltMap[img.name] || ''}
                    onChange={(e)=> setNewImageAltMap(prev => ({ ...prev, [img.name]: e.target.value }))}
                    placeholder="Describe this image (SEO alt text)"
                    className="flex-1 border px-3 py-2 rounded-md"
                  />
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Free shipping */}
      <div className="mb-4">
        <label className="block font-medium mb-2">
          <input
            type="checkbox"
            checked={freeShipping}
            onChange={(e) => setFreeShipping(e.target.checked)}
            className="mr-2"
          />
          Free Shipping
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          className="bg-secondary opacity-70 hover:opacity-90 w-full text-primary px-8 py-2 rounded-md"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default EditProductForm;

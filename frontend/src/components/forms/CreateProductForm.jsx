import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import toast from 'react-hot-toast';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { IoIosAdd } from 'react-icons/io';
import { IoAddCircle, IoTrash } from 'react-icons/io5';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadDescriptionImage } from '../../functions/product';

const CreateProductForm = forwardRef(({ buttonText, onSubmit, formTitle, categories, subCategories, tags, brands }, ref) => {
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        longDescription: "",
        weight: "",
        images: [],
        categories: [],
        subCategory: "",
        price: "",
        salePrice: "",
        brand: "",
        stock: "",
        tags: [],
        variants: [{ name: "", values: [{ value: "", image: "", price: "" }] }],
        metaDescription: "",
        volumeTierEnabled: false,
        volumeTiers: [{ quantity: "", price: "", image: null }],
        faqs: [],
        // Deal of the Day fields
        isDod: false,
        dodPrice: "",
        dodStart: "",
        dodEnd: "",
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [imageAlts, setImageAlts] = useState([]);
    const [expandedAltIndex, setExpandedAltIndex] = useState(null);
    const [expandedVariantAlt, setExpandedVariantAlt] = useState(null); // { vi, vxi }
    const [freeShipping, setFreeShipping] = useState(false);
    const quillRef = useRef();

    const resetForm = () => {
        setFormData({
            title: "",
            slug: "",
            description: "",
            weight: "",
            images: [],
            categories: [],
            subCategory: "",
            price: "",
            salePrice: "",
            brand: "",
            stock: "",
            tags: [],
            variants: [{ name: "", values: [{ value: "", image: "" }] }],
            metaDescription: "",
            faqs: [],
            isDod: false,
            dodPrice: "",
            dodStart: "",
            dodEnd: "",
        });
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        // Revoke any variant preview URLs
        try {
            (formData.variants || []).forEach(v => (v.values || []).forEach(val => {
                if (val.previewUrl) URL.revokeObjectURL(val.previewUrl);
            }));
        } catch {}
        setImagePreviews([]);
        setImageAlts([]);
    };

    useImperativeHandle(ref, () => ({
        resetForm: resetForm,
    }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
        const newImages = files.filter(
            (file) => !formData.images.some((img) =>
                typeof img === "string" ? false : img.name === file.name
            )
        );
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
        }));
        const newPreviews = newImages.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [
            ...prev,
            ...newPreviews,
        ]);
        // console.log("New images added:", newImages);
        // console.log("New image previews generated:", newPreviews);
    };

    const handleImageRemove = (index) => {
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

    const handleVariantChange = (variantIndex, field, value, valueIndex = null) => {
        const updatedVariants = [...formData.variants];
        if (field === "name") {
            updatedVariants[variantIndex].name = value;
        } else if (field === "value") {
            updatedVariants[variantIndex].values[valueIndex].value = value;
        } else if (field === "image") {
            const current = updatedVariants[variantIndex].values[valueIndex];
            // Clear existing preview if any
            if (current.previewUrl) {
                try { URL.revokeObjectURL(current.previewUrl); } catch {}
            }
            if (value && value instanceof File) {
                current.image = value;
                current.previewUrl = URL.createObjectURL(value);
            } else {
                current.image = null;
                current.previewUrl = null;
            }
        } else if (field === "price") {
            updatedVariants[variantIndex].values[valueIndex].price = value;
        } else if (field === "alt") {
            updatedVariants[variantIndex].values[valueIndex].alt = value;
        }
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
            variants: [...prev.variants, { name: "", values: [{ value: "", image: "", price: "" }] }],
        }));
    };

    const addVariantValue = (variantIndex) => {
        const updatedVariants = [...formData.variants];
        updatedVariants[variantIndex].values.push({ value: "", price: "", image: "" });
        setFormData((prev) => ({ ...prev, variants: updatedVariants }));
    };

    const removeVariant = (variantIndex) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== variantIndex),
        }));
    };

    const removeVariantValue = (variantIndex, valueIndex) => {
        const updatedVariants = [...formData.variants];
        updatedVariants[variantIndex].values = updatedVariants[variantIndex].values.filter((_, i) => i !== valueIndex);
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
            categories: prev.categories.filter((c) => c !== category),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title) {
            toast.error("Product title is required.");
            return;
        }
        if (!formData.description) {
            toast.error("Product description is required.");
            return;
        }
        if (!formData.price) {
            toast.error("Product price is required.");
            return;
        }
        if (!formData.stock) {
            toast.error("Product stock is required.");
            return;
        }
        if (!formData.categories || formData.categories.length === 0) {
            toast.error("At least one product category is required.");
            return;
        }
        if (formData.images.length === 0) {
            toast.error("At least one product image is required.");
            return;
        }
        if (!formData.longDescription) {
            toast.error("Product long description is required.");
            return;
        }
        if (!formData.brand) {
            toast.error("Product brand is required.");
            return;
        }
        if (formData.tags.length === 0) {
            toast.error("At least one tag is required.");
            return;
        }

        const submissionData = new FormData();
        submissionData.append("title", formData.title);
        submissionData.append("description", formData.description);
        submissionData.append("longDescription", formData.longDescription);
        submissionData.append("price", formData.price);
        submissionData.append("salePrice", formData.salePrice);
        submissionData.append("weight", formData.weight);
        submissionData.append("categories", JSON.stringify(formData.categories.map(cat => cat.name)));
        submissionData.append("subCategory", formData.subCategory);
        submissionData.append("brand", formData.brand);
        submissionData.append("stock", formData.stock);
        submissionData.append("freeShipping", freeShipping);
        submissionData.append("tags", (formData.tags || []).map(tag => tag.name).join(','));
        submissionData.append("metaDescription", formData.metaDescription);
        if (formData.slug) {
            submissionData.append("slug", formData.slug);
        }

        // Volume tiers payload
        submissionData.append("volumeTierEnabled", formData.volumeTierEnabled);
        let tierImageCounter = 0;
        const tiersPayload = (formData.volumeTiers || [])
            .filter(t => t.quantity && t.price)
            .map((t) => {
                const tier = { quantity: Number(t.quantity), price: Number(t.price) };
                if (t.image && t.image instanceof File) {
                    submissionData.append('volumeTierImages', t.image);
                    tier.imageIndex = tierImageCounter;
                    tierImageCounter += 1;
                }
                return tier;
            });
        submissionData.append('volumeTiers', JSON.stringify(tiersPayload));

        // Deal of the Day payload
        submissionData.append('isDod', formData.isDod);
        if (formData.isDod && formData.dodPrice) {
            submissionData.append('dodPrice', formData.dodPrice);
            if (formData.dodStart) submissionData.append('dodStart', formData.dodStart);
            if (formData.dodEnd) submissionData.append('dodEnd', formData.dodEnd);
        }

        // Product images and alts (backend expects req.files.images)
        const altsForImages = [];
        (formData.images || []).forEach((img, idx) => {
            if (img instanceof File) {
                submissionData.append('images', img);
                altsForImages.push((imageAlts[idx] || '').trim());
            }
        });
        if (altsForImages.length > 0) {
            submissionData.append('imageAlts', JSON.stringify(altsForImages));
        }

        const faqsPayload = (formData.faqs || [])
            .map(f => ({ question: (f.question || '').trim(), answer: (f.answer || '').trim() }))
            .filter(f => f.question && f.answer);
        // Always send faqs (can be empty array) so backend can clear when removed
        submissionData.append('faqs', JSON.stringify(faqsPayload));

        // Handle variants (flatten values, support alt and imageIndex)
        let variantImageCounter = 0;
        const variantPayload = [];
        (formData.variants || [])
          .filter(variant => variant.name && Array.isArray(variant.values) && variant.values.length > 0)
          .forEach((variant) => {
            variant.values.forEach((value) => {
              if (!value || !value.value) return;
              const variantData = {
                name: variant.name,
                value: value.value,
                price: value.price !== undefined && value.price !== "" ? Number(value.price) : null,
                alt: (value.alt || '').trim(),
              };
              const maybeImage = value.image;
              if (maybeImage && maybeImage instanceof File) {
                submissionData.append('variantImages', maybeImage);
                variantData.imageIndex = variantImageCounter;
                variantImageCounter += 1;
              }
              variantPayload.push(variantData);
            });
          });
        submissionData.append('variants', JSON.stringify(variantPayload));

        onSubmit(submissionData);
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
            quill.clipboard.dangerouslyPasteHTML(range.index, plainText.replace(/\n/g, "<br>"));
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
                    toast.error('Image upload failed');
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
        <form onSubmit={handleSubmit} className="max-w-[600px] md:w-[800px] my-4 mx-auto p-6 bg-white shadow-none md:shadow-md rounded-lg">
            <h2 className="text-2xl text-center font-semibold mb-4 text-primaryondary">{formTitle}</h2>

            {/* Title */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
            </div>

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

            {/* Slug */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Slug (Optional)</label>
                <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                    placeholder="Auto-generated if left empty"
                />
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
                                [{ 'font': [] }],
                                [{ 'size': ['small', false, 'large', 'huge'] }],
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['link'],
                                ['clean']
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
                <div className="h-80 mb-20"> {/* Add mb-4 for margin below */}
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
                <label className="block font-medium mb-2 text-primaryondary">Meta Description</label>
                <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                    placeholder="Enter a short summary for SEO (max 165 characters)"
                    maxLength={165}
                />
            </div>

            

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
                <label className="block font-medium mb-2 text-primaryondary">Weight</label>
                <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    placeholder="weight in grams..."
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
            </div>

            {/* Brand */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Brand</label>
                <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                    <option value="" disabled>Select a brand</option>
                    {brands?.map((brand, index) => (
                        <option key={index} value={brand?.name}>{brand?.name}</option>
                    ))}
                </select>
            </div>
            {/* Categories */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Categories</label>
                <div className="flex flex-wrap gap-2">
                    {categories?.map((category, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            disabled={formData?.categories?.includes(category)}
                            className={`px-4 py-2 rounded-full border-2 border-gray-300 ${formData?.categories?.includes(category) ? 'bg-gray-300 text-black cursor-not-allowed' : 'bg-white text-black hover:bg-gray-100'}`}
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

            {/* SubCategory */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">subCategory</label>
                <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                    <option value="" disabled>Select subCategory</option>
                    {subCategories?.map((sub, index) => (
                        <option key={index} value={sub?.name}>{sub?.name}</option>
                    ))}
                </select>
            </div>

            {/* Tags Selection */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Tags</label>
                <div className="flex flex-wrap gap-2">
                    {tags?.map((tag, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleTagSelect(tag)}
                            className={`px-4 py-2 rounded-full border-2 border-gray-300 ${formData?.tags?.includes(tag) ? 'bg-gray-300 text-black' : 'bg-white text-black'}`}
                        >
                            {tag?.name}
                        </button>
                    ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    {formData?.tags?.map((tag, index) => (
                        <div key={index} className="flex items-center gap-2 bg-secondary opacity-90 text-primaryte px-4 py-1 rounded-full">
                            <span>{tag?.name}</span> {/* Access the name property of the tag */}
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
                <label className="block font-medium mb-2 text-primaryondary">Price</label>
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
                <label className="block font-medium mb-2 text-primaryondary">Sale Price</label>
                <input
                    type="text"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
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

            {/* Variants */}
            <div className="mb-6">
                <label className="block font-medium mb-3 text-primaryondary">Variants</label>
                {formData.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="border border-gray-200 p-5 mb-4 rounded-lg shadow-sm bg-white">
                        <label className="block font-medium mb-2 text-primaryondary">Variant {variantIndex + 1}</label>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Variant Name (e.g., Color, Size)"
                                value={variant.name}
                                onChange={(e) => handleVariantChange(variantIndex, "name", e.target.value)}
                                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {variant.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Variant Value (e.g., Red, Large)"
                                        value={value.value}
                                        onChange={(e) => handleVariantChange(variantIndex, "value", e.target.value, valueIndex)}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={value.price}
                                        onChange={(e) => handleVariantChange(variantIndex, "price", e.target.value, valueIndex)}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addVariantValue(variantIndex)}
                                        className="flex items-center justify-center w-10 h-10 bg-gray-400 text-primaryte rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        <IoIosAdd size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeVariantValue(variantIndex, valueIndex)}
                                        className="flex items-center justify-center w-10 h-10 text-red rounded-md transition-colors"
                                    >
                                        <IoTrash size={22} className="text-red-600 hover:text-red-800" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="file"
                                        accept="image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handleVariantChange(variantIndex, "image", file, valueIndex);
                                            }
                                        }}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {value.image && (
                                    <div className="mt-2">
                                        <div className="relative w-24 h-28 rounded-md overflow-hidden border border-gray-200 bg-white">
                                            <img
                                                src={value.previewUrl || (value.image instanceof File ? URL.createObjectURL(value.image) : value.image)}
                                                alt={value.alt || 'Variant Preview'}
                                                className="w-full h-20 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleVariantChange(variantIndex, 'image', null, valueIndex)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-[10px]"
                                                title="Remove image"
                                            >
                                                ×
                                            </button>
                                            <input
                                                type="text"
                                                value={value.alt || ''}
                                                onChange={(e)=>handleVariantChange(variantIndex,'alt',e.target.value,valueIndex)}
                                                onFocus={()=>setExpandedVariantAlt({vi:variantIndex,vxi:valueIndex})}
                                                placeholder="Alt..."
                                                className="absolute bottom-0 left-0 right-0 text-[10px] px-2 py-1 border-t outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                {expandedVariantAlt && expandedVariantAlt.vi===variantIndex && expandedVariantAlt.vxi===valueIndex && (
                                  <div className="mt-2 p-3 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-700">Variant Alt ({value.value || 'Value'})</span>
                                      <button type="button" className="text-sm text-blue-600" onClick={()=>setExpandedVariantAlt(null)}>Close</button>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={value.alt || ''}
                                      onChange={(e)=>handleVariantChange(variantIndex,'alt',e.target.value,valueIndex)}
                                      placeholder="Describe this variant image"
                                      className="w-full border px-3 py-2 rounded-md"
                                    />
                                  </div>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-between items-center mt-4">
                            <button
                                type="button"
                                onClick={() => removeVariant(variantIndex)}
                                className="flex items-center gap-1 bg-red-500 text-primaryte px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                            >
                                <IoTrash /> Remove Variant
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1 bg-blue-500 text-primaryte px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    <IoAddCircle /> Add Variant
                </button>
            </div>




            {/* Stock */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">Stock</label>
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
                <label className="block font-medium mb-2 text-primaryondary">Product Images</label>
                <label
                    htmlFor="fileInput"
                    className="flex justify-center items-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-lg cursor-pointer bg-secondary bg-opacity-35 hover:bg-opacity-60 transition"
                >
                    <FaCloudUploadAlt className="text-gray-600 text-xl" />
                    <span className="text-gray-700 font-medium">Upload Images (only webp)</span>
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/webp"
                    id="fileInput"
                    className="hidden"
                    onChange={handleImageChange}
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
                                        <Draggable key={preview} draggableId={preview} index={index}>
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
                                                        className="absolute top-1 right-1 bg-red-500 text-primaryte rounded-full p-1 text-xs"
                                                    >
                                                        <IoTrash />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={imageAlts[index] || ''}
                                                        onChange={(e) => {
                                                            const arr = [...imageAlts];
                                                            arr[index] = e.target.value;
                                                            setImageAlts(arr);
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
                {/* Expanded alt editor */}
                {expandedAltIndex !== null && (
                  <div className="mt-3 p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Image {expandedAltIndex + 1} Alt Text</span>
                      <button type="button" className="text-sm text-blue-600" onClick={() => setExpandedAltIndex(null)}>Close</button>
                    </div>
                    <textarea
                      rows={2}
                      value={imageAlts[expandedAltIndex] || ''}
                      onChange={(e)=>{
                        const arr=[...imageAlts];
                        arr[expandedAltIndex]=e.target.value;
                        setImageAlts(arr);
                      }}
                      placeholder="Describe this image for accessibility and SEO"
                      className="w-full border px-3 py-2 rounded-md"
                    />
                  </div>
                )}
            </div>
            {/* Free shipping */}
            <div className="mb-4">
                <label className="block font-medium mb-2 text-primaryondary">
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
                    className="bg-secondary opacity-70 hover:opacity-90 w-full text-primaryte px-8 py-2 rounded-md"
                >
                    {buttonText}
                </button>
            </div>
        </form>
    );
});

export default CreateProductForm;

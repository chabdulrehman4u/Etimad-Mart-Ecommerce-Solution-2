import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FiUpload, FiDownload, FiTrash2, FiPlus, FiChevronUp, FiChevronDown, FiSave, FiChevronRight, FiMove } from "react-icons/fi";
import { saveDraft as apiSaveDraft, publishLayout as apiPublishLayout, getDraftBySlug as apiGetDraftBySlug, getPublishedBySlug as apiGetPublishedBySlug } from "../../functions/pageLayout";
import { uploadImage as apiUploadImage } from "../../functions/media";
import { sectionsRegistry, sectionTypes } from "../../components/sections/registry";
import { getFeaturedProducts, getNewProducts, getBestSellers } from "../../functions/homepage";
import { getAllProducts } from "../../functions/product";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Build defaults from registry to avoid hardcoding
const DEFAULTS = Object.fromEntries(
  Object.entries(sectionsRegistry).map(([key, def]) => [key, { type: key, ...(def.defaults || { settings: {} }) }])
);

const SectionCard = ({ section, index, onMove, onDelete, onEdit, onEditPartial, onUpload, onDragStart, onDragOver, onDrop, dragging, dragOver }) => {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState('form'); // 'form' | 'json'
  const imageUrl = section?.settings?.image;
  const quillRef = useRef(null);
  // For product-grid: available count of items for selected source
  const [availableCount, setAvailableCount] = useState(8);
  const [countLoading, setCountLoading] = useState(false);

  const handlePaste = (event) => {
    // mirror CreateProductForm behavior
    try {
      event.preventDefault();
      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedHTML = clipboardData.getData("text/html");
      const plainText = clipboardData.getData("text/plain");
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const range = quill.getSelection();
      if (pastedHTML) {
        quill.clipboard.dangerouslyPasteHTML(range?.index ?? 0, pastedHTML.trim());
      } else if (plainText) {
        quill.clipboard.dangerouslyPasteHTML(range?.index ?? 0, plainText.replace(/\n/g, "<br>"));
      }
    } catch (_) {
      // no-op fallback
    }
  };

  const handleField = (key, value) => {
    onEditPartial(index, { [key]: value });
  };

  // Fetch available product count for product-grid based on source
  useEffect(() => {
    const run = async () => {
      if (section?.type !== 'product-grid') return;
      const src = section?.settings?.source || 'featured';
      try {
        setCountLoading(true);
        let resp;
        // request with small limit just to get metadata
        if (src === 'featured') resp = await getFeaturedProducts(1, 1);
        else if (src === 'new-arrivals') resp = await getNewProducts(1, 1);
        else if (src === 'best-sellers') resp = await getBestSellers(1, 1);
        else resp = await getAllProducts(1, 1);
        const total = resp?.totalProducts ?? resp?.total ?? (Array.isArray(resp) ? resp.length : (resp?.products?.length ?? 0));
        const safeTotal = Number.isFinite(total) ? total : 0;
        setAvailableCount(safeTotal);
        // Clamp existing limit to available and 8
        const currentLimit = section?.settings?.limit ?? 8;
        const clamped = Math.max(1, Math.min(8, safeTotal || 8, currentLimit));
        if (clamped !== currentLimit) onEditPartial(index, { limit: clamped });
      } catch (_) {
        // keep default 8 if error
        setAvailableCount(8);
      } finally {
        setCountLoading(false);
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.type, section?.settings?.source]);

  

  return (
    <div
      className={`border rounded bg-white shadow-sm ${dragOver ? 'ring-2 ring-primary/40' : ''}`}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(index); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(index); }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <button className="flex-1 flex items-center gap-2 text-left" onClick={() => setOpen((v) => !v)}>
          <FiChevronRight className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm uppercase text-gray-600">{section.type}</span>
          <span className="ml-2 text-xs text-gray-400">#{index + 1}</span>
        </button>
        <div className="flex items-center gap-1">
          <span className="p-2 rounded cursor-grab active:cursor-grabbing text-gray-400" title="Drag to reorder">
            <FiMove />
          </span>
          <button className="p-2 rounded hover:bg-gray-100" onClick={() => onMove(index, -1)} title="Move up">
            <FiChevronUp />
          </button>
          <button className="p-2 rounded hover:bg-gray-100" onClick={() => onMove(index, 1)} title="Move down">
            <FiChevronDown />
          </button>
          <button className="p-2 rounded hover:bg-gray-100" onClick={() => onDelete(index)} title="Delete">
            <FiTrash2 className="text-red-600" />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-3">
            <button className={`px-3 py-1 rounded border ${tab==='form'?'bg-primary text-white border-primary':'bg-white'}`} onClick={() => setTab('form')}>Form</button>
            <button className={`px-3 py-1 rounded border ${tab==='json'?'bg-primary text-white border-primary':'bg-white'}`} onClick={() => setTab('json')}>JSON</button>
          </div>

          {tab === 'form' ? (
            <div className="space-y-3">
              {imageUrl ? (
                <div>
                  <img src={imageUrl} alt="section" className="w-full max-h-40 object-cover rounded" />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded">
                  <FiUpload /> Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(index, e.target.files?.[0] || null)} />
                </label>
                {imageUrl ? (
                  <div className="text-xs text-gray-500 truncate max-w-[60%]" title={imageUrl}>{imageUrl}</div>
                ) : null}
              </div>

              {/* Simple forms per type */}
              {section.type === 'hero' && (
                <div className="grid md:grid-cols-2 gap-3">
                  <input className="border rounded p-2" placeholder="Title" value={section.settings?.title || ''} onChange={(e)=>handleField('title', e.target.value)} />
                  <span className="text-xs text-gray-500 md:col-span-2 -mt-2">Main heading shown on the banner.</span>
                  <input className="border rounded p-2" placeholder="Subtitle" value={section.settings?.subtitle || ''} onChange={(e)=>handleField('subtitle', e.target.value)} />
                  <span className="text-xs text-gray-500 md:col-span-2 -mt-2">A short sentence under the title.</span>
                  <input className="border rounded p-2" placeholder="CTA Text" value={section.settings?.ctaText || ''} onChange={(e)=>handleField('ctaText', e.target.value)} />
                  <span className="text-xs text-gray-500 -mt-2">Button label (e.g., Shop Now).</span>
                  <input className="border rounded p-2" placeholder="CTA Link" value={section.settings?.ctaLink || ''} onChange={(e)=>handleField('ctaLink', e.target.value)} />
                  <span className="text-xs text-gray-500 -mt-2">Where the button sends users (e.g., /shop).</span>
                  <select className="border rounded p-2" value={section.settings?.align || 'center'} onChange={(e)=>handleField('align', e.target.value)}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  <span className="text-xs text-gray-500 -mt-2">Text alignment on the banner.</span>
                </div>
              )}

              {section.type === 'rich-text' && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Use the editor to format content. It saves HTML into this section.</div>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={section.settings?.html || ''}
                    onChange={(val) => handleField('html', val)}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                    onPaste={handlePaste}
                  />
                </div>
              )}

              {section.type === 'product-grid' && (
                <div className="grid md:grid-cols-2 gap-3">
                  {/* Title */}
                  <input 
                    className="border rounded p-2" 
                    placeholder="Title" 
                    value={section.settings?.title || ''} 
                    onChange={(e) => handleField('title', e.target.value)} 
                  />
                  <span className="text-xs text-gray-500 md:col-span-2 -mt-2">Heading shown above the products.</span>
                  
                  {/* Product Source */}
                  <select 
                    className="border rounded p-2" 
                    value={section.settings?.source || 'featured'} 
                    onChange={(e) => handleField('source', e.target.value)}
                  >
                    <option value="featured">Featured Products</option>
                    <option value="new-arrivals">New Arrivals</option>
                    <option value="best-sellers">Best Sellers</option>
                    <option value="all">All Products</option>
                  </select>
                  <span className="text-xs text-gray-500 -mt-2">Select which products to display.</span>
                  
                  {/* Grid Layout */}
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700">Grid Layout (Max 8 products)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Columns */}
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Columns</label>
                        <select 
                          className="border rounded p-2 w-full"
                          value={section.settings?.columns || 4}
                          onChange={(e) => {
                            const newCols = Number(e.target.value);
                            onEditPartial(index, { columns: newCols });
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Column' : 'Columns'}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Rows */}
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Rows</label>
                        <select 
                          className="border rounded p-2 w-full"
                          value={section.settings?.rows || 2}
                          onChange={(e) => {
                            const newRows = Number(e.target.value);
                            onEditPartial(index, { rows: newRows });
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Row' : 'Rows'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Number of Products (based on selected source) */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Number of Products</label>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded p-2"
                          value={section.settings?.limit || 8}
                          onChange={(e) => onEditPartial(index, { limit: Number(e.target.value) })}
                          disabled={countLoading}
                        >
                          {Array.from({ length: Math.max(1, Math.min(8, availableCount || 0)) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <span className="text-xs text-gray-500">
                          {countLoading ? 'Loading available count…' : `Available: ${availableCount ?? 0}`}
                        </span>
                      </div>
                    </div>

                    {/* Grid Preview */}
                    <div className="mt-2">
                      {(() => {
                        const cols = section.settings?.columns || 4;
                        const rows = section.settings?.rows || 2;
                        const totalSlots = Math.min(cols * rows, 32); // cap to keep preview light
                        const selected = section.settings?.limit ?? 8;
                        const maxBySource = Math.min(8, availableCount || 0) || 0;
                        const used = Math.min(selected, maxBySource, totalSlots);
                        return (
                          <>
                            <div className="text-xs font-medium text-gray-700 mb-1">Preview ({used} of {totalSlots} slots used)</div>
                            <div className="overflow-x-auto">
                              <div className="grid gap-2 w-max" style={{ gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))` }}>
                                {/* Filled slots */}
                                {Array.from({ length: used }).map((_, i) => (
                                  <div key={`used-${i}`} className="aspect-square bg-blue-100 border-2 border-blue-400 rounded flex items-center justify-center">
                                    <span className="text-xs text-blue-700">{i + 1}</span>
                                  </div>
                                ))}
                                {/* Ghost placeholders for remaining slots */}
                                {Array.from({ length: Math.max(0, totalSlots - used) }).map((_, i) => (
                                  <div key={`ghost-${i}`} className="aspect-square border-2 border-dashed border-gray-300 rounded bg-gray-50" />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Showing {used} product(s) • Grid has {totalSlots} slot(s) • Max 8 products • Source available: {availableCount ?? 0}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Page (hidden by default, can be enabled if needed) */}
                  <div className="hidden">
                    <input 
                      type="number" 
                      className="border rounded p-2 w-full" 
                      placeholder="Page" 
                      value={section.settings?.page || 1} 
                      onChange={(e) => handleField('page', Number(e.target.value) || 1)} 
                    />
                    <span className="text-xs text-gray-500">For pagination; usually keep 1.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full text-xs font-mono border rounded p-2"
              rows={10}
              value={JSON.stringify(section.settings || {}, null, 2)}
              onChange={(e) => onEdit(index, e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
};

const AdminSections = () => {
  const [pageKey, setPageKey] = useState("home");
  const [layout, setLayout] = useState({ page: "home", sections: [] });
  const [rawJSON, setRawJSON] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJsonPane, setShowJsonPane] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [newSectionType, setNewSectionType] = useState('hero');
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [dirty, setDirty] = useState(false);

  // Load draft from server on mount for the current pageKey
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGetDraftBySlug(pageKey);
        const next = data.draftLayout || { page: pageKey, sections: [] };
        setLayout({ ...next, page: pageKey });
        // toast.success("Draft loaded");
      } catch (e) {
        // If not found, keep empty layout silently
      } finally {
        setLoading(false);
      }
    })();
  }, [pageKey]);

  useEffect(() => {
    setRawJSON(JSON.stringify(layout, null, 2));
  }, [layout]);

  // Keep layout.page in sync with pageKey so JSON reflects the selected slug
  useEffect(() => {
    setLayout((prev) => ({ ...prev, page: pageKey }));
  }, [pageKey]);

  const addSection = (type) => {
    const preset = DEFAULTS[type];
    if (!preset) return;
    setLayout((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), { id: `${type}-${Date.now()}`, ...preset }],
    }));
    setDirty(true);
  };

  // Removed template/dummy data usage

  const moveSection = (index, dir) => {
    setLayout((prev) => {
      const arr = [...(prev.sections || [])];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      const tmp = arr[index];
      arr[index] = arr[newIndex];
      arr[newIndex] = tmp;
      return { ...prev, sections: arr };
    });
    setDirty(true);
  };

  const deleteSection = (index) => {
    if (beginnerMode) {
      const ok = window.confirm('Delete this section? This cannot be undone.');
      if (!ok) return;
    }
    setLayout((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
    setDirty(true);
  };

  const editSectionSettings = (index, jsonText) => {
    try {
      const next = JSON.parse(jsonText);
      setLayout((prev) => {
        const arr = [...prev.sections];
        arr[index] = { ...arr[index], settings: next };
        return { ...prev, sections: arr };
      });
      setDirty(true);
    } catch (e) {
      // Keep editing; validation happens on save/export
    }
  };

  const editSectionPartial = (index, partial) => {
    setLayout((prev) => {
      const arr = [...prev.sections];
      const curr = arr[index] || {};
      arr[index] = { ...curr, settings: { ...(curr.settings || {}), ...partial } };
      return { ...prev, sections: arr };
    });
    setDirty(true);
  };

  const loadFromJSONText = () => {
    try {
      const next = JSON.parse(rawJSON);
      if (!Array.isArray(next.sections)) throw new Error("Invalid layout: sections must be an array");
      setLayout(next);
      toast.success("Layout loaded");
    } catch (e) {
      toast.error("Invalid JSON");
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageKey}-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadSectionImage = async (index, file) => {
    if (!file) return;
    try {
      setLoading(true);
      const { url } = await apiUploadImage(file, 'page-media');
      setLayout((prev) => {
        const arr = [...(prev.sections || [])];
        if (!arr[index]) return prev;
        const nextSec = { ...arr[index], settings: { ...(arr[index].settings || {}), image: url } };
        arr[index] = nextSec;
        return { ...prev, sections: arr };
      });
      toast.success('Image uploaded');
      setDirty(true);
    } catch (e) {
      toast.error(e.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      setLoading(true);
      await apiSaveDraft({ slug: pageKey, type: layout.type || "page", layout, seo: layout.seo });
      toast.success("Draft saved");
      setDirty(false);
    } catch (e) {
      toast.error(e.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    try {
      setLoading(true);
      await apiPublishLayout({ slug: pageKey, layout, seo: layout.seo });
      toast.success("Published");
      setDirty(false);
    } catch (e) {
      toast.error(e.message || "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async () => {
    try {
      setLoading(true);
      const data = await apiGetDraftBySlug(pageKey);
      const next = data.draftLayout || { page: pageKey, sections: [] };
      setLayout(next);
      setRawJSON(JSON.stringify(next, null, 2));
      // toast.success("Draft loaded");
    } catch (e) {
      toast.error(e.message || "Failed to load draft");
    } finally {
      setLoading(false);
    }
  };

  const loadPublished = async () => {
    try {
      setLoading(true);
      const data = await apiGetPublishedBySlug(pageKey);
      const next = data?.publishedLayout || data?.layout || data || { page: pageKey, sections: [] };
      setLayout(next);
      setRawJSON(JSON.stringify(next, null, 2));
      toast.success("Published layout loaded");
      setDirty(false);
    } catch (e) {
      toast.error(e.message || "Failed to load published layout");
    } finally {
      setLoading(false);
    }
  };

  const onUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setLayout(json);
      if (json?.page) setPageKey(String(json.page));
      toast.success("Layout imported");
      setDirty(true);
    } catch (e) {
      toast.error("Invalid file");
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (index) => {
    setDraggingIndex(index);
    setDragOverIndex(index);
  };
  const handleDragOver = (index) => {
    if (index !== dragOverIndex) setDragOverIndex(index);
  };
  const handleDrop = (index) => {
    if (draggingIndex === -1 || index === draggingIndex) {
      setDraggingIndex(-1);
      setDragOverIndex(-1);
      return;
    }
    setLayout((prev) => {
      const arr = [...(prev.sections || [])];
      const [moved] = arr.splice(draggingIndex, 1);
      arr.splice(index, 0, moved);
      return { ...prev, sections: arr };
    });
    setDraggingIndex(-1);
    setDragOverIndex(-1);
    setDirty(true);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-2 py-2 border-b">
        <div className="flex items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Sections Builder</h1>
            <p className="text-xs text-gray-500">Build your page by adding sections below. Use Beginner Mode for the simplest view.</p>
          </div>
          <input
            className="border rounded px-2 py-1 text-sm"
            value={pageKey}
            onChange={(e)=>setPageKey(e.target.value.trim() || 'home')}
            placeholder="page slug (e.g., home)"
            title="Page slug"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
          <label className="flex items-center gap-2 text-sm mr-2">
            <input type="checkbox" className="accent-primary" checked={beginnerMode} onChange={(e)=>setBeginnerMode(e.target.checked)} />
            Beginner Mode
          </label>
          <div className="basis-full h-0" />
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded" onClick={loadDraft} disabled={loading} title="Load draft from server">
            <FiDownload /> {loading ? "Loading…" : "Load Draft"}
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded" onClick={loadPublished} disabled={loading} title="Load published layout">
            <FiDownload /> Load Published
          </button>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded">
            <FiUpload /> Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={onUploadFile} />
          </label>
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded" onClick={downloadJSON}>
            <FiDownload /> Export JSON
          </button>
          <div className="relative inline-flex items-center">
            <button className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-blue-600 text-white disabled:opacity-50" onClick={saveDraft} disabled={loading}>
              <FiSave /> {loading ? "Saving…" : "Save Draft"}
            </button>
            {dirty && <span className="absolute -right-2 -top-2 inline-block w-2 h-2 rounded-full bg-red-500" title="You have unsaved changes"></span>}
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-green-600 text-white disabled:opacity-50" onClick={publish} disabled={loading}>
            <FiSave /> {loading ? "Publishing…" : "Publish"}
          </button>
          <button className="md:hidden inline-flex items-center gap-2 px-3 py-2 border rounded" onClick={() => setShowJsonPane((v) => !v)}>
            {showJsonPane ? 'Hide JSON' : 'Show JSON'}
          </button>
        </div>
      </div>

      {/* Helper panel for beginners */}
      {beginnerMode && (
        <div className="mb-4 p-3 border rounded bg-white">
          <div className="text-sm font-semibold text-secondary mb-2">Quick Steps</div>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Choose the page slug (for home page, type <code>home</code>).</li>
            <li>Click <b>Load Draft</b> or <b>Load Published</b> to start from existing content.</li>
            <li>Use <b>Add Section</b> to insert a new block (like Hero or Product Grid).</li>
            <li>Fill the simple fields in each section. You can upload an image too.</li>
            <li>Click <b>Save Draft</b> to save your work. Click <b>Publish</b> when ready.</li>
          </ol>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {(layout.sections || []).map((s, idx) => (
            <SectionCard
              key={s.id || idx}
              section={s}
              index={idx}
              onMove={moveSection}
              onDelete={deleteSection}
              onEdit={editSectionSettings}
              onEditPartial={editSectionPartial}
              onUpload={uploadSectionImage}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragging={draggingIndex === idx}
              dragOver={dragOverIndex === idx}
            />
          ))}

          {/* Simpler add section control */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <select className="border rounded px-3 py-2" value={newSectionType} onChange={(e)=>setNewSectionType(e.target.value)}>
              {sectionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-primary text-white" onClick={() => addSection(newSectionType)}>
              <FiPlus /> Add Section
            </button>
            {beginnerMode && <span className="text-xs text-gray-500">Pick a type, then click "Add Section".</span>}
          </div>
        </div>

        <div className={`space-y-2 ${beginnerMode ? 'hidden' : (showJsonPane ? '' : 'hidden md:block')}`}>
          <div className="text-sm font-semibold text-secondary">Layout JSON</div>
          <textarea
            className="w-full h-[60vh] text-xs font-mono border rounded p-2"
            value={rawJSON}
            onChange={(e) => setRawJSON(e.target.value)}
          />
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded w-full" onClick={loadFromJSONText}>
            <FiSave /> Load from editor
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>Note: Drafts are saved to the backend using your admin session. Use "Load Draft" to fetch the current draft.</p>
        <p>If something looks too technical, keep <b>Beginner Mode</b> on. You can switch it off anytime to see advanced JSON.</p>
      </div>
    </div>
  );
};

export default AdminSections;

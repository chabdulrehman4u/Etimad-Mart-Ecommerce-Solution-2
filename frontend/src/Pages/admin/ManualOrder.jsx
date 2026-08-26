import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { searchProduct } from '../../functions/search';
import { placeOrder } from '../../functions/order';

const numberFormat = (n) => new Intl.NumberFormat('en-PK').format(Number(n || 0));

const ManualOrder = () => {
  const navigate = useNavigate();

  // product search
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggRef = useRef(null);

  // selected items
  const [items, setItems] = useState([]); // { _id, title, price, salePrice, images, count }

  // variant modal
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState(null); // product object with variants
  // rows: [{ selections: { [variantName]: value }, qty }]
  const [variantRows, setVariantRows] = useState([]);

  // shipping form
  const [shipping, setShipping] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    mobile: '',
    additionalInstructions: '',
  });

  // charges
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If free shipping is enabled, force deliveryCharges to 0 and lock the field
  useEffect(() => {
    if (freeShipping) {
      setDeliveryCharges(0);
    }
  }, [freeShipping]);

  // debounce search
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!query.trim()) { setSuggestions([]); return; }
      try {
        setLoadingSuggest(true);
        const res = await searchProduct({ query: query.trim(), limit: 10 });
        const prods = res?.products || [];
        setSuggestions(prods);
        setOpenSuggest(true);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target)) setOpenSuggest(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const computeUnitPrice = (product, selectedVariantsArr = []) => {
    // If any selected variant value includes a numeric price, treat it as override
    const override = selectedVariantsArr.find(v => typeof v?.price === 'number' && !Number.isNaN(v.price));
    if (override) return Number(override.price);
    return Number(product?.salePrice ?? product?.price ?? 0);
  };

  // Prefer selected variant image if available, else fall back to product image[0]
  const getItemImage = (item) => {
    const withImage = (item?.selectedVariants || []).find(v => v?.image);
    const variantImg = typeof withImage?.image === 'string' ? withImage.image : withImage?.image?.url;
    if (variantImg) return variantImg;
    return typeof item?.images?.[0] === 'string' ? item.images[0] : item?.images?.[0]?.url;
  };

  const addItemsWithVariants = (product, rows) => {
    // rows: [{ selections: { name: value }, qty }]
    setItems(prev => {
      const next = [...prev];
      rows.forEach(row => {
        const selectedVariants = (product?.variants || []).map(vg => {
          const val = row.selections[vg.name];
          const found = vg.values?.find(x => x.value === val) || {};
          return { name: vg.name, value: val, price: found.price ?? null, image: found.image ?? null };
        });
        const unitPrice = computeUnitPrice(product, selectedVariants);
        // Consider same product with same variant combo as same line item
        const keyMatch = next.findIndex(i => i._id === product._id && JSON.stringify(i.selectedVariants || []) === JSON.stringify(selectedVariants));
        if (keyMatch !== -1) {
          next[keyMatch] = { ...next[keyMatch], count: Number(next[keyMatch].count || 0) + Number(row.qty || 1), unitPrice };
        } else {
          next.push({
            _id: product._id,
            title: product.title,
            price: Number(product.price || 0),
            salePrice: Number(product.salePrice ?? product.price ?? 0),
            images: product.images || [],
            count: Number(row.qty || 1),
            selectedVariants,
            unitPrice,
          });
        }
      });
      return next;
    });
  };

  const addProduct = (p) => {
    if (Array.isArray(p?.variants) && p.variants.length > 0) {
      // open modal to pick variants
      setVariantProduct(p);
      // initialize with one empty row
      const defaultSelections = Object.fromEntries((p.variants || []).map(vg => [vg.name, vg.values?.[0]?.value || '']));
      setVariantRows([{ selections: defaultSelections, qty: 1 }]);
      setVariantModalOpen(true);
    } else {
      // no variants -> add normally with unitPrice from sale/base
      setItems((prev) => {
        const idx = prev.findIndex((i) => i._id === p._id && !i.selectedVariants?.length);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], count: next[idx].count + 1 };
          return next;
        }
        return [
          ...prev,
          {
            _id: p._id,
            title: p.title,
            price: Number(p.price || 0),
            salePrice: Number(p.salePrice ?? p.price ?? 0),
            images: p.images || [],
            count: 1,
            selectedVariants: [],
            unitPrice: Number(p.salePrice ?? p.price ?? 0),
          },
        ];
      });
      setQuery('');
      setOpenSuggest(false);
    }
  };

  const incAt = (index) => setItems(prev => prev.map((i, idx) => idx === index ? { ...i, count: i.count + 1 } : i));
  const decAt = (index) => setItems(prev => prev.map((i, idx) => idx === index ? { ...i, count: Math.max(1, i.count - 1) } : i));
  const removeAt = (index) => setItems(prev => prev.filter((_, idx) => idx !== index));

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + Number(i.unitPrice ?? (i.salePrice ?? i.price ?? 0)) * Number(i.count || 0), 0), [items]);
  const total = useMemo(() => subtotal + Number(deliveryCharges || 0), [subtotal, deliveryCharges]);

  const updateShipping = (k, v) => setShipping((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (items.length === 0) { toast.error('Add at least one product'); return false; }
    if (!shipping.fullName?.trim()) { toast.error('Full Name is required'); return false; }
    if (!shipping.streetAddress?.trim()) { toast.error('Street Address is required'); return false; }
    if (!shipping.city?.trim()) { toast.error('City is required'); return false; }
    const rawMobile = shipping.mobile || '';
    const cleanMobile = String(rawMobile).trim().replace(/[\s\-\(\)]/g, '');
    const pakistaniMobileRegex = /^(\+92|92|0)?3\d{9}$/;
    if (!cleanMobile || !pakistaniMobileRegex.test(cleanMobile)) {
      toast.error('Please enter a valid Pakistani mobile number (e.g. 03337494323 or +923337494323)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        shippingAddress: shipping,
        cartSummary: items.map((i) => ({
          productId: i._id,
          title: i.title,
          price: Number(i.unitPrice ?? (i.salePrice ?? i.price ?? 0)),
          count: i.count,
          image: getItemImage(i),
          selectedVariants: i.selectedVariants || [],
        })),
        totalPrice: Number(total),
        freeShipping,
        deliveryCharges: freeShipping ? 0 : Number(deliveryCharges || 0),
        source: 'manual',
      };
      const res = await placeOrder(payload, 'manual');
      if (res?.order?._id) {
        toast.success('Manual order created');
        navigate(`/admin/orders/${res.order._id}`);
      } else {
        toast.success(res?.message || 'Order placed');
      }
      // reset
      setItems([]);
      setShipping({ fullName: '', streetAddress: '', city: '', mobile: '', additionalInstructions: '' });
      setDeliveryCharges(0);
      setFreeShipping(false);
    } catch (err) {
      console.error('Order submit error', err);
      toast.error(err?.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold font-space text-secondary">Create Manual Order</h1>
        <p className="text-gray-600">Search products, add items, fill shipping, set delivery charges, and submit.</p>
      </div>

      {/* Product selector */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg font-bold text-primary mb-3">Add Products</h2>
        <div className="relative" ref={suggRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length && setOpenSuggest(true)}
                placeholder="Search products by name..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-2 focus:ring-0  outline-none "
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          {openSuggest && (
            <div className="absolute z-20 mt-2 w-full max-h-80 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
              {loadingSuggest ? (
                <div className="p-3 text-sm text-gray-500">Searching...</div>
              ) : suggestions.length ? (
                suggestions.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addProduct(p)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <img
                      src={typeof p.images?.[0] === 'string' ? p.images[0] : p.images?.[0]?.url}
                      alt={p.title}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => { e.currentTarget.style.visibility='hidden'; }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-primary line-clamp-1">{p.title}</div>
                      <div className="text-xs text-gray-600">Rs {numberFormat(p.salePrice ?? p.price)}</div>
                      {Array.isArray(p?.variants) && p.variants.length > 0 && (
                        <div className="text-[10px] text-gray-500">Has variants</div>
                      )}
                    </div>
                    <span className="text-xs text-secondary font-bold">ADD</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-gray-500">No products found</div>
              )}
            </div>
          )}
        </div>

        {/* Variant Picker Modal */}
        {variantModalOpen && variantProduct && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 z-0" onClick={() => setVariantModalOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-primary">Select Variants</h3>
                  <p className="text-sm text-gray-600">{variantProduct.title}</p>
                </div>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setVariantModalOpen(false)}>✕</button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
                {variantRows.map((row, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(variantProduct.variants || []).map((vg) => {
                        const selectedVal = row.selections[vg.name];
                        const selectedOpt = (vg.values || []).find(x => x.value === selectedVal) || {};
                        const imgSrc = typeof selectedOpt.image === 'string' ? selectedOpt.image : selectedOpt.image?.url;
                        return (
                          <div key={vg.name}>
                            <label className="block text-xs text-gray-600 mb-1">{vg.name}</label>
                            <div className="flex items-center gap-3">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={`${vg.name} ${selectedOpt.value || ''}`}
                                  className="w-10 h-10 object-cover rounded border"
                                  onError={(e) => { e.currentTarget.style.visibility='hidden'; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border border-dashed border-gray-200 grid place-content-center text-[10px] text-gray-400">N/A</div>
                              )}
                              <select
                                value={selectedVal || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setVariantRows(prev => prev.map((r, rIdx) => rIdx === idx ? { ...r, selections: { ...r.selections, [vg.name]: value } } : r));
                                }}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                              >
                                {(vg.values || []).map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.value}
                                    {typeof opt.price === 'number' ? ` — Rs ${numberFormat(opt.price)}` : ''}
                                    {opt.image ? ' • img' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) => setVariantRows(prev => prev.map((r, rIdx) => rIdx === idx ? { ...r, qty: Math.max(1, Number(e.target.value || 1)) } : r))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                        />
                      </div>
                      <div className="self-end text-sm text-gray-700">
                        <span className="font-semibold">Unit Price: </span>
                        {(() => {
                          const selectedVariants = (variantProduct.variants || []).map(vg => {
                            const val = row.selections[vg.name];
                            const found = vg.values?.find(x => x.value === val) || {};
                            return { name: vg.name, value: val, price: found.price ?? null };
                          });
                          const unit = computeUnitPrice(variantProduct, selectedVariants);
                          return `Rs ${numberFormat(unit)}`;
                        })()}
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      {variantRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVariantRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const defaults = Object.fromEntries((variantProduct.variants || []).map(vg => [vg.name, vg.values?.[0]?.value || '']));
                    setVariantRows(prev => [...prev, { selections: defaults, qty: 1 }]);
                  }}
                  className="text-primary hover:text-secondary text-sm"
                >
                  + Add another combination
                </button>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVariantModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // validate selections
                    const allValid = variantRows.every(row => (variantProduct.variants || []).every(vg => !!row.selections[vg.name]));
                    if (!allValid) {
                      toast.error('Please select a value for each variant group');
                      return;
                    }
                    addItemsWithVariants(variantProduct, variantRows);
                    setVariantModalOpen(false);
                    setVariantProduct(null);
                    setVariantRows([]);
                    setQuery('');
                    setOpenSuggest(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-secondary"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected items */}
        {items.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary border-b">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Subtotal</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={`${i._id}-${idx}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 flex items-center gap-3">
                      <img
                        src={getItemImage(i)}
                        alt={i.title}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => { e.currentTarget.style.visibility='hidden'; }}
                      />
                      <div>
                        <div className="font-semibold text-primary">{i.title}</div>
                        {!!(i.selectedVariants && i.selectedVariants.length) && (
                          <div className="text-[11px] text-gray-600">
                            {i.selectedVariants.map(v => `${v.name}: ${v.value}`).join(' | ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3">Rs {numberFormat(i.unitPrice ?? (i.salePrice ?? i.price))}</td>
                    <td className="py-2 pr-3">
                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => decAt(idx)} className="px-2 py-1 hover:bg-gray-50">
                          <FiMinus />
                        </button>
                        <span className="px-3 font-semibold">{i.count}</span>
                        <button onClick={() => incAt(idx)} className="px-2 py-1 hover:bg-gray-50">
                          <FiPlus />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 pr-3">Rs {numberFormat(Number(i.unitPrice ?? (i.salePrice ?? i.price)) * Number(i.count))}</td>
                    <td className="py-2">
                      <button onClick={() => removeAt(idx)} className="text-red-500 hover:text-red-600">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipping & Charges */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 md:p-6">
          <h2 className="text-lg font-bold text-primary mb-4">Shipping Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                value={shipping.fullName}
                onChange={(e) => updateShipping('fullName', e.target.value)}
                placeholder="Full Name * (پورا نام)"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mobile</label>
              <input
                type="tel"
                name="mobile"
                autoComplete="tel"
                value={shipping.mobile}
                onChange={(e) => updateShipping('mobile', e.target.value)}
                placeholder="Mobile Number * (موبائل نمبر)"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">City</label>
              <input
                type="text"
                name="city"
                autoComplete="address-level2"
                value={shipping.city}
                onChange={(e) => updateShipping('city', e.target.value)}
                placeholder="City * (شہر)"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                autoComplete="address-line1"
                value={shipping.streetAddress}
                onChange={(e) => updateShipping('streetAddress', e.target.value)}
                placeholder="Street Address * (مکمل پتہ)"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Additional Instructions</label>
              <textarea
                name="additionalInstructions"
                rows={2}
                value={shipping.additionalInstructions}
                onChange={(e) => updateShipping('additionalInstructions', e.target.value)}
                placeholder="Enter any special instructions here..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 md:p-6 h-fit">
          <h2 className="text-lg font-bold text-primary mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">Rs {numberFormat(subtotal)}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Delivery Charges</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={deliveryCharges}
                  onChange={(e) => { if (freeShipping) return; setDeliveryCharges(Number(e.target.value || 0)); }}
                  disabled={freeShipping}
                  readOnly={freeShipping}
                  tabIndex={freeShipping ? -1 : 0}
                  aria-disabled={freeShipping}
                  className={`w-28 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-primary text-right ${freeShipping ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="freeShip" type="checkbox" checked={freeShipping} onChange={(e) => setFreeShipping(e.target.checked)} />
              <label htmlFor="freeShip" className="text-gray-700">Mark as Free Shipping</label>
            </div>
            <div className="pt-3 border-t flex justify-between text-base font-bold">
              <span>Total</span>
              <span>Rs {numberFormat(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full bg-primary text-secondary font-semibold py-2 rounded-lg hover:bg-secondary hover:text-primary transition disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualOrder;

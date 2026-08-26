import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import { GiMoneyStack } from "react-icons/gi";
import { IoMdCall } from "react-icons/io";
import { dateFormatter } from "../../utils/dateFormatter";
import { trackLcsStatus, updateOrderDetails, deleteOrderById, getOrdersSearch } from "../../functions/order";
import postexAPI from "../../functions/postex";
import toast from "react-hot-toast";
import { getLcsBadgeTheme } from "../../utils/courierStatus";
import { CiEdit, CiTrash, CiCircleCheck, CiCircleRemove } from "react-icons/ci";
import PostExManager from "../../components/admin/PostExManager";

const Row = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-1">
    <div className="w-32 text-gray-500 text-sm">{label}</div>
    <div className="flex-1 text-sm text-gray-800">{children}</div>
  </div>
);

const getImageUrl = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") return img.url || "";
  return "";
};

const OrderDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { orderId } = useParams();
  const [order, setOrder] = useState(state?.order);
  const [tracking, setTracking] = useState(null); // { status, currentCity, lastEventAt, events }
  const [trackLoading, setTrackLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canEdit = useMemo(() => {
    return (order?.status === 'Pending') && !(order?.shippingProvider?.pushed);
  }, [order?.status, order?.shippingProvider?.pushed]);
  const [form, setForm] = useState({
    fullName: order?.shippingAddress?.fullName || "",
    mobile: order?.shippingAddress?.mobile || "",
    city: order?.shippingAddress?.city || "",
    streetAddress: order?.shippingAddress?.streetAddress || "",
    additionalInstructions: order?.shippingAddress?.additionalInstructions || "",
  });
  // Fallback: hydrate order by ID when navigated without state
  useEffect(() => {
    const hydrate = async () => {
      if (order || !orderId) return;
      try {
        const res = await getOrdersSearch({ q: orderId, limit: 1 });
        const found = Array.isArray(res?.orders) ? res.orders.find(o => String(o._id) === String(orderId)) : null;
        if (found) setOrder(found);
      } catch (e) {
        // noop; UI will show the fallback message
      }
    };
    hydrate();
  }, [order, orderId]);

  // Sync form if order changes
  useEffect(() => {
    setForm({
      fullName: order?.shippingAddress?.fullName || "",
      mobile: order?.shippingAddress?.mobile || "",
      city: order?.shippingAddress?.city || "",
      streetAddress: order?.shippingAddress?.streetAddress || "",
      additionalInstructions: order?.shippingAddress?.additionalInstructions || "",
    });
  }, [order?.shippingAddress]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        orderId: order._id,
        shippingAddress: {
          fullName: form.fullName.trim(),
          mobile: form.mobile.trim(),
          city: form.city.trim(),
          streetAddress: form.streetAddress.trim(),
          additionalInstructions: form.additionalInstructions?.trim() || "",
        },
      };
      const res = await updateOrderDetails(payload);
      if (res?.success) {
        // Mutate local order reference so UI updates
        if (order?.shippingAddress) {
          order.shippingAddress = res.order.shippingAddress;
        }
        toast.success("Order details updated");
        setIsEditing(false);
      } else {
        toast.error(res?.error || "Failed to update order");
      }
    } catch (e) {
      toast.error(e?.error || e?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order?._id) return;
    try {
      setDeleting(true);
      const res = await deleteOrderById(order._id);
      if (res?.success) {
        toast.success("Order deleted");
        setConfirmOpen(false);
        navigate(state?.from || "/admin/orders", { replace: true });
      } else {
        toast.error(res?.error || "Failed to delete order");
      }
    } catch (e) {
      toast.error(e?.error || e?.message || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  const courierStatus = useMemo(() => {
    const fromTrack = tracking?.status;
    const pktTitle = order?.shippingProvider?.extra?.packet_list?.[0]?.title;
    const pktStatus = order?.shippingProvider?.extra?.packet_list?.[0]?.booked_packet_status;
    return (fromTrack || pktTitle || pktStatus || "—");
  }, [tracking?.status, order?.shippingProvider?.extra]);

  const courierStatusTheme = useMemo(() => getLcsBadgeTheme(courierStatus), [courierStatus]);

  const courierLastUpdated = useMemo(() => {
    const fromTrack = tracking?.lastEventAt;
    const pktDate = order?.shippingProvider?.extra?.packet_list?.[0]?.booking_date;
    return fromTrack || pktDate || null;
  }, [tracking?.lastEventAt, order?.shippingProvider?.extra]);

  const handleRefreshTracking = async () => {
    const provider = order?.shippingProvider?.provider;
    if (!order?.shippingProvider?.trackingNumber && !order?.shippingProvider?.consignmentNo) return;
    const cn = order?.shippingProvider?.trackingNumber || order?.shippingProvider?.consignmentNo;
    try {
      setTrackLoading(true);
      let res;
      if (provider === 'postex') {
        // Track via PostEx using CN
        res = await postexAPI.trackOrderByCN(cn);
        const latest = res?.data?.data || res?.data || null; // unwrap {success, data}
        setTracking(latest);
      } else {
        // Default to LCS
        res = await trackLcsStatus(cn);
        setTracking(res?.data || null);
      }
    } catch (e) {
      setTracking(null);
    } finally {
      setTrackLoading(false);
    }
  };

  // Auto-refresh tracking on page open when a CN is available
  useEffect(() => {
    // Fire once on mount; if CN is already present it will refresh immediately
    const cn = order?.shippingProvider?.trackingNumber || order?.shippingProvider?.consignmentNo;
    // Seed UI from saved packet_list if present so badge shows immediately
    const pkt = order?.shippingProvider?.extra?.packet_list?.[0];
    if (pkt && !tracking) {
      setTracking({
        status: pkt?.title || pkt?.booked_packet_status || '—',
        currentCity: pkt?.origin_city_name || null,
        lastEventAt: pkt?.booking_date || null,
        events: [],
      });
    }
    if (cn) {
      handleRefreshTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also watch for CN becoming available after mount (e.g., state hydration)
  useEffect(() => {
    const cn = order?.shippingProvider?.trackingNumber || order?.shippingProvider?.consignmentNo;
    if (cn && !tracking && !trackLoading) {
      handleRefreshTracking();
    }
  }, [order?.shippingProvider?.trackingNumber, order?.shippingProvider?.consignmentNo]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(state?.from || "/admin/orders")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border hover:bg-gray-50 text-sm"
          >
            <MdArrowBack /> Back
          </button>
        </div>

        {!order ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-700">
              Unable to load order details directly. Please open this page via the
              Orders list using the eye icon.
            </p>
            <p className="mt-2 text-gray-500 text-sm">Order ID: {orderId}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Confirm Delete Modal */}
            {confirmOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setConfirmOpen(false)} />
                <div role="dialog" aria-modal="true" className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl p-5 z-10">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Order?</h3>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
                  <p className="text-gray-500 text-sm">Order ID: {order._id}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Courier Status Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${courierStatusTheme}`} title="Courier live status">
                    <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70"></span>
                    <span>Courier: {trackLoading ? 'Fetching…' : courierStatus}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated: {courierLastUpdated ? dateFormatter(courierLastUpdated) : '—'}
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 capitalize">
                    {order?.source || "web"}
                  </span>
                  <select
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    value={order.status || "Pending"}
                    disabled
                  >
                    {( ["Pending", "Shipped", "Delivered", "Cancelled"]).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            title="Edit order details"
                            aria-label="Edit order details"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-green-600 hover:bg-gray-50"
                          >
                            <CiEdit className="text-xl" />
                          </button>
                          <button
                            onClick={() => setConfirmOpen(true)}
                            title="Delete order"
                            aria-label="Delete order"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={deleting}
                          >
                            <CiTrash className="text-xl" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            title="Cancel edit"
                            aria-label="Cancel edit"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            disabled={saving}
                          >
                            <CiCircleRemove className="text-xl" />
                          </button>
                          <button
                            onClick={handleSave}
                            title="Save changes"
                            aria-label="Save changes"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-300 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            disabled={saving}
                          >
                            <CiCircleCheck className="text-xl" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Row label="Ordered On">
                    {dateFormatter(order.orderedAt)}
                  </Row>
                  <Row label="Customer">
                    {!isEditing ? (
                      order?.orderedBy?.username || order?.shippingAddress?.fullName
                    ) : (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
                        value={form.fullName}
                        onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      />
                    )}
                  </Row>
                  <Row label="Phone">
                    {!isEditing ? (
                      <span className="inline-flex items-center gap-1">
                        <IoMdCall /> {order?.shippingAddress?.mobile}
                      </span>
                    ) : (
                      <input
                        type="tel"
                        className="border rounded px-2 py-1 w-full"
                        value={form.mobile}
                        onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                      />
                    )}
                  </Row>
                  <Row label="City">
                    {!isEditing ? (
                      order?.shippingAddress?.city || "—"
                    ) : (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    )}
                  </Row>
                </div>
                <div>
                  <Row label="Delivery Charges">Rs.{order?.deliveryCharges}</Row>
                  <Row label="Coupon">
                    {order?.couponCode ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">{order.couponCode}</span>
                        {Number(order?.discountAmount || 0) > 0 && (
                          <span className="text-green-700 text-sm">− Rs.{Number(order.discountAmount).toLocaleString()}</span>
                        )}
                      </span>
                    ) : '—'}
                  </Row>
                  <Row label="Total" >
                    <div className="flex flex-col items-end gap-0.5">
                      {Number(order?.discountAmount || 0) > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="line-through mr-2">
                            Rs.{Number((Number(order?.totalPrice || 0) + Number(order?.discountAmount || 0))).toLocaleString()}
                          </span>
                          <span className="text-green-700 font-medium">
                            You saved Rs.{Number(order?.discountAmount || 0).toLocaleString()} (
                            {(() => {
                              const base = Number((Number(order?.totalPrice || 0) + Number(order?.discountAmount || 0)));
                              const pct = base > 0 ? Math.round((Number(order?.discountAmount || 0) / base) * 100) : 0;
                              return `${pct}%`;
                            })()}
                            )
                          </span>
                        </div>
                      )}
                      <span className="font-semibold text-green-700 inline-flex items-center gap-1">
                        <GiMoneyStack /> Rs.{order?.totalPrice}
                      </span>
                    </div>
                  </Row>
                  <Row label="Instructions">
                    {!isEditing ? (
                      order?.shippingAddress?.additionalInstructions || "—"
                    ) : (
                      <textarea
                        className="border rounded px-2 py-1 w-full min-h-[70px]"
                        value={form.additionalInstructions}
                        onChange={(e) => setForm((f) => ({ ...f, additionalInstructions: e.target.value }))}
                      />
                    )}
                  </Row>
                </div>
              </div>

              <div className="mt-3">
                <Row label="Address">
                  {!isEditing ? (
                    <span className="block">{order?.shippingAddress?.streetAddress || "—"}</span>
                  ) : (
                    <textarea
                      className="border rounded px-2 py-1 w-full min-h-[70px]"
                      value={form.streetAddress}
                      onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))}
                    />
                  )}
                </Row>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Variants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.cartSummary?.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <img
                            src={getImageUrl(p.image)}
                            alt={p.title}
                            className="w-12 h-12 rounded object-cover border bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/auth-bg.jpg";
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-blue-700">{p.title}</td>
                        <td className="px-3 py-2 text-sm font-semibold">Rs.{p.price}</td>
                        <td className="px-3 py-2 text-sm">{p.count}</td>
                        <td className="px-3 py-2 text-xs">
                          {Array.isArray(p.selectedVariants) && p.selectedVariants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.selectedVariants.map((v, vIdx) => {
                                const valueText = Array.isArray(v?.values)
                                  ? v.values.join(", ")
                                  : (v?.value ?? "");
                                const imgSrc = typeof v?.image === 'string' ? v.image : v?.image?.url;
                                return (
                                  <span key={vIdx} className="px-2 py-0.5 border capitalize inline-flex items-center gap-1">
                                    {imgSrc ? (
                                      <img
                                        src={imgSrc}
                                        alt={`${v?.name || 'variant'} ${valueText}`}
                                        className="w-5 h-5 object-cover rounded border"
                                        onError={(e) => { e.currentTarget.style.visibility='hidden'; }}
                                      />
                                    ) : null}
                                    <span>
                                      {v?.name}: {valueText || '—'}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Courier / Tracking */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Courier</h2>
              <div className="flex items-center gap-2">
                {order?.shippingProvider?.trackingNumber && (
                  <span className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-800">
                    CN: {order.shippingProvider.trackingNumber}
                  </span>
                )}
                {order?.shippingProvider?.labelUrl && (
                  <a
                    className="text-xs text-blue-600 underline"
                    href={order.shippingProvider.labelUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Slip
                  </a>
                )}
                <button
                  onClick={handleRefreshTracking}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                  disabled={!order?.shippingProvider?.trackingNumber && !order?.shippingProvider?.consignmentNo || trackLoading}
                >
                  {trackLoading ? 'Refreshing…' : 'Refresh Status'}
                </button>
              </div>
            </div>

            {tracking ? (
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-800">Status: {tracking.status || 'Unknown'}</span>
                  {tracking.currentCity && (
                    <span className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-800">Current City: {tracking.currentCity}</span>
                  )}
                  {tracking.lastEventAt && (
                    <span className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-800">Last Update: {tracking.lastEventAt}</span>
                  )}
                </div>
                {Array.isArray(tracking.events) && tracking.events.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Origin</th>
                          <th className="px-3 py-2">Destination</th>
                          <th className="px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tracking.events.map((e, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{e?.date || '—'}</td>
                            <td className="px-3 py-2">{e?.status || '—'}</td>
                            <td className="px-3 py-2">{e?.origin || '—'}</td>
                            <td className="px-3 py-2">{e?.destination || '—'}</td>
                            <td className="px-3 py-2">{e?.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No tracking history available yet.</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Click "Refresh Status" to fetch live courier status.</div>
            )}
          </div>

          {/* PostEx Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">PostEx Management</h2>
            <PostExManager 
              order={order} 
              onUpdate={(updatedOrder) => {
                setOrder(updatedOrder);
              }} 
            />
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;

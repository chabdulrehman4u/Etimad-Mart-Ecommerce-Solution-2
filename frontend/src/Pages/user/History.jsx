import React, { useEffect, useState } from "react";
import { getMyOrders } from "../../functions/order";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { truncateTitle } from "../../helpers/truncateTitle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Lottie from "lottie-react";

const History = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [successAnim, setSuccessAnim] = useState(null);

 const fetchMyOrders = async () => {
    try {
      setLoading(true);
      // Read persisted guestId (set on checkout) if available
      let gid = null;
      try { gid = localStorage.getItem('guestId') || null } catch {}
      const response = await getMyOrders(userId, gid);
      console.log("My Orders------->", response);
      setOrders(response?.orders || []);
    } catch (error) {
      console.log("Error in fetching your orders", error);
      toast.error("Error in fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch for guest on first mount or for logged-in when userId is ready
    fetchMyOrders();
    // Re-fetch when userId becomes available/changes (auth hydration)
  }, [userId]);

  // Load success Lottie JSON from public
  useEffect(() => {
    fetch("/Success.json")
      .then((r) => r.json())
      .then(setSuccessAnim)
      .catch(() => setSuccessAnim(null));
  }, []);

  // Show one-time success modal if coming from Checkout
  useEffect(() => {
    const fromState = Boolean(location?.state?.fromCheckout);
    let fromSession = false;
    let fromLocal = false;
    let fromQuery = false;
    let fromRecentTime = false;
    let fromHash = false;
    try { fromSession = sessionStorage.getItem('fromCheckout') === '1'; } catch {}
    try { fromLocal = localStorage.getItem('fromCheckout') === '1'; } catch {}
    try { fromQuery = new URLSearchParams(location.search).get('from') === 'checkout'; } catch {}
    try { fromHash = (location.hash || '').replace('#','') === 'fromCheckout'; } catch {}
    try {
      const ts = Number(localStorage.getItem('lastOrderTs'));
      if (!Number.isNaN(ts)) {
        fromRecentTime = Date.now() - ts <= 60_000; // 60 seconds fallback
      }
    } catch {}

    // Debug: log trigger detection (remove later)
    try { console.log('History modal trigger:', { fromState, fromSession, fromLocal, fromQuery, fromHash, fromRecentTime }); } catch {}

    if (fromState || fromSession || fromLocal || fromQuery || fromHash || fromRecentTime) {
      // Capture orderId for nicer modal
      let oid = null;
      try { oid = location?.state?.orderId || new URLSearchParams(location.search).get('orderId') || null; } catch {}
      if (!oid && orders?.length) {
        // fallback to most recent order id
        oid = orders[0]?._id || null;
      }
      if (oid) setPlacedOrderId(oid);
      setShowCongrats(true);
      // Clear state/query so modal doesn't reappear on navigation within history page
      if (fromState || fromQuery || fromHash) navigate(location.pathname, { replace: true });
      try { sessionStorage.removeItem('fromCheckout'); } catch {}
      try { localStorage.removeItem('fromCheckout'); } catch {}
      try { localStorage.removeItem('lastOrderTs'); } catch {}
      const timer = setTimeout(() => setShowCongrats(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Sort orders so most recent is first
  const sortedOrders = [...orders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

  // Content-based fallback: if latest order is very recent and not shown yet, show modal
  useEffect(() => {
    if (!sortedOrders.length) return;
    const latest = sortedOrders[0];
    const latestTs = new Date(latest?.orderedAt).getTime();
    if (!latestTs || Number.isNaN(latestTs)) return;
    const within2Min = Date.now() - latestTs <= 120_000; // 2 minutes
    const key = `congrats_shown_for_${latest?._id || latestTs}`;
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem(key) === '1'; } catch {}
    if (within2Min && !alreadyShown) {
      setShowCongrats(true);
      try { sessionStorage.setItem(key, '1'); } catch {}
      const timer = setTimeout(() => setShowCongrats(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [sortedOrders]);

  return (
    <div className="px-4 py-4 md:px-6 lg:px-6 min-h-screen">
      {showCongrats && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-100 relative">
            <button
              type="button"
              aria-label="Close"
              title="Close"
              onClick={() => setShowCongrats(false)}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 ring-4 ring-emerald-50 flex items-center justify-center">
                {successAnim ? (
                  <Lottie
                    animationData={successAnim}
                    autoplay
                    loop={false}
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-1">Order placed 🎉</h3>
              <p className="text-gray-600 mb-1">We’ll contact you shortly to confirm. You can review details below anytime.</p>
              <p className="text-gray-700 font-bold mb-2 text-sm md:text-base" dir="rtl">آپ کا آرڈر موصول ہو گیا ہے۔ تصدیق کے لیے ہم جلد آپ سے رابطہ کریں گے۔ تفصیلات نیچے دیکھیں۔</p>
              {(() => {
                const order = placedOrderId ? orders.find(o => o._id === placedOrderId) : orders[0];
                const itemCount = order?.cartSummary?.length || 0;
                const total = order?.totalPrice;
                return (
                  <div className="text-sm text-gray-700 mb-4">
                    {placedOrderId && <div className="font-semibold">Order ID: <span className="font-mono text-gray-800">{placedOrderId}</span></div>}
                    {(itemCount || total) && (
                      <div className="mt-1">{itemCount} item{itemCount === 1 ? '' : 's'} • Rs.{Number(total || 0).toLocaleString()}</div>
                    )}
                  </div>
                );
              })()}
              <div className="flex gap-3 justify-center">
                <Link
                  to="/shop"
                  className="px-5 py-2 rounded-lg bg-secondary text-primary font-semibold hover:bg-secondary/90 no-underline shadow-sm transition"
                  onClick={() => setShowCongrats(false)}
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      {loading ? (
        <p className="font-medium text-xl text-center">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center min-h-[70vh] px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[300px] max-h-[300px] w-full"
          >
            <img 
              src="/no-order.png" 
              alt="No Orders" 
              loading='lazy' 
              className="w-full h-auto object-contain"
            />
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-space text-gray-800 mb-4">
                No Orders Yet
              </h2>
              <Link 
                to="/shop"
                className="inline-block bg-secondary no-underline hover:bg-main-dark text-primary font-semibold px-8 py-3 rounded-full transition duration-300 transform hover:scale-105"
              >
                Start Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-0 md:mb-3 lg:mb-4 mt-1 text-center">
            Order History
          </h1>
          <div className="space-y-8">
            {sortedOrders.map((order, index) => (
              <div key={index} className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Order #{index + 1}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-md">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/4">Field</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 w-3/4">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">Order ID</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-800">{order._id}</td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">Status</td>
                        <td
                          className={`border-b border-gray-200 px-4 py-3 text-sm font-semibold text-white ${
                            order?.status === "Pending"
                              ? "bg-blue-500"
                              : order?.status === "Delivered"
                                ? "bg-green-500"
                                : order?.status === "Cancelled"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                          }`}
                        >
                          {order?.status}
                        </td>

                      </tr>
                      <tr>
                        <td className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">Products</td>
                        <td className="border-b border-gray-200 px-0 py-0">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 w-1/6">Image</th>
                                <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 w-3/6">Product</th>
                                <th className="border-b border-gray-200 px-4 py-2 text-center text-xs font-semibold text-gray-600 w-1/6">Count</th>
                                <th className="border-b border-gray-200 px-4 py-2 text-right text-xs font-semibold text-gray-600 w-1/6">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order?.cartSummary?.map((product, productIndex) => (
                                <tr key={productIndex} className="border-b border-gray-200 last:border-b-0">
                                  <td className="border-b border-gray-200 px-4 py-2">
                                    <img 
                                      src={product.image} 
                                      alt={product.title} 
                                      className="w-14 h-14 object-cover rounded"
                                      loading="lazy"
                                    />
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-800">
                                    <div className="font-medium mb-1">{truncateTitle(product.title, 40)}</div>
                                    <div>
                                      {Array.isArray(product.selectedVariants) && product.selectedVariants.length > 0 ? (
                                        product.selectedVariants.map((variant, variantIndex) => {
                                          const valueText = Array.isArray(variant?.values)
                                            ? variant.values.join(", ")
                                            : (variant?.value ?? "");
                                          return (
                                            <div key={variantIndex} className="capitalize text-xs text-gray-600">
                                              <span className="font-semibold">{variant?.name}:</span> {valueText || '—'}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border-b border-gray-200 px-4 py-2 text-center text-sm text-gray-800">{product.count}</td>
                                  <td className="border-b border-gray-200 px-4 py-2 text-right text-sm font-semibold text-gray-800">
                                    Rs.{(product?.price * product?.count).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">Delivery Charges</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-800">Rs.{order?.deliveryCharges?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">Total Bill</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800">Rs.{order?.totalPrice?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">Ordered By</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-800">
                          {order?.orderedBy?.username || order?.shippingAddress?.fullName}
                        </td>

                      </tr>
                      <tr>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">Ordered On</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-800 uppercase">
                          {new Date(order?.orderedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;

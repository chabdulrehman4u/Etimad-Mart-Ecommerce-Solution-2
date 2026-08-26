import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getRecentOrders, updateOrderStatus } from "../../functions/order";
import { toast } from "react-hot-toast";
import { FaEye } from "react-icons/fa";
import { BsBullseye } from "react-icons/bs";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { FcViewDetails } from "react-icons/fc";
import { GiMoneyStack } from "react-icons/gi";
import { GrStatusGoodSmall } from "react-icons/gr";
import { IoIosPerson } from "react-icons/io";
import { dateFormatter } from "../../utils/dateFormatter";
import { truncateTitle } from "../../helpers/truncateTitle";

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await getRecentOrders();
      // console.log("Response of all orders for admin:", response?.orders);
      setOrders(response?.orders || []);
    } catch (error) {
      console.log("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const Statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];

  useEffect(() => {
    fetchAllOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewProduct(null);
        setPreviewOrder(null);
      }
    };
    if (previewProduct) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewProduct]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });

      // Update the local state with the new order status
      const updatedOrders = orders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.log("Error updating order status", error);
      toast.error(error?.message || "Error in updating order status");
    }
  };

  // Filter orders by search query (order ID)
  const filteredOrders = orders.filter((order) =>
    order._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:px-5 md:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            New Orders
            <span className="ml-2 text-lg font-medium text-gray-600">
              ({orders.length} total)
            </span>
          </h1>
          {/* Search Bar */}
          {/* <div className="max-w-md">
            <input
              type="text"
              placeholder="Search Orders by Order ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div> */}
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <p className="text-gray-600 text-lg">No orders available.</p>
                {searchQuery && (
                  <p className="text-gray-500 text-sm mt-2">
                    No orders found matching "{searchQuery}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Mobile: Card list */}
              <div className="md:hidden divide-y">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-gray-600">
                        {dateFormatter(order.orderedAt)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          order?.source === "web"
                            ? "bg-blue-100 text-blue-700"
                            : order?.source === "mobile"
                            ? "bg-green-100 text-green-700"
                            : order?.source === "manual"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        title={order?.source || "unknown"}
                      >
                        {order?.source || "unknown"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      <div className="font-semibold truncate">
                        {order?.orderedBy?.username || order?.shippingAddress?.fullName}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {order?.shippingAddress?.city || "—"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-700 truncate">
                      <span className="font-medium">{order.cartSummary?.length || 0} item(s)</span>
                      {order.cartSummary && order.cartSummary.length > 0 && (
                        <span className="block truncate">
                          {truncateTitle(order.cartSummary[0].title, 40)}
                          {order.cartSummary.length > 1 ? ` +${order.cartSummary.length - 1} more` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-700">Delivery: Rs.{order?.deliveryCharges}</span>
                      <span className="text-sm font-bold text-green-600">Rs.{order?.totalPrice}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="flex-1 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        value={order.status || "Pending"}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        {Statuses.map((status, index) => (
                          <option key={index} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        className="inline-flex items-center justify-center p-2"
                        title="View details"
                        onClick={() =>
                          navigate(`/admin/orders/${order._id}`, {
                            state: { order, from: "/admin/new-orders" },
                          })
                        }
                      >
                        <FaEye size={16} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto relative">
                <table className="w-full table-auto border-collapse bg-white min-w-[960px]">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1 w-28 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Date
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <IoIosPerson size={20} className="text-gray-500" />
                          <span>Customer</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        <span>Source</span>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <GrStatusGoodSmall size={20} className="text-gray-500" />
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 max-w-[160px]">
                        <div className="flex items-center gap-2">
                          <FcViewDetails size={20} />
                          <span>Products</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <FaMoneyBillTrendUp size={20} className="text-gray-500" />
                          <span>Delivery</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <GiMoneyStack size={20} className="text-gray-500" />
                          <span>Total</span>
                        </div>
                      </th>
                      <th className="px-1 py-3 w-12 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-white z-20">
                        <span
                          className="inline-flex items-center justify-center w-full"
                          title="View"
                        >
                          <BsBullseye size={24} className=" font-extrabold text-primary" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-2 py-3 text-sm leading-tight text-gray-900 border-r border-gray-200 text-center">
                          <span className="font-mono flex justify-center text-xs">
                            {dateFormatter(order.orderedAt)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 truncate">
                          <div className="font-medium">
                            {order?.orderedBy?.username || `${order?.shippingAddress?.fullName}`}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              order?.source === "web"
                                ? "bg-blue-100 text-blue-700"
                                : order?.source === "mobile"
                                ? "bg-green-100 text-green-700"
                                : order?.source === "manual"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                            title={order?.source || "unknown"}
                          >
                            {order?.source || "unknown"}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-sm border-r border-gray-200">
                          <select
                            className="py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            value={order.status || "Pending"}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          >
                            {Statuses.map((status, index) => (
                              <option key={index} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200 max-w-[160px]">
                          <div className="text-sm text-gray-800 truncate">
                            <span className="font-semibold text-xs">{order.cartSummary?.length || 0} item(s)</span>
                            {order.cartSummary && order.cartSummary.length > 0 && (
                              <span className="block text-gray-600 text-sm truncate">
                                {truncateTitle(order.cartSummary[0].title, 40)}
                                {order.cartSummary.length > 1 ? ` +${order.cartSummary.length - 1} more` : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200 hidden lg:table-cell">
                          Rs.{order?.deliveryCharges}
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-green-600 border-r border-gray-200">
                          Rs.{order?.totalPrice}
                        </td>
                        <td className="px-1 py-3 text-center sticky right-0 bg-white z-20">
                          <button
                            className="inline-flex items-center justify-center  p-2 "
                            title="View details"
                            onClick={() =>
                              navigate(`/admin/orders/${order._id}`, {
                                state: { order, from: "/admin/new-orders" },
                              })
                            }
                          >
                            <FaEye size={16} className="text-gray-700" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {previewProduct && previewOrder && (
        <div
          className="fixed inset-0 top-20  z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => {
            setPreviewProduct(null);
            setPreviewOrder(null);
          }}
        >
          <div
            className="relative flex flex-col md:flex-row items-start justify-start bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setPreviewProduct(null);
                setPreviewOrder(null);
              }}
              className="absolute top-1 right-1 rounded-full"
              aria-label="Close preview"
            >
              <span className="text-2xl font-extrabold text-primary">
                &times;
              </span>
            </button>
            <img
              src={previewProduct.image}
              alt="Preview"
              className="max-w-[200px] max-h-[200px] rounded-lg object-contain mb-4 md:mb-0 md:mr-6"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-secondary">
                {previewProduct.title}
              </h2>
              <p className="text-black">
                Price: <span className="font-semibold">Rs.{previewProduct.price}</span>
              </p>
              <p className="text-black">
                Quantity: <span className="font-semibold">{previewProduct.count}</span>
              </p>
              {previewProduct.selectedVariants &&
                previewProduct.selectedVariants.length > 0 && (
                  <div>
                    <p className="text-gray-700 font-semibold">Variants:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {previewProduct.selectedVariants.map((variant, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{variant.name}:</span>{" "}
                          {variant.values.join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              <hr className="my-1 text-secondary" />
              <p className="text-black">
                <span className="font-semibold">Name:</span> {previewOrder?.shippingAddress?.fullName}
              </p>
              <p className="text-black">
                <span className="font-semibold">Mobile:</span> {previewOrder?.shippingAddress?.mobile}
              </p>
              <p className="text-black">
                <span className="font-semibold">City:</span> {previewOrder?.shippingAddress?.city}
              </p>
              <p className="text-black">
                <span className="font-semibold">Address:</span> {previewOrder?.shippingAddress?.streetAddress}
              </p>
              <p className="text-black">
                <span className="font-semibold">Ordered On:</span> {new Date(previewOrder?.orderedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrders;

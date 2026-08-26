import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdDeleteOutline } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addItemToCart } from "../functions/cart";
import { truncateTitle } from "../helpers/truncateTitle";
import { FaWhatsapp, FaCheckCircle } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";
import { clearCart } from "../functions/cart";
import {
  clearCartRedux,
  removeFromCart,
  removeVariant,
  updateQuantity,
} from "../store/cartSlice";
import { motion } from "framer-motion";
import useFacebookPixel from "../hooks/useFacebookPixel";
import useTikTokPixel from "../hooks/useTikTokPixel";

const Cart = () => {
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const [data, setData] = useState({ products: [] });
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const cartItems = useSelector((state) => state.cart.products);
  const { track } = useFacebookPixel();
  const { track: trackTikTok } = useTikTokPixel();
  // console.log("cart items in redux---->", cartItems)

  const getImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object') return img.url || '';
    return '';
  };

  useEffect(() => {
    setCartData(cartItems);
  }, [cartItems]);

  const getEffectivePrice = (product) => {
    if (!product) {
      return 0;
    }
    return product.salePrice != null ? product.salePrice : product.price;
  };

  // console.log("Total Price:------>", totalPrice);
  // console.log("Cart Data------->", cartData);

  const handleWhatsAppOrder = () => {
    const phoneNumber = "923071111832"; // WhatsApp number in international format (without +)
    // Format each product as a line in the message
    const productLines = cartData.map(
      (item, idx) =>
        `${idx + 1}. ${item.title} x${item.count} -Charges: Rs. ${item.price * item.count}`
    ).join('\n');
    const message = `Hello! I want to place an order. Here are my cart details:\n\n${productLines}\n\nDelivery Charges: Rs. ${deliveryCharges}\nTotal Bill: Rs. ${totalBill}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    
    // Meta Pixel tracking
    track("StartConversation", {
      content_name: 'WhatsApp Order',
      content_category: 'Cart Checkout',
      source: 'cart_page_whatsapp_button',
      value: totalBill,
      currency: "PKR",
      num_items: cartItems.length,
      content_ids: cartItems.map((item) => item.productId),
    });
    
    // TikTok Pixel tracking
    trackTikTok("StartConversation", {
      content_name: 'WhatsApp Order',
      value: totalBill,
      currency: "PKR",
      content_ids: cartItems.map((item) => item.productId),
    });
  };

  const handleQuantityChange = (cartItemId, type) => {
    const product = cartItems.find((item) => item.cartItemId === cartItemId);
    if (!product) return;

    const newQuantity =
      type === "increment" ? product.count + 1 : product.count - 1;

    if (newQuantity > 0) {
      dispatch(updateQuantity({ id: cartItemId, count: newQuantity }));
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    dispatch(removeFromCart({ id: cartItemId }));
    toast.success("Product removed from cart.");
  };

  const handleClearCart = async () => {
    try {
      dispatch(clearCartRedux());
      if (userId) {
        const response = await clearCart(userId);
        dispatch(clearCartRedux());
        // console.log("Clear cart response------>" ,response )
      }
      setData({ products: [] });
      setCartData([]);
      toast.success("Cart cleared successfully.");
    } catch (error) {
      console.log("Error in clearing the cart", error);
      toast.error("Failed to clear the cart");
    }
  };

  // Check if any product has freeShipping set to true
  const hasFreeShipping = cartItems.some((item) => item.freeShipping);

  const totalPrice = cartData.reduce(
    (prev, curr) =>
      prev +
      curr.count * (curr.salePrice != null ? curr.salePrice : curr.price),
    0
  );

  const FREE_THRESHOLD = 4000;
  const deliveryCharges = (() => {
    if (cartData.length === 0) return 0;
    // Threshold-based free delivery
    if (totalPrice >= FREE_THRESHOLD) return 0;
    // Fallback: all items have freeShipping
    if (cartData.every((item) => item.freeShipping)) return 0;
    return 250;
  })();

  const totalBill = totalPrice + deliveryCharges;
  const remainingForFree = Math.max(0, FREE_THRESHOLD - totalPrice);
  const progressPct = Math.min(100, Math.round((totalPrice / FREE_THRESHOLD) * 100));

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const cartPayload = {
        products: cartItems.map(
          ({
            productId,
            title,
            count,
            price,
            salePrice,
            image,
            selectedVariants,
          }) => ({
            productId,
            title,
            count,
            price: salePrice != null ? salePrice : price,
            image,
            selectedVariants,
          })
        ),
        deliveryCharges: deliveryCharges,
      };
      console.log("Cart payload---->", cartPayload);

      await addItemToCart(userId, cartPayload);
      
      // Meta Pixel InitiateCheckout event
      track("InitiateCheckout", {
        value: totalBill,
        currency: "PKR",
        num_items: cartItems.length,
        content_ids: cartItems.map((item) => item.productId),
      });
      
      // TikTok Pixel InitiateCheckout event
      trackTikTok("InitiateCheckout", {
        value: totalBill,
        currency: "PKR",
        content_ids: cartItems.map((item) => item.productId),
      });
      
      toast.success("Cart saved successfully! Proceeding to checkout...");
      navigateTo("/cart/checkout");
    } catch (error) {
      console.log("Error during checkout:", error);
      toast.error("Failed to proceed to checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container min-h-screen mx-auto">
      {cartData.length === 0 ? (
        <div className="flex flex-col items-center  min-h-[70vh] px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[300px] max-h-[300px] w-full"
          >
            <img
              src="/empty-cart.jpg"
              alt="Empty Cart"
              loading="lazy"
              className="object-contain w-full h-auto"
            />
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl font-space">
                Your Cart is Empty
              </h2>
              <Link
                to="/shop"
                className="inline-block px-8 py-3 font-semibold text-primary no-underline transition duration-300 transform rounded-full bg-secondary hover:bg-main-dark hover:scale-105"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col p-4 lg:flex-row lg:gap-6 lg:justify-between">
          {/* View product */}
          <div className="max-w-full lg:w-[60%] px-0 md:px-4 lg:px-5">
            <h2 className="py-2 text-xl font-bold text-center md:text-2xl text-main md:py-4 lg:py-6">
              {cartData?.length > 0 ? (
                ""
              ) : (
                <p className="text-xl font-bold text-gray-600 md:text-2xl">
                  Empty cart.{" "}
                  <Link
                    to={"/shop"}
                    className="font-semibold underline text-main"
                  >
                    Continue
                  </Link>
                </p>
              )}
            </h2>
            {cartData.map((product) => (
              <div
                key={product.cartItemId}
                className="w-full bg-white h-auto my-2 border border-slate-300 rounded grid grid-cols-[96px,1fr] sm:grid-cols-[128px,1fr] p-2 sm:p-4"
              >
                {/* Product Image */}
                <div className="w-24 h-24 overflow-hidden md:w-28 md:h-28 bg-slate-200">
                  <img
                    src={getImageUrl(product.image)}
                    className="object-contain w-full h-full mix-blend-multiply"
                    alt={product.title}
                    loading="lazy"
                  />
                </div>

                {/* Product Details */}
                <div className="relative px-2 py-2">
                  {/* Remove Button */}
                  <div
                    onClick={() => handleRemoveItem(product.cartItemId)}
                    className="absolute top-0 right-0 mx-1 mt-2 text-white rounded cursor-pointer bg-secondary/70 hover:bg-secondary/90 sm:mx-2"
                  >
                    <button className="flex items-center justify-center text-sm bg-white sm:text-lg">
                      <MdDeleteOutline
                        size={24}
                        className="text-secondary/80 hover:text-secondary"
                      />
                    </button>
                  </div>

                  {/* Product Title */}
                  <h2 className="text-base font-medium text-ellipsis line-clamp-1">
                    {truncateTitle(product?.title, 50)}
                  </h2>
                  {/* Price Section */}
                  <div className="flex items-center justify-between ">
                    <p className="text-sm font-medium text-secondary sm:text-base md:text-base">
                      Rs. {getEffectivePrice(product)}
                    </p>
                    <p className="text-sm font-semibold text-primary sm:text-base md:text-lg">
                      Rs. {getEffectivePrice(product) * product.count}
                    </p>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center gap-2 mt-2 sm:gap-3">
                    <button
                      onClick={() =>
                        handleQuantityChange(product.cartItemId, "decrement")
                      }
                      className="flex items-center justify-center w-6 h-6 text-secondary border border-secondary rounded hover:bg-primary hover:text-white md:w-7 md:h-7"
                      disabled={product?.count <= 1}
                    >
                      -
                    </button>
                    <span className="text-sm sm:text-base">
                      {product?.count}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(product.cartItemId, "increment")
                      }
                      className="flex items-center justify-center w-6 h-6 text-secondary border border-secondary rounded hover:bg-primary hover:text-white md:w-7 md:h-7"
                      disabled={product.count >= 200}
                    >
                      +
                    </button>
                  </div>
                  {/* Display Variants */}
                  {product?.selectedVariants?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div className="flex flex-col gap-2">
                        {/* Iterate through each variant type (e.g., Color, Size) */}
                        {product.selectedVariants.map((variant) => (
                          <div
                            key={variant.name}
                            className="flex items-center gap-2"
                          >
                            {/* Display variant name with improved styling */}
                            <span className="font-semibold text-gray-900 capitalize">
                              {variant.name}:
                            </span>
                            {/* Display selected values for this variant as badges */}
                            <div className="flex flex-wrap gap-1">
                              {variant.values.map((value, valueIndex) => (
                                <span
                                  key={`${variant.name}-${valueIndex}`}
                                  className="px-3 py-1 capitalize text-xs font-medium bg-main/10 text-secondary"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {cartData && cartData.length > 0 && (
            <div className="w-full lg:w-[40%] flex mt-4 flex-col items-center">
              <h2 className="mb-2 text-xl font-extrabold md:text-2xl lg:text-3xl text-secondary md:mb-4">
                Summary
              </h2>
              <div className="w-full max-w-sm mt-0 mb-4 bg-white shadow-md md:sticky md:top-20">
                <div className="p-4 space-y-3">
                  {/* Free Delivery Badge */}
                  <div className={`rounded-md border ${remainingForFree === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} p-3`}> 
                    <div className="flex items-center gap-2">
                      {remainingForFree === 0 ? (
                        <FaCheckCircle className="text-green-600" size={18} />
                      ) : (
                        <FiTruck className="text-amber-600" size={18} />
                      )}
                      <p className={`text-sm font-semibold ${remainingForFree === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                        {remainingForFree === 0 ? 'Free delivery applied' : `Spend Rs. ${remainingForFree} more to get Free Delivery`}
                      </p>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div className={`h-2 rounded ${remainingForFree === 0 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">Threshold: Rs. {FREE_THRESHOLD}</div>
                  </div>
                  <div className="flex justify-between text-base md:text-lg text-primary">
                    <p>SubTotal</p>
                    <p>Rs. {totalPrice}</p>
                  </div>
                  <div className="flex justify-between text-base md:text-lg text-primary">
                    <p>Delivery Charges</p>
                    <p>Rs. {deliveryCharges}</p>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold md:text-xl text-primary">
                    <p>Total Bill</p>
                    <p className="text-secondary">Rs. {totalBill}</p>
                  </div>
                  <hr className="my-2" />
                  <button
                    onClick={handleCheckout}
                    className="w-full py-2 text-white transition duration-200 bg-primary/80  hover:bg-primary"
                  >
                    Proceed to Order
                  </button>
                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full flex items-center justify-center gap-1 py-2 text-white transition duration-200 bg-[#25CC64]  hover:bg-green-800"
                  >
                   <FaWhatsapp size={22} /> Order with WhatsApp
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="w-full py-2 text-primary font-semibold transition duration-200 bg-secondary/80 hover:bg-secondary"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cart;

import React, { useEffect, useState } from "react";
import Drawer from "react-modern-drawer";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { truncateTitle } from "../../helpers/truncateTitle";
import { motion } from "framer-motion";
import { ImCross } from "react-icons/im";
import { removeFromCart } from '../../store/cartSlice';
import { addItemToCart } from '../../functions/cart';
import { toast } from 'react-hot-toast';

const CartDrawer = ({ isDrawerOpen, setIsDrawerOpen }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.products);
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;

  const [delayedOpen, setDelayedOpen] = useState(false);

  useEffect(() => {
    if (isDrawerOpen) {
      setTimeout(() => setDelayedOpen(true), 300);
    } else {
      setDelayedOpen(false);
    }
  }, [isDrawerOpen]);

  const getImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object') return img.url || '';
    return '';
  };

  // Stable key like in cartSlice to uniquely identify items (product + variants)
  const computeKey = (item) => item.cartItemId || (
    `${item.productId}` + (
      Array.isArray(item.selectedVariants) && item.selectedVariants.length > 0
        ? '|' + item.selectedVariants
            .map(v => `${v.name}:${Array.isArray(v.values) ? v.values.join(',') : v.values || ''}`)
            .join('|')
        : ''
    )
  );

  const handleRemove = async (item) => {
    try {
      const id = computeKey(item);
      // Prepare new cart state before dispatch to reuse for backend sync
      const newCartItems = cartItems.filter(ci => computeKey(ci) !== id);
      const deliveryCharges = newCartItems.every(i => i.freeShipping) ? 0 : 250;

      dispatch(removeFromCart({ id }));

      // Persist for logged-in users
      if (userId) {
        await addItemToCart(userId, {
          products: newCartItems,
          deliveryCharges,
        });
      }
    } catch (e) {
      toast.error('Failed to remove item. Please try again.');
      // no rethrow; drawer should continue to work for guests
      console.error('Error removing item from cart:', e);
    }
  };

  // Calculate cart total from Redux state
  const cartTotal = cartItems?.reduce(
    (total, item) => total + item.price * item.count,
    0
  );

  return (
    <Drawer
      open={delayedOpen}
      onClose={() => setIsDrawerOpen(false)}
      direction="right"
      size={400}
      className="relative !z-[1200] max-w-72 md:max-w-80"
    >
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col h-full p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close cart drawer"
            className="mr-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ImCross size={22} className="text-secondary " />
          </button>
          <h2 className="text-2xl font-roboto font-extrabold text-primary text-center flex-1">
            Your Cart
          </h2>
        </div>
        <hr></hr>
        <div className="flex-1 overflow-y-auto">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div key={index} className="flex items-center gap-1 mb-3">
                <img
                  src={getImageUrl(item?.image) || "https://via.placeholder.com/500"}
                  alt={truncateTitle(item?.title, 30)}
                  className="w-20 h-20 object-cover aspect-square"
                />
                <div className="w-full flex flex-col ml-2 relative">
                  <button
                    onClick={() => handleRemove(item)}
                    aria-label="Remove item from cart"
                    className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700"
                  >
                    <ImCross size={14} />
                  </button>
                  <h3 className="text-sm text-secondary font-semibold pr-6">
                    {truncateTitle(item?.title, 30)}
                  </h3>
                  <p className="text-sm font-bold text-gray-700">
                    {item?.count} X Rs. {item?.price}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Your cart is empty</p>
          )}
        </div>
        <div className="text-xl flex justify-between border-t-2 border-b-2 py-2">
          <p>Subtotal:</p>
          <p>Rs. {cartTotal}</p>
        </div>
        <Link
          to="/cart"
          className="bg-primary/80 absolutet bottom-0 no-underline text-secondary font-bold py-2 my-1 px-4 text-center hover:bg-primary"
          onClick={() => setIsDrawerOpen(false)}
        >
          Go to Cart
        </Link>
      </motion.div>
    </Drawer>
  );
};

export default CartDrawer;

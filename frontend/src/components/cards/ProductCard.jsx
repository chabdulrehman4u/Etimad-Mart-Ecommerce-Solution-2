import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { TbTruckDelivery } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { addItemToCart } from '../../functions/cart';
import { truncateTitle } from '../../helpers/truncateTitle';
import useFacebookPixel from '../../hooks/useFacebookPixel';
import { addToCart } from '../../store/cartSlice';
import useTikTokPixel from "../../hooks/useTikTokPixel";

const ProductCard = ({ product, backendCartItems = [] }) => {
    const dispatch = useDispatch();
    const navigateTo = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const currentCartItems = useSelector((state) => state.cart.products);
    const userId = user?._id;
    const { images, title, averageRating, price, salePrice, slug, freeShipping } = product;

    // Deal of the Day helper (single source of truth)
    // Active if flagged, has a DOD price, and the end time (if any) has not passed.
    const dodActive = useMemo(() => {
        if (!product?.isDod || product?.dodPrice == null) return false;
        const now = new Date();
        if (product.dodEnd && new Date(product.dodEnd) < now) return false;
        return true;
    }, [product?.isDod, product?.dodPrice, product?.dodEnd]);

    // Effective card price (ignores tiers; tiers override later when selected)
    const cardBasePrice = useMemo(() => (
        dodActive && product?.dodPrice != null
            ? Number(product.dodPrice)
            : (salePrice ?? price)
    ), [dodActive, product?.dodPrice, salePrice, price]);

    const off = useMemo(() => {
        if (!price) return 0;
        const target = dodActive && product?.dodPrice != null ? Number(product.dodPrice) : salePrice;
        if (!target || target >= price) return 0;
        return Math.floor(((price - target) / price) * 100);
    }, [price, salePrice, dodActive, product?.dodPrice]);
    const totalReviews = useMemo(() => (
        Array.isArray(product?.reviews) ? product.reviews.length : 0
    ), [product?.reviews]);
    const [isHovered, setIsHovered] = useState(false);
    const { track } = useFacebookPixel();
    const { track: trackTikTok } = useTikTokPixel();

    const imageWidth = 180;
    const imageHeight = 180;

    // Motion gating: disable heavy animations/hover on touch devices or when user prefers reduced motion
    const allowMotion = useMemo(() => {
        if (typeof window === 'undefined') return true;
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        return !(prefersReduced || isCoarse);
    }, []);

    const handleAddToCart = useCallback(async () => {
        // If product has variants, require selection on PDP
        if (Array.isArray(product?.variants) && product.variants.length > 0) {
            toast.error("Please select product options first.");
            navigateTo(`/product/${product?.slug}`);
            return;
        }
        const variantsForBackend = [];

        // If volume tiers exist, default to the first tier
        const firstTier = (product?.volumeTierEnabled && Array.isArray(product?.volumeTiers) && product.volumeTiers.length > 0)
            ? product.volumeTiers[0]
            : null;
        const basePrice = dodActive && product?.dodPrice != null
            ? Number(product.dodPrice)
            : (product?.salePrice ? product?.salePrice : product?.price);
        const priceToUse = (typeof firstTier?.price === 'number') ? firstTier.price : basePrice;
        const imageToUse = firstTier?.image ? getImageUrl(firstTier.image) : getImageUrl(product?.images && product?.images[0]);

        const cartItem = {
            cartItemId: product?._id,
            productId: product?._id,
            title: product?.title,
            price: priceToUse,
            image: imageToUse,
            count: 1,
            selectedVariants: variantsForBackend,
            freeShipping: product?.freeShipping,
            deliveryCharges: product?.freeShipping ? 0 : 250
        };

        try {
            dispatch(addToCart(cartItem));
            toast.success("Product added to cart!");
            // Meta Pixel AddToCart event
            track('AddToCart', {
                content_ids: [product._id],
                content_name: product.title,
                value: product.salePrice ? product.salePrice : product.price,
                currency: 'PKR'
            });
            // TikTok Pixel AddToCart event
            trackTikTok('AddToCart', {
                content_ids: [product._id],
                content_name: product.title,
                value: product.salePrice ? product.salePrice : product.price,
                currency: 'PKR'
            });
        } catch (error) {
            toast.error("Failed to add the product to the cart. Please try again.");
            console.error("Error adding item to cart:", error);
        }
    }, [product, userId, navigateTo, dispatch, track]);

    const handleByNow = useCallback(async () => {
        // If product has variants, require selection on PDP
        if (Array.isArray(product?.variants) && product.variants.length > 0) {
            toast.error("Please select product options first.");
            navigateTo(`/product/${product?.slug}`);
            return;
        }
        const variantsForBackend = [];
        // If volume tiers exist, default to the first tier
        const firstTier = (product?.volumeTierEnabled && Array.isArray(product?.volumeTiers) && product.volumeTiers.length > 0)
            ? product.volumeTiers[0]
            : null;
        const basePrice = dodActive && product?.dodPrice != null
            ? Number(product.dodPrice)
            : (product?.salePrice ? product?.salePrice : product?.price);
        const priceToUse = (typeof firstTier?.price === 'number') ? firstTier.price : basePrice;
        const imageToUse = firstTier?.image ? getImageUrl(firstTier.image) : getImageUrl(product?.images && product?.images[0]);

        const cartItem = {
            cartItemId: product?._id,
            productId: product?._id,
            title: product?.title,
            price: priceToUse,
            image: imageToUse,
            count: 1,
            selectedVariants: variantsForBackend,
            freeShipping: product?.freeShipping,
            deliveryCharges: product?.freeShipping ? 0 : 250
        };

        try {
            // Combine with existing Redux cart and sync to backend
            const computeKey = (item) => item.cartItemId || `${item.productId}${Array.isArray(item.selectedVariants) && item.selectedVariants.length > 0 ? '|' + item.selectedVariants.map(v => `${v.name}:${Array.isArray(v.values) ? v.values.join(',') : v.values || ''}`).join('|') : ''}`;
            const existingItems = Array.isArray(currentCartItems) ? currentCartItems : [];
            const combined = [...existingItems];
            const idx = combined.findIndex(i => computeKey(i) === computeKey(cartItem));
            if (idx >= 0) {
                combined[idx] = { ...combined[idx], count: combined[idx].count + cartItem.count };
            } else {
                combined.push(cartItem);
            }

            dispatch(addToCart(cartItem));
            const cartPayload = {
                products: combined,
                deliveryCharges: combined.every(i => i.freeShipping) ? 0 : 250,
            };
            await addItemToCart(userId, cartPayload);
            // Meta Pixel InitiateCheckout event
            track('InitiateCheckout', {
                content_ids: [product._id],
                content_name: product.title,
                value: basePrice,
                currency: 'PKR'
            });
            // TikTok Pixel InitiateCheckout event
            trackTikTok('InitiateCheckout', {
                content_ids: [product._id],
                content_name: product.title,
                value: basePrice,
                currency: 'PKR'
            });
            navigateTo("/cart/checkout");
            toast.success("Proceeding to checkout!");
        } catch (error) {
            toast.error("Failed to proceed to checkout. Please try again.");
            console.error("Error during Buy Now:", error);
        }
    }, [product, dispatch, userId, navigateTo, currentCartItems, track]);

    const cardVariants = useMemo(() => allowMotion ? ({
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        hover: {
            scale: 1.02,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
    }) : ({ hidden: { opacity: 1 }, visible: { opacity: 1 } }), [allowMotion]);

    const imageVariants = useMemo(() => allowMotion ? ({
        initial: {
            scale: 1,
        },
        hover: {
            scale: 1.08,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for smooth Shopify-like effect
            }
        },
        exit: {
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
            }
        },
    }) : undefined, [allowMotion]);

    const renderStars = (rating) => {
        const stars = [];
        const maxStars = 5;
        const fullStars = Math.floor(rating);
        const fractionalPart = rating % 1;

        for (let i = 1; i <= fullStars; i++) {
            stars.push(
                <svg
                    key={`full-${i}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" />
                </svg>
            );
        }

        if (fractionalPart >= 0.5) {
            stars.push(
                <div key="half-star" className="relative w-4 h-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-yellow-500"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" fill="currentColor" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
                        <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" fill="none" stroke="currentColor" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
                    </svg>
                </div>
            );
        }

        const remainingStars = maxStars - fullStars - (fractionalPart >= 0.5 ? 1 : 0);
        for (let i = 1; i <= remainingStars; i++) {
            stars.push(
                <svg
                    key={`empty-${i}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                >
                    <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" />
                </svg>
            );
        }

        return stars;
    };

    // Memoize stars for given rating to avoid re-compute on unrelated re-renders
    const memoizedStars = useMemo(() => renderStars(averageRating || 0), [averageRating]);

    const getImageUrl = (img) => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object') return img.url || '';
        return '';
    };

    const getOptimizedImageUrl = (imageUrl) => {
        if (!imageUrl) return '';
        // Keep local assets as-is
        if (typeof imageUrl === 'string' && imageUrl.startsWith('/')) return imageUrl;
        const sep = imageUrl.includes('?') ? '&' : '?';
        return `${imageUrl}${sep}f_auto&q_auto&dpr=auto&w=${imageWidth}&h=${imageHeight}&c=fill`;
    };

    const getOptimizedSrcSet = (imageUrl) => {
        if (!imageUrl) return undefined;
        const base = getImageUrl(imageUrl);
        const sep = base.includes('?') ? '&' : '?';
        const url1x = `${base}${sep}f_auto&q_auto&dpr=auto&w=${imageWidth}&h=${imageHeight}&c=fill`;
        const url2x = `${base}${sep}f_auto&q_auto&dpr=auto&w=${imageWidth * 2}&h=${imageHeight * 2}&c=fill`;
        return `${url1x} ${imageWidth}w, ${url2x} ${imageWidth * 2}w`;
    };

    // Prefetch the hover image to make swap instant only when allowing motion (avoid bandwidth on touch)
    useEffect(() => {
        if (!allowMotion) return;
        if (Array.isArray(images) && images[1]) {
            const img = new Image();
            const url = getOptimizedImageUrl(getImageUrl(images[1]));
            img.src = url;
        }
    }, [images, allowMotion]);

    return (
        <motion.div
            className="group max-w-sm bg-white min-h-[250px] max-h-[300px] md:max-h-[350px] overflow-hidden rounded shadow-md mb-2 hover:shadow-lg transition-shadow duration-300 flex flex-col border-[0.1px] border-secondary items-stretch relative"
            variants={cardVariants}
            initial="visible"
            animate="visible"
            whileHover={allowMotion ? "hover" : undefined}
            onMouseEnter={allowMotion ? () => setIsHovered(true) : undefined}
            onMouseLeave={allowMotion ? () => setIsHovered(false) : undefined}
        >
            {/* Image container with hover buttons */}
            <div className="relative w-full mb-0 lg:mb-2 overflow-hidden">
                <Link to={`/product/${slug}`} className="block w-full">
                    {/* Square container to avoid horizontal gaps on mobile */}
                    <div
                        className="relative w-full overflow-hidden"
                        style={{
                            aspectRatio: '1 / 1',
                            height: 'auto'
                        }}
                    >
                        <motion.img
                            className="absolute inset-0 w-full rounded-t h-full object-cover transition-transform"
                            src={getOptimizedImageUrl(isHovered && images[1] ? getImageUrl(images[1]) : getImageUrl(images[0]))}
                            srcSet={getOptimizedSrcSet(isHovered && images[1] ? getImageUrl(images[1]) : getImageUrl(images[0]))}
                            sizes={`(max-width: 768px) 50vw, ${imageWidth}px`}
                            alt={images[0].alt}
                            loading="lazy"
                            decoding="async"
                            variants={imageVariants}
                            initial="initial"
                            whileHover={allowMotion ? "hover" : undefined}
                            style={{
                                transformOrigin: 'center center',
                                willChange: 'transform'
                            }}
                        />
                    </div>
                </Link>

                {/* Deal of the Day banner (replaces circular image badge) */}
                {dodActive && (
                    <div className="absolute top-3 left-1 z-20 transform -rotate-6 origin-top-left">
                        <div className="inline-flex flex-col items-center drop-shadow-md rounded-md overflow-hidden">
                            <div className="bg-gray-900 font-poppins text-[10px] md:text-xs text-white px-2 md:px-3 py-0.5 rounded-t-lg font-bold tracking-wide uppercase text-center">
                                Deal
                            </div>
                            <div className="bg-yellow-400 font-poppins text-[9px] md:text-[10px] text-black px-2 md:px-3 py-0.5 rounded-full font-semibold uppercase text-center">
                                Of the Day
                            </div>
                        </div>
                    </div>
                )}

                {/* Hover buttons - positioned at bottom of image container */}
                {allowMotion && (
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute bottom-0 left-0 right-0 hidden lg:flex justify-between gap-0 z-20"
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddToCart();
                                    }}
                                    className="flex-1 bg-primary/95 backdrop-blur-sm text-white font-semibold py-1 text-xs hover:bg-primary transition-colors duration-200  shadow-lg"
                                >
                                    Add To Cart
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleByNow();
                                    }}
                                    className="flex-1 bg-secondary/95 backdrop-blur-sm text-white font-semibold py-1 text-xs hover:bg-secondary transition-colors duration-200  shadow-lg"
                                >
                                    Buy Now
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Mobile action buttons - shown on all screen sizes below the content */}
            <div className="flex lg:hidden justify-between gap-0 mx-0 mb-1">
                <button onClick={handleAddToCart} className="flex-1 bg-primary/95 text-white font-semibold py-1 text-[10px] hover:bg-primary transition-colors duration-200 shadow-lg">
                    Add To Cart
                </button>
                <button onClick={handleByNow} className="flex-1 bg-secondary/95 text-white font-semibold py-1 text-[10px] hover:bg-secondary transition-colors duration-200 shadow-lg">
                    Buy Now
                </button>
            </div>

            {freeShipping && (
                <motion.span
                    className="absolute top-0 right-0 bg-secondary rounded-s-sm flex items-center gap-1 text-primary text-[10px] md:text-xs font-medium px-2 py-1 shadow-md will-change-transform"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <TbTruckDelivery size={14} /> Free Shipping
                </motion.span>
            )}


            <div className="justify-start mx-2 md:mt-0 mb-2 font-roboto">
                <Link to={`/product/${slug}`} className='text-black no-underline'>
                    <h2 className="mb-2 mt-1 md:mt-0 text-xs md:text-sm  font-medium">
                        {truncateTitle(title, 44)}
                    </h2>
                </Link>
                <div className="flex items-center gap-1 mb-1">
                    {/* <div className="flex items-center gap-1">
                        {memoizedStars}
                        {totalReviews > 0 && <span className="ml-2 text-sm font-bold text-primary">({totalReviews})</span>}
                    </div> */}
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="flex flex-col text-sm font-semibold text-primary/90 leading-snug">
                        {dodActive && product?.dodPrice != null ? (
                            <>
                                <span className="text-sm text-gray-500 line-through">Rs. {salePrice ?? price}</span>
                                <span className="text-base text-red-600">Rs. {Number(product.dodPrice)}</span>
                            </>
                        ) : salePrice ? (
                            <>
                                <span className="text-sm text-gray-500 line-through">Rs. {price}</span>
                                <span>Rs. {salePrice}</span>
                            </>
                        ) : (
                            <span>Rs. {price}</span>
                        )}
                    </p>
                    {off && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-200 rounded-full text-green-700 text-xs font-semibold whitespace-nowrap">
                            <svg
                                className="w-3 h-3 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {off}% Save
                        </span>
                    )}
                </div>
            </div>
            {/* Gradient underline on hover */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </motion.div>
    );
};

export default React.memo(ProductCard);
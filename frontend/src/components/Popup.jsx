import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { getActivePopup, trackPopupInteraction } from '../functions/popup';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { truncateTitle } from '../helpers/truncateTitle';

const Popup = () => {
    const [popup, setPopup] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [hasShown, setHasShown] = useState(false);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const popupShownRef = useRef(false);

    // Determine current page and user type
    const getCurrentPage = () => {
        const path = location.pathname;
        
        // Home page
        if (path === '/') return 'home';
        
        // Product pages
        if (path.startsWith('/product/')) return 'product';
        
        // Category pages
        if (path.startsWith('/category/')) return 'category';
        
        // Shop page
        if (path === '/shop') return 'shop';
        
        // Cart pages
        if (path === '/cart') return 'cart';
        if (path.startsWith('/cart/checkout')) return 'checkout';
        
        // Search page
        if (path === '/search') return 'search';
        
        // User pages
        if (path === '/order-history') return 'order-history';
        if (path === '/login') return 'login';
        if (path === '/signup') return 'signup';
        
        // Admin pages
        if (path.startsWith('/admin')) return 'admin';
        
        // Dynamic pages
        if (path.startsWith('/')) return 'dynamic-page';
        
        return 'other';
    };

    const getUserType = () => {
        return user ? 'registered' : 'guest';
    };

    useEffect(() => {
        // Only fetch popup if we haven't shown one yet on this page
        if (popupShownRef.current) {
            return;
        }

        const fetchPopup = async () => {
            try {
                setIsLoading(true);
                const currentPage = getCurrentPage();
                const userType = getUserType();
                
                // Quick check to hide popups on certain pages
                const hidePopupPages = ['checkout', 'admin'];
                if (hidePopupPages.includes(currentPage)) {
                    setIsLoading(false);
                    return;
                }
                
                const response = await getActivePopup(currentPage, userType);
                
                if (response.success && response.popup) {
                    setPopup(response.popup);
                    
                    // Show popup after delay
                    setTimeout(() => {
                        setIsVisible(true);
                        setHasShown(true);
                        popupShownRef.current = true;
                    }, response.popup.displaySettings?.delay || 3000);
                }
            } catch (error) {
                console.error('Error fetching popup:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPopup();
    }, []); // Remove dependencies to prevent re-fetching

    // Reset popup state when location changes significantly
    useEffect(() => {
        const currentPage = getCurrentPage();
        const hidePopupPages = ['checkout', 'admin'];
        
        if (hidePopupPages.includes(currentPage)) {
            setPopup(null);
            setIsVisible(false);
            setIsLoading(false);
            setHasShown(false);
            popupShownRef.current = false;
        }
    }, [location.pathname]);

    const handleClose = async () => {
        if (isClosing) return; // Prevent multiple calls
        
        setIsClosing(true);
        setIsVisible(false);
        setHasShown(true);
        popupShownRef.current = true;
        
        // Track dismissal in background (non-blocking)
        if (popup) {
            trackPopupInteraction(popup._id, 'dismissal').catch(error => {
                console.error('Error tracking dismissal:', error);
            });
        }
    };

    const handleShopNowClick = async () => {
        if (popup && !isButtonLoading) {
            try {
                setIsButtonLoading(true);
                // Track the click
                await trackPopupInteraction(popup._id, 'click');
                
                // Close the popup
                setIsVisible(false);
                setHasShown(true);
                popupShownRef.current = true;
                
                // Navigate to the product link
                if (popup.productLink) {
                    
                    // Check if it's an internal link (starts with /) or external
                    if (popup.productLink.startsWith('/')) {
                        // Internal navigation
                        navigate(popup.productLink);
                    } else if (popup.productLink.startsWith('http')) {
                        // External link - open in same tab
                        window.location.href = popup.productLink;
                    } else {
                        // Assume it's a relative path
                        navigate(popup.productLink);
                    }
                } else {
                    console.log('No product link provided');
                }
            } catch (error) {
                console.error('Error handling shop now click:', error);
                setIsButtonLoading(false);
            }
        }
    };

    const handleOverlayClick = (e) => {
        // console.log('Overlay clicked, target:', e.target, 'currentTarget:', e.currentTarget);
        // Only close if clicking the backdrop itself, not the popup content
        if (e.target === e.currentTarget) {
            // console.log('Closing popup via outside click');
            handleClose();
        }
    };

    const handleBackdropClick = (e) => {
        // console.log('Backdrop clicked directly');
        handleClose();
    };

    const handlePopupClick = (e) => {
        // console.log('Popup content clicked, stopping propagation');
        // Prevent clicks inside the popup from closing it
        e.stopPropagation();
    };

    if (isLoading || !popup || !isVisible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleOverlayClick}
            >
                {/* Backdrop - This is what should be clickable */}
                <motion.div
                    className="absolute inset-0 bg-black/60  backdrop-blur-sm cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleBackdropClick}
                />

                {/* Popup Content */}
             <div className='border-2 border-gray-100 p-2 z-[99999] relative'>
             <motion.div
                    className="relative bg-white shadow-2xl max-w-sm sm:max-w-lg w-full max-h-[80vh] overflow-hidden border border-gray-100"
                    initial={{ 
                        scale: 0.9, 
                        opacity: 0, 
                        y: 20
                    }}
                    animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        y: 0
                    }}
                    exit={{ 
                        scale: 0.9, 
                        opacity: 0, 
                        y: 20
                    }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                        duration: 0.3
                    }}
                    onClick={handlePopupClick}
                >
                    {/* Close Button - Positioned on the popup */}
                    <motion.button
                        onClick={handleClose}
                        className="absolute top-2 right-2 z-[99999] p-2 bg-black/80 hover:bg-black shadow-lg transition-all duration-200 border border-gray-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Close popup"
                    >
                        <IoClose className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Image */}
                    {popup.image && (
                        <div className="relative w-full h-48 sm:h-64 md:h-72 overflow-hidden">
                            <img
                                src={popup.image}
                                alt={popup.title}
                                className="w-full h-full object-cover object-center"
                                loading="lazy"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            {/* Gradient overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="px-4 py-2 sm:px-6 sm:py-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 leading-tight">
                            {popup.title}
                        </h3>
                        
                        <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                          {truncateTitle(popup.content, 100)}
                        </p>

                        {/* CTA Button */}
                        {popup.productLink && (
                            <motion.button
                                onClick={handleShopNowClick}
                                disabled={isButtonLoading}
                                className={`w-full bg-gradient-to-r from-primary to-primary/90 text-secondary font-semibold py-4 px-6 transition-all duration-300 transform shadow-lg border-0 ${
                                    isButtonLoading 
                                        ? 'opacity-75 cursor-not-allowed' 
                                        : 'hover:from-secondary hover:to-secondary/90 hover:text-primary hover:scale-105 hover:shadow-xl'
                                }`}
                                whileHover={!isButtonLoading ? { 
                                    scale: 1.02,
                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                                } : {}}
                                whileTap={!isButtonLoading ? { scale: 0.98 } : {}}
                            >
                                {isButtonLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading...</span>
                                    </div>
                                ) : (
                                    popup.buttonText || 'Shop Now'
                                )}
                            </motion.button>
                        )}
                    </div>

                    {/* Mobile-specific close hint */}
                    {/* <div className="px-5 sm:px-6 pb-4 text-center">
                        <p className="text-xs text-gray-400">
                            Tap outside to close
                        </p>
                    </div> */}
                </motion.div>
             </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Popup; 
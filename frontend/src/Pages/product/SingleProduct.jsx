import { AnimatePresence, motion } from "framer-motion";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaWhatsapp,
} from "react-icons/fa6";
import { LuAlarmClock } from "react-icons/lu";
import { TiShoppingCart } from "react-icons/ti";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReviewsDrawer from "../../components/reviews/ReviewsDrawer";
import RightEdgeTab from "../../components/reviews/RightEdgeTab";
import SpecificationsDrawer from "../../components/reviews/SpecificationsDrawer";
import FaqsDrawer from "../../components/reviews/FaqsDrawer";
import WriteReviewModal from "../../components/reviews/WriteReviewModal";
import SingleProductSkeleton from "../../components/skeletons/SingleProductSkeleton";
import { addItemToCart } from "../../functions/cart";
import { getProductBySlug, getRelatedProducts } from "../../functions/product";
import { recordProductView } from "../../functions/traffic";
import { getProductSchemaData } from "../../helpers/getProductSchema";
import { getProductFaqSchema } from "../../helpers/getProductFaqSchema";
import useFacebookPixel from "../../hooks/useFacebookPixel";
import useTikTokPixel from "../../hooks/useTikTokPixel";
import useWhatsAppTracking from "../../hooks/useWhatsAppTracking";
import { addToCart } from "../../store/cartSlice";

const LazyRelatedProducts = lazy(() =>
  import("../../components/RelatedProducts")
);
const LazyCartDrawer = lazy(() =>
  import("../../components/drawers/CartDrawer")
);

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

const getTotalVariantPrice = (product, selectedVariants) => {
  let total = 0;
  let hasVariantPrice = false;

  for (const [variantName, selectedValues] of Object.entries(
    selectedVariants
  )) {
    if (selectedValues && selectedValues.length > 0) {
      const variant = product.variants?.find((v) => v.name === variantName);
      if (variant) {
        for (const value of selectedValues) {
          const variantValue = variant.values?.find((v) => v.value === value);
          if (variantValue && typeof variantValue.price === "number") {
            total += variantValue.price;
            hasVariantPrice = true;
          }
        }
      }
    }
  }

  // If at least one variant has a price, return the sum, otherwise use product base price
  return hasVariantPrice ? total : product.salePrice || product.price;
};

const SingleProduct = () => {
  // All hooks here!
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const dispatch = useDispatch();
  const { slug } = useParams();
  const { search } = useLocation();
  const regionId = useMemo(() => {
    try {
      const q = new URLSearchParams(search);
      const v = q.get('region_id');
      return v && v.trim().length >= 2 ? v.trim() : null;
    } catch { return null; }
  }, [search]);
  const navigateTo = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const currentCartItems = useSelector((state) => state.cart.products);
  const { track } = useFacebookPixel();
  const { track: trackTikTok } = useTikTokPixel();
  const { trackWhatsAppAddToCart, trackWhatsAppOrder } = useWhatsAppTracking();

  // State management
  const [product, setProduct] = useState(null);
  // console.log("product---->", product)
  const [originalPrice, setOriginalPrice] = useState(0);
  const [productVariants, setProductVariants] = useState([]);
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previousImage, setPreviousImage] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  // const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [error, setError] = useState(null);
  const [hoveredVariantImage, setHoveredVariantImage] = useState(null);
  const [hoverPreviewPosition, setHoverPreviewPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const imageRef = useRef(null);
  const thumbnailRef = useRef(null);
  const [offerCountdown, setOfferCountdown] = useState("");
  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);
  const [selectedVariantValue, setSelectedVariantValue] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // Volume tier selection
  const [selectedTierIndex, setSelectedTierIndex] = useState(null);
  // Reviews UI
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [mobileTabsVisible, setMobileTabsVisible] = useState(false);
  const afterImageSentinelRef = useRef(null);
  const [openFaqs, setOpenFaqs] = useState(new Set());
  const [faqsOpen, setFaqsOpen] = useState(false);

  const getImageUrl = useCallback((img) => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object") return img.url || "";
    return "";
  }, []);

  const getImageAlt = useCallback((url) => {
    try {
      const imgs = product?.images || [];
      const found = imgs.find((img) => {
        const src = typeof img === 'string' ? img : (img?.url || '');
        return src === url;
      });
      if (found && typeof found === 'object' && found.alt) return found.alt;
    } catch { }
    return product?.title || 'Product Image';
  }, [product]);

  // Deal of the Day active helper for visuals & pricing
  // Active if flagged, has a DOD price, and the end time (if any) has not passed.
  const dodActive = useMemo(() => {
    if (!product?.isDod || product?.dodPrice == null) return false;
    const now = new Date();
    if (product.dodEnd && new Date(product.dodEnd) < now) return false;
    return true;
  }, [product?.isDod, product?.dodPrice, product?.dodEnd]);

  // Resolve alt for a variant image URL by scanning variant values
  const getVariantImageAlt = useCallback((url) => {
    if (!url || !product?.variants) return 'Variant Image';
    try {
      for (const v of product.variants) {
        for (const val of v.values || []) {
          const src = getImageUrl(val?.image);
          if (src && src === url) {
            return val?.alt || val?.value || 'Variant Image';
          }
        }
      }
    } catch { }
    return 'Variant Image';
  }, [product, getImageUrl]);

  useEffect(() => {
    if (product) {
      track("ViewContent", {
        content_ids: [product._id],
        content_name: product.title,
        value: product.salePrice ? product.salePrice : product.price,
        currency: "PKR",
      });
      
      // TikTok Pixel ViewContent
      trackTikTok("ViewContent", {
        content_ids: [product._id],
        content_name: product.title,
        value: product.salePrice ? product.salePrice : product.price,
        currency: "PKR",
      });
      
      // Record product view for analytics
      recordProductView(product._id);

      // Set initial image if not already set
      if (!selectedImage && product.images && product.images.length > 0) {
        const firstImage = getImageUrl(product.images[0]);
        setSelectedImage(firstImage);
      }
    }
  }, [product, selectedImage, getImageUrl]);

  // Show edge tabs on mobile after main image area is scrolled past
  useEffect(() => {
    const sentinel = afterImageSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Show tabs when we've SCROLLED PAST the gallery (i.e., sentinel is NOT visible)
        setMobileTabsVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [afterImageSentinelRef.current]);
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    // Resolve base price with regional override if present
    const regionalObj = regionId
      ? (
        product?.regionalPricing?.[regionId] ||
        product?.regionPricing?.[regionId] ||
        product?.regions?.[regionId] ||
        null
      )
      : null;
    const regionalPrice = regionalObj && typeof regionalObj.price === 'number'
      ? regionalObj.price
      : (regionalObj && typeof regionalObj.finalPrice === 'number'
        ? regionalObj.finalPrice
        : null);

    // If volume tiers are enabled and a tier is selected, show that tier's price
    if (
      product.volumeTierEnabled &&
      Array.isArray(product.volumeTiers) &&
      product.volumeTiers.length > 0
    ) {
      if (
        selectedTierIndex !== null &&
        product.volumeTiers[selectedTierIndex]
      ) {
        return (
          Number(product.volumeTiers[selectedTierIndex].price) ||
          product.salePrice ||
          product.price
        );
      }
    }

    let variantPriceSum = 0;
    let hasVariantPrice = false;

    for (const [variantName, selectedValues] of Object.entries(
      selectedVariants
    )) {
      if (selectedValues && selectedValues.length > 0) {
        const variant = product.variants?.find((v) => v.name === variantName);
        if (variant) {
          for (const value of selectedValues) {
            const variantValue = variant.values?.find((v) => v.value === value);
            if (variantValue && typeof variantValue.price === "number") {
              variantPriceSum += variantValue.price;
              hasVariantPrice = true;
            }
          }
        }
      }
    }

    // Base price: prefer regional, then salePrice, then price
    let base =
      (typeof regionalPrice === 'number' ? regionalPrice : null) ??
      product.salePrice ??
      product.price;

    // If any variant is selected and has a price, use the sum of variant prices; otherwise use base
    const priceBeforeDod = hasVariantPrice ? variantPriceSum : base;

    // Deal of the Day override (does not override volume tiers above)
    // Use the same rule as dodActive so timer and pricing stay in sync.
    if (dodActive && product.dodPrice != null) {
      return Number(product.dodPrice);
    }

    return priceBeforeDod;
  }, [selectedVariants, product, selectedTierIndex, regionId]);

  // Compute each tier's discount relative to the previous tier's price
  const tiersWithDiscount = useMemo(() => {
    if (!product?.volumeTierEnabled || !Array.isArray(product?.volumeTiers))
      return [];
    const tiers = product.volumeTiers || [];
    // Determine baseline as the unit price of the first tier
    const firstTier = tiers[0];
    const firstQty =
      typeof firstTier?.quantity === "number" && firstTier.quantity > 0
        ? firstTier.quantity
        : 1;
    const baseUnit =
      typeof firstTier?.price === "number" && firstTier.price > 0
        ? firstTier.price / firstQty
        : null;
    return tiers.map((tier, idx) => {
      const price = tier?.price;
      // Baseline previous price: how much it would cost if you bought `tier.quantity` using the first tier's unit price
      const qty =
        typeof tier?.quantity === "number" && tier.quantity > 0
          ? tier.quantity
          : 1;
      const prevPrice =
        idx > 0 && typeof baseUnit === "number"
          ? Math.round(baseUnit * qty)
          : null;
      let discountPercent = null;
      if (
        typeof prevPrice === "number" &&
        prevPrice > 0 &&
        typeof price === "number"
      ) {
        const diff = prevPrice - price;
        discountPercent = Math.round((diff / prevPrice) * 100);
        if (!isFinite(discountPercent)) discountPercent = null;
      }
      return { ...tier, discountPercent, prevPrice };
    });
  }, [product?.volumeTierEnabled, product?.volumeTiers]);

  // Calculate percentage off
  const percentageOff = useMemo(() => {
    if (!product || !product.salePrice || product.salePrice >= product.price)
      return 0;
    const discount =
      ((product.price - product.salePrice) / product.price) * 100;
    return Math.round(discount);
  }, [product]);

  // Animation variants
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut",
          when: "beforeChildren",
          staggerChildren: 0.1,
        },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
      },
    }),
    []
  );

  // Image handling
  const handleImageLoad = useCallback((url) => {
    setLoadedImages((prev) => new Set(prev).add(url));
  }, []);

  // Smooth image transition function
  const changeImageWithTransition = useCallback((newImageURL) => {
    if (newImageURL === selectedImage || !newImageURL) return;

    console.log('Transitioning from:', selectedImage, 'to:', newImageURL); // Debug log

    // Set previous image and start transition
    setPreviousImage(selectedImage);
    setIsTransitioning(true);

    // Preload new image if not already loaded
    if (!loadedImages.has(newImageURL)) {
      const img = new Image();
      img.src = newImageURL;
      img.onload = () => {
        handleImageLoad(newImageURL);
        setSelectedImage(newImageURL);

        // End transition after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousImage(null);
        }, 600);
      };
    } else {
      setSelectedImage(newImageURL);

      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousImage(null);
      }, 600);
    }
  }, [selectedImage, loadedImages, handleImageLoad]);

  const handleMouseEnterProduct = useCallback(
    (imageURL) => {
      changeImageWithTransition(imageURL);
    },
    [changeImageWithTransition]
  );

  const handleMouseMove = useCallback((e) => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight, width, height } = imageRef.current;
      const rect = imageRef.current.getBoundingClientRect();

      // Calculate mouse position relative to the image
      const mouseX = Math.max(0, Math.min(e.clientX - rect.left, width));
      const mouseY = Math.max(0, Math.min(e.clientY - rect.top, height));

      // Calculate percentage position within the image
      const xPercent = (mouseX / width) * 100;
      const yPercent = (mouseY / height) * 100;

      // Calculate background position (centered on cursor)
      const backgroundX = (xPercent / 100) * naturalWidth - 125;
      const backgroundY = (yPercent / 100) * naturalHeight - 125;

      // Ensure we don't go outside image bounds
      const boundedX = Math.max(0, Math.min(backgroundX, naturalWidth - 250));
      const boundedY = Math.max(0, Math.min(backgroundY, naturalHeight - 250));

      setZoomStyle({
        mouseX,
        mouseY,
        backgroundX: boundedX,
        backgroundY: boundedY,
        top: e.clientY - 125, // Adjust position based on cursor
        left: e.clientX - 125, // Adjust position based on cursor
        backgroundSize: `${naturalWidth}px ${naturalHeight}px`,
        display: "block", // Make sure the zoom lens is visible
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomStyle({}); // Hide the zoom lens
  }, []);

  const handleVariantImageMouseEnter = useCallback(
    (imageURL, e) => {
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }

      setHoveredVariantImage(imageURL);
      setHoverPreviewPosition({
        x: e.clientX + 20, // Offset 20px to the right of the cursor
        y: e.clientY + 20, // Offset 20px below the cursor
      });
    },
    [hoverTimeout]
  );

  const handleVariantImageMouseLeave = useCallback(() => {
    // Add a delay before hiding the preview
    const timeout = setTimeout(() => {
      setHoveredVariantImage(null);
      setHoverPreviewPosition({ x: 0, y: 0 }); // Reset position
    }, 300); // 300ms delay

    setHoverTimeout(timeout);
  }, []);

  const handlePreviewMouseEnter = useCallback(() => {
    // Clear the timeout when hovering over the preview
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [hoverTimeout]);

  const handlePreviewMouseLeave = useCallback(() => {
    // Add a delay before hiding the preview when leaving it
    const timeout = setTimeout(() => {
      setHoveredVariantImage(null);
      setHoverPreviewPosition({ x: 0, y: 0 });
    }, 200); // 200ms delay

    setHoverTimeout(timeout);
  }, []);

  const handleImagePreviewClick = useCallback(() => {
    if (hoveredVariantImage) {
      setModalImage(hoveredVariantImage);
      setShowImageModal(true);
    }
  }, [hoveredVariantImage]);

  // Add keyboard support for closing modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Restore scrolling
    };
  }, [showImageModal]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const scrollThumbnails = useCallback((direction) => {
    if (thumbnailRef.current) {
      const scrollAmount = 100; // Adjust scroll amount as needed
      thumbnailRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // Data fetching
  const fetchRelatedProducts = useCallback(async () => {
    try {
      const categoryId = product.categories?.length > 0
        ? product.categories[0]._id
        : product.category?._id;
      const response = await getRelatedProducts(
        categoryId,
        product._id
      );
      setRelatedProducts(response?.products);
      setCurrentPage(response?.currentPage);
      setTotalPages(response?.totalPages);
    } catch (error) {
      console.error("Error in fetching related products", error);
    }
  }, [product]);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductBySlug(slug, { regionId });
      setProduct(response?.product);
      setOriginalPrice(
        response?.product?.salePrice || response?.product?.price
      );
      setProductVariants(response?.product?.variants || []);

      // Preload all product images including variant images

      const allImages = new Set(
        [
          ...(response?.product?.images || []).map(getImageUrl),
          ...((response?.product?.variants || []).flatMap((variant) =>
            variant.values.map((val) => getImageUrl(val.image)).filter(Boolean)
          ) || []),
        ].filter(Boolean)
      );

      // Preload all images
      allImages.forEach((img) => {
        const image = new Image();
        image.src = img;
        image.onload = () => handleImageLoad(img);
      });

      // Set initial selected image
      if (
        response?.product?.volumeTierEnabled &&
        Array.isArray(response?.product?.volumeTiers) &&
        response?.product?.volumeTiers.length > 0
      ) {
        // Default select first tier
        setSelectedTierIndex(0);
        const firstTier = response.product.volumeTiers[0];
        if (firstTier?.image) {
          setSelectedImage(
            getImageUrl(firstTier.image) ||
            getImageUrl(response.product.images?.[0])
          );
        } else if (response?.product?.images?.length) {
          setSelectedImage(getImageUrl(response.product.images[0]));
        }
      } else if (response?.product?.images?.length) {
        setSelectedImage(getImageUrl(response.product.images[0]));
      }
      // Clear any potential initial variant selections on product load
      setSelectedVariants({});

      // setLoading(false); // Removed from here
    } catch (error) {
      console.error("Error in fetching product", error);
      // setLoading(false); // Removed from here
      setError("Failed to load product data."); // Add error state setting
    } finally {
      // Ensure loading is false after fetch attempt (success or failure)
      setLoading(false);
    }
  }, [slug, regionId, handleImageLoad]);

  // Effects
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product?.categories?.length > 0 || product?.category?._id) {
      fetchRelatedProducts();
    }
  }, [product, fetchRelatedProducts]);

  // Effect to update selected image based on selected variants
  useEffect(() => {
    let imageToSet = getImageUrl(product?.images?.[0]); // Default to first main image

    // If a volume tier is selected and it has an image, prioritize it
    if (
      product?.volumeTierEnabled &&
      Array.isArray(product?.volumeTiers) &&
      selectedTierIndex !== null &&
      product.volumeTiers[selectedTierIndex]?.image
    ) {
      imageToSet = getImageUrl(product.volumeTiers[selectedTierIndex].image);
    } else {
      // Otherwise, look for an image from selected variant values
      // Look for an image associated with the *first* selected variant value found across all selected variants
      // This logic might need refinement depending on desired image behavior with multiple variant selections.
      outerLoop: for (const [variantName, selectedValues] of Object.entries(
        selectedVariants
      )) {
        if (selectedValues && selectedValues.length > 0) {
          const variant = product.variants?.find((v) => v.name === variantName);
          if (variant) {
            for (const selectedValue of selectedValues) {
              const variantValue = variant.values?.find(
                (val) => val.value === selectedValue
              );
              if (variantValue?.image) {
                imageToSet = getImageUrl(variantValue.image);
                break outerLoop; // Use the first variant image found across any selected value and stop
              }
            }
          }
        }
      }
    }

    // Only update if the image is different from the current one to prevent unnecessary re-renders
    if (selectedImage !== imageToSet) {
      setSelectedImage(imageToSet);
    } else {
      // console.log("useEffect: selectedImage is already set to:", selectedImage);
    }
  }, [
    selectedVariants,
    product?.images,
    product?.variants,
    product?.volumeTierEnabled,
    product?.volumeTiers,
    selectedTierIndex,
  ]);

  useEffect(() => {
    // Unified countdown: Deal of the Day takes priority over Special Offer.
    if (!product) {
      setOfferCountdown("");
      return;
    }

    // Helper for a simple now -> end countdown (used for DOD)
    const setupCountdownToEnd = (endRaw) => {
      if (!endRaw) {
        setOfferCountdown("");
        return undefined;
      }
      const end = new Date(endRaw);
      if (Number.isNaN(end.getTime())) {
        setOfferCountdown("");
        return undefined;
      }

      const interval = setInterval(() => {
        const nowInner = new Date();
        const diff = end - nowInner;
        if (diff <= 0) {
          // Time is over: clear countdown so UI hides
          setOfferCountdown("");
          clearInterval(interval);
        } else {
          const totalSeconds = Math.floor(diff / 1000);
          const days = Math.floor(totalSeconds / (60 * 60 * 24));
          const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
          const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
          const seconds = totalSeconds % 60;
          const pad = (n) => String(n).padStart(2, '0');
          setOfferCountdown(`${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        }
      }, 1000);
      return interval;
    };

    // Helper for start/end window (used for special offer)
    const setupCountdownWindow = (startRaw, endRaw) => {
      if (!startRaw || !endRaw) {
        setOfferCountdown("");
        return undefined;
      }
      const start = new Date(startRaw);
      const end = new Date(endRaw);
      const now = new Date();

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setOfferCountdown("");
        return undefined;
      }

      if (now >= start && now <= end) {
        const interval = setInterval(() => {
          const nowInner = new Date();
          const diff = end - nowInner;
          if (diff <= 0) {
            // Time is over: clear countdown so UI hides
            setOfferCountdown("");
            clearInterval(interval);
          } else {
            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / (60 * 60 * 24));
            const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
            const seconds = totalSeconds % 60;
            const pad = (n) => String(n).padStart(2, '0');
            setOfferCountdown(`${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
          }
        }, 1000);
        return interval;
      }

      // Outside active window: hide countdown
      setOfferCountdown("");
      return undefined;
    };

    let intervalId;

    // 1) Deal of the Day: only end time is required, takes priority
    if (product.isDod && product.dodEnd) {
      intervalId = setupCountdownToEnd(product.dodEnd);
    }
    // 2) Otherwise fall back to special offer countdown (start/end window)
    else if (
      product.specialOfferEnabled &&
      product.specialOfferStart &&
      product.specialOfferEnd
    ) {
      intervalId = setupCountdownWindow(
        product.specialOfferStart,
        product.specialOfferEnd
      );
    } else {
      setOfferCountdown("");
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    product?.isDod,
    product?.dodEnd,
    product?.specialOfferEnabled,
    product?.specialOfferStart,
    product?.specialOfferEnd,
  ]);

  // Variant and cart handlers
  const handleVariantChange = useCallback((variantName, value) => {
    setSelectedVariants((prev) => {
      const currentValues = prev[variantName] || [];
      if (currentValues.includes(value)) {
        // Deselect value
        return {
          ...prev,
          [variantName]: currentValues.filter((v) => v !== value),
        };
      } else {
        // Select value (add to array)
        return {
          ...prev,
          [variantName]: [...currentValues, value],
        };
      }
    });
  }, []);

  const prepareVariantsForBackend = useCallback(() => {
    // Transforms { Color: ['Red', 'Blue'], Size: ['M'] }
    // into [{ name: 'Color', values: ['Red', 'Blue'] }, { name: 'Size', values: ['M'] }]
    return Object.entries(selectedVariants)
      .filter(([variantName, values]) => values && values.length > 0) // Only include variants with selected values
      .map(([variantName, values]) => ({
        name: variantName,
        values: values || [], // Ensure values is an array
      }));
  }, [selectedVariants]);

  const generateCombinations = useCallback((variants) => {
    if (variants.length === 0) {
      return [[]];
    }
    const firstVariant = variants[0];
    const restVariants = variants.slice(1);
    const combinations = [];
    const firstVariantValues = firstVariant.values;

    for (const value of firstVariantValues) {
      const restCombinations = generateCombinations(restVariants);
      for (const restCombination of restCombinations) {
        combinations.push([
          { name: firstVariant.name, values: [value] },
          ...restCombination,
        ]);
      }
    }
    return combinations;
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Check if product has variants and no variants are selected
    if (productVariants && productVariants.length > 0) {
      const hasSelectedVariants = Object.values(selectedVariants).some(
        (values) => values && values.length > 0
      );
      if (!hasSelectedVariants) {
        toast.error(
          "Please select at least one variant before adding to cart!"
        );
        return;
      }
    }

    // If volume tiers are enabled, ensure a tier is selected
    if (product?.volumeTierEnabled) {
      if (
        selectedTierIndex === null ||
        !product?.volumeTiers?.[selectedTierIndex]
      ) {
        toast.error("Please select a volume offer before adding to cart!");
        return;
      }
    }

    let cartItemsToAdd = [];

    Object.entries(selectedVariants).forEach(([variantName, values]) => {
      const variant = productVariants.find((v) => v.name === variantName);
      values.forEach((value) => {
        let price = product.salePrice ?? product.price;
        let image = getImageUrl(product?.images?.[0]);
        let variantValue;
        if (variant) {
          variantValue = variant.values.find((v) => v.value === value);
          if (variantValue && typeof variantValue.price === "number") {
            price = variantValue.price;
          }
          if (variantValue && variantValue.image) {
            image = getImageUrl(variantValue.image);
          }
        }
        // Override with selected tier details if enabled
        if (
          product?.volumeTierEnabled &&
          selectedTierIndex !== null &&
          product?.volumeTiers?.[selectedTierIndex]
        ) {
          const tier = product.volumeTiers[selectedTierIndex];
          if (typeof tier.price === "number") price = tier.price;
          if (tier.image) image = getImageUrl(tier.image);
        }
        // Generate unique cartItemId
        const cartItemId = [product?._id, `${variantName}:${value}`].join("|");
        const cartItem = {
          cartItemId,
          productId: product?._id,
          title: product?.title,
          price,
          image,
          count: selectedQuantity,
          selectedVariants: [{ name: variantName, values: [value] }],
          freeShipping: product?.freeShipping,
          deliveryCharges: product?.freeShipping ? 0 : 250,
          // annotate selected tier for reference
          ...(product?.volumeTierEnabled && selectedTierIndex !== null
            ? { selectedTier: product.volumeTiers[selectedTierIndex] }
            : {}),
        };
        cartItemsToAdd.push(cartItem);
      });
    });

    if (cartItemsToAdd.length === 0) {
      // If no variants selected, add the base product
      let price = Number(
        product?.volumeTierEnabled &&
          selectedTierIndex !== null &&
          product?.volumeTiers?.[selectedTierIndex]?.price != null
          ? product.volumeTiers[selectedTierIndex].price
          : currentPrice ?? product.salePrice ?? product.price
      );
      let image = getImageUrl(product?.images?.[0]);
      if (
        product?.volumeTierEnabled &&
        selectedTierIndex !== null &&
        product?.volumeTiers?.[selectedTierIndex]
      ) {
        const tier = product.volumeTiers[selectedTierIndex];
        if (tier.image) image = getImageUrl(tier.image);
      }
      cartItemsToAdd.push({
        cartItemId: product?._id,
        productId: product?._id,
        title: product?.title,
        price,
        image,
        count: selectedQuantity,
        selectedVariants: [],
        freeShipping: product?.freeShipping,
        deliveryCharges: product?.freeShipping ? 0 : 250,
        ...(product?.volumeTierEnabled && selectedTierIndex !== null
          ? { selectedTier: product.volumeTiers[selectedTierIndex] }
          : {}),
      });
    }

    cartItemsToAdd.forEach((cartItem) => {
      dispatch(addToCart(cartItem));
    });

    toast.success(`${cartItemsToAdd.length} item(s) added to cart!`);
    setIsDrawerOpen(true);

    // Facebook Pixel tracking
    track("AddToCart", {
      content_ids: [product._id],
      content_name: product.title,
      value: product.salePrice ? product.salePrice : product.price,
      currency: "PKR",
    });
    trackTikTok("AddToCart", {
      content_ids: [product._id],
      content_name: product.title,
      value: product.salePrice ? product.salePrice : product.price,
      currency: "PKR",
    });

    // WhatsApp tracking for add to cart
    trackWhatsAppAddToCart({
      _id: product._id,
      title: product.title,
      price: product.salePrice ? product.salePrice : product.price,
    });
  }, [
    selectedVariants,
    product,
    productVariants,
    dispatch,
    setIsDrawerOpen,
    selectedQuantity,
    currentPrice,
    track,
    trackWhatsAppAddToCart,
  ]);

  const handleByNow = useCallback(async () => {
    // Check if product has variants and no variants are selected
    if (productVariants && productVariants.length > 0) {
      const hasSelectedVariants = Object.values(selectedVariants).some(
        (values) => values && values.length > 0
      );
      if (!hasSelectedVariants) {
        toast.error(
          "Please select at least one variant before proceeding to checkout!"
        );
        return;
      }
    }

    // If volume tiers are enabled, ensure a tier is selected
    if (product?.volumeTierEnabled) {
      if (
        selectedTierIndex === null ||
        !product?.volumeTiers?.[selectedTierIndex]
      ) {
        toast.error(
          "Please select a volume offer before proceeding to checkout!"
        );
        return;
      }
    }

    // Prepare cart items for each selected variant value
    try {
      console.log("[BuyNow] State before building items:", {
        selectedTierIndex,
        selectedTier: product?.volumeTiers?.[selectedTierIndex] || null,
        currentPrice,
        tierPrice: product?.volumeTiers?.[selectedTierIndex]?.price ?? null,
      });
    } catch { }
    let cartItemsToAdd = [];
    Object.entries(selectedVariants).forEach(([variantName, values]) => {
      const variant = productVariants.find((v) => v.name === variantName);
      values.forEach((value) => {
        // Per-item price logic:
        // - If a tier is selected, use the tier bundle price
        // - Else, if this variant value has its own price, use it
        // - Else, use product base/sale price
        let price = Number(product.salePrice ?? product.price);
        let image = getImageUrl(product?.images?.[0]);
        let variantValue;
        if (variant) {
          variantValue = variant.values.find((v) => v.value === value);
          if (variantValue && typeof variantValue.price === "number") {
            price = variantValue.price;
          }
          if (variantValue && variantValue.image) {
            image = getImageUrl(variantValue.image);
          }
        }
        // If a tier is selected, it overrides price (and maybe image)
        if (
          product?.volumeTierEnabled &&
          selectedTierIndex !== null &&
          product?.volumeTiers?.[selectedTierIndex]
        ) {
          const tier = product.volumeTiers[selectedTierIndex];
          if (typeof tier.price === "number") price = tier.price;
          if (tier.image) image = getImageUrl(tier.image);
        }
        // Generate unique cartItemId
        const cartItemId = [product?._id, `${variantName}:${value}`].join("|");
        const cartItem = {
          cartItemId,
          productId: product?._id,
          title: product?.title,
          price,
          image,
          count: selectedQuantity,
          selectedVariants: [{ name: variantName, values: [value] }],
          freeShipping: product?.freeShipping,
          deliveryCharges: product?.freeShipping ? 0 : 250,
          ...(product?.volumeTierEnabled && selectedTierIndex !== null
            ? { selectedTier: product.volumeTiers[selectedTierIndex] }
            : {}),
        };
        cartItemsToAdd.push(cartItem);
      });
    });
    if (cartItemsToAdd.length === 0) {
      // If no variants selected, add the base product
      let price = product.salePrice ?? product.price;
      let image = getImageUrl(product?.images?.[0]);
      if (
        product?.volumeTierEnabled &&
        selectedTierIndex !== null &&
        product?.volumeTiers?.[selectedTierIndex]
      ) {
        const tier = product.volumeTiers[selectedTierIndex];
        if (typeof tier.price === "number") price = tier.price;
        if (tier.image) image = getImageUrl(tier.image);
      }
      cartItemsToAdd.push({
        cartItemId: product?._id,
        productId: product?._id,
        title: product?.title,
        price,
        image,
        count: selectedQuantity,
        selectedVariants: [],
        freeShipping: product?.freeShipping,
        deliveryCharges: product?.freeShipping ? 0 : 250,
        ...(product?.volumeTierEnabled && selectedTierIndex !== null
          ? { selectedTier: product.volumeTiers[selectedTierIndex] }
          : {}),
      });
    }
    try {
      if (userId) {
        // For logged-in users, send all items in one API call
        const cartPayload = {
          products: cartItemsToAdd,
          deliveryCharges: cartItemsToAdd.every((i) => i.freeShipping)
            ? 0
            : 250,
        };
        // Debug: Inspect Buy Now payload
        try {
          console.log("[BuyNow] Sending cart payload:", {
            products: cartPayload.products.map((p) => ({
              productId: p.productId,
              title: p.title,
              price: p.price,
              count: p.count,
              image: p.image,
            })),
            deliveryCharges: cartPayload.deliveryCharges,
          });
        } catch { }
        await addItemToCart(userId, cartPayload);
        // Debug: after API call
        try {
          console.log("[BuyNow] addItemToCart completed");
        } catch { }
        cartItemsToAdd.forEach((cartItem) => dispatch(addToCart(cartItem)));
        track("AddToCart", {
          content_ids: [product._id],
          content_name: product.title,
          value: product.salePrice ? product.salePrice : product.price,
          currency: "PKR",
        });
        trackTikTok("AddToCart", {
          content_ids: [product._id],
          content_name: product.title,
          value: product.salePrice ? product.salePrice : product.price,
          currency: "PKR",
        });
        toast.success("Proceeding to checkout...");
        navigateTo("/cart/checkout");
      } else {
        // For guest users, just add all to Redux
        cartItemsToAdd.forEach((cartItem) => dispatch(addToCart(cartItem)));
        track("AddToCart", {
          content_ids: [product._id],
          content_name: product.title,
          value: product.salePrice ? product.salePrice : product.price,
          currency: "PKR",
        });
        trackTikTok("AddToCart", {
          content_ids: [product._id],
          content_name: product.title,
          value: product.salePrice ? product.salePrice : product.price,
          currency: "PKR",
        });
        toast.success("Proceeding to checkout...");
        navigateTo("/cart/checkout");
      }
    } catch (error) {
      toast.error("Failed to proceed to checkout. Please try again.");
      console.error("Error during Buy Now:", error);
    }
  }, [
    selectedVariants,
    product,
    productVariants,
    selectedQuantity,
    selectedTierIndex,
    currentPrice,
    dispatch,
    userId,
    navigateTo,
    track,
  ]);

  const handleQuantityChange = useCallback(
    (operation) => {
      setSelectedQuantity((prev) =>
        operation === "increase"
          ? Math.min(prev + 1, product?.stock || Infinity)
          : Math.max(1, prev - 1)
      );
    },
    [product?.stock]
  );

  // const toggleDescription = useCallback(() => {
  //   setShowFullDescription(!showFullDescription);
  // }, [showFullDescription]);

  const handleWhatsAppOrder = useCallback(() => {
    // Check if product has variants and no variants are selected
    if (productVariants && productVariants.length > 0) {
      const hasSelectedVariants = Object.values(selectedVariants).some(
        (values) => values && values.length > 0
      );
      if (!hasSelectedVariants) {
        toast.error(
          "Please select at least one variant before ordering via WhatsApp!"
        );
        return;
      }
    }

    // If volume tiers are enabled, ensure a tier is selected
    if (product?.volumeTierEnabled) {
      if (
        selectedTierIndex === null ||
        !product?.volumeTiers?.[selectedTierIndex]
      ) {
        toast.error(
          "Please select a volume offer before ordering via WhatsApp!"
        );
        return;
      }
    }

    const phoneNumber = "923071111832";
    const productLink = window.location.href;
    let imageLink = getImageUrl(product?.images?.[0]);
    if (
      product?.volumeTierEnabled &&
      selectedTierIndex !== null &&
      product?.volumeTiers?.[selectedTierIndex]?.image
    ) {
      imageLink = getImageUrl(product.volumeTiers[selectedTierIndex].image);
    }

    // Format selected variants
    let variantsText = "";
    if (productVariants && Object.keys(selectedVariants).length > 0) {
      variantsText = Object.entries(selectedVariants)
        .filter(([_, values]) => values && values.length > 0)
        .map(([name, values]) => `*${name}:* ${values.join(", ")}`)
        .join("\n");
      if (variantsText)
        variantsText = `\n*Selected Variants:*\n${variantsText}`;
    }

    const message = `*🛒 New Order Request*\n\n*Product:* ${product?.title}\n*Price:* Rs ${currentPrice}\n*Image:* ${imageLink}\n*View Product:* ${productLink}${variantsText}\n\nThank you!`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");

    // Facebook Pixel tracking - StartConversation event
    track("StartConversation", {
      content_ids: [product._id],
      content_name: product.title,
      content_category: 'Product Inquiry',
      source: 'product_page_whatsapp_button',
      value: product.salePrice ? product.salePrice : product.price,
      currency: "PKR",
    });

    // TikTok Pixel tracking - StartConversation event
    trackTikTok("StartConversation", {
      content_ids: [product._id],
      content_name: product.title,
      value: product.salePrice ? product.salePrice : product.price,
      currency: "PKR",
    });

    // WhatsApp tracking for order
    trackWhatsAppOrder({
      _id: product._id,
      title: product.title,
      price: currentPrice,
    });
  }, [
    product,
    currentPrice,
    selectedVariants,
    productVariants,
    trackWhatsAppOrder,
    track,
  ]);

  // Memoize schema data to prevent duplicate generation
  const schemaData = useMemo(() => {
    return getProductSchemaData(product, currentPrice);
  }, [product, currentPrice]);

  const faqSchema = useMemo(() => {
    return getProductFaqSchema(product);
  }, [product]);

  // Now do early returns
  if (loading) return <SingleProductSkeleton />;
  if (!product)
    return <div className="py-20 text-center">Product not found!</div>;
  if (!schemaData) return null;

  return (
    <div className="px-4 pt-1 max-w-screen md:px-8 lg:px-8 md:pt-3">
      <Helmet>
        <title>
          {product.title
            ? `${product.title} | Etimad Mart`
            : "Product | Etimad Mart"}
        </title>
        <meta
          name="description"
          content={product.metaDescription || product.description || ""}
        />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product?.title || "Product"} />
        <meta
          property="og:description"
          content={product?.description?.substring(0, 160) || ""}
        />
        <meta
          property="og:image"
          content={
            getImageUrl(product?.images?.[0]) ||
            selectedImage ||
            "default-image.jpg"
          }
        />
        <meta property="og:url" content={window.location.href} />

        {/* Product-specific meta tags for currency */}
        <meta property="product:price:amount" content={currentPrice || product.price} />
        <meta property="product:price:currency" content="PKR" />
        <meta property="og:price:amount" content={currentPrice || product.price} />
        <meta property="og:price:currency" content="PKR" />
        <meta property="og:locale" content="en_PK" />
        <meta property="og:availability" content={product.stock > 0 ? "instock" : "out of stock"} />

        <meta
          name="twitter:image"
          content={
            getImageUrl(product?.images?.[0]) ||
            selectedImage ||
            "default-image.jpg"
          }
        />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Product Images */}
        <div className="flex flex-col w-full lg:w-1/2 lg:flex-row">
          {/* Main Image */}
          <div className="relative flex-1 order-1 mt-4 lg:order-2 lg:mt-3 ">
            <div
              className="overflow-hidden aspect-square w-full max-w-[340px] md:max-w-[400px] border border-red-100 mx-0 md:mx-auto lg:mx-9 xl:mx-auto relative bg-gray-100"
              onMouseMove={isLargeScreen ? handleMouseMove : undefined}
              onMouseLeave={isLargeScreen ? handleMouseLeave : undefined}
            >
              {/* Previous image for crossfade effect */}
              {previousImage && isTransitioning && (
                <div
                  className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-out"
                  style={{
                    zIndex: 1,
                    opacity: 0
                  }}
                >
                  <img
                    src={previousImage}
                    alt={getImageAlt(previousImage)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Current main image */}
              <div
                className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-out"
                style={{
                  zIndex: 2,
                  opacity: loadedImages.has(selectedImage) && selectedImage ? 1 : 0
                }}
              >
                <img
                  ref={imageRef}
                  src={selectedImage || "https://via.placeholder.com/500"}
                  alt={getImageAlt(selectedImage)}
                  width="1000"
                  height="1000"
                  className="w-full h-full object-cover cursor-pointer"
                  onLoad={() => handleImageLoad(selectedImage)}
                />
              </div>

              {/* Loading placeholder */}
              {!loadedImages.has(selectedImage) && selectedImage && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center" style={{ zIndex: 3 }}>
                  <span className="text-gray-500 text-sm">Loading...</span>
                </div>
              )}
              {isLargeScreen && zoomStyle.backgroundX !== undefined && (
                <div
                  style={{
                    position: "fixed",
                    border: "1px solid #ccc",
                    borderRadius: "50%",
                    width: "280px",
                    height: "280px",
                    zIndex: 2000,
                    backgroundImage: `url(${selectedImage || "https://via.placeholder.com/500"
                      })`,
                    backgroundSize: `${zoomStyle.backgroundSize || "auto"}`,
                    backgroundPosition: `-${zoomStyle.backgroundX}px -${zoomStyle.backgroundY}px`,
                    pointerEvents: "none",
                    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)",
                    backgroundColor: "white",
                    display: "block",
                    top: `${zoomStyle.top}px`,
                    left: `${zoomStyle.left}px`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Thumbnail List */}
          <div className="relative flex flex-row items-center order-2 mt-8 lg:w-20 lg:order-1 max-h-80 lg:flex-col">
            <button
              onClick={() => scrollThumbnails("up")}
              className="absolute top-0 hidden font-extrabold transform -translate-x-1/2 lg:block left-1/2 bg-none text-secondary "
            >
              <FaChevronUp strokeWidth={24} />
            </button>
            <button
              onClick={() => scrollThumbnails("down")}
              className="absolute bottom-0 hidden font-extrabold transform -translate-x-1/2 lg:block left-1/2 bg-none text-secondary "
            >
              <FaChevronDown strokeWidth={24} />
            </button>
            <div
              ref={thumbnailRef}
              className="relative flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto whitespace-nowrap scrollbar-hide max-h-[300px] py-2 lg:py-6 z-10"
            >
              {product?.images?.map((image, index) => (
                <div
                  key={index}
                  className={`h-16 w-16 bg-slate-200 rounded p-1 cursor-pointer flex-shrink-0 ${selectedImage === getImageUrl(image)
                    ? "border-2 border-primary"
                    : "border-none"
                    }`}
                  onMouseEnter={() =>
                    handleMouseEnterProduct(getImageUrl(image))
                  }
                  onClick={() => {
                    // console.log("Thumbnail clicked:", image);
                    let isVariantImage = false;
                    for (const variant of product?.variants || []) {
                      const variantValue = variant.values?.find(
                        (val) => getImageUrl(val.image) === getImageUrl(image)
                      );
                      if (variantValue) {
                        handleVariantChange(variant.name, variantValue.value);
                        isVariantImage = true;
                        break;
                      }
                    }
                    if (!isVariantImage) {
                      changeImageWithTransition(getImageUrl(image));
                    }
                  }}
                >
                  <img
                    src={getImageUrl(image)}
                    className="object-cover w-full h-full rounded"
                    loading="lazy"
                    alt={`Thumbnail ${index}`}
                    width="64"
                    height="64"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Details Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-[20px] md:text-[24px]  font-space mt-2 md:mt-4 font-semibold text-secondary capitalize mb-[2px] w-[320px] md:w-[720px] lg:w-[630px] break-words whitespace-normal"
            variants={itemVariants}
          >
            {product?.title || "Product Title"}
          </motion.h1>

          {/* Reviews section after title: stars + average + count */}
          <motion.div
            className="flex items-center gap-2 bg-none px-3 py-1 rounded-full w-fit mt-2"
            variants={itemVariants}
          >
            {(() => {
              const rating = product?.averageRating || 0;
              const maxStars = 5;
              const fullStars = Math.floor(rating);
              const fractionalPart = rating % 1;
              const stars = [];
              for (let i = 1; i <= fullStars; i++) {
                stars.push(
                  <svg
                    key={`full-${i}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" />
                  </svg>
                );
              }
              if (fractionalPart >= 0.5) {
                stars.push(
                  <svg
                    key="half-star"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 text-yellow-400"
                    viewBox="0 0 20 20"
                  >
                    <defs>
                      <linearGradient id="half-gradient">
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="50%" stopColor="#e5e7eb" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z"
                      fill="url(#half-gradient)"
                    />
                  </svg>
                );
              }
              const remainingStars =
                maxStars - fullStars - (fractionalPart >= 0.5 ? 1 : 0);
              for (let i = 1; i <= remainingStars; i++) {
                stars.push(
                  <svg
                    key={`empty-${i}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-300"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                  >
                    <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" />
                  </svg>
                );
              }
              return stars;
            })()}
            <span className="ml-1 text-base font-semibold text-gray-700">
              {(product?.averageRating || 0).toFixed(1)}
            </span>
            <span className="text-base font-bold text-gray-400">|</span>
            <span className="text-base font-bold text-gray-700">
              ({product?.reviews?.length || 0})
            </span>
          </motion.div>

          {/* Mobile Price Block */}
          <motion.div
            className="mb-3 mt-2 flex flex-wrap items-center gap-3 text-xl font-semibold md:text-2xl font-poppins lg:hidden"
            variants={itemVariants}
          >
            {product.salePrice && currentPrice === originalPrice ? (
              <>
                <span className="text-base text-gray-500 line-through decoration-1">
                  Rs. {product.price}
                </span>
                <span className="ml-2 text-primary">Rs. {currentPrice}</span>
              </>
            ) : (
              <span>Rs. {currentPrice}</span>
            )}

            {product?.freeShipping && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-green-700 text-xs md:text-sm font-semibold">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M3 13V7a2 2 0 012-2h11a2 2 0 012 2v6m-1 4h2a2 2 0 002-2v-5a2 2 0 00-2-2h-2m-2 7a2 2 0 11-4 0 2 2 0 014 0zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Free Shipping
              </span>
            )}

            {percentageOff > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-green-700 text-xs md:text-sm font-semibold">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {percentageOff}% Save
              </span>
            )}
          </motion.div>

          {/* Mobile Variant Images Row (after price, before description) */}
          {productVariants && productVariants.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2 mb-1 lg:hidden">
              {productVariants.map((variant, vIdx) =>
                variant.values.map(
                  (val, idx) =>
                    idx === 0 && (
                      <div
                        key={val.value}
                        className="relative flex flex-col items-center cursor-pointer"
                        onClick={() => {
                          setActiveVariant(variant);
                          setVariantDrawerOpen(true);
                        }}
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                          <img
                            src={val.image || "https://via.placeholder.com/50"}
                            className="w-full h-full object-cover"
                            alt={val.alt || val.value}
                          />
                        </div>
                        <span className="mt-2 inline-block bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          {variant.name}
                        </span>
                        {/* <span className="mt-1 text-xs font-semibold">
                        Rs. {val.price ?? product.price}
                      </span> */}
                      </div>
                    )
                )
              )}
            </div>
          )}

          {/* Mobile Quantity Selector (after variants, before description) */}
          {product?.stock && (
            <motion.div
              className="flex items-center gap-4 mb-3 lg:hidden"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => handleQuantityChange("decrease")}
                disabled={selectedQuantity === 1}
                aria-label="Decrease quantity"
                className={`p-1 text-primary rounded-full text-2xl w-8 h-8 flex items-center justify-center ${selectedQuantity === 1
                  ? "bg-gray-300"
                  : "bg-secondary opacity-70"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                -
              </motion.button>
              <span className="text-xl">{selectedQuantity}</span>
              <motion.button
                onClick={() => handleQuantityChange("increase")}
                aria-label="Increase quantity"
                disabled={selectedQuantity === product.stock}
                className={`p-1 text-primary rounded-full text-2xl w-8 h-8 flex items-center justify-center ${selectedQuantity === product.stock
                  ? "bg-gray-300"
                  : "bg-secondary opacity-70"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
            </motion.div>
          )}

          {/* Deal of the Day / Special Offer Timer - Mobile (after quantity selector) */}
          {(() => {
            // Decide which timer label to show based on active promotion
            const hasDodTimer = product?.isDod && !!product?.dodEnd && !!offerCountdown;
            const hasSpecialTimer =
              !hasDodTimer &&
              product?.specialOfferEnabled &&
              product?.specialOfferStart &&
              product?.specialOfferEnd &&
              !!offerCountdown;

            if (!hasDodTimer && !hasSpecialTimer) return null;

            const label = hasDodTimer ? 'Deal of the Day' : 'Special Offer';

            const parts =
              typeof offerCountdown === 'string' && offerCountdown.includes(':')
                ? offerCountdown.split(':')
                : ['00', '00', '00', '00'];
            const segments = [
              { idx: 0, l: 'DAYS' },
              { idx: 1, l: 'HRS' },
              { idx: 2, l: 'MINS' },
              { idx: 3, l: 'SECS' },
            ];

            return (
              <motion.div
                variants={itemVariants}
                className="w-full flex justify-start mt-1 mb-2 lg:hidden"
              >
                <div className="flex items-center font-space text-base sm:text-lg border w-full max-w-[400px] my-2 border-primary bg-secondary/10 shadow-sm px-4 py-2 gap-3 ">
                  <span>
                    <LuAlarmClock
                      size={22}
                      className="text-primary animate-zoom"
                    />
                  </span>
                  <span className="px-3 y-1 bg-secondary text-primary font-bold rounded-full ">
                    {label}
                  </span>
                  <div className="flex items-end gap-2 text-primary font-semibold">
                    {segments.map(({ idx, l }) => (
                      <div key={l} className="flex flex-col items-center">
                        <span className="text-sm sm:text-base font-bold tracking-wider">
                          {parts[idx] || '00'}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
                          {l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Desktop Price Block */}
          <motion.div
            className="mb-3 mt-3 flex flex-wrap items-center gap-3 text-xl font-semibold md:text-2xl font-poppins hidden lg:flex"
            variants={itemVariants}
          >
            {product.salePrice && currentPrice === originalPrice ? (
              <>
                <span className="text-base text-gray-500 line-through decoration-1">
                  Rs. {product.price}
                </span>
                <span className="ml-2 text-primary">Rs. {currentPrice}</span>
              </>
            ) : (
              <span>Rs. {currentPrice}</span>
            )}

            {product?.freeShipping && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-green-700 text-xs md:text-sm font-semibold">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M3 13V7a2 2 0 012-2h11a2 2 0 012 2v6m-1 4h2a2 2 0 002-2v-5a2 2 0 00-2-2h-2m-2 7a2 2 0 11-4 0 2 2 0 014 0zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Free Shipping
              </span>
            )}

            {percentageOff > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200  text-green-700  rounded-full  text-xs md:text-sm font-semibold">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {percentageOff}% OFF
              </span>
            )}
          </motion.div>

          {/* Quantity Selector */}
          {product?.stock && (
            <motion.div
              className="flex items-center gap-4 mb-3 hidden lg:flex"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => handleQuantityChange("decrease")}
                disabled={selectedQuantity === 1}
                aria-label="Decrease quantity"
                className={`p-1 text-primary rounded-full text-2xl w-8 h-8 flex items-center justify-center ${selectedQuantity === 1
                  ? "bg-gray-300"
                  : "bg-secondary opacity-70"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                -
              </motion.button>
              <span className="text-xl">{selectedQuantity}</span>
              <motion.button
                onClick={() => handleQuantityChange("increase")}
                aria-label="Increase quantity"
                disabled={selectedQuantity === product.stock}
                className={`p-1 text-primary rounded-full text-2xl w-8 h-8 flex items-center justify-center ${selectedQuantity === product.stock
                  ? "bg-gray-300"
                  : "bg-secondary opacity-70"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
            </motion.div>
          )}

          {/* Deal of the Day / Special Offer Timer - Desktop (after quantity selector) */}
          {(() => {
            const hasDodTimer = product?.isDod && !!product?.dodEnd && !!offerCountdown;
            const hasSpecialTimer =
              !hasDodTimer &&
              product?.specialOfferEnabled &&
              product?.specialOfferStart &&
              product?.specialOfferEnd &&
              !!offerCountdown;

            if (!hasDodTimer && !hasSpecialTimer) return null;

            const label = hasDodTimer ? 'Deal of the Day' : 'Special Offer';

            const parts =
              typeof offerCountdown === 'string' && offerCountdown.includes(':')
                ? offerCountdown.split(':')
                : ['00', '00', '00', '00'];
            const segments = [
              { idx: 0, l: 'DAYS' },
              { idx: 1, l: 'HRS' },
              { idx: 2, l: 'MINS' },
              { idx: 3, l: 'SECS' },
            ];

            return (
              <motion.div
                variants={itemVariants}
                className="w-full flex justify-start mt-1 mb-2 hidden lg:flex"
              >
                <div className="flex items-center font-space text-lg border min-w-[370px] my-4 border-primary bg-secondary/10 shadow-sm px-4 py-2 gap-3">
                  <span>
                    <LuAlarmClock
                      size={26}
                      className="text-primary animate-zoom"
                    />
                  </span>
                  <span className="px-3 y-1 bg-secondary text-primary font-bold rounded-full ">
                    {label}
                  </span>
                  <div className="flex items-end gap-3 text-primary font-semibold">
                    {segments.map(({ idx, l }) => (
                      <div key={l} className="flex flex-col items-center">
                        <span className="text-lg md:text-xl font-bold tracking-wider">
                          {parts[idx] || '00'}
                        </span>
                        <span className="text-[10px] md:text-xs font-semibold tracking-wide">
                          {l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Volume Price Tiers */}
          {product?.volumeTierEnabled &&
            Array.isArray(product?.volumeTiers) &&
            product.volumeTiers.length > 0 && (
              <motion.div className="mb-4 max-w-md" variants={itemVariants}>
                <h3 className="font-semibold capitalize text-md text-secondary font-space mb-2">
                  Choose Bundle
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {product.volumeTiers.map((tier, idx) => {
                    const isSelected = selectedTierIndex === idx;
                    const meta = tiersWithDiscount[idx] || {};
                    return (
                      <button
                        key={`${tier.quantity}-${tier.price}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedTierIndex(idx);
                          if (tier?.image)
                            setSelectedImage(getImageUrl(tier.image));
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-md ${isSelected
                          ? "border-primary ring-1 ring-primary bg-primary/10"
                          : "border-gray-200"
                          }`}
                      >
                        {/* Leading check badge */}
                        {isSelected ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white">
                            <FaCheck className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="w-6 h-6" />
                        )}
                        <img
                          src={
                            tier.image
                              ? getImageUrl(tier.image)
                              : getImageUrl(product?.images?.[0]) ||
                              "https://via.placeholder.com/60"
                          }
                          alt={`Tier ${tier.quantity}`}
                          className="w-14 h-14 rounded object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-secondary">
                              {tier.quantity} pcs
                            </span>
                            <div className="flex items-center gap-2">
                              {typeof meta.prevPrice === "number" &&
                                meta.prevPrice > 0 && (
                                  <span className="text-xs line-through text-gray-400">
                                    Rs. {meta.prevPrice}
                                  </span>
                                )}
                              <span className="font-bold text-primary">
                                Rs. {tier.price}
                              </span>
                              {typeof meta.discountPercent === "number" &&
                                meta.discountPercent > 0 && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                                    -{meta.discountPercent}%
                                  </span>
                                )}
                            </div>
                          </div>
                          {typeof meta.prevPrice === "number" &&
                            typeof tier.price === "number" &&
                            meta.prevPrice > tier.price && (
                              <div className="mt-1 text-xs text-green-700 font-medium">
                                Save Rs. {meta.prevPrice - tier.price}
                              </div>
                            )}
                          {isSelected && (
                            <span className="text-xs text-green-700">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          {/* Variants */}
          {productVariants && productVariants.length > 0
            ? productVariants.map((variant, index) => (
              <motion.div
                key={index}
                className="gap-2 mb-3 "
                variants={itemVariants}
              >
                <h3 className="font-semibold hidden lg:block capitalize text-md text-secondary font-space">
                  {variant.name}
                </h3>
                <div className="hidden lg:flex  flex-wrap items-center gap-3">
                  {variant.values.map((value, idx) =>
                    value.image ? (
                      <motion.div
                        key={idx}
                        className="flex flex-col items-center cursor-pointer"
                        onClick={() =>
                          handleVariantChange(variant.name, value.value)
                        }
                        onMouseEnter={(e) =>
                          handleVariantImageMouseEnter(value.image, e)
                        } // Pass event object
                        onMouseLeave={handleVariantImageMouseLeave}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className={`relative overflow-hidden ${selectedVariants[variant.name]?.includes(
                            value.value
                          )
                            ? "ring-2 ring-primary ring-offset-1"
                            : "border border-gray-300"
                            }`}
                        >
                          <img
                            src={
                              value.image ||
                              variant.image ||
                              "https://via.placeholder.com/50"
                            }
                            alt={value.alt || value.value}
                            className="object-cover w-12 h-12"
                            onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/50")
                            } // Fallback image on error
                            width="48"
                            height="48"
                          />
                          {selectedVariants[variant.name]?.includes(
                            value.value
                          ) && (
                              <div className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 bg-secondary">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3" // Make stroke slightly thicker for visibility on small icon
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                        </div>
                        <span className="mt-1 text-sm text-primary capitalize font-poppins">
                          {value.value}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.button
                        key={idx}
                        onClick={() =>
                          handleVariantChange(variant.name, value.value)
                        }
                        className={`px-4 py-2 capitalize border  transition duration-200 ease-in-out
                                                ${selectedVariants[
                            variant.name
                          ]?.includes(value.value)
                            ? "bg-secondary text-white shadow-md border-primary border-2"
                            : "bg-secondary text-primary border-gray-300"
                          }
                                                `}
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: selectedVariants[
                            variant.name
                          ]?.includes(value.value)
                            ? undefined
                            : "#FFB829",
                          color: selectedVariants[variant.name]?.includes(
                            value.value
                          )
                            ? undefined
                            : "#000000",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {value.value}
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            ))
            : null}

          {/* Actions */}
          <motion.div variants={itemVariants}>
            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-col w-full gap-4 lg:flex-row lg:justify-start">
              <motion.button
                type="button"
                onClick={handleByNow}
                className="w-full px-6 py-2 text-sm font-bold text-center text-white no-underline bg-primary/80 lg:text-base lg:w-auto lg:flex-2 hover:bg-primary"
                whileHover={{ scale: 1.03, opacity: 0.95 }}
                whileTap={{ scale: 0.98 }}
              >
                Cash on Delivery
              </motion.button>
              <motion.button
                type="button"
                onClick={handleAddToCart}
                className="flex items-center justify-center w-full gap-1 px-6 py-2 text-sm font-bold text-primary no-underline bg-secondary/80 lg:w-auto lg:text-base hover:bg-secondary"
                whileHover={{ scale: 1.03, opacity: 0.95 }}
                whileTap={{ scale: 0.98 }}
              >
                <TiShoppingCart className="text-xl animate-spin-pause" />
                Add to Cart
              </motion.button>
            </div>
            <motion.button
              onClick={handleWhatsAppOrder}
              className="hidden lg:flex items-center justify-center w-full gap-2 px-8 py-2 my-3 text-base font-bold text-white bg-[#25CC64] sm:w-auto lg:w-[23rem] hover:bg-green-800 lg:text-xl"
              whileHover={{ scale: 1.03, backgroundColor: "#218B00" }}
              whileTap={{ scale: 0.98 }}
            >
              <FaWhatsapp className="text-2xl" /> Order via WhatsApp
            </motion.button>
            {(product?.categories?.length > 0 || product?.category?.name) && (
              <motion.div
                className="mb-1 capitalize flex flex-col gap-2"
                variants={itemVariants}
              >
                {/* Categories */}
                <div className="flex items-start">
                  <span className="text-gray-600 font-poppins mr-4 mt-1">
                    {product?.categories?.length > 1 ? 'Categories:' : 'Category:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product?.categories?.length > 0 ? (
                      product.categories.map((category, index) => (
                        <Link
                          key={index}
                          to={`/category/${category?.slug}`}
                          className="text-[18px] text-blue-600 md:text-xl font-space font-semibold no-underline hover:underline"
                        >
                          {category.name}
                          {index < product.categories.length - 1 && ','}
                        </Link>
                      ))
                    ) : (
                      // Fallback for old single category format
                      <Link
                        to={`/category/${product?.category?.slug}`}
                        className="text-[18px] text-blue-600 md:text-xl font-space font-semibold no-underline hover:underline"
                      >
                        {product.category.name}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Brand */}
                <div className="flex items-center">
                  <span className="text-gray-600 font-poppins mr-4">
                    Brand:
                  </span>
                  <Link
                    to={`/brand/${product?.brand?.slug}`}
                    className="text-[20px] text-blue-600 md:text-xl font-space font-semibold no-underline hover:underline"
                  >
                    {product.brand?.name}
                  </Link>
                </div>
              </motion.div>
            )}

            {/* FAQs moved to RightEdgeTab + Drawer for cleaner layout */}
          </motion.div>
        </motion.div>
      </div>

      {/* Sentinel to trigger mobile tab visibility once reached (after main image section) */}
      <div ref={afterImageSentinelRef} className="h-1 w-full" />

      {/* Right Edge Tabs (Desktop always visible, Mobile when sentinel visible) */}

      <RightEdgeTab
        onClick={() => setSpecsOpen(true)}
        label="Specs"
        positionClass="top-[40%]"
        translateClass=""
        mobileVisible={mobileTabsVisible}
      />

      <RightEdgeTab
        onClick={() => setFaqsOpen(true)}
        label="FAQs"
        positionClass="top-[calc(54%)]"
        translateClass=""
        mobileVisible={mobileTabsVisible}
      />
      <RightEdgeTab
        onClick={() => setReviewsOpen(true)}
        label="Reviews"
        positionClass="top-[calc(74%)]"
        translateClass="-translate-y-1/2"
        mobileVisible={mobileTabsVisible}
      />

      {/* Product Long Description - placed after product details and before related products */}
      <div className="px-2 md:px-6 max-w-6xl mx-auto mt-6">
        <h2 className="text-lg md:text-xl text-secondary underline underline-offset-8 font-bold font-space decoration-primary decoration-2  mb-3">
          Description
        </h2>
        <div
          className="product-description prose max-w-none font-space text-gray-700"
          dangerouslySetInnerHTML={{
            __html:
              product?.longDescription ||
              product?.description ||
              "<p>No description available.</p>",
          }}
        />
      </div>

      {/* Cart Drawer */}
      <Suspense fallback={<SingleProductSkeleton />}>
        <LazyCartDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
        />
        <LazyRelatedProducts
          relatedProducts={relatedProducts}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </Suspense>

      {/* Mobile buttons removed in favor of mobile-visible edge tabs */}

      {/* Reviews Drawer and Write Review Modal */}
      <ReviewsDrawer
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        slug={slug}
        product={product}
        onWriteReview={() => setWriteReviewOpen(true)}
      />
      <WriteReviewModal
        open={writeReviewOpen}
        onClose={() => setWriteReviewOpen(false)}
        onSubmitted={() => {
          setWriteReviewOpen(false);
          setReviewsOpen(false);
        }}
        slug={slug}
        product={product}
      />
      <SpecificationsDrawer
        open={specsOpen}
        onClose={() => setSpecsOpen(false)}
        title="Specifications"
        html={product?.description || "<p>No specifications available.</p>"}
      />
      <FaqsDrawer
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        faqs={product?.faqs || []}
      />

      {/* Image Preview Overlay */}
      <AnimatePresence>
        {hoveredVariantImage && (
          <motion.div
            className="fixed z-[9998] p-2 bg-white border border-gray-300 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              top: hoverPreviewPosition.y,
              left: hoverPreviewPosition.x,
              width: "250px",
              height: "250px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
            onClick={handleImagePreviewClick}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
          >
            <img
              src={hoveredVariantImage}
              alt={getVariantImageAlt(hoveredVariantImage)}
              className="object-contain w-full h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg lg:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={handleByNow}
              className="flex-1 px-4 py-3 text-sm font-bold text-center text-white no-underline bg-primary md:bg-primary/90 hover:bg-primary "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cash On Delivery
            </motion.button>
            <motion.button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center justify-center flex-1 gap-1 px-4 py-3 text-sm font-bold text-primary no-underline bg-secondary md:bg-secondary/90 hover:bg-secondary "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TiShoppingCart className="text-lg" />
              Add to Cart
            </motion.button>
          </div>
          <motion.button
            onClick={handleWhatsAppOrder}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-white bg-green-600 md:bg-[#25CC64] hover:bg-green-800 "
            whileHover={{ scale: 1.02, backgroundColor: "#218B00" }}
            whileTap={{ scale: 0.98 }}
          >
            <FaWhatsapp className="text-xl" /> Order via WhatsApp
          </motion.button>
        </div>
      </div>

      {/* Add bottom padding to prevent content from being hidden behind sticky buttons on mobile */}
      <div className="h-32 lg:hidden"></div>

      {/* Drawer/Modal for variant selection */}
      <AnimatePresence>
        {variantDrawerOpen && activeVariant && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-t-2xl p-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-secondary font-space text-lg">
                  {activeVariant.name}
                </span>
                <button
                  onClick={() => setVariantDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 justify-start">
                {activeVariant.values.map((val, idx) => {
                  const isSelected = selectedVariants[
                    activeVariant.name
                  ]?.includes(val.value);
                  return (
                    <div
                      key={val.value}
                      className="flex flex-col items-center cursor-pointer relative w-20"
                    >
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white relative"
                        onClick={() => {
                          if (isSelected) {
                            // Deselect only, do not preview
                            handleVariantChange(activeVariant.name, val.value);
                          } else {
                            // Preview and select
                            setPreviewImage(
                              getImageUrl(val.image) ||
                              "https://via.placeholder.com/300"
                            );
                            handleVariantChange(activeVariant.name, val.value);
                          }
                        }}
                      >
                        <img
                          src={
                            getImageUrl(val.image) ||
                            "https://via.placeholder.com/50"
                          }
                          className="w-full h-full object-cover"
                          alt={val.alt || val.value}
                        />
                        {/* Checkmark for selected */}
                        {isSelected && (
                          <span className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1 text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-xs text-center font-medium max-w-full truncate">
                        {val.value}
                      </span>
                      <span className="text-xs font-semibold text-center">
                        Rs. {val.price ?? product.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              className="relative bg-white rounded-lg shadow-lg p-2 flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                aria-label="Close preview"
              >
                <AiOutlineClose className="w-6 h-6 text-gray-700" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-[90vw] max-h-[60vh] rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(SingleProduct);

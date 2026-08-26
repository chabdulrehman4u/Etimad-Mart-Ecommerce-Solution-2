import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import ProductCard from "./cards/ProductCard";
import ProductCardSkeleton from "./skeletons/ProductCardSkeleton";
import { motion } from "framer-motion";
import { BiSolidChevronLeft, BiSolidChevronRight } from "react-icons/bi";
import { getNewProducts } from "../functions/homepage";

const NewArrivals = React.memo(() => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [mountSlider, setMountSlider] = useState(false);
  const [sliderContainerRef, instanceRef] = useKeenSlider({
    loop: true,
    renderMode: "precision",
    slides: {
      perView: 2,
      spacing: 8,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: { perView: 3, spacing: 12 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 4, spacing: 16 },
      },
      "(min-width: 1280px)": {
        slides: { perView: 5, spacing: 16 },
      },
    },
  });

  // Motion gating: skip animations on touch devices or when user prefers reduced motion
  const allowMotion = useMemo(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches;
    return !(prefersReduced || isCoarse);
  }, []);

  const headingVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.8,
          ease: "easeOut",
        },
      },
    }),
    []
  );

  // Mount slider after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountSlider(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const productsPerPage = 8;

  const handlePageChange = useCallback((pageNumber) => {
    if (typeof pageNumber !== 'number') return;
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  }, [totalPages]);

  // Fetch new products for the current page
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await getNewProducts(currentPage, productsPerPage);
        if (cancelled) return;
        const products = res?.products || [];
        setProducts(products);
        setTotalPages(res?.totalPages || 1);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError("Failed to load new arrivals. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [currentPage, productsPerPage]);

  const handlePrev = useCallback(() => {
    instanceRef.current?.prev();
  }, [instanceRef]);

  const handleNext = useCallback(() => {
    instanceRef.current?.next();
  }, [instanceRef]);

  const getVisiblePages = useCallback(() => {
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages]);

  const renderSkeletons = useMemo(
    () => (
      <div className="relative">
        {/* Static grid layout before Keen mounts - matches actual product layout */}
        <div className="flex gap-2 lg:gap-0 overflow-x-auto scrollbar-hide px-1 lg:px-0">
          {Array.from({ length: productsPerPage }).map((_, index) => (
            <div
              key={index}
              className="shrink-0 w-[250px] px-2 lg:px-3 py-2"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    ),
    [productsPerPage]
  );

  const renderPagination = useMemo(() => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center mt-6 mb-4 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-full ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-secondary hover:bg-primary"
          }`}
          aria-label="Previous page"
        >
          <FaChevronLeft />
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
              currentPage === page
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-full ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-secondary hover:bg-primary"
          }`}
          aria-label="Next page"
        >
          <FaChevronRight />
        </button>
      </div>
    );
  }, [currentPage, totalPages, handlePageChange, getVisiblePages]);

  if (error) {
    return <div className="w-full py-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div
      className="w-full px-1 mt-4 overflow-hidden md:px-4 lg:px-6"
      ref={containerRef}
    >
      {/* Heading with lines */}
      <motion.div
        className="flex items-center justify-center w-full px-5 mb-4 md:mb-7"
        variants={headingVariants}
        initial={allowMotion ? "hidden" : false}
        whileInView={allowMotion ? "visible" : undefined}
        viewport={allowMotion ? { once: true, amount: 0.5 } : undefined}
      >
        <div className="flex-grow h-[0.5px] mr-4 bg-primary"></div>
        <h2 className="text-2xl font-extrabold text-center text-secondary font-space md:text-4xl whitespace-nowrap">
          New Arrivals
        </h2>
        <div className="flex-grow h-[0.5px] ml-4 bg-primary"></div>
      </motion.div>

      {loading ? (
        renderSkeletons
      ) : (
        <div className="relative">
          {!mountSlider ? (
            // Static list before Keen mounts
            <div className="flex gap-2  overflow-x-auto scrollbar-hide px-1 ">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="shrink-0 w-[280px] px-1  py-2"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div ref={sliderContainerRef} className="keen-slider">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="keen-slider__slide shrink-0 w-[280px] px-1 py-2"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* Custom arrows for Keen */}
              <button
                onClick={handlePrev}
                className="absolute left-0 md:-left-3 top-1/2 md:top-[45%] lg:top-1/2 transform -translate-y-1/2 bg-primary opacity-70 text-secondary hover:text-white p-1 rounded-full z-10 hover:opacity-90"
              >
                <BiSolidChevronLeft />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 md:-right-3 top-1/2 md:top-[45%] lg:top-1/2 transform -translate-y-1/2 bg-primary opacity-70 text-secondary hover:text-white p-1 rounded-full z-10 hover:opacity-90"
                aria-label="Next slide"
              >
                <BiSolidChevronRight />
              </button>
            </div>
          )}
        </div>
      )}

      {renderPagination}
    </div>
  );
});

NewArrivals.displayName = "NewArrivals";

export default NewArrivals;

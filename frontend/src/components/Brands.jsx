import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { BiSolidChevronLeft, BiSolidChevronRight } from "react-icons/bi";
import { getHomepageBrands } from "../functions/homepage";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

const Brands = React.memo(() => {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const fetchBrands = useCallback(async () => {
    try {
      const list = await getHomepageBrands();
      setBrands(list || []);
      setError(null);
    } catch (error) {
      console.error("Error in fetching brands", error);
      setError("Failed to load brands. Please try again later.");
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = "/images/placeholder.png";
  }, []);

  const ringStyle = useMemo(
    () => ({
      background:
        "conic-gradient(from 270deg, var(--color-primary, #5a67d8), var(--color-secondary, #3182ce), var(--color-primary, #5a67d8))",
    }),
    []
  );

  const containerClasses = useMemo(
    () =>
      `px-0 md:px-6 lg:px-16 py-2 transition-all duration-500 ease-out ` +
      (inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"),
    [inView]
  );

  const renderBrandContent = useCallback(
    (brand) => (
      <div className="flex flex-col items-center transition-transform duration-200 ease-out md:hover:scale-[1.01] origin-center overflow-visible py-2 transform-gpu">
        <Link
          to={`/brand/${brand?.slug}`}
          className="rounded-full group overflow-visible"
        >
          <div className="relative rounded-full overflow-visible">
            {/* Gradient ring wrapper with padding; spins on hover (desktop) */}
            <div
              className="w-14 sm:w-16 md:w-20 lg:w-24 h-14 sm:h-16 md:h-20 lg:h-24 rounded-full p-[2px] md:group-hover:animate-[spin_3s_linear_infinite]"
              style={ringStyle}
            >
              {/* Inner white circle holds the logo; clipped cleanly with small insets */}
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                <img
                  src={brand?.logo}
                  alt={brand.alt}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 112px, (min-width: 768px) 80px, 56px"
                  width={88}
                  height={88}
                  onError={handleImageError}
                  className="block w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px] object-contain rounded-full"
                />
              </div>
            </div>
          </div>
        </Link>
        <span className="hidden sm:block mt-2 text-sm leading-4 uppercase font-semibold text-gray-700 text-center max-w-[120px] truncate">
          {brand.name}
        </span>
      </div>
    ),
    [handleImageError, ringStyle]
  );

  const trackRef = useRef(null);
  const scrollerRef = useRef(null);

  // Calculate scroll distance for exactly 2 brands
  const getTwoBrandScrollDistance = useCallback(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track || !track.firstElementChild) return 200; // fallback

    const firstItem = track.firstElementChild;
    const itemRect = firstItem.getBoundingClientRect();
    const itemWidth = itemRect.width;

    // Get gap from computed styles
    const trackStyles = window.getComputedStyle(track);
    const gap = parseInt(trackStyles.gap) || 16;

    // 2 items + 2 gaps
    return Math.round(itemWidth * 2 + gap * 2);
  }, []);

  return (
    <div ref={ref} className="w-full py-3 md:py-4 overflow-visible">
      <div className="container mx-auto px-2 md:px-6 lg:px-8">
        <h2 className="text-2xl md:text-4xl font-extrabold font-space text-secondary text-center mb-5 md:mb-7">
          Top Brands
        </h2>
      </div>

      <div className={containerClasses}>
        {/* Manual scroll carousel: shows ~3/5/8/9 visible items */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="relative w-full overflow-x-auto scrollbar-hide px-2 md:px-4 touch-pan-x select-none"
            aria-label="Brand logos carousel"
          >
            <div ref={trackRef} className="flex items-center gap-3 md:gap-4">
              {brands.map((brand, index) => (
                <div
                  key={(brand?._id || brand?.slug || index) + "-" + index}
                  className="shrink-0 w-[20%] md:w-[20%] lg:w-[12.5%] xl:w-[11.111%] flex items-center justify-center"
                >
                  {renderBrandContent(brand)}
                </div>
              ))}
            </div>
          </div>
          {/* Chevron controls */}
          {brands && brands.length > 8 && (
            <>
              <button
                type="button"
                onClick={() => {
                  const el = scrollerRef.current;
                  if (!el) return;
                  const delta = getTwoBrandScrollDistance();
                  el.scrollBy({ left: -delta, behavior: "smooth" });
                }}
                className="hidden md:flex items-center justify-center absolute -left-3 lg:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 text-black hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 z-30"
                aria-label="Previous"
              >
                <BiSolidChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = scrollerRef.current;
                  if (!el) return;
                  const delta = getTwoBrandScrollDistance();
                  el.scrollBy({ left: delta, behavior: "smooth" });
                }}
                className="hidden md:flex items-center justify-center absolute -right-3 lg:-right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 text-black hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 z-30"
                aria-label="Next"
              >
                <BiSolidChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

Brands.displayName = "Brands";

export default Brands;

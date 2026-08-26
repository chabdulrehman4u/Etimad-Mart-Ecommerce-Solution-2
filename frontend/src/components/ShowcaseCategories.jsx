import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { filterByCategory } from "../functions/search";
import ProductCard from "./cards/ProductCard";
import ProductCardSkeleton from "./skeletons/ProductCardSkeleton";
import { Link } from "react-router-dom";

// Global cache for category products to prevent duplicate API calls
const categoryCache = new Map();
const pendingRequests = new Map();

const ShowcaseCategories = ({
  categorySlug,
  categoryName,
  categoryImage ,
  limit = 6,
  lazy = true, // Enable lazy loading by default
  priority = false, // Set to true for first/critical categories
}) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy || priority); // Load immediately if priority or not lazy

  const scrollRef = useRef();
  const containerRef = useRef();

  // Memoized cache key
  const cacheKey = useMemo(() => `${categorySlug}-${limit}`, [categorySlug, limit]);

  // Optimized fetch function with caching and request deduplication
  const fetchProducts = useCallback(async () => {
    if (!categorySlug) return;

    // Check cache first
    if (categoryCache.has(cacheKey)) {
      const cachedData = categoryCache.get(cacheKey);
      setProducts(cachedData);
      return;
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey);
        setProducts(result);
      } catch (err) {
        setProducts([]);
      }
      return;
    }

    setLoadingProducts(true);
    
    // Create and store the pending request
    const requestPromise = filterByCategory({
      categories: categorySlug,
      page: 1,
      limit,
    }).then(res => {
      const products = res?.products || [];
      // Cache the result - longer cache for priority categories
      const cacheTime = priority ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min vs 5min
      categoryCache.set(cacheKey, products);
      setTimeout(() => categoryCache.delete(cacheKey), cacheTime);
      return products;
    }).finally(() => {
      pendingRequests.delete(cacheKey);
      setLoadingProducts(false);
    });

    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      setProducts(result);
    } catch (err) {
      console.error(`Error fetching products for ${categorySlug}:`, err);
      setProducts([]);
    }
  }, [categorySlug, limit, cacheKey]);

  // Intersection Observer for lazy loading (skip if priority)
  useEffect(() => {
    if (!lazy || isVisible || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before component is visible
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Fetch products when component becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchProducts();
    }
  }, [isVisible, fetchProducts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="w-full max-w-screen-xl mx-auto px-1 md:px-8 py-4 md:py-0 lg:py-4"
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch min-h-[300px] md:min-h-[400px]">
        {/* Left: Category Name and Static Image */}
        <div className="w-full md:w-1/4 flex flex-row md:flex-col items-center md:items-center justify-center md:justify-center mb-2 md:mb-0 h-full gap-4 md:gap-0 px-2 md:px-0">
          <Link className="no-underline flex-1 md:flex-none max-w-[60%] md:max-w-none" to={`/category/${categorySlug}`}> 
            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-secondary font-space mb-0 md:mb-4 text-center md:text-left md:ml-4 block leading-tight break-words hyphens-auto">
              {categoryName}
            </h2>
          </Link>
          <img
            src={categoryImage}
            alt={categoryName}
            className="block w-16 h-16 md:w-auto md:max-w-[300px] md:h-auto md:max-h-[380px] lg:w-[300px] lg:h-[380px] md:object-contain lg:object-cover md:bg-transparent lg:bg-gray-100 self-center md:ml-2 rounded shadow-none  flex-shrink-0"
            loading="lazy"
            decoding="async"
            width={300}
            height={380}
          />
        </div>
        {/* Right: Horizontally Scrollable Products */}
        <div className="w-full md:w-3/4 flex flex-col h-full justify-center self-center md:mt-24 md:mb-8">
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide w-full px-2 md:px-0"
          >
            <div className="flex flex-row gap-3">
              {loadingProducts ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="w-[calc(50%-6px)] md:w-60 flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div key={product._id} className="w-[calc(50%-6px)] md:w-60 flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-8 w-full">
                  No products found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseCategories;

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getHomepageCategories } from '../functions/homepage';
import CategorySkeleton from './skeletons/CategorySkeleton';

const Categories = React.memo(() => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Simple cache to speed up subsequent visits
    const CACHE_KEY = 'categories_cache_v2';
    const CACHE_MS = 30 * 60 * 1000; // 30 minutes
    // Mobile detection and staged rendering for faster first paint
    const [isMobile, setIsMobile] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const fetchAllCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const list = await getHomepageCategories();
            setCategories(list || []);
            // Warm cache only if valid non-empty list
            if (Array.isArray(list) && list.length > 0) {
                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: list }));
                } catch {}
            }
        } catch (error) {
            console.error("Error in fetching all categories", error);
            setError("Failed to load categories. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Read from cache first for instant paint
        try {
            const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
            if (cached && Array.isArray(cached.items) && cached.items.length > 0 && Date.now() - cached.ts < CACHE_MS) {
                setCategories(cached.items);
            }
        } catch {}
        fetchAllCategories();
        // Detect mobile once on mount
        try {
            const mm = window.matchMedia && window.matchMedia('(max-width: 768px)');
            setIsMobile(!!mm && mm.matches);
            if (mm && typeof mm.addEventListener === 'function') {
                const handler = (e) => setIsMobile(e.matches);
                mm.addEventListener('change', handler);
                return () => mm.removeEventListener('change', handler);
            }
        } catch {}
    }, [fetchAllCategories]);

    // After first paint on mobile, hydrate to show remaining tiles without blocking initial render
    useEffect(() => {
        if (!isMobile) return; // only for mobile
        if (showAll) return;
        if (!Array.isArray(categories) || categories.length <= 6) return;
        let idleId;
        let timeoutId;
        const run = () => setShowAll(true);
        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(run, { timeout: 1200 });
        } else {
            timeoutId = setTimeout(run, 800);
        }
        return () => {
            if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isMobile, categories, showAll]);

    // Helper to generate optimized image URLs when remote (e.g., Cloudinary); local paths unchanged
    const getOptimizedImageUrl = useCallback((imageUrl, width, height) => {
        if (!imageUrl) return '';
        if (typeof imageUrl === 'string' && imageUrl.startsWith('/')) return imageUrl;
        const sep = (typeof imageUrl === 'string' && imageUrl.includes('?')) ? '&' : '?';
        // Prefer economical quality on mobile and device DPR scaling
        return `${imageUrl}${sep}f_auto&q_auto:eco&dpr=auto&w=${width}&h=${height}&c=fill`;
    }, []);

    const renderCategories = useMemo(() => {
        if (loading && (!categories || categories.length === 0)) {
            // Return tiles directly so they use the same outer grid container
            const skeletonCount = isMobile ? 8 : 14;
            return Array.from({ length: skeletonCount }).map((_, idx) => (
                <CategorySkeleton key={idx} />
            ));
        }

        if (error) {
            return (
                <div className="py-4 text-center text-red-500 col-span-full">
                    {error}
                </div>
            );
        }

        // Stage rendering: fewer tiles first, hydrate remaining after idle
        const eagerCount = isMobile ? 2 : 4;
        const initialCount = isMobile ? 8 : 14;
        const maxCount = initialCount;

        return categories?.slice(0, maxCount).map((category, index) => (
            <div
                key={category._id || index}
                className="flex flex-col items-center overflow-visible transform transition-transform duration-300 ease-out motion-safe:md:hover:-translate-y-1"
            >
                <Link to={`/category/${category.slug}`} className="relative w-full cursor-pointer group">
                    <div className="relative w-20 h-20 aspect-square overflow-hidden rounded-lg shadow-sm md:h-24 md:w-24 lg:h-36 lg:w-36 transition-shadow duration-300 ease-out md:group-hover:shadow-[0_0_28px_rgba(17,24,39,0.22)]">
                        <img
                            src={getOptimizedImageUrl(category?.Image || category?.image || category?.img, 144, 144)}
                            srcSet={[
                                `${getOptimizedImageUrl(category?.Image || category?.image || category?.img, 80, 80)} 80w`,
                                `${getOptimizedImageUrl(category?.Image || category?.image || category?.img, 96, 96)} 96w`,
                                `${getOptimizedImageUrl(category?.Image || category?.image || category?.img, 144, 144)} 144w`,
                            ].join(', ')}
                            sizes="(min-width: 1024px) 144px, (min-width: 768px) 96px, 80px"
                            alt={category?.alt}
                            className="object-cover w-full h-full transform transition-transform duration-300 ease-in-out motion-safe:md:group-hover:scale-105"
                            loading={index < eagerCount ? 'eager' : 'lazy'}
                            decoding="async"
                            fetchpriority={index < eagerCount ? 'high' : 'low'}
                            width={144}
                            height={144}
                        />
                    </div>
                </Link>

                <div className="mt-2 w-full min-h-[20px] md:min-h-[24px]">
                    <span className="block text-sm font-medium text-center capitalize font-poppins transition-colors duration-200 ease-out md:group-hover:text-gray-800 line-clamp-2 leading-snug">
                        {category?.name}
                    </span>
                </div>
            </div>
        ));
    }, [categories, loading, error, isMobile, getOptimizedImageUrl]);

    return (
        <div className="max-w-screen-xl px-4 py-2 mx-auto overflow-visible md:py-4 md:px-12 lg:px-14">
            <h2
                className="mb-5 text-2xl font-extrabold text-center md:text-4xl font-space text-secondary"
            >
                Browse Categories
            </h2>

            <div
                className="grid grid-cols-4 gap-4 sm:gap2 md:gap-5 lg:gap-5 xl:gap-6 md:grid-cols-7 lg:grid-cols-7 overflow-visible"
            >
                {renderCategories}
            </div>
        </div>
    );
});

Categories.displayName = 'Categories';

export default React.memo(Categories);
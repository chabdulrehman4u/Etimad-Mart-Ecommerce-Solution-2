import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { getHomepageBanners } from "../functions/homepage";

// Static banners moved outside component to prevent recreation on every render
const staticBanners = [
  {
    _id: 'custom1',
    image: 'https://res.cloudinary.com/dmcgfwmuf/image/upload/v1761894276/banners/etanztngb40zfk57dap3.webp?f_avif&q_auto:good&dpr=1&w=1366&h=680&c=fit&fl=force_strip',
    link: '#',
    alt: 'Custom Banner 1',
    priority: true, // Mark as LCP candidate
    width: 1920,
    height: 600,
  },
  {
    _id: 'custom2',
    image: 'https://res.cloudinary.com/dmcgfwmuf/image/upload/v1761894290/banners/cutkr5s1mqwvjkwcemhj.webp?f_avif&q_auto:good&dpr=1&w=1366&h=680&c=fit&fl=force_strip',
    link: '#',
    alt: 'Custom Banner 2',
    priority: false,
    width: 1920,
    height: 600,
  },
];

const Banner = React.memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(null);
  // Mobile detection with responsive behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const [mountSlider, setMountSlider] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [firstBannerLoaded, setFirstBannerLoaded] = useState(false);
  const prefetchedUrlsRef = useRef(new Set());

  // Autoplay plugin for Keen (pauses on hover, when page is hidden, and when offscreen)
  const autoplay = useCallback((delay = 1000) => (slider) => {
    let timeoutId;
    let mouseOver = false;
    let stopped = false;
    const clear = () => timeoutId && clearTimeout(timeoutId);
    const next = () => {
      clear();
      if (mouseOver || stopped) return;
      timeoutId = setTimeout(() => slider.next(), delay);
    };

    slider.on("created", () => {
      const container = slider.container;

      // Do not autoplay with reduced motion or a single slide
      try {
        const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || slider.slides.length < 2) {
          stopped = true;
          clear();
          return;
        }
      } catch { }

      const onMouseOver = () => { mouseOver = true; clear(); };
      const onMouseOut = () => { mouseOver = false; next(); };
      container.addEventListener('mouseover', onMouseOver);
      container.addEventListener('mouseout', onMouseOut);

      const onVisibility = () => { stopped = document.hidden; stopped ? clear() : next(); };
      document.addEventListener('visibilitychange', onVisibility);

      let io;
      try {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { stopped = !e.isIntersecting; stopped ? clear() : next(); });
        });
        io.observe(container);
      } catch { }

      next();

      slider.on('dragStarted', clear);
      slider.on('animationEnded', next);
      slider.on('updated', next);

      slider.on('destroyed', () => {
        container.removeEventListener('mouseover', onMouseOver);
        container.removeEventListener('mouseout', onMouseOut);
        document.removeEventListener('visibilitychange', onVisibility);
        if (io) {
          try { io.disconnect(); } catch { }
        }
        clear();
      });
    });
  }, []);

  const [sliderContainerRef, instanceRef] = useKeenSlider(
    {
      loop: true,
      renderMode: 'precision',
      slides: { perView: 1, spacing: 0 },
      slideChanged: (s) => setCurrentSlide(s.track.details.rel),
      breakpoints: {
        "(min-width: 768px)": {
          slides: { perView: 1, spacing: 0 },
        },
      },
    },
    autoplayEnabled ? [autoplay(4000)] : []
  );

  // Mobile-first dimensions for better LCP
  const bannerDimensions = useMemo(() => ({
    // Keep aspect ratio ~1920x680 across breakpoints (~2.82:1)
    mobile: { width: 480, height: 170 },
    tablet: { width: 1024, height: 362 },
    desktop: { width: 1920, height: 680 }
  }), []);

  const aspectRatio = useMemo(() =>
    bannerDimensions.desktop.width / bannerDimensions.desktop.height,
    [bannerDimensions]
  );

  const preloaded = (typeof window !== 'undefined' && Array.isArray(window.__PRELOADED_BANNERS)) ? window.__PRELOADED_BANNERS : [];
  const [banners, setBanners] = useState(() => {
    // Try to get cached banners first to prevent re-fetching on HMR
    if (typeof window !== 'undefined' && window.__BANNER_CACHE) {
      return window.__BANNER_CACHE;
    }
    // Use preloaded banners if available, otherwise use static banners for LCP
    return preloaded.length > 0 ? preloaded : staticBanners;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && window.__BANNER_CACHE) {
      return false;
    }
    // Never show loading since we always have static banners
    return false;
  });

  const [error, setError] = useState(null);
  const [imageLoadedStates, setImageLoadedStates] = useState({});
  const mounted = useRef(false);

  const fetchBanners = useCallback(async () => {
    if (!mounted.current) return;
    if (preloaded.length > 0) {
      setLoading(false);
      return;
    }

    // Always use static banners first for better LCP
    setBanners(staticBanners);
    setLoading(false);

    // Optionally fetch API banners in background (commented out for LCP optimization)
    /*
    try {
      setError(null);
      const response = await getHomepageBanners();
      const raw = Array.isArray(response) ? response : (response?.banners || response?.data || []);
      const list = Array.isArray(raw) ? raw.map((it, idx) => ({
        _id: it?._id || it?.id || String(idx),
        image: it?.image || it?.url || it?.src || '',
        link: it?.link || '#',
        alt: it?.alt || `Banner ${idx + 1}`,
      })) : [];
      
      // Only update if API banners are different and valid
      if (list.length > 0) {
        setBanners(list);
        // Cache banners to prevent re-fetching on HMR
        if (typeof window !== 'undefined') {
          window.__BANNER_CACHE = list;
        }
        // Reset image loaded states when banners change
        setImageLoadedStates({});
      }
    } catch (e) {
      console.error("Banner fetch failed, using static banners", e);
      // Keep static banners on API failure
    }
    */
  }, [preloaded]);

  // Removed container height measurement to avoid layout reflows; intrinsic sizing is used

  useEffect(() => {
    mounted.current = true;
    fetchBanners();
    return () => { mounted.current = false; };
  }, [fetchBanners]);

  // Calculate available viewport height below the banner top (accounts for sticky header/category bars)
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
      const h = Math.max(0, Math.floor(vh - top));
      setAvailableHeight(h);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    // Recompute after fonts/layout settle
    const id = setTimeout(update, 100);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      clearTimeout(id);
    };
  }, []);

  // Reset image loaded states when banners change
  useEffect(() => {
    setImageLoadedStates({});
  }, [banners]);

  // Removed mount zoom to avoid repainting LCP
  useEffect(() => { }, []);

  // Scroll-based zoom disabled: using only mount animation

  // Mount slider only after the first (LCP) image has fully loaded
  useEffect(() => {
    const resolved = banners.length ? banners : staticBanners;
    if (firstBannerLoaded && resolved.length > 1) setMountSlider(true);
  }, [banners, firstBannerLoaded]);

  const handleDotClick = useCallback((index) => {
    instanceRef.current?.moveToIdx(index);
  }, [instanceRef]);

  const getOptimizedImageUrl = useCallback((imageUrl, width, height, format = 'auto') => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('/')) return imageUrl;
    const sep = imageUrl.includes('?') ? '&' : '?';
    // Cloudinary: auto format/quality, DPR, fit, strip metadata
    const q = width <= 640 ? 'q_auto:eco' : 'q_auto:good';
    const f = `f_${format}`; // 'auto'|'avif'|'webp'
    const dpr = width >= 1024 ? 'dpr=1' : 'dpr=auto';
    return `${imageUrl}${sep}${f}&${q}&${dpr}&w=${width}${height ? `&h=${height}` : ''}&c=fit&fl=force_strip`;
  }, []);

  const renderBannerSkeleton = useCallback(() => {
    const paddingTopPercentage = (bannerDimensions.desktop.height / bannerDimensions.desktop.width) * 100;
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{
          paddingTop: `${paddingTopPercentage}%`,
          backgroundColor: '#f3f4f6',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          {/* Skeleton content overlay */}
          <div className="absolute bottom-4 left-4 space-y-2">
            <div className="w-32 h-4 bg-white/30 rounded"></div>
            <div className="w-24 h-3 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }, [bannerDimensions]);

  // Prefetch helper for the next slide to avoid visible loading when autoplay starts
  const prefetchBannerImage = useCallback((banner) => {
    try {
      if (!banner?.image) return;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1366;
      const w = vw <= 640 ? 480 : (vw <= 1024 ? 1024 : 1366);
      const h = w === 480 ? bannerDimensions.mobile.height : (w === 1024 ? bannerDimensions.tablet.height : bannerDimensions.desktop.height);
      const url = getOptimizedImageUrl(banner.image, w, h, 'avif');
      if (prefetchedUrlsRef.current.has(url)) return;
      prefetchedUrlsRef.current.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    } catch { }
  }, [getOptimizedImageUrl, bannerDimensions]);

  const handleImageLoad = useCallback((bannerId, isLCP) => {
    setImageLoadedStates(prev => ({ ...prev, [bannerId]: true }));
    if (isLCP) {
      setFirstBannerLoaded(true);
      if (typeof window !== 'undefined' && window.performance?.mark) {
        window.performance.mark('lcp-banner-loaded');
      }
      // Prefetch the next slide image and start autoplay shortly after LCP settles
      const list = (banners.length ? banners : staticBanners);
      if (list.length > 1) {
        const next = list[1];
        prefetchBannerImage(next);
      }
      setTimeout(() => setAutoplayEnabled(true), 5000);
    }
  }, [banners, prefetchBannerImage]);

  const handleImageError = useCallback((bannerId) => {
    console.error('Error loading banner image:', bannerId);
    setImageLoadedStates(prev => ({ ...prev, [bannerId]: true })); // Show skeleton instead of broken image
  }, []);

  const renderMobileBanner = useCallback((banner, isLCP = false, isNext = false) => {
    return (
      <div className="hero-banner w-full">
        <img
          src={getOptimizedImageUrl(
            banner.image,
            bannerDimensions.mobile.width,
            bannerDimensions.mobile.height,
            'auto'
          )}
          alt={banner.alt || 'Banner'}
          loading={isLCP || isNext ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={(isLCP || isNext) ? 'high' : 'low'}
          width={bannerDimensions.mobile.width}
          height={bannerDimensions.mobile.height}
          className="w-full h-auto"
          style={{ display: 'block' }}
          onLoad={() => handleImageLoad(banner._id, isLCP)}
          onError={() => handleImageError(banner._id)}
        />
      </div>
    );
  }, [bannerDimensions, getOptimizedImageUrl, handleImageLoad, handleImageError]);

  const renderBannerImage = useCallback((banner, index) => {
    // Use simple mobile banner for better performance
    if (isMobile) {
      const isLCP = index === 0 || banner.priority;
      const isNext = firstBannerLoaded && index === 1; // prioritize second slide after first loads
      return renderMobileBanner(banner, isLCP, isNext);
    }

    const paddingTopPercentage = (bannerDimensions.desktop.height / bannerDimensions.desktop.width) * 100;
    const isLCP = index === 0 || banner.priority; // First image or priority flag is LCP candidate
    const isNext = firstBannerLoaded && index === 1; // prioritize second slide after first loads
    // For static banners, assume they're preloaded and ready
    const imageLoaded = imageLoadedStates[banner._id] || banner.image?.startsWith('/') || true;

    return (
      <div className="hero-banner w-full">
        {/* No skeleton for banner images - immediate display for LCP */}
        <picture className="block w-full">
          {/* Mobile-first: Load smallest image first */}
          <source
            media="(max-width: 640px)"
            srcSet={getOptimizedImageUrl(
              banner.image,
              bannerDimensions.mobile.width,
              bannerDimensions.mobile.height,
              'avif'
            )}
            type="image/avif"
          />
          <source
            media="(max-width: 1024px)"
            srcSet={getOptimizedImageUrl(
              banner.image,
              bannerDimensions.tablet.width,
              bannerDimensions.tablet.height,
              'avif'
            )}
            type="image/avif"
          />
          <source
            media="(min-width: 1025px)"
            srcSet={getOptimizedImageUrl(
              banner.image,
              1366,
              bannerDimensions.desktop.height,
              'avif'
            )}
            type="image/avif"
          />
          <img
            src={getOptimizedImageUrl(
              banner.image,
              1366,
              bannerDimensions.desktop.height,
              'auto'
            )}
            alt={banner.alt || `Banner ${index + 1}`}
            loading={isLCP || isNext ? 'eager' : 'lazy'}
            decoding="async"
            fetchpriority={(isLCP || isNext) ? 'high' : 'low'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
            width={bannerDimensions.desktop.width}
            height={bannerDimensions.desktop.height}
            className="w-full h-auto"
            style={{ display: 'block' }}
            onLoad={() => handleImageLoad(banner._id, isLCP)}
            onError={() => handleImageError(banner._id)}
          />
        </picture>
      </div>
    );
  }, [bannerDimensions, getOptimizedImageUrl, renderBannerSkeleton, imageLoadedStates, handleImageLoad, handleImageError, isMobile, renderMobileBanner]);

  const resolvedBanners = banners.length ? banners : staticBanners;
  const firstBanner = resolvedBanners[0];
  const sliderKey = useMemo(() => {
    const ids = (resolvedBanners || []).map(b => b?._id || '').join('-');
    return `slider-${resolvedBanners.length}-${ids}`;
  }, [resolvedBanners]);

  // Prefetch/preload removed per request to stabilize LCP and avoid duplicate downloads

  const renderDots = useCallback(() => (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20">
      <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 shadow-md backdrop-blur-[2px]">
        {resolvedBanners.map((_, index) => (
          <button
            key={index}
            className="w-3 h-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/40"
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
            type="button"
            style={{ backgroundColor: index === currentSlide ? '#f59e0b' : 'rgba(255,255,255,0.7)' }}
          />
        ))}
      </div>
    </div>
  ), [resolvedBanners, currentSlide, handleDotClick]);

  // if (error) {
  //     return (
  //         <div className="w-full py-8 text-center text-red-500">
  //         </div>
  //     );
  // }

  // Never show loading skeleton - always show static banners immediately
  // if (loading && !resolvedBanners.length) {
  //   return (
  //     <div className="relative w-full mx-auto">
  //       <div className="relative w-full">
  //         {renderBannerSkeleton()}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div ref={containerRef} className="relative w-full mx-auto" style={{ height: 'auto', overflow: 'visible' }}>
      <div className="relative w-full" style={{ height: 'auto', overflow: 'visible' }}>
        {!mountSlider ? (
          <div className="w-full" style={{ height: 'auto', overflow: 'visible' }}>
            <a
              href={firstBanner?.link || '#'}
              className="block w-full group"
              target="_self"
              rel="noopener noreferrer"
              style={{ height: 'auto' }}
            >
              {firstBanner ? renderBannerImage(firstBanner, 0) : renderBannerImage(staticBanners[0], 0)}
            </a>
          </div>
        ) : (
          <div ref={sliderContainerRef} className="keen-slider">
            {resolvedBanners.map((banner, index) => (
              <div key={banner._id} className="keen-slider__slide">
                <a
                  href={banner.link}
                  className="block w-full group"
                  target="_self"
                  rel="noopener noreferrer"
                >
                  {renderBannerImage(banner, index)}
                </a>
              </div>
            ))}
          </div>
        )}
        {mountSlider && resolvedBanners.length > 1 && renderDots()}
      </div>
    </div>
  );
});

Banner.displayName = 'Banner';

export default Banner;
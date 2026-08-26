import React, { useState, useEffect, useRef, Suspense } from 'react';

// Lazy load the full Banner component
const Banner = React.lazy(() => import('./Banner'));

// Lightweight placeholder component for immediate LCP
const BannerPlaceholder = ({ firstBanner }) => {
  return (
    <div className="banner-container">
      {firstBanner ? (
        <img
          src={firstBanner.image}
          alt={firstBanner.alt}
          className="banner-image"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
          width="1920"
          height="550"
          onLoad={() => {
            // Mark LCP as loaded
            if (typeof window !== 'undefined' && window.performance?.mark) {
              window.performance.mark('lcp-banner-loaded');
            }
          }}
        />
      ) : (
        <div className="banner-skeleton" />
      )}
    </div>
  );
};

const LazyBanner = () => {
  const [shouldLoadFull, setShouldLoadFull] = useState(false);
  const [firstBanner, setFirstBanner] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load first banner data immediately for LCP
    const staticBanners = [
      {
        _id: 'custom1',
        image: '/customBanner1.webp',
        link: '#',
        alt: 'Custom Banner 1',
      }
    ];
    
    setFirstBanner(staticBanners[0]);

    // Load full banner component after critical rendering
    timeoutRef.current = setTimeout(() => {
      setShouldLoadFull(true);
    }, 100); // Small delay to ensure LCP renders first

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // If full banner should load, render it
  if (shouldLoadFull) {
    return (
      <Suspense fallback={<BannerPlaceholder firstBanner={firstBanner} />}>
        <Banner />
      </Suspense>
    );
  }

  // Otherwise, render lightweight placeholder
  return <BannerPlaceholder firstBanner={firstBanner} />;
};

export default LazyBanner;

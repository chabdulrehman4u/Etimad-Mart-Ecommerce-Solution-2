import React, { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Banner from '../components/Banner';
import { FaWhatsapp } from 'react-icons/fa';
import websiteSchema from '../helpers/getWebsiteSchema';
import organizationSchema from '../helpers/getOrgSchema';
import useFacebookPixel from '../hooks/useFacebookPixel';
import useTikTokPixel from '../hooks/useTikTokPixel';
import { getCachedHomepageData } from '../functions/homepage';

// Direct core homepage components for instant rendering without chunk lag
import Categories from '../components/Categories';
import Brands from '../components/Brands';
import FeaturedProducts from '../components/FeaturedProducts';
import NewArrivals from '../components/NewArrivals';
import BestSellers from '../components/BestSellers';
import ShowcaseCategories from '../components/ShowcaseCategories';
import Marquee from 'react-fast-marquee';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton';
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Product section skeleton that matches actual layout
const ProductSectionSkeleton = ({ count = 8, layout = 'horizontal' }) => {
  return (
    <div className="w-full px-1 mt-4 overflow-hidden md:px-4 lg:px-6">
      {/* Section heading skeleton */}
      <div className="flex items-center justify-center w-full px-5 mb-4 md:mb-7">
        <div className="flex-grow h-[0.5px] mr-4 bg-gray-200"></div>
        <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
        <div className="flex-grow h-[0.5px] ml-4 bg-gray-200"></div>
      </div>

      {/* Products skeleton */}
      {layout === 'horizontal' ? (
        <div className="flex gap-2 lg:gap-0 overflow-x-auto scrollbar-hide px-1 lg:px-0">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="shrink-0 w-[250px] px-1 lg:px-0 py-2">
              <Suspense fallback={<div className="w-full h-[350px] bg-gray-200 animate-pulse rounded"></div>}>
                <ProductCardSkeleton />
              </Suspense>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mx-0 md:grid-cols-3 lg:grid-cols-5 md:gap-6 lg:gap-7 md:mx-4 lg:mx-4">
          {Array.from({ length: count }).map((_, index) => (
            <Suspense key={index} fallback={<div className="w-full h-[350px] bg-gray-200 animate-pulse rounded"></div>}>
              <ProductCardSkeleton />
            </Suspense>
          ))}
        </div>
      )}
    </div>
  );
};

// Intersection Observer Hook for lazy loading sections
const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
};

// Optimized Section Component with suspense loading
const LazySection = ({ children, fallback, className = '' }) => {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
};

const showcaseCategories = [
  {
    slug: "trimmers-and-shavers",
    name: "Trimmers and Shavers",
    image: "/trimmer.webp",
  },
  // {
  //   slug: "mehndi-stickers", 
  //   name: "Mehndi Stickers",
  //   image: "/mehndi.webp",
  // },
  {
    slug: "beauty-and-personal-care",
    name: "Beauty & Personal Care",
    image: "/beauty.webp"
  }
];

const Home = () => {
  // Performance optimization: Preload critical data
  const [criticalDataLoaded, setCriticalDataLoaded] = useState(false);
  const { track } = useFacebookPixel();
  const { track: trackTikTok } = useTikTokPixel();

  useEffect(() => {
    // Immediately start fetching all homepage data on mount
    getCachedHomepageData();

    // Mark when critical above-the-fold content is ready
    const timer = setTimeout(() => {
      setCriticalDataLoaded(true);
      // Dispatch custom event for performance monitoring
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-ready'));
        if (window.performance?.mark) {
          window.performance.mark('critical-content-loaded');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Components will fetch from the cached homepage response themselves

  // Preload next sections when user scrolls
  const handleScroll = useCallback(() => {
    if (window.scrollY > 200) {
      // Start preloading below-the-fold content
      import('../components/Brands');
      import('../components/FeaturedProducts');
      import('../components/NewArrivals');
      import('../components/BestSellers');
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <Helmet>
        <meta name="description" content="Etimad Mart – trusted online store in Pakistan. Shop top-quality grooming tools, trimmers & shavers, fashion wear, kitchen & household items with great deals." />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>

        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preload" as="image" href="/trimmer.webp" />
        <link rel="preload" as="image" href="/mehndi.webp" />
        <link rel="preload" as="image" href="/beauty.webp" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/customBanner1.webp" fetchpriority="high" />

        {/* Font optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" media="print" onLoad="this.media='all'" />

        {/* Critical CSS for above-the-fold content */}
        <style>{`
          .hero-section { min-height: 400px; }
          .showcase-categories { min-height: 300px; }
          .critical-text { font-display: swap; }
          
          /* Critical layout styles */
          .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          @media (min-width: 768px) { .product-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; } }
          @media (min-width: 1024px) { .product-grid { grid-template-columns: repeat(5, 1fr); gap: 1.75rem; } }
          
          /* Prevent layout shift */
          .product-card { aspect-ratio: 1; min-height: 300px; }
          .brand-logo { aspect-ratio: 1; }
          
          /* Critical animations */
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .fade-in { animation: fadeIn 0.3s ease-out; }
        `}</style>

        {/* Preload critical backend API */}
        <link rel="preconnect" href="https://etimad-mart-api.onrender.com" />
      </Helmet>

      {/* Hidden H1 for SEO */}
      <h1 className="hidden">
        Etimad Mart - Best Online Shopping store in Pakistan
      </h1>

      {/* Critical above-the-fold content */}
      <Banner />

      {/* Categories - Load immediately as it's above the fold */}
      <LazySection
        fallback={<SectionSkeleton height="h-32 md:h-48" />}
        height="480px"
      >
        <Categories />
      </LazySection>

      {/* Marquee - Low priority */}
      <LazySection
        fallback={<div className="h-16 bg-gray-100 animate-pulse rounded my-4"></div>}
        height="64px"
      >
        <Marquee
          speed={50}
          pauseOnHover
          direction="left"
          gradient={false}
          className="text-2xl md:text-3xl font-semibold md:font-extrabold my-2 md:my-8 text-primary"
        >
          <div className="flex items-center font-roboto space-x-10 md:space-x-16">
            <span className="px-4">🔥 Cash On Delivery 🔥</span>
            <span className="px-4">📦 Open Parcel Allowed</span>
            <span className="px-4">☎️ 24/7 Support</span>
            <span className="px-4">🚚 Fast Delivery All Over Pakistan</span>
          </div>
        </Marquee>


      </LazySection>

      {/* Brands - Second priority */}
      <LazySection
        fallback={<SectionSkeleton height="h-32 md:h-40" />}
        height="480px"
      >
        <Brands />
      </LazySection>

      {/* Featured Products - Third priority */}
      <LazySection
        fallback={<ProductSectionSkeleton count={8} layout="horizontal" />}
        height="640px"
      >
        <FeaturedProducts />
      </LazySection>

      {/* New Arrivals - Fourth priority */}
      <LazySection
        fallback={<ProductSectionSkeleton count={8} layout="horizontal" />}
        height="640px"
      >
        <NewArrivals />
      </LazySection>

      {/* Best Sellers - Fifth priority */}
      <LazySection
        fallback={<ProductSectionSkeleton count={5} layout="grid" />}
        height="800px"
      >
        <BestSellers />
      </LazySection>

      {/* Showcase Categories - Lowest priority */}
      <LazySection
        fallback={<SectionSkeleton />}
        height="600px"
      >
        {showcaseCategories.map(cat => (
          <ShowcaseCategories
            key={cat.slug}
            categorySlug={cat.slug}
            categoryName={cat.name}
            categoryImage={cat.image}
          />
        ))}
      </LazySection>

      {/* WhatsApp Floating Icon - Load after critical content */}
      {criticalDataLoaded && (
        <a
          href="https://wa.me/+923071111832?text=Hello%2C%20I%20have%20a%20question%20regarding%20a%20product%20on%20Etimad%20Mart.%20Can%20you%20please%20assist%20me%3F"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-green-600 text-white rounded-full w-14 h-14 md:h-16 md:w-16 flex items-center justify-center shadow-lg hover:bg-green-800 transition-colors duration-300 z-50"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          onClick={() => {
            // Track StartConversation event
            track('StartConversation', {
              content_name: 'WhatsApp Contact',
              content_category: 'Customer Support',
              source: 'homepage_floating_button'
            });
            // TikTok Pixel StartConversation event
            trackTikTok('StartConversation', {
              content_name: 'WhatsApp Contact',
              content_category: 'Customer Support',
              source: 'homepage_floating_button'
            });
          }}
        >
          <FaWhatsapp className="text-3xl" size={36} />
        </a>
      )}
    </>
  );
};

export default Home;

// Optimized homepage data fetching - Single API call instead of multiple

import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Single function to get all homepage data
// Accept optional pagination params for featured/new/best sections
// params: { featuredPage, featuredLimit, newPage, newLimit, bestPage, bestLimit }
export const getHomepageData = async (params = {}) => {
  try {
    const url = `${BASE_URL}/homepage-data`;
    const response = await axios.get(url, {
      // mirror previous query building via axios params
      params: {
        featuredPage: params.featuredPage || undefined,
        featuredLimit: params.featuredLimit || undefined,
        newPage: params.newPage || undefined,
        newLimit: params.newLimit || undefined,
        bestPage: params.bestPage || undefined,
        bestLimit: params.bestLimit || undefined,
      },
      headers: { 'Content-Type': 'application/json' },
      // Allow enough time for backend cold starts
      timeout: 45000,
      // no credentials needed; public endpoint
      withCredentials: false,
    });

    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch homepage data');
    }

    return data;
  } catch (error) {
    console.error('Homepage data fetch failed:', error);
    throw error;
  }
};

// Public API surface (kept):
// - getHomepageData(params)
// - getCachedHomepageData()
// - getFeaturedProducts(page, limit)
// - getNewProducts(page, limit)
// - getBestSellers(page, limit)
// - getShowcaseProducts(categorySlug)
// - getHomepageCategories(), getHomepageBrands(), getHomepageBanners(), getHomepageTopbar(), getHomepageMenuCategories()

export const getFeaturedProducts = async (page = 1, limit = 8) => {
  try {
    const data = page === 1 ? await getCachedHomepageData() : await getHomepageData({ featuredPage: page, featuredLimit: limit });
    const meta = data?.data?.metadata?.featuredProducts || {};
    return {
      products: data?.data?.featuredProducts || [],
      totalProducts: meta.totalProducts ?? data?.data?.featuredProducts?.length ?? 0,
      totalPages: meta.totalPages ?? 1,
      currentPage: meta.currentPage ?? page,
      limit: meta.limit ?? limit,
    };
  } catch (error) {
    console.error('Featured products fetch failed:', error);
    return { products: [], totalProducts: 0, totalPages: 1, currentPage: page, limit };
  }
};

export const getNewProducts = async (page = 1, limit = 8) => {
  try {
    const data = page === 1 ? await getCachedHomepageData() : await getHomepageData({ newPage: page, newLimit: limit });
    const meta = data?.data?.metadata?.newProducts || {};
    return {
      products: data?.data?.newProducts || [],
      totalProducts: meta.totalProducts ?? data?.data?.newProducts?.length ?? 0,
      totalPages: meta.totalPages ?? 1,
      currentPage: meta.currentPage ?? page,
      limit: meta.limit ?? limit,
    };
  } catch (error) {
    console.error('New products fetch failed:', error);
    return { products: [], totalProducts: 0, totalPages: 1, currentPage: page, limit };
  }
};

export const getBestSellers = async (page = 1, limit = 5) => {
  try {
    const data = page === 1 ? await getCachedHomepageData() : await getHomepageData({ bestPage: page, bestLimit: limit });
    const meta = data?.data?.metadata?.bestSellers || {};
    return {
      products: data?.data?.bestSellers || [],
      totalProducts: meta.totalProducts ?? data?.data?.bestSellers?.length ?? 0,
      totalPages: meta.totalPages ?? 1,
      currentPage: meta.currentPage ?? page,
      limit: meta.limit ?? limit,
    };
  } catch (error) {
    console.error('Best sellers fetch failed:', error);
    return { products: [], totalProducts: 0, totalPages: 1, currentPage: page, limit };
  }
};

export const getShowcaseProducts = async (categorySlug) => {
  try {
    const data = await getCachedHomepageData();
    return data?.data?.showcaseCategories?.[categorySlug] || [];
  } catch (error) {
    console.error(`Showcase products fetch failed for ${categorySlug}:`, error);
    return [];
  }
};

// Performance monitoring function
export const logPerformanceMetrics = (startTime, endTime, dataSize) => {
  const loadTime = endTime - startTime;
  // console.log('Homepage Performance Metrics:', {
  //   loadTime: `${loadTime}ms`,
  //   dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
  //   timestamp: new Date().toISOString()
  // });

  // Send to analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_load_time', {
      event_category: 'Performance',
      event_label: 'Homepage',
      value: loadTime
    });
  }
};

// Cache management
let homepageDataCache = null;
let cacheTimestamp = null;
let pendingHomepageRequest = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedHomepageData = async () => {
  const now = Date.now();
  // Return cached response if still fresh
  if (homepageDataCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return homepageDataCache;
  }

  // If a request is already in-flight, return the same promise to prevent duplicate API calls
  if (pendingHomepageRequest) {
    return pendingHomepageRequest;
  }

  const startTime = performance.now();
  pendingHomepageRequest = getHomepageData()
    .then((data) => {
      const endTime = performance.now();
      homepageDataCache = data;
      cacheTimestamp = Date.now();
      const dataSize = JSON.stringify(data).length;
      logPerformanceMetrics(startTime, endTime, dataSize);
      return data;
    })
    .finally(() => {
      pendingHomepageRequest = null;
    });

  return pendingHomepageRequest;
};

// Load homepage data with params but still take advantage of simple client-side caching per-URL
export const loadHomepageWithParams = async (params = {}) => {
  const startTime = performance.now();
  const data = await getHomepageData(params);
  const endTime = performance.now();
  const dataSize = JSON.stringify(data).length;
  logPerformanceMetrics(startTime, endTime, dataSize);
  return data;
};

// Clear cache function
export const clearHomepageCache = () => {
  homepageDataCache = null;
  cacheTimestamp = null;
  console.log('Homepage cache cleared');
};

// Simple selectors that read from the cached homepage response (no params)

// Categories and Brands selectors
export const getHomepageCategories = async () => {
  try {
    const data = await getCachedHomepageData();
    return data.data?.categories || [];
  } catch (e) {
    console.error('getHomepageCategories failed:', e);
    return [];
  }
};

export const getHomepageBrands = async () => {
  try {
    const data = await getCachedHomepageData();
    return data.data?.brands || [];
  } catch (e) {
    console.error('getHomepageBrands failed:', e);
    return [];
  }
};

export const getHomepageBanners = async () => {
  try {
    const data = await getCachedHomepageData();
    return data.data?.banners || [];
  } catch (e) {
    console.error('getHomepageBanners failed:', e);
    return [];
  }
};

export const getHomepageTopbar = async () => {
  try {
    const data = await getCachedHomepageData();
    return data.data?.topbar || null;
  } catch (e) {
    console.error('getHomepageTopbar failed:', e);
    return null;
  }
};

export const getHomepageMenuCategories = async () => {
  try {
    const data = await getCachedHomepageData();
    return data.data?.menuCategories || [];
  } catch (e) {
    console.error('getHomepageMenuCategories failed:', e);
    return [];
  }
};

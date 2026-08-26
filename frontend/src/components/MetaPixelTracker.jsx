// src/components/MetaPixelTracker.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const MetaPixelTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    // Avoid duplicate tracking - this component might be redundant if useFacebookPixel is used
    if (lastTrackedPath.current === location.pathname) {
      return;
    }

    // Defer to idle to avoid blocking rendering
    const trackPageView = () => {
      if (window.fbq && typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'PageView');
          lastTrackedPath.current = location.pathname;
        } catch (error) {
          console.warn('MetaPixelTracker error:', error);
        }
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(trackPageView, { timeout: 1000 });
    } else {
      setTimeout(trackPageView, 100);
    }
  }, [location.pathname]);

  return null;
};

export default MetaPixelTracker;
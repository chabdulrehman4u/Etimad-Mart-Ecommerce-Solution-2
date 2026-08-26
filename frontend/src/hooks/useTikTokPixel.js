import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

const useTikTokPixel = () => {
  const location = useLocation();
  const lastTrackedPath = useRef(null);

  // Automatically track PageView on route change (with deduplication)
  useEffect(() => {
    // Avoid duplicate tracking for same path
    if (lastTrackedPath.current === location.pathname) {
      return;
    }

    // Use requestIdleCallback to avoid blocking main thread
    const trackPageView = () => {
      if (window.ttq && typeof window.ttq.page === 'function') {
        window.ttq.page();
        lastTrackedPath.current = location.pathname;
      }
    };

    // Defer tracking to idle time or fallback to timeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(trackPageView, { timeout: 1000 });
    } else {
      setTimeout(trackPageView, 100);
    }
  }, [location.pathname]);

  // Optimized reusable function to track any TikTok event
  const track = useCallback((event, data = {}) => {
    // Validate inputs
    if (!event || typeof event !== 'string') {
      console.warn('TikTok Pixel: Invalid event name');
      return;
    }

    // Enhanced debug logging
    const isProduction = window.location.hostname !== 'localhost' && 
                        !window.location.hostname.includes('127.0.0.1');

    // Track event function
    const trackEvent = () => {
      // ttq is an object with methods, not a function
      if (window.ttq && typeof window.ttq.track === 'function') {
        try {
          // Map common e-commerce events to TikTok standard events
          const eventMapping = {
            'ViewContent': 'ViewContent',
            'AddToCart': 'AddToCart',
            'InitiateCheckout': 'InitiateCheckout',
            'Purchase': 'CompletePayment',
            'CompletePayment': 'CompletePayment',
            'StartConversation': 'StartConversation'
          };

          const tiktokEvent = eventMapping[event] || event;
          
          // Clean event data - only keep TikTok-supported fields
          const eventData = {};
          if (data.content_id) eventData.content_id = data.content_id;
          if (data.content_ids) eventData.content_id = data.content_ids[0]; // TikTok uses singular
          if (data.content_name) eventData.content_name = data.content_name;
          if (data.content_type) eventData.content_type = data.content_type;
          if (data.value) eventData.value = parseFloat(data.value);
          if (data.currency) eventData.currency = data.currency;
          if (data.quantity) eventData.quantity = parseInt(data.quantity);
          if (data.num_items) eventData.quantity = parseInt(data.num_items);
          
          // Track the event
          window.ttq.track(tiktokEvent, eventData);
        } catch (error) {
          console.warn('❌ TikTok Pixel tracking error:', error);
        }
      }
    };

    // Critical events (Purchase, AddToCart) track immediately
    const criticalEvents = ['Purchase', 'CompletePayment', 'AddToCart', 'InitiateCheckout'];
    if (criticalEvents.includes(event)) {
      // Purchase events: Track immediately, no delay
      if (event === 'Purchase' || event === 'CompletePayment') {
        trackEvent();
      } else {
        // Other critical events: Small delay
        setTimeout(trackEvent, 50);
      }
    } else {
      // Non-critical events can be deferred
      if (window.requestIdleCallback) {
        window.requestIdleCallback(trackEvent, { timeout: 2000 });
      } else {
        setTimeout(trackEvent, 200);
      }
    }
  }, []);

  return { track };
};

export default useTikTokPixel;

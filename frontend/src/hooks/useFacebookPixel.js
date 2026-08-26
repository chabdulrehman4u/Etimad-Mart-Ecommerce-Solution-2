import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

const useFacebookPixel = () => {
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
      if (window.fbq && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
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

  // Optimized reusable function to track any event
  const track = useCallback((event, data = {}) => {
    // Validate inputs
    if (!event || typeof event !== 'string') {
      console.warn('Facebook Pixel: Invalid event name');
      return;
    }

    // Enhanced debug logging for production troubleshooting
    const isProduction = window.location.hostname !== 'localhost' && 
                        !window.location.hostname.includes('127.0.0.1');
    
    // Always log Purchase events for debugging
    if (event === 'Purchase') {
      console.log('💰 Purchase Event Tracking:', {
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
        domain: window.location.hostname,
        event: event,
        data: data
      });
    }
    
    if (isProduction && event === 'Purchase') {
      console.log('🚀 PRODUCTION Purchase Event:', data, 'Domain:', window.location.hostname);
    }

    if (isProduction) {
      // console.log('🚀 PRODUCTION Meta Pixel Event:', event, data, 'Domain:', window.location.hostname);
    } else {
      // console.log('🎯 DEV Meta Pixel Event:', event, data);
    }

    // Use requestIdleCallback for non-critical events
    const trackEvent = () => {
      console.log('🔍 trackEvent called - fbq available:', typeof window.fbq);
      
      if (window.fbq && typeof window.fbq === 'function') {
        try {
          // Clean event data - remove problematic fields that can cause activation issues
          const cleanData = { ...data };
          
          // Remove fields that might cause issues in production
          delete cleanData.user_agent;
          delete cleanData.timestamp;
          delete cleanData.referrer;
          delete cleanData.source;
          delete cleanData.domain;
          delete cleanData.page_url;
          
          // Only keep essential e-commerce fields
          const eventData = {};
          if (cleanData.content_ids) eventData.content_ids = cleanData.content_ids;
          if (cleanData.content_name) eventData.content_name = cleanData.content_name;
          if (cleanData.content_type) eventData.content_type = cleanData.content_type;
          if (cleanData.value) eventData.value = parseFloat(cleanData.value);
          if (cleanData.currency) eventData.currency = cleanData.currency;
          if (cleanData.num_items) eventData.num_items = parseInt(cleanData.num_items);
          
          // console.log('🚀 About to send event:', event, eventData);
          
          // Use trackSingle for more reliable delivery with specific pixel ID
          // console.log('🎯 Using trackSingle for reliable delivery');
          window.fbq('trackSingle', '4178050992439851', event, eventData);
          
          // Also try standard track as backup
          try {
            window.fbq('track', event, eventData);
          } catch (trackError) {
            console.warn('⚠️ Standard track failed, but trackSingle should work:', trackError);
          }
          
          // Verify the request was sent by checking network activity
          setTimeout(() => {
            const fbRequests = performance.getEntriesByName('https://www.facebook.com/tr');
            // console.log('🌐 Facebook network requests found:', fbRequests.length);
            if (fbRequests.length === 0) {
              // console.warn('⚠️ No Facebook network requests detected - events may not be reaching Facebook');
            }
          }, 1000);
          
          if (isProduction) {
            // console.log('✅ PRODUCTION Event Sent:', event, 'Domain:', window.location.hostname);
            // console.log('📊 Clean Event Data:', eventData);
            // console.log('🔍 Check Network tab for requests to facebook.com/tr');
          } else {
            // console.log('✅ DEV Event Sent:', event, eventData);
          }
        } catch (error) {
          console.warn('❌ Facebook Pixel tracking error:', error);
        }
      } else {
        console.warn('❌ Facebook Pixel not loaded. Event queued:', event, data);
        // Queue the event for when fbq becomes available
        window.fbq = window.fbq || function(){ (window.fbq.q = window.fbq.q || []).push(arguments); };
        window.fbq('track', event, data);
      }
    };

    // Critical events (Purchase, AddToCart) track IMMEDIATELY for reliable delivery
    const criticalEvents = ['Purchase', 'AddToCart', 'InitiateCheckout'];
    if (criticalEvents.includes(event)) {
      // Purchase events: Track immediately, no delay
      if (event === 'Purchase') {
        console.log('💰 Tracking Purchase IMMEDIATELY (no delay)');
        trackEvent(); // Execute immediately
      } else {
        // Other critical events: Small delay to ensure pixel is ready
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

export default useFacebookPixel;
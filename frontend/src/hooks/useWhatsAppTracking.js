import { useCallback } from "react";

const useWhatsAppTracking = () => {
  // Track WhatsApp events
  const trackWhatsAppEvent = useCallback((eventName, data = {}) => {
    // Check if gtag is available (Google Analytics)
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'WhatsApp',
        event_label: data.product_name || data.action || 'WhatsApp Interaction',
        value: data.value || 0,
        currency: data.currency || 'PKR',
        items: data.items || [],
        ...data
      });
    }

    // Check if fbq is available (Facebook Pixel)
    if (window.fbq) {
      window.fbq('track', 'CustomEvent', {
        event_name: eventName,
        event_category: 'WhatsApp',
        content_name: data.product_name || data.action,
        value: data.value || 0,
        currency: data.currency || 'PKR',
        content_ids: data.content_ids || [],
        ...data
      });
    }

    // Log to console for debugging
    console.log(`WhatsApp Event: ${eventName}`, data);
  }, []);

  // Specific tracking functions
  const trackWhatsAppAddToCart = useCallback((productData) => {
    trackWhatsAppEvent('whatsapp_add_to_cart', {
      product_name: productData.title,
      product_id: productData._id,
      price: productData.price,
      currency: 'PKR',
      content_ids: [productData._id],
      action: 'Add to Cart via WhatsApp'
    });
  }, [trackWhatsAppEvent]);

  const trackWhatsAppOrder = useCallback((productData) => {
    trackWhatsAppEvent('whatsapp_order', {
      product_name: productData.title,
      product_id: productData._id,
      price: productData.price,
      currency: 'PKR',
      content_ids: [productData._id],
      action: 'Order via WhatsApp'
    });
  }, [trackWhatsAppEvent]);

  const trackWhatsAppConversation = useCallback((data) => {
    trackWhatsAppEvent('whatsapp_conversation_start', {
      value: data.value || 0,
      currency: data.currency || 'PKR',
      num_items: data.num_items || 0,
      content_ids: data.content_ids || [],
      action: 'Start WhatsApp Conversation'
    });
  }, [trackWhatsAppEvent]);

  return {
    trackWhatsAppEvent,
    trackWhatsAppAddToCart,
    trackWhatsAppOrder,
    trackWhatsAppConversation
  };
};

export default useWhatsAppTracking; 
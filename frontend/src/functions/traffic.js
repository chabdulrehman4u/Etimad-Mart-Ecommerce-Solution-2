import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Persisted visitor identifier for accurate dedupe (privacy-safe hash on server)
const VISITOR_KEY = 'em_visitor_id';
const LAST_VISIT_KEY = 'em_last_visit_day'; // YYYY-MM-DD to throttle client calls
const getVisitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      // Prefer crypto.randomUUID when available
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      }
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (_) {
    // Fallback non-persistent id (still helps within session)
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export const recordVisit = async ({ path, referer } = {}) => {
  try {
    // Client-side throttle: only once per day per device
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      const last = localStorage.getItem(LAST_VISIT_KEY);
      if (last === todayKey) {
        return { success: true, skipped: 'already-recorded-today' };
      }
    } catch (_) {}

    const payload = {
      path: path || window.location.pathname,
      referer: referer || document.referrer || '',
      userAgent: navigator.userAgent,
      visitorId: getVisitorId(),
    };
    const res = await axios.post(`${BASE_URL}/traffic/visit`, payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    // Mark as recorded for today
    try { localStorage.setItem(LAST_VISIT_KEY, todayKey); } catch (_) {}
    return res?.data;
  } catch (err) {
    // Silently ignore tracking errors
    if (process.env.NODE_ENV === 'development') {
      console.debug('recordVisit failed', err?.response?.data || err?.message);
    }
    return null;
  }
};

export const recordProductView = async (productId, { referer } = {}) => {
  if (!productId) return null;
  try {
    const payload = {
      referer: referer || document.referrer || '',
      userAgent: navigator.userAgent,
      visitorId: getVisitorId(),
    };
    const res = await axios.post(`${BASE_URL}/traffic/product-view/${productId}`, payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return res?.data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('recordProductView failed', err?.response?.data || err?.message);
    }
    return null;
  }
};

export const getTrafficSummary = async (params = {}) => {
  try {
    const res = await axios.get(`${BASE_URL}/traffic/summary`, {
      params,
      withCredentials: true,
    });
    return res?.data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('getTrafficSummary failed', err?.response?.data || err?.message);
    }
    return null;
  }
};

export const getProductTrafficSeries = async (productId, params = {}) => {
  if (!productId) return null;
  try {
    const res = await axios.get(`${BASE_URL}/traffic/product/${productId}/series`, {
      params,
      withCredentials: true,
    });
    return res?.data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('getProductTrafficSeries failed', err?.response?.data || err?.message);
    }
    return null;
  }
};

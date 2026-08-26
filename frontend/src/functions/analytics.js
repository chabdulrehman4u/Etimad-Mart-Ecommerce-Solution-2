import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// GET /analytics/dashboard
export const getDashboardAnalytics = async () => {
  const res = await axios.get(`${BASE_URL}/analytics/dashboard`, { withCredentials: true });
  return res?.data;
};

// GET /analytics/orders?from&to&interval=day|week|month
export const getOrdersAnalytics = async (params = {}) => {
  const { from, to, interval = 'day' } = params;
  const q = new URLSearchParams();
  if (from) q.append('from', from);
  if (to) q.append('to', to);
  if (interval) q.append('interval', interval);
  const res = await axios.get(`${BASE_URL}/analytics/orders?${q.toString()}`, { withCredentials: true });
  return res?.data;
};

// GET /analytics/orders/status-summary?from&to
export const getOrderStatusSummary = async (params = {}) => {
  const { from, to } = params;
  const q = new URLSearchParams();
  if (from) q.append('from', from);
  if (to) q.append('to', to);
  const res = await axios.get(`${BASE_URL}/analytics/orders/status-summary?${q.toString()}`, { withCredentials: true });
  return res?.data;
};

// GET /analytics/users?from&to&interval
export const getUsersAnalytics = async (params = {}) => {
  const { from, to, interval = 'day' } = params;
  const q = new URLSearchParams();
  if (from) q.append('from', from);
  if (to) q.append('to', to);
  if (interval) q.append('interval', interval);
  const res = await axios.get(`${BASE_URL}/analytics/users?${q.toString()}`, { withCredentials: true });
  return res?.data;
};

// GET /analytics/inventory/low-stock?lt&limit
export const getLowStock = async (params = {}) => {
  const { lt = 10, limit = 10 } = params;
  const res = await axios.get(`${BASE_URL}/analytics/inventory/low-stock?lt=${lt}&limit=${limit}`, { withCredentials: true });
  return res?.data;
};

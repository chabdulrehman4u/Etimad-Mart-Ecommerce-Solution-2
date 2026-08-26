import axios from 'axios';
import { BASE_URL } from '../config/baseURL';

// Create logo (multipart: image + fields)
export const createLogo = async ({ image, isEnable = true }) => {
  const form = new FormData();
  if (image) form.append('image', image);
  form.append('isEnable', String(isEnable));
  const res = await axios.post(`${BASE_URL}/logo/create`, form, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data;
};

// Update logo by id (multipart if image provided)
export const updateLogo = async (id, { image, isEnable }) => {
  const form = new FormData();
  if (image) form.append('image', image);
  if (typeof isEnable !== 'undefined') form.append('isEnable', String(isEnable));
  const res = await axios.put(`${BASE_URL}/logo/${id}`, form, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data;
};

// Get logo for storefront (public)
export const getUserLogo = async () => {
  const res = await axios.get(`${BASE_URL}/logo/user`, { withCredentials: true });
  return res?.data;
};

// Get all admin logos (protected)
export const getAdminLogos = async () => {
  const res = await axios.get(`${BASE_URL}/logo/admin`, { withCredentials: true });
  return res?.data;
};

// Delete logo by id
export const deleteLogo = async (id) => {
  const res = await axios.delete(`${BASE_URL}/logo/${id}`, { withCredentials: true });
  return res?.data;
};

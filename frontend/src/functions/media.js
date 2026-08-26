import { BASE_URL } from '../config/baseURL';

const API_BASE = `${BASE_URL}/media`;

export const uploadImage = async (file, type = 'page-media') => {
  const form = new FormData();
  form.append('image', file);
  form.append('type', type);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json(); // { url, public_id }
};

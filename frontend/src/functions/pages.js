import { BASE_URL } from '../config/baseURL';

const API_BASE = `${BASE_URL}/page`;

export const getAllPages = async () => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
};

export const getPageBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/${slug}`);
  if (!res.ok) throw new Error('Page not found');
  return res.json();
};

export const createPage = async (data) => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create page');
  return res.json();
};

export const updatePage = async (id, data) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update page');
  return res.json();
};

export const deletePage = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete page');
  return res.json();
}; 
import { BASE_URL } from '../config/baseURL';

const API_BASE = `${BASE_URL}/blog`;

// Admin functions
export const getAllBlogs = async () => {
  const res = await fetch(`${API_BASE}/admin/all`);
  if (!res.ok) throw new Error('Failed to fetch blogs');
  return res.json();
};

export const getBlogById = async (id) => {
  const res = await fetch(`${API_BASE}/admin/${id}`);
  if (!res.ok) throw new Error('Blog not found');
  return res.json();
};

export const createBlog = async (data) => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create blog post');
  return res.json();
};

export const updateBlog = async (id, data) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update blog post');
  return res.json();
};

export const deleteBlog = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete blog post');
  return res.json();
};

// Public functions
export const getPublishedBlogs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/published?${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch published blogs');
  return res.json();
};

export const getBlogBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/${slug}`);
  if (!res.ok) throw new Error('Blog post not found');
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

export const getTags = async () => {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
};

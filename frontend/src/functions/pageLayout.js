import { BASE_URL } from '../config/baseURL';

const API_BASE = `${BASE_URL}/pageLayout`;

export const saveDraft = async ({ slug, type = 'page', layout, seo }) => {
  const res = await fetch(`${API_BASE}/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slug, type, layout, seo }),
  });
  if (!res.ok) throw new Error('Failed to save draft');
  return res.json();
};

export const publishLayout = async ({ slug, layout, seo }) => {
  const res = await fetch(`${API_BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slug, layout, seo }),
  });
  if (!res.ok) throw new Error('Failed to publish layout');
  return res.json();
};

export const getDraftBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/admin/${slug}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Draft not found');
  return res.json();
};

export const getPublishedBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/${slug}`);
  if (!res.ok) throw new Error('Published layout not found');
  return res.json();
};

import { lazy } from 'react';

// Minimal JSON-like schemas for form auto-generation later
// For now, we primarily use defaults; Admin can still edit JSON directly.
export const sectionsRegistry = {
  hero: {
    key: 'hero',
    label: 'Hero',
    component: lazy(() => import('./HeroSection')),
    defaults: {
      type: 'hero',
      settings: {
        title: 'Welcome to Etimad Mart',
        subtitle: 'Top quality products. Great prices.',
        image: '/customBanner1.webp',
        ctaText: 'Shop Now',
        ctaLink: '/shop',
        align: 'center',
      },
    },
    schema: {
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        image: { type: 'string', format: 'image-url' },
        ctaText: { type: 'string' },
        ctaLink: { type: 'string' },
        align: { type: 'string', enum: ['left', 'center', 'right'] },
      },
    },
  },
  'rich-text': {
    key: 'rich-text',
    label: 'Rich Text',
    component: lazy(() => import('./RichTextSection')),
    defaults: {
      type: 'rich-text',
      settings: { html: '<p class="text-center">Editable rich text</p>' },
    },
    schema: {
      properties: {
        html: { type: 'string', format: 'html' },
      },
    },
  },
  'product-grid': {
    key: 'product-grid',
    label: 'Product Grid',
    component: lazy(() => import('./ProductGridSection')),
    defaults: {
      type: 'product-grid',
      settings: { 
        title: 'Products', 
        source: 'featured', 
        limit: 8, 
        page: 1,
        columns: 4,  // Default number of columns (1-6)
        rows: 2,     // Default number of rows (1-10)
      },
    },
    schema: {
      properties: {
        title: { 
          type: 'string',
          title: 'Section Title',
          description: 'The heading to display above the product grid'
        },
        source: { 
          type: 'string', 
          enum: ['featured', 'new-arrivals', 'best-sellers', 'all'],
          title: 'Product Source',
          description: 'Which products to display in this grid'
        },
        limit: { 
          type: 'number',
          minimum: 1,
          maximum: 50,
          title: 'Products per Page',
          description: 'Number of products to show (1-50)'
        },
        columns: {
          type: 'number',
          minimum: 1,
          maximum: 6,
          title: 'Number of Columns',
          description: 'How many columns to show on desktop (1-6)'
        },
        rows: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          title: 'Number of Rows',
          description: 'How many rows to show (1-10)'
        },
        page: { 
          type: 'number',
          minimum: 1,
          title: 'Page Number',
          description: 'Page number for pagination'
        },
      },
      required: ['title', 'source', 'limit', 'columns', 'rows'],
    },
  },
  'banner-grid': {
    key: 'banner-grid',
    label: 'Banner Grid',
    component: lazy(() => import('./BannerGridSection')),
    defaults: {
      type: 'banner-grid',
      settings: {
        columns: 3,
        gap: 12,
        items: [
          { image: '/customBanner1.webp', link: '/shop', title: 'Shop Now' },
          { image: '/customBanner2.webp', link: '/shop', title: 'Deals' },
          { image: '/beauty.webp', link: '/category/beauty-and-personal-care', title: 'Beauty' },
        ],
      },
    },
    schema: {
      properties: {
        columns: { type: 'number' },
        gap: { type: 'number' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string', format: 'image-url' },
              link: { type: 'string' },
              title: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const sectionTypes = Object.keys(sectionsRegistry);

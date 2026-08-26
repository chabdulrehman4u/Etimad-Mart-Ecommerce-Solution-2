// src/helpers/getShopSchema.js
export default function getShopSchema({ name, description, url, products = [] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      "itemListElement": products.map((product, idx) => ({
        "@type": "Product",
        "position": idx + 1,
        "name": product.title,
        "url": `https://www.etimadmart.com/products/${product.slug}`,
        "image": product.images?.[0],
        "description": product.description,
        "sku": product.sku || product._id
      }))
    }
  };
} 
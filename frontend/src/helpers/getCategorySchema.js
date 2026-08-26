// src/helpers/getCategorySchema.js

// Helper to strip HTML tags from a string
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function getCategorySchema({
  name,
  slug,
  description,
  products = [],
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: stripHtml(description),
    url: `https://www.etimadmart.com/category/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, idx) => ({
        "@type": "Product",
        position: idx + 1,
        name: product.title,
        url: `https://www.etimadmart.com/products/${product.slug}`,
        image: product.images?.[0],
        description: stripHtml(product.description),
        sku: product.sku || product._id,
        // Add required offers field for each product
        offers: {
          "@type": "Offer",
          "price": product.price || 0,
          "priceCurrency": "PKR",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          "seller": {
            "@type": "Organization",
            "name": "Etimad Mart"
          },
          "shipping": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": product.freeShipping ? 0 : 250,
              "currency": "PKR"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": 1,
                "maxValue": 2,
                "unitCode": "DAY"
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 2,
                "maxValue": 5,
                "unitCode": "DAY"
              }
            }
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "PK",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 7,
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/FreeReturn"
          }
        },
        // Add brand information
        brand: {
          "@type": "Brand",
          "name": product.brand?.name || "Etimad Mart"
        },
        // Add aggregate rating only when there is at least one review
        ...(
          product.averageRating &&
          Array.isArray(product.reviews) &&
          product.reviews.length > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  "ratingValue": product.averageRating,
                  "reviewCount": product.reviews.length,
                  "bestRating": 5,
                  "worstRating": 1,
                },
              }
            : {}
        )
      })),
    },
  };
}

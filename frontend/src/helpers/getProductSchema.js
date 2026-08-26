// Helper to strip HTML tags from a string
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export const getProductSchemaData = (product, currentPrice) => {
    try {
        const url = typeof window !== 'undefined' ? window.location.href : 'https://etimadmart.com';

        // Collect all images: main product images + variant images
        const mainImages = Array.isArray(product?.images)
            ? product.images.filter(img => typeof img === 'string' && img.startsWith('http'))
            : [];

        // Robust variant image extraction - handle different possible structures
        let variantImages = [];

        if (product?.variants && Array.isArray(product.variants)) {
            product.variants.forEach(variant => {
                if (variant?.values && Array.isArray(variant.values)) {
                    variant.values.forEach(value => {
                        if (value?.image && typeof value.image === 'string' && value.image.startsWith('http')) {
                            variantImages.push(value.image);
                        }
                    });
                }
            });
        }

        const allImages = [...mainImages, ...variantImages];
        const images = allImages.length > 0 ? allImages : ['/default-product-image.jpg'];

        const getBrandName = (brand) => {
            if (!brand || !brand.name) return "Etimad Mart";
            const brandName = brand.name.trim().toLowerCase();
            if (brandName === "no-brand" || brandName === "nobrand" || brandName === "") {
                return "Etimad Mart";
            }
            return brand.name.trim();
        };

        // Generate variant schemas
        const hasVariant = product?.variants?.map(variant => {
            // Get variant-specific images using robust approach
            let variantImages = [];
            if (variant?.values && Array.isArray(variant.values)) {
                variant.values.forEach(value => {
                    if (value?.image && typeof value.image === 'string' && value.image.startsWith('http')) {
                        variantImages.push(value.image);
                    }
                });
            }

            return {
                "@type": "Product",
                "name": `${product?.title} - ${variant.name}`,
                "description": stripHtml(product?.description) || `${product?.title} - ${variant.name}`,
                "image": variantImages.length > 0 ? variantImages : (mainImages.length > 0 ? [mainImages[0]] : ['/default-product-image.jpg']),
                "productGroupID": product?.category?.slug || product?.category?.name || "default-group",
                "url": url,
                "brand": { "@type": "Brand", "name": getBrandName(product?.brand) },
                "offers": {
                    "@type": "Offer",
                    "price": variant.values?.[0]?.price || currentPrice || product.price,
                    "priceCurrency": "PKR",
                    "areaServed": "PK", // ← ADD THIS
                    "availableDeliveryMethod": "http://schema.org/ParcelService",
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    "seller": {
                        "@type": "Organization",
                        "name": "Etimad Mart"
                    },
                    "shippingDetails": {
                        "@type": "OfferShippingDetails",
                        "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": product?.freeShipping ? 0 : (product?.deliveryCharges || 250),
                            "currency": "PKR"
                        },
                        "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "PK"
                        },
                        "deliveryTime": {
                            "@type": "ShippingDeliveryTime",
                            "handlingTime": {
                                "@type": "QuantitativeValue",
                                "minValue": 0,
                                "maxValue": 1,
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
                }
            };
        }) || [];

        // Generate review schemas
        const reviews = product?.reviews?.map(r => ({
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": r.rating || 5,
                "bestRating": 5
            },
            "author": {
                "@type": "Person",
                "name": r.reviewerId?.username || "Anonymous"
            },
            "reviewBody": stripHtml(r.reviewText || ""),
            "datePublished": r.createdAt || new Date().toISOString()
        })) || [];

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product?.title,
            "description": stripHtml(product.description),
            "url": url,
            "image": images,
            "productGroupID": product?.category?.slug || product?.category?.name || "default-group",
            "brand": { "@type": "Brand", "name": getBrandName(product?.brand) },
            "manufacturer": { "@type": "Organization", "name": getBrandName(product?.brand) },
            "category": product?.category?.name,
            "sku": product.slug,
            "mpn": product.slug,
            "gtin": product.slug,
            "offers": {
                "@type": "Offer",
                "price": currentPrice || product.price,
                "priceCurrency": "PKR",
                "areaServed": "PK",
                "availableAtOrFrom": {
                    "@type": "Place",
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": "PK"
                    }
                },
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                "seller": {
                    "@type": "Organization",
                    "name": "Etimad Mart"
                },
                "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": product?.freeShipping ? 0 : (product?.deliveryCharges || 250),
                        "currency": "PKR"
                    },
                    "shippingDestination": {
                        "@type": "DefinedRegion",
                        "addressCountry": "PK"
                    },
                    "deliveryTime": {
                        "@type": "ShippingDeliveryTime",
                        "handlingTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 0,
                            "maxValue": 1,
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
            }
        };

        // Add aggregate rating if reviews exist
        if (product.averageRating && product.reviews && product.reviews.length > 0) {
            schemaData.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": product.averageRating,
                "reviewCount": product.reviews.length,
                "bestRating": 5,
                "worstRating": 1
            };
        }

        // Add reviews if they exist
        if (reviews.length > 0) {
            schemaData.review = reviews;
        }

        // Add variants if they exist
        if (hasVariant.length > 0) {
            schemaData.hasVariant = hasVariant;
        }

        // Ensure we have at least one of the required fields
        if (!schemaData.offers && !schemaData.review && !schemaData.aggregateRating) {
            // Add a basic offer if none exists
            schemaData.offers = {
                "@type": "Offer",
                "price": currentPrice || product.price || 0,
                "priceCurrency": "PKR",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                "seller": {
                    "@type": "Organization",
                    "name": "Etimad Mart"
                }
            };
        }

        return schemaData;
    } catch (error) {
        console.error('Error generating product schema:', error);
        return null;
    }
};

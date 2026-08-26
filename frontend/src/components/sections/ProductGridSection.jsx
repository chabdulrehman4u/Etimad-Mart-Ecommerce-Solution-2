import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFeaturedProducts,
  getNewProducts,
  getBestSellers,
} from "../../functions/homepage";
import {
  getAllProducts,
} from "../../functions/product";

const fetchBySource = async (source, page, limit) => {
  switch (source) {
    case "featured":
      return await getFeaturedProducts(page, limit);
    case "new-arrivals":
      return await getNewProducts(page, limit);
    case "best-sellers":
      return await getBestSellers(page, limit);
    default:
      return await getAllProducts(page, limit);
  }
};

const ProductGridSection = ({ settings = {} }) => {
  const {
    title = "Products",
    source = "featured", // featured | new-arrivals | best-sellers | all
    limit = 8,
    page = 1,
    columns = 4, // Default to 4 columns
    rows = 2,    // Default to 2 rows
  } = settings;

  // Calculate grid columns based on the columns prop
  const gridCols = {
    sm: Math.min(2, columns), // 1-2 columns on mobile
    md: Math.min(3, columns), // 1-3 columns on tablets
    lg: Math.min(8, Math.max(1, columns)), // 1-8 columns on desktop
  };
  
  // Calculate the actual number of products to show (rows × columns, max 8)
  const productsToShow = Math.min(8, rows * columns);
  
  // Calculate the actual limit to request from the API
  const apiLimit = Math.min(limit, productsToShow);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchBySource(source, page, apiLimit);
        // Handle different response formats
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && typeof response === 'object') {
          list = response.products || response.data || response.items || [];
        }
        if (mounted) setItems(list);
      } catch (e) {
        console.error('Error loading products:', e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [source, page, apiLimit]);

  if (loading) {
    return (
      <section className="container mx-auto px-4 my-6">
        <div className="h-8 w-40 bg-gray-100 animate-pulse rounded mb-4" />
        <div className={`grid grid-cols-${gridCols.sm} md:grid-cols-${gridCols.md} lg:grid-cols-${gridCols.lg} gap-3 md:gap-4`}>
          {Array.from({ length: productsToShow }).map((_, i) => (
            <div key={i} className="h-40 md:h-56 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="container mx-auto px-4 my-6">
      {title && <h2 className="text-xl md:text-2xl font-bold text-primary mb-3">{title}</h2>}
      <div className={`grid grid-cols-${gridCols.sm} md:grid-cols-${gridCols.md} lg:grid-cols-${gridCols.lg} gap-3 md:gap-4`}>
        {items.map((p) => (
          <Link
            to={`/product/${p.slug}`}
            key={p._id || p.slug}
            className="no-underline bg-white rounded shadow-sm hover:shadow-md transition p-2"
          >
            <img
              src={p.thumbnail || p.image || p.images?.[0]?.url || "/placeholder.png"}
              alt={p.title}
              className="w-full h-36 md:h-48 object-cover rounded"
              loading="lazy"
            />
            <div className="mt-2">
              <div className="text-sm md:text-base text-secondary line-clamp-2">{p.title}</div>
              {p.price != null && (
                <div className="text-primary font-semibold mt-1">Rs.{p.price}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProductGridSection;

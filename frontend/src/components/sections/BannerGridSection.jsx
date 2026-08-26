import React from 'react';
import { Link } from 'react-router-dom';

const BannerGridSection = ({ settings = {} }) => {
  const {
    columns = 3,
    gap = 12,
    items = [],
  } = settings;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
    gap: `${gap}px`,
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full">
      <div style={gridStyle}>
        {items.map((it, idx) => (
          <Link key={idx} to={it.link || '#'} className="block no-underline">
            <div className="relative overflow-hidden rounded-md">
              <img
                src={it.image}
                alt={it.title || `banner-${idx}`}
                className="w-full h-[160px] md:h-[220px] object-cover"
                loading="lazy"
              />
              {it.title && (
                <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                  <span className="bg-white/90 text-black text-xs md:text-sm px-2 py-1 rounded">
                    {it.title}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BannerGridSection;

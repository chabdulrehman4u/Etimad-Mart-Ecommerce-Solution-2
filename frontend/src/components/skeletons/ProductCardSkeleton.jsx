import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="group max-w-sm bg-white h-[350px] overflow-hidden rounded shadow-md mb-2 flex flex-col items-stretch relative animate-pulse">
      {/* Skeleton Image container - matches ProductCard aspect-square */}
      <div className="relative w-full mb-0 lg:mb-4 overflow-hidden">
        <div className="relative w-full aspect-square bg-gray-300" style={{ aspectRatio: '1 / 1' }}>
          {/* Placeholder for image */}
        </div>
      </div>

      {/* Mobile action buttons skeleton - matches ProductCard mobile buttons */}
      <div className="flex lg:hidden justify-between gap-0 mx-0 mb-0">
        <div className="flex-1 h-8 bg-gray-200"></div>
        <div className="flex-1 h-8 bg-gray-200"></div>
      </div>

      {/* Skeleton Product Details - matches ProductCard content layout */}
      <div className="justify-start mx-2 md:mt-0 mb-4 font-roboto">
        {/* Title skeleton */}
        <div className="mb-2">
          <div className="w-3/4 h-4 bg-gray-200 mb-1"></div>
          <div className="w-1/2 h-4 bg-gray-200"></div>
        </div>
        
        {/* Stars and reviews skeleton */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
            {/* Star skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
            <div className="w-8 h-4 bg-gray-200 ml-2 rounded"></div>
          </div>
        </div>
        
        {/* Price and discount skeleton */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col">
            <div className="w-16 h-3 bg-gray-200 mb-1"></div>
            <div className="w-20 h-4 bg-gray-200"></div>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

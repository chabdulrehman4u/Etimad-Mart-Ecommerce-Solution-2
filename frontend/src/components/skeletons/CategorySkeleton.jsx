const CategorySkeleton = () => (
  <div className="flex flex-col items-center overflow-visible">
    {/* Image placeholder with exact same sizing as real category tile */}
    <div className="relative w-20 h-20 aspect-square overflow-hidden rounded-lg shadow-sm md:h-24 md:w-24 lg:h-36 lg:w-36 bg-gray-200 animate-pulse" />
    {/* Text placeholder under image: reserve same label space */}
    <div className="mt-2 w-full min-h-[20px] md:min-h-[24px]">
      <div className="h-3.5 w-16 md:w-20 lg:w-24 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

export default CategorySkeleton;
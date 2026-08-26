import React from 'react';

const SingleProductSkeleton = () => {
    return (
        <div className="px-4 pt-1 max-w-screen md:px-5 md:pt-3">
            <div className="flex flex-col gap-10 md:flex-row">
                {/* Product Images Skeleton */}
                <div className="flex flex-col w-full md:w-1/2 md:flex-row">
                    {/* Main Image Skeleton */}
                    <div className="relative flex-1 order-1 mt-4 md:order-2 md:mt-3">
                        <div className="overflow-hidden aspect-square h-[350px] md:h-[400px] md:w-[400px] w-[350px] border border-gray-100 mx-auto relative bg-gray-200 animate-pulse" />
                    </div>
                    {/* Thumbnails Skeleton */}
                    <div className="relative flex flex-row items-center order-2 mt-8 md:w-20 md:order-1 max-h-80 md:flex-col">
                        <div className="relative flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto whitespace-nowrap scrollbar-hide max-h-[300px] py-2 md:py-6 z-10">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 w-16 bg-gray-200 rounded p-1 flex-shrink-0 animate-pulse"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Product Details Skeleton */}
                <div className="w-full max-w-screen-xl py-0 ml-0 md:w-1/2 md:ml-5 md:py-4">
                    <div className="h-8 w-3/4 bg-gray-200 mb-4 rounded animate-pulse"></div>
                    <div className="h-5 w-1/2 bg-gray-200 mb-3 rounded animate-pulse"></div>
                    <div className="h-6 w-1/3 bg-gray-200 mb-6 rounded animate-pulse"></div>
                    <div className="h-10 w-1/2 bg-gray-200 mb-6 rounded animate-pulse"></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="text-xl">1</div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                        <div className="bg-gray-200 w-full md:w-auto md:flex-1 h-10 rounded-lg animate-pulse"></div>
                        <div className="bg-gray-200 w-full md:w-auto md:flex-1 h-10 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="bg-gray-200 w-full h-12 rounded-lg animate-pulse mb-3"></div>
                </div>
            </div>
        </div>
    );
};

export default SingleProductSkeleton;

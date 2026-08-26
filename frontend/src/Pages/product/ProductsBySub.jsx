import React, { useEffect, useState } from 'react';
import { getProductsBySub } from '../../functions/product';
import { getSubCategoryBySlug } from '../../functions/subs';
import { useParams } from 'react-router-dom';
import ProductCard from '../../components/cards/ProductCard';
import ProductCardSkeleton from '../../components/skeletons/ProductCardSkeleton';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import getSubCategorySchema from '../../helpers/getSubCategorySchema';

const ProductsBySub = () => {
    const [products, setProducts] = useState([]);
    const [subCategory, setSubCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const { subcategorySlug } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const productsPerPage = 10; // You can adjust this number

    const fetchSubCategory = async () => {
        try {
            const response = await getSubCategoryBySlug(subcategorySlug);
            if (response?.success) {
                setSubCategory(response.subCategory);
            }
        } catch (error) {
            console.log("Error in fetching subcategory details", error);
        }
    };

    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getProductsBySub(subcategorySlug, page, productsPerPage);
            
            if (response) {
                setProducts(response.products || []);
                setTotalPages(response.totalPages || 0);
                setCurrentPage(response.currentPage || 1);
                setTotalProducts(response.totalProducts || 0);
            }
        } catch (error) {
            console.log("Error in fetching products ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubCategory();
        fetchProducts(currentPage);
    }, [subcategorySlug, currentPage]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        // Optional: Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getVisiblePages = () => {
        const visiblePages = [];
        const maxVisiblePages = 5; // Number of visible page buttons

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            visiblePages.push(i);
        }

        return visiblePages;
    };

    // Generate schema data
    const schemaData = subCategory ? getSubCategorySchema({
        name: subCategory.name,
        slug: subCategory.slug,
        description: subCategory.metaDescription,
        category: subCategory.category,
        products: products
    }) : null;

    return (
        <>
        <Helmet>
            <title>{subCategory?.name || subcategorySlug.replace(/-/g, ' ')} | Etimad Mart</title>
            <meta name="description" content={subCategory?.metaDescription || `Browse ${subcategorySlug.replace(/-/g, ' ')} products at Etimad Mart`} />
            <link rel="canonical" href={window.location.href} />
            <meta name="robots" content="index, follow" />
            {schemaData && <script type="application/ld+json">{JSON.stringify(schemaData)}</script>}
        </Helmet>
        <div className="w-full min-h-screen px-4 md:px-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-center text-secondary mt-6 mb-3 capitalize">
                {subCategory?.name || subcategorySlug.replace(/-/g, ' ')}
            </h1>
            
            {/* Subcategory Description */}
            {/* {subCategory?.metaDescription && (
                <p className="text-center text-gray-600 mb-4 max-w-2xl mx-auto">
                    {subCategory.metaDescription}
                </p>
            )} */}

            {/* Product count */}
            {!loading && products.length > 0 && (
                <p className="text-center text-gray-600 mb-4">
                    Showing {(currentPage - 1) * productsPerPage + 1}-
                    {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
                </p>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
                    {[...Array(productsPerPage)].map((_, index) => (
                        <ProductCardSkeleton key={index} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <p className="text-center text-gray-500">No products found in this subcategory.</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 mb-4 space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-full ${currentPage === 1 ?
                                    'text-gray-400 cursor-not-allowed' :
                                    'text-secondary hover:bg-primary'}`}
                                aria-label="Previous page"
                            >
                                <FaChevronLeft />
                            </button>

                            {getVisiblePages().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        currentPage === page
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    aria-label={`Go to page ${page}`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-full ${currentPage === totalPages ?
                                    'text-gray-400 cursor-not-allowed' :
                                    'text-secondary hover:bg-primary'}`}
                                aria-label="Next page"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
        </>
    );
};

export default ProductsBySub;
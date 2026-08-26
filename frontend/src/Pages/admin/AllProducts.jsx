import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { CiEdit, CiTrash } from 'react-icons/ci';
import { BiCategory } from 'react-icons/bi';
import toast from "react-hot-toast";
import { deleteProduct, getAllProducts } from "../../functions/product";
import { truncateTitle } from "../../helpers/truncateTitle";
import { searchProduct } from '../../functions/search';
import CategoriesModal from '../../components/modals/CategoriesModal';

const PAGE_SIZE = 16; // Set your page size here

const AllProducts = () => {
  // State for paginated products
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false); // used for search loading only
  const [deletingProductId, setDeletingProductId] = useState(null);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  // Pagination state must be declared before effects that depend on it
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Removed duplicate fetchMyProducts; using fetchProducts below
  const didInitialFetch = useRef(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch products on page change (only if not searching)
  useEffect(() => {
    if (!isSearching) {
      // Guard against double-invocation in React StrictMode for initial page
      if (page === 1 && didInitialFetch.current) {
        // no-op, already fetched
      } else {
        fetchProducts(page);
        if (page === 1) didInitialFetch.current = true;
      }
    }
    // eslint-disable-next-line
  }, [page, isSearching]);

  // Search effect
  useEffect(() => {
    const doSearch = async () => {
      if (debouncedSearch.trim() === "") {
        setIsSearching(false);
        setSearchResults([]);
        setSearchTotal(0);
        setPage(1);
        return;
      }
      setIsSearching(true);
      setIsPageLoading(true);
      try {
        const response = await searchProduct({ query: debouncedSearch });
        setSearchResults(response?.products || []);
        setSearchTotal(response?.totalProducts || 0);
      } catch (error) {
        setSearchResults([]);
        setSearchTotal(0);
      } finally {
        setIsPageLoading(false);
      }
    };
    doSearch();
    // eslint-disable-next-line
  }, [debouncedSearch]);

  // Delete handler
  const handleDelete = async (id) => {
    try {
      // normalize to string to avoid strict equality mismatches
      setDeletingProductId(String(id));
      const response = await deleteProduct(id);
      toast.success(response?.message);
      // Remove from current lists
      setProducts((prevProducts) => prevProducts.filter((product) => product._id !== id));
      setSearchResults((prevResults) => prevResults.filter((product) => product._id !== id));
      // Update total count
      setTotalProducts((t) => Math.max(0, (t || 0) - 1));
      setSearchTotal((t) => Math.max(0, (t || 0) - 1));

      // If not searching, try to keep the page filled
      if (!isSearching) {
        // After a small timeout to ensure state has applied, decide whether to fetch more
        setTimeout(() => {
          const startIdx = (page - 1) * PAGE_SIZE;
          const endIdx = startIdx + PAGE_SIZE;
          const remaining = (prev => prev.slice(startIdx, endIdx))(products);
          if (remaining.length === 0 && page > 1) {
            // If the current page became empty, go back one page
            setPage(p => Math.max(1, p - 1));
          } else if (remaining.length < PAGE_SIZE && hasMore) {
            // Fetch more to top-up current view
            fetchProducts(page);
          }
        }, 0);
      }
    } catch (error) {
      toast.error("Failed to delete product.");
    } finally {
      // small delay to ensure UI updates before clearing
      setTimeout(() => setDeletingProductId(null), 50);
      // Ensure no loaders remain stuck after delete
      setIsPageLoading(false);
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this product?");
    if (isConfirmed) {
      await handleDelete(id);
    }
  };

  // Determine which products and total to show
  const productsToShow = isSearching ? searchResults : products;
  const totalToShow = isSearching ? searchTotal : totalProducts;


  const getImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object') return img.url || '';
    return '';
  };

  const handleShowCategories = (product) => {
    setSelectedProduct(product);
    setShowCategoriesModal(true);
  };

  const handleCloseCategoriesModal = () => {
    setShowCategoriesModal(false);
    setSelectedProduct(null);
  };

  const fetchProducts = async (pageNum) => {
    setLoading(true);
    try {
      const response = await getAllProducts(pageNum);
      setProducts(prev => {
        const key = (p) => `${String(p?._id ?? p?.id ?? '')}|${String(p?.slug ?? '')}`;
        const existingKeys = new Set(prev.map(key));
        const incoming = Array.isArray(response?.products) ? response.products : [];
        const newProducts = incoming.filter(p => !existingKeys.has(key(p)));
        return [...prev, ...newProducts];
      });
      if (typeof response?.totalProducts === 'number') setTotalProducts(response.totalProducts);
      setHasMore((response?.products || []).length > 0);
    } finally {
      setLoading(false);
    }
  };
  // initial load handled by the combined effect above

  return (
    <div className="max-w-screen-lg mx-auto bg-gray-100 px-1 md:px-4 py-6">
      {/* Page header and search input */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-primary">
          All Products [{totalToShow}]
        </h1>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
        />
        <Link
          to="/add-product"
          className="bg-secondary/90 no-underline text-primary px-4 py-2 md:py-2 lg:py-[0.6rem] rounded-full shadow-md flex items-center gap-2 hover:bg-secondary transition-opacity"
        >
          + Add Product
        </Link>
      </div>

      {/* Table Layout */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">No.</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Image</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Title</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Category</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Price</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Stock</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Edit</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Delete</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {(isSearching ? isPageLoading : loading) && productsToShow.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-main font-semibold">
                  Loading products...
                </td>
              </tr>
            ) : productsToShow.length > 0 ? (
              productsToShow.map((product, idx) => (
                <tr key={product?._id} className="hover:bg-gray-50 transition">
                  <td className="py-2 px-2 font-bold text-secondary text-center">
                    {isSearching
                      ? idx + 1
                      : (page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="py-2 px-2">
                    <img
                      src={getImageUrl(product?.images && product.images[0])}
                      alt={product?.title}
                      className="w-16 h-16 object-cover rounded shadow"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Link
                      to={`/edit-product/${product.slug}`}
                      className="text-blue-700 no-underline text-[14px] hover:underline font-semibold"
                    >
                      {truncateTitle(product?.title, 40)}
                    </Link>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleShowCategories(product)}
                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-200 text-sm font-medium group"
                      title="View Categories"
                    >
                      <BiCategory className="text-base group-hover:scale-110 transition-transform" />
                      <span>
                        {product?.categories?.length > 0 
                          ? `${product.categories.length} ${product.categories.length === 1 ? 'Category' : 'Categories'}`
                          : product?.category?.name || 'No Categories'
                        }
                      </span>
                    </button>
                  </td>
                  <td className="py-2 px-4">
                    <span className="line-through text-gray-400">Rs.{product?.price}</span>
                    {product.salePrice && (
                      <span className="ml-2 text-green-600 font-bold">Rs.{product.salePrice}</span>
                    )}
                  </td>
                  <td className="py-2 px-4">{product.stock ?? "--"}</td>
                  <td className="py-2 px-4">
                    <Link
                      to={`/edit-product/${product.slug}`}
                      className="text-green-600 hover:text-green-800 text-xl"
                      title="Edit"
                    >
                      <CiEdit />
                    </Link>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      className="text-red-600 hover:text-red-800 text-xl"
                      onClick={() => handleDeleteClick(product?._id)}
                      disabled={deletingProductId !== null && String(deletingProductId) === String(product._id)}
                      title="Delete"
                    >
                      {deletingProductId !== null && String(deletingProductId) === String(product._id) ? (
                        <span className="animate-spin h-5 w-5 border-2 border-red-600 border-opacity-90 border-t-transparent rounded-full inline-block"></span>
                      ) : (
                        <CiTrash />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-500">
                  No products available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!hasMore && products.length > 0 && !isSearching && (
        <p className="text-center py-4 text-gray-500">
          No more products to load.
        </p>
      )}
      {isPageLoading && products.length > 0 && !isSearching && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin h-6 w-6 border-4 border-main border-opacity-90 border-t-transparent rounded-full"></div>
          <p className="ml-4 text-main opacity-70">Loading more products...</p>
        </div>
      )}
      {hasMore && !loading && (
        <div className="flex justify-center my-4">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-6 py-2 bg-primary text-white rounded shadow hover:bg-secondary transition"
          >
            Load More
          </button>
        </div>
      )}
      {loading && (
        <div className="flex justify-center my-4">
          <span>Loading...</span>
        </div>
      )}

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={showCategoriesModal}
        onClose={handleCloseCategoriesModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default AllProducts;

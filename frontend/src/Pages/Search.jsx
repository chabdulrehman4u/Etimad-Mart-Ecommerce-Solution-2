import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { IoChevronDown, IoFilter } from 'react-icons/io5';
import { FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import ProductCard from '../components/cards/ProductCard';
import FilterDrawer from '../components/drawers/FilterDrawer';
import Pagination from '../components/Pagination';
import { getAllBrands } from '../functions/brand';
import { getAllCategories } from '../functions/categories';
import {
  searchProduct,
  getMinMaxPrice,
} from '../functions/search';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Filter states - matching Shop page structure
  const [priceFilter, setPriceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [brandFilter, setBrandFilter] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([100, 10000]);
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  // UI states
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [isFocused, setIsFocused] = useState(false);

  // Fetch categories and brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          getAllCategories(),
          getAllBrands()
        ]);
        setCategories(categoriesRes?.categories || []);
        setBrands(brandsRes?.brands || []);
      } catch (error) {
        console.error('Error fetching categories/brands:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch min/max price
  useEffect(() => {
    const fetchMinMaxPrice = async () => {
      try {
        const response = await getMinMaxPrice();
        setMinPrice(response.minPrice || 100);
        setMaxPrice(response.maxPrice || 10000);
        setPriceRange([response.minPrice || 100, response.maxPrice || 10000]);
      } catch (error) {
        console.error('Error fetching min/max price:', error);
      }
    };
    fetchMinMaxPrice();
  }, []);

  // Search products
  const searchProducts = async (page = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const searchData = {
        query,
        page,
        limit: 16
      };

      // Add filters if they exist - matching Shop page logic
      if (categoryFilter.length > 0) {
        searchData.categories = categoryFilter;
      }
      if (brandFilter) {
        searchData.brand = brandFilter;
      }
      if (ratingFilter) {
        searchData.rating = ratingFilter;
      }
      if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) {
        searchData.minPrice = priceRange[0];
        searchData.maxPrice = priceRange[1];
      }

      // Add sorting
      if (priceFilter === 'low') {
        searchData.sort = 'price_asc';
      } else if (priceFilter === 'high') {
        searchData.sort = 'price_desc';
      } else if (priceFilter === 'newest') {
        searchData.sort = 'newest';
      }

      const response = await searchProduct(searchData);
      
      if (response?.success) {
        setProducts(response.products || []);
        setCurrentPage(response.currentPage || 1);
        setTotalPages(response.totalPages || 0);
        setTotalProducts(response.totalProducts || 0);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search when query or filters change
  useEffect(() => {
    if (query) {
      searchProducts(1);
    }
  }, [query, categoryFilter, brandFilter, ratingFilter, priceRange, priceFilter]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ query: searchInput.trim() });
    }
  };

  // Handle instant search (as user types)
  const handleInstantSearch = (value) => {
    setSearchInput(value);
    if (value.trim()) {
      setSearchParams({ query: value.trim() });
    }
  };

  // Filter handlers - matching Shop page exactly
  const handlePriceChange = (e) => {
    setPriceFilter(e.target.value);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value) {
      setCategoryFilter([value]);
    } else {
      setCategoryFilter([]);
    }
  };

  // Mobile drawer category handler
  const handleCategoryChangeMobile = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setCategoryFilter(prev => [...prev, value]);
    } else {
      setCategoryFilter(prev => prev.filter(cat => cat !== value));
    }
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setBrandFilter(value);
    } else {
      setBrandFilter(null);
    }
  };

  const handleRatingChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setRatingFilter(value);
    } else {
      setRatingFilter(null);
    }
  };

  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
  };

  const handleSortSelection = (value) => {
    setIsSortOpen(false);
    setPriceFilter(value);
  };

  const handlePageChange = (pageNumber) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(pageNumber);
    searchProducts(pageNumber);
  };

  const toggleFilterDrawer = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const toggleSortDropdown = () => {
    setIsSortOpen(!isSortOpen);
  };

  const clearFilters = () => {
    setCategoryFilter([]);
    setBrandFilter(null);
    setRatingFilter(null);
    setPriceRange([minPrice, maxPrice]);
    setPriceFilter('');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const inputVariants = {
    focused: { scale: 1.02, transition: { type: "spring", stiffness: 300 } },
    unfocused: { scale: 1 },
  };

  return (
    <>
      <Helmet>
        <title>{query ? `Search: ${query}` : 'Search'} | Etimad Mart</title>
        <meta name="description" content={`Search results for "${query}" at Etimad Mart. Find the best products, deals, and offers.`} />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="max-w-screen mx-2 md:mx-5 flex flex-col md:flex-row">
        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          {/* Sort Filter Dropdown */}
          <div className="relative flex-1 mt-2 justify-center">
            <button
              onClick={toggleSortDropdown}
              className="w-full flex items-center bg-white justify-between border border-gray-200 px-2 py-2 text-main focus:outline-none"
            >
              <span className="flex items-center text-primary font-semibold gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                SORT
              </span>
              <IoChevronDown
                className={`transition-transform text-secondary ${
                  isSortOpen ? "transform rotate-180" : ""
                }`}
              />
            </button>

            {isSortOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 shadow-lg">
                <button
                  onClick={() => handleSortSelection("low")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => handleSortSelection("high")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Price: High to Low
                </button>
                <button
                  onClick={() => handleSortSelection("newest")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Newest First
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleFilterDrawer}
            className="flex justify-center items-center w-1/2 gap-2 border font-semibold border-gray-200 bg-white text-primary px-3 mt-2 py-2"
          >
            <IoFilter size={24} className="text-secondary" /> Filters
          </button>
        </div>

        {/* Filter Drawer for Mobile */}
        <FilterDrawer
          isOpen={isFilterOpen}
          toggleDrawer={toggleFilterDrawer}
          priceFilter={priceFilter}
          handlePriceChange={handlePriceChange}
          categoryFilter={categoryFilter}
          handleCategoryChange={handleCategoryChangeMobile}
          categories={categories}
          priceRange={priceRange}
          handlePriceRangeChange={handlePriceRangeChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          ratingFilter={ratingFilter}
          handleRatingChange={handleRatingChange}
          brandFilter={brandFilter}
          handleBrandChange={handleBrandChange}
          brands={brands}
        />

        {/* Sidebar Filters (Desktop) - matching Shop page exactly */}
        <div className="hidden lg:block lg:w-1/4 p-4 bg-white rounded-lg shadow-md h-fit sticky top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-primary">Filter Products</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-secondary hover:text-primary"
            >
              CLEAR
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="mb-2 md:mb-3 w-full text-secondary">
            <h4 className="text-lg font-bold mb-1 font-space">Price Range</h4>
            <div className="flex flex-col justify-start gap-2">
              <RangeSlider
                min={100}
                max={10000}
                step={100}
                value={priceRange}
                onInput={handlePriceRangeChange}
                className="w-full text-secondary"
              />
              <div className="flex justify-between text-sm text-black font-semibold">
                <span>Rs {priceRange[0]}</span>
                <span>Rs {priceRange[1]}</span>
              </div>
            </div>
          </div>
          <div className="flex md:flex-col gap-2 items-center md:items-start">
            {/* Sort Filter */}
            <div className="mb-2 md:mb-3 w-1/2 md:w-full">
              <h4 className="text-lg font-bold mb-1 font-space text-secondary">Sort By Price</h4>
              <select
                value={priceFilter || ""}
                onChange={handlePriceChange}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-md focus:outline-none"
              >
                <option value="" disabled>Select</option>
                <option value="low">Low to High</option>
                <option value="high">High to Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="mb-2 md:mb-3 w-1/2 md:w-full">
              <h4 className="text-lg font-bold mb-2 font-space text-secondary">By Category</h4>
              <select
                value={categoryFilter[0] || ""}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-md focus:outline-none"
              >
                <option value="" disabled>Select</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-2 md:mb-3 w-full">
            <h4 className="text-lg font-bold mb-2 font-space text-secondary">Filter By Brand</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 capitalize gap-2">
              {brands?.map((brand) => (
                <label key={brand._id} className="flex items-center text-sm font-semibold text-primary mb-15">
                  <input
                    type="checkbox"
                    name="brand"
                    value={brand.name}
                    checked={brandFilter === brand.name}
                    onChange={handleBrandChange}
                    className="mr-2 text-secondary"
                  />
                  {brand.name}
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-2">
            <h4 className="text-lg font-medium font-space text-secondary">Filter By Rating</h4>
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="rating"
                  value={rating}
                  checked={ratingFilter === rating}
                  onChange={handleRatingChange}
                  className="mr-2 text-secondary"
                />
                <div className="flex">
                  {[...Array(rating)].map((_, index) => (
                    <svg
                      key={index}
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z" />
                    </svg>
                  ))}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-6">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-600">
            Home &gt; Search
          </div>

          {/* Search Header - Matching Navbar Style */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search Input - Navbar Style */}
              <motion.div
                className="relative flex items-center bg-gray-50 rounded-full border border-secondary shadow-md w-full md:max-w-md"
                variants={inputVariants}
                animate={isFocused ? "focused" : "unfocused"}
              >
                <input
                  type="text"
                  placeholder="Search product here..."
                  className="w-full bg-transparent outline-none px-3 py-2 rounded-full placeholder-primary/70"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyUp={(e) => handleInstantSearch(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="absolute flex items-center justify-center w-8 h-8 text-white transition-transform transform rounded-full right-1 bg-primary hover:scale-105"
                >
                  <FiSearch className="w-4 h-4" />
                </button>
              </motion.div>

              {/* Sort Options (Desktop) */}
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-gray-600">Sort By:</span>
                <select
                  onChange={(e) => handleSortSelection(e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Info */}
          {query && (
            <div className="mb-4 text-sm text-gray-600">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  {totalProducts} results found for "{query}"
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded"></div>
                  <div className="mt-2 space-y-2">
                    <div className="bg-gray-200 h-4 rounded"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : query ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Start your search
              </h3>
              <p className="text-gray-500">
                Enter a product name to begin searching
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search; 
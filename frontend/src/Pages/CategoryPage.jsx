import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoChevronDown, IoFilter } from "react-icons/io5";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import ShopCard from "../components/cards/ShopCard";
import FilterDrawer from "../components/drawers/FilterDrawer";
import { getAllBrands } from "../functions/brand";
import { getAllCategories } from "../functions/categories";
import {
  getMinMaxPrice,
  filterCombined,
} from "../functions/search";
import { Helmet } from "react-helmet-async";
import getCategorySchema from "../helpers/getCategorySchema";

const CategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    categorySlug ? [categorySlug] : []
  );
  const [subcategoryFilter, setSubcategoryFilter] = useState(
    subcategorySlug ? [subcategorySlug] : []
  );
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [brands, setBrands] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const toggleFilterDrawer = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  const toggleSortDropdown = () => {
    setIsSortOpen(!isSortOpen);
  };

  const fetchAllCategories = async () => {
    try {
      const response = await getAllCategories();
      setCategories(response?.categories || []);
    } catch (error) {
      console.log("Error in fetching all categories", error);
    }
  };

  const fetchAllBrands = async () => {
    try {
      const response = await getAllBrands();
      setBrands(response?.brands || []);
    } catch (error) {
      console.log("Error in fetching all brands", error);
    }
  };

  useEffect(() => {
    const fetchMinMaxPrice = async () => {
      try {
        const response = await getMinMaxPrice();
        setMinPrice(response.minPrice);
        setMaxPrice(response.maxPrice);
        setPriceRange([response.minPrice, response.maxPrice]);
      } catch (error) {
        console.log("Error in fetching min and max price", error);
      }
    };
    fetchMinMaxPrice();
  }, []);

  useEffect(() => {
    fetchAllCategories();
    fetchAllBrands();
  }, []);

  useEffect(() => {
    if (categorySlug) {
      setCategoryFilter([categorySlug]);
    } else {
      setCategoryFilter([]);
    }

    if (subcategorySlug) {
      setSubcategoryFilter([subcategorySlug]);
    } else {
      setSubcategoryFilter([]);
    }
  }, [categorySlug, subcategorySlug]);

  const fetchFilteredProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 16 };

      if (categoryFilter.length > 0) params.categories = categoryFilter;
      if (subcategorySlug) params.subcategory = subcategorySlug;
      if (brandFilter) params.brand = brandFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (minPrice != null && maxPrice != null) {
        params.minPrice = minPrice;
        params.maxPrice = maxPrice;
      }
      if (priceFilter === "low") params.sort = "price_asc";
      if (priceFilter === "high") params.sort = "price_desc";

      const response = await filterCombined(params);

      setProducts(response?.products || []);
      setTotalPages(response?.totalPages || 0);
      setCurrentPage(response?.currentPage || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVisiblePages = () => {
    const visiblePages = [];
    const maxVisiblePages = 5;

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

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    fetchFilteredProducts(pageNumber);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    fetchFilteredProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [
    priceFilter,
    categoryFilter,
    subcategoryFilter,
    ratingFilter,
    brandFilter,
    minPrice,
    maxPrice,
  ]);

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setPriceFilter(value);
    setIsFilterOpen(false);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryFilter(value ? [value] : []);
    setIsFilterOpen(false);
  };

  // Mobile drawer multi-select toggle
  const handleCategoryChangeMobile = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setCategoryFilter((prev) => Array.from(new Set([...(prev || []), value])));
    } else {
      setCategoryFilter((prev) => (prev || []).filter((cat) => cat !== value));
    }
  };

  const handleRatingChange = (e) => {
    const value = Number(e.target.value);
    setRatingFilter((prev) => (prev === value ? null : value));
    setIsFilterOpen(false);
  };

  const handleSortSelection = (value) => {
    setPriceFilter(value);
    setIsSortOpen(false);
  };

  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    setMinPrice(value[0]);
    setMaxPrice(value[1]);
    setIsFilterOpen(false);
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setBrandFilter((prev) => (prev === value ? null : value));
    setIsFilterOpen(false);
  };

  const categoryName =
    categoryFilter.length > 0
      ? categories.find((cat) => cat.slug === categoryFilter[0])?.name
      : "Products";
  const categoryDescription =
    categoryFilter.length > 0
      ? categories.find((cat) => cat.slug === categoryFilter[0])?.description
      : "Browse our collection of products.";
  const categoryMetaDescription =
    categoryFilter.length > 0
      ? categories.find((cat) => cat.slug === categoryFilter[0])
          ?.metaDescription
      : "";

  const schema = getCategorySchema({
    name: categoryName,
    slug: categorySlug,
    description: categoryDescription,
    products, // pass the products array
  });

  if (categories.length === 0) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <Helmet>
        <title>{`${categoryName ? categoryName : "Category"} | Etimad Mart`}</title>
        <meta
          name="description"
          content={categoryMetaDescription || "Browse our collection of products at Etimad Mart."}
        />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="max-w-screen mx-2 md:mx-5 flex flex-col xl:flex-row">
        {/* Mobile Filter Button */}
        <h1 className="hidden text-xl font-semibold">{categoryName}</h1>
        <div className="xl:hidden flex justify-between items-center mb-4">
          {/* Sort Filter Dropdown */}
          <div className="relative flex-1 mt-2 justify-center">
            <button
              onClick={toggleSortDropdown}
              className="w-full flex items-center bg-white justify-between border border-gray-200  px-2 py-2 text-main focus:outline-none"
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
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200  shadow-lg">
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
              </div>
            )}
          </div>

          <button
            onClick={toggleFilterDrawer}
            className="flex  justify-center items-center w-1/2 gap-2 border font-semibold border-gray-200 bg-white text-primary px-3 mt-2 py-2 "
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

        {/* Sidebar Filters (Desktop - xl and above) */}
        <div className="hidden xl:block xl:w-1/4 p-4 bg-white rounded-lg shadow-md h-fit sticky top-4">
          <h3 className="text-xl font-semibold mb-4 text-primary">
            Filter Products
          </h3>

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
              <h4 className="text-lg font-bold mb-1 font-space text-secondary">
                Sort By Price
              </h4>
              <select
                value={priceFilter || ""}
                onChange={handlePriceChange}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-md focus:outline-none"
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="low">Low to High</option>
                <option value="high">High to Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="mb-2 md:mb-3 w-1/2 md:w-full">
              <h4 className="text-lg font-bold mb-2 font-space text-secondary">
                By Category
              </h4>
              <select
                value={categoryFilter[0] || ""}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-md focus:outline-none"
              >
                <option value="" disabled>
                  Select
                </option>
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
            <h4 className="text-lg font-bold mb-2 font-space text-secondary">
              Filter By Brand
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 capitalize gap-2">
              {brands?.map((brand) => (
                <label
                  key={brand._id}
                  className="flex items-center text-sm font-semibold text-primary mb-15"
                >
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
            <h4 className="text-lg font-medium font-space text-primary">
              Filter By Rating
            </h4>
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="rating"
                  value={rating}
                  checked={ratingFilter === rating}
                  onChange={handleRatingChange}
                  className="mr-2"
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

        {/* Product Display */}
        <div className="w-full xl:w-3/4 p-1 md:py-4 pl-1 md:pl-8  px-1 md:px-0">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="max-w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {products.length > 0 ? (
                  products.map((product) => (
                    <ShopCard key={product._id} product={product} />
                  ))
                ) : (
                  <p className="text-gray-500">No products found.</p>
                )}
              </div>
              {/* Improved Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 mb-4 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-secondary hover:bg-primary"
                    }`}
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
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      aria-label={`Go to page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-secondary hover:bg-primary"
                    }`}
                    aria-label="Next page"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {/* WhatsApp Floating Icon */}
        <a
          href="https://wa.me/+923071111832?text=Hello%2C%20I%20have%20a%20question%20regarding%20a%20product%20on%20Etimad%20Mart.%20Can%20you%20please%20assist%20me%3F"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-green-500 text-white rounded-full w-14 h-14 md:h-16 md:w-16 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors duration-300 z-50"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            className="text-3xl"
            width="32"
            height="32"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.38-.23-3.69.97.99-3.59-.24-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.54 0 4.93.99 6.73 2.77A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 5.02 4.23.7.24 1.25.38 1.68.48.71.15 1.36.13 1.87.08.57-.06 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" />
          </svg>
        </a>
      </div>
    </>
  );
};

export default CategoryPage;

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublishedBlogs, getCategories } from '../functions/blog';

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [error, setError] = useState('');

  const currentPage = parseInt(searchParams.get('page') || '1');
  const selectedCategory = searchParams.get('category') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page: currentPage, limit: 9 };
        if (selectedCategory) params.category = selectedCategory;

        const data = await getPublishedBlogs(params);
        setBlogs(data.blogs);
        setPagination(data.pagination);

        // Fetch categories
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, selectedCategory]);

  const handleCategoryFilter = (category) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen py-10 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog | Etimad Mart</title>
        <meta name="description" content="Read our latest blog posts and articles" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-2">Latest news, tips, and updates</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 ">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No blog posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blogs/${blog.slug}`}
                className="bg-white rounded-lg border no-underline shadow hover:shadow-lg transition overflow-hidden group"
              >
                {/* Featured Image */}
                {blog.featuredImage ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-full p-1 rounded-lg object-cover  group-hover:scale-105 transition duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br  from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {blog.title.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Category Badge */}
                  {/* <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-2">
                    {blog.category}
                  </span> */}

                  {/* Title */}
                  <h2 className="text-xl font-bold text-primary hover:text-secondary mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {blog.title}
                  </h2>

                  {/* Excerpt */}
                  {blog.excerpt && (
                    <p className="text-gray-800 text-sm mb-3 line-clamp-3">
                      {blog.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  {/* <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{blog.author}</span>
                    <span>
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                    </span>
                  </div> */}

                  {/* Tags */}
                  {/* {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {blog.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )} */}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

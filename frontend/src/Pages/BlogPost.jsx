import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { getBlogBySlug, getPublishedBlogs } from '../functions/blog';
import NotFound from './NotFound';
import { FaEye, FaCalendar, FaUser, FaArrowLeft } from 'react-icons/fa';
import { getBlogSchema } from '../helpers/getBlogSchema';

const BlogPost = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBlogBySlug(slug);
        setBlog(data);

        // Fetch related blogs from same category
        if (data.category) {
          const related = await getPublishedBlogs({
            category: data.category,
            limit: 3,
          });
          // Filter out current blog
          setRelatedBlogs(
            related.blogs.filter((b) => b._id !== data._id).slice(0, 3)
          );
        }
      } catch (err) {
        setError('Blog post not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen py-10 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !blog) return <NotFound />;

  const blogSchema = getBlogSchema(blog);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{blog.title} | Etimad Mart Blog</title>
        <meta
          name="description"
          content={blog.metaDescription || blog.excerpt || ''}
        />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.metaDescription || blog.excerpt || ''} />
        {blog.featuredImage && <meta property="og:image" content={blog.featuredImage} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.metaDescription || blog.excerpt || ''} />
        {blog.featuredImage && <meta name="twitter:image" content={blog.featuredImage} />}
        {blogSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
          />
        )}
      </Helmet>

      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft /> Back to Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* Category Badge */}
        {/* <Link
          to={`/blogs?category=${blog.category}`}
          className="inline-block bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full mb-4 hover:bg-blue-700 transition"
        >
          {blog.category}
        </Link> */}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {blog.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-6 pb-6 border-b">
          {/* <div className="flex items-center gap-2">
            <FaUser />
            <span>{blog.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendar />
            <span>
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(
                'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )}
            </span>
          </div> */}
          <div className="flex items-center gap-2">
            <FaEye />
            <span>{blog.viewCount} views</span>
          </div>
        </div>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-xl text-gray-700 mb-8 font-medium leading-relaxed">
            {blog.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-8 blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
          style={{
            lineHeight: '1.8',
            fontSize: '1.125rem',
          }}
          // Security: Content is from admin-controlled source
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t">
            <span className="text-gray-600 font-medium">Tags:</span>
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share Buttons (Optional) */}
        <div className="flex gap-3 mb-8 pt-6 border-t">
          <span className="text-gray-600 font-medium">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              blog.title
            )}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              window.location.href
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              window.location.href
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900"
          >
            LinkedIn
          </a>
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((related) => (
                <Link
                  key={related._id}
                  to={`/blogs/${related.slug}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
                >
                  {related.featuredImage ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={related.featuredImage}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {related.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition">
                      {related.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(
                        related.publishedAt || related.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogPost;

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { getPageBySlug } from '../functions/pages';
import getDynamicPageSchema from '../helpers/getDynamicPageSchema';
import NotFound from './NotFound';

const DynamicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to process HTML content and apply responsive styling
  const processHtmlContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    let processedContent = htmlContent;
    
    // Process H1 tags - Larger size
    processedContent = processedContent.replace(
      /<h1([^>]*)>/g, 
      '<h1$1 style="font-size: 1.875rem; font-weight: 700; color: #111827; line-height: 1.2;" class="responsive-h1">'
    );
    
    // Process H2 tags - Medium-large size
    processedContent = processedContent.replace(
      /<h2([^>]*)>/g, 
      '<h2$1 style="font-size: 1.5rem; font-weight: 600; color: #111827; line-height: 1.3;" class="responsive-h2">'
    );
    
    // Process H3 tags - Medium size
    processedContent = processedContent.replace(
      /<h3([^>]*)>/g, 
      '<h3$1 style="font-size: 1.25rem; font-weight: 600; color: #111827; line-height: 1.4;" class="responsive-h3">'
    );
    
    // Process H4 tags - Small-medium size
    processedContent = processedContent.replace(
      /<h4([^>]*)>/g, 
      '<h4$1 style="font-size: 1.125rem; font-weight: 600; color: #111827; line-height: 1.4;" class="responsive-h4">'
    );
    
    // Process Strong tags - Small size but bold
    processedContent = processedContent.replace(
      /<strong([^>]*)>/g, 
      '<strong$1 style="font-size: 1rem; font-weight: 700; color: #111827; line-height: 1.5;" class="responsive-strong">'
    );
    
    return processedContent;
  };

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPageBySlug(slug);
        setPage(data);
      } catch (err) {
        setError('Page not found');
      } finally {
        setLoading(false);
      }
    };
    // Flag dynamic page active (used by Navbar to hide CategoryBar)
    document.documentElement.setAttribute('data-dynamic-page', 'true');
    fetchPage();
    return () => {
      document.documentElement.removeAttribute('data-dynamic-page');
    };
  }, [slug]);

  if (loading) return <div className="py-10 text-center">Loading...</div>;
  if (error) return <NotFound />;
  if (!page) return <NotFound />;

  // Generate schema
  const schema = getDynamicPageSchema({
    title: page.title,
    slug,
    description: page.metaDescription || page.content?.slice(0, 160),
    datePublished: page.createdAt,
    dateModified: page.updatedAt,
    type: page.schemaType || "WebPage",
    language: "en"
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{page.title} | Etimad Mart</title>
        <meta name="description" content={page.metaDescription || ''} />
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <style>{`
          /* Target all text within headings including nested elements */
          div.dynamic-page-content h1,
          div.dynamic-page-content h1 *,
          .dynamic-page-content h1,
          .dynamic-page-content h1 *,
          h1.responsive-h1,
          h1.responsive-h1 *,
          /* Override strong tags inside H1 */
          div.dynamic-page-content h1 strong,
          .dynamic-page-content h1 strong,
          h1.responsive-h1 strong {
            font-size: 1.25rem !important; /* 20px mobile */
            font-weight: 700 !important;
            color: #111827 !important;
            line-height: 1.2 !important;
          }
          
          /* H1 Tablet */
          @media (min-width: 640px) {
            div.dynamic-page-content h1,
            div.dynamic-page-content h1 *,
            .dynamic-page-content h1,
            .dynamic-page-content h1 *,
            h1.responsive-h1,
            h1.responsive-h1 *,
            div.dynamic-page-content h1 strong,
            .dynamic-page-content h1 strong,
            h1.responsive-h1 strong {
              font-size: 1.5rem !important; /* 24px tablet */
            }
          }
          
          /* H1 Desktop */
          @media (min-width: 1024px) {
            div.dynamic-page-content h1,
            div.dynamic-page-content h1 *,
            .dynamic-page-content h1,
            .dynamic-page-content h1 *,
            h1.responsive-h1,
            h1.responsive-h1 *,
            div.dynamic-page-content h1 strong,
            .dynamic-page-content h1 strong,
            h1.responsive-h1 strong {
              font-size: 1.875rem !important; /* 30px desktop */
            }
          }
          
          div.dynamic-page-content h2,
          div.dynamic-page-content h2 *,
          .dynamic-page-content h2,
          .dynamic-page-content h2 *,
          h2.responsive-h2,
          h2.responsive-h2 *,
          /* Override strong tags inside H2 */
          div.dynamic-page-content h2 strong,
          .dynamic-page-content h2 strong,
          h2.responsive-h2 strong {
            font-size: 1.125rem !important; /* 18px mobile */
            font-weight: 600 !important;
            color: #111827 !important;
            line-height: 1.3 !important;
          }
          
          /* H2 Tablet */
          @media (min-width: 640px) {
            div.dynamic-page-content h2,
            div.dynamic-page-content h2 *,
            .dynamic-page-content h2,
            .dynamic-page-content h2 *,
            h2.responsive-h2,
            h2.responsive-h2 *,
            div.dynamic-page-content h2 strong,
            .dynamic-page-content h2 strong,
            h2.responsive-h2 strong {
              font-size: 1.25rem !important; /* 20px tablet */
            }
          }
          
          /* H2 Desktop */
          @media (min-width: 1024px) {
            div.dynamic-page-content h2,
            div.dynamic-page-content h2 *,
            .dynamic-page-content h2,
            .dynamic-page-content h2 *,
            h2.responsive-h2,
            h2.responsive-h2 *,
            div.dynamic-page-content h2 strong,
            .dynamic-page-content h2 strong,
            h2.responsive-h2 strong {
              font-size: 1.5rem !important; /* 24px desktop */
            }
          }
          
          div.dynamic-page-content h3,
          div.dynamic-page-content h3 *,
          .dynamic-page-content h3,
          .dynamic-page-content h3 *,
          h3.responsive-h3,
          h3.responsive-h3 *,
          /* Override strong tags inside H3 */
          div.dynamic-page-content h3 strong,
          .dynamic-page-content h3 strong,
          h3.responsive-h3 strong {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
            color: #111827 !important;
            line-height: 1.4 !important;
          }
          
          div.dynamic-page-content h4,
          div.dynamic-page-content h4 *,
          .dynamic-page-content h4,
          .dynamic-page-content h4 *,
          h4.responsive-h4,
          h4.responsive-h4 *,
          /* Override strong tags inside H4 */
          div.dynamic-page-content h4 strong,
          .dynamic-page-content h4 strong,
          h4.responsive-h4 strong {
            font-size: 1.125rem !important;
            font-weight: 600 !important;
            color: #111827 !important;
            line-height: 1.4 !important;
          }
          
          /* Strong tags ONLY when NOT inside headings */
          div.dynamic-page-content p strong,
          div.dynamic-page-content div strong,
          .dynamic-page-content p strong,
          .dynamic-page-content div strong,
          strong.responsive-strong:not(h1 strong):not(h2 strong):not(h3 strong):not(h4 strong) {
            font-size: 1rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
            line-height: 1.5 !important;
          }
          
          /* Override all prose styles completely */
          .prose h1, .prose h1 *, 
          .prose h2, .prose h2 *,
          .prose h3, .prose h3 *,
          .prose h4, .prose h4 *,
          .prose strong, .prose strong * {
            font-size: inherit !important;
            font-weight: inherit !important;
          }
          
          /* Force our styles on prose elements */
          .dynamic-page-content .prose h1,
          .dynamic-page-content .prose h1 * {
            font-size: 1.875rem !important;
            font-weight: 700 !important;
          }
          
          .dynamic-page-content .prose h2,
          .dynamic-page-content .prose h2 * {
            font-size: 1.5rem !important;
            font-weight: 600 !important;
          }
          
          .dynamic-page-content .prose h3,
          .dynamic-page-content .prose h3 * {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
          }
          
          .dynamic-page-content .prose h4,
          .dynamic-page-content .prose h4 * {
            font-size: 1.125rem !important;
            font-weight: 600 !important;
          }
          
          .dynamic-page-content .prose strong,
          .dynamic-page-content .prose strong * {
            font-size: 1rem !important;
            font-weight: 700 !important;
          }
        `}</style>
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 text-center lg:text-left">
          {page.title}
        </h1>
        
        {/* Content Container */}
        <div className="bg-white rounded-lg shadow-sm  p-4 sm:p-6 lg:p-8">
          <div 
            className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dynamic-page-content
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:lg:text-3xl prose-h1:mb-4
              prose-h2:text-lg prose-h2:sm:text-xl prose-h2:lg:text-2xl prose-h2:mb-3 prose-h2:mt-6
              prose-h3:text-base prose-h3:sm:text-lg prose-h3:lg:text-xl prose-h3:mb-2 prose-h3:mt-5
              prose-h4:text-sm prose-h4:sm:text-base prose-h4:lg:text-lg prose-h4:mb-2 prose-h4:mt-4
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:space-y-2 prose-ol:space-y-2
              prose-li:text-gray-700
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:p-4 prose-blockquote:italic
              prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: processHtmlContent(page.content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
// src/helpers/getBlogSchema.js

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function getBlogSchema(blog) {
  if (!blog) return null;

  try {
    const url = typeof window !== "undefined" ? window.location.href : `https://etimadmart.com/blogs/${blog.slug || ""}`;

    const image = blog.featuredImage && typeof blog.featuredImage === "string"
      ? blog.featuredImage
      : undefined;

    const published = blog.publishedAt || blog.createdAt || new Date().toISOString();

    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url,
      },
      "headline": blog.title,
      "description": blog.metaDescription || blog.excerpt || stripHtml(blog.content),
      "articleBody": stripHtml(blog.content),
      "author": {
        "@type": "Person",
        "name": blog.author || "Etimad Mart",
      },
      "publisher": {
        "@type": "Organization",
        "name": "Etimad Mart",
        "logo": {
          "@type": "ImageObject",
          "url": "https://etimadmart.com/f-logo.png",
        },
      },
      "datePublished": published,
      "dateModified": blog.updatedAt || published,
      "url": url,
    };

    if (image) {
      schema.image = image;
    }

    if (Array.isArray(blog.tags) && blog.tags.length > 0) {
      schema.keywords = blog.tags.join(", ");
    }

    if (blog.category) {
      schema.articleSection = blog.category;
    }

    return schema;
  } catch (e) {
    console.error("Error generating blog schema", e);
    return null;
  }
}

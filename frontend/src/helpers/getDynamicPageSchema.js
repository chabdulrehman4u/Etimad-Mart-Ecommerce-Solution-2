// getDynamicPageSchema.js

const getDynamicPageSchema = ({
  title,
  slug,
  description,
  datePublished,
  dateModified,
  type = "WebPage",
  language = "en",
  publisher = null // pass your org schema if you want
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    "name": title,
    "url": `https://etimadmart.com/${slug}`,
    "description": description,
    "inLanguage": language,
  };

  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (publisher) schema.publisher = publisher;

  return schema;
};

export default getDynamicPageSchema;

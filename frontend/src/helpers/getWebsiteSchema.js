const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Etimad Mart",
  url: "https://etimadmart.com/",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://etimadmart.com/search?query={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default websiteSchema;

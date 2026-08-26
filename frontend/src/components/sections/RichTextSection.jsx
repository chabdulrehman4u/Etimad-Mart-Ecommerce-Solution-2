import React from "react";

const RichTextSection = ({ settings = {} }) => {
  const { html = "" } = settings;
  if (!html) return null;
  return (
    <section className="container mx-auto px-4 my-4">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
};

export default RichTextSection;

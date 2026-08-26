function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export const getProductFaqSchema = (product) => {
  try {
    const source = Array.isArray(product?.faqs)
      ? product.faqs
      : Array.isArray(product?.FAQ)
      ? product.FAQ
      : Array.isArray(product?.faq)
      ? product.faq
      : [];

    const items = source
      .map((it) => ({
        q: typeof it?.question === 'string' ? it.question.trim() : '',
        a: typeof it?.answer === 'string' ? it.answer : '',
      }))
      .filter((it) => it.q && it.a)
      .slice(0, 8);

    if (!items.length) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(it.a),
        },
      })),
    };
  } catch {
    return null;
  }
};

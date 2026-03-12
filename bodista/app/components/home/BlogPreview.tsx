const posts = [
  {
    title: 'Why Oil-Based Care Outperforms Water-Based Lotions',
    excerpt:
      'The science behind lipid barriers and why your skin craves oils over creams.',
  },
  {
    title: 'Building a Morning Body Ritual in 5 Minutes',
    excerpt:
      'A step-by-step guide to transforming your routine without adding time.',
  },
  {
    title: 'The Ingredients We Will Never Use — And Why',
    excerpt:
      'Transparency matters. Here is our never-list and the reasoning behind it.',
  },
];

export function BlogPreview() {
  return (
    <section className="blog-preview">
      <h2 className="blog-preview-heading">The Bodista Library</h2>
      <div className="blog-preview-grid">
        {posts.map((post) => (
          <article key={post.title} className="blog-preview-card">
            <div className="blog-preview-image" />
            <h3 className="blog-preview-title">{post.title}</h3>
            <p className="blog-preview-excerpt">{post.excerpt}</p>
            <a href="/blogs" className="blog-preview-link">
              Read More &rarr;
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

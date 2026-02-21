import styles from './blog-preview.module.css';

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
    <section className={styles.section}>
      <h2 className={styles.heading}>The Bodista Library</h2>
      <div className={styles.grid}>
        {posts.map((post) => (
          <article key={post.title} className={styles.card}>
            <div className={styles.imagePlaceholder} />
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <a href="/blogs" className={styles.link}>
              Read More &rarr;
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

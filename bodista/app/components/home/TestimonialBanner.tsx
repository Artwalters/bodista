import styles from './testimonial-banner.module.css';

const testimonials = [
  {
    quote: 'The Ritual Oil changed how I start my mornings. My skin has never felt this alive.',
    author: 'Amara J.',
  },
  {
    quote: 'Finally a brand that understands body care is not an afterthought.',
    author: 'Léa M.',
  },
  {
    quote: 'I bought the oil as a gift and ended up keeping it for myself. No regrets.',
    author: 'Sofia R.',
  },
  {
    quote: 'The scent alone makes it worth it — warm, subtle, and completely addictive.',
    author: 'Naomi K.',
  },
  {
    quote: 'Bodista is the only brand where every single product delivers on its promise.',
    author: 'Priya D.',
  },
];

export function TestimonialBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {testimonials.map((t) => (
          <blockquote key={t.author} className={styles.testimonial}>
            <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
            <cite className={styles.author}>{t.author}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

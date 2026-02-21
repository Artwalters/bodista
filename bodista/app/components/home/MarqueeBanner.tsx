import styles from './marquee-banner.module.css';

const phrases = [
  'Pure Ingredients',
  'Oil-Based Rituals',
  'Body Intelligence',
  'Pleasure-Forward',
];

export function MarqueeBanner() {
  const repeated = [...phrases, ...phrases, ...phrases, ...phrases];

  return (
    <section className={styles.banner}>
      <div className={styles.track}>
        {repeated.map((phrase, i) => (
          <span key={i} className={styles.phrase}>
            {phrase}
            <span className={styles.separator}>&mdash;</span>
          </span>
        ))}
      </div>
    </section>
  );
}

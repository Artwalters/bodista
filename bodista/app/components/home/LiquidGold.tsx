import styles from './liquid-gold.module.css';

export function LiquidGold() {
  return (
    <section className={styles.section}>
      <div className={styles.videoWrapper}>
        <div className={styles.videoPlaceholder} />
        <div className={styles.overlay}>
          <p className={styles.text}>
            What&rsquo;s Inside Matters &mdash; The Universal Standard
          </p>
        </div>
      </div>
    </section>
  );
}

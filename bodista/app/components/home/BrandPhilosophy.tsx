import styles from './brand-philosophy.module.css';

export function BrandPhilosophy() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.textCol}>
          <h2 className={styles.heading}>The Bodista Philosophy</h2>
          <p className={styles.body}>
            We believe your body deserves the same attention as your mind. Our
            oil-based formulations are rooted in centuries of botanical wisdom,
            reimagined for the modern ritual. Every ingredient is chosen with
            intention — nothing superfluous, nothing synthetic.
          </p>
          <p className={styles.body}>
            Bodista exists for those who see self-care not as a trend, but as a
            daily act of respect toward the body you inhabit.
          </p>
        </div>
        <div className={styles.imageCol}>
          <div className={styles.imagePlaceholder} />
        </div>
      </div>
    </section>
  );
}

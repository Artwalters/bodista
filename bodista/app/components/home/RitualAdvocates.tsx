import styles from './ritual-advocates.module.css';

const advocates = [
  {name: 'Amara J.'},
  {name: 'Léa M.'},
  {name: 'Sofia R.'},
  {name: 'Naomi K.'},
];

export function RitualAdvocates() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Ritual Advocates</h2>
      <div className={styles.grid}>
        {advocates.map((advocate) => (
          <div key={advocate.name} className={styles.card}>
            <div className={styles.videoPlaceholder} />
            <p className={styles.name}>{advocate.name}</p>
            <a href="#" className={styles.link}>
              Watch Ritual &rarr;
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

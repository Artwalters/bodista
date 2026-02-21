import styles from './social-grid.module.css';

const posts = [
  {caption: 'Morning light, golden skin.'},
  {caption: 'The ritual never gets old.'},
  {caption: 'Ingredients you can pronounce.'},
  {caption: 'Self-care is not selfish.'},
  {caption: 'Oil season is every season.'},
  {caption: 'Your body will thank you.'},
  {caption: 'Glow from the inside out.'},
  {caption: 'Made with intention.'},
];

export function SocialGrid() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>@bodista</h2>
      <div className={styles.grid}>
        {posts.map((post) => (
          <div key={post.caption} className={styles.item}>
            <div className={styles.imagePlaceholder} />
            <p className={styles.caption}>{post.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

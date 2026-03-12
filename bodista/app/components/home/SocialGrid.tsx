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
    <section className="social">
      <h2 className="social-heading">@bodista</h2>
      <div className="social-grid">
        {posts.map((post) => (
          <div key={post.caption} className="social-item">
            <div className="social-image" />
            <p className="social-caption">{post.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

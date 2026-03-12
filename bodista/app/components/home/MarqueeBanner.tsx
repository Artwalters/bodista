const phrases = [
  'Pure Ingredients',
  'Oil-Based Rituals',
  'Body Intelligence',
  'Pleasure-Forward',
];

export function MarqueeBanner() {
  const repeated = [...phrases, ...phrases, ...phrases, ...phrases];

  return (
    <section className="marquee">
      <div className="marquee-track">
        {repeated.map((phrase, i) => (
          <span key={i} className="marquee-phrase">
            {phrase}
            <span className="marquee-separator">&mdash;</span>
          </span>
        ))}
      </div>
    </section>
  );
}

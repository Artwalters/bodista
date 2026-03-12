const advocates = [
  {name: 'Amara J.'},
  {name: 'Léa M.'},
  {name: 'Sofia R.'},
  {name: 'Naomi K.'},
];

export function RitualAdvocates() {
  return (
    <section className="advocates">
      <h2 className="advocates-heading">Ritual Advocates</h2>
      <div className="advocates-grid">
        {advocates.map((advocate) => (
          <div key={advocate.name} className="advocates-card">
            <div className="advocates-video" />
            <p className="advocates-name">{advocate.name}</p>
            <a href="#" className="advocates-link">
              Watch Ritual &rarr;
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

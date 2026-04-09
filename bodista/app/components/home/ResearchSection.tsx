import {useState} from 'react'
import {Link} from 'react-router'

interface Tab {
  key: string
  label: string
  body: string
}

const TABS: Tab[] = [
  {
    key: 'research',
    label: 'research',
    body:
      'We work at the forefront of innovation, drawing on the latest advancements in olfactory chemistry and neuroscent technology to shape the future of functional wellness.\n\nWe work at the forefront of innovation, drawing on the latest advancements in olfactory chemistry and neuroscent technology to shape the future of functional wellness.',
  },
  {
    key: 'safety',
    label: 'Safety',
    body:
      'Every formula is tested against the strictest safety standards. We collaborate with independent labs to make sure each product is gentle, stable and effective for daily use.',
  },
  {
    key: 'ingredients',
    label: 'Ingredients',
    body:
      'We select botanical actives and carrier oils from small growers who respect the land and the people who work it. Traceability is a non-negotiable part of our sourcing.',
  },
]

const Arrow = () => (
  <svg
    className="routine-link-arrow"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 18L18 6" stroke="currentColor" strokeMiterlimit="10" />
    <path d="M8 6H18V16" stroke="currentColor" strokeMiterlimit="10" />
  </svg>
)

export function ResearchSection() {
  const [active, setActive] = useState(0)
  const tab = TABS[active]

  return (
    <section className="research-section">
      <ol className="research-list">
        {TABS.map((t, i) => (
          <li key={t.key} className={`research-list-item${i === active ? ' is-active' : ''}`}>
            <span className="research-list-num">{['I', 'II', 'III'][i]}.</span>
            <button
              type="button"
              className="research-list-btn"
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="research-body">
        {tab.body.split('\n\n').map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}

        <div className="routine-links">
          <hr />
          <Link to="/collections" className="routine-link-inner">
            <span>learn more about our products</span>
            <Arrow />
          </Link>
          <hr />
        </div>
      </div>

      <div className="research-side-col">
        <span
          className="routine-image-side-label"
          data-animation="webgl-text"
          data-animation-scrub
          data-animation-gold
        >
          RESEARCH
        </span>
      </div>
    </section>
  )
}

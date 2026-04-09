import {BracketLines} from './BracketLines'

export function AboutSection() {
  return (
    <section className="about-section">
      <BracketLines />
      <p
        data-animation="webgl-text"
        data-animation-scrub
        className="about-section-text"
      >
        At Bodista, we are dedicated to creating our products using 100% natural,
        high-quality ingredients while respecting the environment. We carefully
        select the finest plant oils and extracts, ensuring our formulations are
        free from synthetic additives.
      </p>
    </section>
  )
}

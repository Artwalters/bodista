import {BracketLines} from './BracketLines'

export function BehindTheScenesSection() {
  return (
    <section className="about-section bts-section">
      <BracketLines />
      <p
        data-animation="webgl-text"
        data-animation-scrub
        className="about-section-text"
      >
        Behind the scenes we move slowly. Botanicals are gathered by hand,
        dried on linen, and left to rest until their character is ready to be
        listened to. Every Bodista formula is the quiet echo of that patience.
      </p>
    </section>
  )
}

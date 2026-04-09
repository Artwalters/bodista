import {useState} from 'react'
import {ReviewConstructionLines} from './ReviewConstructionLines'

interface Review {
  name: string
  role: string
  avatar: string
  image: string
  quote: string
}

const REVIEWS: Review[] = [
  {
    name: 'SOPHIA VERLAINE',
    role: 'friend of bodista',
    avatar: '/images/review-sophia.jpg',
    image: '/images/hero1.png',
    quote:
      "It's like a symphony for my skin, blending dreamy scents with real results. My face feels nourished, and my senses are delighted. It's more than skincare; it's a self-care ritual I cherish!",
  },
  {
    name: 'ELENA MARCHETTI',
    role: 'friend of bodista',
    avatar: '/images/review-elena.jpg',
    image: '/images/review-arch-2.jpg',
    quote:
      'Every ritual feels like a quiet pause in my day. The textures, the scents — it all reminds me to slow down and take care of myself.',
  },
]

const ArrowLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 5L3 12L10 19" stroke="currentColor" strokeMiterlimit="10" />
    <path d="M3 12H22" stroke="currentColor" strokeMiterlimit="10" />
  </svg>
)

const ArrowRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 5L21 12L14 19" stroke="currentColor" strokeMiterlimit="10" />
    <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" />
  </svg>
)

export function ReviewSection() {
  const [index, setIndex] = useState(0)
  const review = REVIEWS[index]
  const count = REVIEWS.length

  const prev = () => setIndex((i) => (i - 1 + count) % count)
  const next = () => setIndex((i) => (i + 1) % count)

  return (
    <section className="review-section">
      <div className="review-left">
        <div className="review-person">
          <div className="review-avatar">
            <img src={review.avatar} alt="" />
          </div>
          <div className="review-person-meta">
            <p className="review-name">{review.name}</p>
            <p className="review-role">{review.role}</p>
          </div>
        </div>

        <blockquote className="review-quote">
          <p>&ldquo;{review.quote}&rdquo;</p>
        </blockquote>
      </div>

      <ReviewConstructionLines />

      <div className="review-arch">
        <img src={review.image} alt="" />
      </div>

      <div className="review-nav">
        <button
          type="button"
          className="review-nav-btn"
          onClick={prev}
          aria-label="Previous review"
        >
          <ArrowLeft />
        </button>
        <button
          type="button"
          className="review-nav-btn"
          onClick={next}
          aria-label="Next review"
        >
          <ArrowRight />
        </button>
      </div>
    </section>
  )
}

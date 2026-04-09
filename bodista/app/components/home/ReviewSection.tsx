import {useState} from 'react'
import {ReviewConstructionLines} from './ReviewConstructionLines'
import {GoldCircle} from '~/components/webgl/GoldCircle'

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
  <span className="review-nav-arrow">
    <GoldCircle text="←" />
  </span>
)
const ArrowRight = () => (
  <span className="review-nav-arrow">
    <GoldCircle text="→" />
  </span>
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

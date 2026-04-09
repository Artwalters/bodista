import {Link} from 'react-router'

interface Post {
  tag: string
  readTime: string
  imageTop: string
  imageBottom: string
  title: string
  href: string
}

const POSTS: Post[] = [
  {
    tag: 'new',
    readTime: '10 min read',
    imageTop: '/images/face-mist-sunlight.webp',
    imageBottom: '/images/body-oil-warm-closeup.webp',
    title: 'read about our body routine',
    href: '/journal/body-routine',
  },
  {
    tag: '',
    readTime: '8 min read',
    imageTop: '/images/face-mist-sepia.webp',
    imageBottom: '/images/body-oil-dramatic.webp',
    title: 'read about our body routine',
    href: '/journal/making-of',
  },
  {
    tag: '',
    readTime: '15 min read',
    imageTop: '/images/face-mist-glowing.webp',
    imageBottom: '/images/body-oil-dark-mood.webp',
    title: 'read about our body routine',
    href: '/journal/behind-the-scenes',
  },
  {
    tag: '',
    readTime: '6 min read',
    imageTop: '/images/face-mist-duo-marble.webp',
    imageBottom: '/images/body-oil-tilted-closeup.webp',
    title: 'read about our body routine',
    href: '/journal/slow-ritual',
  },
]

const Arrow = () => (
  <svg
    className="library-card-arrow"
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

const PlusIcon = () => (
  <svg
    className="library-filter-icon"
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.45703 0C6.73317 1.14e-08 6.95703 0.223858 6.95703 0.5V5.70117H12.1602C12.4363 5.70117 12.6602 5.92503 12.6602 6.20117C12.6602 6.47731 12.4363 6.70117 12.1602 6.70117H6.95703V12.1602C6.95703 12.4363 6.73317 12.6602 6.45703 12.6602C6.18089 12.6602 5.95703 12.4363 5.95703 12.1602V6.70117H0.5C0.223858 6.70117 0 6.47731 0 6.20117C0 5.92503 0.223858 5.70117 0.5 5.70117H5.95703V0.5C5.95703 0.223858 6.18089 -1.14e-08 6.45703 0Z"
      fill="currentColor"
    />
  </svg>
)

const formatToday = () => {
  const d = new Date()
  const day = d.toLocaleDateString('en-US', {weekday: 'long'}).toLowerCase()
  const month = d.toLocaleDateString('en-US', {month: 'long'}).toLowerCase()
  return `${day} · ${month} ${d.getDate()} · ${d.getFullYear()}`
}

export function LibrarySection() {
  return (
    <section className="library-section">
      <div className="library-meta-top">
        <div className="library-meta-right">
          <span className="library-meta-letter">a</span>
          <span className="library-meta-num">17</span>
        </div>
      </div>

      <hr className="library-divider-top" />

      <div className="library-header">
        <div className="library-meta-left">
          <span className="library-date">{formatToday()}</span>
          <div className="library-barcode" aria-hidden="true">
            <div className="library-barcode-bars">
              {Array.from({length: 42}).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: `${(i * 37) % 5 === 0 ? 2 : 1}px`,
                    opacity: (i * 11) % 7 === 0 ? 0.3 : 1,
                  }}
                />
              ))}
            </div>
            <span className="library-barcode-num">9 780000 184210</span>
          </div>
        </div>

        <h2 className="library-title">LIBRARY</h2>
      </div>

      <div className="library-toolbar">
        <span className="library-count">
          all posts (<span className="header-bag-count">{POSTS.length}</span>)
        </span>
        <div className="library-filters">
          <span>routines</span>
          <span>making of</span>
          <span>behind the scenes</span>
          <span className="library-filter-btn">
            <PlusIcon />
            Filters
          </span>
        </div>
      </div>

      <div className="library-grid">
        {POSTS.map((post, i) => (
          <article key={i} className="library-card">
            <div className="library-card-meta">
              {post.tag ? <span className="library-card-tag">{post.tag}</span> : null}
              <span className="library-card-time">{post.readTime}</span>
            </div>
            <Link to={post.href} className="library-card-media">
              <div className="library-card-media-top">
                <img src={post.imageTop} alt="" />
              </div>
              <div className="library-card-media-bottom">
                <img src={post.imageBottom} alt="" />
              </div>
            </Link>
            <Link to={post.href} className="library-card-link">
              <span>{post.title}</span>
              <Arrow />
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

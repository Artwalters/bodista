import {Link} from 'react-router'

const Arrow = () => (
  <svg
    className="routine-link-arrow"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14 19L21 12L14 5" stroke="currentColor" strokeMiterlimit="10" />
    <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" />
  </svg>
)

const StepButton = ({num}: {num: string}) => (
  <button type="button" className="routine-step" aria-label={`Step ${num}`}>
    <span className="routine-step-placeholder" />
    <span className="routine-step-label">{num}</span>
  </button>
)

interface RoutineBlockProps {
  title: string
  subtitle: string
  body: string
  image: string
  imageSideLabel: string
  shopLabel: string
  readLabel: string
}

const RoutineBlock = ({
  title,
  subtitle,
  body,
  image,
  imageSideLabel,
  shopLabel,
  readLabel,
}: RoutineBlockProps) => (
  <div className="routine-block">
    <div className="routine-copy">
      <h3 className="routine-title">{title}</h3>
      <p className="routine-subtitle">{subtitle}</p>
      <p className="routine-body">{body}</p>
      <div className="routine-steps">
        <StepButton num="I" />
        <StepButton num="II" />
        <StepButton num="III" />
        <StepButton num="IV" />
        <StepButton num="V" />
      </div>
      <div className="routine-links">
        <hr />
        <Link to="/collections" className="routine-link-inner">
          <span>{shopLabel}</span>
          <Arrow />
        </Link>
        <hr />
        <Link to="/journal" className="routine-link-inner">
          <span>{readLabel}</span>
          <Arrow />
        </Link>
        <hr />
      </div>
    </div>
    <div className="routine-image-wrap">
      <div className="routine-image">
        <img src={image} alt="" />
      </div>
    </div>
    <div className="routine-side-col">
      <span className="routine-image-side-label">{imageSideLabel}</span>
    </div>
  </div>
)

export function RoutineSection() {
  return (
    <section className="routine-section">
      <div className="routine-header">
        <div className="routine-header-icons">
          <span className="routine-header-icon">V. TACTILE</span>
          <span className="routine-header-icon">III. OLFACTORY</span>
        </div>
        <h2 className="routine-header-title">ANCIENT RITUALS</h2>
      </div>
      <hr className="routine-divider" />

      <RoutineBlock
        title="body routine"
        subtitle="Cleanse with intention"
        body="Begin with a gentle botanical cleanser to remove the day. Pat your skin damp, not dry — moisture is the bridge between cleanser and oil."
        image="/images/body-oil-dramatic.webp"
        imageSideLabel="III. OLFACTORY"
        shopLabel="shop this routine"
        readLabel="read about our body routine"
      />

      <RoutineBlock
        title="face routine"
        subtitle="Nourish with ritual"
        body="Warm a few drops between your palms and press into the skin. Breathe in the aromatic botanicals — the ritual is as much about scent as skin."
        image="/images/face-mist-sunlight.webp"
        imageSideLabel="V. TACTILE"
        shopLabel="shop this routine"
        readLabel="read about our face routine"
      />
    </section>
  )
}

import {Link} from 'react-router'
import {GoldCircle} from '~/components/webgl/GoldCircle'

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
    <span className="routine-step-ring" aria-hidden="true" />
    <span className="routine-step-icon">
      <GoldCircle mask="/assets/icons/noun-abstract-face-3819874.svg" />
    </span>
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
  reverse?: boolean
}

const RoutineBlock = ({
  title,
  subtitle,
  body,
  image,
  imageSideLabel,
  shopLabel,
  readLabel,
  reverse,
}: RoutineBlockProps) => (
  <div className={`routine-block${reverse ? ' routine-block-reverse' : ''}`}>
    <div className="routine-side-col">
      <span
        className="routine-image-side-label"
        data-animation="webgl-text"
        data-animation-scrub
        data-animation-gold
      >
        {imageSideLabel}
      </span>
    </div>
    <div className="routine-copy">
      <h3 className="routine-title">{title}</h3>
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
  </div>
)

export function RoutineSection() {
  return (
    <section className="routine-section">
      <RoutineBlock
        title="Face routine"
        subtitle="Nourish with ritual"
        body="Warm a few drops between your palms and press into the skin. Breathe in the aromatic botanicals. The ritual is as much about scent as skin."
        image="/images/face-mist-sunlight.webp"
        imageSideLabel="ROUTINE I"
        shopLabel="shop this routine"
        readLabel="read about our face routine"
      />

      <RoutineBlock
        title="Body routine"
        subtitle="Cleanse with intention"
        body="Begin with a gentle botanical cleanser to remove the day. Pat your skin damp, not dry. Moisture is the bridge between cleanser and oil."
        image="/images/body-oil-dramatic.webp"
        imageSideLabel="ROUTINE II"
        shopLabel="shop this routine"
        readLabel="read about our body routine"
        reverse
      />
    </section>
  )
}

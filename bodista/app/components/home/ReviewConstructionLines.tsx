import {useEffect, useRef} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {DrawSVGPlugin} from 'gsap/DrawSVGPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)
}

export function ReviewConstructionLines() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const arch = el.parentElement?.querySelector('.review-arch') as HTMLElement | null

    const ctx = gsap.context(() => {
      gsap.set('.rc-draw', {drawSVG: '0%'})
      if (arch) gsap.set(arch, {opacity: 0, filter: 'blur(24px)'})

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom center',
          scrub: 1,
        },
      })

      tl.to('.rc-top', {drawSVG: '100%', duration: 7, ease: 'none'}, 0)
      tl.to('.rc-bottom', {drawSVG: '100%', duration: 7.4, ease: 'none'}, 0.35)

      tl.to('.rc-diag-1', {drawSVG: '100%', duration: 12, ease: 'none'}, 2.8)
      tl.to('.rc-diag-2', {drawSVG: '100%', duration: 12.8, ease: 'none'}, 2.95)

      tl.to('.rc-left', {drawSVG: '100%', duration: 5, ease: 'none'}, 6)
      tl.to('.rc-right', {drawSVG: '100%', duration: 5.4, ease: 'none'}, 6.4)
      tl.to('.rc-circle', {drawSVG: '100%', duration: 6, ease: 'none'}, 8)

      if (arch) {
        tl.to(
          arch,
          {opacity: 1, filter: 'blur(0px)', duration: 5, ease: 'power2.out'},
          14,
        )
      }
    }, el)

    return () => ctx.revert()
  }, [])

  // viewBox 300 × 500; circle centered, r = 150
  const cx = 150
  const cy = 250
  const FAR = 2000

  // Diagonals of the column rectangle — they naturally cross at (150, 250) = circle center.
  const d1 = {x1: 0, y1: 0, x2: 300, y2: 500}
  const d2 = {x1: 300, y1: 0, x2: 0, y2: 500}

  const common = {
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke' as const,
  }

  return (
    <div ref={ref} className="review-construction" aria-hidden="true">
      <svg
        viewBox="0 0 300 500"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* horizontals */}
        <line
          x1={-FAR}
          y1={0}
          x2={FAR}
          y2={0}
          {...common}
          className="rc-draw rc-top"
        />
        <line
          x1={-FAR}
          y1={500}
          x2={FAR}
          y2={500}
          {...common}
          className="rc-draw rc-bottom"
        />

        {/* column verticals */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={500}
          {...common}
          className="rc-draw rc-left"
        />
        <line
          x1={300}
          y1={0}
          x2={300}
          y2={500}
          {...common}
          className="rc-draw rc-right"
        />

        {/* construction circle */}
        <circle cx={cx} cy={cy} r={150} {...common} className="rc-draw rc-circle" />

        {/* diagonals */}
        <line {...d1} {...common} className="rc-draw rc-diag-1" />
        <line {...d2} {...common} className="rc-draw rc-diag-2" />
      </svg>
    </div>
  )
}

import {useEffect, useRef} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {DrawSVGPlugin} from 'gsap/DrawSVGPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)
}

// Rectangular frame that draws itself around a copy block on scroll.
// Two paths, each starting from far outside the viewport and turning a
// corner to meet the other path at the opposite corner, closing the box:
//   - top path:  far left  → across top → down the right side
//   - bottom path: far right → across bottom → up the left side
export function BracketLines() {
  const ref = useRef<HTMLDivElement>(null)
  const topPathRef = useRef<SVGPathElement>(null)
  const bottomPathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const el = ref.current
    const tp = topPathRef.current
    const bp = bottomPathRef.current
    if (!el || !tp || !bp) return

    const section = el.parentElement
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.set([tp, bp], {drawSVG: '0%'})

      gsap.to([tp, bp], {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: {
          // match the webgl-text scrub reveal inside .about-section so the
          // frame draws in sync with the paragraph
          trigger: section,
          start: 'top 120%',
          end: 'bottom top',
          scrub: 2,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  // viewBox is the frame rect; tails extend far to the left/right so the
  // line visually starts off-screen.
  const W = 100
  const H = 100
  const FAR = 2000

  return (
    <div ref={ref} className="bracket-lines" aria-hidden="true">
      <svg
        className="bracket-lines-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* top: far left → across top → down right side */}
        <path
          ref={topPathRef}
          d={`M ${-FAR} 0 L ${W} 0 L ${W} ${H}`}
          stroke="currentColor"
          strokeWidth={0.5}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* bottom: far right → across bottom → up left side */}
        <path
          ref={bottomPathRef}
          d={`M ${W + FAR} ${H} L 0 ${H} L 0 0`}
          stroke="currentColor"
          strokeWidth={0.5}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

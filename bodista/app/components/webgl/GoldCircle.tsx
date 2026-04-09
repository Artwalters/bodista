'use client'

interface GoldCircleProps {
  mask?: string
  text?: string
}

// Placeholder element — actual rendering is handled by a single shared
// WebGL canvas in <GoldCircleProvider />, which scans the DOM for these
// elements and draws each one into its bounding box.
export function GoldCircle({mask, text}: GoldCircleProps = {}) {
  return (
    <div
      className="routine-step-canvas"
      data-gold-circle
      data-gold-mask={mask || undefined}
      data-gold-text={text || undefined}
      aria-hidden="true"
    />
  )
}

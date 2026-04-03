import * as THREE from 'three'

/**
 * Generates a normal map from an image source (logo, text, etc.)
 * Uses the alpha/luminance channel as a height map and computes normals via Sobel operator.
 */

export const generateNormalMap = (
  source: HTMLImageElement | HTMLCanvasElement,
  options: {
    strength?: number
    blur?: number
    invert?: boolean
  } = {}
): THREE.CanvasTexture => {
  const { strength = 2.0, blur = 1, invert = true } = options

  const w = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth
  const h = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight

  // Step 1: Draw source to offscreen canvas and extract height map
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(source, 0, 0, w, h)

  const srcData = srcCtx.getImageData(0, 0, w, h)
  const pixels = srcData.data

  // Convert to grayscale height map
  const heightMap = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4
    // Use alpha channel if available and non-uniform, otherwise luminance
    const a = pixels[idx + 3]
    const lum = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) / 255

    // For logos with transparency, alpha is the best height source
    let height = a < 255 ? a / 255 : lum
    if (invert) height = 1.0 - height
    heightMap[i] = height
  }

  // Step 2: Optional Gaussian blur for softer edges
  const blurred = blur > 0 ? gaussianBlur(heightMap, w, h, blur) : heightMap

  // Step 3: Compute normals via Sobel operator
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = w
  normalCanvas.height = h
  const normalCtx = normalCanvas.getContext('2d')!
  const normalData = normalCtx.createImageData(w, h)
  const out = normalData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x

      // Sobel operator for dx and dy
      const tl = sample(blurred, w, h, x - 1, y - 1)
      const t  = sample(blurred, w, h, x,     y - 1)
      const tr = sample(blurred, w, h, x + 1, y - 1)
      const l  = sample(blurred, w, h, x - 1, y)
      const r  = sample(blurred, w, h, x + 1, y)
      const bl = sample(blurred, w, h, x - 1, y + 1)
      const b  = sample(blurred, w, h, x,     y + 1)
      const br = sample(blurred, w, h, x + 1, y + 1)

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl)
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr)

      // Normal vector
      let nx = -dx * strength
      let ny = -dy * strength
      let nz = 1.0

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      nx /= len
      ny /= len
      nz /= len

      // Encode to [0, 255] range
      const pixel = idx * 4
      out[pixel]     = Math.round((nx * 0.5 + 0.5) * 255)
      out[pixel + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      out[pixel + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      out[pixel + 3] = 255
    }
  }

  normalCtx.putImageData(normalData, 0, 0)

  const texture = new THREE.CanvasTexture(normalCanvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Renders text to a canvas and generates a normal map from it.
 */
export const generateTextNormalMap = (
  text: string,
  options: {
    fontSize?: number
    fontFamily?: string
    width?: number
    height?: number
    strength?: number
    blur?: number
    padding?: number
  } = {}
): THREE.CanvasTexture => {
  const {
    fontSize = 120,
    fontFamily = 'serif',
    width = 1024,
    height = 512,
    strength = 2.0,
    blur = 2,
    padding = 40,
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Clear with black (low = no engraving)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Draw text in white (high = engraving depth)
  ctx.fillStyle = '#ffffff'
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)

  return generateNormalMap(canvas, { strength, blur, invert: false })
}

// Helper: sample height map with clamped edges
const sample = (map: Float32Array, w: number, h: number, x: number, y: number): number => {
  x = Math.max(0, Math.min(w - 1, x))
  y = Math.max(0, Math.min(h - 1, y))
  return map[y * w + x]
}

// Simple box blur approximation of Gaussian
const gaussianBlur = (
  input: Float32Array,
  w: number,
  h: number,
  passes: number
): Float32Array => {
  let src = new Float32Array(input)
  let dst = new Float32Array(w * h)

  for (let pass = 0; pass < passes; pass++) {
    // Horizontal pass
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0
        let count = 0
        for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.max(0, Math.min(w - 1, x + dx))
          sum += src[y * w + sx]
          count++
        }
        dst[y * w + x] = sum / count
      }
    }
    // Vertical pass
    const temp = new Float32Array(dst)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0
        let count = 0
        for (let dy = -1; dy <= 1; dy++) {
          const sy = Math.max(0, Math.min(h - 1, y + dy))
          sum += temp[sy * w + x]
          count++
        }
        dst[y * w + x] = sum / count
      }
    }
    src = new Float32Array(dst)
  }

  return dst
}

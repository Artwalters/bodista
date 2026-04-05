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

/**
 * Generates emboss textures using a proper distance field + profile curve.
 * Returns both a normal map and a height map as separate textures.
 */
export const generateTextEmboss = (
  text: string,
  options: {
    fontSize?: number
    fontFamily?: string
    width?: number
    height?: number
    bevelWidth?: number
    depth?: number
    strength?: number
    textAlign?: CanvasTextAlign
  } = {}
): { normalMap: THREE.CanvasTexture, heightMap: THREE.CanvasTexture } => {
  const {
    fontSize = 120,
    fontFamily = 'serif',
    width = 1024,
    height = 512,
    bevelWidth = 12,
    depth = 1.0,
    strength = 2.0,
    textAlign = 'center',
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.textAlign = textAlign
  ctx.textBaseline = 'middle'
  const textX = textAlign === 'left' ? 0 : textAlign === 'right' ? width : width / 2
  const textY = height - fontSize * 0.3
  ctx.fillText(text, textX, textY)

  const imgData = ctx.getImageData(0, 0, width, height)
  const pixels = imgData.data

  // Binary mask: 1 = inside text, 0 = outside
  const mask = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    mask[i] = pixels[i * 4] > 128 ? 1.0 : 0.0
  }

  // Step 1: Euclidean distance transform (Felzenszwalb & Huttenlocher)
  const distInside = edt(mask, width, height)
  const invertedMask = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) invertedMask[i] = 1.0 - mask[i]
  const distOutside = edt(invertedMask, width, height)

  // Signed distance field: negative inside, positive outside
  const sdf = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    sdf[i] = distOutside[i] - distInside[i]
  }

  // Step 2: Apply bevel profile curve to create height map
  let heightMapData = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const d = sdf[i]
    if (d >= bevelWidth) {
      heightMapData[i] = 0.0
    } else if (d <= -bevelWidth) {
      heightMapData[i] = -depth
    } else {
      // Smooth sine profile for the bevel zone
      const t = (d + bevelWidth) / (bevelWidth * 2)
      heightMapData[i] = -depth * (1.0 - smoothstep(t))
    }
  }

  // Step 2b: Smooth the height map to remove aliasing artifacts
  heightMapData = gaussianBlur(heightMapData, width, height, 6)

  // Step 3: Compute normals from height map via Sobel
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = width
  normalCanvas.height = height
  const normalCtx = normalCanvas.getContext('2d')!
  const normalImgData = normalCtx.createImageData(width, height)
  const out = normalImgData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      const tl = sample(heightMapData, width, height, x - 1, y - 1)
      const t  = sample(heightMapData, width, height, x,     y - 1)
      const tr = sample(heightMapData, width, height, x + 1, y - 1)
      const l  = sample(heightMapData, width, height, x - 1, y)
      const r  = sample(heightMapData, width, height, x + 1, y)
      const bl = sample(heightMapData, width, height, x - 1, y + 1)
      const b  = sample(heightMapData, width, height, x,     y + 1)
      const br = sample(heightMapData, width, height, x + 1, y + 1)

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl)
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr)

      let nx = -dx * strength
      let ny = -dy * strength
      let nz = 1.0

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      nx /= len
      ny /= len
      nz /= len

      const pixel = idx * 4
      out[pixel]     = Math.round((nx * 0.5 + 0.5) * 255)
      out[pixel + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      out[pixel + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      out[pixel + 3] = 255
    }
  }

  normalCtx.putImageData(normalImgData, 0, 0)
  const normalMap = new THREE.CanvasTexture(normalCanvas)
  normalMap.needsUpdate = true

  // Step 4: Encode height map as grayscale texture
  const heightCanvas = document.createElement('canvas')
  heightCanvas.width = width
  heightCanvas.height = height
  const heightCtx = heightCanvas.getContext('2d')!
  const heightImgData = heightCtx.createImageData(width, height)
  const hOut = heightImgData.data

  // Normalize height to [0, 1] for texture encoding
  for (let i = 0; i < width * height; i++) {
    const v = Math.max(0, Math.min(1, (heightMapData[i] + depth) / depth))
    const pixel = i * 4
    hOut[pixel] = Math.round(v * 255)
    hOut[pixel + 1] = Math.round(v * 255)
    hOut[pixel + 2] = Math.round(v * 255)
    hOut[pixel + 3] = 255
  }

  heightCtx.putImageData(heightImgData, 0, 0)
  const heightMap = new THREE.CanvasTexture(heightCanvas)
  heightMap.needsUpdate = true

  return { normalMap, heightMap }
}

// Smoothstep helper
const smoothstep = (t: number): number => {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

// Helper: sample height map with clamped edges
const sample = (map: Float32Array, w: number, h: number, x: number, y: number): number => {
  x = Math.max(0, Math.min(w - 1, x))
  y = Math.max(0, Math.min(h - 1, y))
  return map[y * w + x]
}

/**
 * Euclidean Distance Transform (Felzenszwalb & Huttenlocher)
 * Returns distance to nearest zero-valued pixel for each pixel.
 */
const edt = (mask: Float32Array, w: number, h: number): Float32Array => {
  const INF = 1e10
  const f = new Float32Array(w * h)

  // Initialize: 0 where mask=1 (inside), INF where mask=0 (outside)
  for (let i = 0; i < w * h; i++) {
    f[i] = mask[i] > 0.5 ? 0 : INF
  }

  const d = new Float32Array(Math.max(w, h))
  const z = new Float32Array(Math.max(w, h) + 1)
  const v = new Int32Array(Math.max(w, h))

  // Transform columns
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) d[y] = f[y * w + x]
    edt1d(d, h, v, z)
    for (let y = 0; y < h; y++) f[y * w + x] = d[y]
  }

  // Transform rows
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) d[x] = f[y * w + x]
    edt1d(d, w, v, z)
    for (let x = 0; x < w; x++) f[y * w + x] = d[x]
  }

  // Square root to get actual distance
  const result = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    result[i] = Math.sqrt(f[i])
  }
  return result
}

// 1D squared distance transform
const edt1d = (f: Float32Array, n: number, v: Int32Array, z: Float32Array) => {
  v[0] = 0
  z[0] = -1e10
  z[1] = 1e10
  let k = 0

  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k--
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = 1e10
  }

  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    f[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
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

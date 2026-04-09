'use client'

import {useEffect, useRef} from 'react'

const vertShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragShader = /* glsl */ `
precision highp float;

uniform sampler2D uPlaster;
uniform sampler2D uRoughness;
uniform vec2 uTile;
uniform vec2 uOffset;
uniform float uBrightness;
uniform float uContrast;
uniform float uRoughnessMix;

varying vec2 vUv;

void main() {
  vec2 uv = vUv * uTile + uOffset;

  vec3 plaster = texture2D(uPlaster, uv).rgb;
  float rough = texture2D(uRoughness, uv).r;

  // Blend plaster with the roughness pattern for extra grit
  vec3 color = plaster * mix(1.0, rough + 0.3, uRoughnessMix);

  color = (color - 0.5) * uContrast + 0.5 + uBrightness;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`

export interface PlasterOverlayProps {
  blendMode?: 'multiply' | 'screen' | 'overlay' | 'soft-light'
  opacity?: number
}

export function PlasterOverlay({
  blendMode = 'multiply',
  opacity = 0.2,
}: PlasterOverlayProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let animationId = 0
    let cleanup: (() => void) | null = null

    const init = async () => {
      const THREE = await import('three')
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight, false)

      const scene = new THREE.Scene()
      const camera = new THREE.Camera()

      const loader = new THREE.TextureLoader()
      const loadTex = (url: string) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject)
        })

      const [plaster, roughness] = await Promise.all([
        loadTex('/assets/textures/plaster.jpg'),
        loadTex('/assets/textures/roughness.jpg'),
      ])
      if (cancelled) {
        plaster.dispose()
        roughness.dispose()
        return
      }

      for (const t of [plaster, roughness]) {
        t.wrapS = THREE.RepeatWrapping
        t.wrapT = THREE.RepeatWrapping
        t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      }
      plaster.colorSpace = THREE.SRGBColorSpace
      roughness.colorSpace = THREE.NoColorSpace

      const TILE_PX = 1100

      const material = new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          uPlaster: {value: plaster},
          uRoughness: {value: roughness},
          uTile: {
            value: new THREE.Vector2(
              window.innerWidth / TILE_PX,
              window.innerHeight / TILE_PX,
            ),
          },
          uOffset: {value: new THREE.Vector2(0, 0)},
          uBrightness: {value: 0.05},
          uContrast: {value: 1.1},
          uRoughnessMix: {value: 0.35},
        },
        depthTest: false,
        depthWrite: false,
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false)
        material.uniforms.uTile.value.set(
          window.innerWidth / TILE_PX,
          window.innerHeight / TILE_PX,
        )
      }
      window.addEventListener('resize', onResize)

      const render = () => {
        if (cancelled) return
        animationId = requestAnimationFrame(render)

        material.uniforms.uOffset.value.set(0, -window.scrollY / TILE_PX)

        renderer.render(scene, camera)
      }
      render()

      cleanup = () => {
        window.removeEventListener('resize', onResize)
        geometry.dispose()
        material.dispose()
        plaster.dispose()
        roughness.dispose()
        renderer.dispose()
      }
    }

    init()

    return () => {
      cancelled = true
      if (animationId) cancelAnimationFrame(animationId)
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: blendMode,
        opacity,
        zIndex: 9999,
      }}
    />
  )
}

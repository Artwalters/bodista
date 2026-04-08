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

uniform sampler2D uDiffuse;
uniform sampler2D uNormal;
uniform vec2 uTile;
uniform vec2 uOffset;
uniform vec2 uLightDir;
uniform float uLightAltitude;
uniform float uDepth;
uniform float uBrightness;
uniform float uContrast;

varying vec2 vUv;

void main() {
  vec2 uv = vUv * uTile + uOffset;

  vec3 diffuse = texture2D(uDiffuse, uv).rgb;

  vec3 normal = texture2D(uNormal, uv).rgb * 2.0 - 1.0;
  normal.xy *= uDepth;
  normal = normalize(normal);

  vec3 lightDir = normalize(vec3(uLightDir, uLightAltitude));
  float NdotL = dot(normal, lightDir);

  // Fiber shading: subtle light/dark based on surface direction
  float shading = 0.5 + NdotL * 0.5;

  // Specular highlight on paper fibers
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 24.0) * 0.12;

  vec3 color = diffuse * mix(1.0, shading, 0.6) + spec;

  // Brightness and contrast adjust so multiply blend feels balanced
  color = (color - 0.5) * uContrast + 0.5 + uBrightness;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`

export interface PaperOverlayProps {
  blendMode?: 'multiply' | 'screen' | 'overlay' | 'soft-light'
  opacity?: number
}

export function PaperOverlay({
  blendMode = 'multiply',
  opacity = 0.6,
}: PaperOverlayProps = {}) {
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

      const base = '/assets/logos/Paper001_1K-JPG/Paper001_1K-JPG'
      const [diffuse, normal] = await Promise.all([
        loadTex(`${base}_Color.jpg`),
        loadTex(`${base}_NormalGL.jpg`),
      ])
      if (cancelled) {
        diffuse.dispose()
        normal.dispose()
        return
      }

      for (const t of [diffuse, normal]) {
        t.wrapS = THREE.RepeatWrapping
        t.wrapT = THREE.RepeatWrapping
        t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      }
      diffuse.colorSpace = THREE.SRGBColorSpace
      normal.colorSpace = THREE.NoColorSpace

      const TILE_PX = 340

      const material = new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          uDiffuse: {value: diffuse},
          uNormal: {value: normal},
          uTile: {
            value: new THREE.Vector2(
              window.innerWidth / TILE_PX,
              window.innerHeight / TILE_PX,
            ),
          },
          uOffset: {value: new THREE.Vector2(0, 0)},
          uLightDir: {value: new THREE.Vector2(-0.4, 0.5)},
          uLightAltitude: {value: 0.55},
          uDepth: {value: 1.6},
          uBrightness: {value: 0.08},
          uContrast: {value: 1.15},
        },
        depthTest: false,
        depthWrite: false,
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const mouse = {x: 0, y: 0}
      const smooth = {x: 0, y: 0}

      const onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      window.addEventListener('mousemove', onMouseMove)

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

        smooth.x += (mouse.x - smooth.x) * 0.03
        smooth.y += (mouse.y - smooth.y) * 0.03

        material.uniforms.uLightDir.value.set(
          -0.4 + smooth.x * 0.4,
          0.5 + smooth.y * 0.4,
        )

        // Scroll the texture with the page (negative = content moves up = tex moves up)
        material.uniforms.uOffset.value.set(0, -window.scrollY / TILE_PX)

        renderer.render(scene, camera)
      }
      render()

      cleanup = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)
        geometry.dispose()
        material.dispose()
        diffuse.dispose()
        normal.dispose()
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

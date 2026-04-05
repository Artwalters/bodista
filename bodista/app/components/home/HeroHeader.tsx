'use client'

import {useEffect, useRef} from 'react'
import {Link} from 'react-router'

const embossVertShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const embossFragShader = /* glsl */ `
precision highp float;

uniform sampler2D uNormalMap;
uniform sampler2D uHeightMap;
uniform vec2 uLightDir;
uniform float uLightAltitude;
uniform float uDepth;
uniform float uHighlightStrength;
uniform float uShadowStrength;
uniform float uSpecularPower;

varying vec2 vUv;

void main() {
  vec3 normal = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
  float height = texture2D(uHeightMap, vUv).r;

  float dev = length(normal.xy);
  float edgeMask = smoothstep(0.01, 0.15, dev) * (1.0 - smoothstep(0.6, 0.9, dev));
  if (edgeMask < 0.001) discard;

  normal.xy *= uDepth;
  normal = normalize(normal);

  vec3 lightDir = normalize(vec3(uLightDir, uLightAltitude));
  float NdotL = dot(normal, lightDir);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), uSpecularPower) * 0.2;

  float shadow = clamp(-NdotL, 0.0, 1.0) * uShadowStrength;
  float highlight = clamp(NdotL, 0.0, 1.0) * uHighlightStrength + spec;

  float blend = smoothstep(-0.15, 0.15, NdotL);
  vec3 color = vec3(blend);
  float finalAlpha = max(shadow, highlight) * edgeMask;

  gl_FragColor = vec4(color, finalAlpha);
}
`

export function HeroHeader() {
  const embossRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const el = embossRef.current
    if (!el) return

    let cancelled = false
    let animationId: number
    let onMouseMove: ((e: MouseEvent) => void) | null = null

    const init = async () => {
      await document.fonts.ready

      const THREE = await import('three')
      const {generateTextEmboss} = await import('~/lib/normalMapGenerator')
      const {getLenisInstance} = await import('~/lib/lenis')

      if (cancelled) return

      const lenis = getLenisInstance()

      const bounds = el.getBoundingClientRect()
      const DIST = 500
      const fov = 2 * Math.atan(bounds.height / 2 / DIST) * (180 / Math.PI)

      const camera = new THREE.PerspectiveCamera(
        fov,
        bounds.width / bounds.height,
        10,
        1000,
      )
      camera.position.z = DIST

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      })
      renderer.setSize(bounds.width, bounds.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const canvas = renderer.domElement
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;'
      el.appendChild(canvas)
      canvasRef.current = canvas

      const scene = new THREE.Scene()

      const dpr = Math.min(window.devicePixelRatio, 2)
      const texW = Math.round(bounds.width * dpr)
      const texH = Math.round(bounds.height * dpr)
      const fontSize = Math.round(bounds.width * 0.30 * dpr)
      const {normalMap, heightMap} = generateTextEmboss('bodista', {
        fontSize,
        fontFamily: "'Novela Display', serif",
        width: texW,
        height: texH,
        bevelWidth: 8,
        depth: 0.6,
        strength: 3.0,
        textAlign: 'left',
      })

      const material = new THREE.ShaderMaterial({
        vertexShader: embossVertShader,
        fragmentShader: embossFragShader,
        transparent: true,
        uniforms: {
          uNormalMap: {value: normalMap},
          uHeightMap: {value: heightMap},
          uLightDir: {value: new THREE.Vector2(-0.4, 0.4)},
          uLightAltitude: {value: 0.6},
          uDepth: {value: 2.0},
          uHighlightStrength: {value: 0.15},
          uShadowStrength: {value: 0.4},
          uSpecularPower: {value: 50.0},
        },
      })

      const geometry = new THREE.PlaneGeometry(1, 1)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.set(bounds.width, bounds.height, 1)
      scene.add(mesh)

      const mousePos = {x: 0, y: 0}
      const smoothMouse = {x: 0, y: 0}

      onMouseMove = (e: MouseEvent) => {
        mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
        mousePos.y = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      window.addEventListener('mousemove', onMouseMove)

      let needsRender = true

      const render = () => {
        if (cancelled) return
        animationId = requestAnimationFrame(render)

        smoothMouse.x += (mousePos.x - smoothMouse.x) * 0.015
        smoothMouse.y += (mousePos.y - smoothMouse.y) * 0.015

        const baseX = -0.4 + smoothMouse.x * 0.35
        const baseY = 0.4 + smoothMouse.y * 0.35
        material.uniforms.uLightDir.value.set(baseX, baseY)

        renderer.render(scene, camera)
      }

      render()

      const resizeHandler = () => {
        const newBounds = el.getBoundingClientRect()
        renderer.setSize(newBounds.width, newBounds.height)
        camera.aspect = newBounds.width / newBounds.height
        camera.updateProjectionMatrix()
        mesh.scale.set(newBounds.width, newBounds.height, 1)

        const newFov = 2 * Math.atan(newBounds.height / 2 / DIST) * (180 / Math.PI)
        camera.fov = newFov
        camera.updateProjectionMatrix()
      }

      window.addEventListener('resize', resizeHandler)
    }

    init()

    return () => {
      cancelled = true
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove)
      if (canvasRef.current && el.contains(canvasRef.current)) {
        el.removeChild(canvasRef.current)
      }
    }
  }, [])

  return (
    <section className="hero">
      <div className="hero-top">
        <div className="hero-emboss" ref={embossRef} />
        <div className="hero-copy">
          <p className="hero-copy-text">
            At Bodista, we are dedicated to creating our products using 100%
            natural, high quality ingredients while respecting the environment
          </p>
          <div className="hero-copy-link">
            <hr />
            <Link to="/collections" className="hero-copy-link-inner">
              <span>shop all products</span>
              <span className="hero-copy-arrow">&#8599;</span>
            </Link>
            <hr />
          </div>
        </div>
      </div>
      <div className="hero-image" />
    </section>
  )
}

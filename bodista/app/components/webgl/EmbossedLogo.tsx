'use client'

import {useEffect, useRef} from 'react'

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
uniform vec2 uLightDir;
uniform float uLightAltitude;
uniform float uDepth;
uniform float uHighlightStrength;
uniform float uShadowStrength;
uniform float uSpecularPower;

varying vec2 vUv;

void main() {
  vec3 normal = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;

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

export interface EmbossedLogoProps {
  src?: string
  className?: string
  /** Fraction of min(width,height) to pad around the logo inside the texture. */
  padding?: number
  alignBottom?: boolean
  /** Fraction of texture height to offset the logo from the bottom when alignBottom is true. */
  bottomOffset?: number
  /** Bevel thickness as a fraction of min(textureW, textureH). */
  bevelWidth?: number
  depth?: number
  strength?: number
  highlightStrength?: number
  shadowStrength?: number
}

export function EmbossedLogo({
  src = '/assets/logos/bodista_logo.svg',
  className,
  padding = 0,
  alignBottom = false,
  bottomOffset = 0,
  bevelWidth = 0.012,
  depth = 0.6,
  strength = 3.0,
  highlightStrength = 0.15,
  shadowStrength = 0.4,
}: EmbossedLogoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    let cancelled = false
    let animationId = 0
    let onMouseMove: ((e: MouseEvent) => void) | null = null
    let onResize: (() => void) | null = null
    let cleanupGpu: (() => void) | null = null

    const init = async () => {
      await document.fonts.ready

      const THREE = await import('three')
      const {generateImageEmboss} = await import('~/lib/normalMapGenerator')

      if (cancelled) return

      const logo = new Image()
      logo.src = src
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve()
        logo.onerror = () => reject(new Error('Failed to load logo'))
      })

      if (cancelled) return

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

      const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
      renderer.setSize(bounds.width, bounds.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const canvas = renderer.domElement
      canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;'
      el.appendChild(canvas)

      const scene = new THREE.Scene()

      const dpr = Math.min(window.devicePixelRatio, 2)
      const texW = Math.round(bounds.width * dpr)
      const texH = Math.round(bounds.height * dpr)
      const {normalMap, heightMap} = generateImageEmboss(logo, {
        width: texW,
        height: texH,
        bevelWidth: Math.max(1, Math.round(Math.min(texW, texH) * bevelWidth)),
        depth,
        strength,
        padding: Math.round(Math.min(texW, texH) * padding),
        bottomOffset: Math.round(texH * bottomOffset),
        alignBottom,
      })

      const material = new THREE.ShaderMaterial({
        vertexShader: embossVertShader,
        fragmentShader: embossFragShader,
        transparent: true,
        uniforms: {
          uNormalMap: {value: normalMap},
          uLightDir: {value: new THREE.Vector2(-0.4, 0.4)},
          uLightAltitude: {value: 0.6},
          uDepth: {value: 2.0},
          uHighlightStrength: {value: highlightStrength},
          uShadowStrength: {value: shadowStrength},
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

      onResize = () => {
        const nb = el.getBoundingClientRect()
        renderer.setSize(nb.width, nb.height)
        camera.aspect = nb.width / nb.height
        const newFov = 2 * Math.atan(nb.height / 2 / DIST) * (180 / Math.PI)
        camera.fov = newFov
        camera.updateProjectionMatrix()
        mesh.scale.set(nb.width, nb.height, 1)
      }
      window.addEventListener('resize', onResize)

      cleanupGpu = () => {
        geometry.dispose()
        material.dispose()
        normalMap.dispose()
        heightMap.dispose()
        renderer.dispose()
        if (canvas.parentNode === el) el.removeChild(canvas)
      }
    }

    init()

    return () => {
      cancelled = true
      if (animationId) cancelAnimationFrame(animationId)
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove)
      if (onResize) window.removeEventListener('resize', onResize)
      if (cleanupGpu) cleanupGpu()
    }
  }, [
    src,
    padding,
    alignBottom,
    bottomOffset,
    bevelWidth,
    depth,
    strength,
    highlightStrength,
    shadowStrength,
  ])

  return <div ref={wrapperRef} className={className} />
}

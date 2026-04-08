'use client'

import {useEffect, useRef, useCallback} from 'react'
import * as THREE from 'three'

/* ── Shaders ── */

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

/* Simplex-style noise helpers */
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
   -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

/* Rotate 2D coordinates */
vec2 rotate(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

/* Stretched noise — long in one axis, short in the other */
float leafNoise(vec2 p, float stretch, float angle, vec2 sway) {
  vec2 r = rotate(p, angle);
  r.x *= stretch;
  float n = snoise(r + sway);
  return n;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  float t = uTime;

  /* Organic swaying — multiple sine waves for natural movement */
  vec2 sway1 = vec2(
    sin(t * 0.3) * 0.12 + sin(t * 0.17) * 0.06,
    cos(t * 0.22) * 0.09 + cos(t * 0.13 + 0.5) * 0.05
  );
  vec2 sway2 = vec2(
    sin(t * 0.25 + 1.5) * 0.1 + sin(t * 0.12 + 2.0) * 0.07,
    cos(t * 0.35 + 0.8) * 0.08 + cos(t * 0.18 + 1.0) * 0.05
  );

  /* Direction: top-left to bottom-right */
  float angle = 2.35;

  /* Mouse shifts shadows — like light source moving */
  vec2 mouseShift = uMouse * 0.06;

  /* Broad diagonal streaks with subtle detail layer */
  float L1 = leafNoise(st * 0.8 + mouseShift, 6.0, angle, sway1);
  float L2 = leafNoise(st * 0.85 + vec2(5.0, 3.0) + mouseShift * 0.7, 5.0, angle + 0.18, sway2);
  float L3 = leafNoise(st * 1.6 + vec2(2.0, 7.0) + mouseShift * 0.5, 4.0, angle - 0.12, sway1 * 1.2);

  /* Combine into soft bands with wide gaps, detail breaks up straight lines */
  float shadow = L1 * 0.5 + L2 * 0.35 + L3 * 0.15;
  shadow = shadow * 0.5 + 0.5;
  shadow = smoothstep(0.45, 0.75, shadow);

  /* Fade: strongest at top-left, much weaker toward right and bottom-right */
  float diagCoord = (1.0 - uv.x) * 0.55 + uv.y * 0.45;
  float diagFade = mix(0.1, 1.0, smoothstep(0.0, 0.9, diagCoord));
  shadow *= diagFade;

  /* Light leaks — slow moving warm spots with detail */
  float leak1 = snoise(st * 0.4 + vec2(t * 0.05, t * 0.03));
  float leak2 = snoise(st * 0.6 + vec2(-t * 0.04, t * 0.06) + vec2(10.0, 5.0));
  float leak3 = snoise(st * 1.2 + vec2(t * 0.03, -t * 0.05) + vec2(3.0, 8.0));
  /* Thin bright rays — high-frequency streaks in the light direction */
  float ray1 = leafNoise(st * 1.2 + vec2(t * 0.04, 0.0), 9.0, angle, sway1 * 0.6);
  float ray2 = leafNoise(st * 1.5 + vec2(-t * 0.03, 4.0), 11.0, angle - 0.1, sway2 * 0.6);

  float leaks = smoothstep(0.2, 0.7, leak1) * 0.5
              + smoothstep(0.3, 0.8, leak2) * 0.4
              + smoothstep(0.15, 0.65, leak3) * 0.25;
  leaks *= (1.0 - shadow) * diagFade;

  float rays = smoothstep(0.55, 0.85, ray1 * 0.5 + 0.5) * 0.6
             + smoothstep(0.6, 0.9, ray2 * 0.5 + 0.5) * 0.4;
  rays *= (1.0 - shadow) * diagFade;

  /* Mix between warm sunlight and soft shadow */
  vec3 warmLight = vec3(1.0, 0.78, 0.42);
  vec3 leakColor = vec3(1.0, 0.85, 0.5);
  vec3 rayColor = vec3(1.0, 0.95, 0.85);
  vec3 coolShadow = vec3(0.15, 0.1, 0.05);
  vec3 color = mix(warmLight, coolShadow, shadow);
  color += leakColor * leaks * 0.28;
  color += rayColor * rays * 0.38;
  float alpha = mix(0.03, 0.05, shadow) + leaks * 0.09 + rays * 0.035;

  /* Soft fade-out near the bottom edge to blend into background */
  float bottomFade = smoothstep(0.0, 0.35, uv.y);
  alpha *= bottomFade;

  gl_FragColor = vec4(color, alpha);
}
`

export function ShadowOverlay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animFrameRef = useRef<number>(0)
  const isVisibleRef = useRef(true)
  const uniformsRef = useRef({
    uTime: {value: 0},
    uResolution: {value: new THREE.Vector2(1, 1)},
    uMouse: {value: new THREE.Vector2(0, 0)},
  })
  const mousePosRef = useRef({x: 0, y: 0})
  const smoothMouseRef = useRef({x: 0, y: 0})

  const setup = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: false})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniformsRef.current,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      uniformsRef.current.uResolution.value.set(w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    let startTime = performance.now()

    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePosRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMouseMove)

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      if (!isVisibleRef.current) return

      /* Smooth mouse — same easing as emboss (0.015) */
      smoothMouseRef.current.x += (mousePosRef.current.x - smoothMouseRef.current.x) * 0.02
      smoothMouseRef.current.y += (mousePosRef.current.y - smoothMouseRef.current.y) * 0.02
      uniformsRef.current.uMouse.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y)

      uniformsRef.current.uTime.value = (performance.now() - startTime) / 1000
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const cleanup = setup()

    /* Pause when out of viewport */
    const container = containerRef.current
    if (!container) return cleanup

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
      },
      {threshold: 0},
    )
    observer.observe(container)

    return () => {
      observer.disconnect()
      cleanup?.()
    }
  }, [setup])

  return <div ref={containerRef} className="shadow-overlay" />
}

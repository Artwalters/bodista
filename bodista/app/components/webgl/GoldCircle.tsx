'use client'

import {useEffect, useRef} from 'react'

interface GoldCircleProps {
  mask?: string
}

export function GoldCircle({mask}: GoldCircleProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let raf = 0
    let cleanup: (() => void) | null = null

    const init = async () => {
      const THREE = await import('three')
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))

      const resize = () => {
        const r = canvas.getBoundingClientRect()
        renderer.setSize(r.width, r.height, false)
      }
      resize()

      const scene = new THREE.Scene()
      const camera = new THREE.Camera()

      const loader = new THREE.TextureLoader()
      const tex = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load('/assets/textures/image.png', resolve, undefined, reject)
      })
      if (cancelled) {
        tex.dispose()
        return
      }
      tex.colorSpace = THREE.SRGBColorSpace

      let maskTex: THREE.Texture | null = null
      if (mask) {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image()
          i.crossOrigin = 'anonymous'
          i.onload = () => resolve(i)
          i.onerror = reject
          i.src = mask
        })
        if (cancelled) {
          tex.dispose()
          return
        }
        const SIZE = 1024
        const c = document.createElement('canvas')
        c.width = SIZE
        c.height = SIZE
        const ctx = c.getContext('2d')!
        const iw = img.naturalWidth || img.width || SIZE
        const ih = img.naturalHeight || img.height || SIZE
        const scale = Math.min(SIZE / iw, SIZE / ih)
        const dw = iw * scale
        const dh = ih * scale
        ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh)
        maskTex = new THREE.CanvasTexture(c)
        maskTex.minFilter = THREE.LinearMipmapLinearFilter
        maskTex.magFilter = THREE.LinearFilter
        maskTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        maskTex.generateMipmaps = true
        maskTex.needsUpdate = true
      }

      const material = new THREE.ShaderMaterial({
        transparent: true,
        extensions: {derivatives: true} as any,
        defines: mask ? {USE_MASK: ''} : {},
        vertexShader: `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform sampler2D uMatcap;
          #ifdef USE_MASK
          uniform sampler2D uMask;
          #endif
          uniform vec2 uMouseDir;
          uniform float uInfluence;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);

            #ifdef USE_MASK
            float maskA = texture2D(uMask, vUv).a;
            if (maskA < 0.01) discard;
            float bevel = 0.0;
            vec2 bevelDir = vec2(0.0);
            #else
            if (r > 1.0) discard;
            float rim = smoothstep(0.75, 1.0, r);
            float bevel = pow(rim, 2.0) * 0.6;
            vec2 bevelDir = r > 0.0001 ? p / r : vec2(0.0);
            #endif

            vec2 bias = vec2(-0.18, 0.22);
            vec2 brightDir = normalize(bias);
            float alignment = dot(uMouseDir, brightDir);
            float strength = mix(0.01, 0.05, alignment * 0.5 + 0.5);
            vec2 mouseBias = uMouseDir * strength * uInfluence;

            vec3 n = normalize(vec3(
              bevelDir.x * bevel + bias.x + mouseBias.x,
              bevelDir.y * bevel + bias.y + mouseBias.y,
              1.0
            ));

            vec2 nxy = n.xy;
            float nl = length(nxy);
            if (nl > 0.6) nxy *= 0.6 / nl;
            vec2 muv = nxy * 0.5 + 0.5;
            vec3 color = texture2D(uMatcap, muv).rgb;

            color.b *= 0.78;
            color.r *= 1.05;

            float fres = pow(1.0 - max(n.z, 0.0), 3.0);
            color += vec3(1.0, 0.92, 0.7) * fres * 0.3;

            color = clamp(color, 0.0, 1.0);

            #ifdef USE_MASK
            float edge = smoothstep(0.0, 0.5, maskA);
            #else
            float edge = 1.0 - smoothstep(0.97, 1.0, r);
            #endif
            gl_FragColor = vec4(color, edge);
          }
        `,
        uniforms: {
          uMatcap: {value: tex},
          uMask: {value: maskTex},
          uMouseDir: {value: new THREE.Vector2(0, 0)},
          uInfluence: {value: 0},
        },
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const INFLUENCE_RADIUS = 8

      const target = {dirX: 0, dirY: 0, influence: 0}
      const smooth = {dirX: 0, dirY: 0, influence: 0}

      const onMove = (e: MouseEvent) => {
        const r = canvas.getBoundingClientRect()
        const radius = r.width / 2
        if (radius <= 0) return
        const cx = r.left + radius
        const cy = r.top + radius
        const dx = (e.clientX - cx) / radius
        const dy = -(e.clientY - cy) / radius
        const dist = Math.hypot(dx, dy)
        const influence = Math.max(0, 1 - dist / INFLUENCE_RADIUS)
        target.influence = influence * influence * (3 - 2 * influence)
        const norm = Math.max(dist, 0.0001)
        target.dirX = dx / norm
        target.dirY = dy / norm
      }
      const onLeave = () => {
        target.influence = 0
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseleave', onLeave)
      window.addEventListener('resize', resize)

      const loop = () => {
        if (cancelled) return
        raf = requestAnimationFrame(loop)
        smooth.dirX += (target.dirX - smooth.dirX) * 0.12
        smooth.dirY += (target.dirY - smooth.dirY) * 0.12
        smooth.influence += (target.influence - smooth.influence) * 0.1
        material.uniforms.uMouseDir.value.set(smooth.dirX, smooth.dirY)
        material.uniforms.uInfluence.value = smooth.influence
        renderer.render(scene, camera)
      }
      loop()

      cleanup = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseleave', onLeave)
        window.removeEventListener('resize', resize)
        geometry.dispose()
        material.dispose()
        tex.dispose()
        if (maskTex) maskTex.dispose()
        renderer.dispose()
      }
    }

    init()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (cleanup) cleanup()
    }
  }, [mask])

  return <canvas ref={canvasRef} className="routine-step-canvas" aria-hidden="true" />
}

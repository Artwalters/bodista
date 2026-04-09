'use client'

import {useEffect} from 'react'

// Single shared WebGL canvas that renders every <GoldCircle> placeholder
// in the DOM. This replaces the previous one-context-per-circle approach,
// which was blowing through the browser's WebGL context limit.

interface CircleEntry {
  el: HTMLElement
  mask: string | null
  text: string | null
  maskTex: any | null // THREE.Texture
  useMask: boolean
  influence: number
  visible: boolean
}

export function GoldCircleProvider() {
  useEffect(() => {
    let cancelled = false
    let raf = 0
    let cleanup: (() => void) | null = null

    const init = async () => {
      const THREE = await import('three')
      const {getLenisInstance} = await import('~/lib/lenis')
      if (cancelled) return

      const canvas = document.createElement('canvas')
      canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:997;'
      document.body.appendChild(canvas)

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      renderer.setClearColor(0x000000, 0)
      renderer.autoClear = false
      renderer.setScissorTest(true)

      const scene = new THREE.Scene()
      const camera = new THREE.Camera()

      const loader = new THREE.TextureLoader()
      const matcap = await new Promise<any>((resolve, reject) => {
        loader.load('/assets/textures/image.png', resolve, undefined, reject)
      })
      if (cancelled) {
        matcap.dispose()
        return
      }
      matcap.colorSpace = THREE.SRGBColorSpace

      const material = new THREE.ShaderMaterial({
        transparent: true,
        extensions: {derivatives: true} as any,
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
          uniform sampler2D uMask;
          uniform float uUseMask;
          uniform vec2 uMouseDir;
          uniform float uInfluence;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);

            float maskA = 1.0;
            float bevel = 0.0;
            vec2 bevelDir = vec2(0.0);
            if (uUseMask > 0.5) {
              maskA = texture2D(uMask, vUv).a;
              if (maskA < 0.01) discard;
            } else {
              if (r > 1.0) discard;
              float rim = smoothstep(0.75, 1.0, r);
              bevel = pow(rim, 2.0) * 0.6;
              bevelDir = r > 0.0001 ? p / r : vec2(0.0);
            }

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

            float edge;
            if (uUseMask > 0.5) {
              edge = smoothstep(0.0, 0.5, maskA);
            } else {
              edge = 1.0 - smoothstep(0.97, 1.0, r);
            }
            gl_FragColor = vec4(color, edge);
          }
        `,
        uniforms: {
          uMatcap: {value: matcap},
          uMask: {value: null},
          uUseMask: {value: 0},
          uMouseDir: {value: new THREE.Vector2(0, 0)},
          uInfluence: {value: 0},
        },
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const entries: CircleEntry[] = []
      const seen = new WeakSet<HTMLElement>()

      const loadMask = async (src: string): Promise<any> => {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image()
          i.crossOrigin = 'anonymous'
          i.onload = () => resolve(i)
          i.onerror = reject
          i.src = src
        })
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
        const tex = new THREE.CanvasTexture(c)
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        tex.generateMipmaps = true
        tex.needsUpdate = true
        return tex
      }

      const makeTextMask = async (text: string): Promise<any> => {
        if (document.fonts && 'ready' in document.fonts) {
          try {
            await document.fonts.ready
          } catch {}
        }
        const SIZE = 1024
        const c = document.createElement('canvas')
        c.width = SIZE
        c.height = SIZE
        const ctx = c.getContext('2d')!
        const rootStyle = getComputedStyle(document.documentElement)
        const fontFamily =
          rootStyle.getPropertyValue('--font-display').trim() || 'serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `900 ${Math.floor(SIZE * 0.82)}px ${fontFamily}`
        ctx.fillText(text, SIZE / 2, SIZE / 2 + SIZE * 0.08)
        const tex = new THREE.CanvasTexture(c)
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        tex.generateMipmaps = true
        tex.needsUpdate = true
        return tex
      }

      let needsRender = true
      const markDirty = () => {
        needsRender = true
      }

      const visObserver = new IntersectionObserver(
        (obs) => {
          for (const o of obs) {
            const e = entries.find((x) => x.el === o.target)
            if (e) {
              e.visible = o.isIntersecting
              markDirty()
            }
          }
        },
        {rootMargin: '200px'},
      )

      const addEntry = (el: HTMLElement) => {
        if (seen.has(el)) return
        seen.add(el)
        const mask = el.getAttribute('data-gold-mask')
        const text = el.getAttribute('data-gold-text')
        const entry: CircleEntry = {
          el,
          mask,
          text,
          maskTex: null,
          useMask: Boolean(mask || text),
          influence: 0,
          visible: true,
        }
        entries.push(entry)
        visObserver.observe(el)
        markDirty()

        if (text) {
          makeTextMask(text).then((t) => {
            if (cancelled) t.dispose()
            else {
              entry.maskTex = t
              markDirty()
            }
          })
        } else if (mask) {
          loadMask(mask).then((t) => {
            if (cancelled) t.dispose()
            else {
              entry.maskTex = t
              markDirty()
            }
          })
        }
      }

      const scan = () => {
        document
          .querySelectorAll<HTMLElement>('[data-gold-circle]')
          .forEach(addEntry)
      }
      scan()

      const observer = new MutationObserver(() => scan())
      observer.observe(document.body, {childList: true, subtree: true})

      const mouse = {x: 0, y: 0}
      const smoothMouse = {x: 0, y: 0}
      let mouseSettled = true

      const onMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX
        mouse.y = e.clientY
        mouseSettled = false
        markDirty()
      }
      window.addEventListener('mousemove', onMouseMove)

      const onScroll = () => markDirty()
      window.addEventListener('scroll', onScroll, {passive: true})
      const lenis = getLenisInstance()
      if (lenis) lenis.on('scroll', onScroll)

      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false)
        markDirty()
      }
      window.addEventListener('resize', onResize)

      const loop = () => {
        if (cancelled) return
        raf = requestAnimationFrame(loop)

        // Smooth the mouse position until it settles, then stop rendering.
        if (!mouseSettled) {
          const dx = mouse.x - smoothMouse.x
          const dy = mouse.y - smoothMouse.y
          smoothMouse.x += dx * 0.12
          smoothMouse.y += dy * 0.12
          if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
            smoothMouse.x = mouse.x
            smoothMouse.y = mouse.y
            mouseSettled = true
          } else {
            needsRender = true
          }
        }

        if (!needsRender) return
        needsRender = false

        renderer.clear()

        for (const e of entries) {
          if (!e.visible) continue
          if (e.useMask && !e.maskTex) continue

          const r = e.el.getBoundingClientRect()
          if (
            r.width <= 0 ||
            r.height <= 0 ||
            r.bottom <= 0 ||
            r.top >= window.innerHeight ||
            r.right <= 0 ||
            r.left >= window.innerWidth
          ) {
            continue
          }

          // Per-circle mouse direction + influence
          const radius = r.width / 2
          if (radius <= 0) continue
          const cx = r.left + radius
          const cy = r.top + radius
          const dx = (smoothMouse.x - cx) / radius
          const dy = -(smoothMouse.y - cy) / radius
          const dist = Math.hypot(dx, dy)
          const INFLUENCE_RADIUS = 8
          const rawInfluence = Math.max(0, 1 - dist / INFLUENCE_RADIUS)
          const targetInfluence =
            rawInfluence * rawInfluence * (3 - 2 * rawInfluence)
          e.influence += (targetInfluence - e.influence) * 0.1
          const norm = Math.max(dist, 0.0001)

          material.uniforms.uUseMask.value = e.useMask ? 1 : 0
          material.uniforms.uMask.value = e.maskTex
          material.uniforms.uMouseDir.value.set(dx / norm, dy / norm)
          material.uniforms.uInfluence.value = e.influence

          // three.js setViewport/setScissor expect CSS pixels (logical).
          // Flip Y for WebGL's bottom-left origin. Clamp to viewport so
          // partially-offscreen rects don't leave artifacts.
          const left = Math.max(0, r.left)
          const right = Math.min(window.innerWidth, r.right)
          const top = Math.max(0, r.top)
          const bottom = Math.min(window.innerHeight, r.bottom)
          const w = right - left
          const h = bottom - top
          if (w <= 0 || h <= 0) continue
          const x = left
          const y = window.innerHeight - bottom

          // Scissor clips to the clamped region, viewport still matches the
          // full (unclamped) element so the shader coordinates stay correct.
          renderer.setViewport(
            r.left,
            window.innerHeight - r.bottom,
            r.width,
            r.height,
          )
          renderer.setScissor(x, y, w, h)
          renderer.render(scene, camera)
        }
      }
      loop()

      cleanup = () => {
        observer.disconnect()
        visObserver.disconnect()
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('scroll', onScroll)
        if (lenis) lenis.off('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        for (const e of entries) {
          if (e.maskTex) e.maskTex.dispose()
        }
        geometry.dispose()
        material.dispose()
        matcap.dispose()
        renderer.dispose()
        canvas.remove()
      }
    }

    init()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (cleanup) cleanup()
    }
  }, [])

  return null
}

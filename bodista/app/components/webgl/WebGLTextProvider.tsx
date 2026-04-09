'use client'

import {useEffect} from 'react'

const FONT_DEFAULT = 'https://bodista.b-cdn.net/Novela/Novela-Regular.otf'
const FONT_ITALIC = 'https://bodista.b-cdn.net/Novela/Novela-RegularItalic.otf'

const textVertShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const goldFragShader = /* glsl */ `
uniform float uReveal;
uniform float uOpacity;
uniform sampler2D uMatcap;
uniform vec2 uResolution;
varying vec2 vUv;

float hashG(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noiseG(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hashG(i);
  float b = hashG(i + vec2(1.0, 0.0));
  float c = hashG(i + vec2(0.0, 1.0));
  float d = hashG(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbmG(vec2 p) {
  float value = 0.0;
  float amp = 0.6;
  for (int i = 0; i < 7; i++) {
    value += amp * noiseG(p);
    p *= 2.2;
    amp *= 0.55;
  }
  return value;
}

void main() {
  float n = fbmG(vUv * 10.0);
  float expandedReveal = uReveal * 1.6 - 0.3;
  float mask = smoothstep(expandedReveal - 0.15, expandedReveal + 0.15, n);
  float alpha = 1.0 - mask;
  alpha *= uOpacity;
  if (alpha < 0.01) discard;

  // Sample matcap with an offset that follows the cursor, so reflections shift
  // with the mouse and the dark corner of the matcap is never revealed.
  // Sample matcap in screen space so the gold gradient spans the entire text block
  vec2 muv = gl_FragCoord.xy / uResolution;
  muv = muv * 0.6 + 0.2;
  vec3 color = texture2D(uMatcap, muv).rgb;
  color.b *= 0.78;
  color.r *= 1.05;
  color = pow(color, vec3(0.82));
  color *= 1.25;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`

const textFragShader = /* glsl */ `
uniform float uReveal;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.6;
  for (int i = 0; i < 7; i++) {
    value += amp * noise(p);
    p *= 2.2;
    amp *= 0.55;
  }
  return value;
}

void main() {
  float n = fbm(vUv * 10.0);
  float expandedReveal = uReveal * 1.6 - 0.3;
  float mask = smoothstep(expandedReveal - 0.15, expandedReveal + 0.15, n);
  float alpha = 1.0 - mask;
  alpha *= uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`

interface TextEntry {
  mesh: any
  element: HTMLElement
  material: any
  bounds: DOMRect
  y: number
  anchorX: string
  vertical: boolean
}

export function WebGLTextProvider() {
  useEffect(() => {
    let cancelled = false
    let animationId = 0
    let canvas: HTMLCanvasElement | undefined
    let resizeHandler: (() => void) | undefined
    const restoreElements: Array<{el: HTMLElement; val: string}> = []

    const init = async () => {
      await document.fonts.ready
      if (cancelled) return

      const {configureTextBuilder, Text} = await import('troika-three-text')
      configureTextBuilder({useWorker: false})

      const THREE = await import('three')
      const {getLenisInstance} = await import('~/lib/lenis')
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      if (cancelled) return

      const lenis = getLenisInstance()
      if (!lenis) {
        console.warn('[WebGLTextProvider] Lenis instance not found')
        return
      }

      let needsRender = true
      lenis.on('scroll', () => {
        needsRender = true
      })

      const screen = {width: window.innerWidth, height: window.innerHeight}
      const DIST = 500
      const fov = 2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI)

      const camera = new THREE.PerspectiveCamera(
        fov,
        screen.width / screen.height,
        10,
        1000,
      )
      camera.position.z = DIST

      const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
      renderer.setSize(screen.width, screen.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      canvas = renderer.domElement
      canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:996;'
      document.body.appendChild(canvas)

      const scene = new THREE.Scene()
      const texts: TextEntry[] = []
      const seen = new WeakSet<HTMLElement>()

      const texLoader = new THREE.TextureLoader()
      const goldMatcap = await new Promise<any>((resolve, reject) => {
        texLoader.load('/assets/textures/image.png', resolve, undefined, reject)
      })
      if (cancelled) return
      goldMatcap.colorSpace = THREE.SRGBColorSpace
      const goldResolution = new THREE.Vector2(
        screen.width * Math.min(window.devicePixelRatio, 2),
        screen.height * Math.min(window.devicePixelRatio, 2),
      )

      const addText = (element: HTMLElement) => {
        if (seen.has(element)) return
        seen.add(element)

        const computed = window.getComputedStyle(element)
        const bounds = element.getBoundingClientRect()
        const y = bounds.top + lenis.actualScroll
        const fontSizeNum = parseFloat(computed.fontSize)
        const color = new THREE.Color(computed.color)
        const isGold = element.hasAttribute('data-animation-gold')

        const material = new THREE.ShaderMaterial({
          vertexShader: textVertShader,
          fragmentShader: isGold ? goldFragShader : textFragShader,
          transparent: true,
          uniforms: isGold
            ? {
                uReveal: new THREE.Uniform(0),
                uOpacity: new THREE.Uniform(1),
                uMatcap: new THREE.Uniform(goldMatcap),
                uResolution: new THREE.Uniform(goldResolution),
              }
            : {
                uReveal: new THREE.Uniform(0),
                uOpacity: new THREE.Uniform(1),
                uColor: new THREE.Uniform(color),
              },
        })

        const isItalic = computed.fontStyle === 'italic'
        const writingMode = computed.writingMode
        const vertical =
          writingMode === 'vertical-rl' || writingMode === 'vertical-lr'
        const textAlign = computed.textAlign
        const anchorX = vertical
          ? '0%'
          : textAlign === 'center'
            ? '50%'
            : textAlign === 'right' || textAlign === 'end'
              ? '100%'
              : '0%'
        const mesh = new Text()
        mesh.text = element.innerText
        mesh.font = isItalic ? FONT_ITALIC : FONT_DEFAULT
        mesh.anchorX = anchorX
        mesh.anchorY = '50%'
        mesh.material = material
        mesh.fontSize = fontSizeNum
        mesh.textAlign = vertical ? 'center' : computed.textAlign

        const ls = parseFloat(computed.letterSpacing)
        mesh.letterSpacing = isNaN(ls) ? 0 : ls / fontSizeNum

        const lh = parseFloat(computed.lineHeight)
        mesh.lineHeight = isNaN(lh) ? 1.2 : lh / fontSizeNum

        // For vertical writing, the text is rotated 90° — use height as the flow width
        mesh.maxWidth = vertical ? bounds.height : bounds.width
        mesh.whiteSpace = computed.whiteSpace

        if (vertical) {
          // writing-mode: vertical-rl rotates text 90° clockwise
          mesh.rotation.z = -Math.PI / 2
        }

        scene.add(mesh)
        const originalColor = element.style.color
        element.style.color = 'transparent'
        restoreElements.push({el: element, val: originalColor})

        const entry: TextEntry = {
          mesh,
          element,
          material,
          bounds,
          y,
          anchorX,
          vertical,
        }
        texts.push(entry)

        const isScrub = element.hasAttribute('data-animation-scrub')

        if (isScrub) {
          gsap.to(material.uniforms.uReveal, {
            value: 1,
            ease: 'none',
            onUpdate: () => {
              needsRender = true
            },
            scrollTrigger: {
              trigger: element,
              start: 'top 120%',
              end: 'bottom 70%',
              scrub: true,
            },
          })
        } else {
          gsap.to(material.uniforms.uReveal, {
            value: 1,
            duration: 4,
            ease: 'power2.inOut',
            onUpdate: () => {
              needsRender = true
            },
            scrollTrigger: {
              trigger: element,
              start: 'top 95%',
              toggleActions: 'play none none none',
            },
          })
        }

        needsRender = true
      }

      const scan = () => {
        document
          .querySelectorAll<HTMLElement>('[data-animation="webgl-text"]')
          .forEach(addText)
      }

      scan()

      const observer = new MutationObserver(() => scan())
      observer.observe(document.body, {childList: true, subtree: true})

      const update = () => {
        if (needsRender) {
          texts.forEach((t) => {
            if (t.vertical) {
              // Pivot at top-centre of the box; text flows downward after rotation
              t.mesh.position.x =
                t.bounds.left - screen.width / 2 + t.bounds.width / 2
              t.mesh.position.y =
                -t.y + lenis.animatedScroll + screen.height / 2
            } else {
              const offsetX =
                t.anchorX === '50%'
                  ? t.bounds.width / 2
                  : t.anchorX === '100%'
                    ? t.bounds.width
                    : 0
              t.mesh.position.x = t.bounds.left - screen.width / 2 + offsetX
              t.mesh.position.y =
                -t.y +
                lenis.animatedScroll +
                screen.height / 2 -
                t.bounds.height / 2
            }
          })
          renderer.render(scene, camera)
          needsRender = false
        }
        animationId = requestAnimationFrame(update)
      }
      update()

      resizeHandler = () => {
        screen.width = window.innerWidth
        screen.height = window.innerHeight
        renderer.setSize(screen.width, screen.height)
        const pr = Math.min(window.devicePixelRatio, 2)
        renderer.setPixelRatio(pr)
        goldResolution.set(screen.width * pr, screen.height * pr)
        camera.fov = 2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI)
        camera.aspect = screen.width / screen.height
        camera.updateProjectionMatrix()

        texts.forEach((t) => {
          const computed = window.getComputedStyle(t.element)
          t.bounds = t.element.getBoundingClientRect()
          t.y = t.bounds.top + lenis.actualScroll
          const fs = parseFloat(computed.fontSize)
          t.mesh.fontSize = fs
          const ls = parseFloat(computed.letterSpacing)
          t.mesh.letterSpacing = isNaN(ls) ? 0 : ls / fs
          const lh = parseFloat(computed.lineHeight)
          t.mesh.lineHeight = isNaN(lh) ? 1.2 : lh / fs
          t.mesh.maxWidth = t.vertical ? t.bounds.height : t.bounds.width
        })

        needsRender = true
      }
      window.addEventListener('resize', resizeHandler)

      // Cleanup hook
      ;(canvas as any).__cleanup = () => {
        observer.disconnect()
        ScrollTrigger.getAll().forEach((st) => {
          if (texts.some((t) => t.element === st.trigger)) st.kill()
        })
        texts.forEach((t) => {
          scene.remove(t.mesh)
          t.mesh.dispose?.()
          t.material.dispose?.()
        })
        renderer.dispose()
      }
    }

    init()

    return () => {
      cancelled = true
      if (animationId) cancelAnimationFrame(animationId)
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      if (canvas) {
        ;(canvas as any).__cleanup?.()
        canvas.remove()
      }
      restoreElements.forEach(({el, val}) => {
        el.style.color = val
      })
    }
  }, [])

  return null
}

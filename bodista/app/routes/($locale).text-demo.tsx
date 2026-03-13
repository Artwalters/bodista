import {useEffect, useState, useCallback, useRef} from 'react';
import type {Route} from './+types/text-demo';
import styles from '~/styles/text-demo.module.css';

import {FONT_DEFAULT} from '~/lib/font-novela-regular';
import {FONT_ITALIC} from '~/lib/font-novela-regularitalic';

/* ── Text Shaders ── */

const textVertShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const textFragShader = /* glsl */ `
uniform float uReveal;
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
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

void main() {
  float n = fbm(vUv * 6.0);
  float expandedReveal = uReveal * 1.6 - 0.3;
  float mask = smoothstep(expandedReveal - 0.3, expandedReveal + 0.3, n);
  float alpha = 1.0 - mask;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

/* ── Image Shaders ── */

const imgVertShader = /* glsl */ `
varying vec2 vUv;
varying vec2 ssCoords;

uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform float u_progress;
uniform bool u_enableBend;

void main() {
  vec3 pos = position;

  mat4 MVPM = projectionMatrix * modelViewMatrix;
  vec4 originalPosition = MVPM * vec4(position, 1.0);
  ssCoords = vec2(originalPosition.xy / originalPosition.w);

  if (u_enableBend) {
    float startAt = uv.y - 0.5;
    float finishAt = uv.y;
    float bend = smoothstep(startAt, finishAt, 1.0 - u_progress);
    pos.x *= 1.0 + (bend * 0.08) * abs(ssCoords.x);
    pos.z += bend * 14.0;
  }

  vUv = uv;
  gl_Position = MVPM * vec4(pos, 1.0);
}
`;

const imgFragShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform float u_opacity;
uniform float u_innerScale;
uniform float u_innerY;
uniform float u_edgeFade;

varying vec2 vUv;
varying vec2 ssCoords;

vec2 getCoverUv(vec2 uv, vec2 textureSize, vec2 quadSize) {
  vec2 ratio = vec2(
    min((quadSize.x / quadSize.y) / (textureSize.x / textureSize.y), 1.0),
    min((quadSize.y / quadSize.x) / (textureSize.y / textureSize.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  vec2 uv = getCoverUv(vUv, uTextureSize, uQuadSize);

  // Parallax: inner scale + Y offset
  vec2 scaleOrigin = vec2(0.5);
  uv = (uv - scaleOrigin) / u_innerScale + scaleOrigin;
  uv.y += u_innerY;

  vec4 color = texture2D(uTexture, uv);

  // Edge color shift (chromatic aberration at edges)
  float thresholdLeft = smoothstep(-0.85, -1.0, ssCoords.x) * u_edgeFade;
  float thresholdRight = smoothstep(0.85, 1.0, ssCoords.x) * u_edgeFade;
  float thresholdTop = smoothstep(0.85, 1.0, ssCoords.y) * u_edgeFade;
  float thresholdBottom = smoothstep(-0.85, -1.0, ssCoords.y) * u_edgeFade;
  float threshold = thresholdLeft + thresholdRight + thresholdBottom + thresholdTop;

  float colorShiftR = texture2D(uTexture, uv + vec2(0.0, 0.003)).r;
  float colorShiftG = texture2D(uTexture, uv - vec2(0.0, 0.003)).g;
  color.r = mix(color.r, colorShiftR, threshold);
  color.g = mix(color.g, colorShiftG, threshold);

  gl_FragColor = vec4(color.rgb, color.a * u_opacity);
}
`;

export const meta: Route.MetaFunction = () => {
  return [{title: 'Bodista | WebGL Text Demo'}];
};

/* ── Types ── */

interface TextEntry {
  mesh: any;
  element: HTMLElement;
  material: THREE.ShaderMaterial;
  bounds: DOMRect;
  y: number;
  isVisible: boolean;
}

interface ImageEntry {
  mesh: THREE.Mesh;
  element: HTMLImageElement;
  material: THREE.ShaderMaterial;
  effect: string;
  width: number;
  height: number;
  top: number;
  left: number;
  depth: number;
  isOilImage: boolean;
}

import type * as THREE from 'three';

// Shared drag state between OilSection and WebGL render loop
let oilDragX = 0;

export default function TextDemo() {
  const [webglEnabled, setWebglEnabled] = useState(true);
  const cleanupRef = useCallback(() => {}, []);

  useEffect(() => {
    if (!webglEnabled) {
      document.body.classList.remove('webgl-active');
      return;
    }

    document.body.classList.add('webgl-active');

    let animationId: number;
    let resizeHandler: (() => void) | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let cancelled = false;

    // Restore visibility on text/image elements when WebGL takes over
    const restoreElements: Array<{el: HTMLElement; prop: string; val: string}> = [];

    const init = async () => {
      await document.fonts.ready;

      const THREE = await import('three');
      const {Text, configureTextBuilder} = await import('troika-three-text');

      // Disable Web Worker — Oxygen CSP blocks blob: worker URLs
      configureTextBuilder({useWorker: false});
      const {getLenisInstance} = await import('~/lib/lenis');
      const gsap = (await import('gsap')).default;
      const {ScrollTrigger} = await import('gsap/ScrollTrigger');
      const {EffectComposer} = await import(
        'three/examples/jsm/postprocessing/EffectComposer.js'
      );
      const {RenderPass} = await import(
        'three/examples/jsm/postprocessing/RenderPass.js'
      );
      const {ShaderPass} = await import(
        'three/examples/jsm/postprocessing/ShaderPass.js'
      );

      gsap.registerPlugin(ScrollTrigger);

      if (cancelled) return;

      const lenis = getLenisInstance();
      if (!lenis) {
        console.warn('Lenis instance not found');
        return;
      }

      /* ── Screen & camera ── */

      const screen = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const DIST = 500;

      const fov =
        2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI);

      const camera = new THREE.PerspectiveCamera(
        fov,
        screen.width / screen.height,
        10,
        1000,
      );
      camera.position.z = DIST;

      /* ── Renderer ── */

      const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
      renderer.setSize(screen.width, screen.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      canvas = renderer.domElement;
      canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:10;';
      document.body.appendChild(canvas);

      /* ── Scene ── */

      const scene = new THREE.Scene();

      /* ── WebGL texts ── */

      const textElements = document.querySelectorAll<HTMLElement>(
        '[data-animation="webgl-text"]',
      );
      const texts: TextEntry[] = [];

      textElements.forEach((element) => {
        const computed = window.getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        const y = bounds.top + lenis.actualScroll;
        const fontSizeNum = parseFloat(computed.fontSize);
        const color = new THREE.Color(computed.color);

        const material = new THREE.ShaderMaterial({
          fragmentShader: textFragShader,
          vertexShader: textVertShader,
          transparent: true,
          uniforms: {
            uReveal: new THREE.Uniform(0),
            uColor: new THREE.Uniform(color),
          },
        });

        // Pick font based on font-style
        const isItalic = computed.fontStyle === 'italic';
        const fontUrl = isItalic ? FONT_ITALIC : FONT_DEFAULT;

        const mesh = new Text();
        mesh.text = element.innerText;
        mesh.font = fontUrl;
        mesh.anchorX = '0%';
        mesh.anchorY = '50%';
        mesh.material = material;
        mesh.fontSize = fontSizeNum;
        mesh.textAlign = computed.textAlign;

        const ls = parseFloat(computed.letterSpacing);
        mesh.letterSpacing = isNaN(ls) ? 0 : ls / fontSizeNum;

        const lh = parseFloat(computed.lineHeight);
        mesh.lineHeight = isNaN(lh) ? 1.2 : lh / fontSizeNum;

        mesh.maxWidth = bounds.width;
        mesh.whiteSpace = computed.whiteSpace;

        scene.add(mesh);
        element.style.color = 'transparent';
        restoreElements.push({el: element, prop: 'color', val: ''});

        texts.push({mesh, element, material, bounds, y, isVisible: false});
      });

      /* ── Noise reveal animations ── */

      texts.forEach((t) => {
        t.isVisible = true;
        const isInHero = t.element.closest(`.${styles.hero}`);

        if (isInHero) {
          // Hero text: reveal on page load
          gsap.to(t.material.uniforms.uReveal, {
            value: 1,
            duration: 2.5,
            delay: 0.3,
            ease: 'power2.inOut',
          });
        } else {
          // Other text: reveal on scroll into view
          gsap.to(t.material.uniforms.uReveal, {
            value: 1,
            duration: 2.5,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: t.element,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          });
        }
      });

      /* ── WebGL images ── */

      const mediaElements = document.querySelectorAll<HTMLImageElement>(
        '[data-webgl-media]',
      );
      const images: ImageEntry[] = [];
      const imageGeometry = new THREE.PlaneGeometry(1, 1, 32, 32);
      const textureLoader = new THREE.TextureLoader();

      // Wait for all images to load
      await Promise.all(
        Array.from(mediaElements).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            }),
        ),
      );

      if (cancelled) return;

      for (const img of mediaElements) {
        const texture = await textureLoader.loadAsync(img.src);
        const bounds = img.getBoundingClientRect();
        const effect = img.dataset.webglEffect || 'none';
        const depth = parseFloat(img.dataset.webglDepth || '0');

        // Set initial uniforms based on effect type
        const hasBend = effect === 'bend' || effect === 'distort';
        const hasParallax = effect === 'parallax';
        const hasDistort = effect === 'distort';

        const imgMaterial = new THREE.ShaderMaterial({
          vertexShader: imgVertShader,
          fragmentShader: imgFragShader,
          transparent: true,
          uniforms: {
            uTexture: {value: texture},
            uTextureSize: {
              value: new THREE.Vector2(
                texture.image.width,
                texture.image.height,
              ),
            },
            uQuadSize: {
              value: new THREE.Vector2(bounds.width, bounds.height),
            },
            u_progress: {value: 0},
            u_enableBend: {value: hasBend},
            u_innerScale: {value: 1.0},
            u_innerY: {value: hasParallax ? -0.04 : 0.0},
            u_opacity: {value: 1},
            u_edgeFade: {value: hasDistort ? 1.0 : 0.0},
          },
        });

        const imgMesh = new THREE.Mesh(imageGeometry, imgMaterial);
        imgMesh.scale.set(bounds.width, bounds.height, 1);
        scene.add(imgMesh);

        img.style.visibility = 'hidden';
        restoreElements.push({el: img, prop: 'visibility', val: ''});

        images.push({
          mesh: imgMesh,
          element: img,
          material: imgMaterial,
          effect,
          width: bounds.width,
          height: bounds.height,
          top: bounds.top + lenis.actualScroll,
          left: bounds.left,
          depth,
          isOilImage: img.hasAttribute('data-oil-image'),
        });
      }

      /* ── ScrollTrigger animations per image (based on effect type) ── */

      images.forEach((img) => {
        const {effect} = img;

        // "bend" or "distort": animate u_progress for the vertex bend
        if (effect === 'bend' || effect === 'distort') {
          gsap.to(img.material.uniforms.u_progress, {
            value: 1.5,
            ease: 'sine.out',
            scrollTrigger: {
              trigger: img.element,
              scrub: true,
              start: 'top bottom',
              end: 'bottom 70%',
            },
          });
        }

        // "parallax": inner Y pan + inner scale zoom
        if (effect === 'parallax') {
          gsap.fromTo(
            img.material.uniforms.u_innerY,
            {value: -0.04},
            {
              value: 0.04,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          );
          gsap.fromTo(
            img.material.uniforms.u_innerScale,
            {value: 1.03},
            {
              value: 1.0,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          );
        }

        // "distort": also zoom in + chromatic aberration is already on via u_edgeFade
        if (effect === 'distort') {
          gsap.fromTo(
            img.material.uniforms.u_innerScale,
            {value: 1.03},
            {
              value: 1.0,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          );
        }
      });

      /* ── Barrel distortion post-processing ── */

      const barrelShader = {
        uniforms: {
          tDiffuse: {value: null},
          u_bendAmount: {value: -0.03},
          u_maxDistort: {value: 0.1},
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform sampler2D tDiffuse;
          uniform float u_bendAmount;
          uniform float u_maxDistort;
          varying vec2 vUv;

          vec2 barrelDistort(vec2 coord, float amt) {
            vec2 cc = coord - 0.5;
            float dist = dot(cc, cc);
            return coord + cc * dist * amt;
          }

          void main() {
            vec2 uv = vUv;
            float rDist = u_maxDistort * u_bendAmount;
            float gDist = u_maxDistort * u_bendAmount * 0.7;
            float bDist = u_maxDistort * u_bendAmount * 0.4;

            float r = texture2D(tDiffuse, barrelDistort(uv, rDist)).r;
            float g = texture2D(tDiffuse, barrelDistort(uv, gDist)).g;
            float b = texture2D(tDiffuse, barrelDistort(uv, bDist)).b;
            float a = texture2D(tDiffuse, barrelDistort(uv, gDist)).a;

            gl_FragColor = vec4(r, g, b, a);
          }
        `,
      };

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const barrelPass = new ShaderPass(barrelShader);
      barrelPass.renderToScreen = true;
      composer.addPass(barrelPass);

      /* ── Render loop ── */

      const update = () => {
        // Update text positions
        texts.forEach((t) => {
          if (t.isVisible) {
            t.mesh.position.x =
              t.bounds.left - screen.width / 2;
            t.mesh.position.y =
              -t.y +
              lenis.animatedScroll +
              screen.height / 2 -
              t.bounds.height / 2;
          }
        });

        // Update image positions (ScrollTrigger handles the animation)
        images.forEach((img) => {
          const dragOffset = img.isOilImage ? oilDragX : 0;
          img.mesh.position.x =
            img.left - screen.width / 2 + img.width / 2 - dragOffset;

          // Depth-based parallax: images further from camera scroll slower
          const parallaxFactor = 1 + img.depth * 0.0004;
          img.mesh.position.y =
            -img.top +
            lenis.animatedScroll * parallaxFactor +
            screen.height / 2 -
            img.height / 2;

          img.mesh.position.z = img.depth;

          // Compensate perspective shrinking so deeper images stay visually large
          const depthScale = DIST / (DIST - img.depth);
          img.mesh.scale.set(
            img.width * depthScale,
            img.height * depthScale,
            1,
          );
        });

        composer.render();
        animationId = requestAnimationFrame(update);
      };

      update();

      /* ── Resize ── */

      resizeHandler = () => {
        screen.width = window.innerWidth;
        screen.height = window.innerHeight;

        renderer.setSize(screen.width, screen.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        camera.fov =
          2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI);
        camera.aspect = screen.width / screen.height;
        camera.updateProjectionMatrix();

        // Resize texts
        texts.forEach((t) => {
          const computed = window.getComputedStyle(t.element);
          t.bounds = t.element.getBoundingClientRect();
          t.y = t.bounds.top + lenis.actualScroll;
          const fs = parseFloat(computed.fontSize);
          t.mesh.fontSize = fs;
          const ls = parseFloat(computed.letterSpacing);
          t.mesh.letterSpacing = isNaN(ls) ? 0 : ls / fs;
          const lh = parseFloat(computed.lineHeight);
          t.mesh.lineHeight = isNaN(lh) ? 1.2 : lh / fs;
          t.mesh.maxWidth = t.bounds.width;
        });

        // Resize images
        images.forEach((img) => {
          const bounds = img.element.getBoundingClientRect();
          img.mesh.scale.set(bounds.width, bounds.height, 1);
          img.width = bounds.width;
          img.height = bounds.height;
          img.top = bounds.top + lenis.actualScroll;
          img.left = bounds.left;
          img.material.uniforms.uQuadSize.value.set(
            bounds.width,
            bounds.height,
          );
        });

        composer.setSize(screen.width, screen.height);
      };

      window.addEventListener('resize', resizeHandler);
    };

    init();

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (canvas) canvas.remove();
      document.body.classList.remove('webgl-active');
      restoreElements.forEach(({el, prop, val}) => {
        el.style.setProperty(prop, val);
      });
    };
  }, [webglEnabled]);

  return (
    <div className={styles.page}>
      <button
        className={styles.toggle}
        onClick={() => setWebglEnabled((v) => !v)}
      >
        <span className={`${styles.toggleDot} ${!webglEnabled ? styles.toggleDotOff : ''}`} />
        {webglEnabled ? 'WebGL on' : 'WebGL off'}
      </button>
      <section className={styles.hero}>
        <h2 data-animation="webgl-text" className={styles.heroText}>
          BODISTA
        </h2>
      </section>
      <section className={styles.imageGrid}>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="none"
            src="/images/1.jpg"
            alt="Foto 1 — geen effect"
            className={styles.gridImage}
          />
        </figure>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="distort"
            src="/images/2.jpg"
            alt="Foto 2 — distort + zoom"
            className={styles.gridImage}
          />
        </figure>
        <section className={styles.approachSection}>
          <p data-animation="webgl-text" className={styles.approachLabel}>
            Our approach
          </p>
          <h2 data-animation="webgl-text" className={styles.approachText}>
            A global leader in groundbreaking digital design and strategy, we
            help forward-thinking clients achieve impact and growth.
          </h2>
        </section>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="parallax"
            src="/images/3.jpg"
            alt="Foto 3 — parallax"
            className={styles.gridImage}
          />
        </figure>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="bend"
            src="/images/4.jpg"
            alt="Foto 4 — bend/peel"
            className={styles.gridImage}
          />
        </figure>
      </section>

      <OilSection />
    </div>
  );
}

function OilSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const scrollXRef = useRef(0);
  const gsapRef = useRef<any>(null);
  const tweenTarget = useRef({x: 0});

  const updateFade = useCallback(() => {
    const text = textRef.current;
    oilDragX = scrollXRef.current;
    if (text) {
      const progress = Math.min(1, Math.max(0, (oilDragX - 50) / 250));
      text.style.opacity = String(1 - progress);
    }
  }, []);

  useEffect(() => {
    import('gsap').then((mod) => {
      gsapRef.current = mod.default;
    });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    if (gsapRef.current) gsapRef.current.killTweensOf(tweenTarget.current);
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScroll = scrollXRef.current;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastTime = Date.now();
    dragRef.current.velocity = 0;
    section.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const now = Date.now();
    const dt = now - dragRef.current.lastTime;
    if (dt > 0) {
      dragRef.current.velocity = (e.clientX - dragRef.current.lastX) / dt * 1000;
    }
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastTime = now;

    const dx = e.clientX - dragRef.current.startX;
    scrollXRef.current = Math.max(0, dragRef.current.startScroll - dx);
    updateFade();
  }, [updateFade]);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    const gsap = gsapRef.current;
    if (!gsap) return;

    const v = dragRef.current.velocity;
    const target = Math.max(0, scrollXRef.current - v * 0.4);
    tweenTarget.current.x = scrollXRef.current;

    gsap.to(tweenTarget.current, {
      x: target,
      duration: Math.max(0.4, Math.min(1.2, Math.abs(v) / 1500)),
      ease: 'power3.out',
      onUpdate: () => {
        scrollXRef.current = tweenTarget.current.x;
        updateFade();
      },
    });
  }, [updateFade]);

  return (
    <section
      ref={sectionRef}
      className={styles.oilSection}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div ref={textRef} className={styles.oilText}>
        <h2 data-animation="webgl-text" className={styles.oilHeading}>
          What makes this oil work
        </h2>
        <p data-animation="webgl-text" className={styles.oilBody}>
          Crafted with rare botanicals, our luxurious face oils nurture your
          skin&rsquo;s natural radiance. These exquisite blends deliver
          unparalleled healing, repair, and nourishment for a revitalized
          complexion.
        </p>
      </div>
      <div className={styles.oilImages}>
        <div className={styles.oilImageCol}>
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="15"
            data-oil-image
            src="/images/1.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgLg}`}
          />
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="-10"
            data-oil-image
            src="/images/2.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgSm}`}
          />
        </div>
        <div className={`${styles.oilImageCol} ${styles.oilImageColOffset}`}>
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="25"
            data-oil-image
            src="/images/3.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgWide}`}
          />
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="-5"
            data-oil-image
            src="/images/4.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgMd}`}
          />
        </div>
        <div className={styles.oilImageCol}>
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="10"
            data-oil-image
            src="/images/1.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgMd}`}
          />
          <img
            data-webgl-media
            data-webgl-effect="none"
            data-webgl-depth="30"
            data-oil-image
            src="/images/3.jpg"
            alt=""
            className={`${styles.oilImg} ${styles.oilImgWide}`}
          />
        </div>
      </div>
    </section>
  );
}

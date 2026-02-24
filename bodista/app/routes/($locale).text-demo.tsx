import {useEffect} from 'react';
import type {Route} from './+types/text-demo';
import styles from '~/styles/text-demo.module.css';

const FONT_SANS = '/fonts/BebasNeue-Regular.ttf';
const FONT_SERIF = '/fonts/SourceSerif4-Regular.ttf';
const FONT_SERIF_ITALIC = '/fonts/SourceSerif4-It.ttf';

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
}

import type * as THREE from 'three';

export default function TextDemo() {
  useEffect(() => {
    let animationId: number;
    let resizeHandler: (() => void) | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let cancelled = false;

    const init = async () => {
      await document.fonts.ready;

      const THREE = await import('three');
      const {Text} = await import('troika-three-text');
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

        // Pick font based on CSS font-family and font-style
        const fontFamily = computed.fontFamily.toLowerCase();
        const isItalic = computed.fontStyle === 'italic';
        const isSerif =
          fontFamily.includes('source serif') ||
          fontFamily.includes('georgia') ||
          fontFamily.includes('times') ||
          (fontFamily.endsWith('serif') && !fontFamily.includes('sans-serif'));
        let fontUrl = FONT_SANS;
        if (isSerif) fontUrl = isItalic ? FONT_SERIF_ITALIC : FONT_SERIF;

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

        images.push({
          mesh: imgMesh,
          element: img,
          material: imgMaterial,
          effect,
          width: bounds.width,
          height: bounds.height,
          top: bounds.top + lenis.actualScroll,
          left: bounds.left,
        });

        console.log(`[WebGL] Image ${img.src} | effect: ${effect} | innerScale: ${imgMaterial.uniforms.u_innerScale.value} | enableBend: ${imgMaterial.uniforms.u_enableBend.value}`);
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
            t.mesh.position.y =
              -t.y +
              lenis.animatedScroll +
              screen.height / 2 -
              t.bounds.height / 2;
            t.mesh.position.x = t.bounds.left - screen.width / 2;
          }
        });

        // Update image positions (ScrollTrigger handles the animation)
        images.forEach((img) => {
          img.mesh.position.x =
            img.left - screen.width / 2 + img.width / 2;
          img.mesh.position.y =
            -img.top +
            lenis.animatedScroll +
            screen.height / 2 -
            img.height / 2;
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
    };
  }, []);

  return (
    <div className={styles.page}>
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
    </div>
  );
}

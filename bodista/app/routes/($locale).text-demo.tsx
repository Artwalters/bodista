import {useEffect} from 'react';
import type {Route} from './+types/text-demo';
import styles from '~/styles/text-demo.module.css';

const FONT_URL = '/fonts/BebasNeue-Regular.ttf';

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
uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform float uViewportY;

varying vec2 vUv;
varying vec2 vUvCover;

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
  vUv = uv;
  vUvCover = getCoverUv(uv, uTextureSize, uQuadSize);

  vec3 pos = position;

  // Strong when entering from bottom, fades to flat at center of screen
  float effect = smoothstep(0.2, 0.9, uViewportY);

  // Bottom of image curves towards camera
  float t = 1.0 - uv.y;
  pos.z += t * t * effect * 150.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const imgFragShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;

varying vec2 vUvCover;

void main() {
  vec4 tex = texture2D(uTexture, vUvCover);
  gl_FragColor = tex;
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

        const mesh = new Text();
        mesh.text = element.innerText;
        mesh.font = FONT_URL;
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

      /* ── Noise reveal animation on page load ── */

      texts.forEach((t) => {
        t.isVisible = true;
        gsap.to(t.material.uniforms.uReveal, {
          value: 1,
          duration: 2.5,
          delay: 0.3,
          ease: 'power2.inOut',
        });
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

        const imgMaterial = new THREE.ShaderMaterial({
          vertexShader: imgVertShader,
          fragmentShader: imgFragShader,
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
            uViewportY: {value: 0},
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
          width: bounds.width,
          height: bounds.height,
          top: bounds.top + lenis.actualScroll,
          left: bounds.left,
        });
      }

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

        // Update image positions + bottom curve
        images.forEach((img) => {
          img.mesh.position.x =
            img.left - screen.width / 2 + img.width / 2;
          img.mesh.position.y =
            -img.top +
            lenis.animatedScroll +
            screen.height / 2 -
            img.height / 2;

          // Normalized viewport Y: 0 = top of screen, 1 = bottom
          const imgScreenY = img.top - lenis.animatedScroll;
          const imgCenterY = imgScreenY + img.height / 2;
          const viewportY = imgCenterY / screen.height;
          img.material.uniforms.uViewportY.value = viewportY;

          img.mesh.scale.set(img.width, img.height, 1);
        });

        renderer.render(scene, camera);
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
            src="/images/1.jpg"
            alt="Bodista visual 1"
            className={styles.gridImage}
          />
        </figure>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            src="/images/2.jpg"
            alt="Bodista visual 2"
            className={styles.gridImage}
          />
        </figure>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            src="/images/3.jpg"
            alt="Bodista visual 3"
            className={styles.gridImage}
          />
        </figure>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            src="/images/4.jpg"
            alt="Bodista visual 4"
            className={styles.gridImage}
          />
        </figure>
      </section>
    </div>
  );
}

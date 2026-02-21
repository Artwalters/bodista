import {useEffect} from 'react';
import type {Route} from './+types/text-demo';
import styles from '~/styles/text-demo.module.css';

const FONT_URL = '/fonts/BebasNeue-Regular.ttf';

/* ── Shaders ── */

const textVertShader = /* glsl */ `
uniform float uProgress;
uniform float uHeight;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.y -= uHeight * (1.0 - uProgress);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const textFragShader = /* glsl */ `
uniform float uProgress;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float reveal = 1.0 - vUv.y;
  if (reveal > uProgress) discard;
  gl_FragColor = vec4(uColor, 1.0);
}
`;

const ppVertShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ppFragShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uVelocity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  float waveAmplitude = uVelocity * 0.0009;
  float waveFrequency = 4.0 + uVelocity * 0.01;

  vec2 waveUv = uv;
  waveUv.x += sin(uv.y * waveFrequency + uTime) * waveAmplitude;
  waveUv.y += sin(uv.x * waveFrequency * 5.0 + uTime * 0.8) * waveAmplitude;

  float r = texture2D(tDiffuse, vec2(waveUv.x, waveUv.y + uVelocity * 0.0005)).r;
  vec4 base = texture2D(tDiffuse, waveUv);

  gl_FragColor = vec4(r, base.gb, base.a);
}
`;

export const meta: Route.MetaFunction = () => {
  return [{title: 'Bodista | WebGL Text Demo'}];
};

/* ── Types for the imperative WebGL layer ── */

interface TextEntry {
  mesh: any;
  element: HTMLElement;
  material: THREE.ShaderMaterial;
  bounds: DOMRect;
  y: number;
  isVisible: boolean;
}

// import THREE as a type-only namespace for the interface above
import type * as THREE from 'three';

export default function TextDemo() {
  useEffect(() => {
    let animationId: number;
    let resizeHandler: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let cancelled = false;

    const init = async () => {
      await document.fonts.ready;

      const THREE = await import('three');
      const {Text} = await import('troika-three-text');
      const {EffectComposer} = await import(
        'three/examples/jsm/postprocessing/EffectComposer.js'
      );
      const {RenderPass} = await import(
        'three/examples/jsm/postprocessing/RenderPass.js'
      );
      const {ShaderPass} = await import(
        'three/examples/jsm/postprocessing/ShaderPass.js'
      );
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
      const DIST = 1000;

      const fov =
        2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI);

      const camera = new THREE.PerspectiveCamera(
        fov,
        screen.width / screen.height,
        200,
        2000,
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
          uniforms: {
            uProgress: new THREE.Uniform(0),
            uHeight: new THREE.Uniform(bounds.height),
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

      /* ── IntersectionObserver (replaces motion's inView) ── */

      texts.forEach((t) => {
        t.isVisible = true;
        t.material.uniforms.uProgress.value = 1;
      });

      /* ── Post-processing ── */

      const composer = new EffectComposer(renderer);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(screen.width, screen.height);

      composer.addPass(new RenderPass(scene, camera));

      const shiftPass = new ShaderPass({
        uniforms: {
          tDiffuse: {value: null},
          uVelocity: {value: 0},
          uTime: {value: 0},
        },
        vertexShader: ppVertShader,
        fragmentShader: ppFragShader,
      });
      composer.addPass(shiftPass);

      /* ── Render loop ── */

      const clock = new THREE.Clock();
      let lerpedVelocity = 0;

      const update = () => {
        const elapsed = clock.getElapsedTime();

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

        shiftPass.uniforms.uTime.value = elapsed;
        lerpedVelocity += (lenis.velocity - lerpedVelocity) * 0.15;
        shiftPass.uniforms.uVelocity.value = lerpedVelocity;

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

        composer.setSize(screen.width, screen.height);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
          t.material.uniforms.uHeight.value = t.bounds.height;
        });
      };

      window.addEventListener('resize', resizeHandler);
    };

    init();

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (observer) observer.disconnect();
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
    </div>
  );
}

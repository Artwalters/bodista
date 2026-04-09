'use client'

import {useEffect, useRef} from 'react'

export function GoldCircle() {
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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

      const material = new THREE.ShaderMaterial({
        transparent: true,
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
          uniform vec2 uMouseDir;    // direction to the cursor, in local units
          uniform float uInfluence;  // 0..1 falloff based on cursor distance
          varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            if (r > 1.0) discard;

            float rim = smoothstep(0.75, 1.0, r);
            float bevel = pow(rim, 2.0) * 0.6;
            vec2 bevelDir = r > 0.0001 ? p / r : vec2(0.0);

            vec2 bias = vec2(-0.18, 0.22);
            // Let the mouse bias work in any direction, but damp it when it points
            // away from the bright side of the matcap so the disc never goes black.
            vec2 brightDir = normalize(bias);
            float alignment = dot(uMouseDir, brightDir); // -1..1
            float strength = mix(0.03, 0.1, alignment * 0.5 + 0.5);
            vec2 mouseBias = uMouseDir * strength * uInfluence;

            vec3 n = normalize(vec3(
              bevelDir.x * bevel + bias.x + mouseBias.x,
              bevelDir.y * bevel + bias.y + mouseBias.y,
              1.0
            ));

            // Keep matcap sampling inside the lit part of the texture
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

            float edge = 1.0 - smoothstep(0.97, 1.0, r);
            gl_FragColor = vec4(color, edge);
          }
        `,
        uniforms: {
          uMatcap: {value: tex},
          uMouseDir: {value: new THREE.Vector2(0, 0)},
          uInfluence: {value: 0},
        },
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Influence radius in button-radii (how far the cursor can be before the effect fades)
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
        // Smooth falloff curve
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
        renderer.dispose()
      }
    }

    init()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (cleanup) cleanup()
    }
  }, [])

  return <canvas ref={canvasRef} className="routine-step-canvas" aria-hidden="true" />
}

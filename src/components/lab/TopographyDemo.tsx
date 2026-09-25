import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  lerpRgb,
  onThemeChange,
  readLabPalette,
  scaleRgb,
} from './theme';

// 简单的 value-noise FBM 高度场
function makeNoise(seed = 7) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const grad = (h: number, x: number, y: number) => {
    switch (h & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      default:
        return -x - y;
    }
  };
  const noise = (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
      lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u),
      v,
    );
  };
  return (x: number, y: number, octaves = 4) => {
    let f = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
      f += amp * noise(x * freq, y * freq);
      freq *= 2.1;
      amp *= 0.5;
    }
    return f;
  };
}

const toColor = (rgb: [number, number, number]) =>
  new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

/** 三维表面形貌：FBM 高度场 + 主题色热力映射 + 线框/实体切换 */
export default function TopographyDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wire, setWire] = useState(false);
  const setModeRef = useRef<(toWire: boolean) => void>(() => {});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    mount.appendChild(renderer.domElement);
    // OrbitControls 会把 touch-action 置为 none，改回 pan-y 保住移动端纵向滚动
    renderer.domElement.style.touchAction = 'pan-y';

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(6, 5.5, 8);
    camera.lookAt(0, 0.5, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.update();

    scene.add(new THREE.AmbientLight(0x555566, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x73a7ff, 0.7);
    rim.position.set(-6, 3, -6);
    scene.add(rim);

    // 高度场
    const fbm = makeNoise();
    const size = 8;
    const segs = 160;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    let min = Infinity;
    let max = -Infinity;
    const heights = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        fbm(x * 0.35 + 3, z * 0.35 + 3, 5) * 1.6 +
        fbm(x * 1.2, z * 1.2, 2) * 0.18;
      heights[i] = y;
      if (y < min) min = y;
      if (y > max) max = y;
    }
    for (let i = 0; i < pos.count; i++) pos.setY(i, heights[i]);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;

    const solidMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      metalness: 0.08,
    });
    const wireMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const mesh = new THREE.Mesh<THREE.PlaneGeometry, THREE.Material>(
      geo,
      solidMat,
    );
    scene.add(mesh);

    let grid: THREE.GridHelper | null = null;

    // 主题色映射：低海拔 = accent-deep 压暗，中 = accent-deep，高 = scene-line
    const applyPalette = () => {
      const palette = readLabPalette();
      const low = scaleRgb(palette.accentDeep, 0.16);
      const mid = palette.accentDeep;
      const high = palette.sceneLine;
      for (let i = 0; i < heights.length; i++) {
        const t = (heights[i] - min) / (max - min);
        const rgb =
          t < 0.55
            ? lerpRgb(low, mid, t / 0.55)
            : lerpRgb(mid, high, (t - 0.55) / 0.45);
        colorAttr.setXYZ(i, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
      }
      colorAttr.needsUpdate = true;

      wireMat.color.copy(toColor(palette.accent));
      rim.color.copy(toColor(palette.accent));

      if (grid) {
        scene.remove(grid);
        grid.geometry.dispose();
        (grid.material as THREE.Material).dispose();
      }
      grid = new THREE.GridHelper(
        12,
        24,
        toColor(scaleRgb(palette.sceneLine, 0.32)).getHex(),
        toColor(scaleRgb(palette.sceneLine, 0.12)).getHex(),
      );
      grid.position.y = min - 0.15;
      scene.add(grid);
    };
    applyPalette();

    setModeRef.current = (toWire: boolean) => {
      mesh.material = toWire ? wireMat : solidMat;
    };

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const rw = mount.clientWidth;
      const rh = mount.clientHeight;
      if (!rw || !rh) return;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
    });
    ro.observe(mount);

    const offTheme = onThemeChange(applyPalette);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      offTheme();
      setModeRef.current = () => {};
      controls.dispose();
      geo.dispose();
      solidMat.dispose();
      wireMat.dispose();
      if (grid) {
        grid.geometry.dispose();
        (grid.material as THREE.Material).dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    setModeRef.current(wire);
  }, [wire]);

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">FBM 高度场 · 160×160 网格</span>
        <div className="lab-btn-group">
          <button
            type="button"
            className={wire ? 'lab-btn' : 'lab-btn is-active'}
            onClick={() => setWire(false)}
          >
            实体
          </button>
          <button
            type="button"
            className={wire ? 'lab-btn is-active' : 'lab-btn'}
            onClick={() => setWire(true)}
          >
            线框
          </button>
        </div>
      </div>
      <div className="lab-demo-stage">
        <div ref={mountRef} className="lab-demo-mount" />
      </div>
      <div className="lab-demo-footer">
        拖拽旋转 · 滚轮缩放 · 颜色映射 = 海拔高度
      </div>
    </div>
  );
}

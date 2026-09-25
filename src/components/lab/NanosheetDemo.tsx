import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cssRgba, onThemeChange, readLabPalette, scaleRgb, type Rgb } from './theme';

const OXIDE_COLOR = 0xff8a45;

function rgbToHex(c: Rgb): number {
  return (
    (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2])
  );
}

/** GAA 纳米片晶体管 3D 结构（Three.js + OrbitControls） */
export default function NanosheetDemo() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const init = () => {
      const palette = readLabPalette();
      const sheetColor = rgbToHex(palette.accent);
      const gateColor = rgbToHex(palette.sceneLine);
      const spacerColor = rgbToHex(scaleRgb(palette.muted, 0.72));
      const sdColor = rgbToHex(scaleRgb(palette.sceneLine, 0.82));
      const substrateColor = rgbToHex(palette.panel2);
      const baseColor = rgbToHex(scaleRgb(palette.muted, 1.15));
      const contactColor = rgbToHex(palette.text);
      const gridColor = rgbToHex(scaleRgb(palette.text, 0.28));
      const gridCenterColor = rgbToHex(scaleRgb(palette.text, 0.42));

      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      // OrbitControls 会把 touch-action 置为 none，改回 pan-y 保住移动端纵向滚动
      renderer.domElement.style.touchAction = 'pan-y';
      mount.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(
        34,
        mount.clientWidth / Math.max(mount.clientHeight, 1),
        1,
        100,
      );
      camera.position.set(8.8, 5.2, 10.2);
      camera.lookAt(0, 1.25, 0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 1.25, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance = 5;
      controls.maxDistance = 22;
      controls.maxPolarAngle = Math.PI * 0.7;
      controls.update();

      scene.add(new THREE.AmbientLight(0x8899bb, 1.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(10, 14, 10);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x73a7ff, 0.55);
      fillLight.position.set(-6, 4, -3);
      scene.add(fillLight);
      const rimLight = new THREE.DirectionalLight(0xff9060, 0.3);
      rimLight.position.set(0, 1, -9);
      scene.add(rimLight);

      const edgeMat = new THREE.LineBasicMaterial({
        color: contactColor,
        transparent: true,
        opacity: 0.2,
      });
      const addEdges = (mesh: THREE.Mesh) => {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          edgeMat,
        );
        edges.position.copy(mesh.position);
        edges.rotation.copy(mesh.rotation);
        scene.add(edges);
      };

      const substrate = new THREE.Mesh(
        new THREE.BoxGeometry(7.3, 0.48, 6.2),
        new THREE.MeshStandardMaterial({
          color: substrateColor,
          roughness: 0.72,
          metalness: 0.04,
        }),
      );
      substrate.position.y = -0.24;
      scene.add(substrate);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(6.4, 0.28, 5.2),
        new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.68,
          metalness: 0.02,
        }),
      );
      base.position.y = 0.14;
      scene.add(base);

      const sheetCount = 3;
      const sheetW = 1.75;
      const sheetT = 0.12;
      const sheetD = 4.2;
      const sheetGap = 0.43;
      const sheetY0 = 0.62;
      const sheetMat = new THREE.MeshStandardMaterial({
        color: sheetColor,
        roughness: 0.26,
        metalness: 0.12,
      });

      for (let i = 0; i < sheetCount; i++) {
        const sheet = new THREE.Mesh(
          new THREE.BoxGeometry(sheetW, sheetT, sheetD),
          sheetMat,
        );
        sheet.position.set(0, sheetY0 + i * (sheetT + sheetGap), 0);
        scene.add(sheet);
        addEdges(sheet);
      }

      const gateLen = 1.05;
      const oxThick = 0.055;
      const gateThick = 0.13;
      const gateOXMat = new THREE.MeshStandardMaterial({
        color: OXIDE_COLOR,
        roughness: 0.42,
        metalness: 0.02,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
      });
      const gateMat = new THREE.MeshStandardMaterial({
        color: gateColor,
        roughness: 0.28,
        metalness: 0.55,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < sheetCount; i++) {
        const sy = sheetY0 + i * (sheetT + sheetGap);
        const oxTop = new THREE.Mesh(
          new THREE.BoxGeometry(sheetW + oxThick * 2, oxThick, gateLen),
          gateOXMat,
        );
        oxTop.position.set(0, sy + sheetT / 2 + oxThick / 2, 0);
        scene.add(oxTop);

        const oxBottom = oxTop.clone();
        oxBottom.position.set(0, sy - sheetT / 2 - oxThick / 2, 0);
        scene.add(oxBottom);

        const oxLeft = new THREE.Mesh(
          new THREE.BoxGeometry(oxThick, sheetT + oxThick * 2, gateLen),
          gateOXMat,
        );
        oxLeft.position.set(-sheetW / 2 - oxThick / 2, sy, 0);
        scene.add(oxLeft);

        const oxRight = oxLeft.clone();
        oxRight.position.set(sheetW / 2 + oxThick / 2, sy, 0);
        scene.add(oxRight);

        const gateTop = new THREE.Mesh(
          new THREE.BoxGeometry(
            sheetW + oxThick * 2 + gateThick * 2,
            gateThick,
            gateLen,
          ),
          gateMat,
        );
        gateTop.position.set(0, sy + sheetT / 2 + oxThick + gateThick / 2, 0);
        gateTop.renderOrder = 1;
        scene.add(gateTop);
        addEdges(gateTop);

        const gateBottom = gateTop.clone();
        gateBottom.position.set(
          0,
          sy - sheetT / 2 - oxThick - gateThick / 2,
          0,
        );
        scene.add(gateBottom);
        addEdges(gateBottom);

        const gateLeft = new THREE.Mesh(
          new THREE.BoxGeometry(gateThick, sheetT + oxThick * 2, gateLen),
          gateMat,
        );
        gateLeft.position.set(-sheetW / 2 - oxThick - gateThick / 2, sy, 0);
        gateLeft.renderOrder = 1;
        scene.add(gateLeft);
        addEdges(gateLeft);

        const gateRight = gateLeft.clone();
        gateRight.position.set(sheetW / 2 + oxThick + gateThick / 2, sy, 0);
        scene.add(gateRight);
        addEdges(gateRight);
      }

      const gateH = (sheetCount - 1) * (sheetT + sheetGap) + sheetT + 0.62;
      const gateCY = sheetY0 + ((sheetCount - 1) * (sheetT + sheetGap)) / 2;
      const gateWindow = new THREE.Mesh(
        new THREE.BoxGeometry(sheetW + 0.62, gateH, gateLen),
        new THREE.MeshStandardMaterial({
          color: gateColor,
          roughness: 0.34,
          metalness: 0.5,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      gateWindow.position.set(0, gateCY, 0);
      scene.add(gateWindow);
      addEdges(gateWindow);

      const spacerMat = new THREE.MeshStandardMaterial({
        color: spacerColor,
        roughness: 0.44,
        metalness: 0.08,
      });
      const spacerLen = 0.15;
      for (const zOff of [
        -gateLen / 2 - spacerLen / 2,
        gateLen / 2 + spacerLen / 2,
      ]) {
        const spacer = new THREE.Mesh(
          new THREE.BoxGeometry(sheetW + 0.62, gateH, spacerLen),
          spacerMat,
        );
        spacer.position.set(0, gateCY, zOff);
        scene.add(spacer);
      }

      const sdMat = new THREE.MeshStandardMaterial({
        color: sdColor,
        roughness: 0.3,
        metalness: 0.15,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
      });
      const sdH = gateH + 0.18;
      const sdW = sheetW + 0.42;
      const source = new THREE.Mesh(
        new THREE.BoxGeometry(sdW, sdH, 0.64),
        sdMat,
      );
      source.position.set(0, gateCY, -sheetD / 2 - 0.32);
      source.renderOrder = 1;
      scene.add(source);

      const drain = source.clone();
      drain.position.set(0, gateCY, sheetD / 2 + 0.32);
      scene.add(drain);

      const contactMat = new THREE.MeshStandardMaterial({
        color: contactColor,
        roughness: 0.15,
        metalness: 0.85,
      });
      const topY = gateCY + gateH / 2;
      const contact = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.8, 16),
        contactMat,
      );
      contact.position.set(0, topY + 0.5, 0);
      scene.add(contact);
      const contactPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.08, 0.7),
        contactMat,
      );
      contactPad.position.set(0, topY + 0.9, 0);
      scene.add(contactPad);

      const grid = new THREE.GridHelper(10, 20, gridCenterColor, gridColor);
      grid.position.y = -0.3;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.5;
      scene.add(grid);

      const labelColor = cssRgba(palette.text, 0.92);
      const labels: { text: string; x: number; y: number; z: number; scale?: number }[] = [
        { text: 'Nanosheets', x: -1.95, y: sheetY0 + sheetT + 0.16, z: 0.35, scale: 2.5 },
        { text: 'All-around gate', x: 2.08, y: gateCY + 0.42, z: -0.2, scale: 3.05 },
        { text: 'Source', x: 0.7, y: gateCY + sdH / 2 + 0.18, z: -sheetD / 2 - 0.38, scale: 2.25 },
        { text: 'Drain', x: -0.7, y: gateCY + sdH / 2 + 0.18, z: sheetD / 2 + 0.38, scale: 2.25 },
        { text: 'Contact', x: 0, y: topY + 1.3, z: 0, scale: 2.35 },
      ];
      for (const l of labels) {
        const c2 = document.createElement('canvas');
        c2.width = 256;
        c2.height = 64;
        const ctx2 = c2.getContext('2d');
        if (!ctx2) continue;
        ctx2.font = 'bold 22px ui-monospace, Menlo, Consolas, monospace';
        ctx2.fillStyle = labelColor;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(l.text, 128, 32);
        const tex = new THREE.CanvasTexture(c2);
        tex.minFilter = THREE.LinearFilter;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthTest: false,
            opacity: 0.9,
          }),
        );
        sprite.position.set(l.x, l.y, l.z);
        sprite.scale.set(l.scale ?? 3.5, 0.82, 1);
        scene.add(sprite);
      }

      let animId = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const observer = new ResizeObserver(() => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      observer.observe(mount);

      return () => {
        observer.disconnect();
        cancelAnimationFrame(animId);
        controls.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
            const material = obj.material as THREE.Material | THREE.Material[];
            if (obj instanceof THREE.Mesh) obj.geometry.dispose();
            if (Array.isArray(material)) material.forEach((m) => m.dispose());
            else material.dispose();
          }
        });
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      };
    };

    let cleanup = init();
    const offTheme = onThemeChange(() => {
      cleanup();
      cleanup = init();
    });

    return () => {
      offTheme();
      cleanup();
    };
  }, []);

  const legend = [
    { color: 'var(--accent)', label: '纳米片 (Si)' },
    { color: '#ff8a45', label: '栅氧 (High-k)' },
    { color: 'var(--scene-line)', label: '全环绕栅极' },
    { color: 'var(--muted)', label: '内隔离层' },
    { color: 'var(--accent-deep)', label: '源 / 漏 (Si)' },
  ];

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">GAA 纳米片晶体管 · 3D 结构</span>
        <span className="lab-demo-meta">拖拽旋转 · 滚轮缩放</span>
      </div>

      <div className="lab-demo-stage">
        <div ref={mountRef} className="lab-demo-mount" />
      </div>

      <div className="lab-legend">
        {legend.map((m) => (
          <span key={m.label} className="lab-legend-item">
            <span className="lab-legend-chip" style={{ backgroundColor: m.color }} />
            {m.label}
          </span>
        ))}
      </div>

      <div className="lab-note">
        Gate-All-Around：三层水平硅纳米片沟道，每一片都被栅氧与栅极从上下左右四面环绕——
        这是 FinFET 之后 3nm 及以下制程的核心结构。转一转，从侧面看栅极如何「抱住」每一片沟道。
      </div>
    </div>
  );
}

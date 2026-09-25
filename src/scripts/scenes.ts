/**
 * 场景引擎：按 [data-scene] 容器挂载 Three.js 场景。
 * - 单个 IntersectionObserver 懒加载：进入视口附近才 import('three') 并挂载
 * - 首次成功渲染前控件禁用、保留 SVG 占位；WebGL 不可用时占位常驻、控件保持禁用
 * - 离屏暂停、visibilitychange 暂停、prefers-reduced-motion 初始暂停
 * - 指针拖动旋转外层组（暂停时立即渲染），touch-action: pan-y 保留纵向滚动
 * - bfcache 友好：pagehide 仅在非持久化时销毁，pageshow 恢复渲染
 */

type Mode = 'knot' | 'particles' | 'wave';
type GeoName = 'knot' | 'orbit';

type Three = typeof import('three');
type BufferGeometry = import('three').BufferGeometry;
type Material = import('three').Material;
type Object3D = import('three').Object3D;
type Vector3 = import('three').Vector3;

interface SceneContent {
  /** 内容自身旋转 / 波动的组，挂在外层 dragGroup 里 */
  group: Object3D;
  update(t: number, dt: number): void;
  setParam?(v: number): void;
  setGeometry?(name: GeoName): void;
  setTheme(palette: Palette): void;
  dispose(): void;
}

/* 颜色与 CSS 令牌同源：改配色只需动 global.css（与独立 favicon） */
type Palette = {
  accent: number;
  secondary: number;
  background: number;
  light: boolean;
};

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: number): number => {
    const value = styles.getPropertyValue(name).trim();
    return /^#[\da-f]{6}$/i.test(value)
      ? Number.parseInt(value.slice(1), 16)
      : fallback;
  };
  return {
    accent: color('--scene-line', 0x8bbaff),
    secondary: color('--scene-secondary', 0xedf3ff),
    background: color('--bg', 0x0b0e14),
    light: document.documentElement.dataset.theme === 'light',
  };
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function disposeObject(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
    else mesh.material?.dispose();
  });
}

/* ---------- knot / orbit ------------------------------------------------- */

function buildKnotContent(THREE: Three, palette: Palette): SceneContent {
  const group = new THREE.Group();
  let colors = palette;
  let current: Object3D | null = null;
  let currentName: GeoName | null = null;
  type Role = 'accent' | 'secondary';

  const roleMaterial = (role: Role, opacity: number) => {
    const mat = new THREE.LineBasicMaterial({
      color: colors[role],
      transparent: true,
      opacity,
    });
    mat.userData.themeRole = role;
    return mat;
  };

  const wire = (
    geo: BufferGeometry,
    role: Role,
    opacity: number,
  ): import('three').LineSegments => {
    const lines = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      roleMaterial(role, opacity),
    );
    geo.dispose();
    return lines;
  };

  const ring = (radius: number, role: Role, opacity: number) => {
    const pts = new THREE.EllipseCurve(0, 0, radius, radius).getPoints(96);
    return new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      roleMaterial(role, opacity),
    );
  };

  const buildKnot = () => {
    const g = new THREE.Group();
    g.add(wire(new THREE.TorusKnotGeometry(1.12, 0.34, 112, 12), 'accent', 0.4));
    g.add(wire(new THREE.TorusKnotGeometry(1.12, 0.34, 40, 6), 'secondary', 0.12));
    return g;
  };

  const buildOrbit = () => {
    const g = new THREE.Group();
    g.add(wire(new THREE.IcosahedronGeometry(0.62, 1), 'secondary', 0.42));
    const r1 = ring(1.55, 'accent', 0.55);
    r1.rotation.x = Math.PI / 2.15;
    const r2 = ring(1.95, 'accent', 0.3);
    r2.rotation.x = Math.PI / 3.4;
    r2.rotation.y = Math.PI / 5;
    const r3 = ring(1.25, 'secondary', 0.26);
    r3.rotation.x = Math.PI / 1.6;
    r3.rotation.y = -Math.PI / 4;
    const dotMat = new THREE.MeshBasicMaterial({ color: colors.accent });
    dotMat.userData.themeRole = 'accent';
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), dotMat);
    s1.position.set(1.55, 0, 0);
    s1.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2.15));
    const s2 = s1.clone();
    s2.position.set(0, 0, -1.95);
    s2.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 3.4));
    g.add(r1, r2, r3, s1, s2);
    return g;
  };

  const setGeometry = (name: GeoName) => {
    if (name === currentName) return;
    if (current) {
      group.remove(current);
      disposeObject(current);
    }
    current = name === 'knot' ? buildKnot() : buildOrbit();
    currentName = name;
    group.add(current);
  };

  setGeometry('knot');

  return {
    group,
    setGeometry,
    setTheme(p) {
      colors = p;
      group.traverse((obj) => {
        const mesh = obj as { material?: Material | Material[] };
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : mesh.material
            ? [mesh.material]
            : [];
        mats.forEach((m) => {
          const role = m.userData.themeRole as Role | undefined;
          const color = (m as unknown as { color?: import('three').Color })
            .color;
          if (role && color) color.setHex(colors[role]);
        });
      });
    },
    update(t, dt) {
      group.rotation.y += dt * 0.16;
      if (current) {
        current.rotation.x =
          Math.sin(t * (currentName === 'orbit' ? 0.4 : 0.3)) * 0.1;
      }
    },
    dispose() {
      if (current) disposeObject(current);
    },
  };
}

/* ---------- particles ---------------------------------------------------- */

function buildParticlesContent(
  THREE: Three,
  pointer: Vector3,
  palette: Palette,
): SceneContent {
  const COUNT = 640;
  const group = new THREE.Group();
  let paletteState = palette;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  // 每个粒子的配色角色固定，换肤时按同一掩码重新上色
  const roleMask = new Uint8Array(COUNT);
  const colorScratch = new THREE.Color();

  const paint = () => {
    for (let i = 0; i < COUNT; i++) {
      colorScratch.setHex(
        roleMask[i] ? paletteState.accent : paletteState.secondary,
      );
      colors[i * 3] = colorScratch.r;
      colors[i * 3 + 1] = colorScratch.g;
      colors[i * 3 + 2] = colorScratch.b;
    }
  };

  for (let i = 0; i < COUNT; i++) {
    const r = 0.4 + Math.random() * 1.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.35;
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.8;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
    roleMask[i] = Math.random() < 0.4 ? 1 : 0;
  }
  // 静止位形：弹簧把粒子拉回各自的初始位置，而不是原点
  const restPositions = positions.slice();
  paint();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  geo.setAttribute('color', colorAttr);
  const mat = new THREE.PointsMaterial({
    size: 0.028,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    // 深色用叠加发光，浅色背景必须普通混合否则粒子不可见
    blending: paletteState.light
      ? THREE.NormalBlending
      : THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Points(geo, mat));

  const posAttr = geo.getAttribute('position') as import('three').BufferAttribute;
  let strength = 0.45;

  return {
    group,
    setParam(v) {
      strength = v;
    },
    setTheme(p) {
      paletteState = p;
      paint();
      colorAttr.needsUpdate = true;
      mat.blending = p.light ? THREE.NormalBlending : THREE.AdditiveBlending;
      mat.needsUpdate = true;
    },
    update(t, dt) {
      group.rotation.y = Math.sin(t * 0.12) * 0.14;
      const step = Math.min(dt, 0.05);
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const px = positions[ix];
        const py = positions[ix + 1];
        const pz = positions[ix + 2];
        // 指针引力（在 xy 平面上近似计算）
        const dx = pointer.x - px;
        const dy = pointer.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 4.5) {
          const f = (strength * 0.9) / (d2 + 0.25);
          velocities[ix] += dx * f * step;
          velocities[ix + 1] += dy * f * step;
        }
        // 回位弹簧（朝向各自的 rest position）+ 阻尼 + 缓慢漂移
        velocities[ix] +=
          ((restPositions[ix] - px) * 0.28 + Math.sin(t * 0.5 + i) * 0.02) * step;
        velocities[ix + 1] +=
          ((restPositions[ix + 1] - py) * 0.28 +
            Math.cos(t * 0.4 + i * 1.7) * 0.02) *
          step;
        velocities[ix + 2] += (restPositions[ix + 2] - pz) * 0.3 * step;
        const damp = Math.exp(-2.6 * step);
        velocities[ix] *= damp;
        velocities[ix + 1] *= damp;
        velocities[ix + 2] *= damp;
        positions[ix] = px + velocities[ix] * step * 22;
        positions[ix + 1] = py + velocities[ix + 1] * step * 22;
        positions[ix + 2] = pz + velocities[ix + 2] * step * 22;
      }
      posAttr.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}

/* ---------- wave ---------------------------------------------------------- */

function buildWaveContent(THREE: Three, palette: Palette): SceneContent {
  const SIZE = 4.6;
  const SEG = 34;
  const group = new THREE.Group();

  const gridIndex = (r: number, c: number) => (r * (SEG + 1) + c) * 3;
  const gridPos = new Float32Array((SEG + 1) * (SEG + 1) * 3);
  const half = SIZE / 2;
  for (let r = 0; r <= SEG; r++) {
    for (let c = 0; c <= SEG; c++) {
      const i = gridIndex(r, c);
      gridPos[i] = -half + (c / SEG) * SIZE;
      gridPos[i + 1] = 0;
      gridPos[i + 2] = -half + (r / SEG) * SIZE;
    }
  }
  // 每条线段存两个端点在 gridPos 中的偏移
  const segs: number[] = [];
  for (let r = 0; r <= SEG; r++)
    for (let c = 0; c < SEG; c++)
      segs.push(gridIndex(r, c), gridIndex(r, c + 1));
  for (let c = 0; c <= SEG; c++)
    for (let r = 0; r < SEG; r++)
      segs.push(gridIndex(r, c), gridIndex(r + 1, c));

  const segPos = new Float32Array((segs.length / 2) * 2 * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(segPos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: palette.accent,
    transparent: true,
    opacity: 0.38,
  });
  group.add(new THREE.LineSegments(geo, mat));

  // 一条较亮的中线，增加层次
  const spineGeo = new THREE.BufferGeometry();
  spineGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3),
  );
  const spineMat = new THREE.LineBasicMaterial({
    color: palette.secondary,
    transparent: true,
    opacity: 0.5,
  });
  group.add(new THREE.Line(spineGeo, spineMat));

  group.rotation.x = -0.92;
  group.position.y = -0.35;

  let amp = 0.55;
  const height = (x: number, z: number, t: number) =>
    amp *
    (Math.sin(x * 1.9 + t) * Math.cos(z * 1.5 + t * 0.7) * 0.42 +
      Math.sin((x + z) * 0.9 - t * 0.55) * 0.22);

  return {
    group,
    setParam(v) {
      amp = v;
    },
    setTheme(p) {
      mat.color.setHex(p.accent);
      spineMat.color.setHex(p.secondary);
    },
    update(t) {
      for (let r = 0; r <= SEG; r++) {
        for (let c = 0; c <= SEG; c++) {
          const i = gridIndex(r, c);
          gridPos[i + 1] = height(gridPos[i], gridPos[i + 2], t);
        }
      }
      let k = 0;
      const segAttr = geo.getAttribute(
        'position',
      ) as import('three').BufferAttribute;
      const arr = segAttr.array as Float32Array;
      for (let j = 0; j < segs.length; j += 2) {
        const a = segs[j];
        const b = segs[j + 1];
        arr[k] = gridPos[a];
        arr[k + 1] = gridPos[a + 1];
        arr[k + 2] = gridPos[a + 2];
        arr[k + 3] = gridPos[b];
        arr[k + 4] = gridPos[b + 1];
        arr[k + 5] = gridPos[b + 2];
        k += 6;
      }
      const spineAttr = spineGeo.getAttribute(
        'position',
      ) as import('three').BufferAttribute;
      const sarr = spineAttr.array as Float32Array;
      const mid = Math.floor(SEG / 2);
      for (let c = 0; c <= SEG; c++) {
        const src = gridIndex(mid, c);
        sarr[c * 3] = gridPos[src];
        sarr[c * 3 + 1] = gridPos[src + 1] + 0.002;
        sarr[c * 3 + 2] = gridPos[src + 2];
      }
      segAttr.needsUpdate = true;
      spineAttr.needsUpdate = true;
      group.rotation.z = Math.sin(t * 0.2) * 0.04;
    },
    dispose() {
      geo.dispose();
      spineGeo.dispose();
      mat.dispose();
      spineMat.dispose();
    },
  };
}

/* ---------- mount --------------------------------------------------------- */

async function mount(root: HTMLElement) {
  const mode = (root.dataset.mode ?? 'knot') as Mode;
  const host = root.querySelector<HTMLElement>('[data-scene-canvas]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-scene-pause]');
  const range = root.querySelector<HTMLInputElement>('[data-scene-range]');
  const geoBtns = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-scene-geo]'),
  );
  if (!host) return;

  const controls = [
    ...(pauseBtn ? [pauseBtn] : []),
    ...geoBtns,
    ...(range ? [range] : []),
  ];
  const setControlsEnabled = (on: boolean) =>
    controls.forEach((c) => {
      c.disabled = !on;
    });

  const fail = () => root.classList.add('scene--unavailable');

  let THREE: Three;
  try {
    THREE = await import('three');
  } catch {
    fail();
    return;
  }

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    fail();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const palette = readPalette();

  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute(
    'aria-label',
    mode === 'knot'
      ? '可交互的线框几何体动画，可拖动旋转'
      : mode === 'particles'
        ? '可交互的粒子场动画，粒子会跟随指针'
        : '可交互的波形网格动画，可拖动改变视角',
  );
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(palette.background, 5.2, 8.4);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  if (mode === 'knot') camera.position.set(0, 0.15, 4.9);
  else if (mode === 'particles') camera.position.set(0, 0.1, 4.6);
  else camera.position.set(0, 0.55, 5.1);
  camera.lookAt(0, 0, 0);

  // 按包围球半径留边距适配面板，任意旋转角度都不裁切、不压注记
  const fitRadius = mode === 'knot' ? 2.25 : mode === 'wave' ? 3.45 : 2.9;

  // 指针世界坐标（z=0 平面），粒子模式共享给内容
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerNdc = new THREE.Vector2(999, 999);
  const pointerWorld = new THREE.Vector3(999, 999, 0);

  const content: SceneContent =
    mode === 'knot'
      ? buildKnotContent(THREE, palette)
      : mode === 'particles'
        ? buildParticlesContent(THREE, pointerWorld, palette)
        : buildWaveContent(THREE, palette);

  // 外层组负责拖动旋转与自适应缩放，内容自转留在内容组内
  const dragGroup = new THREE.Group();
  dragGroup.add(content.group);
  scene.add(dragGroup);

  /* ---- 状态 ---- */
  let paused = reduceMotion.matches;
  let visible = false;
  let rendered = false;
  let raf = 0;
  let last = performance.now();
  // 动画自身的时间轴：暂停 / 离屏时不再累积
  let elapsed = 0;

  /* ---- drag to rotate ---- */
  let targetRX = 0;
  let targetRY = 0;
  let rx = 0;
  let ry = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const updatePointer = (clientX: number, clientY: number) => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    raycaster.ray.intersectPlane(plane, pointerWorld);
  };

  host.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', (e) => {
    updatePointer(e.clientX, e.clientY);
    if (!dragging) return;
    targetRY += (e.clientX - lastX) * 0.006;
    targetRX = Math.max(
      -0.9,
      Math.min(0.9, targetRX + (e.clientY - lastY) * 0.006),
    );
    lastX = e.clientX;
    lastY = e.clientY;
    // 暂停时拖动也要即时反馈
    if (paused) {
      rx = targetRX;
      ry = targetRY;
      renderStatic();
    }
  });
  const endDrag = (e: PointerEvent) => {
    dragging = false;
    if (host.hasPointerCapture(e.pointerId))
      host.releasePointerCapture(e.pointerId);
  };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('pointerleave', () => {
    pointerWorld.set(999, 999, 0);
  });

  /* ---- controls ---- */
  function setPaused(v: boolean) {
    paused = v;
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(v));
      pauseBtn.setAttribute('aria-label', v ? '播放动画' : '暂停动画');
      pauseBtn.textContent = v ? '播放' : '暂停';
    }
    wake();
  }
  pauseBtn?.addEventListener('click', () => setPaused(!paused));
  const onReduceMotion = (e: MediaQueryListEvent) => {
    if (e.matches) setPaused(true);
  };
  reduceMotion.addEventListener('change', onReduceMotion);

  range?.addEventListener('input', () => {
    content.setParam?.(Number(range.value) / 100);
    renderStatic();
  });
  if (range) content.setParam?.(Number(range.value) / 100);

  geoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      content.setGeometry?.(btn.dataset.sceneGeo as GeoName);
      geoBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      renderStatic();
    });
  });

  /* ---- size / loop ---- */
  const applyDrag = () => {
    rx += (targetRX - rx) * 0.08;
    ry += (targetRY - ry) * 0.08;
    dragGroup.rotation.x = rx;
    dragGroup.rotation.y = ry;
  };

  function renderStatic() {
    content.update(elapsed, 0);
    applyDrag();
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      root.classList.add('is-live');
      setControlsEnabled(true);
    }
  }

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 以包围球半径 + 视锥较小半边计算缩放，适配任意纵横比
    const distance = camera.position.length();
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const limitingHalfFov = Math.min(
      halfFov,
      Math.atan(Math.tan(halfFov) * camera.aspect),
    );
    dragGroup.scale.setScalar(
      (distance * Math.sin(limitingHalfFov) * 0.84) / fitRadius,
    );
    camera.updateProjectionMatrix();
    if (paused || !visible) renderStatic();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || paused || document.hidden) return;
    const dt = Math.min(0.06, (now - last) / 1000);
    last = now;
    elapsed += dt;
    content.update(elapsed, dt);
    applyDrag();
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      root.classList.add('is-live');
      setControlsEnabled(true);
    }
    raf = requestAnimationFrame(frame);
  };

  function wake() {
    if (!raf && visible && !paused && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!rendered) {
      renderStatic();
    }
  }

  setPaused(paused);

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { rootMargin: '80px' },
  );
  io.observe(root);

  const onVisibility = () => wake();
  document.addEventListener('visibilitychange', onVisibility);

  // 主题切换：只换色，不重建渲染器 / 场景 / 几何 / 控件状态
  const onThemeChange = () => {
    const p = readPalette();
    scene.fog?.color.setHex(p.background);
    content.setTheme(p);
    renderStatic();
  };
  window.addEventListener('themechange', onThemeChange);

  /* ---- bfcache ---- */
  function dispose() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('themechange', onThemeChange);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    reduceMotion.removeEventListener('change', onReduceMotion);
    content.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  const onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted) {
      // 进入 bfcache：停帧即可，不销毁资源
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else {
      dispose();
    }
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      // 历史缓存恢复期间可能换过主题
      onThemeChange();
      resize();
      renderStatic();
      wake();
    }
  };
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
}

/* 懒加载：进入视口附近才挂载对应场景 */
function init() {
  const scenes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-scene]'),
  );
  if (!scenes.length) return;
  let pending = scenes.length;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        pending--;
        void mount(entry.target as HTMLElement);
        if (pending === 0) io.disconnect();
      }
    },
    { rootMargin: '200px' },
  );
  scenes.forEach((s) => io.observe(s));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

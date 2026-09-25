import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cssRgba,
  lerpRgb,
  onThemeChange,
  readLabPalette,
} from './theme';

type Mode = 'gravity' | 'repulse' | 'vortex' | 'trail';

const MODE_LABELS: Record<Mode, string> = {
  gravity: '引力',
  repulse: '斥力',
  vortex: '涡旋',
  trail: '拖尾',
};

class Particle {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  ax = 0;
  ay = 0;
  life = 1;
  decay = 0;
  /** 0..1 调色板插值位置（accent-deep → scene-line），主题切换时按同一参数重新上色 */
  t = 0;
  /** 0.7..1.2 亮度抖动，避免整片同色 */
  bright = 1;

  constructor(w: number, h: number) {
    this.reset(w, h);
  }

  reset(w: number, h: number) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(w, h) * 0.3;
    this.x = w / 2 + Math.cos(angle) * radius;
    this.y = h / 2 + Math.sin(angle) * radius;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.life = Math.random();
    this.decay = 0.002 + Math.random() * 0.003;
    this.t = Math.random();
    this.bright = 0.7 + Math.random() * 0.5;
  }
}

/** 粒子流场：引力 / 斥力 / 涡旋 / 拖尾（Canvas 2D） */
export default function ParticlesDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('gravity');
  const [count, setCount] = useState(5000);
  const [fps, setFps] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const animRef = useRef(0);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const modeRef = useRef<Mode>('gravity');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let palette = readLabPalette();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth * dpr;
      h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const ensureParticles = () => {
      while (particlesRef.current.length < count) {
        particlesRef.current.push(new Particle(w, h));
      }
      while (particlesRef.current.length > count) {
        particlesRef.current.pop();
      }
    };

    const render = (now: number) => {
      animRef.current = requestAnimationFrame(render);
      resize();
      ensureParticles();

      const dt = Math.min(1, (now - lastTimeRef.current) / 16);
      lastTimeRef.current = now;
      frameCountRef.current++;

      const m = modeRef.current;
      const mx = mouseRef.current.x * w;
      const my = mouseRef.current.y * h;
      const md = mouseRef.current.down;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cssRgba(palette.panel, 0.15);
      ctx.fillRect(0, 0, w, h);

      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          p.reset(w, h);
          p.life = 1;
        }

        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const force = md ? 2 / (dist * 0.1 + 1) : 0.3 / (dist * 0.5 + 1);

        switch (m) {
          case 'gravity':
            p.ax = (force * dx) / dist;
            p.ay = (force * dy) / dist;
            break;
          case 'repulse':
            p.ax = (-force * dx) / dist;
            p.ay = (-force * dy) / dist;
            break;
          case 'vortex':
            p.ax = (force * dx) / dist - dy * 0.003;
            p.ay = (force * dy) / dist + dx * 0.003;
            break;
          case 'trail':
            p.ax = (dx / dist) * 0.1;
            p.ay = (dy / dist) * 0.1;
            p.decay = 0.015;
            break;
        }

        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.reset(w, h);
          p.life = 1;
        }

        const alpha = Math.sin(p.life * Math.PI);
        const c = lerpRgb(palette.accentDeep, palette.sceneLine, p.t);
        const r = Math.min(255, Math.floor(c[0] * p.bright * alpha));
        const g = Math.min(255, Math.floor(c[1] * p.bright * alpha));
        const b = Math.min(255, Math.floor(c[2] * p.bright * alpha));

        if (m === 'trail') {
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.4})`;
          ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (md && m !== 'trail') {
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.strokeStyle = cssRgba(palette.text, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(render);

    const fpsInterval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    // 主题切换：重读令牌，并先整幅铺一次面板色，避免旧主题拖尾残留
    const offTheme = onThemeChange(() => {
      palette = readLabPalette();
      ctx.fillStyle = cssRgba(palette.panel, 1);
      ctx.fillRect(0, 0, w, h);
    });

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(fpsInterval);
      offTheme();
    };
  }, [count]);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      down: e.buttons > 0,
    };
  }, []);

  const handleLeave = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">
          {count.toLocaleString()} Particles · {MODE_LABELS[mode]}
        </span>
        <span className="lab-demo-meta">{fps} fps</span>
      </div>

      <div className="lab-demo-stage">
        <canvas
          ref={canvasRef}
          className="lab-demo-canvas"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerUp={handlePointer}
          onPointerLeave={handleLeave}
        />
      </div>

      <div className="lab-demo-controls lab-demo-controls--2">
        <div className="lab-control">
          <div className="lab-control-label">交互模式</div>
          <div className="lab-btn-group">
            {(['gravity', 'repulse', 'vortex', 'trail'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={mode === m ? 'lab-btn is-active' : 'lab-btn'}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="lab-control">
          <div className="lab-control-row">
            <span>粒子数量</span>
            <span>{count.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={500}
            max={15000}
            step={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="lab-range"
          />
        </div>
      </div>

      <div className="lab-note">
        纯 Canvas 2D 实现，无 WebGL。每帧遍历 {count.toLocaleString()}+
        粒子计算引力/斥力/涡旋力，使用半透明覆层实现拖尾效果。指针悬停控制粒子运动，按下增强引力。
      </div>
    </div>
  );
}

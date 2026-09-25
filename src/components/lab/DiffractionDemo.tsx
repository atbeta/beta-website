import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpRgb, onThemeChange, readLabPalette } from './theme';

type Aperture = 'circle' | 'square' | 'grating';

const SIZE = 340;

// 一阶贝塞尔函数 J1（级数近似）
function besselJ1(x: number): number {
  let sum = 0;
  let term = x / 2;
  let k = 0;
  const xx = (x * x) / 4;
  while (Math.abs(term) > 1e-10 && k < 60) {
    sum += term;
    k++;
    term *= -xx / (k * (k + 1));
  }
  return sum;
}

function sinc(x: number): number {
  if (Math.abs(x) < 1e-8) return 1;
  return Math.sin(x) / x;
}

/** 夫琅禾费衍射图案实时计算（Canvas 2D），强度映射：面板色 → 场景强调色 */
export default function DiffractionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aperture, setAperture] = useState<Aperture>('circle');
  const [scale, setScale] = useState(30); // 孔径相对尺度
  const [gamma, setGamma] = useState(0.35);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = readLabPalette();
    const base = palette.panel;
    const peak = palette.sceneLine;

    const img = ctx.createImageData(SIZE, SIZE);
    const data = img.data;
    const half = SIZE / 2;
    const k = scale / half; // 空间频率缩放

    for (let py = 0; py < SIZE; py++) {
      const v = (py - half) * k;
      for (let px = 0; px < SIZE; px++) {
        const u = (px - half) * k;
        let I = 0;
        if (aperture === 'circle') {
          const r = Math.sqrt(u * u + v * v);
          const x = r * 0.9;
          const airy = x < 1e-6 ? 1 : (2 * besselJ1(x)) / x;
          I = airy * airy;
        } else if (aperture === 'square') {
          const s = sinc(u * 0.6) * sinc(v * 0.6);
          I = s * s;
        } else {
          // 光栅：sinc^2 包络 × 多缝干涉
          const envelope = sinc(u * 0.35) * sinc(v * 0.35);
          const N = 7;
          const d = 2.6;
          const phase = (Math.PI * d * u) / 4;
          const single = Math.sin(phase);
          const inter =
            Math.abs(phase) < 1e-6
              ? 1
              : Math.pow(Math.sin(N * phase) / (N * single), 2);
          I = envelope * envelope * inter;
        }
        // gamma 压缩以显现弱环
        const g = Math.pow(Math.min(1, Math.max(0, I)), gamma);
        const c = lerpRgb(base, peak, g);
        const idx = (py * SIZE + px) * 4;
        data[idx] = Math.round(c[0]);
        data[idx + 1] = Math.round(c[1]);
        data[idx + 2] = Math.round(c[2]);
        data[idx + 3] = 255;
      }
    }

    // createImageData 是 device 像素，临时按 dpr 缩放绘制
    const tmp = document.createElement('canvas');
    tmp.width = SIZE;
    tmp.height = SIZE;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, SIZE, SIZE);
  }, [aperture, scale, gamma]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => onThemeChange(draw), [draw]);

  const apertureLabel =
    aperture === 'circle'
      ? '圆形孔径 (Airy)'
      : aperture === 'square'
        ? '矩形孔径 (sinc²)'
        : '光栅 (多缝干涉)';

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">Fraunhofer 衍射 · {apertureLabel}</span>
        <span className="lab-demo-meta">
          {SIZE}×{SIZE} 逐像素积分
        </span>
      </div>

      <div className="lab-demo-stage lab-demo-stage--center">
        <canvas ref={canvasRef} className="lab-diffraction-canvas" />
      </div>

      <div className="lab-demo-controls">
        <div className="lab-control">
          <div className="lab-control-label">孔径类型</div>
          <div className="lab-btn-group">
            {(
              [
                ['circle', '圆形'],
                ['square', '矩形'],
                ['grating', '光栅'],
              ] as [Aperture, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAperture(key)}
                className={
                  aperture === key ? 'lab-btn is-active' : 'lab-btn'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="lab-control">
          <div className="lab-control-row">
            <span>孔径尺度</span>
            <span>{scale}</span>
          </div>
          <input
            type="range"
            min={12}
            max={60}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="lab-range"
          />
        </div>
        <div className="lab-control">
          <div className="lab-control-row">
            <span>Gamma（弱环可见度）</span>
            <span>{gamma.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="lab-range"
          />
        </div>
      </div>

      <div className="lab-note">
        圆形孔径产生艾里斑（(2J₁(x)/x)²），矩形孔径产生 sinc²
        分布，光栅是单缝包络与多缝干涉的乘积。调整 Gamma
        可以看到更外层的弱衍射环——这正是光刻光学仿真的最小单元。
      </div>
    </div>
  );
}

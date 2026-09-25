import { useCallback, useEffect, useRef, useState } from 'react';
import { cssRgba, onThemeChange, readLabPalette } from './theme';

const W = 640;
const H = 300;

const REF_COLOR = '#ef4444';
const OK_COLOR = '#6bcb77';
const WARN_COLOR = '#ffd23d';
const BAD_COLOR = '#ff6b6b';

/** Box-in-Box 套刻对位模拟（Canvas 2D）：左侧平移误差，右侧旋转误差 */
export default function OverlayDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offsetX, setOffsetX] = useState(3);
  const [offsetY, setOffsetY] = useState(-2);
  const [rotation, setRotation] = useState(1.5);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = readLabPalette();
    const accent = cssRgba(palette.accent, 1);
    const muted = cssRgba(palette.muted, 1);
    const hairline = cssRgba(palette.text, 0.14);

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 - 6;
    const outerSize = 132;
    const innerSize = 66;
    const gap = 92;

    const offsetPX = offsetX * 3;
    const offsetPY = offsetY * 3;
    const rad = (rotation * Math.PI) / 180;

    const drawCrosshair = (x: number, y: number, size: number) => {
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawBox = (
      x: number,
      y: number,
      size: number,
      color: string,
      dash: boolean,
    ) => {
      const half = size / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (dash) ctx.setLineDash([6, 4]);
      ctx.strokeRect(x - half, y - half, size, size);
      ctx.setLineDash([]);
    };

    ctx.strokeStyle = hairline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 18);
    ctx.lineTo(W / 2, H - 18);
    ctx.stroke();

    drawCrosshair(cx - gap, cy, 24);
    drawCrosshair(cx + gap, cy, 24);

    // 左：平移误差
    drawBox(cx - gap, cy, outerSize, REF_COLOR, true);
    drawBox(cx - gap + offsetPX, cy + offsetPY, innerSize, accent, false);

    // 右：旋转误差
    ctx.save();
    ctx.translate(cx + gap, cy);
    ctx.rotate(rad);
    drawBox(0, 0, outerSize, REF_COLOR, true);
    ctx.restore();
    drawBox(cx + gap, cy, innerSize, accent, false);

    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = REF_COLOR;
    ctx.fillText('平移误差', cx - gap, cy - outerSize / 2 - 26);
    ctx.fillText('旋转误差', cx + gap, cy - outerSize / 2 - 26);

    const mag = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    const statusText =
      mag < 2 ? '✓ 在规格内 (< 2nm)' : mag < 5 ? '⚠ 接近边界 (2–5nm)' : '✗ 超出规格 (> 5nm)';
    const statusColor = mag < 2 ? OK_COLOR : mag < 5 ? WARN_COLOR : BAD_COLOR;

    ctx.textAlign = 'left';
    ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = muted;
    ctx.fillText(
      `X: ${offsetX.toFixed(1)}nm   Y: ${offsetY.toFixed(1)}nm   R: ${rotation.toFixed(1)}°`,
      18,
      H - 34,
    );
    ctx.fillText(`矢量误差: ${mag.toFixed(1)}nm`, 18, H - 20);
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, 18, H - 6);
  }, [offsetX, offsetY, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => onThemeChange(draw), [draw]);

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">Box-in-Box 套刻对位</span>
        <span className="lab-demo-meta">左 平移 · 右 旋转</span>
      </div>

      <div className="lab-demo-stage lab-demo-stage--center">
        <canvas ref={canvasRef} className="lab-overlay-canvas" />
      </div>

      <div className="lab-demo-controls">
        <div className="lab-control">
          <div className="lab-control-row">
            <span>X 偏移</span>
            <span>
              {offsetX > 0 ? '+' : ''}
              {offsetX.toFixed(1)}nm
            </span>
          </div>
          <input
            type="range"
            min={-8}
            max={8}
            step={0.1}
            value={offsetX}
            onChange={(e) => setOffsetX(Number(e.target.value))}
            className="lab-range"
            aria-label="X 偏移"
          />
        </div>
        <div className="lab-control">
          <div className="lab-control-row">
            <span>Y 偏移</span>
            <span>
              {offsetY > 0 ? '+' : ''}
              {offsetY.toFixed(1)}nm
            </span>
          </div>
          <input
            type="range"
            min={-8}
            max={8}
            step={0.1}
            value={offsetY}
            onChange={(e) => setOffsetY(Number(e.target.value))}
            className="lab-range"
            aria-label="Y 偏移"
          />
        </div>
        <div className="lab-control">
          <div className="lab-control-row">
            <span>旋转</span>
            <span>{rotation.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="lab-range"
            aria-label="旋转"
          />
        </div>
      </div>

      <div className="lab-note">
        <span style={{ color: REF_COLOR }}>红色虚线</span> 是参考层，蓝色实线是当前层。
        套刻（overlay）衡量光刻层间对准的精确程度——左侧拖出平移误差，右侧施加旋转误差，
        看矢量误差如何突破规格线。这是光刻机上每天都在发生的对准问题。
      </div>
    </div>
  );
}

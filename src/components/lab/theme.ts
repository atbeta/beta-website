/**
 * lab demos 的主题令牌读取：从 :root 的 CSS 变量取色（与 global.css 同源），
 * 并提供 window 'themechange' 事件订阅（Layout 切换深浅主题时派发）。
 */

export type Rgb = [number, number, number];

export interface LabPalette {
  accent: Rgb;
  accentDeep: Rgb;
  sceneLine: Rgb;
  panel: Rgb;
  panel2: Rgb;
  bg: Rgb;
  text: Rgb;
  muted: Rgb;
}

/** 深色主题回退值（global.css :root 的同款色） */
const FALLBACK: LabPalette = {
  accent: [0x73, 0xa7, 0xff],
  accentDeep: [0x4c, 0x87, 0xef],
  sceneLine: [0x8b, 0xba, 0xff],
  panel: [0x12, 0x17, 0x22],
  panel2: [0x19, 0x21, 0x30],
  bg: [0x0b, 0x0e, 0x14],
  text: [0xed, 0xf3, 0xff],
  muted: [0x92, 0x9f, 0xb5],
};

function parseColor(raw: string): Rgb | null {
  const value = raw.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    const n = Number.parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
  if (fn) return [Number(fn[1]), Number(fn[2]), Number(fn[3])];
  return null;
}

export function readLabPalette(): LabPalette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: Rgb): Rgb =>
    parseColor(styles.getPropertyValue(name)) ?? fallback;
  return {
    accent: read('--accent', FALLBACK.accent),
    accentDeep: read('--accent-deep', FALLBACK.accentDeep),
    sceneLine: read('--scene-line', FALLBACK.sceneLine),
    panel: read('--panel', FALLBACK.panel),
    panel2: read('--panel-2', FALLBACK.panel2),
    bg: read('--bg', FALLBACK.bg),
    text: read('--text', FALLBACK.text),
    muted: read('--muted', FALLBACK.muted),
  };
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function scaleRgb(c: Rgb, s: number): Rgb {
  return [c[0] * s, c[1] * s, c[2] * s];
}

export function cssRgba(c: Rgb, a: number): string {
  return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`;
}

/** 订阅主题切换，返回取消函数 */
export function onThemeChange(cb: () => void): () => void {
  window.addEventListener('themechange', cb);
  return () => window.removeEventListener('themechange', cb);
}

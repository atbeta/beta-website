import { useCallback, useEffect, useRef, useState } from 'react';

const VERT = `attribute vec2 a_pos;
varying vec2 v_uv;
void main(){gl_Position=vec4(a_pos,0,1);v_uv=a_pos*0.5+0.5;}`;

const FRAG_PRE = `precision highp float;
varying vec2 v_uv;
uniform vec3 u_resolution;
uniform float u_time;
uniform vec4 u_mouse;
`;

const FRAG_POST = `
void main(){vec4 C;mainImage(C,gl_FragCoord.xy);gl_FragColor=C;}`;

const EXAMPLES: { name: string; code: string }[] = [
  {
    name: '渐变圆',
    code: `void mainImage(out vec4 C, vec2 U) {
    vec2 uv = v_uv * 2. - 1.;
    float d = length(uv);
    C = mix(vec4(.2, .4, 1., 1.), vec4(.05, .05, .15, 1.), smoothstep(.3, .5, d));
}`,
  },
  {
    name: '彩虹波',
    code: `void mainImage(out vec4 C, vec2 U) {
    vec2 uv = v_uv;
    float t = u_time * .5;
    C = vec4(
        .5 + .5 * cos(uv.x * 6. + t),
        .5 + .5 * cos(uv.y * 6. + t + 2.),
        .5 + .5 * cos((uv.x + uv.y) * 6. + t + 4.),
        1.
    );
}`,
  },
  {
    name: '棋格',
    code: `void mainImage(out vec4 C, vec2 U) {
    vec2 uv = v_uv * 10.;
    vec2 c = step(.5, fract(uv));
    float v = c.x * c.y + (1. - c.x) * (1. - c.y);
    C = mix(vec4(.1, .1, .2, 1.), vec4(.9, .85, .7, 1.), v);
}`,
  },
  {
    name: '光线步进 (3D)',
    code: `float sdSphere(vec3 p, float r) { return length(p) - r; }

float map(vec3 p) { return sdSphere(p, 1.); }

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(.001, 0.);
    return normalize(map(p) - vec3(
        map(p - e.xyy), map(p - e.yxy), map(p - e.yyx)
    ));
}

void mainImage(out vec4 C, vec2 U) {
    vec2 uv = v_uv * 2. - 1.;
    vec3 ro = vec3(0., 0., -3.);
    vec3 rd = normalize(vec3(uv, 1.));
    float t = 0.;
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < .001) break;
        t += d;
    }
    vec3 col = vec3(.05, .05, .1);
    if (t < 20.) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        col = vec3(.2, .5, .8) * max(0., dot(n, normalize(vec3(1., 2., 3.))));
    }
    C = vec4(col, 1.);
}`,
  },
  {
    name: '鼠标追踪',
    code: `void mainImage(out vec4 C, vec2 U) {
    float d = length(v_uv - u_mouse.xy);
    float glow = .02 / (d + .02);
    C = mix(vec4(.05, .05, .1, 1.), vec4(1., .4, .2, 1.), glow);
}`,
  },
  {
    name: '细胞噪声',
    code: `vec2 random2(vec2 p) {
    return fract(sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    )) * 43758.5453);
}

void mainImage(out vec4 C, vec2 U) {
    vec2 uv = v_uv * 5.;
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float m = .0;
    for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
        vec2 n = vec2(float(x), float(y));
        vec2 p = random2(i + n);
        p = .5 + .5 * sin(u_time + 6.2831 * p);
        m += 1. - smoothstep(.0, .6, length(n + p - f));
    }
    C = vec4(vec3(m * .25), 1.);
}`,
  },
  {
    name: 'Mandelbrot 分形',
    code: `void mainImage(out vec4 C, vec2 U) {
    vec2 c = (v_uv * 4. - vec2(2.5, 2.));
    vec2 z = vec2(0.);
    int n = 0;
    for (int i = 0; i < 100; i++) {
        if (dot(z, z) > 4.) break;
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;
        n++;
    }
    float t = float(n) / 100.;
    C = vec4(vec3(t), 1.);
}`,
  },
];

const RESOURCES: { label: string; href: string }[] = [
  { label: 'The Book of Shaders', href: 'https://thebookofshaders.com/' },
  { label: 'Shadertoy', href: 'https://www.shadertoy.com/' },
  {
    label: 'GLSL ES 3.0 Spec (WebGL 2)',
    href: 'https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf',
  },
  {
    label: 'Kishimisu — Intro to Shaders',
    href: 'https://www.youtube.com/watch?v=f4s1h2YETNY',
  },
  { label: 'Inigo Quilez — Articles', href: 'https://iquilezles.org/articles/' },
  {
    label: 'GLSL 内置函数速查',
    href: 'https://webgl2fundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html',
  },
];

/** GLSL 着色器画板：编辑 mainImage(out vec4 C, vec2 U)，实时编译预览 */
export default function ShaderDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [error, setError] = useState('');
  const [activeExample, setActiveExample] = useState(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5, down: false });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const startTime = useRef(performance.now());
  const animRef = useRef(0);

  const compile = useCallback(
    (gl: WebGLRenderingContext): WebGLProgram | null => {
      const vs = gl.createShader(gl.VERTEX_SHADER);
      if (!vs) return null;
      gl.shaderSource(vs, VERT);
      gl.compileShader(vs);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        setError('Vertex shader error: ' + gl.getShaderInfoLog(vs));
        gl.deleteShader(vs);
        return null;
      }
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fs) {
        gl.deleteShader(vs);
        return null;
      }
      const fullFs = FRAG_PRE + '\n' + code + '\n' + FRAG_POST;
      gl.shaderSource(fs, fullFs);
      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(fs) || '';
        const lines = fullFs.split('\n');
        const match = /ERROR: \d+:(\d+):/.exec(log);
        const preLines = FRAG_PRE.split('\n').length;
        const lineNum = match ? parseInt(match[1]) - preLines : -1;
        const near =
          lineNum > 0 && lineNum <= lines.length
            ? ' near: ' + lines[lineNum - 1].trim()
            : '';
        setError(log.replace(/\n/g, ' ').slice(0, 200) + near);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return null;
      }
      const prog = gl.createProgram();
      if (!prog) {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return null;
      }
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        setError('Link error: ' + gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
      }
      setError('');
      return prog;
    },
    [code],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: false,
      alpha: false,
    });
    if (!gl) {
      setError('WebGL not supported');
      return;
    }
    glRef.current = gl;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      const prog = progRef.current;
      if (!prog) {
        gl.clearColor(0.05, 0.05, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      gl.useProgram(prog);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_resolution'), w, h, 1);
      gl.uniform1f(
        gl.getUniformLocation(prog, 'u_time'),
        (performance.now() - startTime.current) / 1000,
      );
      gl.uniform4f(
        gl.getUniformLocation(prog, 'u_mouse'),
        mouseRef.current.x,
        1 - mouseRef.current.y,
        mouseRef.current.down ? 1 : 0,
        0,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    render();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    const old = progRef.current;
    const prog = compile(gl);
    progRef.current = prog;
    if (old) gl.deleteProgram(old);
  }, [compile]);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        down: e.buttons > 0,
      };
    },
    [],
  );

  const selectExample = (idx: number) => {
    setActiveExample(idx);
    setCode(EXAMPLES[idx].code);
    setError('');
  };

  return (
    <div className="lab-demo">
      <div className="lab-demo-header">
        <span className="lab-demo-title">GLSL Shader Playground</span>
        <span className="lab-demo-meta">WebGL 1 · mainImage(C, U)</span>
      </div>

      <div className="lab-shader-body">
        <div className="lab-shader-editor">
          <div className="lab-btn-group">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => selectExample(i)}
                className={i === activeExample ? 'lab-btn is-active' : 'lab-btn'}
              >
                {ex.name}
              </button>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setActiveExample(-1);
            }}
            className="lab-editor"
            spellCheck={false}
          />
          {error && <div className="lab-error">{error}</div>}
        </div>
        <div className="lab-shader-preview">
          <canvas
            ref={canvasRef}
            className="lab-demo-canvas lab-demo-canvas--crosshair"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerUp={handlePointer}
          />
        </div>
      </div>

      <div className="lab-resources">
        <h3>GLSL 参考资源</h3>
        <div className="lab-resources-grid">
          {RESOURCES.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {r.label}
            </a>
          ))}
        </div>
        <p className="lab-resources-note">
          Uniform: <code>v_uv</code> (0-1 UV), <code>u_time</code> (s),{' '}
          <code>u_resolution</code> (px), <code>u_mouse</code> (xy=norm pos,
          z=按下)
        </p>
      </div>
    </div>
  );
}

/**
 * 站点级文案与实验室条目集中在这个文件里。
 * 项目 / 笔记 / 研究内容已迁移到 src/content/（MDX + content collections），
 * 不要在页面里散落改动。
 */

export type Experiment = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  /** 内置 vanilla three 场景 */
  mode?: 'knot' | 'particles' | 'wave';
  /** React 演示组件（src/components/lab/ 注册表里的 key），与 mode 二选一 */
  demo?: string;
};

export const site = {
  name: 'Beta',
  wordmark: 'Beta',
  title: 'Beta — 独立开发者',
  description: '构建实用的工具，也探索代码与视觉的边界。',
  introduction: '我是 Beta，一名独立开发者。',
  heroLines: ['把想法，', '写成现实。'],
  aboutTitle: '保持好奇，持续构建。',
  aboutText:
    '构建实用的工具，也探索代码与视觉的边界。这个站点归档了我的项目、交互实验，以及一些写下来才算想清楚的思考。',
  email: 'contact@pbeta.me',
  githubUrl: 'https://github.com/atbeta' as string | null,
  sample: false,
};

export const experiments: Experiment[] = [
  {
    slug: 'topography',
    title: '声呐地形',
    description:
      'FBM 噪声生成的高度场，扫描线循环扫过地形。可拖动旋转视角，调节噪声强度与扫描速度。',
    tags: ['Three.js', 'FBM', '着色器'],
    demo: 'topography',
  },
  {
    slug: 'diffraction',
    title: '夫琅禾费衍射',
    description:
      '光穿过不同形状孔径后的远场衍射图样，纯 Canvas 逐像素计算。可切换孔径形状、波长与距离。',
    tags: ['Canvas 2D', '物理模拟', '光学'],
    demo: 'diffraction',
  },
  {
    slug: 'overlay',
    title: '套刻对位模拟',
    description:
      '给上下两层图案施加平移与旋转误差，实时观察 Box-in-Box 对位结果与规格判定。',
    tags: ['Canvas 2D', '几何模拟', '滑块交互'],
    demo: 'overlay',
  },
  {
    slug: 'particles',
    title: '粒子流场',
    description:
      '数千粒子沿噪声流场游动，留下渐隐的轨迹；指针经过时会扰动流场。',
    tags: ['粒子系统', '流场', '指针交互'],
    demo: 'particles',
  },
  {
    slug: 'shader',
    title: '着色器速写',
    description:
      '实时编译的 fragment shader 画板：调节参数、切换预设，看数学公式变成图案。',
    tags: ['GLSL', 'WebGL', '程序化生成'],
    demo: 'shader',
  },
  {
    slug: 'nanosheet',
    title: '纳米片晶体管',
    description:
      '可拖拽旋转的 GAA 晶体管 3D 结构：三层硅纳米片沟道，被栅极从四面环绕。',
    tags: ['Three.js', '3D 结构', '轨道相机'],
    demo: 'nanosheet',
  },
];

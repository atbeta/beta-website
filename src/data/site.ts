/**
 * 站点全部可替换的文案与数据都集中在这个文件里。
 * 把下面的示例内容换成你自己的真实信息即可，页面不需要改动。
 */

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  artwork: 'prism' | 'orbit' | 'relay';
  repositoryUrl: string | null;
  liveUrl: string | null;
  paragraphs: string[];
};

export type Experiment = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  mode: 'knot' | 'particles' | 'wave';
};

export type Note = {
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  paragraphs: string[];
};

export const site = {
  name: 'Beta',
  wordmark: 'beta /',
  title: 'Beta — 开发者与创造者',
  description: '构建实用的工具，也探索代码与视觉的边界。',
  introduction: '我是 Beta，一名热衷于创造的开发者。',
  heroLines: ['把想法，', '写成现实。'],
  aboutTitle: '保持好奇，持续构建。',
  aboutText:
    '白天写实用的工具，晚上把代码当成画笔。这个网站收藏我做过的项目、折腾过的小实验，以及一些写下来才算想清楚的事。没有宏大叙事，只有持续不断的「做做看」。',
  email: 'hello@example.com',
  githubUrl: null as string | null,
  sample: true,
};

export const projects: Project[] = [
  {
    slug: 'prism',
    name: 'Prism',
    tagline: '轻量的图片处理工作台',
    description:
      '一个跑在浏览器里的图片小工作台：裁剪、压缩、调色都在本地完成，文件不用上传到任何服务器。',
    tags: ['图片处理', 'Canvas', 'Web 工具'],
    artwork: 'prism',
    repositoryUrl: null,
    liveUrl: null,
    paragraphs: [
      'Prism 的起点很简单：每次临时处理一张图片，都要打开一个笨重的软件，或者把图片交给一个不知名的在线服务。我想知道，只靠前端的 Canvas 与 Web API，能把这件事做到多顺手。',
      '所有的处理都在本地进行。拖入图片之后，裁剪、缩放、格式转换和基础调色都是即时预览的，背后是 OffscreenCanvas 与一套自己封装的操作队列，每一步都可以撤销。',
      '这个项目目前仍在缓慢迭代。接下来想尝试的方向是把部分滤镜迁移到 WebGPU 计算管线，让大图处理也能保持在交互可接受的延迟内。',
    ],
  },
  {
    slug: 'orbit',
    name: 'Orbit',
    tagline: '把灵感连接成知识',
    description:
      '一个极简的笔记图谱实验：每条笔记是一个节点，相关的内容会自然地连成一片星图。',
    tags: ['知识管理', '图谱', '可视化'],
    artwork: 'orbit',
    repositoryUrl: null,
    liveUrl: null,
    paragraphs: [
      '我记笔记的方式一直很乱：灵感散落在备忘录、纸片和聊天窗口里。Orbit 想验证一个假设——如果连接比分类更容易，人们会不会更愿意整理自己的想法。',
      '它的界面只有一张图谱和一条输入框。写下任何东西，它会根据你手动建立的引用关系，把节点推到彼此附近。没有文件夹，没有标签体系，只有节点和连线。',
      '技术上它是一个纯前端应用：力导向布局自己实现，数据存在本地。这是一次关于「少即是多」的练习，也是我理解图可视化的入门课。',
    ],
  },
  {
    slug: 'relay',
    name: 'Relay',
    tagline: '让开发工作流更顺手',
    description:
      '一串顺手的命令行小脚本：把每天重复的开发杂事——起服务、清缓存、切换环境——收成一条命令。',
    tags: ['CLI', '自动化', '效率'],
    artwork: 'relay',
    repositoryUrl: null,
    liveUrl: null,
    paragraphs: [
      'Relay 不是一个宏大的框架，它更像工具腰带：一组小命令，各自只做一件事，但串起来就能把每天最烦的重复劳动压缩到几秒钟。',
      '比如 `relay env` 在不同项目的环境配置之间切换，`relay sweep` 清理占磁盘的构建产物，`relay up` 按习惯顺序拉起本地的开发服务。每个命令都可以单独使用，也可以组合进自己的脚本。',
      '写它的过程让我对「开发者体验」有了更具体的理解：好工具的标准不是功能多，而是你几乎感觉不到它的存在。',
    ],
  },
];

export const experiments: Experiment[] = [
  {
    slug: 'morph',
    title: '形态之间',
    description:
      '同一个线框体，在「结」与「轨道」两种形态之间切换。拖动它，感受几何的呼吸。',
    tags: ['Three.js', '线框', '交互'],
    mode: 'knot',
  },
  {
    slug: 'gravity',
    title: '粒子引力',
    description:
      '数百个粒子漂浮在暗色空间里，指针经过时它们会被轻轻牵引——引力强度由你掌控。',
    tags: ['粒子系统', '指针交互'],
    mode: 'particles',
  },
  {
    slug: 'slices',
    title: '波的切片',
    description:
      '一张被切成细网格的波面，随时间缓慢起伏。滑动滑杆，改变它的振幅。',
    tags: ['网格', '波形', '参数化'],
    mode: 'wave',
  },
];

export const notes: Note[] = [
  {
    slug: 'math-shape',
    title: '在浏览器里，给数学一个形状',
    date: '2026-03-18',
    category: 'Web3D',
    summary: '写下第一根线框曲线时的一些想法：数学公式如何变成屏幕上有重量的东西。',
    paragraphs: [
      '第一次在浏览器里渲染出一个环面纽结的时候，我盯着它转了很久。它只是一串参数方程的产物——半径、圈数、分段数——但当它以每秒六十帧的速度缓慢旋转时，忽然就有了某种几乎称得上是「存在感」的东西。',
      '这篇文章是一个示例段落，用来占位真实的内容。如果你沿用了这个站点，可以在这里写下你第一次接触 WebGL 或 Three.js 的经历：环境怎么搭起来、哪个概念卡了你最久、最后又是什么让你忽然通了。',
      '我学到的最重要一课是：别把三维当成特效，把它当成一种排版。光线、景深和运动速度，其实和字号、行距、留白是同一类工具——它们决定观看的节奏。',
    ],
  },
  {
    slug: 'small-tool',
    title: '做一个小工具，比想象中更难',
    date: '2026-02-09',
    category: '随想',
    summary: '大项目靠的是架构，小工具靠的是克制。记录做 Prism 时反复删功能的过程。',
    paragraphs: [
      '做小工具的诱惑在于，每加一个小功能都只需要一点点成本；做小工具的陷阱也在于此。Prism 做到一半的时候，我的功能清单上有十五项，真正每天会用的只有三项。',
      '这同样是一段示例文字。真实版本里，可以写写你如何给产品做减法：哪些功能被砍掉了、砍掉的依据是什么、砍掉之后用户（或你自己）有没有真的想念它们。',
      '我现在的标准是：如果一个功能需要解释才能被用上，那它多半不属于这个版本。工具的价值不在功能表的长度，而在你伸手就能拿到的那个瞬间。',
    ],
  },
  {
    slug: 'less-website',
    title: '我的个人网站：少一点，再少一点',
    date: '2026-01-15',
    category: '随笔',
    summary: '重写个人主页时定下的几条规矩：不设 KPI、不上追踪、不让页面比人更吵。',
    paragraphs: [
      '这是第几版个人主页，我已经数不清了。每一次重写，做掉的东西都比加上的多：删掉了统计脚本，删掉了花哨的页面切换动画，删掉了一半的颜色。',
      '留下来的东西不多：一些认真做过的项目，几个还在探索中的小实验，几篇写给自己看的笔记。这段文字是示例，替换成你重写网站时的真实动机就好——也许是换工作，也许只是看旧版不顺眼。',
      '如果说这版网站有什么立场，大概是：网页不必时刻证明什么。它可以只是一个安静的房间，摆着几件你愿意反复擦拭的东西。',
    ],
  },
];

# AGENTS.md

个人开发者网站（Astro + TypeScript + Three.js + React islands）。项目 / 笔记 / 研究内容在 `src/content/`（MDX + content collections）；站点级文案与实验室条目在 `src/data/site.ts`。

## 技术栈

- Astro 7（静态输出）、TypeScript（strict）、vanilla Three.js（`src/scripts/scenes.ts`）
- React 19（`@astrojs/react`）：仅用于交互孤岛——`src/components/lab/`（实验室 demo），页面里用 `client:only="react"` 挂载
- MDX（`@astrojs/mdx`）：内容正文；Shiki 代码高亮，GFM 表格开箱可用
- `@astrojs/rss`（`/rss.xml`）+ `@astrojs/sitemap`；站点域名在 `astro.config.mjs` 的 `site`
- 包管理器：**pnpm**（不要用 npm/yarn）

## 常用命令

```bash
pnpm dev       # 开发服务器（默认 :4321；同项目只允许一个 dev 实例）
pnpm build     # 构建到 dist/ ✅ 必须通过
pnpm preview   # 预览构建产物
pnpm check     # astro check 类型与模板检查 ✅ 必须通过（0 error）
```

注意：改动 `astro.config.mjs`、`src/content.config.ts` 或新增路由目录后，长跑的 dev server 可能不识别新路由，需重启。

## 提交规范

Conventional Commits：`feat:` `fix:` `chore:` `docs:` `style:` `refactor:`。

## 项目结构

```
src/
  data/site.ts          # 站点文案 + 实验室条目（Experiment：mode=内置场景 或 demo=React 组件）
  content.config.ts     # 3 个 collection 的 zod schema（projects/notes/research）
  content/              # MDX 内容：projects/ notes/ research/
  layouts/Layout.astro  # 骨架：主题切换脚本（派发自定义 'themechange' 事件）+ 头/脚 + <slot/>
  components/
    Scene.astro         # vanilla three 场景（首页 hero / 内置 lab 场景）
    lab/                # React demo：index.tsx 导出 LabDemo({demo})，theme.ts 读 CSS 变量
    Header/Footer/...   # 其余 Astro 组件
  pages/                # index + projects|notes|research/[slug] + rss.xml.ts
  scripts/scenes.ts     # Three.js 场景引擎，按 [data-scene] 挂载
  styles/global.css     # 设计令牌 + 全部样式（含 .prose 的 MDX 排版）
public/favicon.svg
```

## 约定

- 加内容：往 `src/content/<collection>/` 放 MDX，frontmatter 按 `content.config.ts` 的 schema；不要散落到页面里。
- 项目卡片的名称/副标题从 frontmatter `title` 按 ` — ` 拆分；`cover`（真实截图路径，放 `public/projects/`）优先作为卡片封面，缺省回落到 `artwork` 字段三选一（prism/orbit/relay）的生成示意。
- 实验室条目：`site.ts` 的 `experiments` 数组，`demo` 指向 `src/components/lab/index.tsx` 的 registry key。
- React 组件**没有 Tailwind**：样式写在组件目录的 css（lab.css），用 `lab-` 前缀类名。
- 颜色一律走 `global.css` `:root` 的设计令牌（accent 是电光蓝 #73a7ff，不要引入旧站金色 #E0A43C）；canvas/three 组件通过 `getComputedStyle` 读令牌，并监听 window 的 `themechange` 事件跟随深浅主题换色。
- 交互画布注意 `touch-action: pan-y`，不要吃掉移动端纵向滚动。
- 滚动显现：元素加 `data-reveal`（可选 `style="--reveal-delay:Nms"` 交错），Layout 里的脚本在 `html.reveal-armed`（支持 IO 且非 reduced-motion）下用 IntersectionObserver 加 `.is-revealed` 触发 CSS animation；组件透传额外属性用 `interface Props extends astroHTML.JSX.HTMLAttributes` + 解构 rest 展开。
- 不提交任何密钥或 `.env`；不要引入统计 / 追踪脚本。

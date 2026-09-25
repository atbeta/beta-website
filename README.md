# beta / — 个人开发者网站

一个深色、克制、带交互场景的个人主页：精选项目、可交互实验室、笔记与研究、关于与联系。

技术栈：Astro 7（静态输出）+ TypeScript + vanilla Three.js（首页与内置场景）+ React 19 孤岛（实验室 demo）+ MDX 内容（Shiki 高亮）。

## 运行

需要 Node >= 22.12.0 与 pnpm。

```bash
pnpm install
pnpm dev        # http://localhost:4321（同项目只允许一个 dev 实例）
pnpm build      # 产物输出到 dist/
pnpm preview    # 本地预览构建结果
pnpm check      # astro check
```

注意：改动 `astro.config.mjs`、`src/content.config.ts` 或新增路由目录后，长跑的 dev server 可能不识别新路由，需重启。

## 内容管理

**文章与项目**：往 `src/content/` 下对应目录放 MDX 文件即可，frontmatter 结构见 `src/content.config.ts`：

| 目录 | 内容 | 路由 |
| --- | --- | --- |
| `content/projects/` | 项目（含 `cover` 截图 / `artwork` 卡片插画、`repo`/`url` 链接） | `/projects/<slug>/` |
| `content/notes/` | 笔记 | `/notes/<slug>/` |
| `content/research/` | 研究长文 | `/research/<slug>/` |

**站点文案与实验室条目**：`src/data/site.ts`（名字、简介、hero、邮箱、GitHub、`experiments` 数组）。

实验室条目二选一：`mode: 'knot' | 'particles' | 'wave'` 用内置 vanilla three 场景；`demo: '<key>'` 挂 `src/components/lab/index.tsx` 注册的 React demo。

## 结构速览

- `src/pages/index.astro` — 首页（Hero 场景 + 项目 / 实验室 / 笔记与研究 / 关于）
- `src/pages/{projects,notes,research,lab}/[slug].astro` — 详情页（content collections / experiments 驱动）
- `src/pages/rss.xml.ts` + `@astrojs/sitemap` — RSS 与站点地图（域名在 `astro.config.mjs` 的 `site`）
- `src/components/Scene.astro` + `src/scripts/scenes.ts` — vanilla Three.js 场景（占位 SVG、暂停、拖动、参数控件、离屏暂停、prefers-reduced-motion）
- `src/components/lab/` — React 交互孤岛（`client:only="react"` 挂载；无 Tailwind，样式在同目录 css）
- `src/styles/global.css` — 颜色 / 间距 / 字体令牌在 `:root`，含 `.prose` 的 MDX 排版

设计基调：冷黑底色 `#0b0e14`、深蓝灰面板 `#121722`、冰白文字 `#edf3ff`、电光蓝强调 `#73a7ff`。

主配色在 `src/styles/global.css` 的 `:root` 中统一调整，插画和 3D 场景会读取同一组颜色；浏览器图标单独在 `public/favicon.svg` 中修改。

## 深浅主题

站点支持深色 / 浅色两套主题：页头的太阳 / 月亮按钮随时切换。首次访问跟随系统偏好，手动选择会被记住并沿用之后的访问。两套配色分别定义在 `global.css` 的 `:root`（深色）与 `:root[data-theme="light"]`（浅色）中。主题切换时 `Layout` 会派发 `themechange` 事件，canvas/three 组件监听它重读 CSS 变量并即时换色，无需刷新页面。

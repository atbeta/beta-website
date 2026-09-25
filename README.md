# beta / — 个人开发者网站（示例）

一个深色、克制、带 Three.js 交互场景的个人主页示例：精选项目、可交互实验室、笔记、关于与联系。

> ⚠️ 当前站点内所有项目、文章与邮箱均为**示例内容**，页脚已标注「演示站点」。按下方说明替换成真实信息即可。

## 运行

需要 Node >= 22.12.0 与 pnpm。

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 产物输出到 dist/
pnpm preview    # 本地预览构建结果
pnpm check      # astro check
```

## 把示例换成你自己的内容

只需要改一个文件：**`src/data/site.ts`**

| 要替换的内容 | 位置 |
| --- | --- |
| 名字 / 标志 / 站点标题 / 简介 | `site` 对象的 `name`、`wordmark`、`title`、`description`、`introduction` |
| 首页大标题 / 关于区 | `site` 对象的 `heroLines`（两行）、`aboutTitle`、`aboutText` |
| 联系邮箱 | `site.email`（页脚复制按钮会同步） |
| GitHub 主页 | `site.githubUrl`（`null` = 不显示 GitHub 链接） |
| 三个项目卡片 + 详情页 | `projects` 数组（`paragraphs` 是详情页正文段落） |
| 三个实验室条目 + 演示页 | `experiments` 数组（`mode` 决定场景：`knot` / `particles` / `wave`） |
| 三篇笔记 + 正文 | `notes` 数组（`paragraphs` 是正文段落） |
| 「演示站点」标记 | `site.sample` 改为 `false` 即移除页脚标注 |

源码 / 在线链接：`projects[].repositoryUrl`、`liveUrl`，填 `null` 时详情页会显示「源码链接待补充」，不会出现死链。

## 结构速览

- `src/pages/index.astro` — 首页（Hero 场景 + 项目 / 实验室 / 笔记 / 关于）
- `src/pages/{projects,lab,notes}/[slug].astro` — 由 `site.ts` 数据生成的详情页
- `src/components/Scene.astro` + `src/scripts/scenes.ts` — Three.js 场景（占位 SVG、暂停、拖动、参数控件、离屏暂停、prefers-reduced-motion）
- `src/styles/global.css` — 颜色 / 间距 / 字体令牌在 `:root`

设计基调：冷黑底色 `#0b0e14`、深蓝灰面板 `#121722`、冰白文字 `#edf3ff`、电光蓝强调 `#73a7ff`。

主配色在 `src/styles/global.css` 的 `:root` 中统一调整，插画和 3D 场景会读取同一组颜色；浏览器图标单独在 `public/favicon.svg` 中修改。

## 深浅主题

站点支持深色 / 浅色两套主题：页头的太阳 / 月亮按钮随时切换。首次访问跟随系统偏好，手动选择会被记住并沿用之后的访问。两套配色分别定义在 `global.css` 的 `:root`（深色）与 `:root[data-theme="light"]`（浅色）中，插画和 3D 场景（含 `--scene-secondary` 辅助线色）会随主题即时换色，无需刷新页面。

# AGENTS.md

个人开发者网站示例（Astro + TypeScript + Three.js）。所有项目、实验、文章数据集中在 `src/data/site.ts`，当前为**示例内容**，供替换为真实信息。

## 技术栈

- Astro 7（静态输出）、TypeScript（strict）、vanilla Three.js（无 React、无后端）
- 包管理器：**pnpm**（不要用 npm/yarn）

## 常用命令

```bash
pnpm dev       # 开发服务器（默认 :4321）
pnpm build     # 构建到 dist/
pnpm preview   # 预览构建产物
pnpm check     # astro check 类型与模板检查
```

## 提交规范

Conventional Commits：`feat:` `fix:` `chore:` `docs:` `style:` `refactor:`。

## 项目结构

```
src/
  data/site.ts          # 唯一的内容数据源（站点信息 / 项目 / 实验 / 笔记）
  layouts/Layout.astro  # 骨架：头部 + 页脚 + <slot/>
  components/           # Header、Footer、Scene、SectionHead、卡片与插画
  pages/                # index + projects|lab|notes/[slug]（getStaticPaths 驱动）
  scripts/scenes.ts     # Three.js 场景引擎，按 [data-scene] 挂载
  styles/global.css     # 设计令牌 + 全部样式
public/favicon.svg
```

## 约定

- 改文案 / 换项目：只改 `src/data/site.ts`，不要散落改页面。
- `repositoryUrl` / `githubUrl` 为 `null` 时不渲染外链，详情页显示「源码链接待补充」。
- 这是示例站点：页脚需保留「演示站点 · 项目与文章为示例内容」，由 `site.sample` 控制。
- Three 仅在 `src/scripts/scenes.ts` 中动态导入；不要引入其他前端框架。
- 设计令牌集中在 `global.css` 的 `:root`，调色优先改令牌而非散落色值。
- 不提交任何密钥或 `.env`；不要引入统计 / 追踪脚本。

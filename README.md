# 故事页（Story Pages）

[![CI](https://github.com/qiandewucimi-cpu/story-pages/actions/workflows/ci.yml/badge.svg)](https://github.com/qiandewucimi-cpu/story-pages/actions/workflows/ci.yml)
[![Deploy demo](https://github.com/qiandewucimi-cpu/story-pages/actions/workflows/pages.yml/badge.svg)](https://github.com/qiandewucimi-cpu/story-pages/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)

一个实例驱动的分章节叙事故事网页生成器，附带一个本地制作台。用一份 JSON 描述人物、章节与文案，即可生成完整的沉浸式故事页面，无需改动 React 代码。

**在线演示**：<https://qiandewucimi-cpu.github.io/story-pages/>（口令 `清晨`，内容为完全虚构的产品演示）

![虚构演示封面](docs/previews/afterglow-cover.jpg)

## 特性

- **JSON 实例驱动**：替换人物称呼、封面、章节、文案和终章，即可生成不同的故事，无需修改页面组件。
- **内置三套虚构演示**：覆盖 6 章和 4 章两种结构，用于验证引擎对章节数量和叙事方向的适配能力。
- **本地制作台**：`/studio` 提供编辑、实时预览、浏览器本地保存和 JSON 导入导出。
- **外部实例构建**：`recipient` 模式用仓库外部的 JSON 和素材构建你自己的故事，不污染仓库，也不暴露制作台入口。
- **构建期校验**：构建前验证实例结构，构建后检查其他实例的文案和素材是否混入产物。

![第一章效果](docs/previews/afterglow-chapter-01.jpg)

## 技术栈

| 层 | 选型 |
| --- | --- |
| 视图 | React 19 + TypeScript 5.8（严格类型） |
| 构建 | Vite 7，多入口；制作台按产品模式懒加载，交付产物可完全不含它 |
| 内容 | JSON 实例 + 自研 Schema 校验（`scripts/instance-schema.mjs`） |
| 质量门禁 | Node 内置 test runner + 自研隐私扫描与产物隔离检查 |
| CI | GitHub Actions：三套实例矩阵构建 + Pages 自动部署 |

## 快速开始

环境要求：Node.js 22（最低 22.12.0）和 pnpm 11.19.0。

```powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

打开：

- 成品演示：<http://127.0.0.1:4173/>
- 本地制作台：<http://127.0.0.1:4173/studio>
- 默认虚构演示口令：`清晨`

制作台草稿保存在当前浏览器的 `localStorage` 中，不会自动上传到服务器。共用设备使用完毕后应清除站点数据。

## 内置虚构演示

| 实例 | 章节 | 用途 |
| --- | ---: | --- |
| `demo-afterglow` | 6 | 默认电影感完整演示 |
| `demo-starlight` | 6 | 六章节结构替换验证 |
| `demo-lantern` | 4 | 非固定章节数量验证 |

三套演示的封面页由同一套引擎渲染，只更换实例 JSON 与素材：

| demo-afterglow | demo-starlight | demo-lantern |
| :---: | :---: | :---: |
| <img src="docs/previews/afterglow-cover.jpg" alt="demo-afterglow 封面" width="250"> | <img src="docs/previews/starlight-cover.jpg" alt="demo-starlight 封面" width="250"> | <img src="docs/previews/lantern-cover.jpg" alt="demo-lantern 封面" width="250"> |

PowerShell 中构建另一套演示：

```powershell
$env:MEMORY_INSTANCE = "demo-lantern"
$env:MEMORY_PRODUCT_MODE = "demo"
pnpm build
```

## 产品模式

| `MEMORY_PRODUCT_MODE` | 用途 | 制作台 |
| --- | --- | --- |
| `demo` | 仓库内虚构实例和产品展示；默认模式 | 可用 |
| `studio` | 本地创作与预览 | 可用 |
| `recipient` | 用外部实例构建单一故事交付 | 不提供 |

## 用外部 JSON 定制自己的故事

你可以把故事内容（JSON、图片、视频、音频）全部放在仓库之外，用它们构建自己的页面：

```powershell
$env:MEMORY_INSTANCE_FILE = "D:\my-story\project.json"
$env:MEMORY_INSTANCE_ASSETS = "D:\my-story\public"
$env:MEMORY_PRODUCT_MODE = "recipient"
pnpm build
```

假设外部 `project.json` 使用图片路径 `/story/cover.webp`，外部素材根目录必须包含对应的 `story/cover.webp`。素材根目录中的每个文件都必须在实例 JSON 中声明，不能包含额外文件或符号链接。构建脚本会拒绝位于仓库内部的外部实例或素材目录，并在构建内自动执行成品隔离检查。

临时生成的 `src/generated/` 会在成功或失败后自动删除；`dist/` 是构建产物。

> 注意：`pnpm dev` 与 `pnpm build` 共用同一个 `src/generated/`，且命令结束后都会清理它。**不要在 dev 服务器运行期间执行 `pnpm build`**，否则构建结束时会删掉 dev 正在使用的实例文件，导致页面白屏。需要构建时请先停掉 dev（或另开一个工作副本）。确认已保存所需交付物后，先预览再清理：

```powershell
git clean -ndX -- dist
git clean -fdX -- dist
```

> 提示：页面中的开启口令会被编译进前端产物，只是一种仪式交互，不是身份认证。如果你需要承载真实私人内容，请在托管层或服务端自行实现登录、授权与访问控制。

## 设计取舍

这个项目真正难的不是"做一个好看的页面"，而是**让用户敢把真实内容交给它**。几个关键决定：

| 决定 | 代价 | 换来了什么 |
| --- | --- | --- |
| 内容与代码彻底解耦，全部由 JSON 实例驱动 | 要额外维护一套 Schema 与校验 | 换一个故事不用改一行 React；实例可被工具生成、可被版本管理 |
| 真实素材允许放在仓库之外，构建时注入 | 构建配置更复杂 | 仓库本身永远不含真实内容，克隆仓库不会泄露任何东西 |
| 把隐私与隔离做成**构建失败条件**而不是文档约定 | 每次构建多花几秒 | 「不要提交私人内容」从口头纪律变成 fail-closed 门禁：仓库内路径、符号链接、未声明素材、图片 EXIF 都会被拒绝 |
| 明确声明开启口令不是身份认证 | 少了「看起来很安全」的卖点 | 前端产物无法保密。与其假装它是登录，不如把安全边界明确推给服务端/托管层，并写进文档 |
| 构建后执行产物隔离检查 | 多一道检查 | 多实例项目最怕内容串台；构建 A 故事时混入 B 故事的文案或素材，会在发布前被拦下 |

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 选择实例并启动本地开发服务器 |
| `pnpm validate:instances` | 验证所有内置虚构实例 |
| `pnpm test` | 运行实例结构与隔离测试 |
| `pnpm privacy:check` | 扫描未忽略工作文件、媒体元数据和全部可达 Git 历史 |
| `pnpm build` | 选择实例、类型检查、生成并隔离校验 `dist/`，随后清除临时生成源码 |
| `pnpm check` | 运行提交前的本地质量检查 |

## 文档

- [实例格式](docs/INSTANCE_FORMAT.md)
- [隐私边界](docs/PRIVACY_BOUNDARY.md)
- [部署说明](docs/DEPLOYMENT.md)
- [发布检查单](docs/RELEASE_CHECKLIST.md)
- [素材来源记录](docs/ASSET_PROVENANCE.md)
- [安全策略](SECURITY.md)
- [贡献指南](CONTRIBUTING.md)

## 授权

本项目基于 [MIT License](LICENSE) 开源。第三方依赖遵循各自的许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

# 故事页（Story Pages）

一个实例驱动的分章节叙事故事网页生成器，附带一个本地制作台。用一份 JSON 描述人物、章节与文案，即可生成完整的沉浸式故事页面，无需改动 React 代码。

![虚构演示封面](docs/previews/afterglow-cover.jpg)

## 特性

- **JSON 实例驱动**：替换人物称呼、封面、章节、文案和终章，即可生成不同的故事，无需修改页面组件。
- **内置三套虚构演示**：覆盖 6 章和 4 章两种结构，用于验证引擎对章节数量和叙事方向的适配能力。
- **本地制作台**：`/studio` 提供编辑、实时预览、浏览器本地保存和 JSON 导入导出。
- **外部实例构建**：`recipient` 模式用仓库外部的 JSON 和素材构建你自己的故事，不污染仓库，也不暴露制作台入口。
- **构建期校验**：构建前验证实例结构，构建后检查其他实例的文案和素材是否混入产物。

![第一章效果](docs/previews/afterglow-chapter-01.jpg)

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

临时生成的 `src/generated/` 会在成功或失败后自动删除；`dist/` 是构建产物。确认已保存所需交付物后，先预览再清理：

```powershell
git clean -ndX -- dist
git clean -fdX -- dist
```

> 提示：页面中的开启口令会被编译进前端产物，只是一种仪式交互，不是身份认证。如果你需要承载真实私人内容，请在托管层或服务端自行实现登录、授权与访问控制。

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

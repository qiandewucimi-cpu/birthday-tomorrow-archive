# 私人记忆空间

一个以实例配置驱动的纪念故事网页，以及用于本地创作虚构演示的制作台。

> [!IMPORTANT]
> 本仓库采用 **private-first** 策略，默认只包含虚构演示。页面中的静态口令会随前端代码一同交付，**不是身份认证或访问控制**。没有服务端鉴权、授权和审计之前，请勿用公开静态托管承载真实人物资料或私人内容。

![虚构演示封面](docs/previews/afterglow-cover.jpg)

## 当前能力

- 使用 JSON 实例替换人物称呼、封面、章节、文案和终章，无需修改 React 页面。
- 内置三个互不混合的虚构演示，可验证不同章节数量和叙事方向。
- `/studio` 提供本地制作台，支持编辑、预览、浏览器本地保存和 JSON 导入导出。
- `recipient` 交付模式不提供制作台入口，并只复制当前实例声明的隔离素材。
- 构建前验证实例结构，构建后检查其他实例的文案和素材是否混入 `dist`。

![第一章效果](docs/previews/afterglow-chapter-01.jpg)

## 快速开始

环境要求：Node.js 22（最低满足 Vite 要求的版本为 22.12.0）和 pnpm 11.19.0。

```powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

打开：

- 成品演示：<http://127.0.0.1:4173/>
- 内部制作台：<http://127.0.0.1:4173/studio>
- 默认虚构演示口令：`清晨`

制作台草稿保存在当前浏览器的 `localStorage` 中，不会因此自动上传到服务器。共用设备使用完毕后应清除站点数据。

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
| `studio` | 内部创作与预览 | 可用 |
| `recipient` | 单一外部实例的收件人交付构建 | 不提供 |

`recipient` 只改变交付界面和打包边界，不会把静态口令升级为安全认证。真实私密站点仍需在托管层或服务端实现可靠的登录、授权、撤销、日志和链接生命周期管理。

## 外部实例与素材

真实项目的 JSON、照片、视频、音频和其他素材必须全部位于仓库目录之外。不要把它们放进 `instances/`、Issue、Pull Request、CI 日志或 Git 历史。

假设外部 `project.json` 使用图片路径 `/customer-story/cover.webp`，外部素材根目录必须包含对应的 `customer-story/cover.webp`。素材根目录中的每个文件都必须在实例 JSON 中声明，不能包含额外文件或符号链接。

```powershell
$env:MEMORY_INSTANCE_FILE = "D:\private-memory\project.json"
$env:MEMORY_INSTANCE_ASSETS = "D:\private-memory\public"
$env:MEMORY_PRODUCT_MODE = "recipient"
pnpm build
```

构建脚本会拒绝位于仓库内部的外部实例或素材目录，并在构建内自动执行成品隔离检查。临时生成的 `src/generated/` 会在成功或失败后自动删除；`dist/` 仍是明文交付物。确认已保存所需交付物后，先预览再清理：

```powershell
git clean -ndX -- dist
git clean -fdX -- dist
```

当前不提供“一键 ZIP”或自动发布真实项目的能力。

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
- [产品化隔离规则](PRODUCTIZATION.md)
- [安全策略](SECURITY.md)
- [贡献指南](CONTRIBUTING.md)

## 授权

本项目为专有软件，`package.json` 标记为 `UNLICENSED`。除非版权所有者另行书面授权，不授予复制、修改、分发、再许可或商业使用权。详见 [LICENSE](LICENSE) 和 [第三方声明](THIRD_PARTY_NOTICES.md)。

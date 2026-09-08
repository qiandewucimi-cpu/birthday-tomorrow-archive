# 部署说明

## 部署边界

仓库上传、静态演示部署和真实收件人交付是三件不同的事：

- GitHub 源码仓库默认应保持 private。
- 公开静态站点只能使用仓库内的虚构 demo。
- 真实收件人站点必须额外实现服务端认证、授权、撤销和审计；前端静态口令不能承担这些职责。

项目当前没有一键部署或一键 ZIP 流程。

## 虚构演示构建

```powershell
pnpm install --frozen-lockfile
$env:MEMORY_INSTANCE = "demo-afterglow"
$env:MEMORY_PRODUCT_MODE = "demo"
pnpm build
```

只发布本次生成的 `dist/`。不要把整个工作区、`src/generated/`、外部实例目录或素材源目录作为部署制品。

默认按站点根路径生成 URL。部署到 `/repository-name/` 等子路径时，构建前设置 `$env:MEMORY_BASE_PATH = "/repository-name/"`；该值必须以 `/` 开始和结束，并应在目标子路径下验证一次。

产品内的“进入制作台”链接使用 `?view=studio` 查询路由，因此不依赖静态主机的 SPA rewrite；本地开发仍兼容直接访问 `/studio`。

## Recipient 构建

`recipient` 模式要求实例 JSON 和素材根目录都位于仓库外部：

```powershell
$env:MEMORY_INSTANCE_FILE = "D:\private-memory\project.json"
$env:MEMORY_INSTANCE_ASSETS = "D:\private-memory\public"
$env:MEMORY_PRODUCT_MODE = "recipient"
pnpm build
```

如果 JSON 声明 `/story/cover.webp`，素材根目录中必须存在 `story/cover.webp`。脚本会拒绝符号链接、缺失文件、未声明的额外文件，以及仓库内部路径。

构建完成后应在隔离环境中人工检查 `dist/`。不要把真实 recipient 构建交给公共 CI，也不要上传为 GitHub Actions artifact。

## 托管要求

真实私密内容至少需要：

- 服务端身份认证和逐项目授权；
- 可撤销、可过期的访问方式；
- HTTPS、合理的 CSP、`X-Content-Type-Options`、`Referrer-Policy` 和 frame 限制；
- 禁止搜索引擎索引及敏感页面缓存；
- 最小化日志，避免在 URL、Referer、错误追踪或分析系统中记录私人内容；
- 数据保留、删除、备份和事故响应流程。

仅使用 `robots` 元标签不能替代访问控制。

## 构建后清理

`dist/` 被 Git 忽略，但内容是明文；`src/generated/` 会由构建器在成功或失败后自动删除。确认交付完成后先预览将删除的忽略文件，再执行清理：

```powershell
git clean -ndX -- dist
git clean -fdX -- dist
```

随后清除当前浏览器的制作台草稿、终端历史中不再需要的私人路径，以及托管平台上的临时制品。

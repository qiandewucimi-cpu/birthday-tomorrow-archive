# 仓库组织与实例规范

本仓库只承载可复用的引擎、类型、校验、测试与构建代码，以及完全虚构的演示实例。任何真实故事内容都通过外部 JSON 与外部素材目录构建，不进入仓库。

## 组织规则

- 可复用的引擎、schema、实例校验与演示代码都在本仓库内。
- 只有完全虚构的演示可以放在 `instances/` 下。
- 真实故事的内容与素材必须位于仓库之外，由 `MEMORY_INSTANCE_FILE`（JSON）与可选的 `MEMORY_INSTANCE_ASSETS`（图片目录）临时指定。
- 带图片的外部实例需要同时提供外部素材目录。
- 外部实例只能以 `MEMORY_PRODUCT_MODE=recipient` 构建。
- recipient 模式不提供制作台入口；页面口令只是仪式交互，不是身份认证。

## 完成标准

- 不同人物与章节数量的实例，无需修改可复用的 React 组件即可构建。
- 每个内置演示只复制自己声明的素材目录。
- 成品隔离检查能证明产物中不存在其他实例的标记或素材目录。
- 临时生成源码自动清理，交付后清理 `dist/`。

## 常用命令

- `pnpm validate:instances` 校验所有内置虚构演示。
- `pnpm test` 运行 schema 与隔离测试。
- `pnpm privacy:check` 扫描未忽略工作文件、媒体元数据与全部可达 Git 历史。
- `pnpm build` 构建默认的 `demo-afterglow`。
- 设置 `MEMORY_INSTANCE=demo-starlight` 或 `MEMORY_INSTANCE=demo-lantern` 构建另一套虚构演示。
- 外部构建：指定 `MEMORY_INSTANCE_FILE`，若声明了图片还需 `MEMORY_INSTANCE_ASSETS`，并设置 `MEMORY_PRODUCT_MODE=recipient`。

新增或交付实例前，请先阅读 `README.md`、`docs/INSTANCE_FORMAT.md`、`docs/PRIVACY_BOUNDARY.md` 和 `docs/RELEASE_CHECKLIST.md`。

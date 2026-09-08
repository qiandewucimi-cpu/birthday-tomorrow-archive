# 贡献指南

本仓库为 `UNLICENSED` 专有项目，仅接受版权所有者授权的贡献。提交代码或内容不代表获得项目的复制、分发或商业使用权。

## 开发准备

1. 使用 Node.js 22 和 pnpm 11.19.0。
2. 运行 `pnpm install --frozen-lockfile`。
3. 运行 `pnpm dev`，只使用仓库内的虚构实例进行开发。
4. 阅读 `docs/PRIVACY_BOUNDARY.md` 和 `docs/INSTANCE_FORMAT.md`。

## 隐私与素材规则

- 不得提交真实姓名、聊天记录、日期、地址、私人答案、客户 URL 或任何可识别信息。
- 不得把真实照片、视频、录音、音乐或外部客户 JSON 放入仓库、Issue、PR、截图或 CI。
- 新增虚构素材时必须记录来源、生成方式、变换步骤和权利复核状态。
- 不得用真实客户文件演示错误或测试失败；请构造最小虚构样例。
- `recipient` 模式不是服务端鉴权，不得在文案中把它描述为“安全登录”或“密码保护”。

## 变更流程

1. 从最新 `main` 建立范围单一的分支。
2. 避免混入格式化噪声、生成目录或无关修改。
3. 更新与行为变化对应的文档和 Changelog。
4. 提交前运行：

```text
pnpm validate:instances
pnpm test
pnpm privacy:check
pnpm build
node scripts/check-dist.mjs demo-afterglow
```

修改实例引擎或打包逻辑时，还要分别为 `demo-starlight` 和 `demo-lantern` 构建并执行 `check-dist`。

## Pull Request

PR 应说明目的、影响范围、测试证据和回滚方式。界面修改可附虚构演示截图，但必须先检查截图中没有本机路径、通知、账号信息或真实素材。

涉及依赖、素材、隐私边界、部署或产品模式的变更，需要维护者明确审阅后才能合并。

# Third-party notices

本项目本身为 `UNLICENSED` 专有软件。下列第三方组件保留各自的版权和许可证；本文件不改变或替代其许可证文本。

## 直接运行依赖

| 组件 | 许可证 | 用途 |
| --- | --- | --- |
| React | MIT | 用户界面运行时 |
| React DOM | MIT | 浏览器渲染 |

## 开发依赖

| 组件 | 许可证 | 用途 |
| --- | --- | --- |
| Vite | MIT | 开发服务器和生产构建 |
| `@vitejs/plugin-react` | MIT | React 构建集成 |
| TypeScript | Apache-2.0 | 类型检查 |
| `@types/node` | MIT | Node.js 构建脚本类型声明 |
| `@types/react` | MIT | React 类型声明 |
| `@types/react-dom` | MIT | React DOM 类型声明 |

准确版本和传递依赖以 `pnpm-lock.yaml` 为准。依赖均来自官方 npm 注册表并受锁文件完整性校验；对外分发前应重新生成完整依赖许可证清单，并确认构建产物保留了各许可证要求的声明。

虚构演示图像和预览图的来源记录见 `docs/ASSET_PROVENANCE.md`；它们不因第三方代码许可证而自动获得授权。

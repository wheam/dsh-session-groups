# dsh-session-groups

独立的 DSH Session 虚拟分组插件工作区。实现、Provider API、安装方式和当前 UI 边界见 [`packages/dsh-session-groups/README.md`](packages/dsh-session-groups/README.md)。

```bash
pnpm install
pnpm run check
```

当前目标版本为 DeepSeek Harness `0.1.1-rc.2`。`packages/typert-protocol-shim` 只用于补齐 rc.2 Typert generator 的 workspace 符号发现；发布产物仍引用官方 `@deepseek-ai/dsh-typert-protocol`，不会携带这个构建 shim。

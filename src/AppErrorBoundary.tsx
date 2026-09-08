import { Component, type ErrorInfo, type ReactNode } from "react";
import { progressStorageKey, studioDraftStorageKey } from "./product/currentInstance";

type State = { failed: boolean };

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Memory experience render failure", error, info);
  }

  private restart = () => {
    try { window.localStorage.removeItem(progressStorageKey); } catch { /* Reload still works when storage is unavailable. */ }
    window.location.reload();
  };

  private resetStudio = () => {
    try { window.localStorage.removeItem(studioDraftStorageKey); } catch { /* Reload still works when storage is unavailable. */ }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const isStudio = new URLSearchParams(window.location.search).get("view") === "studio" || window.location.pathname.replace(/\/$/, "").endsWith("/studio");
    return (
      <main className="error-page">
        <section>
          <p>{isStudio ? "制作台暂时没有成功打开，本机草稿仍然保留。" : "房间暂时暗了一下。"}</p>
          <button onClick={this.restart}>{isStudio ? "保留草稿并重试" : "重新点亮"}</button>
          {isStudio && <button onClick={this.resetStudio}>清除草稿并恢复演示</button>}
        </section>
      </main>
    );
  }
}

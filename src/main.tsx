import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./AppErrorBoundary";
import { applyInstanceMetadata } from "./product/currentInstance";
import "./styles.css";

const isStudio = new URLSearchParams(window.location.search).get("view") === "studio" || window.location.pathname.replace(/\/$/, "").endsWith("/studio");
const studioEnabled = __PRODUCT_MODE__ === "demo" || __PRODUCT_MODE__ === "studio";
const StudioApp = studioEnabled ? lazy(() => import("./StudioApp")) : null;
if (!isStudio) applyInstanceMetadata();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      {isStudio ? StudioApp ? <Suspense fallback={<main className="error-page"><p>正在打开制作台…</p></main>}><StudioApp /></Suspense> : <main className="error-page"><p>当前交付版本不包含制作台。</p><a href={import.meta.env.BASE_URL}>返回成品</a></main> : <App />}
    </AppErrorBoundary>
  </StrictMode>,
);

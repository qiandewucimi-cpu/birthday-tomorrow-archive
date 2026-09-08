import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent } from "react";
import { currentInstance, resolveInstanceAsset, studioDraftStorageKey } from "./product/currentInstance";
import type { MemoryChapter, ProductInstance } from "./product/types";
import { isProductInstance, safeLocalImage, validateProductInstance } from "./product/validateInstance";
import "./studio.css";

const DRAFT_KEY = studioDraftStorageKey;
const DRAFT_TTL = 30 * 24 * 60 * 60 * 1000;
type PreviewPage = "cover" | "chapter" | "finale";

function cloneInstance(instance: ProductInstance): ProductInstance {
  return structuredClone(instance);
}

function readDraft(): ProductInstance {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null");
    if (saved && typeof saved === "object" && "savedAt" in saved && "instance" in saved) {
      const envelope = saved as { savedAt?: unknown; instance?: unknown };
      if (typeof envelope.savedAt === "number" && Date.now() - envelope.savedAt < DRAFT_TTL && isProductInstance(envelope.instance)) return envelope.instance;
    }
    window.localStorage.removeItem(DRAFT_KEY);
    return cloneInstance(currentInstance);
  } catch {
    return cloneInstance(currentInstance);
  }
}

function previewSceneStyle(image?: string) {
  const source = safeLocalImage(image);
  return { "--preview-image": source ? `url("${resolveInstanceAsset(source)}")` : "none" } as CSSProperties;
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug && /^[a-z0-9]/.test(slug) ? slug.slice(0, 48) : `memory-${Date.now().toString().slice(-8)}`;
}

function renumber(chapters: MemoryChapter[]) {
  return chapters.map((chapter, index) => ({ ...chapter, number: index + 1 }));
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function StudioPreview({ instance, page, chapterIndex, onPage, onChapter }: {
  instance: ProductInstance;
  page: PreviewPage;
  chapterIndex: number;
  onPage: (page: PreviewPage) => void;
  onChapter: (index: number) => void;
}) {
  const chapter = instance.chapters[chapterIndex] ?? instance.chapters[0];
  return (
    <div className="studio-device">
      <div className="studio-device__bar"><i /><span>故事页 · 预览</span><b>{instance.chapters.length}章</b></div>
      <div className="studio-device__screen">
        {page === "cover" && (
          <section className="preview-cover has-preview-image" style={previewSceneStyle(instance.opening.image)}>
            <div className="preview-grain" />
            <small>{instance.opening.eyebrow}</small>
            <h2><span>{instance.opening.titleLines[0]}</span><span>{instance.opening.titleLines[1]}</span></h2>
            <div className="preview-orbit"><i /><i /><i /></div>
            <p>{instance.opening.invitation}</p>
            <button onClick={() => onPage("chapter")}>沿着光走进去</button>
            <em>{instance.sender.displayName}，写给{instance.recipient.displayName}</em>
          </section>
        )}
        {page === "chapter" && chapter && (
          <section className="preview-chapter has-preview-image" style={previewSceneStyle(chapter.image)}>
            <header><small>{instance.title}</small><b>{chapterIndex + 1}/{instance.chapters.length}</b></header>
            <div className="preview-progress"><i style={{ width: `${(chapterIndex + 1) / instance.chapters.length * 100}%` }} /></div>
            <div className="preview-chapter__card">
              <strong>{String(chapter.number).padStart(2, "0")}</strong>
              <small>{chapter.eyebrow} · {chapter.accent}</small>
              <h2>{chapter.title || "未命名章节"}</h2>
              <p>{chapter.body || "在左侧写下这一段记忆。"}</p>
            </div>
            <nav>
              <button disabled={chapterIndex === 0} onClick={() => onChapter(chapterIndex - 1)}>上一章</button>
              <span>{instance.chapters.map((item, index) => <i key={item.number} className={index === chapterIndex ? "is-active" : ""} />)}</span>
              <button onClick={() => chapterIndex === instance.chapters.length - 1 ? onPage("finale") : onChapter(chapterIndex + 1)}>{chapterIndex === instance.chapters.length - 1 ? "去终章" : "下一章"}</button>
            </nav>
          </section>
        )}
        {page === "finale" && (
          <section className="preview-finale has-preview-image" style={previewSceneStyle(instance.finale.image)}>
            <div>✦ · ✧ · ✦</div>
            <small>{instance.finale.eyebrow} · {instance.chapters.length}/{instance.chapters.length}</small>
            <h2>{instance.finale.heading}</h2>
            <p>{instance.finale.body}</p>
            <button onClick={() => { onChapter(0); onPage("cover"); }}>重新预览</button>
          </section>
        )}
      </div>
    </div>
  );
}

export default function StudioApp() {
  const [draft, setDraft] = useState<ProductInstance>(readDraft);
  const [activeChapter, setActiveChapter] = useState(0);
  const [previewPage, setPreviewPage] = useState<PreviewPage>("cover");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("已在当前浏览器保存");
  const [undoDraft, setUndoDraft] = useState<ProductInstance | null>(null);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
  const importInput = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previewTrigger = useRef<HTMLButtonElement | null>(null);
  const issues = useMemo(() => validateProductInstance(draft), [draft]);

  useEffect(() => {
    document.title = "故事页 · 制作台";
    if (!persistenceEnabled) return;
    const persist = () => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), instance: draft }));
        setNotice("已在当前浏览器保存");
      } catch {
        setNotice("浏览器存储空间不足，请立即导出 JSON");
      }
    };
    const timer = window.setTimeout(persist, 250);
    const flushOnPageHide = () => persist();
    window.addEventListener("pagehide", flushOnPageHide);
    setNotice("正在保存…");
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [draft, persistenceEnabled]);

  useEffect(() => {
    if (!previewOpen) return;
    const workspace = document.querySelector<HTMLElement>(".studio-workspace");
    const topbar = document.querySelector<HTMLElement>(".studio-topbar");
    if (workspace) workspace.inert = true;
    if (topbar) topbar.inert = true;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
      if (event.key === "Tab" && modalRef.current) {
        const controls = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (workspace) workspace.inert = false;
      if (topbar) topbar.inert = false;
      window.requestAnimationFrame(() => previewTrigger.current?.focus());
    };
  }, [previewOpen]);

  const updateDraft = (recipe: (next: ProductInstance) => void) => {
    setDraft((current) => {
      const next = cloneInstance(current);
      recipe(next);
      return next;
    });
  };

  const updateChapter = (patch: Partial<MemoryChapter>) => updateDraft((next) => Object.assign(next.chapters[activeChapter], patch));

  const saveUndoPoint = () => setUndoDraft(cloneInstance(draft));
  const openPreview = (event: MouseEvent<HTMLButtonElement>) => {
    previewTrigger.current = event.currentTarget;
    setPreviewOpen(true);
  };
  const undoLastAction = () => {
    if (!undoDraft) return;
    setDraft(cloneInstance(undoDraft));
    setUndoDraft(null);
    setPersistenceEnabled(true);
    setActiveChapter(0);
    setPreviewPage("cover");
    setNotice("已撤销上一步");
  };

  const addChapter = () => {
    if (draft.chapters.length >= 30) return;
    updateDraft((next) => {
      next.chapters.splice(activeChapter + 1, 0, {
        number: activeChapter + 2,
        eyebrow: "新记忆",
        title: "还没有取名的一章",
        body: "在这里写下这段记忆发生了什么，以及你最想让对方记住的细节。",
        accent: "暖金",
      });
      next.chapters = renumber(next.chapters);
    });
    setActiveChapter(activeChapter + 1);
    setPreviewPage("chapter");
  };

  const removeChapter = () => {
    if (draft.chapters.length <= 1) return;
    if (!window.confirm(`确认删除“${draft.chapters[activeChapter].title}”？删除后仍可撤销一次。`)) return;
    saveUndoPoint();
    updateDraft((next) => { next.chapters = renumber(next.chapters.filter((_, index) => index !== activeChapter)); });
    setActiveChapter(Math.max(0, activeChapter - 1));
  };

  const moveChapter = (direction: -1 | 1) => {
    const target = activeChapter + direction;
    if (target < 0 || target >= draft.chapters.length) return;
    updateDraft((next) => {
      [next.chapters[activeChapter], next.chapters[target]] = [next.chapters[target], next.chapters[activeChapter]];
      next.chapters = renumber(next.chapters);
    });
    setActiveChapter(target);
  };

  const exportJson = () => {
    if (issues.length) {
      setNotice(`还需要修正 ${issues.length} 项`);
      return;
    }
    const normalized = cloneInstance(draft);
    normalized.id = slugify(normalized.id || normalized.title);
    normalized.storageNamespace = normalized.id;
    const blob = new Blob([`${JSON.stringify(normalized, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${normalized.id}.project.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("项目 JSON 已导出");
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("项目文件不能超过 1 MB");
      const imported: unknown = JSON.parse(await file.text());
      const importedIssues = validateProductInstance(imported);
      if (importedIssues.length) throw new Error(importedIssues[0]);
      saveUndoPoint();
      setDraft(imported as ProductInstance);
      setPersistenceEnabled(true);
      setActiveChapter(0);
      setPreviewPage("cover");
      setNotice("项目已导入并保存在当前浏览器");
    } catch (error) {
      setNotice(error instanceof Error ? `导入失败：${error.message}` : "导入失败");
    }
  };

  const resetDemo = () => {
    if (!window.confirm("确认用虚构演示覆盖当前草稿？覆盖后仍可撤销一次。")) return;
    saveUndoPoint();
    setDraft(cloneInstance(currentInstance));
    setPersistenceEnabled(true);
    setActiveChapter(0);
    setPreviewPage("cover");
    setNotice("已恢复虚构演示");
  };

  const clearLocalDraft = () => {
    if (!window.confirm("确认清除这台设备上的制作台草稿？当前内容会保留在页面中，但本次会话将停止自动保存。")) return;
    saveUndoPoint();
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* Storage can be unavailable. */ }
    setPersistenceEnabled(false);
    setNotice("本机草稿已清除，本次会话已停止自动保存");
  };

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-brand" href={import.meta.env.BASE_URL} aria-label="返回成品演示"><span>记</span><div><small>STORY PAGES</small><strong>制作台</strong></div></a>
        <div className="studio-privacy"><i />本机明文草稿 · 未上传服务器 · 再次打开时清除超过 30 天的草稿</div>
        <div className="studio-actions">
          <input ref={importInput} className="studio-file-input" type="file" accept="application/json,.json" onChange={importJson} aria-label="选择项目 JSON 文件" />
          <button className="studio-button studio-button--ghost" onClick={() => importInput.current?.click()}>导入 JSON</button>
          {undoDraft && <button className="studio-button studio-button--ghost" onClick={undoLastAction}>撤销上一步</button>}
          <button className="studio-button studio-button--ghost" onClick={resetDemo}>恢复演示</button>
          <button className="studio-button studio-button--ghost" onClick={clearLocalDraft}>清除本机数据</button>
          <button className="studio-button studio-button--primary" onClick={exportJson}>导出项目</button>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <div className="studio-sidebar__heading"><div><small>STORY MAP</small><strong>故事结构</strong></div><button onClick={addChapter} aria-label="新增章节">＋</button></div>
          <button className={previewPage === "cover" ? "studio-nav-item is-active" : "studio-nav-item"} onClick={() => setPreviewPage("cover")} aria-label="编辑封面与开场" aria-current={previewPage === "cover" ? "page" : undefined}><i>封</i><span><small>OPENING</small><strong>封面与开场</strong></span></button>
          <div className="studio-chapter-list">
            {draft.chapters.map((chapter, index) => (
              <button key={`${chapter.number}-${index}`} className={activeChapter === index && previewPage === "chapter" ? "studio-nav-item is-active" : "studio-nav-item"} onClick={() => { setActiveChapter(index); setPreviewPage("chapter"); }} aria-label={`编辑第 ${index + 1} 章：${chapter.title || "未命名章节"}`} aria-current={activeChapter === index && previewPage === "chapter" ? "page" : undefined}>
                <i>{String(index + 1).padStart(2, "0")}</i><span><small>{chapter.eyebrow || "MEMORY"}</small><strong>{chapter.title || "未命名章节"}</strong></span>
              </button>
            ))}
          </div>
          <button className={previewPage === "finale" ? "studio-nav-item is-active" : "studio-nav-item"} onClick={() => setPreviewPage("finale")} aria-label="编辑终章与祝福" aria-current={previewPage === "finale" ? "page" : undefined}><i>终</i><span><small>FINALE</small><strong>终章与祝福</strong></span></button>
        </aside>

        <section className="studio-editor">
          <div className="studio-editor__intro">
            <div><small>{previewPage === "cover" ? "PROJECT & OPENING" : previewPage === "chapter" ? `MEMORY ${String(activeChapter + 1).padStart(2, "0")}` : "FINALE"}</small><h1>{previewPage === "cover" ? "作品信息与开场" : previewPage === "chapter" ? draft.chapters[activeChapter]?.title : "终章与最后一句话"}</h1></div>
            <div className="studio-save-state" aria-live="polite"><i />{notice}</div>
          </div>

          {previewPage === "cover" && <div className="studio-form">
            <section className="studio-form-card"><header><span>01</span><div><strong>作品信息</strong><small>决定链接、标题与双方称呼</small></div></header><div className="studio-form-grid">
              <Field label="项目 ID" hint="仅使用小写字母、数字和连字符"><input value={draft.id} onChange={(event) => updateDraft((next) => { next.id = event.target.value; next.storageNamespace = event.target.value; })} /></Field>
              <Field label="纪念场合"><input value={draft.occasionLabel} onChange={(event) => updateDraft((next) => { next.occasionLabel = event.target.value; })} /></Field>
              <Field label="送件人称呼"><input value={draft.sender.displayName} onChange={(event) => updateDraft((next) => { next.sender.displayName = event.target.value; })} /></Field>
              <Field label="收件人称呼"><input value={draft.recipient.displayName} onChange={(event) => updateDraft((next) => { next.recipient.displayName = event.target.value; })} /></Field>
              <Field label="作品标题"><input value={draft.title} onChange={(event) => updateDraft((next) => { next.title = event.target.value; })} /></Field>
              <Field label="作品描述"><textarea rows={3} value={draft.description} onChange={(event) => updateDraft((next) => { next.description = event.target.value; })} /></Field>
              <Field label="开启问题"><input value={draft.access.prompt} onChange={(event) => updateDraft((next) => { next.access.prompt = event.target.value; })} /></Field>
              <Field label="输入框提示"><input value={draft.access.placeholder} onChange={(event) => updateDraft((next) => { next.access.placeholder = event.target.value; })} /></Field>
              <Field label="开启答案" hint="答案会进入前端产物，只是仪式交互，不是真正加密"><input value={draft.access.passphrase} onChange={(event) => updateDraft((next) => { next.access.passphrase = event.target.value; })} /></Field>
            </div></section>
            <section className="studio-form-card"><header><span>02</span><div><strong>封面文案</strong><small>第一眼决定礼物的情绪</small></div></header><div className="studio-form-grid">
              <Field label="封面眉题"><input value={draft.opening.eyebrow} onChange={(event) => updateDraft((next) => { next.opening.eyebrow = event.target.value; })} /></Field>
              <Field label="第一行标题"><input value={draft.opening.titleLines[0]} onChange={(event) => updateDraft((next) => { next.opening.titleLines[0] = event.target.value; })} /></Field>
              <Field label="第二行标题"><input value={draft.opening.titleLines[1]} onChange={(event) => updateDraft((next) => { next.opening.titleLines[1] = event.target.value; })} /></Field>
              <Field label="开场邀请"><textarea rows={3} value={draft.opening.invitation} onChange={(event) => updateDraft((next) => { next.opening.invitation = event.target.value; })} /></Field>
              <Field label="封面图片路径" hint="仅支持站内路径，例如 /story/cover.webp"><input value={draft.opening.image ?? ""} onChange={(event) => updateDraft((next) => { next.opening.image = event.target.value || undefined; })} /></Field>
              <Field label="分享封面路径" hint="用于链接预览，建议 1200×630"><input value={draft.socialImage ?? ""} onChange={(event) => updateDraft((next) => { next.socialImage = event.target.value || undefined; })} /></Field>
            </div></section>
          </div>}

          {previewPage === "chapter" && draft.chapters[activeChapter] && <div className="studio-form">
            <div className="studio-chapter-tools"><span>第 {activeChapter + 1} / {draft.chapters.length} 章</span><div><button disabled={activeChapter === 0} onClick={() => moveChapter(-1)}>↑ 前移</button><button disabled={activeChapter === draft.chapters.length - 1} onClick={() => moveChapter(1)}>↓ 后移</button><button onClick={addChapter}>＋ 新增</button><button className="is-danger" disabled={draft.chapters.length <= 1} onClick={removeChapter}>删除</button></div></div>
            <section className="studio-form-card"><header><span>{String(activeChapter + 1).padStart(2, "0")}</span><div><strong>章节内容</strong><small>先写事实，再写你为什么记得</small></div></header><div className="studio-form-grid">
              <Field label="章节眉题"><input value={draft.chapters[activeChapter].eyebrow} onChange={(event) => updateChapter({ eyebrow: event.target.value })} /></Field>
              <Field label="章节标题"><input value={draft.chapters[activeChapter].title} onChange={(event) => updateChapter({ title: event.target.value })} /></Field>
              <Field label="情绪标签"><input value={draft.chapters[activeChapter].accent} onChange={(event) => updateChapter({ accent: event.target.value })} /></Field>
              <Field label="正文"><textarea rows={8} value={draft.chapters[activeChapter].body} onChange={(event) => updateChapter({ body: event.target.value })} /></Field>
              <Field label="章节图片路径" hint="仅支持站内路径，不会请求外部图片"><input value={draft.chapters[activeChapter].image ?? ""} onChange={(event) => updateChapter({ image: event.target.value || undefined })} /></Field>
            </div></section>
          </div>}

          {previewPage === "finale" && <div className="studio-form"><section className="studio-form-card"><header><span>终</span><div><strong>最后留下的话</strong><small>让体验停在最想被记住的一句</small></div></header><div className="studio-form-grid">
            <Field label="终章眉题"><input value={draft.finale.eyebrow} onChange={(event) => updateDraft((next) => { next.finale.eyebrow = event.target.value; })} /></Field>
            <Field label="终章标题"><input value={draft.finale.heading} onChange={(event) => updateDraft((next) => { next.finale.heading = event.target.value; })} /></Field>
            <Field label="终章正文"><textarea rows={6} value={draft.finale.body} onChange={(event) => updateDraft((next) => { next.finale.body = event.target.value; })} /></Field>
            <Field label="终章图片路径" hint="仅支持站内路径，不会请求外部图片"><input value={draft.finale.image ?? ""} onChange={(event) => updateDraft((next) => { next.finale.image = event.target.value || undefined; })} /></Field>
          </div></section></div>}

          {issues.length > 0 && <div className="studio-issues" role="status"><strong>交付前还需处理 {issues.length} 项</strong><ul>{issues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
        </section>

        <aside className="studio-preview-panel">
          <div className="studio-preview-panel__heading"><div><small>LIVE PREVIEW</small><strong>即时成品预览</strong></div><button onClick={openPreview}>全屏查看</button></div>
          <StudioPreview instance={draft} page={previewPage} chapterIndex={activeChapter} onPage={setPreviewPage} onChapter={(index) => { setActiveChapter(index); setPreviewPage("chapter"); }} />
          <p>预览会随内容立即更新。图片应放入当前实例的专属资产目录，禁止把真实素材堆进仓库根 public。</p>
        </aside>
      </div>

      {previewOpen && <div ref={modalRef} className="studio-modal" role="dialog" aria-modal="true" aria-label="全屏成品预览"><button autoFocus className="studio-modal__close" onClick={() => setPreviewOpen(false)}>关闭预览 ×</button><StudioPreview instance={draft} page={previewPage} chapterIndex={activeChapter} onPage={setPreviewPage} onChapter={(index) => { setActiveChapter(index); setPreviewPage("chapter"); }} /></div>}
      <button className="studio-mobile-preview" onClick={openPreview}>查看即时预览</button>
    </main>
  );
}

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { currentInstance, progressStorageKey, resolveInstanceAsset } from "./product/currentInstance";

type SavedState = {
  unlocked: boolean;
  activeChapter: number;
  completed: number[];
};

const initialState: SavedState = { unlocked: false, activeChapter: 1, completed: [] };

function ProductLink() {
  return __PRODUCT_MODE__ === "demo" ? <a className="product-link" href={`${import.meta.env.BASE_URL}?view=studio`}>进入制作台 <span>↗</span></a> : null;
}

function readState(): SavedState {
  try {
    const saved = JSON.parse(window.localStorage.getItem(progressStorageKey) ?? "null");
    if (!saved) return initialState;
    const chapterNumbers = new Set(currentInstance.chapters.map((chapter) => chapter.number));
    const activeChapter = chapterNumbers.has(Number(saved.activeChapter)) ? Number(saved.activeChapter) : currentInstance.chapters[0].number;
    return {
      unlocked: Boolean(saved.unlocked),
      activeChapter,
      completed: Array.isArray(saved.completed)
        ? saved.completed.filter((number: unknown): number is number => typeof number === "number" && chapterNumbers.has(number))
        : [],
    };
  } catch {
    return initialState;
  }
}

export default function App() {
  const [state, setState] = useState<SavedState>(readState);
  const [entered, setEntered] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const chapter = useMemo(
    () => currentInstance.chapters.find((item) => item.number === state.activeChapter) ?? currentInstance.chapters[0],
    [state.activeChapter],
  );

  useEffect(() => {
    const currentIndex = currentInstance.chapters.findIndex((item) => item.number === chapter.number);
    const nextImage = resolveInstanceAsset(currentInstance.chapters[currentIndex + 1]?.image ?? currentInstance.finale.image);
    if (!nextImage) return;
    const preload = new Image();
    preload.src = nextImage;
  }, [chapter.number]);

  const save = (next: SavedState) => {
    setState(next);
    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(next));
    } catch {
      // The experience still works when storage is blocked; progress simply will not persist.
    }
  };

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    if (answer.trim() !== currentInstance.access.passphrase) {
      setWrong(true);
      return;
    }
    save({ ...state, unlocked: true });
  };

  const completeChapter = () => {
    const completed = Array.from(new Set([...state.completed, chapter.number]));
    const currentIndex = currentInstance.chapters.findIndex((item) => item.number === chapter.number);
    const next = currentInstance.chapters[currentIndex + 1];
    save({ ...state, completed, activeChapter: next?.number ?? chapter.number });
  };

  const sceneStyle = (image?: string) => ({ "--scene-image": image ? `url("${resolveInstanceAsset(image)}")` : "none" }) as CSSProperties;
  const chapterCount = String(currentInstance.chapters.length).padStart(2, "0");
  const resetJourney = () => {
    save(initialState);
    setEntered(false);
    setAnswer("");
    setWrong(false);
  };

  if (!state.unlocked) {
    return (
      <main className="gate has-scene" style={sceneStyle(currentInstance.opening.image)}>
        <ProductLink />
        <div className="scene" />
        <div className="grain" />
        <section className="gate__card">
          <small>PRIVATE MEMORY SPACE · {__PRODUCT_MODE__ === "demo" ? "FICTIONAL DEMO" : currentInstance.occasionLabel}</small>
          <div className="seal">记</div>
          <h1>有一段故事<br />正在等你打开</h1>
          <form onSubmit={unlock}>
            <label htmlFor="passphrase">{currentInstance.access.prompt}</label>
            <input id="passphrase" autoComplete="off" value={answer} onChange={(event) => { setAnswer(event.target.value); setWrong(false); }} placeholder={currentInstance.access.placeholder} />
            {wrong && <p role="alert">答案还没有对上。</p>}
            <button type="submit">打开这份记忆</button>
          </form>
        </section>
      </main>
    );
  }

  if (!entered) {
    return (
      <main className="cover has-scene" style={sceneStyle(currentInstance.opening.image)}>
        <ProductLink />
        <div className="scene" />
        <div className="grain" />
        <section className="cover__content">
          <p>{currentInstance.opening.eyebrow}</p>
          <h1><span>{currentInstance.opening.titleLines[0]}</span><span>{currentInstance.opening.titleLines[1]}</span></h1>
          <div className="cover__line"><i /> MEMORY EDITION · 01—{chapterCount}</div>
          <p className="cover__invitation">{currentInstance.opening.invitation}</p>
          <button onClick={() => setEntered(true)}>开始这段故事 <span>→</span></button>
          <small>{currentInstance.sender.displayName}，写给{currentInstance.recipient.displayName}</small>
        </section>
        <aside className="cover__folio"><span>{__PRODUCT_MODE__ === "demo" ? "虚构演示" : currentInstance.occasionLabel}</span><b>{chapterCount}</b><small>CHAPTERS</small></aside>
      </main>
    );
  }

  const allComplete = currentInstance.chapters.every((item) => state.completed.includes(item.number));
  if (allComplete) {
    return (
      <main className="finale has-scene" style={sceneStyle(currentInstance.finale.image)}>
        <ProductLink />
        <div className="scene" />
        <div className="grain" />
        <section className="finale__content">
        <div className="finale__stars">✦ · ✧ · ✦</div>
        <small>{currentInstance.finale.eyebrow} · {state.completed.length} / {currentInstance.chapters.length}</small>
        <h1>{currentInstance.finale.heading}</h1>
        <p>{currentInstance.finale.body}</p>
        <button onClick={resetJourney}>重新阅读</button>
        </section>
      </main>
    );
  }

  return (
    <main className="journey has-scene" style={sceneStyle(chapter.image)}>
      <ProductLink />
      <div className="scene" />
      <div className="grain" />
      <header>
        <div><small>{currentInstance.title}</small><strong>{String(state.completed.length).padStart(2, "0")} / {String(currentInstance.chapters.length).padStart(2, "0")}</strong></div>
        <div className="progress"><i style={{ width: `${state.completed.length / currentInstance.chapters.length * 100}%` }} /></div>
      </header>
      <section className="memory">
        <div className="memory__number">{String(chapter.number).padStart(2, "0")}</div>
        <small>CHAPTER {String(chapter.number).padStart(2, "0")} · {chapter.eyebrow}</small>
        <h1>{chapter.title}</h1>
        <p>{chapter.body}</p>
        <button onClick={completeChapter}>{chapter.number === currentInstance.chapters.length ? "读完这封信" : "翻到下一页"} <span>→</span></button>
      </section>
      <nav aria-label="章节导航">
        {currentInstance.chapters.map((item) => (
          <button key={item.number} className={item.number === chapter.number ? "is-active" : ""} onClick={() => save({ ...state, activeChapter: item.number })} aria-label={`查看第${item.number}段`} aria-current={item.number === chapter.number ? "step" : undefined}>
            {state.completed.includes(item.number) ? "✓" : item.number}
          </button>
        ))}
      </nav>
    </main>
  );
}

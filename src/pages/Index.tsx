import { useState, useEffect, useRef, useCallback } from "react";
import { THREATS, QUIZ_QUESTIONS, RECOGNITION_DATA, FAKES_DATA, type ThreatData } from "@/data/threats";
import { MOVIES, MOVIE_TYPES, type MovieType } from "@/data/movies";

const NEWS_URL = "https://functions.poehali.dev/b4f72593-0bf2-4085-9a40-fc21957018b6";
const NEWS_CACHE_KEY = "antiterror_news_cache";
const NEWS_CACHE_TTL = 4 * 3600 * 1000;

// ── Types ──────────────────────────────────────────────────────────────────
type Section = "home" | "threat" | "recognize" | "fakes" | "quiz" | "news" | "movies";
type ThreatLevel = "low" | "medium" | "high" | "critical";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  critical: boolean;
  image?: string;
}

// ── Threat level config ────────────────────────────────────────────────────
const LEVEL_CFG: Record<ThreatLevel, { label: string; color: string; glow: string; pulse: string }> = {
  low:      { label: "Низкий",      color: "#00E87A", glow: "rgba(0,232,122,0.3)",   pulse: "2.5s" },
  medium:   { label: "Средний",     color: "#00F0FF", glow: "rgba(0,240,255,0.25)",  pulse: "2s"   },
  high:     { label: "Высокий",     color: "#FF8800", glow: "rgba(255,136,0,0.35)",  pulse: "1.5s" },
  critical: { label: "Критический", color: "#FF4D4D", glow: "rgba(255,77,77,0.45)", pulse: "1s"   },
};

function useThreatLevel() {
  const [level, setLevel] = useState<ThreatLevel>("medium");
  const [value, setValue] = useState(42);
  useEffect(() => {
    const tick = () => {
      const v = Math.floor(Math.random() * 100);
      setValue(v);
      if (v < 25) setLevel("low");
      else if (v < 55) setLevel("medium");
      else if (v < 80) setLevel("high");
      else setLevel("critical");
    };
    tick();
    const id = setInterval(tick, 8000 + Math.random() * 4000);
    return () => clearInterval(id);
  }, []);
  return { level, value };
}

// ── News hook ──────────────────────────────────────────────────────────────
function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const load = useCallback(async (force = false) => {
    if (!force) {
      try {
        const raw = localStorage.getItem(NEWS_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.ts < NEWS_CACHE_TTL) {
            setNews(cached.news);
            setIsDemo(cached.demo || false);
            setCachedAt(cached.ts);
            return;
          }
        }
      } catch {/* ignore */}
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(NEWS_URL);
      const data = await res.json();
      setNews(data.news || []);
      setIsDemo(data.demo || false);
      setCachedAt(Date.now());
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ news: data.news, demo: data.demo, ts: Date.now() }));
    } catch {
      setError("Нет соединения. Показаны кешированные данные.");
      try {
        const raw = localStorage.getItem(NEWS_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          setNews(cached.news || []);
          setIsDemo(cached.demo || false);
          setCachedAt(cached.ts);
        }
      } catch {/* ignore */}
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { news, loading, error, isDemo, cachedAt, reload: () => load(true) };
}

// ── Sphere visual ──────────────────────────────────────────────────────────
function ThreatSphere({ level }: { level: ThreatLevel }) {
  const cfg = LEVEL_CFG[level];
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[100, 110, 120].map((size, i) => (
        <div key={i} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          border: `1px solid ${cfg.color}`, opacity: 0.08 + i * 0.04,
          animation: `spin-slow ${14 + i * 6}s linear infinite ${i % 2 ? "reverse" : "normal"}`,
        }}/>
      ))}
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${cfg.color}cc, ${cfg.color}44 60%, transparent)`,
        boxShadow: `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glow}`,
        animation: `sphere-pulse ${cfg.pulse} ease-in-out infinite`,
        transition: "background 2s ease, box-shadow 2s ease",
        position: "relative", zIndex: 1,
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3 }} viewBox="0 0 64 64">
          <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke={cfg.color} strokeWidth="0.7"/>
          <ellipse cx="32" cy="32" rx="24" ry="17" fill="none" stroke={cfg.color} strokeWidth="0.7"/>
          <line x1="32" y1="8" x2="32" y2="56" stroke={cfg.color} strokeWidth="0.7"/>
          <line x1="9" y1="23" x2="55" y2="23" stroke={cfg.color} strokeWidth="0.7"/>
          <line x1="9" y1="41" x2="55" y2="41" stroke={cfg.color} strokeWidth="0.7"/>
        </svg>
      </div>
    </div>
  );
}

// ── Animated background ────────────────────────────────────────────────────
function BgCanvas({ level }: { level: ThreatLevel }) {
  const cfg = LEVEL_CFG[level];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.035 }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"/>
      </svg>
      <div style={{
        position: "absolute", top: "-20%", right: "-20%", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
        transition: "background 3s ease", animation: "float-y 10s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute", bottom: "-10%", left: "-15%", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(187,122,255,0.12) 0%, transparent 70%)",
        animation: "float-y 14s ease-in-out infinite reverse",
      }}/>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(187,122,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(187,122,255,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}/>
    </div>
  );
}

// ── Global index widget ────────────────────────────────────────────────────
function GlobalIndexWidget({ level, value }: { level: ThreatLevel; value: number }) {
  const cfg = LEVEL_CFG[level];
  return (
    <div className="glass" style={{ padding: "20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 8 }}>ГЛОБАЛЬНЫЙ ИНДЕКС ТРЕВОГИ</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, animation: `sphere-pulse ${cfg.pulse} ease-in-out infinite` }}/>
            <span style={{ fontWeight: 800, fontSize: 20, color: cfg.color, transition: "color 2s ease" }}>{cfg.label}</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`, transition: "width 2s ease" }}/>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--text2)", marginTop: 6 }}>Симуляция · демо-режим</p>
        </div>
        <ThreatSphere level={level} />
      </div>
    </div>
  );
}

// ── Emergency floating button ──────────────────────────────────────────────
function EmergencyFab() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const NUMS = [
    { num: "112", label: "Единый",   cls: "emerg-112" },
    { num: "101", label: "Пожарные", cls: "emerg-other" },
    { num: "102", label: "Полиция",  cls: "emerg-other" },
    { num: "103", label: "Скорая",   cls: "emerg-other" },
  ];

  if (confirmed) {
    return (
      <div className="emerg-panel" style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Звонок на {confirmed}</p>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>Звонок бесплатен даже без SIM-карты</p>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`tel:${confirmed}`} className="emerg-btn emerg-112" style={{ flex: 1, justifyContent: "center" }}>
            <span className="mono">Позвонить</span>
          </a>
          <button onClick={() => setConfirmed(null)} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border-c)", color: "var(--text2)", borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {open && (
        <div className="emerg-panel">
          {NUMS.map(n => (
            <button key={n.num} onClick={() => setConfirmed(n.num)} className={`emerg-btn ${n.cls}`} style={{ border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <span className="mono" style={{ fontSize: 17 }}>{n.num}</span>
              <span className="emerg-label">{n.label}</span>
            </button>
          ))}
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 12, cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}>
            Закрыть ✕
          </button>
        </div>
      )}
      <button className="fab-112" onClick={() => setOpen(o => !o)}>
        <span>112</span>
        <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>SOS</span>
      </button>
    </>
  );
}

// ── Welcome modal ──────────────────────────────────────────────────────────
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 0 0",
    }}>
      <div className="anim-slide-up" style={{
        background: "rgba(14,21,40,0.98)", border: "1px solid rgba(187,122,255,0.3)",
        borderRadius: "24px 24px 0 0", padding: "32px 24px 40px",
        maxWidth: 640, width: "100%", boxShadow: "0 -16px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 24px" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00B0FF, #0077CC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, position: "relative" }}>
            ✈️
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(0,240,255,0.5)", animation: "pulse-ring 2.5s ease-out infinite" }}/>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Привет! Я автор проекта</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--cyan)" }}>@vanya_sbg</div>
          </div>
        </div>
        <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          У меня есть Telegram-канал о безопасности — подпишись, чтобы не пропустить обновления приложения и новые лайфхаки.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="https://t.me/vanya_sbg" target="_blank" rel="noopener noreferrer" onClick={onClose}
            style={{ background: "linear-gradient(135deg, #00B0FF, #0077CC)", color: "#fff", borderRadius: 14, padding: "14px 24px", fontSize: 16, fontWeight: 700, textDecoration: "none", textAlign: "center", boxShadow: "0 4px 20px rgba(0,176,255,0.3)" }}>
            Перейти в канал @vanya_sbg
          </a>
          <button onClick={onClose} style={{ background: "var(--surface2)", border: "1px solid var(--border-c)", color: "var(--text2)", borderRadius: 14, padding: "14px 24px", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ThreatDetail ───────────────────────────────────────────────────────────
function ThreatDetail({ threat, onBack }: { threat: ThreatData; onBack: () => void }) {
  const phases = [
    { data: threat.before, cls: "phase-before", color: "#3a9ff5" },
    { data: threat.during, cls: "phase-during",  color: "#FF8800" },
    { data: threat.after,  cls: "phase-after",   color: "#00E87A" },
  ];
  return (
    <div className="anim-slide-up" style={{ padding: "16px" }}>
      <button className="btn-back" onClick={onBack} style={{ marginBottom: 20 }}>← Назад</button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <span style={{ fontSize: 44 }}>{threat.emoji}</span>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{threat.title}</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, margin: "2px 0 0" }}>{threat.shortDesc}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {phases.map(ph => (
          <div key={ph.cls} className={`glass ${ph.cls}`} style={{ padding: "18px" }}>
            <h3 className="mono" style={{ fontSize: 12, fontWeight: 700, color: ph.color, letterSpacing: "0.1em", marginBottom: 14 }}>{ph.data.title}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {ph.data.items.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15 }}>
                  <span className="mono" style={{ color: ph.color, fontWeight: 700, flexShrink: 0, fontSize: 13, minWidth: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ color: "var(--text)", lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="disclaimer" style={{ marginTop: 20 }}>
        ⚠️ <strong>Источники: МЧС России, НАК.</strong> В реальной ситуации следуйте указаниям спасателей.
      </div>
    </div>
  );
}

// ── Home section ───────────────────────────────────────────────────────────
function HomeSection({ onThreatSelect, level, value }: { onThreatSelect: (t: ThreatData) => void; level: ThreatLevel; value: number }) {
  return (
    <div style={{ padding: "16px" }}>
      <div className="anim-fade-up" style={{ marginBottom: 20 }}>
        <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>МЧС · НАК · САМОЗАЩИТА</p>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 8 }}>
          Анти<span style={{ color: "var(--violet)" }}>Террор</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 15 }}>Правила поведения при угрозе теракта.</p>
      </div>
      <div className="anim-fade-up d100"><GlobalIndexWidget level={level} value={value} /></div>
      <div className="disclaimer anim-fade-up d200" style={{ marginBottom: 20 }}>
        🛡️ <strong>Только профилактика.</strong> Никаких инструкций по изготовлению оружия. Следуйте спецслужбам.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {THREATS.map((t, i) => (
          <button key={t.id} className="threat-tile anim-fade-up" style={{ animationDelay: `${0.25 + i * 0.05}s`, opacity: 0 }} onClick={() => onThreatSelect(t)}>
            <div className="mono" style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, letterSpacing: "0.06em" }}>#{String(i + 1).padStart(3, "0")}</div>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{t.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.35 }}>{t.shortDesc}</div>
          </button>
        ))}
      </div>
      <div className="glass anim-fade-up d500" style={{ padding: "14px 16px", textAlign: "center" }}>
        <p className="mono" style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>📡 ОФЛАЙН-РЕЖИМ · КЕШИРОВАНО</p>
      </div>
    </div>
  );
}

// ── News section ───────────────────────────────────────────────────────────
function NewsSection() {
  const { news, loading, error, isDemo, cachedAt, reload } = useNews();

  const formatTime = (ts: string | number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 4 }}>НОВОСТИ</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            Лента <span style={{ color: "var(--red)" }}>угроз</span>
          </h2>
        </div>
        <button onClick={reload} disabled={loading}
          style={{ background: "var(--surface2)", border: "1px solid var(--border-c)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "var(--text2)", fontSize: 13, fontFamily: "inherit", marginTop: 4 }}>
          {loading ? "⟳" : "↻ Обновить"}
        </button>
      </div>

      {isDemo && (
        <div style={{ background: "rgba(187,122,255,0.08)", border: "1px solid rgba(187,122,255,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--violet)", marginBottom: 16 }}>
          📡 Демо-режим — добавь API-ключ World News API для реальных новостей
        </div>
      )}
      {error && (
        <div className="disclaimer" style={{ marginBottom: 16 }}>⚠️ {error}</div>
      )}
      {cachedAt && !isDemo && (
        <p className="mono" style={{ fontSize: 11, color: "var(--text2)", marginBottom: 16 }}>
          Обновлено: {formatTime(cachedAt)} · Кеш 4 ч
        </p>
      )}

      {loading && !news.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass" style={{ padding: "18px", opacity: 0.5 }}>
              <div style={{ height: 14, background: "var(--surface2)", borderRadius: 4, marginBottom: 8, width: "70%" }}/>
              <div style={{ height: 10, background: "var(--surface2)", borderRadius: 4, width: "90%" }}/>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {news.map((item, i) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className={`glass anim-fade-up`}
              style={{
                animationDelay: `${i * 0.06}s`, opacity: 0,
                padding: "16px", textDecoration: "none", display: "block",
                borderLeft: item.critical ? "3px solid var(--red)" : "3px solid transparent",
                boxShadow: item.critical ? "0 0 20px rgba(255,77,77,0.15)" : undefined,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {item.critical && (
                  <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
                    КРИТИЧНО
                  </span>
                )}
                <span className="mono" style={{ fontSize: 11, color: "var(--text2)" }}>{item.source}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--text2)", marginLeft: "auto" }}>{formatTime(item.publishedAt)}</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>{item.title}</p>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>{item.summary}</p>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--cyan)" }}>Читать подробнее ↗</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Movies section ─────────────────────────────────────────────────────────
function MoviesSection() {
  const [filter, setFilter] = useState<MovieType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = MOVIES.filter(m => {
    const matchType = filter === "all" || m.type === filter;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const typeLabel: Record<MovieType, string> = { film: "Фильм", series: "Сериал", doc: "Докфильм" };
  const typeColor: Record<MovieType, string> = { film: "var(--violet)", series: "var(--cyan)", doc: "var(--orange)" };

  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>МЕДИАТЕКА</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Антитеррор <span style={{ color: "var(--violet)" }}>в кадре</span>
      </h2>
      <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
        {MOVIES.length} фильмов, сериалов и документальных картин
      </p>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по названию…"
        style={{
          width: "100%", background: "var(--surface2)", border: "1px solid var(--border-c)",
          borderRadius: 12, padding: "12px 16px", fontSize: 15, color: "var(--text)",
          marginBottom: 12, outline: "none", fontFamily: "inherit",
        }}
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {MOVIE_TYPES.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid",
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
              borderColor: filter === t.key ? "var(--violet)" : "var(--border-c)",
              background: filter === t.key ? "rgba(187,122,255,0.15)" : "var(--surface)",
              color: filter === t.key ? "var(--violet)" : "var(--text2)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((m, i) => (
          <div key={m.id} className={`glass anim-fade-up`} style={{ padding: "16px", animationDelay: `${i * 0.04}s`, opacity: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {m.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{m.title}</span>
                  <span className="mono" style={{ fontSize: 11, color: typeColor[m.type], background: `${typeColor[m.type]}18`, padding: "2px 8px", borderRadius: 4, flexShrink: 0 }}>
                    {typeLabel[m.type]}
                  </span>
                </div>
                <p className="mono" style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
                  {m.year} · {m.country}{m.rating ? ` · ★ ${m.rating}` : ""}
                </p>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>{m.description}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  {m.kpUrl && (
                    <a href={m.kpUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "var(--violet)", textDecoration: "none", border: "1px solid rgba(187,122,255,0.3)", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
                      КиноПоиск ↗
                    </a>
                  )}
                  {m.trailerUrl && (
                    <a href={m.trailerUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "var(--red)", textDecoration: "none", border: "1px solid rgba(255,77,77,0.3)", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
                      ▶ Трейлер
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="glass" style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ color: "var(--text2)" }}>Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recognize / Fakes / Quiz — compact ────────────────────────────────────
function RecognizeSection() {
  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>РАСПОЗНАВАНИЕ</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Распознай <span style={{ color: "var(--violet)" }}>угрозу</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {RECOGNITION_DATA.map(item => (
          <div key={item.id} className="glass" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{item.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {item.signs.map((sign, i) => (
                <li key={i} className="tip-item">
                  <span style={{ color: "var(--violet)", fontWeight: 700, flexShrink: 0 }}>▸</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 14, background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#FF8080" }}>
              {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FakesSection() {
  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>МЕДИАГРАМОТНОСТЬ</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Фейки и <span style={{ color: "var(--cyan)" }}>дипфейки</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FAKES_DATA.map(block => (
          <div key={block.title} className="glass" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 26 }}>{block.icon}</span>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{block.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {block.tips.map((tip, i) => (
                <li key={i} className="tip-item">
                  <span style={{ color: "var(--cyan)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSection() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = QUIZ_QUESTIONS[current];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx); setAnswered(true);
    if (idx === q.correct) setScore(s => s + 1);
    if (navigator.vibrate) navigator.vibrate(idx === q.correct ? [10] : [30, 10, 30]);
  };
  const next = () => {
    if (current + 1 >= QUIZ_QUESTIONS.length) { setFinished(true); return; }
    setCurrent(c => c + 1); setSelected(null); setAnswered(false);
  };
  const restart = () => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); };

  if (finished) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const color = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--orange)" : "var(--red)";
    return (
      <div style={{ padding: "16px" }} className="anim-slide-up">
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Результат теста</h2>
        <div className="glass" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 80, fontWeight: 700, color, lineHeight: 1, marginBottom: 8 }}>{pct}%</div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{score}/{QUIZ_QUESTIONS.length}</p>
          <p style={{ color: "var(--text2)", marginBottom: 28 }}>{pct >= 80 ? "Отличная подготовка!" : pct >= 60 ? "Повторите правила." : "Изучите разделы."}</p>
          <button onClick={restart} style={{ background: "linear-gradient(135deg, var(--violet), #8844ff)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(187,122,255,0.4)" }}>
            Пройти снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
        Вопрос <span style={{ color: "var(--violet)" }}>{current + 1}</span>
        <span style={{ color: "var(--text2)", fontWeight: 400 }}> / {QUIZ_QUESTIONS.length}</span>
      </h2>
      <div className="prog-bar" style={{ marginBottom: 20 }}>
        <div className="prog-fill" style={{ width: `${(current / QUIZ_QUESTIONS.length) * 100}%` }}/>
      </div>
      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>{q.question}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let cls = "quiz-option";
          if (answered) { if (i === q.correct) cls += " correct"; else if (i === selected) cls += " wrong"; }
          return (
            <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}>
              <span className="mono" style={{ fontWeight: 600, marginRight: 10, color: "var(--text2)", fontSize: 13 }}>{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="anim-fade-up">
          <div className="glass" style={{ padding: "16px", marginBottom: 14, borderLeft: `3px solid ${selected === q.correct ? "var(--green)" : "var(--red)"}` }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected === q.correct ? "✅ Верно!" : "❌ Неверно"}</p>
            <p style={{ fontSize: 14, color: "var(--text2)", margin: 0 }}>{q.explanation}</p>
          </div>
          <button onClick={next} style={{ background: "linear-gradient(135deg, var(--violet), #8844ff)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(187,122,255,0.35)" }}>
            {current + 1 >= QUIZ_QUESTIONS.length ? "Завершить" : "Следующий →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "24px 16px 100px", borderTop: "1px solid var(--border-c)" }}>
      <a href="https://t.me/vanya_sbg" target="_blank" rel="noopener noreferrer" className="tg-widget" style={{ marginBottom: 20, display: "flex" }}>
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          <div className="tg-wave"/>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #00B0FF, #0077CC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, position: "relative", zIndex: 1 }}>✈️</div>
        </div>
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Создатель проекта</div>
          <div className="mono" style={{ fontSize: 13, color: "var(--cyan)" }}>@vanya_sbg</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Больше лайфхаков по безопасности</div>
        </div>
        <span style={{ fontSize: 18, color: "var(--cyan)", alignSelf: "center" }}>→</span>
      </a>
      <div className="glass" style={{ padding: "14px", textAlign: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>
          Материалы: <strong style={{ color: "var(--text)" }}>МЧС России · НАК</strong><br/>
          Только профилактика и самозащита
        </p>
      </div>
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", margin: 0 }}>
        Не пособие для террористов · Следуйте спецслужбам
      </p>
    </footer>
  );
}

// ── Bottom navigation ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "home"      as Section, icon: "🏠", label: "Главная"  },
  { key: "news"      as Section, icon: "📡", label: "Новости"  },
  { key: "movies"    as Section, icon: "🎬", label: "Кино"     },
  { key: "recognize" as Section, icon: "👁",  label: "Распознать" },
  { key: "quiz"      as Section, icon: "📝", label: "Тест"     },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [activeThreat, setActiveThreat] = useState<ThreatData | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const { level, value } = useThreatLevel();
  const bgRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!bgRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 18;
    bgRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("welcome-shown")) {
      const t = setTimeout(() => setShowWelcome(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    setShowTopBar(true);
    window.scrollTo(0, 0);
    const t = setTimeout(() => setShowTopBar(false), 1100);
    return () => clearTimeout(t);
  }, [section]);

  const closeWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("welcome-shown", "1");
  };

  const goSection = (s: Section) => { setSection(s); setActiveThreat(null); };
  const handleThreatSelect = (t: ThreatData) => { setActiveThreat(t); setSection("threat"); };

  const activeNav = section === "threat" ? "home" : (section === "fakes" ? "recognize" : section);

  const showFooter = ["home", "fakes"].includes(section);

  return (
    <div style={{ minHeight: "100vh", maxWidth: 640, margin: "0 auto", position: "relative" }}>
      <div ref={bgRef} style={{ transition: "transform 0.12s ease-out" }}>
        <BgCanvas level={level} />
      </div>
      {showTopBar && <div className="top-bar" />}

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,15,31,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-c)",
        padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--violet), #8844ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 0 16px rgba(187,122,255,0.4)" }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1 }}>Анти<span style={{ color: "var(--violet)" }}>Террор</span></div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1, marginTop: 2 }}>МЧС · НАК · v3.0</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="https://t.me/vanya_sbg" target="_blank" rel="noopener noreferrer"
            style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,176,255,0.15)", border: "1px solid rgba(0,176,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, textDecoration: "none" }}
            title="Telegram @vanya_sbg">
            ✈️
          </a>
          <div className="mono" style={{
            fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20,
            border: `1px solid ${LEVEL_CFG[level].color}`,
            color: LEVEL_CFG[level].color, background: `${LEVEL_CFG[level].color}15`,
            transition: "all 2s ease",
          }}>
            ● {LEVEL_CFG[level].label.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 1, paddingBottom: 16 }}>
        {section === "home"      && <HomeSection onThreatSelect={handleThreatSelect} level={level} value={value} />}
        {section === "threat"    && activeThreat && <ThreatDetail threat={activeThreat} onBack={() => goSection("home")} />}
        {section === "news"      && <NewsSection />}
        {section === "movies"    && <MoviesSection />}
        {section === "recognize" && <RecognizeSection />}
        {section === "fakes"     && <FakesSection />}
        {section === "quiz"      && <QuizSection />}
        {showFooter && <Footer />}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key} className={`nav-btn${activeNav === item.key ? " active" : ""}`} onClick={() => goSection(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* FAB 112 */}
      <EmergencyFab />

      {/* Welcome modal */}
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
    </div>
  );
}

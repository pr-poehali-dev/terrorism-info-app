import { useState, useEffect, useRef, useCallback } from "react";
import { THREATS, QUIZ_QUESTIONS, RECOGNITION_DATA, FAKES_DATA, type ThreatData } from "@/data/threats";

// ── Types ──────────────────────────────────────────────────────────────────
type Section = "home" | "threat" | "recognize" | "fakes" | "quiz";
type ThreatLevel = "low" | "medium" | "high" | "critical";

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
      if (v < 25)       setLevel("low");
      else if (v < 55)  setLevel("medium");
      else if (v < 80)  setLevel("high");
      else              setLevel("critical");
    };
    tick();
    const id = setInterval(tick, 8000 + Math.random() * 4000);
    return () => clearInterval(id);
  }, []);
  return { level, value };
}

// ── Sphere visual ──────────────────────────────────────────────────────────
function ThreatSphere({ level }: { level: ThreatLevel }) {
  const cfg = LEVEL_CFG[level];
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[100, 110, 120].map((size, i) => (
        <div key={i} style={{
          position: "absolute",
          width: size, height: size,
          borderRadius: "50%",
          border: `1px solid ${cfg.color}`,
          opacity: 0.08 + i * 0.04,
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
        position: "absolute", top: "-20%", right: "-20%",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
        transition: "background 3s ease",
        animation: "float-y 10s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute", bottom: "-10%", left: "-15%",
        width: 500, height: 500, borderRadius: "50%",
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
          <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 8 }}>
            ГЛОБАЛЬНЫЙ ИНДЕКС ТРЕВОГИ
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, animation: `sphere-pulse ${cfg.pulse} ease-in-out infinite` }}/>
            <span style={{ fontWeight: 800, fontSize: 20, color: cfg.color, transition: "color 2s ease" }}>{cfg.label}</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`, transition: "width 2s ease, background 2s ease" }}/>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--text2)", marginTop: 6 }}>Симуляция · демо-режим · GTD</p>
        </div>
        <ThreatSphere level={level} />
      </div>
    </div>
  );
}

// ── Emergency floating button ──────────────────────────────────────────────
function EmergencyFab() {
  const [open, setOpen] = useState(false);
  const NUMS = [
    { num: "112", label: "Единый",   cls: "emerg-112" },
    { num: "101", label: "Пожарные", cls: "emerg-other" },
    { num: "102", label: "Полиция",  cls: "emerg-other" },
    { num: "103", label: "Скорая",   cls: "emerg-other" },
  ];
  return (
    <>
      {open && (
        <div className="emerg-panel">
          {NUMS.map(n => (
            <a key={n.num} href={`tel:${n.num}`} className={`emerg-btn ${n.cls}`}>
              <span className="mono" style={{ fontSize: 17 }}>{n.num}</span>
              <span className="emerg-label">{n.label}</span>
            </a>
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

// ── Telegram toast ─────────────────────────────────────────────────────────
function TgToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="tg-toast">
      <span style={{ fontSize: 26, flexShrink: 0 }}>✈️</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Telegram-канал автора</p>
        <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.4, marginBottom: 10 }}>
          Больше лайфхаков — <span style={{ color: "var(--cyan)" }}>@vanya_sbg</span>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="https://t.me/vanya_sbg" target="_blank" rel="noopener noreferrer"
            style={{ background: "var(--cyan)", color: "#0A0F1F", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Открыть
          </a>
          <button onClick={onClose} style={{ background: "var(--surface2)", border: "1px solid var(--border-c)", color: "var(--text2)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Закрыть
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
            <h3 className="mono" style={{ fontSize: 12, fontWeight: 700, color: ph.color, letterSpacing: "0.1em", marginBottom: 14 }}>
              {ph.data.title}
            </h3>
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
        ⚠️ <strong>Источники: МЧС России, НАК.</strong> В реальной ситуации следуйте указаниям спасателей и силовых структур.
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

      <div className="anim-fade-up d100">
        <GlobalIndexWidget level={level} value={value} />
      </div>

      <div className="disclaimer anim-fade-up d200" style={{ marginBottom: 20 }}>
        🛡️ <strong>Только профилактика.</strong> Никаких инструкций по изготовлению оружия. Следуйте спецслужбам.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {THREATS.map((t, i) => (
          <button key={t.id} className={`threat-tile anim-fade-up`}
            style={{ animationDelay: `${0.25 + i * 0.05}s`, opacity: 0 }}
            onClick={() => onThreatSelect(t)}>
            <div className="mono" style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, letterSpacing: "0.06em" }}>
              #{String(i + 1).padStart(3, "0")}
            </div>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{t.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.35 }}>{t.shortDesc}</div>
          </button>
        ))}
      </div>

      <div className="glass anim-fade-up d500" style={{ padding: "14px 16px", textAlign: "center", marginBottom: 0 }}>
        <p className="mono" style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>📡 ОФЛАЙН-РЕЖИМ · КЕШИРОВАНО</p>
      </div>
    </div>
  );
}

// ── Recognize section ──────────────────────────────────────────────────────
function RecognizeSection() {
  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>РАСПОЗНАВАНИЕ</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Распознай <span style={{ color: "var(--violet)" }}>угрозу</span>
      </h2>
      <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Признаки и сигналы, которые важно замечать</p>
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

// ── Fakes section ──────────────────────────────────────────────────────────
function FakesSection() {
  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>МЕДИАГРАМОТНОСТЬ</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Фейки и <span style={{ color: "var(--cyan)" }}>дипфейки</span>
      </h2>
      <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Как не паниковать от ложных рассылок</p>
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
      <div className="glass" style={{ padding: "16px", marginTop: 16 }}>
        <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>📡 Официальные источники</p>
        {[{ name: "МЧС России", url: "https://mchs.gov.ru" }, { name: "НАК", url: "https://нак.рф" }].map(s => (
          <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", color: "var(--cyan)", fontSize: 14, marginBottom: 6, textDecoration: "underline" }}>
            {s.name} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Quiz section ───────────────────────────────────────────────────────────
function QuizSection() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = QUIZ_QUESTIONS[current];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
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
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{score} / {QUIZ_QUESTIONS.length} верных</p>
          <p style={{ color: "var(--text2)", marginBottom: 28 }}>
            {pct >= 80 ? "Отличная подготовка!" : pct >= 60 ? "Повторите правила." : "Изучите разделы подробнее."}
          </p>
          <button onClick={restart} style={{ background: "linear-gradient(135deg, var(--violet), #8844ff)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(187,122,255,0.4)" }}>
            Пройти снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <p className="mono" style={{ fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 6 }}>ТЕСТ</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>
        Вопрос <span style={{ color: "var(--violet)" }}>{current + 1}</span>
        <span style={{ color: "var(--text2)", fontWeight: 400 }}> / {QUIZ_QUESTIONS.length}</span>
      </h2>
      <div className="prog-bar" style={{ marginBottom: 20 }}>
        <div className="prog-fill" style={{ width: `${(current / QUIZ_QUESTIONS.length) * 100}%` }} />
      </div>
      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>{q.question}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let cls = "quiz-option";
          if (answered) {
            if (i === q.correct) cls += " correct";
            else if (i === selected) cls += " wrong";
          }
          return (
            <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}>
              <span className="mono" style={{ fontWeight: 600, marginRight: 10, color: "var(--text2)", fontSize: 13 }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
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
            {current + 1 >= QUIZ_QUESTIONS.length ? "Завершить тест" : "Следующий →"}
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
          <div className="tg-wave" />
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #00B0FF, #0077CC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, position: "relative", zIndex: 1 }}>
            ✈️
          </div>
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
  { key: "home"      as Section, icon: "🏠", label: "Главная"    },
  { key: "recognize" as Section, icon: "👁",  label: "Распознать" },
  { key: "fakes"     as Section, icon: "📰", label: "Фейки"      },
  { key: "quiz"      as Section, icon: "📝", label: "Тест"       },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [activeThreat, setActiveThreat] = useState<ThreatData | null>(null);
  const [showTgToast, setShowTgToast] = useState(false);
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
    if (!localStorage.getItem("tg-toast-shown")) {
      const t = setTimeout(() => setShowTgToast(true), 3500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    setShowTopBar(true);
    window.scrollTo(0, 0);
    const t = setTimeout(() => setShowTopBar(false), 1100);
    return () => clearTimeout(t);
  }, [section]);

  const closeTgToast = () => {
    setShowTgToast(false);
    localStorage.setItem("tg-toast-shown", "1");
  };

  const goSection = (s: Section) => { setSection(s); setActiveThreat(null); };
  const handleThreatSelect = (t: ThreatData) => { setActiveThreat(t); setSection("threat"); };

  const activeNav = section === "threat" ? "home" : section;

  return (
    <div style={{ minHeight: "100vh", maxWidth: 640, margin: "0 auto", position: "relative" }}>
      {/* Parallax background */}
      <div ref={bgRef} style={{ transition: "transform 0.12s ease-out" }}>
        <BgCanvas level={level} />
      </div>

      {/* Top loading bar */}
      {showTopBar && <div className="top-bar" />}

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,15,31,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-c)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--violet), #8844ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 0 16px rgba(187,122,255,0.4)" }}>
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Анти<span style={{ color: "var(--violet)" }}>Террор</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1, marginTop: 2 }}>МЧС · НАК · v2.0</div>
          </div>
        </div>
        <div className="mono" style={{
          fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20,
          border: `1px solid ${LEVEL_CFG[level].color}`,
          color: LEVEL_CFG[level].color,
          background: `${LEVEL_CFG[level].color}15`,
          letterSpacing: "0.05em",
          transition: "all 2s ease",
        }}>
          ● {LEVEL_CFG[level].label.toUpperCase()}
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1, paddingBottom: 16 }}>
        {section === "home"      && <HomeSection onThreatSelect={handleThreatSelect} level={level} value={value} />}
        {section === "threat"    && activeThreat && <ThreatDetail threat={activeThreat} onBack={() => goSection("home")} />}
        {section === "recognize" && <RecognizeSection />}
        {section === "fakes"     && <FakesSection />}
        {section === "quiz"      && <QuizSection />}
        {(section === "home" || !activeThreat) && section !== "threat" && <Footer />}
      </main>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key} className={`nav-btn${activeNav === item.key ? " active" : ""}`} onClick={() => goSection(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating 112 */}
      <EmergencyFab />

      {/* TG toast */}
      {showTgToast && <TgToast onClose={closeTgToast} />}
    </div>
  );
}

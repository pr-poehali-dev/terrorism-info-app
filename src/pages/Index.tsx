import { useState, useEffect } from "react";
import { THREATS, QUIZ_QUESTIONS, RECOGNITION_DATA, FAKES_DATA, type ThreatData } from "@/data/threats";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "home" | "threat" | "recognize" | "fakes" | "quiz";

// ─── Emergency numbers ───────────────────────────────────────────────────────
const EMERGENCY = [
  { num: "112", label: "Единый", cls: "btn-112" },
  { num: "101", label: "Пожарные", cls: "btn-101" },
  { num: "102", label: "Полиция", cls: "btn-102" },
  { num: "103", label: "Скорая", cls: "btn-103" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function EmergencyBar() {
  return (
    <div style={{ background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", padding: "10px 16px" }}>
      <p style={{ fontSize: 12, color: "var(--c-text2)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Экстренные службы
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {EMERGENCY.map(e => (
          <a key={e.num} href={`tel:${e.num}`} className={`btn-emergency ${e.cls}`}>
            <span>{e.num}</span>
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>{e.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ThreatDetail({ threat, onBack }: { threat: ThreatData; onBack: () => void }) {
  const phases = [
    { data: threat.before, cls: "phase-before", color: "#3a7fd5", label: "ДО" },
    { data: threat.during, cls: "phase-during", color: "#e07000", label: "ВО ВРЕМЯ" },
    { data: threat.after, cls: "phase-after", color: "#1a7a3c", label: "ПОСЛЕ" },
  ];

  return (
    <div className="anim-slide-up" style={{ padding: "16px" }}>
      <button className="btn-back" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Назад
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 40 }}>{threat.emoji}</span>
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>{threat.title}</h1>
          <p style={{ color: "var(--c-text2)", fontSize: 14, margin: 0 }}>{threat.shortDesc}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {phases.map((phase) => (
          <div key={phase.label} className={`card-flat ${phase.cls}`} style={{ padding: "16px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: phase.color, letterSpacing: "0.08em", marginBottom: 12 }}>
              {phase.data.title}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {phase.data.items.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15 }}>
                  <span style={{ color: phase.color, fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ color: "var(--c-text)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="disclaimer" style={{ marginTop: 20 }}>
        ⚠️ <strong>Помните:</strong> в реальной ситуации следуйте указаниям сотрудников МЧС, полиции и спасателей. Эта информация носит профилактический характер.
      </div>
    </div>
  );
}

function HomeSection({ onThreatSelect }: { onThreatSelect: (t: ThreatData) => void }) {
  return (
    <div style={{ padding: "16px" }}>
      <div className="anim-fade-up" style={{ marginBottom: 20 }}>
        <h1 className="section-title">Антитеррор. Знай и действуй</h1>
        <p style={{ color: "var(--c-text2)", fontSize: 15 }}>
          Источники: МЧС России, НАК. Выберите тип угрозы, чтобы узнать правила поведения.
        </p>
      </div>

      <div className="disclaimer anim-fade-up d100" style={{ marginBottom: 20 }}>
        🛡️ <strong>Дисклеймер:</strong> только профилактика и самозащита. Не пособие для террористов. Никаких инструкций по изготовлению оружия. Следуйте указаниям спецслужб.
      </div>

      <div className="anim-fade-up d200" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        {THREATS.map((t, i) => (
          <button
            key={t.id}
            className="threat-tile"
            onClick={() => onThreatSelect(t)}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{t.emoji}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--c-text)", marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.4 }}>{t.shortDesc}</div>
          </button>
        ))}
      </div>

      <div className="card-flat anim-fade-up d300" style={{ padding: "16px", background: "var(--c-surface2)" }}>
        <p style={{ fontSize: 13, color: "var(--c-text2)", textAlign: "center", margin: 0 }}>
          📱 Страница работает <strong>офлайн</strong> после первого открытия
        </p>
      </div>
    </div>
  );
}

function RecognizeSection() {
  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <h2 className="section-title" style={{ marginBottom: 4 }}>Распознай угрозу</h2>
      <p style={{ color: "var(--c-text2)", fontSize: 14, marginBottom: 20 }}>
        Признаки и сигналы, которые важно замечать
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {RECOGNITION_DATA.map((item) => (
          <div key={item.id} className="card-flat" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0, color: "var(--c-navy)" }}>{item.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {item.signs.map((sign, i) => (
                <li key={i} className="tip-item">
                  <span style={{ color: "var(--c-navy)", fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
            <div style={{
              marginTop: 14,
              background: "var(--c-red-bg)",
              border: "1px solid rgba(214,43,43,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--c-red)",
            }}>
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
      <h2 className="section-title" style={{ marginBottom: 4 }}>Фейки и дипфейки</h2>
      <p style={{ color: "var(--c-text2)", fontSize: 14, marginBottom: 20 }}>
        Как проверить информацию и не паниковать от ложных рассылок
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FAKES_DATA.map((block) => (
          <div key={block.title} className="card-flat" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>{block.icon}</span>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0, color: "var(--c-navy)" }}>{block.title}</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {block.tips.map((tip, i) => (
                <li key={i} className="tip-item">
                  <span style={{ color: "var(--c-navy)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card-flat" style={{ padding: "16px", marginTop: 16, background: "var(--c-surface2)" }}>
        <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>📡 Официальные источники</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { name: "МЧС России", link: "https://mchs.gov.ru" },
            { name: "НАК (Национальный антитеррористический комитет)", link: "https://нак.рф" },
          ].map(src => (
            <a key={src.name} href={src.link} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--c-navy)", fontSize: 14, textDecoration: "underline" }}>
              {src.name}
            </a>
          ))}
        </div>
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
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const color = pct >= 80 ? "var(--c-green)" : pct >= 60 ? "var(--c-orange)" : "var(--c-red)";
    const msg = pct >= 80 ? "Отлично! Вы хорошо подготовлены." : pct >= 60 ? "Неплохо! Повторите правила." : "Стоит изучить правила подробнее.";
    return (
      <div style={{ padding: "16px" }} className="anim-slide-up">
        <h2 className="section-title" style={{ marginBottom: 20 }}>Результат теста</h2>
        <div className="card-flat" style={{ padding: "32px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 900, color, marginBottom: 8 }}>{pct}%</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{score} из {QUIZ_QUESTIONS.length} правильных</p>
          <p style={{ color: "var(--c-text2)", marginBottom: 24 }}>{msg}</p>
          <button onClick={handleRestart}
            style={{
              background: "var(--c-navy)", color: "#fff",
              border: "none", borderRadius: 10, padding: "12px 28px",
              fontSize: 16, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>
            Пройти снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }} className="anim-slide-up">
      <h2 className="section-title" style={{ marginBottom: 4 }}>Тест по безопасности</h2>
      <p style={{ color: "var(--c-text2)", fontSize: 14, marginBottom: 16 }}>
        Вопрос {current + 1} из {QUIZ_QUESTIONS.length}
      </p>

      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${((current) / QUIZ_QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="card-flat" style={{ padding: "20px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{q.question}</p>
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
              <span style={{ fontWeight: 600, marginRight: 8, color: "var(--c-text2)" }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="anim-fade-up">
          <div className="card-flat" style={{
            padding: "14px 16px", marginBottom: 16,
            borderLeft: `4px solid ${selected === q.correct ? "var(--c-green)" : "var(--c-red)"}`,
            background: selected === q.correct ? "rgba(26,122,60,0.06)" : "rgba(214,43,43,0.06)",
          }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {selected === q.correct ? "✅ Верно!" : "❌ Неверно"}
            </p>
            <p style={{ fontSize: 14, color: "var(--c-text2)", margin: 0 }}>{q.explanation}</p>
          </div>
          <button onClick={handleNext}
            style={{
              background: "var(--c-navy)", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 24px", fontSize: 16,
              fontWeight: 600, cursor: "pointer", width: "100%",
              fontFamily: "inherit",
            }}>
            {current + 1 >= QUIZ_QUESTIONS.length ? "Завершить" : "Следующий вопрос →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [activeThreat, setActiveThreat] = useState<ThreatData | null>(null);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleThreatSelect = (t: ThreatData) => {
    setActiveThreat(t);
    setSection("threat");
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSection("home");
    setActiveThreat(null);
    window.scrollTo(0, 0);
  };

  const goSection = (s: Section) => {
    setSection(s);
    setActiveThreat(null);
    window.scrollTo(0, 0);
  };

  const NAV = [
    { key: "home" as Section, label: "🏠 Главная" },
    { key: "recognize" as Section, label: "👁 Распознать" },
    { key: "fakes" as Section, label: "📰 Фейки" },
    { key: "quiz" as Section, label: "📝 Тест" },
  ];

  return (
    <div style={{ minHeight: "100vh", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--c-navy)",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1 }}>АнтиТеррор</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1, marginTop: 2 }}>МЧС · НАК · Самозащита</div>
          </div>
        </div>
        <button
          onClick={() => setDark(d => !d)}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 8, padding: "6px 10px",
            cursor: "pointer", color: "#fff",
            fontSize: 18, lineHeight: 1,
          }}
          title="Переключить тему"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Emergency bar */}
      <EmergencyBar />

      {/* Navigation */}
      <div style={{
        padding: "10px 16px",
        overflowX: "auto",
        display: "flex",
        gap: 6,
        borderBottom: "1px solid var(--c-border)",
        background: "var(--c-surface)",
        flexShrink: 0,
      }}>
        {NAV.map(n => (
          <button
            key={n.key}
            className={`nav-tab${(section === n.key || (section === "threat" && n.key === "home")) ? " active" : ""}`}
            onClick={() => goSection(n.key)}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, paddingBottom: 32 }}>
        {section === "home" && <HomeSection onThreatSelect={handleThreatSelect} />}
        {section === "threat" && activeThreat && <ThreatDetail threat={activeThreat} onBack={handleBack} />}
        {section === "recognize" && <RecognizeSection />}
        {section === "fakes" && <FakesSection />}
        {section === "quiz" && <QuizSection />}
      </main>

      {/* Footer */}
      <footer style={{
        padding: "16px",
        textAlign: "center",
        fontSize: 12,
        color: "var(--c-text2)",
        borderTop: "1px solid var(--c-border)",
        background: "var(--c-surface2)",
      }}>
        <p style={{ margin: "0 0 4px" }}>Информация основана на материалах МЧС России и НАК</p>
        <p style={{ margin: 0 }}>Только профилактика · Не пособие для террористов · Следуйте спецслужбам</p>
      </footer>
    </div>
  );
}

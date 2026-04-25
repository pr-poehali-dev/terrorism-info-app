import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ── Types ──────────────────────────────────────────────────────────────────
interface Threat {
  id: number;
  title: string;
  source: string;
  level: "critical" | "high" | "medium" | "low";
  time: string;
  type: string;
}

interface Notification {
  id: number;
  title: string;
  body: string;
  level: "critical" | "warning" | "info";
  visible: boolean;
}

// ── Mock data ──────────────────────────────────────────────────────────────
const THREATS: Threat[] = [
  { id: 1, title: "SQL-инъекция на API /users", source: "185.220.101.47", level: "critical", time: "00:42", type: "Инъекция" },
  { id: 2, title: "Брутфорс SSH-сервера", source: "45.153.205.11", level: "high", time: "01:17", type: "Перебор" },
  { id: 3, title: "XSS-атака на портал", source: "91.108.4.18", level: "high", time: "02:03", type: "XSS" },
  { id: 4, title: "Сканирование портов", source: "178.128.44.92", level: "medium", time: "02:51", type: "Разведка" },
  { id: 5, title: "Подозрительный DNS-запрос", source: "internal:10.0.1.55", level: "medium", time: "03:14", type: "DNS" },
  { id: 6, title: "Устаревший TLS 1.0 на сервисе", source: "mail.corp.local", level: "low", time: "04:00", type: "Конфигурация" },
];

const NOTIFICATIONS: Omit<Notification, "visible">[] = [
  { id: 1, title: "⚠️ Критическая угроза", body: "SQL-инъекция заблокирована. Источник: 185.220.101.47", level: "critical" },
  { id: 2, title: "🔒 Рекомендация", body: "Обновите SSL-сертификат — истекает через 7 дней", level: "warning" },
  { id: 3, title: "✅ Обновление баз", body: "Базы угроз обновлены до версии 2026.04.25", level: "info" },
];

const WEEKLY_ATTACKS = [38, 65, 42, 91, 74, 55, 108];
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const COURSES = [
  { title: "Основы фишинга", progress: 100, icon: "Mail" },
  { title: "Парольная безопасность", progress: 78, icon: "Lock" },
  { title: "Социальная инженерия", progress: 45, icon: "Users" },
  { title: "Сетевая безопасность", progress: 20, icon: "Network" },
];

// ── Helper ─────────────────────────────────────────────────────────────────
const levelColor: Record<string, string> = {
  critical: "var(--red-alert)",
  high: "var(--orange-warn)",
  medium: "#f59e0b",
  low: "#6b7280",
};

const levelLabel: Record<string, string> = {
  critical: "КРИТ",
  high: "ВЫСОК",
  medium: "СРЕДН",
  low: "НИЗК",
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ value, label, icon, color, suffix = "", delay = 0 }: {
  value: number; label: string; icon: string; color: string; suffix?: string; delay?: number;  
}) {
  const count = useCountUp(value, 1400);
  return (
    <div
      className="card-cyber p-5 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon name={icon} size={18} style={{ color }} />
        </div>
        <span className="text-[10px] font-medium tracking-widest uppercase mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          LIVE
          <span className="inline-block w-1.5 h-1.5 rounded-full ml-1 mb-0.5 animate-threat" style={{ background: color, display: "inline-block", verticalAlign: "middle" }}></span>
        </span>
      </div>
      <div className="mono text-3xl font-semibold" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
    </div>
  );
}

function WeeklyChart() {
  const max = Math.max(...WEEKLY_ATTACKS);
  return (
    <div className="card-cyber p-5 animate-fade-in-up delay-200" style={{ opacity: 0, animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm tracking-wide uppercase mono" style={{ color: "var(--cyan)" }}>Атаки за неделю</h3>
        <span className="mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Апрель 2026</span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {WEEKLY_ATTACKS.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="mono text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{val}</span>
            <div className="w-full rounded-sm relative" style={{ height: "80px", background: "hsl(var(--muted))" }}>
              <div
                className="bar-fill absolute bottom-0 left-0 right-0 rounded-sm"
                style={{
                  height: `${(val / max) * 100}%`,
                  background: i === 6
                    ? `linear-gradient(to top, var(--cyan), rgba(0,255,231,0.4))`
                    : `linear-gradient(to top, rgba(0,255,231,0.5), rgba(0,255,231,0.15))`,
                  boxShadow: i === 6 ? "0 0 12px var(--cyan-glow)" : "none",
                }}
              />
            </div>
            <span className="mono text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart() {
  return (
    <div className="card-cyber p-5 flex flex-col items-center animate-fade-in-up delay-300" style={{ opacity: 0, animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="font-semibold text-sm tracking-wide uppercase mono" style={{ color: "var(--cyan)" }}>Радар угроз</h3>
        <span className="mono text-xs animate-blink" style={{ color: "var(--red-alert)" }}>● СКАНИРОВАНИЕ</span>
      </div>
      <div className="relative w-36 h-36">
        {[1, 0.75, 0.5, 0.25].map((r, i) => (
          <div key={i} className="absolute rounded-full border"
            style={{
              width: `${r * 100}%`, height: `${r * 100}%`,
              top: `${(1 - r) * 50}%`, left: `${(1 - r) * 50}%`,
              borderColor: `rgba(0,255,231,${0.1 + i * 0.05})`,
            }}
          />
        ))}
        {/* Sweep */}
        <div className="absolute inset-0 animate-radar" style={{ transformOrigin: "50% 50%" }}>
          <div className="absolute"
            style={{
              width: "50%", height: "1px",
              top: "50%", left: "50%",
              background: "linear-gradient(90deg, var(--cyan), transparent)",
              transformOrigin: "0 50%",
            }}
          />
        </div>
        {/* Blips */}
        {[
          { top: "22%", left: "58%", color: "var(--red-alert)" },
          { top: "60%", left: "30%", color: "var(--orange-warn)" },
          { top: "40%", left: "72%", color: "var(--orange-warn)" },
          { top: "72%", left: "62%", color: "#f59e0b" },
        ].map((b, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full animate-threat"
            style={{ top: b.top, left: b.left, background: b.color, boxShadow: `0 0 6px ${b.color}`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }} />
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        {[["КРИТ", "var(--red-alert)"], ["ВЫСОК", "var(--orange-warn)"], ["СРЕДН", "#f59e0b"]].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c as string }} />
            <span className="mono text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreatRow({ threat, index }: { threat: Threat; index: number }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, opacity: 0, animationFillMode: "forwards", borderLeft: `2px solid ${levelColor[threat.level]}` }}
    >
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-threat"
        style={{ background: levelColor[threat.level], boxShadow: `0 0 6px ${levelColor[threat.level]}`, animationDelay: `${index * 0.2}s` }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{threat.title}</div>
        <div className="mono text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{threat.source}</div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${levelColor[threat.level]}20`, color: levelColor[threat.level] }}>
          {levelLabel[threat.level]}
        </span>
        <span className="mono text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{threat.time}</span>
      </div>
    </div>
  );
}

function CourseRow({ course, index }: { course: typeof COURSES[0]; index: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(course.progress), 400 + index * 100);
    return () => clearTimeout(t);
  }, [course.progress, index]);

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon name={course.icon} size={14} style={{ color: "var(--cyan)" }} />
          <span className="text-sm">{course.title}</span>
        </div>
        <span className="mono text-xs font-semibold" style={{ color: course.progress === 100 ? "var(--green-ok)" : "var(--cyan)" }}>
          {course.progress === 100 ? "✓" : `${course.progress}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: course.progress === 100
              ? `linear-gradient(90deg, var(--green-ok), #6ee7b7)`
              : `linear-gradient(90deg, var(--cyan), rgba(0,255,231,0.5))`,
            boxShadow: course.progress === 100 ? "0 0 8px rgba(52,211,153,0.4)" : "0 0 8px var(--cyan-dim)",
          }}
        />
      </div>
    </div>
  );
}

function NotificationToast({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const colors: Record<string, string> = { critical: "var(--red-alert)", warning: "var(--orange-warn)", info: "var(--cyan)" };
  const color = colors[notif.level];

  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="animate-slide-in flex items-start gap-3 p-4 rounded-xl shadow-2xl mb-3"
      style={{
        background: "hsl(var(--card))",
        border: `1px solid ${color}50`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 16px ${color}20`,
        maxWidth: 320,
        minWidth: 280,
      }}
    >
      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 animate-threat" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-0.5">{notif.title}</div>
        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{notif.body}</div>
      </div>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Index() {
  const [activeTab, setActiveTab] = useState<"stats" | "threats" | "learning" | "protection">("stats");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [time, setTime] = useState(new Date());
  const notifIndex = useRef(0);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Push notifications
  useEffect(() => {
    const schedule = [1200, 5000, 10000];
    const timers = schedule.map((delay, i) =>
      setTimeout(() => {
        const n = NOTIFICATIONS[i % NOTIFICATIONS.length];
        const newNotif: Notification = { ...n, id: Date.now() + i, visible: true };
        setNotifications(prev => [...prev, newNotif]);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const removeNotif = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  const TABS = [
    { key: "stats", label: "Статистика", icon: "BarChart3" },
    { key: "threats", label: "Угрозы", icon: "ShieldAlert" },
    { key: "learning", label: "Обучение", icon: "GraduationCap" },
    { key: "protection", label: "Защита", icon: "Shield" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(8,12,22,0.92)", backdropFilter: "blur(16px)", borderColor: "hsl(var(--border))" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: "var(--cyan-dim)", border: "1px solid var(--cyan)" }}>
              <Icon name="Shield" size={16} style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <span className="font-bold tracking-wider text-sm" style={{ color: "var(--cyan)" }}>CYBER</span>
              <span className="font-bold tracking-wider text-sm text-white">SHIELD</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-threat" style={{ background: "var(--green-ok)" }} />
              <span>Защита активна</span>
            </div>
            <div>{time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                style={{ border: "1px solid hsl(var(--border))" }}>
                <Icon name="Bell" size={16} style={{ color: "var(--orange-warn)" }} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-threat"
                style={{ background: "var(--red-alert)" }} />
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--cyan-dim)", border: "1px solid var(--cyan)" }}>
              <Icon name="User" size={16} style={{ color: "var(--cyan)" }} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-full sm:w-auto" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === tab.key ? "var(--cyan-dim)" : "transparent",
                color: activeTab === tab.key ? "var(--cyan)" : "hsl(var(--muted-foreground))",
                border: activeTab === tab.key ? "1px solid rgba(0,255,231,0.3)" : "1px solid transparent",
                boxShadow: activeTab === tab.key ? "0 0 12px var(--cyan-dim)" : "none",
              }}
            >
              <Icon name={tab.icon} size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── СТАТИСТИКА ── */}
        {activeTab === "stats" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard value={1284} label="Заблокировано угроз" icon="ShieldCheck" color="var(--cyan)" suffix="" delay={0} />
              <StatCard value={6} label="Активных инцидентов" icon="AlertTriangle" color="var(--red-alert)" suffix="" delay={100} />
              <StatCard value={247} label="Защищённых устройств" icon="Monitor" color="var(--green-ok)" suffix="" delay={200} />
              <StatCard value={99} label="Уровень защиты" icon="Percent" color="var(--orange-warn)" suffix="%" delay={300} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <WeeklyChart />
              </div>
              <RadarChart />
            </div>

            {/* Threat type breakdown */}
            <div className="card-cyber p-5 animate-fade-in-up delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
              <h3 className="font-semibold text-sm tracking-wide uppercase mono mb-4" style={{ color: "var(--cyan)" }}>Типы угроз</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Вредонос", val: 34, color: "var(--red-alert)" },
                  { label: "Фишинг", val: 28, color: "var(--orange-warn)" },
                  { label: "Инъекции", val: 22, color: "#f59e0b" },
                  { label: "Прочее", val: 16, color: "hsl(var(--muted-foreground))" },
                ].map((item) => {
                  const circumference = 2 * Math.PI * 28;
                  return (
                    <div key={item.label} className="flex flex-col items-center gap-2 p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="28" fill="none" strokeWidth="5" stroke="hsl(var(--border))" />
                        <circle
                          cx="36" cy="36" r="28" fill="none" strokeWidth="5"
                          stroke={item.color}
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - item.val / 100)}
                          strokeLinecap="round"
                          className="progress-ring"
                          style={{ filter: `drop-shadow(0 0 4px ${item.color})` }}
                        />
                        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="600" fill={item.color} fontFamily="IBM Plex Mono">{item.val}%</text>
                      </svg>
                      <span className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── УГРОЗЫ ── */}
        {activeTab === "threats" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: "hsl(var(--foreground))" }}>Активные угрозы</h2>
              <div className="flex items-center gap-2 mono text-xs animate-blink" style={{ color: "var(--red-alert)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--red-alert)" }} />
                {THREATS.filter(t => t.level === "critical").length} критических
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {(["critical", "high", "medium", "low"] as const).map(lvl => (
                <div key={lvl} className="card-cyber p-3 text-center">
                  <div className="mono text-2xl font-bold" style={{ color: levelColor[lvl] }}>
                    {THREATS.filter(t => t.level === lvl).length}
                  </div>
                  <div className="mono text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{levelLabel[lvl]}</div>
                </div>
              ))}
            </div>

            <div className="card-cyber p-4 space-y-1">
              {THREATS.map((t, i) => <ThreatRow key={t.id} threat={t} index={i} />)}
            </div>

            <div className="card-cyber p-4">
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--cyan)" }}>Рекомендуемые действия</h3>
              <div className="space-y-2">
                {[
                  "Заблокировать IP 185.220.101.47 на уровне файрвола",
                  "Сменить пароли SSH-доступа и включить 2FA",
                  "Обновить WAF-правила для защиты от XSS",
                ].map((action, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mono text-[10px] font-bold"
                      style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,255,231,0.3)" }}>
                      {i + 1}
                    </div>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ОБУЧЕНИЕ ── */}
        {activeTab === "learning" && (
          <div className="space-y-4">
            <div className="card-cyber p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Ваш прогресс обучения</h2>
                  <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>3 из 4 курсов в прогрессе</p>
                </div>
                <div className="text-right">
                  <div className="mono text-3xl font-bold" style={{ color: "var(--cyan)" }}>61%</div>
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>общий прогресс</div>
                </div>
              </div>
              <div className="space-y-4">
                {COURSES.map((c, i) => <CourseRow key={c.title} course={c} index={i} />)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "Award", label: "Пройдено уроков", val: "24", color: "var(--cyan)" },
                { icon: "Clock", label: "Часов обучения", val: "8.5", color: "var(--orange-warn)" },
                { icon: "Trophy", label: "Сертификаты", val: "1", color: "var(--green-ok)" },
              ].map(item => (
                <div key={item.label} className="card-cyber p-4 flex items-center gap-4 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                    <Icon name={item.icon} size={22} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="mono text-2xl font-bold" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-cyber p-5">
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--cyan)" }}>Следующий урок</h3>
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid rgba(0,255,231,0.15)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--cyan-dim)", border: "1px solid rgba(0,255,231,0.3)" }}>
                  <Icon name="Play" size={20} style={{ color: "var(--cyan)" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Распознавание фишинговых писем</div>
                  <div className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Модуль 3 · 15 минут</div>
                </div>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--cyan)", color: "hsl(var(--background))" }}>
                  Начать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ЗАЩИТА ── */}
        {activeTab === "protection" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Файрвол", status: "Активен", icon: "Flame", color: "var(--green-ok)", desc: "Блокировано 1 284 соединения" },
                { title: "Антивирус", status: "Активен", icon: "Bug", color: "var(--green-ok)", desc: "Последнее сканирование: сегодня 06:00" },
                { title: "VPN-туннель", status: "Отключён", icon: "Globe", color: "var(--red-alert)", desc: "Рекомендуем включить для публичных сетей" },
                { title: "2FA", status: "Включена", icon: "Smartphone", color: "var(--green-ok)", desc: "Для 247 аккаунтов" },
              ].map((item, i) => (
                <div key={item.title} className="card-cyber p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms`, opacity: 0, animationFillMode: "forwards" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                        <Icon name={item.icon} size={18} style={{ color: item.color }} />
                      </div>
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</div>
                      </div>
                    </div>
                    <span className="mono text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ background: `${item.color}20`, color: item.color }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-cyber p-5">
              <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--cyan)" }}>Статус систем защиты</h3>
              <div className="space-y-3">
                {[
                  { name: "Веб-приложения", score: 94 },
                  { name: "Электронная почта", score: 87 },
                  { name: "Сетевая инфраструктура", score: 72 },
                  { name: "Конечные устройства", score: 91 },
                ].map((sys, i) => (
                  <div key={sys.name} className="animate-fade-in-up"
                    style={{ animationDelay: `${400 + i * 80}ms`, opacity: 0, animationFillMode: "forwards" }}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{sys.name}</span>
                      <span className="mono font-semibold" style={{ color: sys.score >= 90 ? "var(--green-ok)" : sys.score >= 70 ? "var(--orange-warn)" : "var(--red-alert)" }}>
                        {sys.score}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${sys.score}%`,
                          background: sys.score >= 90
                            ? `linear-gradient(90deg, var(--green-ok), #6ee7b7)`
                            : `linear-gradient(90deg, var(--orange-warn), #fcd34d)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Push notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse">
        {notifications.map(n => (
          <NotificationToast key={n.id} notif={n} onClose={() => removeNotif(n.id)} />
        ))}
      </div>
    </div>
  );
}
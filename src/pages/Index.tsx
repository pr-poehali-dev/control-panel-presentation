import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────
type ModuleKey = "dashboard" | "devices" | "energy" | "history" | "config" | "system";
type SubScreen = string;

// ─── Navigation structure ─────────────────────────────────
const NAV = [
  {
    key: "dashboard" as ModuleKey,
    label: "Главная страница",
    icon: "LayoutDashboard",
    screens: [],
  },
  {
    key: "devices" as ModuleKey,
    label: "Управление устройствами",
    icon: "Cpu",
    screens: [
      { key: "tracking", label: "Отслеживание устройств" },
      { key: "groups", label: "Настройка группы" },
      { key: "smartview", label: "Smart View" },
      { key: "schedule", label: "Расписание" },
      { key: "advanced", label: "Доп. настройки" },
    ],
  },
  {
    key: "history" as ModuleKey,
    label: "История",
    icon: "History",
    screens: [
      { key: "user-history", label: "История пользователя" },
      { key: "state-history", label: "Запись изменения состояния" },
      { key: "error-history", label: "История ошибок" },
      { key: "periodic", label: "Периодическая запись" },
      { key: "uptime", label: "Статистика работы" },
    ],
  },
  {
    key: "energy" as ModuleKey,
    label: "Управление энергопотреблением",
    icon: "Zap",
    screens: [
      { key: "distribution", label: "Распределение электроэнергии" },
      { key: "consumption", label: "Электропотребление" },
    ],
  },
  {
    key: "config" as ModuleKey,
    label: "Конфигурация системы",
    icon: "Settings2",
    screens: [
      { key: "network", label: "Сетевые настройки" },
      { key: "2d-map", label: "Настройка 2D" },
      { key: "sys-settings", label: "Настройки системы" },
      { key: "ida", label: "Алгоритм IDA" },
      { key: "hotkeys", label: "Горячие клавиши" },
    ],
  },
  {
    key: "system" as ModuleKey,
    label: "Управление учётными записями",
    icon: "Users",
    screens: [
      { key: "users", label: "Управление пользователями" },
      { key: "support", label: "Служба поддержки" },
      { key: "update", label: "Обновление ПО" },
    ],
  },
];

// ─── Types ─────────────────────────────────────────────────
type OutdoorUnit = { id: string; name: string; port: string; status: string; temp: number; mode: string };
type IndoorUnit = { id: string; name: string; group: string; status: string; setTemp: number; curTemp: number; mode: string };

// ─── Initial data ─────────────────────────────────────────
const INIT_OUTDOOR: OutdoorUnit[] = [
  { id: "OU-01", name: "Нар. блок 1", port: "RS485-1", status: "on", temp: 38, mode: "Охлаждение" },
  { id: "OU-02", name: "Нар. блок 2", port: "RS485-1", status: "on", temp: 37, mode: "Охлаждение" },
  { id: "OU-03", name: "Нар. блок 3", port: "RS485-2", status: "warn", temp: 42, mode: "Охлаждение" },
  { id: "OU-04", name: "Нар. блок 4", port: "RS485-2", status: "on", temp: 36, mode: "Охлаждение" },
  { id: "OU-05", name: "Нар. блок 5", port: "RS485-3", status: "off", temp: 25, mode: "Стоп" },
  { id: "OU-06", name: "Нар. блок 6", port: "RS485-3", status: "error", temp: 0, mode: "Ошибка" },
];

const INIT_INDOOR: IndoorUnit[] = [
  { id: "IU-001", name: "Офис 101", group: "1 этаж", status: "on", setTemp: 22, curTemp: 23, mode: "Охл." },
  { id: "IU-002", name: "Офис 102", group: "1 этаж", status: "on", setTemp: 24, curTemp: 24, mode: "Охл." },
  { id: "IU-003", name: "Переговорная А", group: "1 этаж", status: "off", setTemp: 22, curTemp: 26, mode: "Стоп" },
  { id: "IU-004", name: "Серверная", group: "1 этаж", status: "on", setTemp: 18, curTemp: 19, mode: "Охл." },
  { id: "IU-005", name: "Офис 201", group: "2 этаж", status: "on", setTemp: 23, curTemp: 23, mode: "Охл." },
  { id: "IU-006", name: "Офис 202", group: "2 этаж", status: "warn", setTemp: 22, curTemp: 28, mode: "Ошибка" },
  { id: "IU-007", name: "Конференц-зал", group: "2 этаж", status: "off", setTemp: 22, curTemp: 25, mode: "Стоп" },
  { id: "IU-008", name: "Ресепшн", group: "2 этаж", status: "on", setTemp: 21, curTemp: 22, mode: "Охл." },
];

const ERRORS = [
  { id: "E001", time: "09:42", unit: "OU-06", msg: "Ошибка датчика температуры", level: "error" },
  { id: "W001", time: "10:15", unit: "OU-03", msg: "Высокая температура нагнетания", level: "warn" },
  { id: "W002", time: "11:30", unit: "IU-006", msg: "Превышение уставки температуры", level: "warn" },
];

const SCHEDULE = [
  { id: "S1", name: "Рабочие часы", time: "08:00", days: "Пн–Пт", action: "Включить всё", status: "active" },
  { id: "S2", name: "Обед", time: "13:00", days: "Пн–Пт", action: "Режим вентиляции", status: "active" },
  { id: "S3", name: "Конец дня", time: "19:00", days: "Пн–Пт", action: "Выключить всё", status: "active" },
  { id: "S4", name: "Выходные", time: "10:00", days: "Сб–Вс", action: "Выборочно вкл.", status: "paused" },
];

// ─── Sub-components ───────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    on: { label: "Работает", cls: "bg-green-500/10 text-green-400", dot: "bg-green-400" },
    off: { label: "Выкл.", cls: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-500" },
    warn: { label: "Предупр.", cls: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400 animate-pulse-slow" },
    error: { label: "Ошибка", cls: "bg-red-500/10 text-red-400", dot: "bg-red-400 animate-pulse-slow" },
    active: { label: "Активно", cls: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
    paused: { label: "Пауза", cls: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-500" },
  };
  const s = map[status] || map.off;
  return (
    <span className={`badge-status flex items-center gap-1.5 w-fit ${s.cls}`}>
      <span className={`status-dot ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Dashboard ────────────────────────────────────────────
function Dashboard({ outdoor, indoor }: { outdoor: OutdoorUnit[]; indoor: IndoorUnit[] }) {
  const onlineOU = outdoor.filter(u => u.status === "on").length;
  const onlineIU = indoor.filter(u => u.status === "on").length;
  const errCount = ERRORS.filter(e => e.level === "error").length;
  const warnCount = ERRORS.filter(e => e.level === "warn").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Порты RS485", value: "6", sub: "Активных: 5", icon: "Network", color: "text-blue" },
          { label: "Наружных блоков", value: `${onlineOU}/192`, sub: "В работе", icon: "Wind", color: "text-cyan" },
          { label: "Внутренних блоков", value: `${onlineIU}/384`, sub: "В работе", icon: "Thermometer", color: "text-green" },
          { label: "Ошибки / Предупр.", value: `${errCount} / ${warnCount}`, sub: "Требуют внимания", icon: "AlertTriangle", color: errCount > 0 ? "text-red" : "text-amber" },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-secondary-color uppercase tracking-wider leading-tight">{m.label}</span>
              <Icon name={m.icon} size={15} className={m.color} fallback="Activity" />
            </div>
            <div className={`text-2xl font-semibold font-mono ${m.color}`}>{m.value}</div>
            <div className="text-xs text-dim mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-1 rounded-lg panel-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="AlertCircle" size={14} className="text-red" fallback="AlertCircle" />
            <span className="text-sm font-medium">Ошибки и предупреждения</span>
          </div>
          {ERRORS.map(e => (
            <div key={e.id} className="data-row">
              <div className="flex items-start gap-2 min-w-0">
                <Icon name={e.level === "error" ? "XCircle" : "AlertTriangle"} size={13}
                  className={`${e.level === "error" ? "text-red" : "text-amber"} mt-0.5 shrink-0`} fallback="AlertCircle" />
                <div className="min-w-0">
                  <div className="text-sm truncate">{e.msg}</div>
                  <div className="text-xs text-dim">{e.unit} · {e.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 surface-1 rounded-lg panel-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="CalendarClock" size={14} className="text-blue" fallback="Calendar" />
            <span className="text-sm font-medium">Расписание на сегодня</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-dim uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2 font-medium">Событие</th>
                <th className="text-left pb-2 font-medium">Время</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Дни</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Действие</th>
                <th className="text-left pb-2 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                  <td className="py-2.5 font-medium">{s.name}</td>
                  <td className="py-2.5 font-mono text-blue">{s.time}</td>
                  <td className="py-2.5 text-secondary-color hidden md:table-cell">{s.days}</td>
                  <td className="py-2.5 text-secondary-color hidden md:table-cell">{s.action}</td>
                  <td className="py-2.5"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="surface-1 rounded-lg panel-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Zap" size={14} className="text-cyan" fallback="Zap" />
            <span className="text-sm font-medium">Потребление электроэнергии за сегодня</span>
          </div>
          <span className="font-mono text-lg text-cyan">148.6 кВт·ч</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {["RS485-1","RS485-2","RS485-3","RS485-4","RS485-5","RS485-6"].map((port, i) => {
            const vals = [32, 28, 41, 19, 24, 4.6];
            const pct = Math.round((vals[i] / 50) * 100);
            return (
              <div key={port}>
                <div className="text-xs text-dim mb-1.5 text-center truncate">{port}</div>
                <div className="h-20 surface-3 rounded-sm overflow-hidden flex flex-col-reverse">
                  <div className="transition-all duration-700 rounded-sm"
                    style={{ height: `${pct}%`, background: `hsl(${210 - i * 8} 90% ${55 - i}%)` }} />
                </div>
                <div className="text-xs text-center font-mono mt-1 text-secondary-color">{vals[i]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Temp Editor ─────────────────────────────────────────
function TempEditor({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);

  if (disabled) return <span className="font-mono text-sm text-dim">{value}°C</span>;

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Нажмите чтобы изменить уставку"
        className="font-mono text-sm text-blue hover:text-cyan border-b border-dashed border-blue-500/40 hover:border-cyan-400 transition-colors">
        {value}°C
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 animate-fade-in">
      <button
        onClick={() => { if (value > 16) onChange(value - 1); }}
        className="w-6 h-6 rounded surface-3 text-secondary-color hover:text-primary-color flex items-center justify-center text-sm leading-none transition-colors">
        −
      </button>
      <span className="font-mono text-sm text-blue w-10 text-center">{value}°C</span>
      <button
        onClick={() => { if (value < 30) onChange(value + 1); }}
        className="w-6 h-6 rounded surface-3 text-secondary-color hover:text-primary-color flex items-center justify-center text-sm leading-none transition-colors">
        +
      </button>
      <button
        onClick={() => setEditing(false)}
        className="ml-1 w-5 h-5 rounded text-dim hover:text-green flex items-center justify-center transition-colors">
        <Icon name="Check" size={11} fallback="Check" />
      </button>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────
function ToggleSwitch({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={on ? "Выключить" : "Включить"}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${on ? "bg-blue-600" : "bg-surface-3 border border-border"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-200
        ${on ? "left-5 bg-white" : "left-0.5 bg-zinc-400"}`} />
    </button>
  );
}

// ─── Device Tracking ──────────────────────────────────────
function DeviceTracking({
  outdoor, indoor,
  toggleOutdoor, toggleIndoor,
  allOutdoorOn, allIndoorOn,
  setAllOutdoor, setAllIndoor,
  setIndoorTemp,
}: {
  outdoor: OutdoorUnit[];
  indoor: IndoorUnit[];
  toggleOutdoor: (id: string) => void;
  toggleIndoor: (id: string) => void;
  allOutdoorOn: boolean;
  allIndoorOn: boolean;
  setAllOutdoor: (on: boolean) => void;
  setAllIndoor: (on: boolean) => void;
  setIndoorTemp: (id: string, temp: number) => void;
}) {
  const [tab, setTab] = useState<"outdoor" | "indoor">("outdoor");
  const ouOnline = outdoor.filter(u => u.status === "on").length;
  const inOnline = indoor.filter(u => u.status === "on").length;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Tab bar + bulk controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 surface-2 rounded-lg p-1">
          {(["outdoor", "indoor"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t ? "surface-3 text-primary-color font-medium" : "text-secondary-color hover:text-primary-color"}`}>
              {t === "outdoor" ? `Наружные (${ouOnline}/${outdoor.length})` : `Внутренние (${inOnline}/${indoor.length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => tab === "outdoor" ? setAllOutdoor(true) : setAllIndoor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all">
            <Icon name="PowerCircle" size={13} fallback="Power" /> Включить все
          </button>
          <button
            onClick={() => tab === "outdoor" ? setAllOutdoor(false) : setAllIndoor(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/25 transition-all">
            <Icon name="PowerOff" size={13} fallback="Power" /> Выключить все
          </button>
        </div>
      </div>

      <div className="surface-1 rounded-lg panel-border overflow-hidden">
        {tab === "outdoor" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
                {["ID","Название","Порт","Режим","Т° нагн.","Статус","Вкл/Выкл"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outdoor.map(u => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-dim">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-secondary-color font-mono text-xs">{u.port}</td>
                  <td className="px-4 py-3 text-secondary-color">{u.mode}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    <span className={u.temp > 40 ? "text-amber" : "text-primary-color"}>{u.temp > 0 ? `${u.temp}°C` : "—"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      on={u.status === "on" || u.status === "warn"}
                      disabled={u.status === "error"}
                      onChange={() => toggleOutdoor(u.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
                {["ID","Название","Группа","Режим","Уставка","Факт Т°","Статус","Вкл/Выкл"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indoor.map(u => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-dim">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-secondary-color">{u.group}</td>
                  <td className="px-4 py-3 text-secondary-color">{u.mode}</td>
                  <td className="px-4 py-3">
                    <TempEditor
                      value={u.setTemp}
                      disabled={u.status === "error" || u.status === "off"}
                      onChange={v => setIndoorTemp(u.id, v)}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    <span className={Math.abs(u.curTemp - u.setTemp) > 2 ? "text-amber" : "text-green"}>{u.curTemp}°C</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      on={u.status === "on" || u.status === "warn"}
                      disabled={u.status === "error"}
                      onChange={() => toggleIndoor(u.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Groups ────────────────────────────────────────────────
function GroupSettings() {
  const groups = [
    { name: "1 этаж", count: 48, active: 32 },
    { name: "2 этаж", count: 48, active: 40 },
    { name: "Серверные", count: 16, active: 16 },
    { name: "Переговорные", count: 24, active: 8 },
  ];
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-secondary-color">Управление группами внутренних блоков</p>
        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md surface-3 text-blue panel-border">
          <Icon name="Plus" size={14} fallback="Plus" /> Новая группа
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.map((g, i) => (
          <div key={i} className="metric-card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-dim mt-0.5">{g.count} блоков всего</div>
              </div>
              <div className="flex gap-2">
                <button className="text-secondary-color hover:text-primary-color p-1"><Icon name="Pencil" size={12} fallback="Edit" /></button>
                <button className="text-secondary-color hover:text-red p-1"><Icon name="Trash2" size={12} fallback="Trash" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(g.active / g.count) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-blue">{g.active}/{g.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────
function ScheduleScreen() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-secondary-color">Автоматические события управления</p>
        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md surface-3 text-blue panel-border">
          <Icon name="Plus" size={14} fallback="Plus" /> Новое расписание
        </button>
      </div>
      <div className="surface-1 rounded-lg panel-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
              {["Название","Время","Дни","Действие","Статус",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHEDULE.map(s => (
              <tr key={s.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono text-blue">{s.time}</td>
                <td className="px-4 py-3 text-secondary-color">{s.days}</td>
                <td className="px-4 py-3 text-secondary-color">{s.action}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end">
                    <button className="text-secondary-color hover:text-primary-color"><Icon name="Pencil" size={13} fallback="Edit" /></button>
                    <button className="text-secondary-color hover:text-red"><Icon name="Trash2" size={13} fallback="Trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── History ─────────────────────────────────────────────
function HistoryScreen({ screen }: { screen: SubScreen }) {
  const historyData = [
    { time: "09:42:11", user: "admin", action: "Выключены все устройства 2 этаж", type: "control" },
    { time: "09:00:03", user: "system", action: "Расписание: Рабочие часы — выполнено", type: "schedule" },
    { time: "08:55:22", user: "admin", action: "Вход в систему", type: "auth" },
    { time: "07:30:00", user: "system", action: "Резервное копирование завершено", type: "system" },
  ];

  if (screen === "error-history") {
    return (
      <div className="animate-fade-in surface-1 rounded-lg panel-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
              {["Время","Блок","Описание","Уровень"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ERRORS.map(e => (
              <tr key={e.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{e.time}</td>
                <td className="px-4 py-3 font-mono text-xs text-dim">{e.unit}</td>
                <td className="px-4 py-3">{e.msg}</td>
                <td className="px-4 py-3"><StatusBadge status={e.level} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (screen === "uptime") {
    const modes = [
      { mode: "Охлаждение", hours: 1842, pct: 72 },
      { mode: "Обогрев", hours: 312, pct: 12 },
      { mode: "Вентиляция", hours: 410, pct: 16 },
      { mode: "Стоп", hours: 0, pct: 0 },
    ];
    return (
      <div className="animate-fade-in space-y-3">
        {modes.map((m, i) => (
          <div key={i} className="metric-card flex items-center gap-4">
            <div className="w-32 text-sm font-medium">{m.mode}</div>
            <div className="flex-1 h-2 surface-3 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${m.pct}%` }} />
            </div>
            <div className="font-mono text-sm text-blue w-10 text-right">{m.pct}%</div>
            <div className="text-xs text-dim w-16 text-right">{m.hours} ч</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in surface-1 rounded-lg panel-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
            {["Время","Пользователь","Действие","Тип"].map(h => (
              <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {historyData.map((h, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{h.time}</td>
              <td className="px-4 py-3 text-secondary-color">{h.user}</td>
              <td className="px-4 py-3">{h.action}</td>
              <td className="px-4 py-3">
                <span className="badge-status bg-blue-500/10 text-blue-400">{h.type}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Energy ───────────────────────────────────────────────
function EnergyScreen({ screen }: { screen: SubScreen }) {
  if (screen === "distribution") {
    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-sm text-secondary-color">Управление энергопотреблением на основе заданных правил</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Лимит: Офисы", limit: "50 кВт", current: "38.2 кВт", pct: 76 },
            { name: "Лимит: Серверная", limit: "20 кВт", current: "18.1 кВт", pct: 90 },
            { name: "Ночной режим 22:00–07:00", limit: "30 кВт", current: "0 кВт", pct: 0 },
            { name: "Пиковый запрет 12:00–14:00", limit: "0 кВт", current: "0 кВт", pct: 0 },
          ].map((r, i) => (
            <div key={i} className="metric-card">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{r.name}</span>
                <button className="text-secondary-color hover:text-primary-color"><Icon name="Pencil" size={12} fallback="Edit" /></button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-1.5 surface-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.pct > 85 ? "bg-amber-400" : "bg-blue-500"}`}
                    style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-xs font-mono text-secondary-color">{r.pct}%</span>
              </div>
              <div className="flex justify-between text-xs text-dim">
                <span>Факт: {r.current}</span>
                <span>Лимит: {r.limit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const vals = [3200,2800,2400,3100,4200,5800,6400,6100,4800,3600,2900,2600];
  const max = Math.max(...vals);
  return (
    <div className="animate-fade-in space-y-4">
      <div className="surface-1 rounded-lg panel-border p-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-medium">Потребление по месяцам</span>
          <span className="font-mono text-cyan text-lg">47 380 кВт·ч / год</span>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm"
                style={{
                  height: `${(vals[i] / max) * 100}%`,
                  background: i === 3 ? "hsl(195 100% 50%)" : "hsl(210 80% 56% / 0.45)"
                }} />
              <span className="text-xs text-dim">{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────
function ConfigScreen({ screen }: { screen: SubScreen }) {
  if (screen === "sys-settings") {
    const settings = [
      { label: "Регион", value: "Россия / UTC+3" },
      { label: "Язык", value: "Русский" },
      { label: "Дата", value: "16.04.2026" },
      { label: "Формат даты", value: "ДД.ММ.ГГГГ" },
      { label: "Время", value: "14:32" },
      { label: "Формат времени", value: "24-часовой" },
      { label: "Ед. температуры", value: "°C" },
      { label: "Световая индикация", value: "Включена" },
      { label: "Резервное копирование", value: "Каждые 24 ч" },
      { label: "Время выключения экрана", value: "10 мин" },
      { label: "Облачная синхронизация", value: "Включена" },
      { label: "Пароль заставки", value: "Задан" },
    ];
    return (
      <div className="animate-fade-in surface-1 rounded-lg panel-border">
        {settings.map((s, i) => (
          <div key={i} className="data-row px-4">
            <span className="text-sm text-secondary-color">{i + 1}. {s.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono">{s.value}</span>
              <Icon name="ChevronRight" size={14} className="text-dim" fallback="ChevronRight" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "network") {
    return (
      <div className="animate-fade-in space-y-3">
        {[
          { label: "Локальная сеть (LAN)", ip: "192.168.1.100", mask: "255.255.255.0", gw: "192.168.1.1", status: "on" },
          { label: "Wi-Fi", ip: "—", mask: "—", gw: "—", status: "off" },
        ].map((n, i) => (
          <div key={i} className="metric-card">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">{n.label}</span>
              <StatusBadge status={n.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-dim mb-1">IP-адрес</div><div className="font-mono">{n.ip}</div></div>
              <div><div className="text-xs text-dim mb-1">Маска</div><div className="font-mono">{n.mask}</div></div>
              <div><div className="text-xs text-dim mb-1">Шлюз</div><div className="font-mono">{n.gw}</div></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "ida") {
    return (
      <div className="animate-fade-in surface-1 rounded-lg panel-border p-4 space-y-1">
        <p className="text-sm text-secondary-color mb-4">Алгоритм обнаружения неэффективной работы (IDA)</p>
        {[
          { label: "Превышение уставки температуры", threshold: "> 3°C более 30 мин", enabled: true },
          { label: "Длительная работа без изменения режима", threshold: "> 8 ч", enabled: true },
          { label: "Разница давлений в контуре", threshold: "> 15%", enabled: false },
          { label: "КПД компрессора", threshold: "< 80%", enabled: true },
        ].map((r, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div>
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-xs text-dim mt-0.5">Порог: {r.threshold}</div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${r.enabled ? "bg-blue-500" : "surface-3"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${r.enabled ? "left-5" : "left-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "hotkeys") {
    return (
      <div className="animate-fade-in space-y-3">
        {[
          { label: "Включить всё", keys: ["F1"], desc: "Запускает все подключённые устройства" },
          { label: "Выключить всё", keys: ["F2"], desc: "Останавливает все подключённые устройства" },
          { label: "Запомнить состояние", keys: ["F3"], desc: "Сохраняет текущий режим работы как память" },
        ].map((h, i) => (
          <div key={i} className="metric-card flex items-center justify-between">
            <div>
              <div className="font-medium">{h.label}</div>
              <div className="text-xs text-dim mt-0.5">{h.desc}</div>
            </div>
            <div className="flex gap-1">
              {h.keys.map(k => (
                <kbd key={k} className="font-mono text-xs px-2 py-1 surface-3 rounded border border-border text-secondary-color">{k}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "2d-map") {
    return (
      <div className="animate-fade-in space-y-3">
        <p className="text-sm text-secondary-color">Двухмерная схема этажа — размещение внутренних блоков</p>
        <div className="surface-1 rounded-lg panel-border p-6 flex items-center justify-center h-48">
          <div className="text-center">
            <Icon name="Map" size={32} className="text-dim mx-auto mb-2" fallback="Map" />
            <div className="text-sm text-secondary-color">Загрузите план этажа для настройки блоков</div>
            <button className="mt-3 flex items-center gap-2 text-sm px-3 py-1.5 rounded-md surface-3 text-blue panel-border mx-auto">
              <Icon name="Upload" size={13} fallback="Upload" /> Загрузить изображение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex items-center justify-center h-40 surface-1 rounded-lg panel-border">
      <span className="text-secondary-color text-sm">Выберите подраздел в левом меню</span>
    </div>
  );
}

// ─── System ───────────────────────────────────────────────
function SystemScreen({ screen }: { screen: SubScreen }) {
  if (screen === "users") {
    const users = [
      { name: "admin", role: "Администратор", lastLogin: "16.04.2026 08:55", status: "on" },
      { name: "operator1", role: "Оператор", lastLogin: "15.04.2026 17:30", status: "off" },
      { name: "viewer", role: "Просмотр", lastLogin: "14.04.2026 10:00", status: "off" },
    ];
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex justify-end">
          <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md surface-3 text-blue panel-border">
            <Icon name="UserPlus" size={14} fallback="UserPlus" /> Добавить пользователя
          </button>
        </div>
        <div className="surface-1 rounded-lg panel-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-dim uppercase tracking-wide">
                {["Логин","Роль","Последний вход","Статус",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-secondary-color">{u.role}</td>
                  <td className="px-4 py-3 text-secondary-color text-xs">{u.lastLogin}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button className="text-secondary-color hover:text-primary-color"><Icon name="Pencil" size={13} fallback="Edit" /></button>
                      <button className="text-secondary-color hover:text-red"><Icon name="Trash2" size={13} fallback="Trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (screen === "support") {
    return (
      <div className="animate-fade-in surface-1 rounded-lg panel-border p-6 space-y-2">
        <p className="text-sm text-secondary-color mb-4">Контакты клиентской технической службы</p>
        {[
          { icon: "Phone", label: "Телефон", value: "+7 (800) 000-00-00" },
          { icon: "Mail", label: "E-mail", value: "support@example.com" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
            <Icon name={c.icon} size={16} className="text-blue" fallback="Phone" />
            <div>
              <div className="text-xs text-dim">{c.label}</div>
              <div className="font-mono">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "update") {
    return (
      <div className="animate-fade-in space-y-3">
        <div className="metric-card flex items-center justify-between">
          <div>
            <div className="text-sm text-dim">Текущая версия ПО</div>
            <div className="font-mono text-xl mt-1">v3.2.1</div>
          </div>
          <StatusBadge status="on" />
        </div>
        <div className="metric-card">
          <div className="text-sm font-medium mb-1">Обновление OTA</div>
          <p className="text-xs text-dim mb-3">Доступно обновление v3.3.0 · Проверено 16.04.2026 07:00</p>
          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">
            <Icon name="Download" size={14} fallback="Download" /> Установить обновление
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex items-center justify-center h-40 surface-1 rounded-lg panel-border">
      <span className="text-secondary-color text-sm">Выберите подраздел</span>
    </div>
  );
}

// ─── Smart View ───────────────────────────────────────────
function SmartView({ indoor, toggleIndoor, setAllIndoor }: {
  indoor: IndoorUnit[];
  toggleIndoor: (id: string) => void;
  setAllIndoor: (on: boolean) => void;
}) {
  const onCount = indoor.filter(u => u.status === "on").length;
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-color">Управление и блокировка устройств · {onCount}/{indoor.length} включено</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setAllIndoor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all">
            <Icon name="PowerCircle" size={13} fallback="Power" /> Включить все
          </button>
          <button onClick={() => setAllIndoor(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/25 transition-all">
            <Icon name="PowerOff" size={13} fallback="Power" /> Выключить все
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {indoor.map((u) => (
          <div key={u.id}
            onClick={() => u.status !== "error" && toggleIndoor(u.id)}
            title={u.status === "error" ? "Ошибка — управление недоступно" : u.status === "on" ? "Нажмите чтобы выключить" : "Нажмите чтобы включить"}
            className={`rounded-lg p-2.5 panel-border text-center transition-all select-none
              ${u.status === "error" ? "opacity-50 cursor-not-allowed surface-1" : "cursor-pointer hover:scale-105 active:scale-95"}
              ${u.status === "on" ? "surface-2 border-blue-500/40" :
                u.status === "warn" ? "surface-2 border-amber-500/40" :
                u.status === "error" ? "surface-1 border-red-500/40" : "surface-1 border-border"}`}>
            <Icon name="Wind" size={18} fallback="Wind" className={`mx-auto ${
              u.status === "on" ? "text-blue" :
              u.status === "warn" ? "text-amber" :
              u.status === "error" ? "text-red" : "text-dim"}`} />
            <div className="text-xs mt-1 text-dim truncate">{u.id}</div>
            <div className="font-mono text-xs mt-0.5">{u.status === "on" ? `${u.curTemp}°` : "—"}</div>
            <div className={`mt-1.5 w-4 h-1.5 rounded-full mx-auto ${u.status === "on" ? "bg-blue-500" : u.status === "error" ? "bg-red-500" : "bg-zinc-600"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Advanced (Emergency stop) ────────────────────────────
function AdvancedScreen() {
  return (
    <div className="animate-fade-in surface-1 rounded-lg panel-border p-6 space-y-4">
      <p className="text-sm text-secondary-color">Аварийная остановка — принудительное отключение всех систем</p>
      <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 transition-all text-sm">
        <Icon name="ShieldOff" size={14} fallback="Shield" /> Аварийная остановка всех систем
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function Index() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [activeScreen, setActiveScreen] = useState<SubScreen>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Device state ─────────────────────────────────────
  const [outdoor, setOutdoor] = useState<OutdoorUnit[]>(INIT_OUTDOOR);
  const [indoor, setIndoor] = useState<IndoorUnit[]>(INIT_INDOOR);

  const toggleOutdoor = useCallback((id: string) => {
    setOutdoor(prev => prev.map(u => {
      if (u.id !== id || u.status === "error") return u;
      const next = u.status === "off" ? "on" : "off";
      return { ...u, status: next, mode: next === "on" ? "Охлаждение" : "Стоп" };
    }));
  }, []);

  const toggleIndoor = useCallback((id: string) => {
    setIndoor(prev => prev.map(u => {
      if (u.id !== id || u.status === "error") return u;
      const next = u.status === "off" ? "on" : "off";
      return { ...u, status: next, mode: next === "on" ? "Охл." : "Стоп" };
    }));
  }, []);

  const setAllOutdoor = useCallback((on: boolean) => {
    setOutdoor(prev => prev.map(u => {
      if (u.status === "error") return u;
      return { ...u, status: on ? "on" : "off", mode: on ? "Охлаждение" : "Стоп" };
    }));
  }, []);

  const setAllIndoor = useCallback((on: boolean) => {
    setIndoor(prev => prev.map(u => {
      if (u.status === "error") return u;
      return { ...u, status: on ? "on" : "off", mode: on ? "Охл." : "Стоп" };
    }));
  }, []);

  const setIndoorTemp = useCallback((id: string, temp: number) => {
    setIndoor(prev => prev.map(u => u.id === id ? { ...u, setTemp: temp } : u));
  }, []);

  const allOutdoorOn = outdoor.filter(u => u.status !== "error").every(u => u.status === "on");
  const allIndoorOn = indoor.filter(u => u.status !== "error").every(u => u.status === "on");
  // ─────────────────────────────────────────────────────

  const now = new Date();
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  const activeNav = NAV.find(n => n.key === activeModule);

  function selectModule(key: ModuleKey) {
    setActiveModule(key);
    const nav = NAV.find(n => n.key === key);
    setActiveScreen(nav?.screens[0]?.key || "");
  }

  function renderContent() {
    if (activeModule === "dashboard") return <Dashboard outdoor={outdoor} indoor={indoor} />;
    if (activeModule === "devices") {
      if (activeScreen === "tracking") return (
        <DeviceTracking
          outdoor={outdoor} indoor={indoor}
          toggleOutdoor={toggleOutdoor} toggleIndoor={toggleIndoor}
          allOutdoorOn={allOutdoorOn} allIndoorOn={allIndoorOn}
          setAllOutdoor={setAllOutdoor} setAllIndoor={setAllIndoor}
          setIndoorTemp={setIndoorTemp}
        />
      );
      if (activeScreen === "groups") return <GroupSettings />;
      if (activeScreen === "smartview") return (
        <SmartView indoor={indoor} toggleIndoor={toggleIndoor} setAllIndoor={setAllIndoor} />
      );
      if (activeScreen === "schedule") return <ScheduleScreen />;
      if (activeScreen === "advanced") return <AdvancedScreen />;
    }
    if (activeModule === "history") return <HistoryScreen screen={activeScreen} />;
    if (activeModule === "energy") return <EnergyScreen screen={activeScreen} />;
    if (activeModule === "config") return <ConfigScreen screen={activeScreen} />;
    if (activeModule === "system") return <SystemScreen screen={activeScreen} />;
    return null;
  }

  const currentScreenLabel = activeNav?.screens.find(s => s.key === activeScreen)?.label || "Главная страница";

  return (
    <div className="flex h-screen overflow-hidden bg-background font-ibm">
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${sidebarOpen ? "w-60" : "w-14"} shrink-0 border-r border-border surface-1`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Icon name="Cpu" size={15} className="text-blue" fallback="Cpu" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate text-primary-color">ЦПУ VRF</div>
              <div className="text-xs text-dim">V6 / V8 · 6×RS485</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map(n => (
            <div key={n.key}>
              <div onClick={() => selectModule(n.key)}
                className={`nav-item ${activeModule === n.key ? "active" : ""}`}>
                <Icon name={n.icon} size={15} className="shrink-0" fallback="Circle" />
                {sidebarOpen && <span className="truncate text-xs leading-tight">{n.label}</span>}
              </div>
              {sidebarOpen && activeModule === n.key && n.screens.length > 0 && (
                <div className="ml-4 mt-0.5 space-y-0 border-l border-border pl-3">
                  {n.screens.map(s => (
                    <div key={s.key} onClick={() => setActiveScreen(s.key)}
                      className={`text-xs py-1.5 px-2 rounded cursor-pointer transition-colors truncate
                        ${activeScreen === s.key ? "text-blue" : "text-dim hover:text-secondary-color"}`}>
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Ports */}
        {sidebarOpen && (
          <div className="p-3 border-t border-border">
            <div className="text-xs text-dim mb-2 uppercase tracking-wide">Порты RS485</div>
            <div className="grid grid-cols-3 gap-1">
              {["1","2","3","4","5","6"].map((p, i) => (
                <div key={p} className={`text-xs font-mono text-center py-1 rounded surface-3 ${i < 5 ? "text-green" : "text-dim"}`}>
                  P{p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center p-3 border-t border-border text-dim hover:text-primary-color transition-colors">
          <Icon name={sidebarOpen ? "ChevronsLeft" : "ChevronsRight"} size={14} fallback="ChevronLeft" />
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border surface-1 shrink-0">
          <div>
            <div className="text-xs text-dim uppercase tracking-wider">{activeNav?.label}</div>
            <div className="text-sm font-medium mt-0.5">{currentScreenLabel}</div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 text-xs text-secondary-color">
              <span className="flex items-center gap-1.5">
                <span className="status-dot bg-green-400 animate-pulse-slow" />
                {indoor.filter(u => u.status === "on").length + outdoor.filter(u => u.status === "on").length} систем онлайн
              </span>
              <span className="flex items-center gap-1.5">
                <span className="status-dot bg-red-400" />
                {[...indoor, ...outdoor].filter(u => u.status === "error").length} ошибок
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-primary-color">{timeStr}</div>
              <div className="text-xs text-dim">{dateStr}</div>
            </div>
            <div className="flex items-center gap-2 surface-3 rounded-md px-3 py-1.5 panel-border">
              <Icon name="User" size={13} className="text-dim" fallback="User" />
              <span className="text-xs">admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
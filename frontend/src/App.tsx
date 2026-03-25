import React, { useState, useEffect, useCallback } from 'react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ListChecks, Clock, ChevronRight, ChevronDown, Check, Circle,
  Loader2, AlertTriangle, LayoutDashboard, Bell, Plus, X, StickyNote,
  ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, Trash2, Filter,
} from 'lucide-react';
import { api, SubjectOut, ActivityOut, TodayView, ReminderOut } from './api';

const pad = (n: number) => String(n).padStart(2, '0');
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = [18, 19, 20, 21, 22];
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function getWeekStart(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDeadline(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function urgencyColor(iso: string | null): string {
  if (!iso) return '#6b7494';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return '#ef4444';
  if (diff < 3 * 86400000) return '#ef4444';
  if (diff < 7 * 86400000) return '#f59e0b';
  return '#22c55e';
}

function remaining(iso: string | null): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Vencido';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <ArrowUpCircle size={13} className="text-[#ef4444]" />,
  medium: <ArrowRightCircle size={13} className="text-[#f59e0b]" />,
  low: <ArrowDownCircle size={13} className="text-[#22c55e]" />,
};

type Tab = 'hoy' | 'clases' | 'actividades';

// ─── APP ──────────────────────────────────────
const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('hoy');
  const [now, setNow] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  // API state
  const [subjects, setSubjects] = useState<SubjectOut[]>([]);
  const [activities, setActivities] = useState<ActivityOut[]>([]);
  const [today, setToday] = useState<TodayView | null>(null);
  const [reminders, setReminders] = useState<ReminderOut[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity detail
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [rmTitle, setRmTitle] = useState('');
  const [rmDesc, setRmDesc] = useState('');
  const [rmDate, setRmDate] = useState('');
  const [rmTime, setRmTime] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [moodleSession, setMoodleSession] = useState('');
  const [moodleSesskey, setMoodleSesskey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [filterSubject, setFilterSubject] = useState<number | 0>(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const refresh = useCallback(async () => {
    try {
      const [s, a, t, r] = await Promise.all([
        api.getSubjects(), api.getActivities(), api.getToday(), api.getReminders()
      ]);
      setSubjects(s);
      setActivities(a);
      setToday(t);
      setReminders(r);
    } catch (e) { console.error('API error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const toggleOpen = (id: number) => setOpenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleStatusToggle = async (act: ActivityOut) => {
    const newStatus = act.status === 'completed' ? 'pending' : 'completed';
    await api.updateActivity(act.id, { status: newStatus });
    refresh();
  };

  const handlePriority = async (act: ActivityOut, p: string) => {
    await api.updateActivity(act.id, { priority: p });
    refresh();
  };

  const handleSaveNotes = async (act: ActivityOut) => {
    setSavingNotes(true);
    await api.updateActivity(act.id, { notes: editNotes });
    setSavingNotes(false);
    refresh();
  };

  const handleCreateReminder = async () => {
    if (!rmTitle || !rmDate || !rmTime) return;
    await api.createReminder({ title: rmTitle, description: rmDesc, remind_at: `${rmDate}T${rmTime}:00` });
    setRmTitle(''); setRmDesc(''); setRmDate(''); setRmTime('');
    setShowReminderForm(false);
    refresh();
  };

  const handleDeleteReminder = async (id: number) => {
    await api.deleteReminder(id);
    refresh();
  };

  const openDetail = (act: ActivityOut) => {
    setDetailId(act.id === detailId ? null : act.id);
    setEditNotes(act.notes || '');
  };

  const handleSync = async () => {
    // If in Electron, use automated flow
    if ((window as any).electronAPI) {
      setIsSyncing(true);
      try {
        const creds = await (window as any).electronAPI.openMoodleLogin();
        if (creds) {
          const res = await api.syncMoodle(creds);
          if ((window as any).electronAPI?.sendNotification) {
            (window as any).electronAPI.sendNotification(
              "Sincronización Moodle",
              `Éxito: ${res.stats.new} nuevas actividades y ${res.stats.updated} actualizadas.`
            );
            
            // Notify about new grades
            if (res.stats.graded_items && res.stats.graded_items.length > 0) {
              res.stats.graded_items.forEach((item: any) => {
                (window as any).electronAPI.sendNotification(
                  "¡Nueva Calificación!",
                  `${item.name}: ${item.grade}`
                );
              });
            }
          } else {
            alert(`Sincronización exitosa: ${res.stats.new} nuevas, ${res.stats.updated} actualizadas.`);
          }
          refresh();
        }
      } catch (e) {
        alert("Error en la sincronización automática.");
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Otherwise, use manual modal (already handled by showSyncModal state)
    if (!moodleSession || !moodleSesskey) return;
    setIsSyncing(true);
    try {
      const res = await api.syncMoodle({ session_cookie: moodleSession, sesskey: moodleSesskey });
      alert(`Sincronización exitosa: ${res.stats.new} nuevas, ${res.stats.updated} actualizadas.`);
      setShowSyncModal(false);
      refresh();
    } catch (e) {
      alert("Error en la sincronización. Verifica tus credenciales.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Build grid events from subjects
  const gridEvents = subjects.flatMap(s =>
    s.sessions.map(sess => ({ subject: s, session: sess }))
  );

  const weekStart = getWeekStart(weekOffset);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

  // Filtered activities
  const filteredActivities = activities.filter(a => {
    if (filterSubject && a.subject_id !== filterSubject) return false;
    if (filterStatus === 'pending' && a.status === 'completed') return false;
    if (filterStatus === 'completed' && a.status !== 'completed') return false;
    if (filterStatus === 'overdue' && (a.status === 'completed' || !a.deadline || new Date(a.deadline).getTime() > Date.now())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4f8ef7]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e4e7f0] font-[Segoe_UI,system-ui,sans-serif]">
      <div className="max-w-[1600px] mx-auto px-10 py-6">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-5 pb-3 border-b border-[#1e2235]">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Mi Calendario Ibero</h1>
            <p className="text-[10px] text-[#6b7494] uppercase tracking-[2px] mt-0.5">Semestre 202631</p>
          </div>
          <div className="flex items-center gap-4">
            {today && (
              <span className="text-xs text-[#6b7494] bg-[#1a1d27] border border-[#1e2235] px-3 py-1 rounded-md">
                Avance: <strong className="text-[#e4e7f0]">{today.semester_progress}%</strong>
              </span>
            )}
            <div className="bg-[#1a1d27] border border-[#1e2235] px-3 py-1.5 rounded-md flex items-center gap-2">
              <Clock size={12} className="text-[#4f8ef7]" />
              <span className="font-mono text-xs font-semibold">
                {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
              </span>
            </div>
            <button
              onClick={() => (window as any).electronAPI ? handleSync() : setShowSyncModal(true)}
              className="flex items-center gap-2 bg-[#4f8ef7] hover:bg-[#3d7ae5] text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all"
            >
              <LayoutDashboard size={14} /> Sincronizar
            </button>
          </div>
        </header>

        {/* TABS — 3 tabs */}
        <nav className="flex gap-1 bg-[#13151f] p-1 rounded-lg border border-[#1e2235] mb-5">
          {([
            { key: 'hoy' as Tab, label: 'Hoy', icon: <LayoutDashboard size={14} /> },
            { key: 'clases' as Tab, label: 'Clases', icon: <Calendar size={14} /> },
            { key: 'actividades' as Tab, label: 'Actividades', icon: <ListChecks size={14} /> },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                tab === t.key ? 'bg-[#1a1d27] text-white shadow' : 'text-[#6b7494] hover:text-white'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {/* ═══════════════════════════════════════════════ */}
        {/* CONTENT */}
        <AnimatePresence mode="wait">

          {/* ─── TAB: HOY ──────────────────────────── */}
          {tab === 'hoy' && today && (
            <motion.div key="hoy" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}>
              <div className="grid grid-cols-3 gap-5">

                {/* Col 1 — Day overview */}
                <div className="col-span-2 space-y-4">

                  {/* Day header */}
                  <div className="bg-[#13151f] border border-[#1e2235] rounded-xl p-5">
                    <p className="text-[10px] uppercase tracking-widest text-[#6b7494] font-bold mb-1">{today.day_name} · {today.date}</p>
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-3xl font-bold tabular-nums">{pad(now.getHours())}:{pad(now.getMinutes())}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[#6b7494]">Progreso semestral</span>
                          <span className="text-xs font-bold">{today.semester_progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#1e2235] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4f8ef7] rounded-full transition-all" style={{width: `${today.semester_progress}%`}} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overdue warning */}
                  {today.overdue.length > 0 && (
                    <div className="bg-[#1a1015] border border-[#3d1a1a] rounded-xl p-4 flex items-center gap-3">
                      <AlertTriangle size={18} className="text-[#ef4444] shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#ef4444]">{today.overdue.length} actividad{today.overdue.length > 1 ? 'es' : ''} vencida{today.overdue.length > 1 ? 's' : ''}</p>
                        {today.overdue.map((o, i) => (
                          <p key={i} className="text-xs text-[#ef4444]/70 mt-0.5">{o.subject_name} — {o.name}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Today's classes */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px] text-[#6b7494] font-bold mb-2">Clases hoy</p>
                    {today.classes_today.length === 0 ? (
                      <div className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4">
                        <p className="text-sm text-[#6b7494]">No tienes clases programadas hoy.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {today.classes_today.map((c, i) => (
                          <div key={i} className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4 flex items-center gap-4">
                            <div className="w-1 h-10 rounded-full" style={{background: c.subject_color}} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">{c.subject_name}</p>
                              <p className="text-xs text-[#6b7494]">{c.session_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold tabular-nums">{pad(c.hour)}:{pad(c.minute)}</p>
                              <p className="text-[10px] text-[#6b7494]">{c.duration_hours}h</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming deadlines */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px] text-[#6b7494] font-bold mb-2">Entregas esta semana</p>
                    {today.upcoming_deadlines.length === 0 ? (
                      <div className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4">
                        <p className="text-sm text-[#6b7494]">Sin entregas esta semana.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {today.upcoming_deadlines.map((a, i) => (
                          <div key={i} className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4 flex items-center gap-4">
                            <div className="w-1 h-10 rounded-full" style={{background: a.subject_color}} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{a.name}</p>
                              <p className="text-xs text-[#6b7494]">{a.subject_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold" style={{color: urgencyColor(a.deadline)}}>{fmtDeadline(a.deadline)}</p>
                              <p className="text-[10px]" style={{color: urgencyColor(a.deadline)}}>{a.days_remaining != null ? `${a.days_remaining}d restantes` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2 — Reminders sidebar */}
                <div className="space-y-4">
                  <PomodoroTimer subjects={subjects} />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[1.5px] text-[#6b7494] font-bold">Recordatorios</p>
                    <button
                      onClick={() => setShowReminderForm(!showReminderForm)}
                      className="p-1.5 bg-[#1a1d27] border border-[#1e2235] rounded-md hover:bg-[#252a3a] transition"
                    >
                      {showReminderForm ? <X size={14} /> : <Plus size={14} />}
                    </button>
                  </div>

                  {/* Reminder form */}
                  <AnimatePresence>
                    {showReminderForm && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        <div className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4 space-y-3">
                          <input
                            value={rmTitle} onChange={e => setRmTitle(e.target.value)}
                            placeholder="Título"
                            className="w-full bg-[#0f1117] border border-[#1e2235] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f8ef7] placeholder-[#3a3f55]"
                          />
                          <input
                            value={rmDesc} onChange={e => setRmDesc(e.target.value)}
                            placeholder="Descripción (opcional)"
                            className="w-full bg-[#0f1117] border border-[#1e2235] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f8ef7] placeholder-[#3a3f55]"
                          />
                          <div className="flex gap-2">
                            <input
                              type="date" value={rmDate} onChange={e => setRmDate(e.target.value)}
                              className="flex-1 bg-[#0f1117] border border-[#1e2235] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#4f8ef7] text-[#e4e7f0]"
                            />
                            <input
                              type="time" value={rmTime} onChange={e => setRmTime(e.target.value)}
                              className="w-28 bg-[#0f1117] border border-[#1e2235] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#4f8ef7] text-[#e4e7f0]"
                            />
                          </div>
                          <button
                            onClick={handleCreateReminder}
                            disabled={!rmTitle || !rmDate || !rmTime}
                            className="w-full py-2 bg-[#4f8ef7] text-white text-xs font-bold rounded-lg hover:bg-[#3d7ae5] transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Crear recordatorio
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reminder list */}
                  {reminders.length === 0 && !showReminderForm && (
                    <div className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4">
                      <p className="text-sm text-[#6b7494]">Sin recordatorios activos.</p>
                    </div>
                  )}
                  {reminders.map(r => (
                    <div key={r.id} className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4 flex items-start gap-3 group">
                      <Bell size={14} className="text-[#4f8ef7] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-[#6b7494] mt-0.5">{r.description}</p>}
                        <p className="text-[10px] text-[#6b7494] mt-1">{fmtDate(r.remind_at)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(r.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1e2235] rounded transition"
                      >
                        <Trash2 size={13} className="text-[#6b7494] hover:text-[#ef4444]" />
                      </button>
                    </div>
                  ))}

                  {/* Subjects quick glance */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.5px] text-[#6b7494] font-bold mb-2 mt-4">Materias</p>
                    {subjects.map(s => (
                      <div key={s.id} className="flex items-center gap-2.5 py-2 border-b border-[#1e2235]/50 last:border-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{background: s.color}} />
                        <span className="text-xs flex-1 truncate">{s.short_name || s.name}</span>
                        <div className="w-16 h-1 bg-[#1e2235] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width: `${(s.completed_activities / s.total_activities) * 100}%`, background: s.color}} />
                        </div>
                        <span className="text-[10px] text-[#6b7494]">{s.completed_activities}/{s.total_activities}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── TAB: CLASES ───────────────────────── */}
          {tab === 'clases' && (
            <motion.div key="c" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}>

              {/* Today's classes banner */}
              {today && today.classes_today.length > 0 && (
                <div className="bg-[#13151f] border border-[#1e2235] rounded-lg p-3 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a1d27] rounded-md flex items-center justify-center text-sm">
                    <Calendar size={16} className="text-[#4f8ef7]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-[#6b7494] font-semibold">Hoy · {today.day_name}</p>
                    <div className="flex gap-3 mt-1">
                      {today.classes_today.map((c, i) => (
                        <span key={i} className="text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{background: c.subject_color}} />
                          {c.subject_name.split(' ')[0]} {pad(c.hour)}:{pad(c.minute)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Week nav */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-[#6b7494]">
                  {weekStart.getDate()} – {weekEnd.getDate()} {MESES[weekEnd.getMonth()]} {weekEnd.getFullYear()}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setWeekOffset(w => w-1)} className="p-1 bg-[#13151f] border border-[#1e2235] rounded hover:bg-[#1a1d27]"><ChevronRight size={14} className="rotate-180" /></button>
                  <button onClick={() => setWeekOffset(0)} className="px-2 py-1 bg-[#13151f] border border-[#1e2235] rounded text-[10px] text-[#6b7494] hover:bg-[#1a1d27]">Hoy</button>
                  <button onClick={() => setWeekOffset(w => w+1)} className="p-1 bg-[#13151f] border border-[#1e2235] rounded hover:bg-[#1a1d27]"><ChevronRight size={14} /></button>
                </div>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-[52px_repeat(7,1fr)] rounded-lg overflow-hidden border border-[#1e2235] mb-8">
                <div className="bg-[#13151f] h-12" />
                {[0,1,2,3,4,5,6].map(d => {
                  const date = new Date(weekStart); date.setDate(weekStart.getDate() + d);
                  const isToday = date.toDateString() === now.toDateString();
                  return (
                    <div key={d} className={`bg-[#13151f] h-12 flex flex-col items-center justify-center border-l border-[#1e2235] ${isToday ? 'text-[#4f8ef7]' : 'text-[#6b7494]'}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{DIAS[d]}</span>
                      <span className={`text-sm font-semibold ${isToday ? 'text-[#4f8ef7]' : 'text-[#e4e7f0]'}`}>{date.getDate()}</span>
                    </div>
                  );
                })}

                {HORAS.map(h => {
                  const maxOverlap = Math.max(1, ...[0,1,2,3,4,5,6].map(d =>
                    gridEvents.filter(e => e.session.day_of_week === d && e.session.hour === h).length
                  ));
                  const rowH = maxOverlap <= 1 ? 72 : maxOverlap * 40;
                  return (
                  <React.Fragment key={h}>
                    <div className="bg-[#0f1117] flex items-center justify-end pr-2 text-[11px] text-[#6b7494] border-t border-[#1e2235]" style={{height: rowH}}>
                      {h}:00
                    </div>
                    {[0,1,2,3,4,5,6].map(d => {
                      const cellEvents = gridEvents.filter(e => e.session.day_of_week === d && e.session.hour === h);
                      const count = cellEvents.length;
                      return (
                        <div key={d} className="bg-[#0b0d14] relative border-t border-l border-[#1e2235]" style={{height: rowH}}>
                          {cellEvents.map((ev, idx) => (
                            <div
                              key={idx}
                              className="absolute rounded-md px-2 py-1 text-[10px] font-bold flex flex-col justify-center leading-snug cursor-default overflow-hidden"
                              style={{
                                top: count > 1 ? `${(idx / count) * 100}%` : '2px',
                                height: count > 1 ? `calc(${100 / count}% - 2px)` : 'calc(100% - 4px)',
                                left: '3px', right: '3px',
                                backgroundColor: `${ev.subject.color}18`,
                                borderLeft: `3px solid ${ev.subject.color}`,
                                color: ev.subject.color,
                              }}
                            >
                              <span className="truncate">{ev.subject.short_name || ev.subject.name.split(' ')[0]}</span>
                              <span className="opacity-50 text-[9px] font-normal">{pad(ev.session.hour)}:{pad(ev.session.minute)} · {ev.session.session_type === 'Clase sincrónica' ? 'Clase' : ev.session.session_type}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                  );
                })}
              </div>

              {/* Subject summary cards */}
              <p className="text-[10px] uppercase tracking-[1.5px] text-[#6b7494] font-bold mb-3">Materias</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {subjects.map(s => (
                  <div key={s.id} className="bg-[#13151f] border border-[#1e2235] rounded-xl p-4">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background: s.color}} />
                      <span className="text-sm font-bold truncate">{s.short_name || s.name}</span>
                    </div>
                    <p className="text-xs text-[#6b7494] mb-2">{s.instructor}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.sessions.map((ss, i) => (
                        <span key={i} className="bg-[#0f1117] text-[10px] px-2 py-0.5 rounded text-[#6b7494]">
                          {DIAS[ss.day_of_week]} {pad(ss.hour)}:{pad(ss.minute)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1e2235] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width: `${(s.completed_activities / s.total_activities) * 100}%`, background: s.color}} />
                      </div>
                      <span className="text-[10px] text-[#6b7494]">{s.completed_activities}/{s.total_activities}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── TAB: ACTIVIDADES ───────────────────── */}
          {tab === 'actividades' && (
            <motion.div key="a" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}} className="space-y-3">

              {/* Filters bar */}
              <div className="flex items-center gap-3 mb-2">
                <Filter size={14} className="text-[#6b7494]" />
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(Number(e.target.value))}
                  className="bg-[#13151f] border border-[#1e2235] rounded-lg px-3 py-1.5 text-xs text-[#e4e7f0] outline-none focus:border-[#4f8ef7]"
                >
                  <option value={0}>Todas las materias</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.short_name || s.name}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-[#13151f] border border-[#1e2235] rounded-lg px-3 py-1.5 text-xs text-[#e4e7f0] outline-none focus:border-[#4f8ef7]"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="overdue">Vencidas</option>
                </select>
                <span className="text-[10px] text-[#6b7494] ml-auto">{filteredActivities.length} actividades</span>
              </div>

              {/* Overdue warning */}
              {today && today.overdue.length > 0 && filterStatus !== 'completed' && (
                <div className="bg-[#1a1015] border border-[#3d1a1a] rounded-lg p-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-[#ef4444] shrink-0" />
                  <p className="text-xs text-[#ef4444]">
                    <strong>{today.overdue.length}</strong> actividad{today.overdue.length > 1 ? 'es' : ''} vencida{today.overdue.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Subject accordions with filtered data */}
              {subjects
                .filter(s => !filterSubject || s.id === filterSubject)
                .map(s => {
                const subActivities = filteredActivities.filter(a => a.subject_id === s.id);
                if (subActivities.length === 0) return null;
                const isOpen = openIds.has(s.id);
                const completed = subActivities.filter(a => a.status === 'completed').length;
                const perc = subActivities.length > 0 ? (completed / subActivities.length) * 100 : 0;

                return (
                  <div key={s.id} className="bg-[#13151f] border border-[#1e2235] rounded-lg overflow-hidden">
                    <button onClick={() => toggleOpen(s.id)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#1a1d27] transition text-left">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background: s.color}} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate">{s.name}</h3>
                        <p className="text-xs text-[#6b7494]">{s.instructor}</p>
                      </div>
                      <div className="w-24 h-1.5 bg-[#1e2235] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{width: `${perc}%`, background: s.color}} />
                      </div>
                      <span className="text-xs text-[#6b7494] w-8 text-right">{completed}/{subActivities.length}</span>
                      <ChevronDown size={16} className={`text-[#6b7494] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden border-t border-[#1e2235]">
                          {subActivities.map(a => {
                            const isDone = a.status === 'completed';
                            const color = isDone ? '#22c55e' : urgencyColor(a.deadline);
                            const isDetail = detailId === a.id;
                            return (
                              <div key={a.id} className="border-b border-[#1e2235]/50 last:border-0">
                                <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#0f1117]/50 transition group">
                                  <button onClick={() => handleStatusToggle(a)} className="shrink-0 transition-transform hover:scale-110">
                                    {isDone ? <Check size={16} className="text-[#22c55e]" /> : <Circle size={16} className="text-[#3a3f55] group-hover:text-[#6b7494]" />}
                                  </button>
                                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(a)}>
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-medium truncate ${isDone ? 'line-through opacity-40' : ''}`}>{a.name}</p>
                                      {PRIORITY_ICONS[a.priority]}
                                      {a.notes && <StickyNote size={11} className="text-[#6b7494]" />}
                                    </div>
                                    <p className="text-[10px] text-[#6b7494] mt-0.5">{a.activity_type === 'quiz' ? 'Quiz' : 'Tarea'}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {isDone ? (
                                      <p className="text-xs text-[#22c55e]">Completado</p>
                                    ) : a.deadline ? (
                                      <>
                                        <p className="text-xs font-semibold tabular-nums" style={{color}}>{fmtDeadline(a.deadline)}</p>
                                        <p className="text-[10px]" style={{color}}>{remaining(a.deadline)}</p>
                                      </>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Detail panel */}
                                <AnimatePresence>
                                  {isDetail && (
                                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                                      <div className="bg-[#0b0d14] px-5 py-4 ml-10 mr-5 mb-3 rounded-lg border border-[#1e2235] space-y-3">
                                        {/* Priority selector */}
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] text-[#6b7494] uppercase tracking-wider w-16">Prioridad</span>
                                          <div className="flex gap-1">
                                            {(['low', 'medium', 'high'] as const).map(p => (
                                              <button
                                                key={p}
                                                onClick={() => handlePriority(a, p)}
                                                className={`px-2.5 py-1 text-[10px] rounded-md border transition ${
                                                  a.priority === p
                                                    ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white'
                                                    : 'border-[#1e2235] text-[#6b7494] hover:border-[#3a3f55]'
                                                }`}
                                              >
                                                {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                          <span className="text-[10px] text-[#6b7494] uppercase tracking-wider">Notas personales</span>
                                          <textarea
                                            value={editNotes}
                                            onChange={e => setEditNotes(e.target.value)}
                                            placeholder="Requisitos, links, dudas para tutoría..."
                                            rows={3}
                                            className="w-full mt-1 bg-[#0f1117] border border-[#1e2235] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#4f8ef7] placeholder-[#3a3f55] resize-none"
                                          />
                                          <button
                                            onClick={() => handleSaveNotes(a)}
                                            disabled={savingNotes}
                                            className="mt-1 px-3 py-1 bg-[#4f8ef7] text-white text-[10px] font-bold rounded-md hover:bg-[#3d7ae5] transition disabled:opacity-50"
                                          >
                                            {savingNotes ? 'Guardando...' : 'Guardar notas'}
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYNC MODAL */}
        <AnimatePresence>
          {showSyncModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}} className="bg-[#13151f] border border-[#1e2235] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold flex items-center gap-2"><LayoutDashboard size={16} className="text-[#4f8ef7]" /> Configuración de Sincronización</h2>
                  <button onClick={() => setShowSyncModal(false)} className="text-[#6b7494] hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <p className="text-[11px] text-[#6b7494] leading-relaxed">
                    Para conectar con Moodle, necesitamos tu sesión actual. Puedes encontrar estos datos en las herramientas de desarrollador (F12) &gt; Aplicación &gt; Cookies.
                  </p>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6b7494] mb-1.5 block">MoodleSession Cookie</label>
                    <input
                      type="password" value={moodleSession} onChange={e => setMoodleSession(e.target.value)}
                      placeholder="Ej: f4a8..."
                      className="w-full bg-[#0f1117] border border-[#1e2235] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#4f8ef7] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#6b7494] mb-1.5 block">sesskey</label>
                    <input
                      type="password" value={moodleSesskey} onChange={e => setMoodleSesskey(e.target.value)}
                      placeholder="Ej: XyZa123..."
                      className="w-full bg-[#0f1117] border border-[#1e2235] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#4f8ef7] text-white"
                    />
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || !moodleSession || !moodleSesskey}
                    className="w-full bg-[#4f8ef7] hover:bg-[#3d7ae5] text-white py-3 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <LayoutDashboard size={14} />}
                    {isSyncing ? 'Sincronizando...' : 'Iniciar Sincronización'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

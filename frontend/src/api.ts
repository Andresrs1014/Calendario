const API_BASE = 'http://localhost:8000';

export interface SessionOut {
  id: number;
  day_of_week: number;
  hour: number;
  minute: number;
  duration_hours: number;
  session_type: string;
}

export interface SubjectOut {
  id: number;
  name: string;
  short_name: string;
  instructor: string;
  color: string;
  total_activities: number;
  completed_activities: number;
  sessions: SessionOut[];
}

export interface ActivityOut {
  id: number;
  name: string;
  activity_type: string;
  status: string;
  priority: string;
  deadline: string | null;
  completed_at: string | null;
  notes: string;
  subject_id: number;
  subject_name: string | null;
  subject_color: string | null;
}

export interface TodayView {
  date: string;
  day_name: string;
  classes_today: {
    subject_name: string;
    subject_color: string;
    hour: number;
    minute: number;
    duration_hours: number;
    session_type: string;
  }[];
  upcoming_deadlines: {
    id: number;
    name: string;
    activity_type: string;
    status: string;
    priority: string;
    deadline: string | null;
    subject_name: string;
    subject_color: string;
    days_remaining: number | null;
  }[];
  overdue: {
    id: number;
    name: string;
    activity_type: string;
    status: string;
    priority: string;
    deadline: string | null;
    subject_name: string;
    subject_color: string;
    days_remaining: number | null;
  }[];
  reminders_today: {
    id: number;
    title: string;
    description: string;
    remind_at: string;
  }[];
  semester_progress: number;
}

export interface ReminderOut {
  id: number;
  title: string;
  description: string;
  remind_at: string;
  is_triggered: boolean;
  created_at: string;
  activity_id: number | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getSubjects: () => request<SubjectOut[]>('/subjects'),
  getActivities: (subjectId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (subjectId) params.set('subject_id', String(subjectId));
    if (status) params.set('status', status);
    const qs = params.toString();
    return request<ActivityOut[]>(`/activities${qs ? '?' + qs : ''}`);
  },
  updateActivity: (id: number, data: { status?: string; priority?: string; notes?: string }) =>
    request<ActivityOut>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getToday: () => request<TodayView>('/today'),
  getReminders: () => request<ReminderOut[]>('/reminders'),
  createReminder: (data: { title: string; description?: string; remind_at: string; activity_id?: number }) =>
    request<ReminderOut>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  deleteReminder: (id: number) =>
    request<void>(`/reminders/${id}`, { method: 'DELETE' }),
  syncMoodle: (data: { session_cookie: string; sesskey: string }) =>
    request<{ status: string; stats: any; duration: number }>('/sync/moodle', { method: 'POST', body: JSON.stringify(data) }),
  getStudyLogs: () => request<any[]>('/study-logs'),
  createStudyLog: (data: { subject_id: number; duration_minutes: number; notes?: string }) =>
    request<any>('/study-logs', { method: 'POST', body: JSON.stringify(data) }),
};

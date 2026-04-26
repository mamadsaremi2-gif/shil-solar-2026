import { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '../app/store/projectStore';
import { useAuth } from '../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../shared/lib/supabaseClient';

function statusLabel(value) {
  if (value === 'pending') return 'در انتظار تأیید';
  if (value === 'approved') return 'تأیید شده';
  if (value === 'rejected') return 'رد شده';
  if (value === 'blocked') return 'مسدود';
  return value || '—';
}

function roleLabel(value) {
  if (value === 'admin') return 'مدیر';
  if (value === 'expert') return 'کارشناس';
  return 'کاربر';
}

function systemTypeLabel(value) {
  const map = { offgrid: 'Off-Grid', hybrid: 'Hybrid', gridtie: 'Grid-Tie', backup: 'Backup' };
  return map[value] || value || '—';
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function AdminPage() {
  const { goDashboard } = useProjectStore();
  const { profile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  async function loadAdminData() {
    if (!isSupabaseConfigured || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');
    const [profilesResult, eventsResult, projectsResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('usage_events').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('app_projects').select('*').order('updated_at', { ascending: false }).limit(250),
    ]);

    if (profilesResult.error) setMessage(profilesResult.error.message);
    else setProfiles(profilesResult.data || []);

    if (eventsResult.error) setMessage((prev) => prev || eventsResult.error.message);
    else setEvents(eventsResult.data || []);

    if (projectsResult.error) setMessage((prev) => prev || projectsResult.error.message);
    else setProjects(projectsResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  async function updateUser(userId, patch) {
    setMessage('');
    const payload = { ...patch, updated_at: new Date().toISOString() };
    if (patch.status === 'approved') {
      payload.approved_by = profile?.id;
      payload.approved_at = new Date().toISOString();
    }

    const { error } = await supabase.rpc('admin_update_profile', {
      target_user_id: userId,
      next_status: payload.status || null,
      next_role: payload.role || null,
      actor_id: profile?.id || null,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadAdminData();
  }

  const filteredProfiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return profiles.filter((item) => {
      const statusOk = statusFilter === 'all' || item.status === statusFilter;
      const roleOk = roleFilter === 'all' || item.role === roleFilter;
      const textOk = !needle || [item.full_name, item.email, item.phone, item.company, item.request_note]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
      return statusOk && roleOk && textOk;
    });
  }, [profiles, query, statusFilter, roleFilter]);

  const report = useMemo(() => {
    const pending = profiles.filter((item) => item.status === 'pending').length;
    const approved = profiles.filter((item) => item.status === 'approved').length;
    const blocked = profiles.filter((item) => item.status === 'blocked').length;
    const rejected = profiles.filter((item) => item.status === 'rejected').length;
    const admins = profiles.filter((item) => item.role === 'admin').length;
    const activeToday = new Set(events.filter((event) => Date.now() - new Date(event.created_at).getTime() < 24 * 60 * 60 * 1000).map((event) => event.user_id).filter(Boolean)).size;
    const eventsByName = events.reduce((acc, item) => {
      const key = item.event_name || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const eventsByUser = events.reduce((acc, item) => {
      if (!item.user_id) return acc;
      acc[item.user_id] = (acc[item.user_id] || 0) + 1;
      return acc;
    }, {});
    const projectsByType = projects.reduce((acc, item) => {
      const key = item.system_type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return { pending, approved, blocked, rejected, admins, activeToday, eventsByName, eventsByUser, projectsByType };
  }, [profiles, projects, events]);

  function exportUsers() {
    downloadCsv('shil-solar-users.csv', [
      ['name', 'email', 'phone', 'company', 'role', 'status', 'created_at', 'approved_at'],
      ...profiles.map((item) => [item.full_name, item.email, item.phone, item.company, item.role, item.status, item.created_at, item.approved_at]),
    ]);
  }

  function exportProjects() {
    downloadCsv('shil-solar-projects.csv', [
      ['title', 'client_name', 'city', 'system_type', 'status', 'owner_id', 'updated_at', 'created_at'],
      ...projects.map((item) => [item.title, item.client_name, item.city, item.system_type, item.status, item.owner_id, item.updated_at, item.created_at]),
    ]);
  }

  function exportEvents() {
    downloadCsv('shil-solar-usage-events.csv', [
      ['event_name', 'user_id', 'route', 'created_at', 'metadata'],
      ...events.map((item) => [item.event_name, item.user_id, item.route, item.created_at, JSON.stringify(item.metadata || {})]),
    ]);
  }

  if (!isAdmin) {
    return (
      <div className="shell">
        <section className="panel empty-state">
          <strong>دسترسی مدیر لازم است.</strong>
          <button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت</button>
        </section>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button className="btn btn--ghost" type="button" onClick={goDashboard}>بازگشت به برنامه</button>
        <div className="topbar__title">داشبورد مدیریتی SHIL SOLAR</div>
        <button className="btn btn--secondary" type="button" onClick={loadAdminData}>به‌روزرسانی</button>
      </header>

      {message ? <div className="panel admin-message">{message}</div> : null}
      {loading ? <div className="panel empty-state">در حال بارگذاری اطلاعات مدیریتی...</div> : null}

      <section className="metric-grid dashboard-kpi-grid">
        <div className="metric-card"><div className="metric-card__label">در انتظار تأیید</div><div className="metric-card__value">{report.pending}</div></div>
        <div className="metric-card metric-card--green"><div className="metric-card__label">کاربران فعال</div><div className="metric-card__value">{report.approved}</div></div>
        <div className="metric-card metric-card--amber"><div className="metric-card__label">رد / مسدود</div><div className="metric-card__value">{report.rejected + report.blocked}</div></div>
        <div className="metric-card metric-card--purple"><div className="metric-card__label">پروژه‌های سرور</div><div className="metric-card__value">{projects.length}</div></div>
        <div className="metric-card"><div className="metric-card__label">مدیران</div><div className="metric-card__value">{report.admins}</div></div>
        <div className="metric-card metric-card--green"><div className="metric-card__label">کاربران فعال ۲۴ ساعت اخیر</div><div className="metric-card__value">{report.activeToday}</div></div>
      </section>

      <section className="panel admin-toolbar">
        <div>
          <span className="eyebrow">مدیریت کاربران</span>
          <h2>جستجو، تأیید و کنترل دسترسی</h2>
        </div>
        <div className="admin-toolbar__controls">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو نام، ایمیل، شرکت..." />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار تأیید</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="blocked">مسدود</option>
          </select>
          <button className="btn btn--secondary" type="button" onClick={exportUsers}>خروجی کاربران CSV</button>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">همه نقش‌ها</option>
            <option value="user">کاربر</option>
            <option value="expert">کارشناس</option>
            <option value="admin">مدیر</option>
          </select>
          <button className="btn btn--secondary" type="button" onClick={exportProjects}>خروجی پروژه‌ها CSV</button>
          <button className="btn btn--secondary" type="button" onClick={exportEvents}>خروجی گزارش استفاده CSV</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>درخواست‌ها و حساب‌های کاربری</h2>
          <span className="badge">{filteredProfiles.length} از {profiles.length} کاربر</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>کاربر</th><th>تماس</th><th>شرکت / توضیح</th><th>وضعیت</th><th>نقش</th><th>ثبت‌نام</th><th>عملیات</th></tr>
            </thead>
            <tbody>
              {filteredProfiles.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.full_name || '—'}</strong><span>{item.email}</span></td>
                  <td>{item.phone || '—'}</td>
                  <td>{item.company || '—'}<span>{item.request_note || ''}</span></td>
                  <td>{statusLabel(item.status)}</td>
                  <td>{roleLabel(item.role)}</td>
                  <td>{new Date(item.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn btn--secondary btn--sm" onClick={() => updateUser(item.id, { status: 'approved' })}>تأیید</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => updateUser(item.id, { status: 'rejected' })}>رد</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => updateUser(item.id, { status: 'blocked' })}>مسدود</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => updateUser(item.id, { role: item.role === 'expert' ? 'user' : 'expert', status: 'approved' })}>{item.role === 'expert' ? 'کاربر عادی' : 'کارشناس'}</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => updateUser(item.id, { role: item.role === 'admin' ? 'user' : 'admin', status: 'approved' })}>{item.role === 'admin' ? 'حذف مدیر' : 'مدیر کن'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-bottom-grid admin-report-grid">
        <section className="panel">
          <div className="panel__header"><h2>گزارش نوع پروژه‌ها</h2><span className="badge">تحلیل سرور</span></div>
          <div className="summary-list">
            {Object.entries(report.projectsByType).length === 0 ? <div><span>وضعیت</span><strong>هنوز پروژه‌ای روی سرور نیست</strong></div> : null}
            {Object.entries(report.projectsByType).map(([type, count]) => (
              <div key={type}><span>{systemTypeLabel(type)}</span><strong>{count} پروژه</strong></div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><h2>گزارش رفتار کاربران</h2><span className="badge">Usage Analytics</span></div>
          <div className="summary-list">
            {Object.entries(report.eventsByName).slice(0, 8).map(([name, count]) => (
              <div key={name}><span>{name}</span><strong>{count} بار</strong></div>
            ))}
            {Object.keys(report.eventsByName).length === 0 ? <div><span>وضعیت</span><strong>هنوز گزارشی ثبت نشده است</strong></div> : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><h2>آخرین رویدادهای استفاده</h2><span className="badge">{events.length} رویداد</span></div>
          <div className="admin-table-wrap admin-table-wrap--compact">
            <table className="admin-table">
              <thead><tr><th>رویداد</th><th>مسیر</th><th>زمان</th></tr></thead>
              <tbody>
                {events.slice(0, 40).map((event) => (
                  <tr key={event.id}><td>{event.event_name}</td><td>{event.route || '—'}</td><td>{new Date(event.created_at).toLocaleString('fa-IR')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="panel__header"><h2>آخرین پروژه‌های ذخیره‌شده روی سرور</h2><span className="badge">{projects.length} پروژه</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>عنوان</th><th>کارفرما</th><th>شهر</th><th>نوع</th><th>وضعیت</th><th>آخرین تغییر</th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.title}</td>
                  <td>{project.client_name || '—'}</td>
                  <td>{project.city || '—'}</td>
                  <td>{systemTypeLabel(project.system_type)}</td>
                  <td>{project.status || '—'}</td>
                  <td>{new Date(project.updated_at).toLocaleString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

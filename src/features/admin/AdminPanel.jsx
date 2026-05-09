import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fa-IR");
  } catch {
    return "-";
  }
}

function getProjectCalculation(project) {
  const raw = project.project_data?.calculation || {};

  return {
    systemPower: project.system_power ?? raw.systemSizeKW ?? "-",
    panelCount: project.panel_count ?? raw.panels ?? "-",
    batteryCapacity: project.battery_capacity ?? raw.batteryCapacity ?? "-",
    dailyConsumption: project.daily_consumption ?? raw.dailyConsumptionKWh ?? "-",
    sunHours: project.sun_hours ?? raw.sunHours ?? "-",
  };
}

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);

    const profilesResult = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const projectsResult = await supabase
      .from("app_projects")
      .select("*")
      .order("created_at", { ascending: false });

    const eventsResult = await supabase
      .from("usage_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profilesResult.error) {
      console.error("خطا در دریافت کاربران:", profilesResult.error);
    } else {
      setUsers(profilesResult.data || []);
    }

    if (projectsResult.error) {
      console.error("خطا در دریافت پروژه‌ها:", projectsResult.error);
    } else {
      setProjects(projectsResult.data || []);
    }

    if (eventsResult.error) {
      console.error("خطا در دریافت لاگ‌ها:", eventsResult.error);
    } else {
      setEvents(eventsResult.data || []);
    }

    setLoading(false);
  };

  const approveUser = async (userId) => {
    const { error } = await supabase.rpc("admin_update_profile", {
      target_user_id: userId,
      next_status: "approved",
      next_role: null,
      actor_id: null,
    });

    if (error) {
      console.error(error);
      alert("خطا در فعال‌سازی کاربر");
      return;
    }

    loadAdminData();
  };

  const blockUser = async (userId) => {
    const { error } = await supabase.rpc("admin_update_profile", {
      target_user_id: userId,
      next_status: "blocked",
      next_role: null,
      actor_id: null,
    });

    if (error) {
      console.error(error);
      alert("خطا در مسدود کردن کاربر");
      return;
    }

    loadAdminData();
  };

  const makeAdmin = async (userId) => {
    const { error } = await supabase.rpc("admin_update_profile", {
      target_user_id: userId,
      next_status: "approved",
      next_role: "admin",
      actor_id: null,
    });

    if (error) {
      console.error(error);
      alert("خطا در تبدیل کاربر به ادمین");
      return;
    }

    loadAdminData();
  };

  const makeUser = async (userId) => {
    const { error } = await supabase.rpc("admin_update_profile", {
      target_user_id: userId,
      next_status: "approved",
      next_role: "user",
      actor_id: null,
    });

    if (error) {
      console.error(error);
      alert("خطا در تبدیل به کاربر عادی");
      return;
    }

    loadAdminData();
  };

  const deleteProject = async (projectId) => {
    const confirmDelete = window.confirm("آیا از حذف این پروژه مطمئن هستید؟");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("app_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error(error);
      alert("خطا در حذف پروژه");
      return;
    }

    loadAdminData();
  };

  const realProjects = useMemo(() => {
    return projects.filter((project) => project.status !== "draft");
  }, [projects]);

  const quickCalculations = useMemo(() => {
    return projects.filter((project) => project.status === "draft");
  }, [projects]);

  const analytics = useMemo(() => {
    const calculationEvents = events.filter(
      (event) => event.event_name === "solar_calculation_saved"
    );

    const uniqueUsers = new Set(events.map((event) => event.user_id).filter(Boolean));

    const totalSystemPower = quickCalculations.reduce((sum, project) => {
      const value = Number(project.system_power || 0);
      return sum + value;
    }, 0);

    const averageSystemPower =
      quickCalculations.length > 0
        ? (totalSystemPower / quickCalculations.length).toFixed(2)
        : "0";

    return {
      totalUsers: users.length,
      totalProjects: projects.length,
      realProjects: realProjects.length,
      quickCalculations: quickCalculations.length,
      calculationEvents: calculationEvents.length,
      activeUsers: uniqueUsers.size,
      averageSystemPower,
    };
  }, [events, projects, quickCalculations, realProjects, users]);

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <section className="card">
        <h2>پنل مدیریت</h2>
        <p>در حال بارگذاری اطلاعات مدیریت...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>پنل مدیریت SHIL SOLAR</h2>

      <div className="admin-stats">
        <div className="project-item">
          <strong>{analytics.totalUsers}</strong>
          <div>کل کاربران</div>
        </div>

        <div className="project-item">
          <strong>{analytics.totalProjects}</strong>
          <div>کل رکوردهای پروژه</div>
        </div>

        <div className="project-item">
          <strong>{analytics.quickCalculations}</strong>
          <div>محاسبات سریع</div>
        </div>

        <div className="project-item">
          <strong>{analytics.realProjects}</strong>
          <div>پروژه‌های واقعی</div>
        </div>

        <div className="project-item">
          <strong>{analytics.activeUsers}</strong>
          <div>کاربران فعال در لاگ‌ها</div>
        </div>

        <div className="project-item">
          <strong>{analytics.averageSystemPower} kW</strong>
          <div>میانگین توان سیستم</div>
        </div>
      </div>

      <hr />

      <h3>کاربران</h3>

      {users.length === 0 && <p>کاربری ثبت نشده است.</p>}

      {users.map((user) => (
        <div className="project-item" key={user.id}>
          <strong>{user.email || "بدون ایمیل"}</strong>

          <div>نام: {user.full_name || "-"}</div>
          <div>موبایل: {user.phone || "-"}</div>
          <div>شرکت: {user.company || "-"}</div>
          <div>نقش: {user.role || "user"}</div>
          <div>وضعیت: {user.status || "pending"}</div>
          <small>ثبت‌نام: {formatDate(user.created_at)}</small>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => approveUser(user.id)}>
              فعال‌سازی
            </button>

            <button type="button" onClick={() => blockUser(user.id)}>
              مسدود کردن
            </button>

            <button type="button" onClick={() => makeAdmin(user.id)}>
              تبدیل به ادمین
            </button>

            <button type="button" onClick={() => makeUser(user.id)}>
              کاربر عادی
            </button>
          </div>
        </div>
      ))}

      <hr />

      <h3>پروژه‌های واقعی</h3>

      {realProjects.length === 0 && <p>پروژه واقعی ثبت نشده است.</p>}

      {realProjects.map((project) => {
        const calc = getProjectCalculation(project);

        return (
          <div className="project-item" key={project.id}>
            <strong>{project.title}</strong>

            <div>{project.client_name || "بدون نام مشتری"}</div>
            <div>{project.city || "شهر ثبت نشده"}</div>
            <div>وضعیت: {project.status || "-"}</div>

            <small>
              توان: {calc.systemPower} kW | پنل: {calc.panelCount} عدد | باتری:{" "}
              {calc.batteryCapacity} Ah | مصرف: {calc.dailyConsumption} kWh |
              تابش: {calc.sunHours} ساعت
            </small>

            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => deleteProject(project.id)}>
                حذف پروژه
              </button>
            </div>
          </div>
        );
      })}

      <hr />

      <h3>محاسبات سریع کاربران</h3>

      {quickCalculations.length === 0 && <p>محاسبه سریعی ثبت نشده است.</p>}

      {quickCalculations.map((project) => {
        const calc = getProjectCalculation(project);

        return (
          <div className="project-item" key={project.id}>
            <strong>{project.title || "محاسبه سریع"}</strong>

            <div>{project.client_name || "بدون نام مشتری"}</div>
            <div>{project.city || "شهر ثبت نشده"}</div>

            <small>
              توان: {calc.systemPower} kW | پنل: {calc.panelCount} عدد | باتری:{" "}
              {calc.batteryCapacity} Ah | مصرف: {calc.dailyConsumption} kWh |
              تابش: {calc.sunHours} ساعت
            </small>

            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => deleteProject(project.id)}>
                حذف محاسبه
              </button>
            </div>
          </div>
        );
      })}

      <hr />

      <h3>لاگ‌های اخیر استفاده</h3>

      {events.length === 0 && <p>هنوز لاگی ثبت نشده است.</p>}

      {events.map((event) => (
        <div className="project-item" key={event.id}>
          <strong>{event.event_name}</strong>

          <div>مسیر: {event.route || "-"}</div>
          <div>کاربر: {event.user_id || "ناشناس"}</div>

          <small>{formatDate(event.created_at)}</small>

          {event.metadata && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                direction: "ltr",
                textAlign: "left",
                marginTop: 10,
                background: "rgba(255,255,255,0.05)",
                padding: 10,
                borderRadius: 10,
              }}
            >
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </section>
  );
}
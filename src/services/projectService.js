import { supabase } from "../lib/supabase";
import { logEvent } from "./analyticsService";

// گرفتن پروژه‌ها
export async function getProjects() {
  const { data, error } = await supabase
    .from("app_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطا در دریافت پروژه‌ها:", error);
    return [];
  }

  return data || [];
}

// ساخت پروژه
export async function createProject(project) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("کاربر وارد نشده است:", userError);
    return null;
  }

  const payload = {
    ...project,
    owner_id: user.id,
  };

  const { data, error } = await supabase
    .from("app_projects")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("خطا در ذخیره پروژه:", error);
    return null;
  }

  // 🔥 لاگ گرفتن
  logEvent("create_project", {
    title: project.title,
  });

  return data;
}

// آپدیت پروژه
export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from("app_projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("خطا در بروزرسانی پروژه:", error);
    return null;
  }

  logEvent("update_project", { id });

  return data;
}

// حذف پروژه
export async function deleteProject(id) {
  const { error } = await supabase
    .from("app_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("خطا در حذف پروژه:", error);
    return false;
  }

  logEvent("delete_project", { id });

  return true;
}
import { getSupabaseClient, isSupabaseConfigured } from "../shared/lib/supabaseLazy";
import { logEvent } from "./analyticsService";

async function getClient() {
  if (!isSupabaseConfigured) return null;
  return getSupabaseClient();
}

// گرفتن پروژه‌ها
export async function getProjects() {
  const supabase = await getClient();
  if (!supabase) return [];

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
  const supabase = await getClient();
  if (!supabase) return null;

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

  void logEvent("create_project", {
    title: project.title,
  });

  return data;
}

// آپدیت پروژه
export async function updateProject(id, updates) {
  const supabase = await getClient();
  if (!supabase) return null;

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

  void logEvent("update_project", { id });

  return data;
}

// حذف پروژه
export async function deleteProject(id) {
  const supabase = await getClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("app_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("خطا در حذف پروژه:", error);
    return false;
  }

  void logEvent("delete_project", { id });

  return true;
}

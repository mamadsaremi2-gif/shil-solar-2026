import { supabase } from "../lib/supabase";

export async function logEvent(eventName, metadata = {}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id || null,
      event_name: eventName,
      route: window.location.pathname,
      metadata,
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase.from("usage_events").insert([payload]);

    if (error) {
      console.warn("خطا در ثبت لاگ:", error.message);
    }
  } catch (error) {
    console.warn("Analytics error:", error.message);
  }
}
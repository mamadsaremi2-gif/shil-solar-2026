import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.fullName || "").trim();
    const phone = String(body?.phone || "").trim();
    const company = String(body?.company || "").trim();
    const authType = String(body?.authType || "email").trim();
    const role = String(body?.role || "user").trim();
    const status = String(body?.status || "active").trim();
    const at = body?.at || new Date().toISOString();

    if (!userId || !fullName) {
      return new Response(JSON.stringify({ ok: false, error: "missing_user_data" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmail = Deno.env.get("SHIL_ADMIN_EMAIL") || "";
    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("SHIL_FROM_EMAIL") || "SHIL <onboarding@resend.dev>";

    const admin = createClient(url, serviceKey);

    const { data: old } = await admin
      .from("shil_user_directory")
      .select("first_seen_at,login_count")
      .eq("user_id", userId)
      .maybeSingle();

    const { error: upsertError } = await admin.from("shil_user_directory").upsert({
      user_id: userId,
      email: email || null,
      full_name: fullName,
      phone: phone || null,
      company: company || null,
      auth_type: authType,
      role,
      status,
      first_seen_at: old?.first_seen_at || at,
      last_seen_at: at,
      login_count: Number(old?.login_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    const { error: eventError } = await admin.from("shil_login_events").insert({
      user_id: userId,
      email: email || null,
      full_name: fullName,
      phone: phone || null,
      company: company || null,
      auth_type: authType,
      created_at: at,
    });
    if (eventError) throw eventError;

    let emailSent = false;
    if (role !== "admin" && adminEmail && resendKey) {
      const message = [
        `نام: ${fullName}`,
        `ایمیل: ${email || "ثبت نشده"}`,
        `تلفن: ${phone || "ثبت نشده"}`,
        `مجموعه: ${company || "ثبت نشده"}`,
        `نوع ورود: ${authType === "guest" ? "آزمایشی" : "ایمیل/پسورد"}`,
        `زمان ورود: ${at}`,
      ].join("\n");

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: `ورود کاربر به SHIL - ${fullName}`,
          text: message,
        }),
      });
      emailSent = r.ok;
    }

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || String(error) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

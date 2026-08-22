import { supabase } from "../db/supabaseClient.js";

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.session?.access_token) {
    localStorage.setItem("shil-token", data.session.access_token);
  }

  return data;
}

export async function signOut() {
  localStorage.removeItem("shil-token");
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;

  return data.user;
}

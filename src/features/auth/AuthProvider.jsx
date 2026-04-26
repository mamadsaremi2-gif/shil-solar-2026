import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../shared/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Profile error:", error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!isSupabaseConfigured) {
          if (!mounted) return;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth session error:", error);
          if (!mounted) return;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const currentUser = data?.session?.user ?? null;

        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }

        if (mounted) setLoading(false);
      } catch (err) {
        console.error("Fatal auth error:", err);
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }

    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.href = "/";
  }

  const isAdmin = profile?.role === "admin" && profile?.status === "approved";
  const isApproved = profile?.status === "approved";

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin,
      isApproved,
      signOut,
      refreshProfile: () => loadProfile(user),
    }),
    [user, profile, loading, isAdmin, isApproved]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
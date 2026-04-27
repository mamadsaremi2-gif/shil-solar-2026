import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabaseClient';

const AuthContext = createContext(null);

const DEV_PROFILE = {
  id: 'local-dev',
  email: 'local@shil-solar.app',
  full_name: 'مدیر محلی',
  phone: '',
  company: 'SHIL',
  role: 'admin',
  status: 'approved',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(isSupabaseConfigured ? null : DEV_PROFILE);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  async function loadProfile(userId) {
    if (!isSupabaseConfigured || !userId) {
      setProfile(DEV_PROFILE);
      return DEV_PROFILE;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load failed', error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user?.id) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!isSupabaseConfigured) return { ok: true };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function signUp({ email, password, fullName, phone, company, requestNote }) {
    if (!isSupabaseConfigured) return { ok: true };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          company,
          request_note: requestNote,
        },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setProfile(isSupabaseConfigured ? null : DEV_PROFILE);
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || (isSupabaseConfigured ? null : { id: DEV_PROFILE.id, email: DEV_PROFILE.email }),
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    isAdmin: profile?.role === 'admin' && profile?.status === 'approved',
    isApproved: profile?.status === 'approved',
    isPending: profile?.status === 'pending',
    isRejected: profile?.status === 'rejected' || profile?.status === 'blocked',
    signIn,
    signUp,
    signOut,
    reloadProfile: () => loadProfile(session?.user?.id),
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

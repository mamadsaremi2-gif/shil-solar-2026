import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../shared/lib/supabaseLazy';

const AuthContext = createContext(null);
const LOCAL_SESSION_KEY = 'shil_local_admin_session';
const OFFLINE_SESSION_KEY = 'shil_offline_session';

const DEV_PROFILE = {
  id: 'local-dev',
  email: 'local@shil-solar.app',
  full_name: 'کاربر محلی',
  phone: '',
  company: 'SHIL',
  role: 'admin',
  status: 'approved',
};

function getStoredLocalSession() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_SESSION_KEY) === '1' || localStorage.getItem(OFFLINE_SESSION_KEY) === '1'
    ? { user: { id: DEV_PROFILE.id, email: DEV_PROFILE.email } }
    : null;
}

function getStoredLocalProfile() {
  return getStoredLocalSession() ? DEV_PROFILE : null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => (!isSupabaseConfigured ? getStoredLocalSession() : getStoredLocalSession()));
  const [profile, setProfile] = useState(() => (!isSupabaseConfigured ? getStoredLocalProfile() : getStoredLocalProfile()));
  const [loading, setLoading] = useState(isSupabaseConfigured && !getStoredLocalSession());
  const [isOfflineMode, setIsOfflineMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem(OFFLINE_SESSION_KEY) === '1');

  async function loadProfile(userId) {
    if (!isSupabaseConfigured || !userId || isOfflineMode) {
      setProfile(DEV_PROFILE);
      return DEV_PROFILE;
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
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
    if (!isSupabaseConfigured || isOfflineMode || localStorage.getItem(LOCAL_SESSION_KEY) === '1') {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    let subscriptionRef = null;

    getSupabaseClient()
      .then((supabase) => {
        if (!mounted || !supabase) return;

        supabase.auth.getSession().then(async ({ data }) => {
          if (!mounted) return;
          setSession(data.session);
          if (data.session?.user?.id) await loadProfile(data.session.user.id);
          setLoading(false);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (!mounted) return;
          setSession(nextSession);
          if (nextSession?.user?.id) {
            await loadProfile(nextSession.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });

        subscriptionRef = subscription;
      })
      .catch((error) => {
        console.error('Supabase auth init failed', error);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscriptionRef?.subscription?.unsubscribe();
    };
  }, [isOfflineMode]);

  async function signIn(email, password) {
    if (!email || !password) return { ok: false, error: 'ایمیل و رمز عبور را وارد کنید.' };

    if (!isSupabaseConfigured || isOfflineMode || !navigator.onLine) {
      localStorage.setItem(LOCAL_SESSION_KEY, '1');
      const nextProfile = { ...DEV_PROFILE, email };
      setSession({ user: { id: DEV_PROFILE.id, email } });
      setProfile(nextProfile);
      setLoading(false);
      return { ok: true };
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function signUp({ email, password, fullName, phone, company, requestNote }) {
    if (!isSupabaseConfigured || isOfflineMode || !navigator.onLine) {
      return signIn(email, password);
    }
    const supabase = await getSupabaseClient();
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

  function enterOfflineMode() {
    localStorage.setItem(OFFLINE_SESSION_KEY, '1');
    localStorage.setItem(LOCAL_SESSION_KEY, '1');
    setIsOfflineMode(true);
    setSession({ user: { id: DEV_PROFILE.id, email: DEV_PROFILE.email } });
    setProfile(DEV_PROFILE);
    setLoading(false);
  }

  async function signOut() {
    if (isSupabaseConfigured && !isOfflineMode) {
      const supabase = await getSupabaseClient();
      await supabase?.auth?.signOut();
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    localStorage.removeItem(OFFLINE_SESSION_KEY);
    setIsOfflineMode(false);
    setSession(null);
    setProfile(null);
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || (isSupabaseConfigured ? null : { id: DEV_PROFILE.id, email: DEV_PROFILE.email }),
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    isOfflineMode,
    isAdmin: profile?.role === 'admin' && profile?.status === 'approved',
    isApproved: profile?.status === 'approved',
    isPending: profile?.status === 'pending',
    isRejected: profile?.status === 'rejected' || profile?.status === 'blocked',
    signIn,
    signUp,
    signOut,
    enterOfflineMode,
    reloadProfile: () => loadProfile(session?.user?.id),
  }), [session, profile, loading, isOfflineMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../shared/lib/supabaseLazy';

const AuthContext = createContext(null);
const LOCAL_SESSION_KEY = 'shil_local_admin_session';
const OFFLINE_SESSION_KEY = 'shil_offline_session';

const ADMIN_EMAILS = (import.meta.env.VITE_SHIL_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const DEV_PROFILE = {
  id: 'local-dev',
  email: 'local@shil-solar.app',
  full_name: 'کاربر محلی',
  phone: '',
  company: 'SHIL',
  role: 'user',
  status: 'approved',
};

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(String(email).trim().toLowerCase()));
}

function getStoredLocalSession() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_SESSION_KEY) === '1' || localStorage.getItem(OFFLINE_SESSION_KEY) === '1'
    ? { user: { id: DEV_PROFILE.id, email: DEV_PROFILE.email } }
    : null;
}

function getStoredLocalProfile() {
  if (!getStoredLocalSession()) return null;
  const offline = typeof window !== 'undefined' && localStorage.getItem(OFFLINE_SESSION_KEY) === '1';
  const email = typeof window !== 'undefined' ? (localStorage.getItem('shil_active_email') || DEV_PROFILE.email) : DEV_PROFILE.email;
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('shil_active_role') : null;
  const role = offline ? 'user' : (storedRole || (isAdminEmail(email) ? 'admin' : 'user'));
  return { ...DEV_PROFILE, email, role, full_name: role === 'admin' ? 'مدیر' : 'کاربر محلی' };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => (!isSupabaseConfigured ? getStoredLocalSession() : getStoredLocalSession()));
  const [profile, setProfile] = useState(() => (!isSupabaseConfigured ? getStoredLocalProfile() : getStoredLocalProfile()));
  const [loading, setLoading] = useState(isSupabaseConfigured && !getStoredLocalSession());
  const [isOfflineMode, setIsOfflineMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem(OFFLINE_SESSION_KEY) === '1');

  async function loadProfile(userId) {
    if (!isSupabaseConfigured || !userId || isOfflineMode) {
      const email = session?.user?.email || localStorage.getItem('shil_active_email') || DEV_PROFILE.email;
      const role = isOfflineMode ? 'user' : (isAdminEmail(email) ? 'admin' : 'user');
      const localProfile = { ...DEV_PROFILE, email, role, full_name: role === 'admin' ? 'مدیر' : 'کاربر محلی' };
      setProfile(localProfile);
      return localProfile;
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      setProfile({ ...DEV_PROFILE, role: 'user', full_name: 'کاربر محلی' });
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
      localStorage.setItem('shil_active_email', email);
      const role = (!isOfflineMode && navigator.onLine && isAdminEmail(email)) ? 'admin' : 'user';
      localStorage.setItem('shil_active_role', role);
      const nextProfile = { ...DEV_PROFILE, email, role, full_name: role === 'admin' ? 'مدیر' : 'کاربر محلی' };
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
    setProfile({ ...DEV_PROFILE, role: 'user', full_name: 'کاربر محلی' });
    setLoading(false);
  }

  function switchRole(role) {
    const nextProfile = { ...(profile || DEV_PROFILE), role: role === 'admin' ? 'admin' : 'user', status: 'approved', full_name: role === 'admin' ? 'مدیر' : 'کاربر محلی' };
    localStorage.setItem(LOCAL_SESSION_KEY, '1');
    if (!isOfflineMode) localStorage.setItem('shil_active_role', nextProfile.role);
    setSession((prev) => prev || { user: { id: DEV_PROFILE.id, email: DEV_PROFILE.email } });
    setProfile(nextProfile);
  }

  async function signOut() {
    try {
      if (isSupabaseConfigured && !isOfflineMode) {
        const supabase = await getSupabaseClient();
        await supabase?.auth?.signOut();
      }
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      localStorage.removeItem(OFFLINE_SESSION_KEY);
      localStorage.removeItem('shil_active_email');
      localStorage.removeItem('shil_active_role');
      setIsOfflineMode(false);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    isOfflineMode,
    isAdmin: !isOfflineMode && profile?.role === 'admin' && profile?.status === 'approved',
    isApproved: profile?.status === 'approved',
    isPending: profile?.status === 'pending',
    isRejected: profile?.status === 'rejected' || profile?.status === 'blocked',
    signIn,
    signUp,
    signOut,
    enterOfflineMode,
    switchRole,
    reloadProfile: () => loadProfile(session?.user?.id),
  }), [session, profile, loading, isOfflineMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

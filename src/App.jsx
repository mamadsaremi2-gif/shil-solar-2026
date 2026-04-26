import { useEffect, useState } from "react";
import LoginPage from "./features/auth/LoginPage";
import { supabase } from "./shared/lib/supabaseClient";
import { App as MainApp } from "./app/App";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="shell">
        <div className="panel empty-state">در حال بررسی ورود...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <MainApp />;
}
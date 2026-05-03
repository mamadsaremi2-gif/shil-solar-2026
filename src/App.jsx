import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    client: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const saved = localStorage.getItem("projects");
      setProjects(saved ? JSON.parse(saved) : []);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setProjects([]);
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  };

  const addProject = async (e) => {
    e.preventDefault();

    if (!form.title) return;

    const newProject = {
      title: form.title,
      client: form.client,
    };

    if (!isSupabaseConfigured || !supabase) {
      const local = {
        id: crypto.randomUUID(),
        ...newProject,
      };

      const updated = [local, ...projects];
      setProjects(updated);
      localStorage.setItem("projects", JSON.stringify(updated));
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()
        .single();

      if (!error) {
        setProjects([data, ...projects]);
      }
    }

    setForm({ title: "", client: "" });
  };

  if (loading) return <p>در حال بارگذاری...</p>;

  return (
    <div dir="rtl" style={{ padding: 20 }}>
      <h1>SHIL SOLAR</h1>

      <form onSubmit={addProject}>
        <input
          placeholder="عنوان پروژه"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <input
          placeholder="مشتری"
          value={form.client}
          onChange={(e) =>
            setForm({ ...form, client: e.target.value })
          }
        />

        <button type="submit">ثبت پروژه</button>
      </form>

      <hr />

      <h2>پروژه‌ها</h2>

      {projects.length === 0 && <p>پروژه‌ای نیست</p>}

      {projects.map((p) => (
        <div key={p.id}>
          <h3>{p.title}</h3>
          <p>{p.client}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
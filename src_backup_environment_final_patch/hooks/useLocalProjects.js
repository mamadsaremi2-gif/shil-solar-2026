import { useEffect, useState } from "react";

export default function useLocalProjects() {

  const [projects, setProjects] =
    useState([]);

  useEffect(() => {

    const stored =
      JSON.parse(
        localStorage.getItem(
          "shil-projects"
        ) || "[]"
      );

    setProjects(stored);

  }, []);

  return {
    projects,
    setProjects,
  };
}

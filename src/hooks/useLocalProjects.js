import * as React from "react";

export default function useLocalProjects() {

  const [projects, setProjects] =
    React.useState([]);

  React.useEffect(() => {

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

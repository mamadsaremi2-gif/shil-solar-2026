import { useEffect } from "react";

export default function useDraftSave(key, data) {
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);
}

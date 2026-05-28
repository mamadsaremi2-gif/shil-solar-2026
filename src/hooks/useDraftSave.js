import * as React from "react";

export default function useDraftSave(key, data) {
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);
}

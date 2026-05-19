import { useEffect, useState } from "react";

export function useDarkMode() {

  const [dark, setDark] =
    useState(true);

  useEffect(() => {

    document.body.dataset.theme =
      dark ? "dark" : "light";

  }, [dark]);

  return {
    dark,
    setDark,
  };
}

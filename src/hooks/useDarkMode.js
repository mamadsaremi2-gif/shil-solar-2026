import * as React from "react";

export function useDarkMode() {

  const [dark, setDark] =
    React.useState(true);

  React.useEffect(() => {

    document.body.dataset.theme =
      dark ? "dark" : "light";

  }, [dark]);

  return {
    dark,
    setDark,
  };
}

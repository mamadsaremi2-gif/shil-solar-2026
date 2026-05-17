export function syncShilRouteClass() {
  const apply = () => {
    document.body.className = document.body.className
      .split(" ")
      .filter((x) => !x.startsWith("shil-route-"))
      .join(" ");

    const path = window.location.pathname || "/";
    let route = "login";

    if (path.includes("/welcome")) route = "welcome";
    else if (path.includes("/dashboard")) route = "dashboard";
    else if (path.includes("/new-project")) route = "new-project";
    else if (path.includes("/projects")) route = "projects";
    else if (path.includes("/contact")) route = "contact";
    else if (path.includes("/feedback")) route = "feedback";
    else if (path.includes("/assistant")) route = "assistant";
    else if (path.includes("/education")) route = "education";

    document.body.classList.add("shil-route-" + route);
  };

  apply();

  window.addEventListener("popstate", apply);

  const oldPush = history.pushState;
  history.pushState = function (...args) {
    oldPush.apply(this, args);
    setTimeout(apply, 0);
  };
}

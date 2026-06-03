
/* SHIL - Ensure Welcome appears after Login before Dashboard
   This guard catches immediate post-login dashboard redirects and sends
   the user to an existing welcome route once per login/session. */
(function () {
  var WELCOME_SEEN_KEY = "shil_welcome_seen_after_login_v2";
  var CANDIDATE_WELCOME_PATHS = ["/welcome", "/Welcome", "/app/welcome", "/shil/welcome"];

  function pathText() {
    return ((window.location.pathname || "") + " " + (window.location.hash || "")).toLowerCase();
  }

  function isAuthPath() {
    var p = pathText();
    return p.indexOf("login") !== -1 || p.indexOf("signin") !== -1 || p.indexOf("auth") !== -1;
  }

  function isDashboardPath() {
    var p = pathText();
    return p.indexOf("dashboard") !== -1 || p === "/" || p.indexOf("#/") !== -1;
  }

  function isWelcomePath() {
    return pathText().indexOf("welcome") !== -1;
  }

  function markLoginFlow() {
    try {
      sessionStorage.setItem("shil_login_flow_active", "1");
      sessionStorage.removeItem(WELCOME_SEEN_KEY);
    } catch (e) {}
  }

  function hasLoginFlow() {
    try {
      return sessionStorage.getItem("shil_login_flow_active") === "1";
    } catch (e) {
      return false;
    }
  }

  function markWelcomeSeen() {
    try {
      sessionStorage.setItem(WELCOME_SEEN_KEY, "1");
      sessionStorage.removeItem("shil_login_flow_active");
    } catch (e) {}
  }

  function welcomeWasSeen() {
    try {
      return sessionStorage.getItem(WELCOME_SEEN_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function goWelcome() {
    if (isWelcomePath()) return;

    var target = CANDIDATE_WELCOME_PATHS[0];

    // Respect hash router if the app uses it.
    if ((window.location.hash || "").startsWith("#/")) {
      target = "/#/welcome";
    }

    try {
      history.replaceState(history.state, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
      setTimeout(function () {
        if (!isWelcomePath()) window.location.assign(target);
      }, 80);
    } catch (e) {
      window.location.href = target;
    }
  }

  function syncWelcomeFlow() {
    if (isAuthPath()) {
      markLoginFlow();
      return;
    }

    if (isWelcomePath()) {
      markWelcomeSeen();
      return;
    }

    // Only intercept right after a login path was visited in this browser session.
    if (hasLoginFlow() && !welcomeWasSeen() && isDashboardPath()) {
      goWelcome();
    }
  }

  syncWelcomeFlow();

  window.addEventListener("popstate", syncWelcomeFlow);
  window.addEventListener("hashchange", syncWelcomeFlow);

  var pushState = history.pushState;
  var replaceState = history.replaceState;

  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    setTimeout(syncWelcomeFlow, 0);
    return result;
  };

  history.replaceState = function () {
    var result = replaceState.apply(this, arguments);
    setTimeout(syncWelcomeFlow, 0);
    return result;
  };
})();

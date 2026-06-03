
/* SHIL auth-page body class helper */
(function () {
  function syncShilPageClass() {
    try {
      var path = (window.location.pathname || "").toLowerCase();
      var hash = (window.location.hash || "").toLowerCase();
      var full = path + " " + hash;
      var isWelcome = full.indexOf("welcome") !== -1 || full.indexOf("splash") !== -1;
      var isLogin = !isWelcome && (full.indexOf("login") !== -1 || full.indexOf("signin") !== -1 || full.indexOf("auth") !== -1);
      document.body.classList.toggle("login-page", isLogin);
      document.body.classList.toggle("welcome-page", isWelcome);
    } catch (e) {}
  }
  syncShilPageClass();
  window.addEventListener("popstate", syncShilPageClass);
  window.addEventListener("hashchange", syncShilPageClass);
  var pushState = history.pushState;
  var replaceState = history.replaceState;
  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    setTimeout(syncShilPageClass, 0);
    return result;
  };
  history.replaceState = function () {
    var result = replaceState.apply(this, arguments);
    setTimeout(syncShilPageClass, 0);
    return result;
  };
})();

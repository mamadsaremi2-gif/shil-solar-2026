export function createStore(initialState = {}) {
  let state = structuredCloneSafe(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater, action = "anonymous") {
    const nextState = typeof updater === "function" ? updater(state) : updater;
    state = structuredCloneSafe({ ...state, ...nextState, meta: { ...(state.meta || {}), lastAction: action, updatedAt: new Date().toISOString() } });
    listeners.forEach((listener) => listener(state));
    return state;
  }

  function reset(nextInitialState = initialState) {
    state = structuredCloneSafe(nextInitialState);
    listeners.forEach((listener) => listener(state));
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, reset, subscribe };
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

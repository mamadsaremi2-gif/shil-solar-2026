// SHIL V25.8
// Compatibility entrypoint: the canonical emergency settings implementation lives
// under pages/project. Keeping this shim prevents any legacy import from loading
// the retired flat-protection implementation.
export { default } from "./project/EmergencySystemSettings.jsx";

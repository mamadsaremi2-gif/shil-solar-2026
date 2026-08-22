import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const push = (ok, label, detail="") => checks.push({ok, label, detail});

function exists(p){ return fs.existsSync(path.join(root,p)); }
function read(p){ return fs.readFileSync(path.join(root,p),"utf8"); }

push(exists("package.json"), "package.json");
push(exists("vite.config.js"), "Vite config");
push(exists("public/icon-192.png"), "PWA 192 icon");
push(exists("public/icon-512.png"), "PWA 512 icon");
push(exists("public/pwa-icons/icon-maskable-512.png"), "PWA maskable icon");
push(exists("public/apple-touch-icon.png") || exists("public/pwa-icons/apple-touch-icon.png"), "Apple touch icon");
push(exists("vercel.json") || exists("netlify.toml"), "SPA hosting fallback");
push(exists("src/components/pwa/InstallAppPrompt.jsx"), "Android install prompt component");

if (exists("vite.config.js")) {
  const v = read("vite.config.js");
  push(v.includes("VitePWA"), "vite-plugin-pwa configured");
  push(v.includes('enabled: false'), "PWA disabled in local dev", "avoids stale service-worker UI during development");
  push(v.includes('navigateFallback: "/index.html"'), "SPA navigation fallback in service worker");
}

const envPresent = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);
push(envPresent, "Supabase production env", envPresent ? "present" : "set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on host");

console.log("\nSHIL Beta Readiness\n-------------------");
for (const c of checks) console.log(`${c.ok ? "OK " : "!! "} ${c.label}${c.detail ? " - "+c.detail : ""}`);

const hard = checks.filter(c => !c.ok && c.label !== "Supabase production env");
if (hard.length) {
  console.error(`\n${hard.length} required check(s) failed.`);
  process.exit(1);
}
console.log("\nLocal project structure is beta-ready.");
if (!envPresent) console.log("Hosting is not ready until Supabase env variables are added.");

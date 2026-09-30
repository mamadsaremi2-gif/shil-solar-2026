# SHIL v16.6 - Login Glass UI Update

## Changes
- Login card is now centered on the page on desktop and mobile.
- Card uses a lighter glassmorphism treatment so the solar background remains visible.
- Replaced the text-only SHIL title with the existing SHIL IRAN application logo (`src/assets/logos/shil-main-logo.png`).
- Reduced visual density and tightened spacing for a more minimal login experience.
- Preserved email/password login, remember-me, password visibility toggle, and guest login behavior.
- Replaced the long footer copy with:
  `جهت ارتباط با پشتیبانی از بخش آزمایشی وارد شوید و اطلاعات خود را ثبت کنید.`
- Added stronger local CSS specificity and `!important` guards so older global mobile/login patches do not pull the login card down or override the glass appearance.

## Modified file
- `src/pages/LoginPage.jsx`

## Build note
`node_modules` is not bundled in the source package, so a local build was not executed in the packaging environment. Run `npm install` (or `npm ci` when the lockfile is authoritative) and then `npm run build` in your local project.

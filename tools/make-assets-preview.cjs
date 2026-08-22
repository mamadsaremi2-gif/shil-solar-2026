const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "public", "assets");
const exts = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) return walk(full);
    if (exts.includes(path.extname(item.name).toLowerCase())) {
      return [full];
    }
    return [];
  });
}

const files = walk(root).map((file) =>
  "/" + path.relative(path.join(process.cwd(), "public"), file).replace(/\\/g, "/")
);

const html = `
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SHIL Assets Preview</title>
<style>
body{
  margin:0;
  font-family:system-ui;
  background:#eef0f6;
  color:#24114f;
  padding:24px;
}
h1{text-align:center}
.grid{
  max-width:1100px;
  margin:24px auto;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:18px;
}
.card{
  background:rgba(255,255,255,.8);
  border-radius:22px;
  padding:14px;
  box-shadow:0 10px 28px rgba(20,20,60,.12);
  text-align:center;
}
.card img{
  width:100%;
  height:150px;
  object-fit:contain;
  border-radius:14px;
}
.path{
  margin-top:10px;
  font-size:11px;
  direction:ltr;
  word-break:break-all;
  color:#4b367a;
}
</style>
</head>
<body>
<h1>SHIL Assets Preview</h1>
<div class="grid">
${files.map((src) => `
  <div class="card">
    <img src="${src}" />
    <div class="path">${src}</div>
  </div>
`).join("")}
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(process.cwd(), "public", "assets-preview.html"), html, "utf8");
console.log("Created public/assets-preview.html");
console.log("Open: http://localhost:5173/assets-preview.html");

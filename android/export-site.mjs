// Builds the offline copy of clock.mazzen.dev that goes inside the Android
// app: renders the Worker's pages, bundles the Google Fonts, and points every
// link at local files.
//   node android/export-site.mjs
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "app/src/main/assets/www");
const worker = (await import(join(here, "../src/worker.js"))).default;

const get = async (path) => {
  const res = await worker.fetch(new Request("https://clock.mazzen.dev" + path));
  if (!res.ok) throw new Error(path + " -> " + res.status);
  return res.text();
};

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "fonts"), { recursive: true });

let html = await get("/");
let js = await get("/app.js");
const icon = await get("/icon.svg");

// --- fonts: download the stylesheet and every font file it uses ---
const cssLink = html.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/);
if (!cssLink) throw new Error("Google Fonts link not found");
const cssUrl = cssLink[1].replace(/&amp;/g, "&");
// a modern browser user agent gets woff2 files
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
let css = await (await fetch(cssUrl, { headers: { "user-agent": UA } })).text();
const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
let n = 0;
for (const u of urls) {
  const name = "f" + n++ + ".woff2";
  const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
  writeFileSync(join(out, "fonts", name), buf);
  css = css.split(u).join("fonts/" + name);
}
writeFileSync(join(out, "fonts.css"), css);
console.log("fonts:", urls.length, "files");

// --- page ---
html = html
  .replace(cssLink[0], '<link rel="stylesheet" href="fonts.css">')
  .replace(/<link rel="preconnect"[^>]*>\n?/g, "")
  .replace(/<link rel="manifest"[^>]*>\n?/, "")
  .replace(/href="\/icon\.svg"/g, 'href="icon.svg"')
  .replace('href="/"', 'href="index.html"')
  .replace('<script src="/app.js" defer></script>', '<script src="android-shim.js"></script>\n<script src="app.js" defer></script>');
for (const bad of ['src="/', 'href="/', "googleapis", "gstatic"]) if (html.includes(bad)) throw new Error("page still has " + bad);

// share links should open the website, not a file on this phone
const shareExpr = 'location.origin + location.pathname + "#s="';
if (!js.includes(shareExpr)) throw new Error("share link code not found");
js = js.replace(shareExpr, '"https://clock.mazzen.dev/#s="');

writeFileSync(join(out, "index.html"), html);
writeFileSync(join(out, "app.js"), js);
writeFileSync(join(out, "icon.svg"), icon);
writeFileSync(join(out, "android-shim.js"), readFileSync(join(here, "android-shim.js")));
console.log("exported to", out);

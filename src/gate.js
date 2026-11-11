// The mazzen.dev site-wide password, for a *.mazzen.dev site (this same file is in every site).
//
// mazzen.dev (the "mazzen-hub" Worker, reached through the GATE service binding in
// wrangler.jsonc) decides everything: whether this site is locked right now (switched in
// mazzen.dev/stats), whether this visitor has the password (a signed cookie on .mazzen.dev, so one
// password works on every site, on that device, for good), and it serves the "enter the password"
// page and checks the password. If mazzen.dev can't be reached the site stays locked.
//
// Use: export default { fetch: (req, env, ctx) => withGate(req, env, ctx, (r, e, c) => site.fetch(r, e, c)) }
// opts.assetsFirst: serve a matching static file before the site's own code (like Cloudflare does
//   when run_worker_first is off). opts.workerFirst: paths that skip that (an array of prefixes).

const HUB = "https://mazzen.dev";

async function check(req, env) {
  const url = new URL(req.url);
  const ip = req.headers.get("cf-connecting-ip") || "";
  if (url.pathname === "/__gate/login" && req.method === "POST") {
    return env.GATE.fetch(HUB + "/__gate/login", {
      method: "POST", body: await req.text(),
      headers: { "content-type": "application/json", "x-gate-ip": ip, "x-gate-host": url.hostname, "user-agent": req.headers.get("user-agent") || "" },
    });
  }
  return env.GATE.fetch(HUB + "/__gate/check", {
    headers: {
      cookie: req.headers.get("cookie") || "", "x-gate-host": url.hostname, "x-gate-path": url.pathname + url.search,
      accept: req.headers.get("accept") || "", "sec-fetch-mode": req.headers.get("sec-fetch-mode") || "",
      "sec-fetch-dest": req.headers.get("sec-fetch-dest") || "", upgrade: req.headers.get("upgrade") || "", "x-gate-ip": ip,
    },
  });
}

export async function withGate(req, env, ctx, handler, opts = {}) {
  let refresh = null;
  if (env.GATE) {
    let r;
    try { r = await check(req, env); }
    catch (e) { return new Response("This site can't check its password right now. Try again in a minute.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "30" } }); }
    // (a 404 without the x-gate mark: mazzen.dev hasn't got the password code yet, so nothing's locked)
    if (r.status !== 204 && !(r.status === 404 && !r.headers.get("x-gate"))) return r;   // the password page, a login answer, or "locked"
    refresh = r.headers.get("x-gate-cookie");               // keeps "signed in" from ever running out
  }
  let res;
  const path = new URL(req.url).pathname;
  if (opts.assetsFirst && env.ASSETS && !(opts.workerFirst || []).some((p) => path.startsWith(p))) {
    res = await env.ASSETS.fetch(req);
    if (res.status === 404) res = null;
  }
  if (!res) res = await handler(req, env, ctx);
  if (refresh && res.status !== 101 && !res.webSocket) {
    res = new Response(res.body, res);
    res.headers.append("set-cookie", refresh);
  }
  return res;
}

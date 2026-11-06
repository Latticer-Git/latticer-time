// Cloudflare Pages Function: a narrow proxy to your Airtable base.
// The Airtable token lives only in the Pages environment (AIRTABLE_TOKEN), set in the Cloudflare dashboard. AIRTABLE_BASE_ID and ALLOWED_EMAIL are set there too.
// Put Cloudflare Access in front of the whole site; this also checks the signed-in email as a second lock.

// Table names must match your Airtable base and public/config.js.
const READ = new Set(["Clients", "Engagements", "Deliverables", "Task Types", "Time Entries"]);
const WRITE = new Set(["Time Entries"]); // the only table the app may change
const REC = /^rec[A-Za-z0-9]{14}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequest({ request, env, params }) {
  if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) return json(500, { error: "AIRTABLE_TOKEN or AIRTABLE_BASE_ID is not set" });

  const email = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").toLowerCase();
  if (!env.ALLOWED_EMAIL || email !== env.ALLOWED_EMAIL.toLowerCase()) {
    return json(403, { error: "Not signed in through Cloudflare Access" });
  }

  const [rawTable, rec, ...extra] = params.path || [];
  const table = rawTable && decodeURIComponent(rawTable); // harmless if the platform already decoded it
  const method = request.method;
  if (!table || extra.length || (rec && !REC.test(rec))) return json(400, { error: "Bad path" });
  if (!READ.has(table)) return json(404, { error: "Unknown table" });

  if (method === "GET") {
    // allowed on every listed table
  } else if (method === "POST" && !rec && WRITE.has(table)) {
    // create
  } else if ((method === "PATCH" || method === "DELETE") && rec && WRITE.has(table)) {
    // update or delete one Time Entry
  } else {
    return json(405, { error: "Not allowed" });
  }

  const url = new URL(request.url);
  const target = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${rec ? "/" + rec : ""}${url.search}`;
  const init = {
    method,
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
  };
  if (method === "POST" || method === "PATCH") init.body = await request.text();

  const res = await fetch(target, init);
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

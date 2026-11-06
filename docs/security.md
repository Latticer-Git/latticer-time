# Security notes

Time data about clients is sensitive. This is how the design protects it, and what you must still do yourself.

## Layers

1. **Cloudflare Access** is the front door. Nothing in the app is served to someone who is not signed in as your email.
2. **The Pages Function checks your email again.** It requires the `Cf-Access-Authenticated-User-Email` header (set by Access) to match `ALLOWED_EMAIL`, and refuses otherwise. If Access is misconfigured, requests still fail.
3. **The token never reaches the browser.** `AIRTABLE_TOKEN` exists only as an encrypted Cloudflare secret. The browser talks to `/api/*`, not Airtable.
4. **The proxy is narrow.** It can read five named tables, and create, update or delete rows in **Time Entries only**. Paths are validated, so no other Airtable endpoint (schema, other bases, other tables) is reachable.
5. **The token is scoped.** Records read/write, one base, no schema scopes. If it leaks, the damage is limited to that base.

## Things to double-check

- **Preview URLs.** Every deployment gets its own `*.pages.dev` address. Cover it in the Access application (`*.your-project.pages.dev`) or those addresses are public (the function would still refuse them, but do not rely on one layer).
- **Deploy only `public/`.** Deploying the whole repository would publish your docs and scripts as web files.
- **Do not commit secrets.** `.dev.vars`, `.env` and `.wrangler/` are in `.gitignore`. If you ever paste a token somewhere by mistake, revoke it in Airtable and create a new one.
- **Client names in statements.** The statement `Note` content can reach a client. Keep notes client-safe.
- **Browser storage.** The app stores your last selection, the offline queue and any unsynced entries in the browser's `localStorage`. Use a device you control.

## Reporting a problem

If you find a security issue, please open a private security advisory on the GitHub repository rather than a public issue.

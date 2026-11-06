# Contributing

Small, focused changes are easiest to review.

- Run `npm run demo` and exercise your change in the browser. There is no build step and no test suite yet; if you add logic that is easy to unit test, a test is welcome.
- Keep the app dependency-free (plain JavaScript, no framework or bundler). That is a feature.
- Keep the security model in [docs/security.md](docs/security.md) intact: the token stays in the Pages Function, and the function writes to Time Entries only.
- Never commit tokens, `.dev.vars`, real client names or real base IDs. Use the fictional data in `dev-server.js` and `statement/example.json`.
- If you change a field name or add a field, update `public/config.js`, `dev-server.js` and `docs/airtable-schema.md` together.

Ideas that would be useful: tests for rounding and budget math, a CSV export, other backends (Supabase, Notion, SQLite on D1), a multi-currency or rate field, screenshots for the docs.

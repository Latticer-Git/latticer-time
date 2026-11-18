# Contributing

Small, focused changes are easiest to review.

- Run `npm run demo` and exercise your change in the browser. There is no build step and no test suite yet; if you add logic that is easy to unit test, a test is welcome.
- Keep the app dependency-free (plain JavaScript, no framework or bundler). That is a feature.
- Keep the security model in [docs/security.md](docs/security.md) intact: the token stays in the Pages Function, and the function writes to Time Entries only.
- Never commit tokens, `.dev.vars`, real client names or real base IDs. Use the fictional data in `dev-server.js` and `statement/example.json`.
- If you change a field name or add a field, update `public/config.js`, `dev-server.js` and `docs/airtable-schema.md` together.

## Documentation rules (every release)

Documentation is part of the feature. A change is not done until these are done:

1. **Feature release:** add an entry to [docs/changelog.md](docs/changelog.md) (Added, Changed, upgrade notes) and bump `version` in `package.json`.
2. **Airtable change** (table, field, formula, option): add an entry to [docs/schema-changelog.md](docs/schema-changelog.md) with *what*, *why* and *how to apply it to an existing base*, and update [docs/airtable-schema.md](docs/airtable-schema.md).
3. **New or changed behavior:** update [docs/user-guide.md](docs/user-guide.md) in task terms (what the person does and sees).
4. **A design choice someone might question:** add the reason to [docs/why-it-works-this-way.md](docs/why-it-works-this-way.md), including the alternative you rejected.
5. **New config setting:** add it to the table in [docs/customizing.md](docs/customizing.md) and to `public/config.js` with a comment.
6. **New failure mode:** add a row to [docs/troubleshooting.md](docs/troubleshooting.md).
7. Every docs page keeps its `title` and `description` front matter, uses sentence-case headings, and links to other pages with relative paths. No real client names, tokens or base IDs.

The pull request template repeats this checklist.

Ideas that would be useful: tests for rounding and budget math, a CSV export, other backends (Supabase, Notion, SQLite on D1), a multi-currency or rate field, screenshots for the docs.

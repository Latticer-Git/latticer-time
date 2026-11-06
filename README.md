# Latticer Time

A small, self-hosted time tracker for freelancers and consultants. Pick a client, project and type of work, press **Start**, press **Stop**. Your hours land in **your own Airtable base**, and the app tells you when a retainer's included hours are running out.

- **No build step.** Plain HTML, CSS and JavaScript, about 400 lines of app code.
- **Your data stays yours.** Airtable holds everything. The app is only the front end.
- **Works on your phone.** Installable web app (add to home screen) with a timer that survives reloads and an offline queue that syncs when you reconnect.
- **Retainer-aware.** Per-engagement rounding (for example up to 15 minutes), included hours, weekly and monthly caps, and warnings at 75%, 90% and 100%.
- **Locked down.** Cloudflare Access sign-in in front, and a proxy function that keeps the Airtable token out of the browser and can only write to one table.
- **Monthly statements.** An optional script turns a month of entries into a one-page Word statement for your client.

Cost: Cloudflare Pages and Cloudflare Access have free tiers that cover one person. Airtable also has a free plan, but the original was built on a paid plan, so check that your plan supports the rollup and formula fields in the schema. Plan limits change; verify before you commit.

## Try it in 30 seconds (no accounts)

```bash
git clone https://github.com/YOUR-USERNAME/latticer-time.git
cd latticer-time
npm run demo
```

Open <http://localhost:5178>. A built-in stand-in for Airtable serves fake clients and projects, so you can start and stop timers, add manual entries and watch the budget panel move. Nothing is saved when you stop the server.

## Build your own

1. [Set up the Airtable base](docs/setup.md#1-create-the-airtable-base) (5 tables, copy-paste formulas in [docs/airtable-schema.md](docs/airtable-schema.md)).
2. [Create a scoped Airtable token](docs/setup.md#2-create-an-airtable-token).
3. [Deploy to Cloudflare Pages](docs/setup.md#3-deploy-to-cloudflare-pages) and [lock it behind Cloudflare Access](docs/setup.md#5-lock-it-down-with-cloudflare-access).
4. [Add it to your phone](docs/setup.md#6-add-it-to-your-phone) and [log a test entry](docs/setup.md#7-first-run).

Then make it yours: [docs/customizing.md](docs/customizing.md).

## How it fits together

```
 phone / browser ──► Cloudflare Access (sign-in) ──► static app (public/)
                                   │
                                   └─► /api/* Pages Function ──► Airtable API
                                        (holds the token, checks your email,
                                         allows 5 tables, writes 1)
```

| Path | What it is |
| --- | --- |
| `public/` | The app. `config.js` is the only file most people edit. |
| `functions/api/[[path]].js` | Cloudflare Pages Function: the narrow proxy to Airtable. |
| `dev-server.js` | Demo server with fake Airtable data (`npm run demo`). |
| `statement/` | Optional monthly hours statement generator (Word). |
| `docs/` | Setup, schema, customizing, security, and a case study. |

## Documentation

- [Setup guide](docs/setup.md): from zero to a deployed app on your phone
- [Airtable schema](docs/airtable-schema.md): every table, field and formula
- [Customizing](docs/customizing.md): config, rounding rules, branding, statements
- [Security notes](docs/security.md): what protects your data and what to double-check
- [Troubleshooting](docs/troubleshooting.md)
- [Case study](docs/case-study.md): why it exists and the design decisions behind it

## Scope and limits

This is a single-user tool. It is not a multi-user product, an invoicing system or a replacement for a full time-tracking suite. It deliberately skips live client dashboards, billing and teams. If you need those, use a commercial tool; if you want a small, understandable, ownable timer, fork this.

## License

[MIT](LICENSE). Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

# Customizing

## `public/config.js`

| Setting | What it does |
| --- | --- |
| `tables` | Names of your five Airtable tables. Keep in sync with `functions/api/[[path]].js`. |
| `workerName` | Written to each entry's `Worker` field. `''` skips it. |
| `defaultIncrement` | Rounding minutes when an engagement has none. |
| `phaseByStage` | Map an engagement Stage to a Phase, for example `{ 'Lead': 'Sales' }`. `Internal` engagements always get `Internal`. |
| `defaultPhase` | Phase for everything else. |
| `clientStatuses` | Client statuses shown in the picker. |
| `hiddenStages` | Engagement stages hidden from the picker (closed, lost, archived). |

Field names are defined at the top of `public/app.js` (the `CL`, `EN`, `DL`, `TK`, `TE` objects). Rename a field in Airtable, change it there.

## Rounding and hour rules

- Rounding is per entry, up to the engagement's `Rounding Increment`. Client work at 15 and internal at 1 is a common split.
- The same rule exists twice: in `countedOf()` in `app.js` (on-screen totals) and in the `Counted Hours` formula in Airtable (rollups and flags). Change both together.
- Caps and flags are Airtable formulas. Change the thresholds (`0.75`, `0.9`, `0.8`) in the formulas, not in the app.

## Branding

- Name, colors, icon: `public/index.html` (title, header mark), `public/style.css` (the variables at the top), `public/manifest.webmanifest`, `public/icon.svg`.
- Fonts fall back to system fonts. The CSS names IBM Plex and Space Grotesk but does not load them; add a font `<link>` if you want them.

## Adding fields

Example: add a `Billable` single select to Time Entries and write it from the app.

1. Add the field in Airtable.
2. Add it to the `TE` object in `app.js` and to `entryFields()`.
3. Add it to the demo data in `dev-server.js` and to `docs/airtable-schema.md`.

The function already allows writing any field on Time Entries.

## Monthly client statements

`statement/make_statement.js` builds a one-page Word statement from a JSON file.

```bash
cd statement
npm install
node make_statement.js example.json statement.docx
```

Edit a copy of `example.json`: `preparedBy`, `footerLine`, `additionalRate`, the client and engagement, caps and entries. Pull the month's Time Entries from Airtable (a filtered view exported to CSV is enough), write client-friendly descriptions, and check every line before sending. Colors and fonts are the `C` and `FONT` constants at the top of the script. The footer and "Additional Work" sentence are statement wording, so review them against your own agreement.

## Ideas

Other backends (the whole data layer is `api()` plus the five table names), a CSV export, a weekly summary, per-engagement hourly rates, tests for the rounding math.

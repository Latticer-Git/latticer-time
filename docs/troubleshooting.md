---
title: Troubleshooting
description: Symptoms, likely causes and fixes for setup, sign-in, Airtable errors, pause, and mismatched hours.
---

# Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| "The data service answered with a web page" | The API function is not deployed, or the Access sign-in page is intercepting `/api`. Deploy from the repository root so `functions/` is included, and make sure the Access application covers the whole site. |
| "Not signed in through Cloudflare Access" (403) | `ALLOWED_EMAIL` does not match the email you signed in with, or Access is not in front of the site. Check both. |
| "AIRTABLE_TOKEN or AIRTABLE_BASE_ID is not set" | Add the variables under Settings > Variables and Secrets, then redeploy. |
| Airtable error `UNKNOWN_FIELD_NAME` | A field name in your base does not match the app. Compare against [airtable-schema.md](airtable-schema.md) and `public/app.js`. Names are case-sensitive. |
| Airtable error `INVALID_PERMISSIONS` or 403 from Airtable | The token lacks the base or a scope. Recreate it with `data.records:read` and `data.records:write` on this base. |
| `INVALID_MULTIPLE_CHOICE_OPTIONS` | `typecast` was removed, and a select option (`Running`, `Complete`, `Timer`, a Phase) does not exist. Create the option or restore `typecast`. |
| Client or project picker is empty | No client with a status in `clientStatuses`, no engagement linked to it, or the engagement's Stage is in `hiddenStages`. |
| Type of work list is empty | Task Types need `Active` checked, a `Parent`-less category, and child rows whose `Applies To` matches the engagement Type. |
| Budget panel missing | The engagement has no Included Hours, Weekly Cap or Monthly Cap. |
| Counted hours in the app and Airtable disagree | The default increment in `config.js` and the `15` in the `Counted Hours` formula differ, the `rounding` setting in `config.js` does not match the formula (nearest versus up), or the entry's engagement has a different Rounding Increment. |
| Pause button does nothing, or Airtable error `UNKNOWN_FIELD_NAME` for `Paused At` | The `Paused At` and `Paused Seconds` fields are missing or named differently. Add them (see [schema changelog](schema-changelog.md#2026-11-17)) or set `enablePause: false`. |
| Paused time is still being counted | The `Minutes` formula is the old one. Replace it with the version in the [schema reference](airtable-schema.md#minutes). |
| An entry shows as running for days | It was left running or paused. Stop it in the app (a paused timer ends at the time you press Stop, minus pauses) or set `End` in Airtable. The data check flags entries with no end after 12 hours. |
| "For customer" picker never appears | It only shows on internal projects, and only when `relatedClientField` is set in `config.js` to a link field that exists on Time Entries. |
| Old version still showing after deploy | Service worker cache. Bump `CACHE` in `public/sw.js`, redeploy, reload twice. |
| Wrong "today" near midnight | Work Date comes from the device clock. Weekly and monthly rollups use the time zone set in Airtable's rollup condition. |

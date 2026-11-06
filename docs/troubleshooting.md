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
| Counted hours in the app and Airtable disagree | The default increment in `config.js` and the `15` in the `Counted Hours` formula differ, or the entry's engagement has a different Rounding Increment. |
| Old version still showing after deploy | Service worker cache. Bump `CACHE` in `public/sw.js`, redeploy, reload twice. |
| Wrong "today" near midnight | Work Date comes from the device clock. Weekly and monthly rollups use the time zone set in Airtable's rollup condition. |

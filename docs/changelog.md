---
title: "Changelog"
description: "Feature releases of Latticer Time, newest first, with upgrade notes."
---

# Changelog

Feature releases, newest first. Airtable table and field changes are listed separately in the [schema changelog](schema-changelog.md). Versions follow the `version` in `package.json`.

## 1.1.0: 2026-11-17

### Added

- **Pause and resume.** A **Pause** button appears beside Stop while a timer runs. Paused time is not counted. Your note, project, deliverable and type of work stay in place, and Stop works while paused. Pause is queued offline like any other change. Turn it off with `enablePause: false` in `public/config.js`. Why it works this way: [Why pause adjusts one entry](why-it-works-this-way.md#why-pause-adjusts-one-entry-instead-of-splitting-it).
- **For customer (optional).** Internal projects can show a **For customer** picker that tags unbilled work to a customer through the new `Related Client` field. Off by default. Enable with `relatedClientField` in `public/config.js`. Why: [Why internal work can point at a customer](why-it-works-this-way.md#why-internal-work-can-point-at-a-customer).
- **Documentation:** a docs home page, [Who it is for](who-its-for.md), a [User guide](user-guide.md), and [Why it works this way](why-it-works-this-way.md).

### Changed

- **Rounding now defaults to the nearest increment** (7 minutes counts as 0, 8 as 15). Before, entries always rounded up. Set `rounding: 'up'` in `public/config.js` and keep the round-up formula to preserve the old behavior. The `Counted Hours` formula changed to match.
- The `Minutes` formula now subtracts paused time.
- The `hidden` attribute is now honored everywhere in the stylesheet (a picker meant to be hidden could show).

### Upgrade notes from 1.0.0

1. In Airtable, add `Paused At` and `Paused Seconds` to Time Entries and update the `Minutes` formula. Exact steps are in the [schema changelog](schema-changelog.md#2026-11-17).
2. Update the `Counted Hours` formula if you want nearest rounding (or set `rounding: 'up'`).
3. Optional: add the `Related Client` link field and set `relatedClientField`.
4. Redeploy the `public/` folder only. Existing entries are unaffected: a blank `Paused Seconds` counts as zero.

## 1.0.0: 2026-11-06

First public release.

- Timer with client, project, deliverable and type-of-work pickers
- Today's totals for the selected client and for all work
- Hours budget panel: included hours, weekly and monthly caps, flags at 75%, 90% and 100%
- Manual entry and delete
- Running timer that survives reloads, and an offline queue
- Per-engagement rounding increment
- Cloudflare Pages Function proxy with Cloudflare Access sign-in
- Monthly Word statement generator
- Demo server with fake data (`npm run demo`)
- Setup, schema, customizing, security and troubleshooting guides; case study

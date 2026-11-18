---
title: "Schema changelog"
description: "Every change to the Airtable tables, fields and formulas behind Latticer Time, newest first, with the steps to apply each one to an existing base."
---

# Schema changelog

Every change to the Airtable base, newest first. The current full definition is the [schema reference](airtable-schema.md). App changes are in the [changelog](changelog.md). Each entry says **what changed**, **why**, and **how to apply it** to a base you already have.

Changes are additive unless marked **Breaking**.

## 2026-11-17

Released with app version [1.1.0](changelog.md#110-2026-11-17).

### Time Entries: new field `Paused At`

- **Type:** Date with time (enable the time field; same time zone setting as `Start`).
- **Why:** Marks that a running entry is paused and since when. Blank when not paused.
- **Apply:** Add the field. Nothing else reads it.

### Time Entries: new field `Paused Seconds`

- **Type:** Number, integer (0 decimals).
- **Why:** The total of all closed pauses on an entry, so pauses are subtracted from the work time.
- **Apply:** Add the field. Existing entries stay blank, which counts as zero.

### Time Entries: `Minutes` formula changed

- **Why:** Subtract paused time.
- **Apply:** Replace the formula with the one in the [schema reference](airtable-schema.md#minutes). Entries without pauses are unchanged.

### Time Entries: new optional field `Related Client`

- **Type:** Link to Clients (allow multiple records is fine; the app writes one).
- **Why:** Tags unbilled internal work with the customer it was done for, for reporting. Not used in any rollup or budget.
- **Apply:** Add the field, then set `relatedClientField: 'Related Client'` in `public/config.js`. Airtable also creates a reverse link field on Clients; you can hide it.

## 2026-11-15

### Time Entries: `Counted Hours` formula changed (**Breaking** for totals)

- **Why:** Rounds to the **nearest** increment instead of always up. Fairer in both directions.
- **Effect:** Past entries recalculate. Anything already sent on a statement may differ by up to one increment per entry. Re-check before reissuing a statement.
- **Apply:** Replace the formula with the nearest-rounding version in the [schema reference](airtable-schema.md#counted-hours). To keep rounding up, leave the old formula and set `rounding: 'up'` in `config.js`.

## 2026-11-06

Initial schema: Clients, Engagements, Deliverables, Task Types and Time Entries, with the rollups, flags and formulas in the [schema reference](airtable-schema.md).

# Airtable schema

Create one base with five tables. **Names are exact and case-sensitive**: the app finds tables and fields by name (they are listed in `public/config.js`). If you rename something, change it there too.

Only the fields marked *required* are needed for the timer to work. The budget fields are optional; the budget panel hides itself when an engagement has no hour limits set.

```
Clients ◄── Engagements ◄── Deliverables
                 ▲
                 └────── Time Entries ──► Task Types (categories and task types)
```

## Clients

| Field | Type | Notes |
| --- | --- | --- |
| Name | Single line text | *Required.* Primary field. |
| Status | Single select | *Required.* Options: `Active`, `Prospect`, `Archived`. Only statuses in `clientStatuses` (config) show in the picker. |

Add one client for your own business, for example "My Company (Internal)", to track internal work.

## Engagements

One row per project or agreement.

| Field | Type | Notes |
| --- | --- | --- |
| Name | Single line text | *Required.* Primary field. |
| Client | Link to Clients | *Required.* Allow one record. |
| Type | Single select | *Required.* Options: `Client`, `Internal`. Controls which task types appear. |
| Stage | Single select | Optional. Free-form stages of your choosing; see `phaseByStage` and `hiddenStages` in config. |
| Rounding Increment | Number (integer) | Minutes to round each entry **up** to. `15` for client work, `1` for exact. Blank means `defaultIncrement`. |
| Included Hours | Number | Optional. Total hours in the agreement. |
| Weekly Cap | Number | Optional. |
| Monthly Cap | Number | Optional. |
| Time Entries | Link to Time Entries | Created automatically when you link from Time Entries. |
| Hours Used | Rollup | Sum of `Counted Hours` over `Time Entries`. |
| Hours This Week | Rollup | Same, with the condition *Work Date is within this calendar week*. |
| Hours This Month | Rollup | Same, with the condition *Work Date is within this calendar month*. |
| Budget Summary | Formula | See below. |
| Hours Flag | Formula | See below. |
| Cap Flag | Formula | See below. |

Rollup tips: in the field editor choose *Rollup*, pick `Time Entries`, then `Counted Hours`, aggregation `SUM(values)`. For the week and month rollups use *Only include linked records from a view or by condition*. Airtable evaluates "this week" and "this month" in the time zone you pick there.

**Budget Summary**
```
IF({Included Hours}, ROUND({Hours Used}, 2) & " of " & {Included Hours} & " h used (" & ROUND({Hours Used} / {Included Hours} * 100, 0) & "%)", IF({Hours Used}, ROUND({Hours Used}, 2) & " h logged", ""))
```

**Hours Flag** (warns as the included hours run out)
```
IF({Included Hours}, IF({Hours Used} >= {Included Hours}, "100%: included hours used, new agreement needed", IF({Hours Used} >= {Included Hours} * 0.9, "90% of included hours used", IF({Hours Used} >= {Included Hours} * 0.75, "75% of included hours used", ""))), "")
```

**Cap Flag** (warns on weekly and monthly caps)
```
IF(AND({Weekly Cap}, {Hours This Week} >= {Weekly Cap}), "Weekly cap reached", IF(AND({Monthly Cap}, {Hours This Month} >= {Monthly Cap}), "Monthly cap reached", IF(AND({Weekly Cap}, {Hours This Week} >= {Weekly Cap} * 0.8), "Near weekly cap", IF(AND({Monthly Cap}, {Hours This Month} >= {Monthly Cap} * 0.8), "Near monthly cap", ""))))
```

## Deliverables

Optional pieces of work inside an engagement (a lesson, a page, a report).

| Field | Type | Notes |
| --- | --- | --- |
| Name | Single line text | Primary field. |
| Engagement | Link to Engagements | Allow one record. |
| Status | Single select | Optional, for you. |

## Task Types

A two-level list: **categories** (no `Parent`) and **task types** inside them (with a `Parent`). The picker shows categories as groups and task types as the choices. Categories with no active task types are hidden.

| Field | Type | Notes |
| --- | --- | --- |
| Name | Single line text | *Required.* Primary field. |
| Parent | Link to Task Types | Link to another row in the same table. Leave blank for a category. |
| Applies To | Single select | Options: `Client`, `Internal`, `Both`. Blank counts as both. |
| Active | Checkbox | Only checked rows appear. |
| Sort | Number | Lower numbers first. |

Example: category **Communication** (Client, sort 50) with task types **Check-in call**, **Email**; category **Product** (Internal, sort 100) with **Tool build**, **Research**.

## Time Entries

One row per timer run or manual entry.

| Field | Type | Notes |
| --- | --- | --- |
| Entry UUID | Single line text | *Required.* Primary field. Written by the app; lets the offline queue avoid duplicates. |
| Engagement | Link to Engagements | *Required.* Allow one record. |
| Deliverable | Link to Deliverables | Allow one record. |
| Task Type | Link to Task Types | *Required.* Allow one record. |
| Phase | Single select | Written by the app (see `phaseByStage`). The app creates options on first use. |
| Start | Date with time | *Required.* Enable the time field. Use the **UTC** time zone setting, or "same for all collaborators" in your zone. |
| End | Date with time | Blank while the timer runs. |
| Work Date | Date | *Required.* The local calendar day the entry started, from the device clock. |
| Status | Single select | *Required.* `Running` or `Complete`. Created on first use. |
| Source | Single select | `Timer` or `Manual`. Created on first use. |
| Worker | Single line text or single select | Optional. Filled from `workerName` in config. |
| Note | Single line text | Optional. |
| Minutes | Formula | See below. |
| Rounding Increment | Lookup | Lookup of `Rounding Increment` through `Engagement`. |
| Counted Hours | Formula | See below. |

**Minutes**
```
IF(AND({Start}, {End}), DATETIME_DIFF({End}, {Start}, 'minutes'), BLANK())
```

**Counted Hours** (minutes rounded up to the engagement's increment, as hours; set the field's number precision to 2 decimals)
```
IF({Minutes}, ROUND(CEILING({Minutes} / IF(ARRAYJOIN({Rounding Increment}, ""), VALUE(ARRAYJOIN({Rounding Increment}, "")), 15)) * IF(ARRAYJOIN({Rounding Increment}, ""), VALUE(ARRAYJOIN({Rounding Increment}, "")), 15) / 60, 2), 0)
```

If you change the default increment in `config.js`, change the `15` in this formula too, so the app's on-screen numbers and Airtable's rollups agree.

### Optional extras

Fields the app ignores, handy in Airtable itself: a `Billable` single select (Billable / Included in fee / Non-billable), a `Count` override (Auto / Count / Don't count) multiplied into `Counted Hours`, and a `Data Check` formula that flags entries with no end after 12 hours, an end before the start, or no engagement.

## Rules baked into the app

- Entries under one minute count as zero.
- Rounding is per entry, always upward, set per engagement.
- The app sends `typecast: true` so Airtable creates missing single-select options. If you would rather lock the option lists, remove it in `api()` in `public/app.js` and create the options by hand.
- The budget panel shows server values and refreshes when you stop the timer.

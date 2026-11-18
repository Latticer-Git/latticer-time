---
title: Why it works this way
description: The reasoning behind the Airtable schema and the app's features, including internal versus client work, rounding, caps, pause, and why clients get a statement instead of a login.
---

# Why it works this way

The [schema reference](airtable-schema.md) tells you **what** each table and field is. This page tells you **why** it is that way, so you can change it with confidence instead of guessing.

Every choice below answers one need from [Who it is for](who-its-for.md): a solo consultant who must say, with numbers, when a client's hours are used up, and who also wants to see where unbilled time goes.

## One spine for all work: Client, Engagement, Deliverable

Work is organized as **Client → Engagement → Deliverable**, and every time entry links to an engagement.

- A **client** is who the work is for.
- An **engagement** is one project or agreement. It carries the rules: included hours, caps, rounding.
- A **deliverable** is a concrete thing inside it, such as a lesson, a page, a report or a proposal.

**Why this shape.** Rules belong to the agreement, not to the person. A retainer has a cap; a fixed-fee project does not; your own marketing has neither. Putting rules on the engagement means the app has no special cases. It reads the engagement and applies what it finds.

**Why not a flat list of projects.** A flat list cannot tell you "which part of this project ate the hours." The deliverable level answers that without forcing you to use it. It is optional.

## Why internal work uses the same structure

Internal work is time you do not bill: sales, marketing, partnerships, learning, building your own tools. It lives in the **same tables** as client work. You create one client row for your own business (for example "My Company (Internal)") and give it engagements such as "Internal: Sales and outreach."

**Why not a separate internal tracker.**

1. **One report.** "Where did my week go?" should have one answer. Two systems mean adding totals by hand.
2. **No second set of rules.** Internal projects have their own rounding and no hour limits, but they are configured with the same fields. Nothing new to learn or maintain.
3. **Your own time has a cost.** Hours spent on sales, tools and learning are what it costs to run the practice. Tracking them fully shows whether your pricing and capacity make sense.

**Why `Type` is a field on the engagement.** The `Type` (Client or Internal) controls two things: which task types appear in the picker, and which phase is written on each entry. Everything else about an internal project is just an engagement with different numbers.

**Why internal time rounds to the minute.** Client rounding exists because an agreement says so. Your own time has no agreement, and rounding small internal tasks up to 15 minutes would inflate quick jobs and hide how long things really take.

## Why task types are a table, not code

**Task Types** is a two-level list in an Airtable table: categories (such as Sales) and task types inside them (such as Proposal). The app builds its picker from the table.

**Why.** Your taxonomy will change as you learn what you actually do. If it lived in code, every new type would mean editing and redeploying the app. In a table, adding a type is adding a row, and the timer shows it on the next load.

**Why `Applies To` (Client, Internal, Both).** Some types make no sense in one world (a "Rubric review" for your own marketing). Others, like Sales, can belong to either. The field keeps each picker short and relevant.

**Why a category can mean "does not count against the budget."** A retainer covers the work the client receives. Sales, marketing and partnership time is yours. If your base has the optional counts-toward-budget setting, task types can say "No," so those hours are tracked but never touch a client's included hours.

## Why deliverables exist for internal work too

Internal projects get **standing deliverables**: reusable, concrete outputs such as "LinkedIn post," "Guide or article," "Proposal or SOW," "Addendum or amendment," "Test plan and results."

**Why.** "Marketing, 14 hours" is a number. "Marketing: 3 posts, 1 guide, 1 analytics report" is something you can learn from. Standing deliverables let you ask what each *kind of output* costs in time, and they stop the Deliverable picker from sitting empty on internal projects.

A good standing deliverable is a thing you could hand to someone, with a verb-free noun name. If you cannot picture the finished artifact, it belongs in the task type instead.

## Why internal work can point at a customer

Some unbilled work exists only because of one customer: writing their addendum, preparing their proposal. It should not count against their retainer. But it is still **what that customer costs you**.

The optional **Related Client** field on Time Entries links an internal entry to a customer. The hours stay internal, and reports can group internal time by customer.

**Why not log it against the customer's engagement.** That would spend their included hours on your sales effort, which is wrong for them and for your records.

**Why not just use the note.** A note is free text. A link is something Airtable can group, count and chart.

**Why it is optional and off by default.** Most people do not need it. Turn it on in `config.js` when you do. [How](customizing.md#publicconfigjs).

## Why rounding is per entry and per project

Each entry is rounded to its engagement's **Rounding Increment**, once.

- **Per project, not global.** Client work is usually governed by a contract (such as quarter-hour increments). Internal work is not.
- **Per entry, not per day.** A statement lists entries. Each line should be explainable on its own.
- **Nearest, not always up.** Rounding up always favors you and tends to feel like padding. Rounding to the nearest increment errs in both directions and averages out. If your agreement says "round up," set `rounding: 'up'` in `config.js` and use the round-up formula in the [schema](airtable-schema.md#counted-hours).
- **Stored as exact times.** Start and end are saved as they happened. Rounding is a *rule applied afterward* by a formula, so you can change the rule later without losing the facts.
- **Written twice on purpose.** The rule lives in the app (so on-screen totals update live) and in an Airtable formula (so rollups and flags are correct). They must match. [Troubleshooting](troubleshooting.md) covers a mismatch.

## Why caps and flags are formulas in Airtable

The warnings at 75%, 90% and 100% and the weekly and monthly caps are Airtable formulas, not app logic.

**Why.** You can read and change a formula without touching code. Flags also appear in Airtable views and automations, not just in the app, so a flag can trigger an email or a task later.

## Why pause adjusts one entry instead of splitting it

When you pause, the app does not close the entry and open a new one on resume. It records a **Paused At** time while paused, and on resume adds the stretch to **Paused Seconds**. The entry's **Minutes** formula is end minus start minus paused time.

**Why not split into several entries.**

1. **Rounding would multiply.** Rounding happens per entry. A task paused twice becomes three entries, each rounded to the nearest 15 minutes on its own. The total drifts away from the real work.
2. **Your note and selections stay.** One entry keeps its project, deliverable, type and note. You never retype them.
3. **Statements stay readable.** One task is one line, not three fragments.

**Why not a "Paused" status.** The app finds the running timer by looking for `Status = Running`. Keeping a paused timer as *the* running timer means "one timer at a time," reload recovery and the offline queue all work unchanged. Pause is a property of a running entry, not a different kind of entry.

**Why seconds.** Pauses are short and many. Storing seconds avoids rounding error from adding up small stretches.

**The trade-off.** A forgotten paused timer looks like a running one, so the data check flags anything with no end after 12 hours.

## Why the timer lives in Airtable

The running timer is a real row (status `Running`), written the moment you press Start.

**Why.** A timer held only in the browser dies with the tab. A row survives a reload, a crash and a switch from laptop to phone. Offline, the same rows are queued with a unique ID so a retry never double-logs.

## Why a proxy function sits between the app and Airtable

The browser never holds the Airtable token. A small function holds it, checks your sign-in email, allows reads on five tables and writes on one.

**Why two locks.** Cloudflare Access protects the whole site, and the function checks the email again. One mistake in either is not a breach. See [Security notes](security.md).

## Why clients get a statement, not a login

A live client dashboard is a promise to keep it current and one more thing to secure. A monthly one-page statement is a deliverable: reviewed by a person, sent on a schedule, with descriptions written for the client.

**Why that suits a retainer.** The conversation you need to have is "your included hours are used." A reviewed statement is evidence you control, not a screen the client may read at the wrong moment, mid-month, with estimates in it.

## Why it is single user

Teams add accounts, permissions, roles and support burden. The problem this tool solves does not need them. A small tool you understand end to end beats a large one you configure.

## Related reading

- [Airtable schema](airtable-schema.md): the reference these reasons explain
- [Case study](case-study.md): the story of how the tool was built
- [Changelog](changelog.md): when each of these features arrived

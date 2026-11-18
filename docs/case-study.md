---
title: "Case study: a time tracker built around one sentence"
description: "Why Latticer Time exists, the decisions that shaped it, and what went wrong along the way."
---

# Case study: a time tracker built around one sentence

*Enterprise Latticer LLC, November 2026. Updated for version 1.1.0.*

## The problem

A consulting practice sells retainers: a fixed number of hours per week for a fixed term. The business risk is simple and uncomfortable. When the included hours are used up, someone has to say so, firmly and with evidence, and propose a new agreement. Without a record that both sides trust, that conversation is a negotiation about memory.

The requirement was one sentence: **be able to say, with numbers, when a retainer's hours are used up.**

Commercial trackers can count hours, but this practice already had the rest of the setup: the work was organized in an Airtable "client operations" base (clients, engagements, deliverables), the rules were specific (round each client entry up to 15 minutes, track internal time exactly, cap hours per week), and the data needed to stay in a place the business already owned.

## Decisions that shaped the build

**The database already existed, so the app is only a front end.** Airtable holds the data and does the arithmetic with rollups and formulas. The web app is a timer and a picker. That kept the code to about 400 lines of plain JavaScript with no framework and no build step, and it means every number on screen can be checked in Airtable.

**Rules were written down before code.** The hour rules (rounding, caps, how internal time counts, what a client sees) went into a short decision record first. That made it clear which logic belongs in Airtable formulas (flags, caps, totals) and which in the app (what you see while the timer runs).

**The token stays out of the browser.** A small Cloudflare Pages Function sits between the app and Airtable. It holds the token, checks the signed-in email, lets the app read five tables, and lets it change one. Cloudflare Access sits in front of everything. Two independent locks, so one mistake is not a breach.

**Phone first, offline tolerant.** The timer has to be usable from a phone. The running timer lives in Airtable (a row with status `Running`), so it survives a reload, and writes made while offline go into a queue keyed by a UUID so reconnecting never creates duplicates.

**Internal work is tracked the same way as client work.** A practice that sells time also spends time on sales, marketing, partnerships and building its own tools. Those hours went into the same tables under an internal client, so one report answers where the week went, and no second set of rules exists. A later optional field tags unbilled work to the customer it was done for, so a customer's real cost in effort is visible without touching their retainer hours. See [why it works this way](why-it-works-this-way.md).

**Pause adjusts one entry instead of splitting it.** Version 1.1 added a Pause button after a real need: stepping away mid-task without ending the session and retyping the note. Splitting the entry would have multiplied rounding, so a pause is stored on the entry and subtracted by a formula. One task stays one line on a statement.

**Clients get a statement, not a login.** A live client dashboard is a promise to keep it current and a surface to secure. A monthly one-page statement is a deliverable: reviewed by a human, sent on a schedule, with descriptions written for the client. A small script generates it.

## What went wrong, and what it taught

- Airtable answers create and update calls with field *names* but reads can be keyed by field *ID*, which made the app briefly show blank fields after stopping a timer. The open-source version moved to field names everywhere, which is also simpler for anyone building their own base.
- The first release of the optional customer picker shipped with a visual bug: a stylesheet rule overrode the HTML `hidden` attribute, so the picker appeared on client projects where it should not. Testing the next feature caught it. The fix is one line, and the lesson is to check hidden elements in a real browser, not only in code.
- An early deployment included more than it needed to. The fix was a rule, now in the docs: deploy only `public/`.

## What it is not

Single user. No invoicing, no live client view, no team features. Those omissions are deliberate: each one would have added accounts, permissions and support burden to solve a problem that did not exist yet.

## Build it yourself

The [setup guide](setup.md) takes you from nothing to a locked-down app on your phone, and the [demo](../README.md#try-it-in-30-seconds-no-accounts) runs with no accounts at all. The project was designed and built with Claude Code as a pair-programming partner, from spec through deployment.

// Everything you are likely to customize lives here. Table and field names must match your Airtable base
// exactly (see docs/airtable-schema.md). Keep the table names in sync with functions/api/[[path]].js.
window.TIME_CONFIG = {
  tables: {
    clients: 'Clients',
    engagements: 'Engagements',
    deliverables: 'Deliverables',
    taskTypes: 'Task Types',
    timeEntries: 'Time Entries',
  },
  // Written to the "Worker" field of each entry. Leave '' to skip the field.
  workerName: '',
  // Minutes each entry is rounded to when an engagement has no "Rounding Increment".
  defaultIncrement: 15,
  // 'nearest' (7 min counts as 0, 8 min as 15) or 'up' (any started block counts). Keep the Counted Hours formula in step.
  rounding: 'nearest',
  // Show the Pause button. Needs the "Paused At" and "Paused Seconds" fields on Time Entries (docs/airtable-schema.md).
  enablePause: true,
  // Optional: name of a link-to-Clients field on Time Entries (for example 'Related Client'). When set, internal projects
  // get a "For customer" picker so non-billable work can still be attributed to a customer. '' turns it off.
  relatedClientField: '',
  // Optional: map an engagement's Stage to the Phase written on each entry.
  // Engagements of Type "Internal" always get "Internal". Everything else falls back to defaultPhase.
  phaseByStage: {
    // 'Lead': 'Sales',
    // 'Onboarding': 'Onboarding',
    // 'Wrap-up': 'Closeout',
  },
  defaultPhase: 'Delivery',
  // Client statuses shown in the Client picker.
  clientStatuses: ['Active', 'Prospect'],
  // Engagement stages hidden from the picker.
  hiddenStages: ['Closed'],
};

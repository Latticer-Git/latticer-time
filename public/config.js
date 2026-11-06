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
  // Minutes to round up to when an engagement has no "Rounding Increment".
  defaultIncrement: 15,
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

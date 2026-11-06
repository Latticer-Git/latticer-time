// Builds a one-page monthly hours statement (Word) from a small JSON file.
// Usage: node make_statement.js input.json output.docx
// Input comes from Time Entries in the Client Ops base. Entries that do not count toward the budget are left out.
// Branding comes from the JSON (preparedBy, footerLine, additionalRate); colors and fonts are in the C and FONT constants below.
// Descriptions are client-facing: write them in plain words, never paste internal notes.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, VerticalAlign, Footer, PageNumber,
} = require('docx');

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) { console.error('Usage: node make_statement.js input.json output.docx'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(inFile, 'utf8'));

const C = { navy: '0A1128', green: '5FD068', greenText: '2E7D39', muted: '5B6270', ink: '14181F', tint: 'F3F5F4', border: 'D9DCE1', white: 'FFFFFF', red: 'B42318' };
const FONT = { display: 'Space Grotesk', body: 'IBM Plex Sans', mono: 'IBM Plex Mono' };
const dec = (n) => (Math.round(n * 100) / 100).toFixed(2);
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() : `${m} min`);
const dateLabel = (s) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const total = d.entries.reduce((a, e) => a + e.counted, 0);
const trackedMin = d.entries.reduce((a, e) => a + e.minutes, 0);
const termUsed = (d.hoursBeforePeriod || 0) + total;

const t = (text, o = {}) => new TextRun({ text, font: FONT.body, size: 21, color: C.ink, ...o });
const para = (children, o = {}) => new Paragraph({ spacing: { after: 120, line: 290 }, children: Array.isArray(children) ? children : [children], ...o });
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const hair = { style: BorderStyle.SINGLE, size: 4, color: C.border };
const cell = (text, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 90, bottom: 90, left: 120, right: 120 },
  borders: { top: noBorder, left: noBorder, right: noBorder, bottom: hair },
  children: [new Paragraph({ alignment: o.align || AlignmentType.LEFT, children: [new TextRun({ text, font: o.font || FONT.body, size: o.size || 20, bold: !!o.bold, color: o.color || C.ink, characterSpacing: o.cs })] })],
});

const children = [];
if (d.draft) {
  children.push(new Paragraph({
    spacing: { after: 200 },
    shading: { type: ShadingType.CLEAR, fill: 'FDECEA' },
    children: [new TextRun({ text: 'DRAFT: not yet sent. Delete this line after checking every entry.', font: FONT.mono, size: 17, color: C.red })],
  }));
}
children.push(
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'MONTHLY HOURS STATEMENT', font: FONT.mono, size: 17, color: C.greenText, characterSpacing: 30 })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: d.periodLabel, font: FONT.display, bold: true, size: 44, color: C.navy })] }),
  new Paragraph({ spacing: { after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.green, space: 6 } }, children: [new TextRun({ text: d.engagement, font: FONT.display, bold: true, size: 26, color: C.greenText })] }),
  para([t('Client: ', { bold: true }), t(d.client)], { spacing: { after: 40 } }),
  para([t('Period: ', { bold: true }), t(d.periodRange)], { spacing: { after: 40 } }),
  para([t('Prepared by: ', { bold: true }), t(d.preparedBy + ', ' + d.preparedDate)], { spacing: { after: 220 } }),
);

// Summary
const sumRows = [
  ['Hours counted this period', dec(total) + ' h'],
  ...(d.monthlyCap ? [
    ['Monthly allowance', dec(d.monthlyCap) + ' h'],
    ['Remaining this month', dec(Math.max(0, d.monthlyCap - total)) + ' h'],
  ] : []),
  ['Hours remaining in the agreement', dec(Math.max(0, d.termIncluded - termUsed)) + ' of ' + dec(d.termIncluded) + ' h'],
];
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [6360, 3000],
  rows: sumRows.map((r, i) => new TableRow({ children: [
    cell(r[0], { w: 6360, fill: i % 2 ? C.tint : C.white }),
    cell(r[1], { w: 3000, fill: i % 2 ? C.tint : C.white, font: FONT.mono, bold: true, color: C.greenText, align: AlignmentType.RIGHT }),
  ] })),
}));

// Entries
children.push(new Paragraph({ spacing: { before: 280, after: 100 }, children: [new TextRun({ text: 'Work this period', font: FONT.display, bold: true, size: 25, color: C.navy })] }));
const head = (txt, w, align) => cell(txt, { w, fill: C.navy, color: C.white, font: FONT.mono, size: 17, cs: 12, align });
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [1100, 5260, 1500, 1500],
  rows: [
    new TableRow({ tableHeader: true, children: [head('DATE', 1100), head('WORK', 5260), head('TIME', 1500, AlignmentType.RIGHT), head('COUNTED', 1500, AlignmentType.RIGHT)] }),
    ...d.entries.map((e, i) => new TableRow({ children: [
      cell(e.dateLabel || dateLabel(e.date), { w: 1100, fill: i % 2 ? C.tint : C.white }),
      cell(e.work, { w: 5260, fill: i % 2 ? C.tint : C.white }),
      cell(dur(e.minutes), { w: 1500, fill: i % 2 ? C.tint : C.white, align: AlignmentType.RIGHT }),
      cell(dec(e.counted) + ' h', { w: 1500, fill: i % 2 ? C.tint : C.white, font: FONT.mono, align: AlignmentType.RIGHT }),
    ] })),
    new TableRow({ children: [
      cell('', { w: 1100 }), cell('Total', { w: 5260, bold: true }),
      cell(dur(trackedMin), { w: 1500, bold: true, align: AlignmentType.RIGHT }),
      cell(dec(total) + ' h', { w: 1500, bold: true, font: FONT.mono, color: C.greenText, align: AlignmentType.RIGHT }),
    ] }),
  ],
}));

children.push(
  new Paragraph({ spacing: { before: 240, after: 80 }, children: [new TextRun({ text: 'How hours are counted', font: FONT.display, bold: true, size: 23, color: C.navy })] }),
  para(t(`Each entry is rounded up to the next ${d.rounding} minutes. Calls, working sessions and review all count toward the hours. The agreement covers up to ${dec(d.weeklyCap)} hours per week${d.monthlyCap ? ` and ${dec(d.monthlyCap)} hours per month` : ''}, ${dec(d.termIncluded)} hours in total.`), { spacing: { after: 80 } }),
  para(t(`Work beyond the included hours is Additional Work at ${d.additionalRate}, agreed in writing before it begins.`), { spacing: { after: 80 } }),
  para(t('If anything here looks off, reply and we will go through it together.'), { spacing: { after: 80 } }),
);

const doc = new Document({
  creator: d.preparedBy,
  title: `Hours statement, ${d.client}, ${d.periodLabel}`,
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: hair }, spacing: { before: 120 }, children: [
      new TextRun({ text: `${d.footerLine.toUpperCase()}   ·   Page `, font: FONT.mono, size: 14, color: C.muted }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT.mono, size: 14, color: C.greenText, bold: true }),
    ] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(outFile, b); console.log('wrote', outFile); });

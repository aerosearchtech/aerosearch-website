// One-click reports. Both are generated from the same ViewModel the console
// renders, so a report can never state something the operator is not looking at.
//
// Output is self-contained HTML: it opens anywhere, prints to PDF without a
// dependency, and keeps the tables and narrative that a CSV would throw away.
// These are plan documents, not proof of clearance — nothing here is signable,
// and the certification block names the lane, never a person.

import { AO_NAME, CLASSIFICATION, OPERATION_NAME } from './constants';
import type { ViewModel } from './derive';

/**
 * Print palette. The screen colours are tuned for a dark console and do not
 * survive paper, so the report carries its own.
 */
const INK = '#14181d';
const MUTE = '#5c666f';
const RULE = '#c9d1d8';
const ALERT = '#b3241f';

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

const esc = (v: unknown): string => String(v).replace(/[&<>"]/g, (c) => ENTITIES[c]);

const row = (cells: (string | number)[], tag = 'td'): string =>
  `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join('')}</tr>`;

const table = (head: string[], body: string[]): string =>
  `<table><thead>${row(head, 'th')}</thead><tbody>${body.join('')}</tbody></table>`;

const section = (title: string, inner: string): string =>
  `<section><h2>${esc(title)}</h2>${inner}</section>`;

/** Key-value strip used for the summary blocks at the top of each report. */
const facts = (pairs: [string, string][]): string =>
  `<dl>${pairs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

const note = (text: string): string => `<p class="note">${esc(text)}</p>`;

function shell(kind: string, view: ViewModel, body: string): string {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(kind)} · ${esc(OPERATION_NAME)}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; color: ${INK}; background: #fff;
         font: 13px/1.55 "Segoe UI", system-ui, sans-serif; max-width: 900px; }
  header { border-bottom: 2px solid ${INK}; padding-bottom: 12px; margin-bottom: 20px; }
  .cls { font: 700 11px/1 ui-monospace, monospace; letter-spacing: 2px;
         color: ${ALERT}; margin-bottom: 8px; }
  h1 { font-size: 20px; letter-spacing: 1px; margin: 0 0 3px; }
  .sub { color: ${MUTE}; font: 11px ui-monospace, monospace; letter-spacing: 1px; }
  h2 { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
       border-bottom: 1px solid ${RULE}; padding-bottom: 5px; margin: 26px 0 10px; }
  table { border-collapse: collapse; width: 100%; font-size: 11.5px; }
  th { text-align: left; font: 700 10px ui-monospace, monospace; letter-spacing: 1px;
       color: ${MUTE}; border-bottom: 1px solid ${RULE}; padding: 5px 7px 5px 0; }
  td { padding: 4px 7px 4px 0; border-bottom: 1px solid #eef1f4; vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 18px; margin: 0; }
  dt { font: 700 9.5px ui-monospace, monospace; letter-spacing: 1px; color: ${MUTE}; }
  dd { margin: 2px 0 0; font-size: 15px; font-weight: 600; }
  p.note { color: ${MUTE}; font-size: 11px; margin: 8px 0 0; }
  footer { margin-top: 32px; border-top: 1px solid ${RULE}; padding-top: 10px;
           color: ${MUTE}; font: 10px ui-monospace, monospace; letter-spacing: .5px; }
  section { break-inside: avoid; }
</style></head><body>
<header>
  <div class="cls">${esc(CLASSIFICATION)}</div>
  <h1>${esc(kind)}</h1>
  <div class="sub">${esc(OPERATION_NAME)} · ${esc(AO_NAME)} · 43R FN 4200 6450 · GENERATED ${esc(stamp)}Z</div>
</header>
${body}
<footer>
  BREACHMINEFIELD · AEROSEARCH — generated from the live mission picture at plan
  clock ${esc(view.clockStr)}. This is a planning product, not a certificate of
  clearance. No ground has been proofed by the issue of this document.
</footer>
</body></html>`;
}

export function detectionReport(view: ViewModel): string {
  const d = view.detect;

  const channels = table(
    ['CHANNEL', 'COVERAGE', 'QUALITY', 'PASSES', 'SWATH', 'SPACING', 'NOTE'],
    d.channels.map((c) =>
      row([
        `${c.id} — ${c.name}`,
        `${c.coveragePct.toFixed(0)}%`,
        `${(c.quality * 100).toFixed(0)}%`,
        c.passes,
        `${c.swathM} m`,
        `${c.lineSpacingM} m`,
        c.holiday ? 'HOLIDAYS — swath narrower than line spacing' : '—',
      ]),
    ),
  );

  const inventory = table(
    ['#', 'MODEL', 'CLASS', 'GRID', 'DEPTH', 'FUSED', 'CHANNELS', 'STATUS'],
    d.inventory.map((m) =>
      row([m.id, m.model, m.typeLabel, m.grid, m.depth, `${m.conf}%`, m.sensors.join(' '), m.status]),
    ),
  );

  const density = table(
    ['MEASURE', 'VALUE', 'UNIT', 'NOTE'],
    d.densityRows.map((r) => row([r.label, r.value, r.unit, r.note ?? '—'])),
  );

  const log = table(
    ['T', 'ENTRY'],
    d.surveyLog.map((l) => row([l.time.trim(), l.text])),
  );

  return shell(
    'DETECTION REPORT',
    view,
    facts([
      ['AREA SWEPT', `${d.sweptPct.toFixed(0)}%`],
      ['DEVICES MAPPED', String(d.mapped)],
      ['MEAN FUSED CONFIDENCE', `${d.meanConf.toFixed(0)}%`],
      ['FUSED QUALITY', `${(d.meanQuality * 100).toFixed(0)}%`],
      ['CHANNELS USABLE', `${d.channelsUp} of ${d.channels.length}`],
      ['SURVEY AGE', `${d.ageStr} ${d.ageUnit.toLowerCase()}`],
    ]) +
      section('Sensor coverage', channels) +
      section('Obstacle density', density) +
      section(`Device inventory (${d.inventory.length} listed)`, inventory) +
      note(
        'Confidence is a fused figure across every channel that resolved the ' +
          'device. A contact below 80% is reported PROBABLE and has not been ' +
          'corroborated to the confirmation threshold.',
      ) +
      section('Survey log', log),
  );
}

export function deminingReport(view: ViewModel): string {
  const n = view.neutralise;
  const sel = view.selected;

  const tasks = table(
    ['SEQ', '#', 'MODEL', 'CLASS', 'CHAINAGE', 'DEPTH', 'FUSED', 'SORTIE', 'STATE'],
    view.tasks.map((t) =>
      row([
        t.seq,
        t.id,
        t.model,
        t.typeLabel,
        `${t.chainageM.toFixed(0)} m`,
        t.depth,
        `${t.conf}%`,
        t.teamName,
        t.stateLabel,
      ]),
    ),
  );

  const sorties = table(
    ['SORTIE', 'CALLSIGN', 'ASSIGNED', 'COMPLETE', 'EFFORT'],
    n.teams.map((t) => row([t.name, t.callsign, t.assigned, t.done, `${Math.round(t.minutesTotal)} min`])),
  );

  const gates = table(
    ['GATE', 'FINDING', 'RESULT'],
    n.gate.map((g) => row([g.label, g.detail, g.pass ? 'PASS' : 'FAIL'])),
  );

  const lane = sel
    ? facts([
        ['LENGTH', `${sel.metrics.lengthM.toFixed(0)} m`],
        ['TURNS', String(sel.metrics.turns)],
        ['SURVEY CONFIDENCE', `${Math.round(sel.metrics.surveyMean * 100)}%`],
        ['UNSWEPT ON AXIS', `${sel.metrics.unsweptM.toFixed(0)} m`],
        ['BREACH EFFORT', view.laneHours],
        ['TIME TO OPEN', n.timeToOpenStr],
      ])
    : note('No lane has been selected. The tasking below is empty.');

  return shell(
    'DEMINING REPORT',
    view,
    facts([
      ['LANE', sel?.label ?? 'NO LANE SELECTED'],
      ['LANE WIDTH', `${view.corridorWidthM} m`],
      ['DEVICES TASKED', String(view.tasks.length)],
      ['CLEARED', `${n.progressPct.toFixed(0)}%`],
      ['PROOFED', `${n.proofedPct.toFixed(0)}%`],
      ['LANE STATUS', n.certified ? 'OPEN — CERTIFIED' : 'CLOSED — NOT CERTIFIED'],
    ]) +
      section('Lane', lane) +
      section('Clearance gates', gates) +
      section(`Sorties committed (${n.committed} of ${n.teams.length})`, sorties) +
      section(`Device tasking (${view.tasks.length} devices)`, tasks) +
      note(
        `Clearance avoided by breaching a lane rather than the whole obstacle: ` +
          `${view.savedPct.toFixed(1)}% of ${view.totalDevices} mapped devices are ` +
          `bypassed and remain emplaced outside the lane. Ground either side of ` +
          `the lane is not cleared and must stay marked.`,
      ),
  );
}

/** Hands the generated document to the browser as a download. */
export function downloadReport(filename: string, html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

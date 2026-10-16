import { T, eur, ct, type L } from './_kit';
import { pv } from './_calc';
import { vergleich2027 } from '../engine/eeg2027';
export default (l: L) => ({
  title: T(l, 'Inbetriebnahme 2026 oder 2027: was der Entwurf ändern würde', 'Commissioning in 2026 or 2027: what the draft would change'),
  cta: T(l, 'Einspeisevergütung 2026 rechnen', 'Work out the 2026 tariff'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 99, decimals: 1 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 4000, unit: 'kWh', max: 100000 }],
  run: ({ kwp, vb }: Record<string, number>) => { const r = pv({ kwp, vb }); const v = vergleich2027(kwp, r.einspeisung);
    return { head: [T(l, 'Vergütung 2026, 20 Jahre', 'Payment 2026, 20 years'), eur(v.summe26, l)], rows: [[T(l, 'Satz bei Inbetriebnahme 2026', 'Rate if commissioned in 2026'), ct(v.satz26, l)], [T(l, 'Entwurf 2027: Übergang, Satz', 'Draft 2027: transition rate'), v.berechtigt ? ct(v.satz27, l) : T(l, 'keine', 'none')], [T(l, `Entwurf 2027: Summe ${v.monate} Monate`, `Draft 2027: total for ${v.monate} months`), eur(v.summe27, l)]] as [string, string][], note: T(l, 'Entwurf, nicht in Kraft; Satz 2027 noch nicht festgelegt.', 'Draft, not in force; the 2027 rate is not yet set.') }; },
});

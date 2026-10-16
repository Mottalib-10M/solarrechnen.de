import { T, eur, kwh, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was eine Nulleinspeisung kostet', 'What zero export costs you'),
  cta: T(l, 'Speicher rechnen', 'Work out a battery'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 6, unit: 'kWp', max: 100, decimals: 1 }, { id: 'sp', label: T(l, 'Speicher (nutzbar)', 'Battery (usable)'), def: 5, unit: 'kWh', max: 40, decimals: 1 }],
  run: ({ kwp, sp }: Record<string, number>) => { const r = pv({ kwp, sp });
    return { head: [T(l, 'Ohne Einspeisung verloren', 'Lost without export'), kwh(r.einspeisung, l)], rows: [[T(l, 'entgangene Vergütung im Jahr', 'Feed-in income forgone per year'), eur(r.verguetungJahr, l)], [T(l, 'selbst genutzt bleibt', 'Self-used stays'), kwh(r.selbst, l)], [T(l, 'Ersparnis bleibt', 'Saving stays'), eur(r.ersparnisJahr, l)]] as [string, string][] }; },
});

import { T, pct, eur, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Wie groß der Speicher sein sollte', 'How big the battery should be'),
  cta: T(l, 'Stromspeicher-Rechner', 'Home battery calculator'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 8, unit: 'kWp', max: 100, decimals: 1 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 4500, unit: 'kWh', max: 100000 }],
  run: ({ kwp, vb }: Record<string, number>) => { const s = [0, 3, 6, 10].map((x) => pv({ kwp, vb, sp: x }));     return { head: [T(l, 'Autarkie mit 6 kWh', 'Self-sufficiency with 6 kWh'), pct(s[2].autarkie, l)], rows: [[T(l, 'Autarkie 0 / 3 / 6 / 10 kWh', 'Self-sufficiency 0 / 3 / 6 / 10 kWh'), s.map((r) => pct(r.autarkie, l)).join(' / ')], [T(l, 'Mehrnutzen mit 6 kWh', 'Extra benefit with 6 kWh'), eur(s[2].nutzenJahr - s[0].nutzenJahr, l)], [T(l, 'zusätzlich 6 → 10 kWh', 'extra 6 → 10 kWh'), eur(s[3].nutzenJahr - s[2].nutzenJahr, l)]] as [string, string][] }; },
});

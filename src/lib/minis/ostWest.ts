import { T, kwh, pct, eur, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Süddach oder Ost-West-Dach: Ertrag und Eigenverbrauch', 'South roof or east-west roof: yield and self-use'),
  cta: T(l, 'Mit Ihrer Postleitzahl', 'With your postcode'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 100, decimals: 1 }, { id: 'n', label: T(l, 'Dachneigung', 'Roof pitch'), def: 30, unit: '°', max: 60 }],
  run: ({ kwp, n }: Record<string, number>) => { const s = pv({ kwp, tilt: n }); const o = pv({ kwp, tilt: n, ow: true });
    return { head: [T(l, 'Ost-West im Vergleich zu Süd', 'East-west compared with south'), pct(o.ertrag / s.ertrag, l)], rows: [[T(l, 'Ertrag Süd / Ost-West', 'Yield south / east-west'), `${kwh(s.ertrag, l)} / ${kwh(o.ertrag, l)}`], [T(l, 'Eigenverbrauch Süd / Ost-West', 'Self-use south / east-west'), `${pct(s.eigenAnteil, l)} / ${pct(o.eigenAnteil, l)}`], [T(l, 'Nutzen im Jahr Süd / Ost-West', 'Benefit per year south / east-west'), `${eur(s.nutzenJahr, l)} / ${eur(o.nutzenJahr, l)}`]] as [string, string][] }; },
});

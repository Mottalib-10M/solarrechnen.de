import { T, eur, jahre, pct, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Ob sich Ihre Photovoltaikanlage rechnet', 'Whether your PV system pays'),
  cta: T(l, 'Mit Postleitzahl und Speicher', 'With postcode and battery'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 100, decimals: 1 }, { id: 'k', label: T(l, 'Kosten', 'Cost'), def: 15000, unit: '€', max: 500000 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 4000, unit: 'kWh', max: 100000 }],
  run: ({ kwp, k, vb }: Record<string, number>) => { const r = pv({ kwp, kosten: k, vb });
    return { head: [T(l, 'Amortisation', 'Payback'), jahre(r.amortisationJahre, l)], rows: [[T(l, 'Nutzen im Jahr', 'Benefit per year'), eur(r.nutzenJahr, l)], [T(l, 'davon Ersparnis / Vergütung', 'of which saving / feed-in'), `${eur(r.ersparnisJahr, l)} / ${eur(r.verguetungJahr, l)}`], [T(l, 'Eigenverbrauch', 'Self-consumption'), pct(r.eigenAnteil, l)], [T(l, 'Überschuss nach 20 Jahren', 'Net gain after 20 years'), eur(r.gewinn, l)]] as [string, string][] }; },
});

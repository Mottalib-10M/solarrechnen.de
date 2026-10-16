import { STROMPREIS_CT } from '../engine/params';
import { T, eur, jahre, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Nach wie vielen Jahren sich Ihr Balkonkraftwerk bezahlt hat', 'How many years until your balcony system pays for itself'),
  cta: T(l, 'Für Ihre Postleitzahl rechnen', 'Calculate for your postcode'),
  inputs: [{ id: 'k', label: T(l, 'Kaufpreis', 'Purchase price'), def: 450, unit: '€', max: 10000 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 2500, unit: 'kWh', max: 20000 }, { id: 'p', label: T(l, 'Strompreis', 'Electricity price'), def: STROMPREIS_CT, unit: 'ct', max: 200, decimals: 1 }],
  run: ({ k, vb, p }: Record<string, number>) => { const r = bk({ kosten: k, vb, preis: p, tilt: 90 });
    return { head: [T(l, 'Amortisation', 'Payback'), jahre(r.amortisationJahre, l)], rows: [[T(l, 'Ersparnis im Jahr (900 Wp senkrecht Süd)', 'Saving per year (900 Wp upright south)'), eur(r.ersparnisJahr, l)], [T(l, 'Ersparnis in 20 Jahren', 'Saving over 20 years'), eur(r.summe, l)], [T(l, 'Überschuss nach 20 Jahren', 'Net gain after 20 years'), eur(r.gewinn, l)]] as [string, string][] }; },
});

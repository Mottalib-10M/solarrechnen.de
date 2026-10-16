import { T, eur, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'In welchem Jahr die Anlage im Plus ist', 'The year your system breaks even'),
  cta: T(l, 'Photovoltaik-Rechner öffnen', 'Open the PV calculator'),
  inputs: [{ id: 'k', label: T(l, 'Kosten', 'Cost'), def: 15000, unit: '€', max: 500000 }, { id: 'g', label: T(l, 'Strompreis-Änderung pro Jahr', 'Electricity price change per year'), def: 0, unit: '%', max: 10, decimals: 1 }],
  run: ({ k, g }: Record<string, number>) => { const r = pv({ kosten: k, g: g / 100 }); let s = -k, jahr = 0;
    for (let j = 1; j <= 30 && !jahr; j++) { s += r.verguetungJahr + r.ersparnisJahr * Math.pow(1 + g / 100, j - 1); if (s >= 0) jahr = j; }
    return { head: [T(l, 'Im Plus ab Jahr', 'In profit from year'), jahr ? String(jahr) : T(l, 'nicht in 30 Jahren', 'not within 30 years')], rows: [[T(l, 'Nutzen im ersten Jahr (10 kWp)', 'Benefit in year one (10 kWp)'), eur(r.nutzenJahr, l)], [T(l, 'Summe über 20 Jahre', 'Total over 20 years'), eur(r.summe, l)], [T(l, 'Überschuss nach 20 Jahren', 'Net gain after 20 years'), eur(r.gewinn, l)]] as [string, string][] }; },
});

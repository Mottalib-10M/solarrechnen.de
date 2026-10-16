import { P } from '../engine/params';
import { T, eur, num, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was Ihre Anlage kostet und was eine Kilowattstunde kostet', 'What your system costs, and what a kilowatt-hour costs'),
  cta: T(l, 'Amortisation rechnen', 'Work out the payback'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 100, decimals: 1 }, { id: 'pk', label: T(l, 'Preis je kWp laut Angebot', 'Price per kWp in the quote'), def: 1500, unit: '€', max: 10000 }],
  run: ({ kwp, pk }: Record<string, number>) => { const k = kwp * pk; const r = pv({ kwp, kosten: k }); const kwhP = r.ertrag > 0 ? (k / (r.ertrag * P.eeg.dauer_jahre)) * 100 : 0;
    return { head: [T(l, 'Gesamtkosten', 'Total cost'), eur(k, l)], rows: [[T(l, 'Ertrag im Jahr (Bundesmittel)', 'Yield per year (German average)'), `${num(r.ertrag, l)} kWh`], [T(l, 'Kosten je kWh über 20 Jahre', 'Cost per kWh over 20 years'), `${num(kwhP, l, 1)} ct`], [T(l, 'Mehrwertsteuer', 'VAT'), kwp <= P.steuer.ust_null_bis_kwp ? T(l, '0 % (bis 30 kWp)', '0% (up to 30 kWp)') : T(l, 'regulär', 'standard rate')]] as [string, string][] }; },
});

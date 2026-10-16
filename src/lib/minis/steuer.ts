import { P } from '../engine/params';
import { T, eur, pct, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Was Nullsteuersatz und Steuerfreiheit für Ihre Anlage bedeuten', 'What the zero VAT rate and tax exemption mean for you'),
  cta: T(l, 'Amortisation rechnen', 'Work out the payback'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 1000, decimals: 1 }, { id: 'netto', label: T(l, 'Angebotspreis', 'Quoted price'), def: 15000, unit: '€', max: 1000000 }],
  run: ({ kwp, netto }: Record<string, number>) => { const null0 = kwp <= P.steuer.ust_null_bis_kwp; const frei = kwp <= P.steuer.estg_kwp_je_einheit;
    return { head: [T(l, 'Mehrwertsteuer gespart', 'VAT saved'), null0 ? eur(netto * P.steuer.ust_regelsatz, l) : eur(0, l)], rows: [[T(l, 'Umsatzsteuer auf Kauf und Montage', 'VAT on purchase and installation'), null0 ? '0 %' : pct(P.steuer.ust_regelsatz, l)], [T(l, 'Einnahmen einkommensteuerfrei', 'Income tax-free earnings'), frei ? T(l, `ja, bis ${P.steuer.estg_kwp_je_einheit} kWp je Einheit`, `yes, up to ${P.steuer.estg_kwp_je_einheit} kWp per unit`) : T(l, 'nur mit mehreren Wohneinheiten', 'only with several units')], [T(l, 'Gewinnermittlung nötig', 'Profit calculation needed'), frei ? T(l, 'nein', 'no') : T(l, 'prüfen', 'check')]] as [string, string][] }; },
});

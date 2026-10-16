import { T, eur, ct, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Volleinspeisung oder Teileinspeisung: was mehr bringt', 'Full or surplus feed-in: which earns more'),
  cta: T(l, 'Einspeisevergütung im Detail', 'Feed-in tariff in detail'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 100, decimals: 1 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 4000, unit: 'kWh', max: 100000 }],
  run: ({ kwp, vb }: Record<string, number>) => { const t = pv({ kwp, vb }); const v = pv({ kwp, vb, modus: 'voll' }); const besser = t.nutzenJahr >= v.nutzenJahr;
    return { head: [T(l, 'Mehr bringt', 'Better option'), besser ? T(l, 'Teileinspeisung', 'Surplus feed-in') : T(l, 'Volleinspeisung', 'Full feed-in')], rows: [[T(l, 'Teil: Nutzen im Jahr', 'Surplus: benefit per year'), eur(t.nutzenJahr, l)], [T(l, 'Voll: Nutzen im Jahr', 'Full: benefit per year'), eur(v.nutzenJahr, l)], [T(l, 'Sätze Teil / Voll', 'Rates surplus / full'), `${ct(t.satzCt, l)} / ${ct(v.satzCt, l)}`]] as [string, string][] }; },
});

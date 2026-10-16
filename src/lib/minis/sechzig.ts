import { T, eur, kwh, pct, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was die 60-Prozent-Grenze Ihre Anlage kostet', 'What the 60 per cent limit costs your system'),
  cta: T(l, 'Photovoltaik-Rechner öffnen', 'Open the PV calculator'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 99, decimals: 1 }, { id: 'sp', label: T(l, 'Speicher (nutzbar)', 'Battery (usable)'), def: 0, unit: 'kWh', max: 40, decimals: 1 }],
  run: ({ kwp, sp }: Record<string, number>) => { const ohne = pv({ kwp, sp }); const mit = pv({ kwp, sp, sm: true });
    return { head: [T(l, 'Abgeregelt ohne Smart Meter', 'Curtailed without a smart meter'), kwh(ohne.abgeregelt, l)], rows: [[T(l, 'Anteil am Ertrag', 'Share of output'), pct(ohne.ertrag ? ohne.abgeregelt / ohne.ertrag : 0, l, 1)], [T(l, 'entgangene Vergütung im Jahr', 'Feed-in income lost per year'), eur(ohne.abgeregelt * ohne.satzCt / 100, l)], [T(l, 'mit Smart Meter: Verlust bei negativen Preisen', 'with smart meter: loss at negative prices'), eur(mit.negVerlustJahr, l)]] as [string, string][] }; },
});

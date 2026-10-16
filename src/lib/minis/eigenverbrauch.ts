import { T, kwh, pct, eur, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Wie viel vom Balkonstrom Ihr Haushalt selbst nutzt', 'How much of the balcony power your home uses itself'),
  cta: T(l, 'Mit Speicher vergleichen', 'Compare with a battery'),
  inputs: [{ id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 2500, unit: 'kWh', max: 20000 }, { id: 'wp', label: T(l, 'Modulleistung', 'Panel output'), def: 900, unit: 'Wp', max: 2000 }],
  run: ({ vb, wp }: Record<string, number>) => { const r = bk({ wp, vb });
    return { head: [T(l, 'Eigenverbrauch', 'Self-consumption'), pct(r.eigenAnteil, l)], rows: [[T(l, 'Erzeugung (Bundesmittel, 35° Süd)', 'Output (German average, 35° south)'), kwh(r.ertrag, l)], [T(l, 'selbst genutzt', 'used at home'), kwh(r.selbst, l)], [T(l, 'unvergütet ins Netz', 'unpaid to the grid'), kwh(r.einspeisung, l)], [T(l, 'Ersparnis im Jahr', 'Saving per year'), eur(r.ersparnisJahr, l)]] as [string, string][] }; },
});

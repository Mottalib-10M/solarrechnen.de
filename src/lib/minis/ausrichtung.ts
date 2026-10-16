import { T, kwh, pct, azOpt, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was Himmelsrichtung und Neigung am Balkon ausmachen', 'What direction and tilt do on a balcony'),
  cta: T(l, 'Ganzen Rechner öffnen', 'Open the full calculator'),
  inputs: [{ id: 'az', label: T(l, 'Ausrichtung', 'Facing'), def: 90, options: azOpt(l) }, { id: 'n', label: T(l, 'Neigung', 'Tilt'), def: 90, options: [90, 70, 35, 15].map((x) => ({ value: String(x), label: `${x}°` })) }],
  run: ({ az, n }: Record<string, number>) => { const r = bk({ az, tilt: n }); const best = bk({ az: 0, tilt: 35 });
    return { head: [T(l, 'Erzeugung 900 Wp (Bundesmittel)', 'Output 900 Wp (German average)'), kwh(r.ertrag, l)], rows: [[T(l, 'im Vergleich zu 35° Süd', 'compared with 35° south'), pct(r.ertrag / best.ertrag, l)], [T(l, 'selbst genutzt (2 500 kWh)', 'used at home (2,500 kWh)'), kwh(r.selbst, l)], [T(l, 'Eigenverbrauchsanteil', 'Self-use share'), pct(r.eigenAnteil, l)]] as [string, string][] }; },
});

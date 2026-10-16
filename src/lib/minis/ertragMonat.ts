import { monatsAnteile, REG_MITTE } from '../engine/standort';
import { T, kwh, type L } from './_kit';
import { bk } from './_calc';
const MON_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export default (l: L) => ({
  title: T(l, 'Ertrag Ihres Balkonkraftwerks im Jahr und im Monat', 'Your balcony system’s output per year and month'),
  cta: T(l, 'Mit Ihrer Postleitzahl', 'With your postcode'),
  inputs: [{ id: 'wp', label: T(l, 'Modulleistung', 'Panel output'), def: 900, unit: 'Wp', max: 2000 }, { id: 'n', label: T(l, 'Neigung', 'Tilt'), def: 90, options: [90, 60, 35, 15].map((x) => ({ value: String(x), label: `${x}°` })) }],
  run: ({ wp, n }: Record<string, number>) => { const r = bk({ wp, tilt: n }); const m = monatsAnteile(REG_MITTE).map((x) => x * r.ertrag); const i = m.indexOf(Math.max(...m));
    return { head: [T(l, 'Erzeugung im Jahr (Bundesmittel)', 'Output per year (German average)'), kwh(r.ertrag, l)], rows: [[T(l, `stärkster Monat: ${MON_DE[i]}`, `best month: ${MON_EN[i]}`), kwh(m[i], l)], [T(l, 'Dezember', 'December'), kwh(m[11], l)], [T(l, 'April bis September', 'April to September'), kwh(m.slice(3, 9).reduce((a, b) => a + b, 0), l)]] as [string, string][] }; },
});

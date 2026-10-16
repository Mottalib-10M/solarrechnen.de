import { T, kwh, pct, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Wie viel Ihr Balkonkraftwerk ins Netz schiebt', 'How much your balcony system pushes into the grid'),
  cta: T(l, 'Ganzen Rechner öffnen', 'Open the full calculator'),
  inputs: [{ id: 'wp', label: T(l, 'Modulleistung', 'Panel output'), def: 900, unit: 'Wp', max: 2000 }, { id: 'vb', label: T(l, 'Stromverbrauch im Jahr', 'Annual consumption'), def: 2000, unit: 'kWh', max: 20000 }],
  run: ({ wp, vb }: Record<string, number>) => { const r = bk({ wp, vb });
    return { head: [T(l, 'Überschuss ins Netz', 'Surplus to the grid'), kwh(r.einspeisung, l)], rows: [[T(l, 'Anteil an der Erzeugung', 'Share of output'), pct(r.ertrag ? r.einspeisung / r.ertragBrutto : 0, l)], [T(l, 'Vergütung dafür', 'Payment for it'), T(l, 'keine (unentgeltliche Abnahme)', 'none (unpaid acceptance)')], [T(l, 'selbst genutzt', 'used at home'), kwh(r.selbst, l)]] as [string, string][] }; },
});

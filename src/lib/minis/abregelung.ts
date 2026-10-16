import { T, kwh, pct, azOpt, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was der 800-VA-Wechselrichter bei mehr Modulen abregelt', 'What the 800 VA inverter clips with more panels'),
  cta: T(l, 'Speicher dazurechnen', 'Add a battery'),
  inputs: [{ id: 'wp', label: T(l, 'Modulleistung', 'Panel output'), def: 2000, unit: 'Wp', max: 2000 }, { id: 'az', label: T(l, 'Ausrichtung', 'Facing'), def: 0, options: azOpt(l) }],
  run: ({ wp, az }: Record<string, number>) => { const r = bk({ wp, az, tilt: 35 });
    return { head: [T(l, 'Abgeregelt im Jahr', 'Clipped per year'), kwh(r.abgeregelt, l)], rows: [[T(l, 'Erzeugung vor dem Wechselrichter', 'Output before the inverter'), kwh(r.ertragBrutto, l)], [T(l, 'Anteil abgeregelt', 'Share clipped'), pct(r.ertragBrutto ? r.abgeregelt / r.ertragBrutto : 0, l, 1)], [T(l, 'nutzbar nach Wechselrichter', 'usable after the inverter'), kwh(r.ertrag, l)], [T(l, 'davon selbst genutzt (2 500 kWh)', 'of which used at home (2,500 kWh)'), kwh(r.selbst, l)]] as [string, string][] }; },
});

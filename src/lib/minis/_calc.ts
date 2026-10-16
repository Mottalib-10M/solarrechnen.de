/** Rechenkurzformen der Mini-Rechner: Bundesmittel (keine Postleitzahl), Motor des Sites. */
import { rechneBalkon } from '../engine/balkon';
import { rechnePv } from '../engine/pv';
import { STROMPREIS_CT } from '../engine/params';
export const bk = (o: { wp?: number; tilt?: number; az?: number; sp?: number; vb?: number; preis?: number; kosten?: number; schatten?: number }) =>
  rechneBalkon({ ort: null, modulWp: o.wp ?? 900, wechselrichterVa: 800, neigung: o.tilt ?? 35, azimut: o.az ?? 0, verschattung: o.schatten ?? 0, speicherKwh: o.sp ?? 0, verbrauchKwh: o.vb ?? 2500, preisCt: o.preis ?? STROMPREIS_CT, kostenEur: o.kosten ?? 450 });
export const pv = (o: { kwp?: number; tilt?: number; az?: number; ow?: boolean; sp?: number; vb?: number; modus?: 'teil' | 'voll'; sm?: boolean; preis?: number; kosten?: number; g?: number; inb?: string }) =>
  rechnePv({ ort: null, kwp: o.kwp ?? 10, neigung: o.tilt ?? 30, azimut: o.az ?? 0, ostWest: o.ow, verbrauchKwh: o.vb ?? 4000, speicherKwh: o.sp ?? 0, modus: o.modus ?? 'teil', smartMeter: o.sm ?? false, preisCt: o.preis ?? STROMPREIS_CT, kostenEur: o.kosten ?? 15000, preisSteigerung: o.g, inbetrieb: o.inb });

/**
 * Eigenverbrauch aus den Simulationstabellen (src/data/eigenverbrauch.json, scripts/data/build-eigenverbrauch.py):
 * 74 gemessene Haushalte (HTW Berlin) je Viertelstunde gegen die PVGIS-Erzeugung von 20 Ausrichtungsformen.
 * Zwischen den Stützstellen wird linear interpoliert (Ertrag, Verbrauch, Speicher, Neigung, Himmelsrichtung).
 */
import EV from '../../data/eigenverbrauch.json';
import { KAPPUNG, clamp } from './params';

export const EIGEN = EV;
const TILTS = EV.tilts as number[];
const ASP = EV.aspects as number[];
type Tab = { self: number[]; lost: number[] };

/** Stützstelle und Gewicht auf einer sortierten Achse; außerhalb wird am Rand gehalten. */
function axis(xs: number[], x: number): [number, number, number] {
  if (x <= xs[0]) return [0, 0, 0];
  if (x >= xs[xs.length - 1]) return [xs.length - 1, xs.length - 1, 0];
  let i = 0; while (xs[i + 1] < x) i++;
  return [i, i + 1, (x - xs[i]) / (xs[i + 1] - xs[i])];
}
/** Gewichtete Formen (Neigung x Himmelsrichtung). Nordlagen werden auf Ost oder West begrenzt. */
function formen(neigung: number, azimut: number, ohne90 = false): Array<[string, number]> {
  const ts = ohne90 ? TILTS.filter((t) => t !== 90) : TILTS;
  const [ti, tj, tf] = axis(ts, clamp(neigung, ts[0], ts[ts.length - 1]));
  const [ai, aj, af] = axis(ASP, clamp(azimut, -90, 90));
  const out: Array<[string, number]> = [];
  for (const [t, wt] of [[ts[ti], 1 - tf], [ts[tj], tf]] as const) for (const [a, wa] of [[ASP[ai], 1 - af], [ASP[aj], af]] as const) if (wt * wa > 0) out.push([`${t}_${a}`, wt * wa]);
  return out.length ? out : [[`${ts[ti]}_${ASP[ai]}`, 1]];
}
function tri(tab: Tab, axes: number[][], vals: number[]): { self: number; lost: number } {
  const [x0, x1, fx] = axis(axes[0], vals[0]); const [y0, y1, fy] = axis(axes[1], vals[1]); const [z0, z1, fz] = axis(axes[2], vals[2]);
  const ny = axes[1].length, nz = axes[2].length;
  const at = (i: number, j: number, k: number) => (i * ny + j) * nz + k;
  let s = 0, l = 0;
  for (const [i, wi] of [[x0, 1 - fx], [x1, fx]]) for (const [j, wj] of [[y0, 1 - fy], [y1, fy]]) for (const [k, wk] of [[z0, 1 - fz], [z1, fz]]) {
    const w = wi * wj * wk; if (!w) continue; const n = at(i, j, k); s += w * tab.self[n]; l += w * tab.lost[n];
  }
  return { self: s / 1000, lost: l / 1000 };
}
export interface Anteile { selbst: number; verloren: number; einspeisung: number }

/** Balkonkraftwerk (800 VA): Anteile am ungedrosselten Jahresertrag. ertrag = kWh/Jahr vor Wechselrichtergrenze. */
export function anteileBalkon(ertrag: number, verbrauch: number, speicherKwh: number, neigung: number, azimut: number): Anteile {
  const B = EV.balkon; let s = 0, l = 0;
  for (const [k, w] of formen(neigung, azimut)) {
    const r = tri((B.tables as Record<string, Tab>)[k], [B.E, B.L, B.B], [ertrag, verbrauch, speicherKwh]);
    s += w * r.self; l += w * r.lost;
  }
  return { selbst: s, verloren: l, einspeisung: Math.max(0, 1 - s - l) };
}
export type Grenze = 'none' | '60' | '50';
/** Dachanlage: Anteile am Jahresertrag. Verhältnis Ertrag/Verbrauch, Speicher je 1 000 kWh Verbrauch. */
export function anteileDach(ertrag: number, verbrauch: number, speicherKwh: number, neigung: number, azimut: number, grenze: Grenze): Anteile {
  const D = EV.dach; let s = 0, l = 0;
  const r = verbrauch > 0 ? ertrag / verbrauch : D.R[D.R.length - 1];
  const b = verbrauch > 0 ? (speicherKwh / verbrauch) * 1000 : 0;
  for (const [k, w] of formen(neigung, azimut, true)) {
    const t = (D.tables as Record<string, Tab>)[`${k}_${grenze}`];
    const [x0, x1, fx] = axis(D.R, r); const [y0, y1, fy] = axis(D.B, b); const nb = D.B.length;
    let ss = 0, ll = 0;
    for (const [i, wi] of [[x0, 1 - fx], [x1, fx]]) for (const [j, wj] of [[y0, 1 - fy], [y1, fy]]) { const ww = wi * wj; if (!ww) continue; ss += ww * t.self[i * nb + j]; ll += ww * t.lost[i * nb + j]; }
    s += w * ss / 1000; l += w * ll / 1000;
  }
  if (verbrauch <= 0) s = 0;
  // Jenseits der letzten Stützstelle (Ertrag > 4 x Verbrauch) bleibt die selbst genutzte Menge in kWh gleich:
  // der Haushalt braucht nicht mehr, nur weil die Anlage größer wird. Der Anteil sinkt daher mit 1/r.
  const rMax = D.R[D.R.length - 1];
  if (r > rMax) s = s * rMax / r;
  return { selbst: s, verloren: l, einspeisung: Math.max(0, 1 - s - l) };
}
/** Volleinspeisung: Anteil oberhalb der Leistungsgrenze (0,5 / 0,6 / 0,7 der Nennleistung), ohne Verbrauch. */
export function kappungOhneVerbrauch(neigung: number, azimut: number, anteil: number): number {
  const gi = KAPPUNG.grenzen.indexOf(anteil); if (gi < 0) return 0;
  let v = 0;
  for (const [k, w] of formen(neigung, azimut)) v += w * (KAPPUNG.formen[k]?.[gi] ?? 0);
  return v;
}

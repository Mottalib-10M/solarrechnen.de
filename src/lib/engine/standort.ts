/**
 * Standort: Postleitzahl -> PVGIS-Rasterknoten -> Jahresertrag je kWp, für jede Neigung und Himmelsrichtung.
 * Ertrag bei 35° Süd aus dem Raster (838 Knoten), Umrechnung auf andere Ausrichtungen mit der Matrix der
 * Großregion (28 Regionen, je 81 PVGIS-Abfragen). Daten: src/data/standort.json (scripts/data/build-standort.py).
 */
import S from '../../data/standort.json';
import { clamp } from './params';

export const STANDORT = S;
export interface Ort { plz: string; node: number; lat: number; lon: number; ey: number; name: string; reg: number; direkt: boolean }

/** PVGIS-Wert je Postleitzahl (35° Süd), kompakt in standort.json: PLZ-Differenzen und kWh in Basis 36. */
let PLZ: number[] | null = null, EYP: number[] | null = null;
function dekodiere() {
  if (PLZ) return;
  const pk = S.pk as string, ek = S.ek as string; PLZ = []; EYP = [];
  let acc = 0;
  for (let i = 0; i < pk.length; i += 3) { acc += parseInt(pk.slice(i, i + 3), 36); PLZ.push(acc); }
  for (let i = 0; i < ek.length; i += 2) EYP.push(parseInt(ek.slice(i, i + 2), 36));
}
function eyDirekt(n: number): number | null {
  dekodiere(); let lo = 0, hi = PLZ!.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (PLZ![m] === n) return EYP![m]; if (PLZ![m] < n) lo = m + 1; else hi = m - 1; }
  return null;
}

/** Knoten für eine Postleitzahl; null, wenn die Eingabe keine deutsche PLZ sein kann. */
export function ortVonPlz(plz: string): Ort | null {
  const p = plz.replace(/\D/g, '');
  if (p.length !== 5) return null;
  const n = Number(p);
  if (n < 1001 || n > 99998) return null;
  const runs = S.runs as [number, number][];
  let lo = 0, hi = runs.length - 1, k = 0;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (runs[m][0] <= n) { k = m; lo = m + 1; } else hi = m - 1; }
  const node = runs[k][1];
  const d = eyDirekt(n);
  return { plz: p, node, lat: S.lat[node], lon: S.lon[node], ey: d ?? S.ey[node], name: S.name[node], reg: S.reg[node], direkt: d !== null };
}

const TILTS = S.tilts as number[];
const ASPECTS = S.aspects as number[]; // -180 … 135 in 45°-Schritten
/** Faktor gegenüber 35° Süd, bilinear über Neigung und Himmelsrichtung (Azimut 0 = Süd, -90 = Ost, 90 = West). */
export function ausrichtungsFaktor(reg: number, neigung: number, azimut: number): number {
  const M = S.matrix[reg] as number[][];
  const t = clamp(neigung, 0, 90);
  let i = TILTS.findIndex((x, j) => t >= x && t <= (TILTS[j + 1] ?? 90));
  if (i < 0) i = TILTS.length - 2;
  if (i >= TILTS.length - 1) i = TILTS.length - 2;
  const ft = (t - TILTS[i]) / (TILTS[i + 1] - TILTS[i]);
  let a = ((azimut + 180) % 360 + 360) % 360 - 180; // -180 … 180
  const pos = (a + 180) / 45; const j0 = Math.floor(pos) % ASPECTS.length; const j1 = (j0 + 1) % ASPECTS.length; const fa = pos - Math.floor(pos);
  const row = (r: number[]) => r[j0] * (1 - fa) + r[j1] * fa;
  return row(M[i]) * (1 - ft) + row(M[i + 1]) * ft;
}
/** Jahresertrag in kWh je kWp an einem Ort (Wert der PLZ, sonst Rasterknoten) für Neigung und Azimut. */
export function spezErtragOrt(o: Ort, neigung: number, azimut: number): number {
  return o.ey * ausrichtungsFaktor(o.reg, neigung, azimut);
}
export function spezErtragOstWestOrt(o: Ort, neigung: number): number {
  return (spezErtragOrt(o, neigung, -90) + spezErtragOrt(o, neigung, 90)) / 2;
}
/** Bezugsregion für Rechnungen ohne Postleitzahl (Mitte Deutschlands, Kassel). */
export const REG_MITTE = (() => { const o = ortVonPlz('34117'); return o ? o.reg : 0; })();
/** Bundesdurchschnitt nach Einwohnern, 35° Süd. */
export const EY_BUND = S.bund;
/** Rang eines Knotens: Anteil der Knoten mit niedrigerem Ertrag (0 … 1). */
export function perzentil(ey: number): number {
  const all = S.ey as number[]; return all.filter((x) => x < ey).length / all.length;
}
/** Monatsanteile am Jahresertrag in der Region des Knotens. */
export const monatsAnteile = (reg: number) => S.monate[reg] as number[];
/** Zahl der einzeln bei PVGIS abgefragten Postleitzahlen. */
export const PLZ_ANZAHL = (S.pk as string).length / 3;

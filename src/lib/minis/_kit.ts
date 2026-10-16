/** Gemeinsame Helfer der Mini-Rechner (vom Register ignoriert: Präfix „_“). */
import { formatMoney, formatPercent, formatNumber } from '../format';
export type L = 'de' | 'en';
export const T = <A>(l: L, de: A, en: A) => (l === 'en' ? en : de);
export const eur = (x: number, l: L, d = 0) => formatMoney(x, d, l);
export const pct = (x: number, l: L, d = 0) => formatPercent(x, d, l);
export const num = (x: number, l: L, d = 0) => formatNumber(x, d, l);
export const kwh = (x: number, l: L) => `${formatNumber(Math.round(x), 0, l)} kWh`;
export const ct = (x: number, l: L) => `${formatNumber(x, 2, l)} ct/kWh`;
export const jahre = (x: number | null, l: L) => (x === null || !isFinite(x) ? '–' : T(l, `${formatNumber(x, 1, l)} Jahre`, `${formatNumber(x, 1, l)} years`));
export const azOpt = (l: L) => [
  { value: '0', label: T(l, 'Süd', 'South') }, { value: '-45', label: T(l, 'Südost', 'South-east') }, { value: '45', label: T(l, 'Südwest', 'South-west') },
  { value: '-90', label: T(l, 'Ost', 'East') }, { value: '90', label: T(l, 'West', 'West') },
];
export const janein = (l: L) => [{ value: '0', label: T(l, 'Nein', 'No') }, { value: '1', label: T(l, 'Ja', 'Yes') }];
export type Rows = [string, string][];

/**
 * Zahlenformat für Texte außerhalb von `body(h)`: zitierbarer Absatz, FAQ, Titel. Jede Rechtszahl kommt aus P,
 * jedes Beispielergebnis aus dem Motor; geschrieben wird sie nur über diese Formatierer (RECETTE §4.1, §17.4).
 */
import { formatMoney, formatNumber, formatPercent } from './format';
export { P, EEG, STROM, STROMPREIS_CT, SMARD, SMARD_JAHR } from './engine/params';
const mk = (l: 'de' | 'en') => ({
  eur: (n: number, d = 0) => formatMoney(n, d, l),
  num: (n: number, d = 0) => formatNumber(n, d, l),
  pct: (x: number, d = 0) => formatPercent(x, d, l),
  ct: (x: number) => `${formatNumber(x, 2, l)} ct/kWh`,
});
export const DE = mk('de');
export const EN = mk('en');

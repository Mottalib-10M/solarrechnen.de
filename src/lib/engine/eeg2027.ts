/**
 * Entwurf EEG 2027 (BT-Drs. 21/7867, nicht in Kraft): befristete Übergangszahlung = anzulegender Wert minus 1 ct
 * für höchstens 36 Monate, danach keine Netzbetreiber-Vergütung mehr (Direktvermarktung). Nur zum Vergleich in einem
 * Ratgeber, nie im Rechner als geltendes Recht. Anzulegender Wert nach § 48 Abs. 1 im Entwurf: einheitlich 6,2 Cent
 * (P.eeg2027.anzulegend_ct), Inbetriebnahme vor der ersten Degression am 01.08.2027.
 */
import { P } from './params';
import { AKTUELL, mischsatz } from './eeg';
export function vergleich2027(kwp: number, einspeisungKwh: number) {
  const satz26 = mischsatz(AKTUELL, kwp, 'teil');
  const summe26 = einspeisungKwh * satz26 / 100 * P.eeg.dauer_jahre;
  const satz27 = Math.max(0, P.eeg2027.anzulegend_ct - P.eeg2027.uebergang_abzug_ct);
  const berechtigt = kwp < P.eeg2027.uebergang_kw[0]; // Inbetriebnahme 2027: unter 50 kW
  const summe27 = berechtigt ? einspeisungKwh * satz27 / 100 * (P.eeg2027.uebergang_monate / 12) : 0;
  return { satz26, summe26, satz27, summe27, berechtigt, monate: P.eeg2027.uebergang_monate };
}

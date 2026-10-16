/** Einspeisevergütung nach EEG 2023: Satz des Inbetriebnahme-Zeitraums (Bundesnetzagentur), gestaffelt nach Leistung. */
import { EEG, P } from './params';

export type Modus = 'teil' | 'voll';
export interface Periode { von: string; bis: string; teil: number[]; voll: number[]; sonstige: number }
export const PERIODEN = EEG.perioden as Periode[];
export const AKTUELL = PERIODEN[PERIODEN.length - 1];
/** Zeitraum für ein ISO-Datum (JJJJ-MM-TT); null außerhalb der veröffentlichten Zeiträume. */
export function periode(datum: string): Periode | null {
  return PERIODEN.find((p) => datum >= p.von && datum <= p.bis) ?? null;
}
/**
 * Mischsatz in ct/kWh für eine Anlage von kwp Leistung auf einem Gebäude: die ersten 10 kW zum ersten Satz,
 * der Teil bis 40 kW zum zweiten, bis 100 kW zum dritten (§ 48 Abs. 2 EEG 2023, anteilig nach Leistung).
 */
export function mischsatz(p: Periode, kwp: number, modus: Modus): number {
  if (kwp <= 0) return 0;
  const s = modus === 'teil' ? p.teil : p.voll; const g = EEG.grenzen_kw;
  const k = Math.min(kwp, g[2]);
  const t1 = Math.min(k, g[0]), t2 = Math.max(0, Math.min(k, g[1]) - g[0]), t3 = Math.max(0, k - g[1]);
  return (t1 * s[0] + t2 * s[1] + t3 * s[2]) / k;
}
/** Gilt für die Anlage die 60-%-Grenze (§ 9 Abs. 2 EEG 2023, Neuanlage ab 25.02.2025, ohne Smart Meter)? */
export function sechzigProzent(inbetrieb: string, kwp: number, smartMeter: boolean, steckersolar = false): boolean {
  if (steckersolar || smartMeter) return false;
  return inbetrieb >= P.solarspitzen.stichtag && kwp < P.solarspitzen.begrenzung_bis_kw;
}
/** Entfällt die Vergütung bei negativen Preisen (§ 51 Abs. 2 Nr. 1: erst ab dem Jahr nach dem Smart-Meter-Einbau)? */
export function negPreisGilt(inbetrieb: string, kwp: number, smartMeter: boolean): boolean {
  if (inbetrieb < P.solarspitzen.stichtag) return false;
  if (kwp < P.solarspitzen.neg_preis_bis_kw) return smartMeter;
  return true;
}
/** Zahlung an den Netzbetreiber bei fehlender Registrierung (§ 52 EEG 2023), in Euro. */
export function mastrZahlung(kwp: number, monate: number, nachgeholt: boolean): number {
  const satz = nachgeholt ? P.mastr.zahlung_nach_nachholung_eur_kw_monat : P.mastr.zahlung_eur_kw_monat;
  return Math.max(0, kwp) * Math.max(0, Math.ceil(monate)) * satz;
}

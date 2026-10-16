/** Typisierter Zugriff auf die Datendateien: jeder Rechtswert und jede Annahme steht dort, nie in Seiten oder Code. */
import raw from '../../data/params-2026.json';
import eegRaw from '../../data/eeg-saetze.json';
import stromRaw from '../../data/strompreis.json';
import smardRaw from '../../data/smard.json';
import kappRaw from '../../data/kappung.json';

export type SourceKey = keyof typeof raw.sources;
export type Params = typeof raw;
export const P: Params = raw;
export const EEG = eegRaw;
export const STROM = stromRaw;
export const SMARD = smardRaw as { source: string; retrieved_at: string; years: Record<string, { hours: number; neg_hours: number; pv_neg_share: number; pv_marktwert_ct: number; months: Record<string, { neg_hours: number; pv_neg_share: number }> }> };
export const KAPPUNG = kappRaw as { grenzen: number[]; formen: Record<string, number[]> };
/** Strompreis Haushalt in ct/kWh, eine Nachkommastelle (Eurostat, letztes Halbjahr). */
export const STROMPREIS_CT = Math.round(STROM.eur_kwh * 1000) / 10;
/** Letztes vollständiges Jahr der SMARD-Auswertung (negative Preise). */
export const SMARD_JAHR = Object.keys(SMARD.years).filter((y) => SMARD.years[y].hours >= 8700).sort().pop()!;
export const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

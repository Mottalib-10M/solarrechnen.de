/** Balkonkraftwerk: Ertrag am Standort, Eigenverbrauch, Ersparnis und Amortisation. */
import { P } from './params';
import { spezErtragOrt, ausrichtungsFaktor, REG_MITTE, EY_BUND, type Ort } from './standort';
import { anteileBalkon } from './eigen';

export interface BalkonEingabe {
  /** Ort (ortVonPlz) oder null: dann Bundesdurchschnitt. */
  ort: Ort | null;
  modulWp: number; wechselrichterVa: number; neigung: number; azimut: number;
  /** Verschattung als Anteil (0 … 0,8), senkt den Ertrag. */
  verschattung: number;
  speicherKwh: number; verbrauchKwh: number; preisCt: number; kostenEur: number;
  /** Strompreisänderung pro Jahr (0,02 = 2 %), für die Summe über die Laufzeit. */
  preisSteigerung?: number; jahre?: number;
}
export interface BalkonErgebnis {
  spez: number; ertragBrutto: number; ertrag: number; selbst: number; einspeisung: number; abgeregelt: number;
  eigenAnteil: number; autarkie: number; ersparnisJahr: number; amortisationJahre: number | null; summe: number; gewinn: number;
  zulaessig: boolean; grund: string[];
}
export function rechneBalkon(e: BalkonEingabe): BalkonErgebnis {
  const spez = e.ort === null ? EY_BUND * ausrichtungsFaktor(REG_MITTE, e.neigung, e.azimut) : spezErtragOrt(e.ort, e.neigung, e.azimut);
  const brutto = (e.modulWp / 1000) * spez * (1 - Math.min(0.8, Math.max(0, e.verschattung)));
  const a = anteileBalkon(brutto, e.verbrauchKwh, e.speicherKwh, e.neigung, e.azimut);
  const selbst = brutto * a.selbst, verloren = brutto * a.verloren;
  const ertrag = brutto - verloren;
  const ersparnis = selbst * e.preisCt / 100;
  const jahre = e.jahre ?? 20, g = e.preisSteigerung ?? 0;
  let summe = 0; for (let j = 0; j < jahre; j++) summe += ersparnis * Math.pow(1 + g, j);
  const grund: string[] = [];
  if (e.modulWp > P.balkon.max_wp) grund.push('wp');
  if (e.wechselrichterVa > P.balkon.max_va) grund.push('va');
  return {
    spez, ertragBrutto: brutto, ertrag, selbst, einspeisung: brutto * a.einspeisung, abgeregelt: verloren,
    eigenAnteil: brutto > 0 ? selbst / brutto : 0, autarkie: e.verbrauchKwh > 0 ? selbst / e.verbrauchKwh : 0,
    ersparnisJahr: ersparnis, amortisationJahre: ersparnis > 0 ? e.kostenEur / ersparnis : null, summe, gewinn: summe - e.kostenEur,
    zulaessig: grund.length === 0, grund,
  };
}

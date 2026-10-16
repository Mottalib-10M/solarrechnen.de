/** Photovoltaik auf dem Dach: Ertrag, Eigenverbrauch, Einspeisung mit Vergütung des Inbetriebnahme-Zeitraums, Amortisation. */
import { P, SMARD, SMARD_JAHR } from './params';
import { spezErtragOrt, spezErtragOstWestOrt, ausrichtungsFaktor, REG_MITTE, EY_BUND, type Ort } from './standort';
import { anteileDach, kappungOhneVerbrauch, type Grenze } from './eigen';
import { periode, mischsatz, sechzigProzent, negPreisGilt, AKTUELL, type Modus } from './eeg';

export interface PvEingabe {
  ort: Ort | null; kwp: number; neigung: number; azimut: number; ostWest?: boolean;
  verbrauchKwh: number; speicherKwh: number; modus: Modus; smartMeter: boolean;
  /** Inbetriebnahme, ISO-Datum; Standard: Beginn des aktuellen Zeitraums. */
  inbetrieb?: string; preisCt: number; kostenEur: number; preisSteigerung?: number; jahre?: number;
}
export interface PvErgebnis {
  spez: number; ertrag: number; selbst: number; einspeisung: number; abgeregelt: number; eigenAnteil: number; autarkie: number;
  satzCt: number; verguetungJahr: number; negVerlustJahr: number; ersparnisJahr: number; nutzenJahr: number;
  amortisationJahre: number | null; summe: number; gewinn: number; grenze: Grenze; negPreis: boolean; periodeVon: string; periodeBis: string;
  steuerfrei: boolean; nullsteuer: boolean;
}
export function spezDach(ort: Ort | null, neigung: number, azimut: number, ostWest = false): number {
  if (ort === null) return ostWest ? EY_BUND * (ausrichtungsFaktor(REG_MITTE, neigung, -90) + ausrichtungsFaktor(REG_MITTE, neigung, 90)) / 2 : EY_BUND * ausrichtungsFaktor(REG_MITTE, neigung, azimut);
  return ostWest ? spezErtragOstWestOrt(ort, neigung) : spezErtragOrt(ort, neigung, azimut);
}
/** Anteil des Solarstroms, der im letzten vollen SMARD-Jahr in Stunden mit negativem Preis erzeugt wurde. */
export const NEG_ANTEIL = SMARD.years[SMARD_JAHR].pv_neg_share;

export function rechnePv(e: PvEingabe): PvErgebnis {
  const inb = e.inbetrieb ?? AKTUELL.von;
  const per = periode(inb) ?? AKTUELL;
  const spez = spezDach(e.ort, e.neigung, e.azimut, e.ostWest);
  const ertrag = e.kwp * spez;
  const grenze: Grenze = sechzigProzent(inb, e.kwp, e.smartMeter) ? '60' : 'none';
  let selbst = 0, einsp = 0, lost = 0;
  if (e.modus === 'voll') {
    const k = grenze === '60' ? (e.ostWest ? (kappungOhneVerbrauch(e.neigung, -90, 0.6) + kappungOhneVerbrauch(e.neigung, 90, 0.6)) / 2 : kappungOhneVerbrauch(e.neigung, e.azimut, 0.6)) : 0;
    lost = ertrag * k; einsp = ertrag - lost;
  } else {
    const an = e.ostWest
      ? (() => { const a = anteileDach(ertrag, e.verbrauchKwh, e.speicherKwh, e.neigung, -90, grenze), b = anteileDach(ertrag, e.verbrauchKwh, e.speicherKwh, e.neigung, 90, grenze); return { selbst: (a.selbst + b.selbst) / 2, verloren: (a.verloren + b.verloren) / 2, einspeisung: (a.einspeisung + b.einspeisung) / 2 }; })()
      : anteileDach(ertrag, e.verbrauchKwh, e.speicherKwh, e.neigung, e.azimut, grenze);
    selbst = ertrag * an.selbst; lost = ertrag * an.verloren; einsp = ertrag * an.einspeisung;
  }
  const satz = mischsatz(per, e.kwp, e.modus);
  const neg = negPreisGilt(inb, e.kwp, e.smartMeter);
  const negVerlust = neg ? einsp * NEG_ANTEIL * satz / 100 : 0;
  const verg = einsp * satz / 100 - negVerlust;
  const ersparnis = selbst * e.preisCt / 100;
  const nutzen = verg + ersparnis;
  const jahre = e.jahre ?? P.eeg.dauer_jahre, g = e.preisSteigerung ?? 0;
  let summe = 0; for (let j = 0; j < jahre; j++) summe += verg + ersparnis * Math.pow(1 + g, j);
  return {
    spez, ertrag, selbst, einspeisung: einsp, abgeregelt: lost, eigenAnteil: ertrag > 0 ? selbst / ertrag : 0, autarkie: e.verbrauchKwh > 0 ? selbst / e.verbrauchKwh : 0,
    satzCt: satz, verguetungJahr: verg, negVerlustJahr: negVerlust, ersparnisJahr: ersparnis, nutzenJahr: nutzen,
    amortisationJahre: nutzen > 0 ? e.kostenEur / nutzen : null, summe, gewinn: summe - e.kostenEur, grenze, negPreis: neg,
    periodeVon: per.von, periodeBis: per.bis, steuerfrei: e.kwp <= P.steuer.estg_kwp_je_einheit, nullsteuer: e.kwp <= P.steuer.ust_null_bis_kwp,
  };
}

/**
 * Moteur : cas de référence recalculés à la main ou relevés à la source (BNetzA, PVGIS), règles datées des deux côtés
 * de leur date (RECETTE §17.4), bilan énergétique.
 */
import { describe, expect, it } from 'vitest';
import { PERIODEN, AKTUELL, periode, mischsatz, sechzigProzent, negPreisGilt, mastrZahlung } from '../src/lib/engine/eeg';
import { ortVonPlz, ausrichtungsFaktor, STANDORT } from '../src/lib/engine/standort';
import { anteileBalkon, anteileDach } from '../src/lib/engine/eigen';
import { rechneBalkon } from '../src/lib/engine/balkon';
import { rechnePv } from '../src/lib/engine/pv';
import { vergleich2027 } from '../src/lib/engine/eeg2027';
import { P } from '../src/lib/engine/params';
import REF from './referenz.json';

describe('Einspeisevergütung (Bundesnetzagentur)', () => {
  it('Satz ab 1. August 2026, wie auf der Seite der BNetzA veröffentlicht', () => {
    const p = periode('2026-10-15')!;
    expect(p.von).toBe('2026-08-01'); expect(p.bis).toBe('2026-12-31');
    expect(p.teil).toEqual([7.7, 6.66, 5.44]); expect(p.voll).toEqual([12.22, 10.24, 10.24]);
  });
  it('Satz Februar bis Juli 2026', () => {
    const p = periode('2026-03-01')!; expect(p.teil).toEqual([7.78, 6.73, 5.5]); expect(p.voll[0]).toBe(12.34);
  });
  it('Degression: jeder Zeitraum 1 % unter dem vorigen (§ 49 EEG), auf Rundung genau', () => {
    for (let i = 2; i < PERIODEN.length; i++) for (let k = 0; k < 3; k++)
      expect(Math.abs((PERIODEN[i].teil[k] + 0.4) - (PERIODEN[i - 1].teil[k] + 0.4) * 0.99)).toBeLessThanOrEqual(0.011); // Degression auf den anzulegenden Wert (Vergütung + 0,4 ct, § 53)
  });
  it('Mischsätze von Hand: 10, 15, 50 kWp', () => {
    expect(mischsatz(AKTUELL, 10, 'teil')).toBeCloseTo(7.7, 6);
    expect(mischsatz(AKTUELL, 15, 'teil')).toBeCloseTo((10 * 7.7 + 5 * 6.66) / 15, 6); // 7,3533
    expect(mischsatz(AKTUELL, 50, 'teil')).toBeCloseTo((10 * 7.7 + 30 * 6.66 + 10 * 5.44) / 50, 6); // 6,624
    expect(mischsatz(AKTUELL, 15, 'voll')).toBeCloseTo((10 * 12.22 + 5 * 10.24) / 15, 6); // 11,56
  });
  it('außerhalb der veröffentlichten Zeiträume: null', () => { expect(periode('2027-01-01')).toBeNull(); expect(periode('2022-12-31')).toBeNull(); });
});

describe('Solarspitzengesetz und Pflichten', () => {
  it('60-%-Grenze erst ab Inbetriebnahme 25.02.2025, nicht mit Smart Meter, nicht ab 100 kW, nie für Steckersolargeräte', () => {
    expect(sechzigProzent('2025-02-24', 10, false)).toBe(false);
    expect(sechzigProzent('2025-02-25', 10, false)).toBe(true);
    expect(sechzigProzent('2026-08-01', 10, true)).toBe(false);
    expect(sechzigProzent('2026-08-01', 100, false)).toBe(false);
    expect(sechzigProzent('2026-08-01', 0.8, false, true)).toBe(false);
  });
  it('negative Preise: unter 100 kW nur mit Smart Meter, Altanlagen nie (§ 51 Abs. 2, § 100 Abs. 46)', () => {
    expect(negPreisGilt('2026-08-01', 10, false)).toBe(false);
    expect(negPreisGilt('2026-08-01', 10, true)).toBe(true);
    expect(negPreisGilt('2025-01-10', 10, true)).toBe(false);
    expect(negPreisGilt('2026-08-01', 150, false)).toBe(true);
  });
  it('§ 52 EEG: 10 € je kW und Monat, 2 € nach Nachholung', () => {
    expect(mastrZahlung(10, 3, false)).toBe(300);
    expect(mastrZahlung(10, 3, true)).toBe(60);
    expect(mastrZahlung(9.5, 2.2, false)).toBe(9.5 * 3 * 10);
  });
  it('Steckersolargerät: 2 000 Wp und 800 VA (§ 8 Abs. 5a EEG)', () => {
    const b = (wp: number, va: number) => rechneBalkon({ ort: null, modulWp: wp, wechselrichterVa: va, neigung: 35, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: 36, kostenEur: 400 });
    expect(b(2000, 800).zulaessig).toBe(true);
    expect(b(2001, 800).grund).toEqual(['wp']);
    expect(b(1800, 801).grund).toEqual(['va']);
  });
});

describe('Standort (PVGIS)', () => {
  it('ungültige Postleitzahlen', () => { for (const x of ['', '1234', '00000', 'abcde', '123456']) expect(ortVonPlz(x)).toBeNull(); });
  it(`${REF.pvgis.length} Postleitzahlen gegen eine zweite PVGIS-Abfrage, Abweichung ≤ 0,5 %`, () => {
    for (const r of REF.pvgis) { const o = ortVonPlz(r.plz)!; expect(o.direkt).toBe(true); expect(Math.abs(o.ey / r.exakt - 1), r.plz).toBeLessThan(0.005); }
  });
  it('Ausrichtungsmatrix der Region gegen PVGIS am Rasterpunkt, Abweichung ≤ 4 %', () => {
    for (const r of REF.ausrichtung) {
      const o = ortVonPlz(r.plz)!; const f = ausrichtungsFaktor(o.reg, r.neigung, r.azimut);
      expect(Math.abs((STANDORT.ey[o.node] * f) / r.exakt - 1), `${r.plz} ${r.neigung}/${r.azimut}`).toBeLessThan(0.04);
    }
  });
  it('35° Süd ergibt Faktor 1, senkrecht weniger als flach-optimal', () => {
    expect(ausrichtungsFaktor(0, 35, 0)).toBeCloseTo(1, 6);
    expect(ausrichtungsFaktor(0, 90, 0)).toBeLessThan(ausrichtungsFaktor(0, 35, 0));
  });
});

describe('Eigenverbrauch (Simulation)', () => {
  it('Energiebilanz: selbst + Netz + verloren = 1, Anteile zwischen 0 und 1', () => {
    for (const e of [200, 700, 1500, 2400]) for (const l of [1200, 2500, 5000]) for (const b of [0, 1.5, 4]) for (const [t, a] of [[35, 0], [90, -90], [60, 45]]) {
      const x = anteileBalkon(e, l, b, t, a);
      expect(x.selbst + x.verloren + x.einspeisung).toBeCloseTo(1, 6);
      for (const v of [x.selbst, x.verloren, x.einspeisung]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    }
  });
  it('mehr Speicher: nie weniger Eigenverbrauch; größere Anlage: kleinerer Anteil', () => {
    expect(anteileBalkon(1600, 2500, 2, 35, 0).selbst).toBeGreaterThan(anteileBalkon(1600, 2500, 0, 35, 0).selbst);
    expect(anteileDach(8000, 4000, 0, 35, 0, 'none').selbst).toBeLessThan(anteileDach(4000, 4000, 0, 35, 0, 'none').selbst);
    expect(anteileDach(8000, 4000, 8, 35, 0, 'none').selbst).toBeGreaterThan(anteileDach(8000, 4000, 0, 35, 0, 'none').selbst);
  });
  it('60-%-Grenze kostet nur etwas, wenn die Anlage groß gegenüber dem Verbrauch ist', () => {
    expect(anteileDach(2000, 4000, 0, 35, 0, '60').verloren).toBeLessThan(0.01);
    expect(anteileDach(12000, 4000, 0, 35, 0, '60').verloren).toBeGreaterThan(0.01);
  });
  it('800 VA: ab rund 1 600 kWh Jahresertrag wird spürbar abgeregelt', () => {
    expect(anteileBalkon(600, 2500, 0, 35, 0).verloren).toBeLessThan(0.005);
    expect(anteileBalkon(2000, 2500, 0, 35, 0).verloren).toBeGreaterThan(0.05);
  });
});

describe('Rechnungen von Hand nachvollzogen', () => {
  it('Balkonkraftwerk: Ersparnis = selbst genutzt × Preis, Amortisation = Preis ÷ Ersparnis', () => {
    const r = rechneBalkon({ ort: ortVonPlz('10115'), modulWp: 900, wechselrichterVa: 800, neigung: 90, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: 36, kostenEur: 450 });
    expect(r.ersparnisJahr).toBeCloseTo(r.selbst * 0.36, 6);
    expect(r.amortisationJahre!).toBeCloseTo(450 / r.ersparnisJahr, 6);
    expect(r.selbst + r.einspeisung + r.abgeregelt).toBeCloseTo(r.ertragBrutto, 6);
    expect(r.ertragBrutto).toBeCloseTo(0.9 * r.spez, 6);
  });
  it('Verschattung 25 % senkt den Bruttoertrag um genau 25 %', () => {
    const b = (s: number) => rechneBalkon({ ort: null, modulWp: 800, wechselrichterVa: 800, neigung: 35, azimut: 0, verschattung: s, speicherKwh: 0, verbrauchKwh: 2500, preisCt: 36, kostenEur: 400 });
    expect(b(0.25).ertragBrutto).toBeCloseTo(b(0).ertragBrutto * 0.75, 6);
  });
  it('PV: Vergütung = Einspeisung × Satz, Volleinspeisung ohne Eigenverbrauch', () => {
    const base = { ort: ortVonPlz('50667'), kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, smartMeter: false, preisCt: 36, kostenEur: 15000, inbetrieb: '2026-08-01' };
    const t = rechnePv({ ...base, modus: 'teil' }); const v = rechnePv({ ...base, modus: 'voll' });
    expect(t.verguetungJahr).toBeCloseTo(t.einspeisung * 0.077, 6);
    expect(v.selbst).toBe(0); expect(v.satzCt).toBeCloseTo(12.22, 6);
    expect(t.grenze).toBe('60');
    expect(rechnePv({ ...base, modus: 'teil', inbetrieb: '2024-03-01' }).grenze).toBe('none');
  });
  it('Steuer: steuerfrei und 0 % USt bis 30 kWp', () => {
    const b = { ort: null, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: 36, kostenEur: 0 };
    expect(rechnePv({ ...b, kwp: 30 }).nullsteuer).toBe(true); expect(rechnePv({ ...b, kwp: 30.5 }).steuerfrei).toBe(false);
  });
  it('Entwurf EEG 2027: Übergangszahlung = anzulegender Wert − 1 ct für 36 Monate, ab 50 kW keine', () => {
    const v = vergleich2027(10, 5000);
    expect(v.satz27).toBeCloseTo(7.7 + P.eeg.abzug_einspeiseverguetung_ct - 1, 6);
    expect(v.summe27).toBeCloseTo(5000 * v.satz27 / 100 * 3, 6);
    expect(vergleich2027(50, 5000).summe27).toBe(0);
  });
});

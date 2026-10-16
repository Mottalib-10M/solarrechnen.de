/** Einspeisevergütung: Satz des Inbetriebnahme-Zeitraums nach Leistung und Einspeiseart, Vergütung im Jahr und über 20 Jahre. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import PlzField from '../ui/PlzField';
import Toggle from '../ui/Toggle';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { PERIODEN, AKTUELL, mischsatz, type Modus } from '../../lib/engine/eeg';
import { P, STROMPREIS_CT } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { displayDate } from '../../lib/format';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';
import { janeinOpt, modusOpt } from './opts';

export default function EegRechner({ lang = 'de', methodHref, preset = {}, idp = 'eg' }: { lang?: L; methodHref?: string; preset?: { kwp?: number; modus?: string }; idp?: string }) {
  const f = fm(lang);
  const tag = lang === 'en' ? 'en-GB' : 'de-DE';
  const [inb, setInb] = useState(AKTUELL.von);
  const [kwp, setKwp] = useState(preset.kwp ?? 12);
  const [modus, setModus] = useState(preset.modus ?? 'teil');
  const [plz, setPlz] = useState('70173');
  const [vb, setVb] = useState(4000);
  const [sm, setSm] = useState('0');
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setInb(str(u, 'ib', inb)); setKwp(num(u, 'kwp', kwp)); setModus(str(u, 'm', modus)); setPlz(str(u, 'plz', plz)); setVb(num(u, 'vb', vb)); setSm(str(u, 'sm', sm));
  }, []);
  useEffect(() => { updateURL({ ib: inb, kwp, m: modus, plz, vb, sm }); }, [inb, kwp, modus, plz, vb, sm]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const per = PERIODEN.find((p) => p.von === inb) ?? AKTUELL;
  const satz = mischsatz(per, kwp, modus as Modus);
  const r = useMemo(() => rechnePv({ ort, kwp, neigung: 30, azimut: 0, verbrauchKwh: vb, speicherKwh: 0, modus: modus as Modus, smartMeter: sm === '1', inbetrieb: inb, preisCt: STROMPREIS_CT, kostenEur: 0 }), [ort, kwp, vb, modus, sm, inb]);
  const opts = PERIODEN.slice().reverse().map((p) => ({ value: p.von, label: `${displayDate(p.von, tag)} – ${displayDate(p.bis, tag)}` }));
  const s = modus === 'teil' ? per.teil : per.voll;
  const rows: Zeile[] = [
    { label: tx(lang, 'bis 10 kW', 'up to 10 kW'), value: `${f.num(s[0], 2)} ct` },
    { label: tx(lang, 'über 10 bis 40 kW', 'over 10 to 40 kW'), value: `${f.num(s[1], 2)} ct` },
    { label: tx(lang, 'über 40 bis 100 kW', 'over 40 to 100 kW'), value: `${f.num(s[2], 2)} ct` },
    { label: tx(lang, `Mischsatz für ${f.num(kwp, 1)} kWp`, `Blended rate for ${f.num(kwp, 1)} kWp`), value: `${f.num(satz, 2)} ct`, strong: true, sep: true },
    { label: tx(lang, 'eingespeist im Jahr', 'fed in per year'), value: kwh(lang, r.einspeisung) },
    { label: tx(lang, 'Vergütung im Jahr', 'Payment per year'), value: f.eur(r.verguetungJahr), strong: true },
    { label: tx(lang, `über ${P.eeg.dauer_jahre} Jahre`, `over ${P.eeg.dauer_jahre} years`), value: f.eur(r.verguetungJahr * P.eeg.dauer_jahre), muted: true },
  ];
  const steps = [
    tx(lang, `Maßgeblich ist der Tag der Inbetriebnahme: ${displayDate(per.von, tag)} bis ${displayDate(per.bis, tag)}. Der Satz gilt ${P.eeg.dauer_jahre} Jahre lang plus das Inbetriebnahmejahr.`, `What counts is the commissioning date: ${displayDate(per.von, tag)} to ${displayDate(per.bis, tag)}. The rate applies for ${P.eeg.dauer_jahre} years plus the commissioning year.`),
    tx(lang, `Über 10 kWp wird anteilig gerechnet: die ersten 10 kW zum ersten Satz, der Rest zum zweiten (§ 48 Abs. 2 EEG).`, 'Above 10 kWp the rate is blended: the first 10 kW at the first rate, the rest at the second (section 48(2) EEG).'),
    modus === 'teil' ? tx(lang, `Eingespeist wird nur der Überschuss: ${f.pct(1 - r.eigenAnteil - r.abgeregelt / Math.max(1, r.ertrag), 0)} des Ertrags bei ${kwh(lang, vb)} Verbrauch.`, `Only the surplus is fed in: ${f.pct(1 - r.eigenAnteil - r.abgeregelt / Math.max(1, r.ertrag), 0)} of output at ${kwh(lang, vb)} consumption.`) : tx(lang, 'Volleinspeisung: kein Eigenverbrauch, dafür der höhere Satz (§ 48 Abs. 2a EEG). Mitteilung an den Netzbetreiber in Textform: im ersten Jahr vor der Inbetriebnahme, danach jeweils vor dem 1. Dezember für das Folgejahr.', 'Full feed-in: no self-consumption, but the higher rate (section 48(2a) EEG). Written notice to the grid operator: before commissioning in the first year, then before 1 December for the following year.'),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <SelectField id={`${idp}-ib`} label={tx(lang, 'Inbetriebnahme im Zeitraum', 'Commissioned in period')} value={inb} onChange={setInb} options={opts} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-kwp`} label={tx(lang, 'Anlagenleistung', 'System size')} value={kwp} onChange={setKwp} unit="kWp" max={100} decimals={1} lang={lang} />
            <Toggle id={`${idp}-m`} label={tx(lang, 'Einspeisung', 'Feed-in')} value={modus} onChange={setModus} options={modusOpt(lang)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}`, `near ${ort.name}`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={100000} lang={lang} />
          </div>
          <Toggle id={`${idp}-sm`} label={tx(lang, 'Smart Meter eingebaut?', 'Smart meter fitted?')} value={sm} onChange={setSm} options={janeinOpt(lang)} />
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Einspeisevergütung', 'Feed-in tariff')} wert={`${f.num(satz, 2)} ct/kWh`} unter={tx(lang, `${f.eur(r.verguetungJahr)} im Jahr für ${kwh(lang, r.einspeisung)}`, `${f.eur(r.verguetungJahr)} a year for ${kwh(lang, r.einspeisung)}`)} />
          <Zeilen rows={rows} caption={modus === 'teil' ? tx(lang, 'Teileinspeisung, Sätze in ct/kWh', 'Surplus feed-in, rates in ct/kWh') : tx(lang, 'Volleinspeisung, Sätze in ct/kWh', 'Full feed-in, rates in ct/kWh')} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `Einspeisevergütung ${f.num(kwp, 1)} kWp ab ${displayDate(per.von, tag)}: ${f.num(satz, 2)} ct/kWh`, `Feed-in tariff ${f.num(kwp, 1)} kWp from ${displayDate(per.von, tag)}: ${f.num(satz, 2)} ct/kWh`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

/** Photovoltaik-Rechner: Dachanlage mit Eigenverbrauch, Einspeisevergütung des Inbetriebnahme-Zeitraums, 60-%-Grenze, Amortisation. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import PlzField from '../ui/PlzField';
import Toggle from '../ui/Toggle';
import StackedBar from '../ui/StackedBar';
import { rechnePv, NEG_ANTEIL } from '../../lib/engine/pv';
import { ortVonPlz, monatsAnteile, REG_MITTE } from '../../lib/engine/standort';
import { PERIODEN, AKTUELL } from '../../lib/engine/eeg';
import { P, STROMPREIS_CT, SMARD_JAHR } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { displayDate } from '../../lib/format';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, Monate, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';
import { dachAzimutOpt, janeinOpt, modusOpt } from './opts';

export interface PvPreset { plz?: string; kwp?: number; az?: string; sp?: number; modus?: string }
const periodeOpt = (l: L) => PERIODEN.slice().reverse().map((p) => ({ value: p.von, label: `${displayDate(p.von, l === 'en' ? 'en-GB' : 'de-DE')} – ${displayDate(p.bis, l === 'en' ? 'en-GB' : 'de-DE')}` }));

export default function PvRechner({ lang = 'de', methodHref, preset = {}, idp = 'pv' }: { lang?: L; methodHref?: string; preset?: PvPreset; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '50667');
  const [kwp, setKwp] = useState(preset.kwp ?? 10);
  const [az, setAz] = useState(preset.az ?? '0');
  const [tilt, setTilt] = useState(30);
  const [vb, setVb] = useState(4000);
  const [sp, setSp] = useState(preset.sp ?? 0);
  const [kosten, setKosten] = useState(15000);
  const [preis, setPreis] = useState(STROMPREIS_CT);
  const [modus, setModus] = useState(preset.modus ?? 'teil');
  const [sm, setSm] = useState('0');
  const [inb, setInb] = useState(AKTUELL.von);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setKwp(num(u, 'kwp', kwp)); setAz(str(u, 'az', az)); setTilt(num(u, 'n', tilt)); setVb(num(u, 'vb', vb)); setSp(num(u, 'sp', sp));
    setKosten(num(u, 'k', kosten)); setPreis(num(u, 'p', preis)); setModus(str(u, 'm', modus)); setSm(str(u, 'sm', sm)); setInb(str(u, 'ib', inb));
  }, []);
  useEffect(() => { updateURL({ plz, kwp, az, n: tilt, vb, sp, k: kosten, p: preis, m: modus, sm, ib: inb }); }, [plz, kwp, az, tilt, vb, sp, kosten, preis, modus, sm, inb]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const ow = az === 'ow';
  const r = useMemo(() => rechnePv({ ort, kwp, neigung: tilt, azimut: ow ? 0 : Number(az), ostWest: ow, verbrauchKwh: vb, speicherKwh: sp, modus: modus as 'teil' | 'voll', smartMeter: sm === '1', inbetrieb: inb, preisCt: preis, kostenEur: kosten }), [ort, kwp, tilt, az, ow, vb, sp, modus, sm, inb, preis, kosten]);
  const monate = monatsAnteile(ort ? ort.reg : REG_MITTE).map((x) => x * r.ertrag);
  const rows: Zeile[] = [
    { label: tx(lang, 'Erzeugung im Jahr', 'Generation per year'), value: kwh(lang, r.ertrag), strong: true },
    { label: tx(lang, 'selbst genutzt', 'used at home'), value: `${kwh(lang, r.selbst)} · ${f.pct(r.eigenAnteil, 0)}` },
    { label: tx(lang, 'eingespeist', 'fed into the grid'), value: kwh(lang, r.einspeisung) },
  ];
  if (r.abgeregelt >= 1) rows.push({ label: tx(lang, 'abgeregelt (60-%-Grenze)', 'curtailed (60% limit)'), value: kwh(lang, r.abgeregelt), muted: true });
  rows.push({ label: tx(lang, 'Ersparnis Strombezug', 'Saving on bought power'), value: f.eur(r.ersparnisJahr), sep: true });
  rows.push({ label: tx(lang, `Einspeisevergütung (${f.num(r.satzCt, 2)} ct/kWh)`, `Feed-in tariff (${f.num(r.satzCt, 2)} ct/kWh)`), value: f.eur(r.verguetungJahr) });
  if (r.negVerlustJahr > 0) rows.push({ label: tx(lang, 'davon entfällt bei negativen Preisen', 'lost at negative prices'), value: `−${f.eur(r.negVerlustJahr)}`, muted: true });
  rows.push({ label: tx(lang, 'Nutzen im Jahr', 'Benefit per year'), value: f.eur(r.nutzenJahr), strong: true });
  rows.push({ label: tx(lang, 'Amortisation', 'Payback'), value: r.amortisationJahre === null ? '–' : tx(lang, `${f.num(r.amortisationJahre, 1)} Jahre`, `${f.num(r.amortisationJahre, 1)} years`) });
  rows.push({ label: tx(lang, `Überschuss nach ${P.eeg.dauer_jahre} Jahren`, `Net gain after ${P.eeg.dauer_jahre} years`), value: f.eur(r.gewinn), muted: true });
  const dt = (d: string) => displayDate(d, lang === 'en' ? 'en-GB' : 'de-DE');
  const steps = [
    ort ? tx(lang, `PLZ ${ort.plz} (Region ${ort.name}): ${f.num(ort.ey)} kWh je kWp bei 35° Süd (PVGIS); für ${ow ? 'Ost-West' : 'Ihre Ausrichtung'} und ${f.num(tilt)}° Neigung ${f.num(r.spez)} kWh je kWp.`, `Postcode ${ort.plz} (area of ${ort.name}): ${f.num(ort.ey)} kWh per kWp at 35° south (PVGIS); for ${ow ? 'east-west' : 'your direction'} and ${f.num(tilt)}° tilt ${f.num(r.spez)} kWh per kWp.`) : tx(lang, 'Ohne gültige Postleitzahl: Bundesdurchschnitt.', 'No valid postcode: German average.'),
    modus === 'voll' ? tx(lang, 'Volleinspeisung: der ganze Strom geht ins Netz, zum erhöhten Satz.', 'Full feed-in: all output goes to the grid at the higher rate.') : tx(lang, `Eigenverbrauch aus der Viertelstunden-Simulation mit 74 Haushalten (${kwh(lang, vb)}${sp ? `, ${f.num(sp, 1)} kWh Speicher` : ''}): ${f.pct(r.eigenAnteil, 0)}.`, `Self-consumption from the quarter-hour simulation of 74 households (${kwh(lang, vb)}${sp ? `, ${f.num(sp, 1)} kWh battery` : ''}): ${f.pct(r.eigenAnteil, 0)}.`),
    r.grenze === '60' ? tx(lang, `Ohne Smart Meter darf die Anlage höchstens 60 % ihrer Leistung einspeisen (§ 9 Abs. 2 EEG, Inbetriebnahme ab ${dt(P.solarspitzen.stichtag)}).`, `Without a smart meter the system may feed in at most 60% of its rated output (section 9(2) EEG, commissioned from ${dt(P.solarspitzen.stichtag)}).`) : tx(lang, 'Keine 60-%-Grenze: Smart Meter vorhanden oder Inbetriebnahme vor dem 25. Februar 2025.', 'No 60% limit: smart meter fitted or commissioned before 25 February 2025.'),
    tx(lang, `Satz für die Inbetriebnahme ${dt(r.periodeVon)} bis ${dt(r.periodeBis)}, anteilig nach Leistung: ${f.num(r.satzCt, 2)} ct/kWh, fest für ${P.eeg.dauer_jahre} Jahre.`, `Rate for commissioning ${dt(r.periodeVon)} to ${dt(r.periodeBis)}, weighted by capacity: ${f.num(r.satzCt, 2)} ct/kWh, fixed for ${P.eeg.dauer_jahre} years.`),
    r.negPreis ? tx(lang, `Mit Smart Meter entfällt die Vergütung in Viertelstunden mit negativem Preis; ${SMARD_JAHR} fiel ${f.pct(NEG_ANTEIL, 0)} des deutschen Solarstroms in solche Stunden (SMARD). Die verlorenen Viertelstunden hängt das Gesetz zur Hälfte hinten an (§ 51a EEG).`, `With a smart meter there is no payment in quarter-hours with negative prices; in ${SMARD_JAHR}, ${f.pct(NEG_ANTEIL, 0)} of German solar output fell into such hours (SMARD). Half of the lost time is added at the end (section 51a EEG).`) : tx(lang, 'Negative Preise: ohne Smart Meter bleibt die Vergütung für kleine Anlagen bestehen (§ 51 Abs. 2 EEG).', 'Negative prices: without a smart meter small systems keep their payment (section 51(2) EEG).'),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}: ${f.num(ort.ey)} kWh/kWp`, `near ${ort.name}: ${f.num(ort.ey)} kWh/kWp`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-kwp`} label={tx(lang, 'Anlagenleistung', 'System size')} value={kwp} onChange={setKwp} unit="kWp" max={100} decimals={1} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SelectField id={`${idp}-az`} label={tx(lang, 'Dachausrichtung', 'Roof facing')} value={az} onChange={setAz} options={dachAzimutOpt(lang)} />
            <NumberField id={`${idp}-n`} label={tx(lang, 'Dachneigung', 'Roof pitch')} value={tilt} onChange={setTilt} unit="°" max={90} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={100000} lang={lang} />
            <NumberField id={`${idp}-sp`} label={tx(lang, 'Speicher (nutzbar)', 'Battery (usable)')} value={sp} onChange={setSp} unit="kWh" max={40} decimals={1} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-k`} label={tx(lang, 'Kosten der Anlage', 'System cost')} value={kosten} onChange={setKosten} unit="€" max={500000} lang={lang} />
            <NumberField id={`${idp}-p`} label={tx(lang, 'Strompreis', 'Electricity price')} value={preis} onChange={setPreis} unit="ct" max={200} decimals={1} lang={lang} />
          </div>
          <details className="rounded-lg border border-navy-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy-900">{tx(lang, 'Einspeisung, Smart Meter, Inbetriebnahme', 'Feed-in, smart meter, commissioning')}</summary>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
              <Toggle id={`${idp}-m`} label={tx(lang, 'Einspeisung', 'Feed-in')} value={modus} onChange={setModus} options={modusOpt(lang)} />
              <Toggle id={`${idp}-sm`} label={tx(lang, 'Smart Meter?', 'Smart meter?')} value={sm} onChange={setSm} options={janeinOpt(lang)} />
            </div>
            <div className="mt-4"><SelectField id={`${idp}-ib`} label={tx(lang, 'Inbetriebnahme im Zeitraum', 'Commissioned in period')} value={inb} onChange={setInb} options={periodeOpt(lang)} /></div>
          </details>
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Nutzen pro Jahr', 'Benefit per year')} wert={f.eur(r.nutzenJahr)} unter={tx(lang, `${kwh(lang, r.ertrag)} Solarstrom · Amortisation ${r.amortisationJahre === null ? '–' : f.num(r.amortisationJahre, 1) + ' Jahre'}`, `${kwh(lang, r.ertrag)} of solar power · payback ${r.amortisationJahre === null ? '–' : f.num(r.amortisationJahre, 1) + ' years'}`)} />
          <div className="mt-3"><StackedBar ariaPrefix={tx(lang, 'Verwendung des Solarstroms', 'Where the solar power goes')} total={r.ertrag} segments={[
            { label: tx(lang, 'selbst genutzt', 'used at home'), value: r.selbst, color: '#703400' },
            { label: tx(lang, 'eingespeist', 'fed in'), value: r.einspeisung, color: '#f4ae71' },
            { label: tx(lang, 'abgeregelt', 'curtailed'), value: r.abgeregelt, color: '#cbd5e1' },
          ]} /></div>
          <Zeilen rows={rows} />
          <Monate lang={lang} werte={monate} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `PV ${f.num(kwp, 1)} kWp, PLZ ${plz}: ${kwh(lang, r.ertrag)}, ${f.eur(r.nutzenJahr)} Nutzen im Jahr`, `PV ${f.num(kwp, 1)} kWp, postcode ${plz}: ${kwh(lang, r.ertrag)}, ${f.eur(r.nutzenJahr)} benefit a year`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

/** Startseite: Balkonkraftwerk am eigenen Standort (PVGIS), Eigenverbrauch (74 Haushalte), Ersparnis, Amortisation. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import PlzField from '../ui/PlzField';
import StackedBar from '../ui/StackedBar';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz, monatsAnteile, REG_MITTE } from '../../lib/engine/standort';
import { P, STROMPREIS_CT } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, Monate, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';
import { azimutOpt, neigungBalkonOpt, schattenOpt, balkonSpeicherOpt } from './opts';

export interface BalkonPreset { plz?: string; wp?: number; az?: number; tilt?: number; sp?: number }

export default function BalkonRechner({ lang = 'de', methodHref, preset = {}, idp = 'bk' }: { lang?: L; methodHref?: string; preset?: BalkonPreset; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '10115');
  const [wp, setWp] = useState(preset.wp ?? 900);
  const [az, setAz] = useState(String(preset.az ?? 0));
  const [tilt, setTilt] = useState(String(preset.tilt ?? 90));
  const [sp, setSp] = useState(String(preset.sp ?? 0));
  const [vb, setVb] = useState(2500);
  const [preis, setPreis] = useState(STROMPREIS_CT);
  const [kosten, setKosten] = useState(450);
  const [schatten, setSchatten] = useState('0');
  const [va, setVa] = useState(P.balkon.max_va);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setWp(num(u, 'wp', wp)); setAz(str(u, 'az', az)); setTilt(str(u, 'n', tilt)); setSp(str(u, 'sp', sp));
    setVb(num(u, 'vb', vb)); setPreis(num(u, 'p', preis)); setKosten(num(u, 'k', kosten)); setSchatten(str(u, 's', schatten)); setVa(num(u, 'va', va));
  }, []);
  useEffect(() => { updateURL({ plz, wp, az, n: tilt, sp, vb, p: preis, k: kosten, s: schatten, va }); }, [plz, wp, az, tilt, sp, vb, preis, kosten, schatten, va]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const r = useMemo(() => rechneBalkon({ ort, modulWp: wp, wechselrichterVa: va, neigung: Number(tilt), azimut: Number(az), verschattung: Number(schatten), speicherKwh: Number(sp), verbrauchKwh: vb, preisCt: preis, kostenEur: kosten }), [ort, wp, va, tilt, az, schatten, sp, vb, preis, kosten]);
  const monate = monatsAnteile(ort ? ort.reg : REG_MITTE).map((x) => x * r.ertrag);
  const rows: Zeile[] = [
    { label: tx(lang, 'Erzeugung im Jahr', 'Generation per year'), value: kwh(lang, r.ertrag), strong: true },
    { label: tx(lang, 'davon im Haushalt genutzt', 'of which used at home'), value: `${kwh(lang, r.selbst)} · ${f.pct(r.eigenAnteil, 0)}` },
    { label: tx(lang, 'ins Netz, ohne Vergütung', 'into the grid, unpaid'), value: kwh(lang, r.einspeisung), muted: true },
  ];
  if (r.abgeregelt >= 1) rows.push({ label: tx(lang, `vom Wechselrichter abgeregelt (${f.num(va)} VA)`, `clipped by the inverter (${f.num(va)} VA)`), value: kwh(lang, r.abgeregelt), muted: true });
  rows.push({ label: tx(lang, 'Ersparnis auf der Stromrechnung', 'Saving on the electricity bill'), value: f.eur(r.ersparnisJahr), strong: true, sep: true });
  rows.push({ label: tx(lang, 'Amortisation', 'Payback'), value: r.amortisationJahre === null ? '–' : tx(lang, `${f.num(r.amortisationJahre, 1)} Jahre`, `${f.num(r.amortisationJahre, 1)} years`) });
  rows.push({ label: tx(lang, 'Ersparnis über 20 Jahre', 'Saving over 20 years'), value: f.eur(r.summe), muted: true });
  const steps = [
    ort ? tx(lang, `PLZ ${ort.plz} (Region ${ort.name}): ${f.num(ort.ey)} kWh je kWp bei 35° Süd laut PVGIS${ort.direkt ? ' für den Mittelpunkt der Postleitzahl' : ' am nächsten Rasterpunkt'}.`, `Postcode ${ort.plz} (area of ${ort.name}): ${f.num(ort.ey)} kWh per kWp at 35° south according to PVGIS${ort.direkt ? ' for the centre of the postcode' : ' at the nearest grid point'}.`) : tx(lang, 'Ohne gültige Postleitzahl: Bundesdurchschnitt.', 'No valid postcode: German average.'),
    tx(lang, `Neigung ${tilt}° und gewählte Himmelsrichtung: ${f.num(r.spez)} kWh je kWp. Mal ${f.num(wp / 1000, 2)} kWp${Number(schatten) ? `, minus ${f.pct(Number(schatten), 0)} Schatten` : ''}: ${kwh(lang, r.ertragBrutto)} vor dem Wechselrichter.`, `Tilt ${tilt}° and the chosen direction: ${f.num(r.spez)} kWh per kWp. Times ${f.num(wp / 1000, 2)} kWp${Number(schatten) ? `, minus ${f.pct(Number(schatten), 0)} shade` : ''}: ${kwh(lang, r.ertragBrutto)} before the inverter.`),
    tx(lang, `Viertelstunde für Viertelstunde gegen 74 gemessene Haushalte mit ${kwh(lang, vb)} im Jahr${Number(sp) ? ` und ${f.num(Number(sp), 1)} kWh Speicher` : ''}: ${f.pct(r.eigenAnteil, 0)} des Stroms nutzt der Haushalt selbst.`, `Quarter-hour by quarter-hour against 74 metered households using ${kwh(lang, vb)} a year${Number(sp) ? ` with a ${f.num(Number(sp), 1)} kWh battery` : ''}: the household uses ${f.pct(r.eigenAnteil, 0)} of the output itself.`),
    tx(lang, `${kwh(lang, r.selbst)} × ${f.num(preis, 1)} ct = ${f.eur(r.ersparnisJahr)} im Jahr; ${f.eur(kosten)} Kaufpreis ÷ Ersparnis = Amortisation.`, `${kwh(lang, r.selbst)} × ${f.num(preis, 1)} ct = ${f.eur(r.ersparnisJahr)} a year; ${f.eur(kosten)} purchase price ÷ saving = payback.`),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}: ${f.num(ort.ey)} kWh/kWp`, `near ${ort.name}: ${f.num(ort.ey)} kWh/kWp`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-wp`} label={tx(lang, 'Modulleistung', 'Panel output')} value={wp} onChange={setWp} unit="Wp" max={10000} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SelectField id={`${idp}-az`} className="max-[479px]:col-span-2" label={tx(lang, 'Ausrichtung', 'Facing')} value={az} onChange={setAz} options={azimutOpt(lang)} />
            <SelectField id={`${idp}-n`} className="max-[479px]:col-span-2" label={tx(lang, 'Neigung', 'Tilt')} value={tilt} onChange={setTilt} options={neigungBalkonOpt(lang)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={20000} lang={lang} />
            <SelectField id={`${idp}-sp`} label={tx(lang, 'Speicher', 'Battery')} value={sp} onChange={setSp} options={balkonSpeicherOpt(lang)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-k`} label={tx(lang, 'Kaufpreis', 'Purchase price')} value={kosten} onChange={setKosten} unit="€" max={20000} lang={lang} />
            <NumberField id={`${idp}-p`} label={tx(lang, 'Strompreis', 'Electricity price')} value={preis} onChange={setPreis} unit="ct" max={200} decimals={1} lang={lang} />
          </div>
          <details className="rounded-lg border border-navy-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy-900">{tx(lang, 'Schatten und Wechselrichter', 'Shade and inverter')}</summary>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
              <SelectField id={`${idp}-s`} label={tx(lang, 'Verschattung', 'Shading')} value={schatten} onChange={setSchatten} options={schattenOpt(lang)} />
              <NumberField id={`${idp}-va`} label={tx(lang, 'Wechselrichter', 'Inverter')} value={va} onChange={setVa} unit="VA" max={5000} lang={lang} />
            </div>
          </details>
          {!r.zulaessig && (
            <p className="rounded-lg border-l-4 border-amber-600 bg-amber-50 p-3 text-sm text-navy-900" role="status">
              {tx(lang, `Mehr als ${f.num(P.balkon.max_wp)} Wp Module oder ${f.num(P.balkon.max_va)} VA Wechselrichter: Das ist kein Steckersolargerät im Sinne von § 8 Abs. 5a EEG mehr. Es braucht dann einen Elektriker und die Anmeldung beim Netzbetreiber. Gerechnet ist mit ${f.num(P.balkon.max_va)} VA.`, `More than ${f.num(P.balkon.max_wp)} Wp of panels or a ${f.num(P.balkon.max_va)} VA inverter: this is no longer a plug-in device under section 8(5a) EEG. It then needs an electrician and notice to the grid operator. The figures use ${f.num(P.balkon.max_va)} VA.`)}
            </p>
          )}
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Ersparnis pro Jahr', 'Saving per year')} wert={f.eur(r.ersparnisJahr)} unter={tx(lang, `${kwh(lang, r.ertrag)} Solarstrom, ${f.pct(r.eigenAnteil, 0)} davon selbst genutzt`, `${kwh(lang, r.ertrag)} of solar power, ${f.pct(r.eigenAnteil, 0)} of it used at home`)} />
          <div className="mt-3"><StackedBar ariaPrefix={tx(lang, 'Verwendung des Solarstroms', 'Where the solar power goes')} total={r.ertragBrutto} segments={[
            { label: tx(lang, 'selbst genutzt', 'used at home'), value: r.selbst, color: '#703400' },
            { label: tx(lang, 'ins Netz', 'to the grid'), value: r.einspeisung, color: '#f4ae71' },
            { label: tx(lang, 'abgeregelt', 'clipped'), value: r.abgeregelt, color: '#cbd5e1' },
          ]} /></div>
          <Zeilen rows={rows} />
          <Monate lang={lang} werte={monate} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `Balkonkraftwerk ${f.num(wp)} Wp, PLZ ${plz}: ${kwh(lang, r.ertrag)} im Jahr, ${f.eur(r.ersparnisJahr)} Ersparnis`, `Plug-in solar ${f.num(wp)} Wp, postcode ${plz}: ${kwh(lang, r.ertrag)} a year, ${f.eur(r.ersparnisJahr)} saving`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

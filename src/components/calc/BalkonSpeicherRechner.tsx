/** Balkonkraftwerk mit Speicher: dieselben Module mit und ohne Batterie, Mehrertrag im Haushalt, Amortisation des Speichers. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import PlzField from '../ui/PlzField';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { STROMPREIS_CT } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';
import { azimutOpt, neigungBalkonOpt, balkonSpeicherOpt } from './opts';

export default function BalkonSpeicherRechner({ lang = 'de', methodHref, preset = {}, idp = 'bs' }: { lang?: L; methodHref?: string; preset?: { plz?: string; wp?: number }; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '80331');
  const [wp, setWp] = useState(preset.wp ?? 1800);
  const [az, setAz] = useState('0');
  const [tilt, setTilt] = useState('35');
  const [vb, setVb] = useState(2500);
  const [sp, setSp] = useState('2');
  const [kosten, setKosten] = useState(900);
  const [preis, setPreis] = useState(STROMPREIS_CT);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setWp(num(u, 'wp', wp)); setAz(str(u, 'az', az)); setTilt(str(u, 'n', tilt)); setVb(num(u, 'vb', vb)); setSp(str(u, 'sp', sp)); setKosten(num(u, 'k', kosten)); setPreis(num(u, 'p', preis));
  }, []);
  useEffect(() => { updateURL({ plz, wp, az, n: tilt, vb, sp, k: kosten, p: preis }); }, [plz, wp, az, tilt, vb, sp, kosten, preis]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const base = { ort, modulWp: wp, wechselrichterVa: 800, neigung: Number(tilt), azimut: Number(az), verschattung: 0, verbrauchKwh: vb, preisCt: preis, kostenEur: 0 };
  const ohne = useMemo(() => rechneBalkon({ ...base, speicherKwh: 0 }), [ort, wp, tilt, az, vb, preis]);
  const mit = useMemo(() => rechneBalkon({ ...base, speicherKwh: Number(sp) }), [ort, wp, tilt, az, vb, preis, sp]);
  const plus = mit.ersparnisJahr - ohne.ersparnisJahr;
  const amort = plus > 0 ? kosten / plus : null;
  const rows: Zeile[] = [
    { label: tx(lang, 'Erzeugung vor dem Wechselrichter', 'Output before the inverter'), value: kwh(lang, ohne.ertragBrutto) },
    { label: tx(lang, 'ohne Speicher selbst genutzt', 'used at home without battery'), value: `${kwh(lang, ohne.selbst)} · ${f.pct(ohne.eigenAnteil, 0)}` },
    { label: tx(lang, 'ohne Speicher abgeregelt (800 VA)', 'clipped without battery (800 VA)'), value: kwh(lang, ohne.abgeregelt), muted: true },
    { label: tx(lang, `mit ${f.num(Number(sp), 1)} kWh selbst genutzt`, `used at home with ${f.num(Number(sp), 1)} kWh`), value: `${kwh(lang, mit.selbst)} · ${f.pct(mit.eigenAnteil, 0)}`, strong: true },
    { label: tx(lang, 'Mehrersparnis im Jahr', 'Extra saving per year'), value: f.eur(plus), strong: true, sep: true },
    { label: tx(lang, 'Amortisation des Speichers', 'Battery payback'), value: amort === null ? '–' : tx(lang, `${f.num(amort, 1)} Jahre`, `${f.num(amort, 1)} years`) },
  ];
  const steps = [
    tx(lang, 'Der Speicher sitzt auf der Gleichstromseite: Er lädt mittags, was der Haushalt nicht braucht, auch den Teil oberhalb von 800 VA, den der Wechselrichter sonst abregeln würde.', 'The battery sits on the DC side: at midday it stores what the home does not use, including the part above 800 VA that the inverter would otherwise clip.'),
    tx(lang, 'Abends gibt er bis zur Wechselrichtergrenze ab, was der Haushalt braucht; Wirkungsgrad rund 90 % hin und zurück.', 'In the evening it supplies what the home needs, up to the inverter limit; about 90% round trip.'),
    tx(lang, `Mehrersparnis = zusätzlich selbst genutzte kWh × ${f.num(preis, 1)} ct; eingespeister Strom bringt beim Balkonkraftwerk nichts.`, `Extra saving = extra self-used kWh × ${f.num(preis, 1)} ct; power fed in from a plug-in system earns nothing.`),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}`, `near ${ort.name}`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-wp`} label={tx(lang, 'Modulleistung', 'Panel output')} value={wp} onChange={setWp} unit="Wp" max={10000} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SelectField id={`${idp}-az`} label={tx(lang, 'Ausrichtung', 'Facing')} value={az} onChange={setAz} options={azimutOpt(lang)} />
            <SelectField id={`${idp}-n`} label={tx(lang, 'Neigung', 'Tilt')} value={tilt} onChange={setTilt} options={neigungBalkonOpt(lang)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={20000} lang={lang} />
            <SelectField id={`${idp}-sp`} label={tx(lang, 'Speicher', 'Battery')} value={sp} onChange={setSp} options={balkonSpeicherOpt(lang).slice(1)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-k`} label={tx(lang, 'Aufpreis für den Speicher', 'Extra cost of the battery')} value={kosten} onChange={setKosten} unit="€" max={20000} lang={lang} />
            <NumberField id={`${idp}-p`} label={tx(lang, 'Strompreis', 'Electricity price')} value={preis} onChange={setPreis} unit="ct" max={200} decimals={1} lang={lang} />
          </div>
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Mehrersparnis durch den Speicher', 'Extra saving from the battery')} wert={tx(lang, `${f.eur(plus)} pro Jahr`, `${f.eur(plus)} a year`)} unter={tx(lang, `Eigenverbrauch ${f.pct(ohne.eigenAnteil, 0)} → ${f.pct(mit.eigenAnteil, 0)}`, `self-use ${f.pct(ohne.eigenAnteil, 0)} → ${f.pct(mit.eigenAnteil, 0)}`)} />
          <Zeilen rows={rows} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `Balkonkraftwerk ${f.num(wp)} Wp mit ${f.num(Number(sp), 1)} kWh Speicher: ${f.eur(plus)} mehr im Jahr`, `Plug-in solar ${f.num(wp)} Wp with ${f.num(Number(sp), 1)} kWh battery: ${f.eur(plus)} more a year`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

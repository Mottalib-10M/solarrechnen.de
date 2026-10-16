/** Stromspeicher-Rechner: dieselbe Dachanlage mit und ohne Batterie, zusätzlicher Nutzen, Amortisation des Speichers. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import PlzField from '../ui/PlzField';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { STROMPREIS_CT } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';

export default function SpeicherRechner({ lang = 'de', methodHref, preset = {}, idp = 'sr' }: { lang?: L; methodHref?: string; preset?: { plz?: string; kwp?: number; sp?: number }; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '01067');
  const [kwp, setKwp] = useState(preset.kwp ?? 8);
  const [vb, setVb] = useState(4500);
  const [sp, setSp] = useState(preset.sp ?? 8);
  const [kosten, setKosten] = useState(6000);
  const [preis, setPreis] = useState(STROMPREIS_CT);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setKwp(num(u, 'kwp', kwp)); setVb(num(u, 'vb', vb)); setSp(num(u, 'sp', sp)); setKosten(num(u, 'k', kosten)); setPreis(num(u, 'p', preis));
  }, []);
  useEffect(() => { updateURL({ plz, kwp, vb, sp, k: kosten, p: preis }); }, [plz, kwp, vb, sp, kosten, preis]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const base = { ort, kwp, neigung: 30, azimut: 0, verbrauchKwh: vb, modus: 'teil' as const, smartMeter: false, preisCt: preis, kostenEur: 0 };
  const ohne = useMemo(() => rechnePv({ ...base, speicherKwh: 0 }), [ort, kwp, vb, preis]);
  const mit = useMemo(() => rechnePv({ ...base, speicherKwh: sp }), [ort, kwp, vb, preis, sp]);
  const plus = mit.nutzenJahr - ohne.nutzenJahr;
  const amort = plus > 0 ? kosten / plus : null;
  const groessen = [0, 2, 4, 6, 8, 10, 12].map((s) => ({ s, r: rechnePv({ ...base, speicherKwh: s }) }));
  const rows: Zeile[] = [
    { label: tx(lang, 'Eigenverbrauch ohne Speicher', 'Self-consumption without battery'), value: `${f.pct(ohne.eigenAnteil, 0)} · ${kwh(lang, ohne.selbst)}` },
    { label: tx(lang, `Eigenverbrauch mit ${f.num(sp, 1)} kWh`, `Self-consumption with ${f.num(sp, 1)} kWh`), value: `${f.pct(mit.eigenAnteil, 0)} · ${kwh(lang, mit.selbst)}`, strong: true },
    { label: tx(lang, 'Autarkie ohne / mit Speicher', 'Self-sufficiency without / with'), value: `${f.pct(ohne.autarkie, 0)} / ${f.pct(mit.autarkie, 0)}` },
    { label: tx(lang, 'weniger eingespeist', 'less fed into the grid'), value: kwh(lang, ohne.einspeisung - mit.einspeisung), muted: true },
    { label: tx(lang, 'Mehrnutzen im Jahr', 'Extra benefit per year'), value: f.eur(plus), strong: true, sep: true },
    { label: tx(lang, 'Amortisation des Speichers', 'Battery payback'), value: amort === null ? '–' : tx(lang, `${f.num(amort, 1)} Jahre`, `${f.num(amort, 1)} years`) },
  ];
  const steps = [
    tx(lang, `Gleiche Anlage, ${f.num(kwp, 1)} kWp nach Süden, 30°, ${kwh(lang, ohne.ertrag)} im Jahr.`, `Same system, ${f.num(kwp, 1)} kWp facing south, 30°, ${kwh(lang, ohne.ertrag)} a year.`),
    tx(lang, 'Jede Viertelstunde: erst den Haushalt versorgen, Überschuss in den Speicher (Wirkungsgrad rund 90 % hin und zurück), Rest ins Netz; abends entlädt der Speicher.', 'Every quarter-hour: supply the home first, surplus into the battery (about 90% round trip), the rest to the grid; the battery discharges in the evening.'),
    tx(lang, `Jede gespeicherte Kilowattstunde spart ${f.num(preis, 1)} ct Bezug, kostet aber ${f.num(ohne.satzCt, 2)} ct Einspeisevergütung.`, `Each stored kilowatt-hour saves ${f.num(preis, 1)} ct of bought power but gives up ${f.num(ohne.satzCt, 2)} ct of feed-in tariff.`),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}`, `near ${ort.name}`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-kwp`} label={tx(lang, 'Anlagenleistung', 'System size')} value={kwp} onChange={setKwp} unit="kWp" max={100} decimals={1} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={100000} lang={lang} />
            <NumberField id={`${idp}-sp`} label={tx(lang, 'Speicher (nutzbar)', 'Battery (usable)')} value={sp} onChange={setSp} unit="kWh" max={40} decimals={1} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-k`} label={tx(lang, 'Preis des Speichers', 'Battery price')} value={kosten} onChange={setKosten} unit="€" max={100000} lang={lang} />
            <NumberField id={`${idp}-p`} label={tx(lang, 'Strompreis', 'Electricity price')} value={preis} onChange={setPreis} unit="ct" max={200} decimals={1} lang={lang} />
          </div>
          <div className="overflow-x-auto"><table className="journal w-full text-sm">
            <caption className="mb-1 text-left text-xs font-semibold uppercase tracking-wide text-navy-600">{tx(lang, 'Speichergröße im Vergleich', 'Battery sizes compared')}</caption>
            <thead><tr><th scope="col" className="py-1 text-left">kWh</th><th scope="col" className="py-1 text-right">{tx(lang, 'Eigenverbrauch', 'Self-use')}</th><th scope="col" className="py-1 text-right">{tx(lang, 'Autarkie', 'Self-sufficiency')}</th><th scope="col" className="py-1 text-right">{tx(lang, 'Nutzen/Jahr', 'Benefit/yr')}</th></tr></thead>
            <tbody>{groessen.map(({ s, r }) => <tr key={s} className={s === sp ? 'font-semibold' : ''}><td className="tabular-nums border-b border-navy-100 py-1">{f.num(s)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.pct(r.eigenAnteil, 0)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.pct(r.autarkie, 0)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.eur(r.nutzenJahr)}</td></tr>)}</tbody>
          </table></div>
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Mehrnutzen durch den Speicher', 'Extra benefit from the battery')} wert={tx(lang, `${f.eur(plus)} pro Jahr`, `${f.eur(plus)} a year`)} unter={tx(lang, `Amortisation ${amort === null ? '–' : f.num(amort, 1) + ' Jahre'} bei ${f.eur(kosten)}`, `payback ${amort === null ? '–' : f.num(amort, 1) + ' years'} at ${f.eur(kosten)}`)} />
          <Zeilen rows={rows} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `Speicher ${f.num(sp, 1)} kWh an ${f.num(kwp, 1)} kWp: ${f.eur(plus)} Mehrnutzen im Jahr`, `Battery ${f.num(sp, 1)} kWh with ${f.num(kwp, 1)} kWp: ${f.eur(plus)} extra a year`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

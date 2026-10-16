/** Wie viel kWp? Größen von 3 bis 20 kWp mit Eigenverbrauch, Autarkie, Nutzen und Amortisation nebeneinander. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import PlzField from '../ui/PlzField';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { STROMPREIS_CT } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Aktionen, Kopf, Rechenweg, Hinweis, kasten, rahmen, raster, tx, fm, kwh, type L } from './kit';

const GROESSEN = [3, 4, 5, 6, 8, 10, 12, 15, 20];
export default function GroesseRechner({ lang = 'de', methodHref, preset = {}, idp = 'gr' }: { lang?: L; methodHref?: string; preset?: { plz?: string }; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '30159');
  const [vb, setVb] = useState(4000);
  const [sp, setSp] = useState(0);
  const [kkwp, setKkwp] = useState(1500);
  const [fix, setFix] = useState(2000);
  const [preis, setPreis] = useState(STROMPREIS_CT);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setVb(num(u, 'vb', vb)); setSp(num(u, 'sp', sp)); setKkwp(num(u, 'kk', kkwp)); setFix(num(u, 'fx', fix)); setPreis(num(u, 'p', preis));
  }, []);
  useEffect(() => { updateURL({ plz, vb, sp, kk: kkwp, fx: fix, p: preis }); }, [plz, vb, sp, kkwp, fix, preis]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const liste = useMemo(() => GROESSEN.map((k) => ({ k, r: rechnePv({ ort, kwp: k, neigung: 30, azimut: 0, verbrauchKwh: vb, speicherKwh: sp, modus: 'teil', smartMeter: false, preisCt: preis, kostenEur: fix + k * kkwp }) })), [ort, vb, sp, kkwp, fix, preis]);
  const best = liste.reduce((a, b) => (b.r.gewinn > a.r.gewinn ? b : a));
  const deckung = liste.find((x) => x.r.ertrag >= vb) ?? liste[liste.length - 1];
  const steps = [
    tx(lang, `Kosten je Größe: ${f.eur(fix)} fest (Gerüst, Zähler, Anmeldung) plus ${f.eur(kkwp)} je kWp; beides tragen Sie ein, wir kennen Ihr Angebot nicht.`, `Cost per size: ${f.eur(fix)} fixed (scaffold, meter, registration) plus ${f.eur(kkwp)} per kWp; you enter both, we do not know your quote.`),
    tx(lang, 'Jede Größe läuft durch dieselbe Simulation: Süddach 30°, Teileinspeisung, 60-%-Grenze ohne Smart Meter, Satz des aktuellen Zeitraums.', 'Each size runs through the same simulation: south roof at 30°, surplus feed-in, 60% limit without smart meter, current period rate.'),
    tx(lang, `Den höchsten Überschuss nach 20 Jahren bringt ${f.num(best.k)} kWp; den Jahresverbrauch rechnerisch decken ${f.num(deckung.k)} kWp.`, `The highest net gain after 20 years comes from ${f.num(best.k)} kWp; ${f.num(deckung.k)} kWp cover the annual consumption on paper.`),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}`, `near ${ort.name}`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-vb`} label={tx(lang, 'Stromverbrauch im Jahr', 'Annual consumption')} value={vb} onChange={setVb} unit="kWh" max={100000} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-kk`} label={tx(lang, 'Preis je kWp', 'Price per kWp')} value={kkwp} onChange={setKkwp} unit="€" max={10000} lang={lang} />
            <NumberField id={`${idp}-fx`} label={tx(lang, 'Fixkosten', 'Fixed costs')} value={fix} onChange={setFix} unit="€" max={100000} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <NumberField id={`${idp}-sp`} label={tx(lang, 'Speicher (nutzbar)', 'Battery (usable)')} value={sp} onChange={setSp} unit="kWh" max={40} decimals={1} lang={lang} />
            <NumberField id={`${idp}-p`} label={tx(lang, 'Strompreis', 'Electricity price')} value={preis} onChange={setPreis} unit="ct" max={200} decimals={1} lang={lang} />
          </div>
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Wirtschaftlichste Größe', 'Most economic size')} wert={`${f.num(best.k)} kWp`} unter={tx(lang, `${f.eur(best.r.gewinn)} Überschuss nach 20 Jahren, Eigenverbrauch ${f.pct(best.r.eigenAnteil, 0)}`, `${f.eur(best.r.gewinn)} net gain after 20 years, self-use ${f.pct(best.r.eigenAnteil, 0)}`)} />
          <div className="mt-3 overflow-x-auto"><table className="journal w-full text-sm">
            <thead><tr><th scope="col" className="py-1 text-left">kWp</th><th scope="col" className="py-1 text-right">kWh</th><th scope="col" className="py-1 text-right">{tx(lang, 'Eigen', 'Self')}</th><th scope="col" className="py-1 text-right">{tx(lang, 'Autarkie', 'Autarky')}</th><th scope="col" className="py-1 text-right">{tx(lang, 'Amort.', 'Payback')}</th></tr></thead>
            <tbody>{liste.map(({ k, r }) => <tr key={k} className={k === best.k ? 'font-semibold text-navy-900' : 'text-navy-800'}><td className="tabular-nums border-b border-navy-100 py-1">{f.num(k)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.num(r.ertrag)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.pct(r.eigenAnteil, 0)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{f.pct(r.autarkie, 0)}</td><td className="tabular-nums border-b border-navy-100 py-1 text-right">{r.amortisationJahre === null ? '–' : f.num(r.amortisationJahre, 1)}</td></tr>)}</tbody>
          </table></div>
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `PV-Größe für ${kwh(lang, vb)}: ${f.num(best.k)} kWp am wirtschaftlichsten`, `PV size for ${kwh(lang, vb)}: ${f.num(best.k)} kWp most economic`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

/** PV-Ertrag nach Postleitzahl: kWh je kWp für Neigung und Ausrichtung, Monatsverlauf, Rang in Deutschland. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import PlzField from '../ui/PlzField';
import { ortVonPlz, spezErtragOrt, spezErtragOstWestOrt, perzentil, monatsAnteile, EY_BUND, REG_MITTE, ausrichtungsFaktor, STANDORT } from '../../lib/engine/standort';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Zeilen, Aktionen, Kopf, Rechenweg, Hinweis, Monate, kasten, rahmen, raster, tx, fm, kwh, type L, type Zeile } from './kit';
import { dachAzimutOpt } from './opts';

export default function ErtragRechner({ lang = 'de', methodHref, preset = {}, idp = 'er' }: { lang?: L; methodHref?: string; preset?: { plz?: string }; idp?: string }) {
  const f = fm(lang);
  const [plz, setPlz] = useState(preset.plz ?? '60311');
  const [kwp, setKwp] = useState(1);
  const [az, setAz] = useState('0');
  const [tilt, setTilt] = useState(35);
  useEffect(() => {
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setPlz(str(u, 'plz', plz)); setKwp(num(u, 'kwp', kwp)); setAz(str(u, 'az', az)); setTilt(num(u, 'n', tilt));
  }, []);
  useEffect(() => { updateURL({ plz, kwp, az, n: tilt }); }, [plz, kwp, az, tilt]);
  const ort = useMemo(() => ortVonPlz(plz), [plz]);
  const ow = az === 'ow';
  const spez = ort ? (ow ? spezErtragOstWestOrt(ort, tilt) : spezErtragOrt(ort, tilt, Number(az))) : EY_BUND * ausrichtungsFaktor(REG_MITTE, tilt, ow ? 0 : Number(az));
  const ey = ort ? ort.ey : EY_BUND;
  const rang = perzentil(ey);
  const monate = monatsAnteile(ort ? ort.reg : REG_MITTE).map((x) => x * spez * kwp);
  const rows: Zeile[] = [
    { label: tx(lang, 'Ertrag je kWp, Ihre Ausrichtung', 'Yield per kWp, your orientation'), value: `${f.num(spez)} kWh`, strong: true },
    { label: tx(lang, 'Ertrag je kWp bei 35° Süd', 'Yield per kWp at 35° south'), value: `${f.num(ey)} kWh` },
    { label: tx(lang, 'Bundesdurchschnitt bei 35° Süd', 'German average at 35° south'), value: `${f.num(EY_BUND)} kWh`, muted: true },
    { label: tx(lang, 'Abweichung vom Durchschnitt', 'Difference from average'), value: f.pct(ey / EY_BUND - 1, 1) },
    { label: tx(lang, 'sonniger als … der Rasterpunkte', 'sunnier than … of grid points'), value: f.pct(rang, 0), muted: true },
    { label: tx(lang, `Ertrag für ${f.num(kwp, 1)} kWp`, `Yield for ${f.num(kwp, 1)} kWp`), value: kwh(lang, spez * kwp), strong: true, sep: true },
  ];
  const steps = [
    ort ? tx(lang, `PLZ ${ort.plz}: PVGIS ${ort.direkt ? 'für den Mittelpunkt dieser Postleitzahl' : 'am nächsten Rasterpunkt'}, Region um ${ort.name}, ${f.num(STANDORT.elev[ort.node])} m über NN am Rasterpunkt.`, `Postcode ${ort.plz}: PVGIS ${ort.direkt ? 'for the centre of this postcode' : 'at the nearest grid point'}, area around ${ort.name}, grid point at ${f.num(STANDORT.elev[ort.node])} m above sea level.`) : tx(lang, 'Ohne gültige Postleitzahl: Bundesdurchschnitt.', 'No valid postcode: German average.'),
    tx(lang, 'PVGIS 5.3 rechnet mit Satellitenstrahlung 2005 bis 2023 (SARAH-3), dem Horizont aus dem Geländemodell, Temperatur und 14 % Systemverlusten.', 'PVGIS 5.3 uses satellite radiation 2005 to 2023 (SARAH-3), the horizon from the terrain model, temperature and 14% system losses.'),
    tx(lang, `Andere Neigungen und Richtungen: Verhältnis aus 81 PVGIS-Abfragen in Ihrer Großregion, hier ${f.pct(spez / ey, 0)} des Südwerts.`, `Other tilts and directions: ratio from 81 PVGIS queries in your region, here ${f.pct(spez / ey, 0)} of the south value.`),
  ];
  return (
    <div className={rahmen} data-chrome>
      <div className="srg h-1.5" aria-hidden="true" />
      <div className={raster}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <PlzField id={`${idp}-plz`} label={tx(lang, 'Postleitzahl', 'Postcode')} value={plz} onChange={setPlz} help={ort ? tx(lang, `bei ${ort.name}`, `near ${ort.name}`) : tx(lang, 'fünf Ziffern', 'five digits')} />
            <NumberField id={`${idp}-kwp`} label={tx(lang, 'Leistung', 'Capacity')} value={kwp} onChange={setKwp} unit="kWp" max={1000} decimals={2} lang={lang} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SelectField id={`${idp}-az`} label={tx(lang, 'Ausrichtung', 'Facing')} value={az} onChange={setAz} options={dachAzimutOpt(lang)} />
            <NumberField id={`${idp}-n`} label={tx(lang, 'Neigung', 'Tilt')} value={tilt} onChange={setTilt} unit="°" max={90} lang={lang} />
          </div>
        </form>
        <div aria-live="polite" data-resultat className={kasten}>
          <Kopf label={tx(lang, 'Ertrag pro Jahr', 'Yield per year')} wert={kwh(lang, spez * kwp)} unter={tx(lang, `${f.num(spez)} kWh je kWp`, `${f.num(spez)} kWh per kWp`)} />
          <Zeilen rows={rows} />
          <Monate lang={lang} werte={monate} />
          <Rechenweg lang={lang} steps={steps} />
          <Aktionen lang={lang} text={() => tx(lang, `PV-Ertrag PLZ ${plz}: ${f.num(spez)} kWh je kWp`, `PV yield postcode ${plz}: ${f.num(spez)} kWh per kWp`)} />
          <Hinweis lang={lang} methodHref={methodHref} />
        </div>
      </div>
    </div>
  );
}

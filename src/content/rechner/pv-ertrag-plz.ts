import { defineGuide } from '../../lib/guide-types';
import { ortVonPlz, spezErtragOrt, spezErtragOstWestOrt, monatsAnteile, perzentil, EY_BUND, STANDORT } from '../../lib/engine/standort';
import STAEDTE from '../../data/staedte.json';
import { P, DE, EN } from '../../lib/fmt';

/**
 * PVGIS-Werte je Postleitzahl (standort.json) und für die 15 Großstädte (staedte.json, 35° Süd).
 * Beispiel des Rechners: Frankfurt am Main (60311); Gegenpole Flensburg (24937) und Freiburg (79098).
 */
const ffm = ortVonPlz('60311')!, fl = ortVonPlz('24937')!, fr = ortVonPlz('79098')!, bg = ortVonPlz('83471')!;
const sued = spezErtragOrt(ffm, 35, 0);
const flach = spezErtragOrt(ffm, 10, 0), ost = spezErtragOrt(ffm, 35, -90), west = spezErtragOrt(ffm, 35, 90);
const ow = spezErtragOstWestOrt(ffm, 15), senk = spezErtragOrt(ffm, 90, 0), nord = spezErtragOrt(ffm, 35, 180);
const spreizung = fr.ey / fl.ey - 1;
const winter = (o: typeof ffm) => { const m = monatsAnteile(o.reg); return m[10] + m[11] + m[0] + m[1]; };
const juni = (o: typeof ffm) => monatsAnteile(o.reg)[5];
const staedte = Object.values(STAEDTE.staedte).sort((a, b) => b.ey - a.ey);
const top = staedte[0], low = staedte[staedte.length - 1];
const LAND: Record<string, [string, string]> = {
  BW: ['Baden-Württemberg', 'Baden-Württemberg'], BY: ['Bayern', 'Bavaria'], BE: ['Berlin', 'Berlin'], BB: ['Brandenburg', 'Brandenburg'],
  HB: ['Bremen', 'Bremen'], HH: ['Hamburg', 'Hamburg'], HE: ['Hessen', 'Hesse'], MV: ['Mecklenburg-Vorpommern', 'Mecklenburg-Western Pomerania'],
  NI: ['Niedersachsen', 'Lower Saxony'], NW: ['Nordrhein-Westfalen', 'North Rhine-Westphalia'], RP: ['Rheinland-Pfalz', 'Rhineland-Palatinate'],
  SL: ['Saarland', 'Saarland'], SN: ['Sachsen', 'Saxony'], ST: ['Sachsen-Anhalt', 'Saxony-Anhalt'], SH: ['Schleswig-Holstein', 'Schleswig-Holstein'], TH: ['Thüringen', 'Thuringia'],
};
const laender = Object.entries(STANDORT.laender as Record<string, number>).sort((a, b) => b[1] - a[1]);
const lTop = laender[0], lLow = laender[laender.length - 1];
const KWP_BSP = 10;

export default defineGuide({
  id: 'pv-ertrag-plz',
  group: 'pv',
  order: 12,
  tool: 'ertrag',
  related: ['photovoltaik-rechner', 'balkonkraftwerk-ertrag', 'photovoltaik-ost-west', 'balkonkraftwerk-ausrichtung', 'wie-viel-kwp', 'balkonkraftwerk-freiburg'],
  sources: ['pvgis', 'pvgis_doku', 'geonames', 'destatis_gv'],
  de: {
    slug: 'pv-ertrag-postleitzahl',
    nav: 'PV-Ertrag nach PLZ',
    card: 'Jahresertrag je kWp für Ihre Postleitzahl, Neigung und Himmelsrichtung, mit Monatsverlauf und Rang in Deutschland.',
    title: 'PV-Ertrag pro kWp 2026 nach Postleitzahl: Werte aus PVGIS',
    description: `PV-Ertrag pro kWp 2026 für jede Postleitzahl: PVGIS-Wert zwischen ${DE.num(STANDORT.min)} und ${DE.num(STANDORT.max)} kWh je Standort, Neigung, Ost, West, Monatsverlauf und Rang in Deutschland.`,
    h1: 'PV-Ertrag pro kWp 2026 für Ihre Postleitzahl',
    intro: `Ein Kilowatt Peak nach Süden mit 35° Neigung erzeugt in Frankfurt am Main ${DE.num(sued)} kWh im Jahr, in Flensburg ${DE.num(fl.ey)} kWh, in Freiburg ${DE.num(fr.ey)} kWh. Geben Sie Ihre Postleitzahl ein.`,
    resume: `Der PV-Ertrag pro kWp ist die Zahl, auf der jede Solarrechnung aufbaut, und er schwankt in Deutschland stärker, als Faustregeln vermuten lassen. Für jede Postleitzahl liest der Rechner den Wert von PVGIS 5.3, dem Strahlungsdienst der Gemeinsamen Forschungsstelle der EU-Kommission: Satellitendaten der Jahre 2005 bis 2023, Temperatur, Horizont aus dem Geländemodell und ${DE.num(P.pvgis.verluste_pct)} Prozent Systemverluste, gerechnet für 35° Neigung nach Süden. Über alle Rasterpunkte reicht die Spanne von ${DE.num(STANDORT.min)} bis ${DE.num(STANDORT.max)} kWh je kWp, der nach Einwohnern gewichtete Bundesdurchschnitt liegt bei ${DE.num(EY_BUND)} kWh. Zwischen Flensburg und Freiburg liegen ${DE.pct(spreizung)}. Für andere Neigungen und Richtungen rechnet der Rechner mit dem Verhältnis aus 81 PVGIS-Abfragen in Ihrer Großregion: In Frankfurt bringt ein Ost-West-Dach mit 15° noch ${DE.num(ow)} kWh, eine senkrechte Südfassade ${DE.num(senk)} kWh je kWp.`,
    faqs: [
      { q: 'Wie viel kWh bringt 1 kWp in Frankfurt am Main?', a: `${DE.num(sued)} kWh im Jahr bei 35° Neigung nach Süden, laut PVGIS für die Postleitzahl ${ffm.plz}. Das sind ${DE.pct(ffm.ey / EY_BUND - 1, 1)} mehr als der Bundesdurchschnitt von ${DE.num(EY_BUND)} kWh; Frankfurt ist sonniger als ${DE.pct(perzentil(ffm.ey))} der Rasterpunkte. Eine Anlage mit ${DE.num(KWP_BSP)} kWp käme dort auf rund ${DE.num(sued * KWP_BSP)} kWh.` },
      { q: 'Wie viel weniger erzeugt ein Ost- oder Westdach je kWp?', a: `In Frankfurt bei 35° Neigung ${DE.num(ost)} kWh nach Osten und ${DE.num(west)} kWh nach Westen, gegenüber ${DE.num(sued)} kWh nach Süden. Das ist ein Minus von ${DE.pct(1 - ost / sued)} und ${DE.pct(1 - west / sued)}. Je flacher das Dach, desto kleiner der Unterschied: Ein Ost-West-Dach mit 15° liefert ${DE.num(ow)} kWh je kWp, also ${DE.pct(ow / sued)} des Südwerts.` },
      { q: 'Warum liefert eine Anlage bei Berchtesgaden im Winter mehr als in Flensburg?', a: `Vor allem, weil die Wintersonne im Süden höher steht: Berchtesgaden liegt rund sieben Breitengrade südlicher. In der Region um Berchtesgaden fallen ${DE.pct(winter(bg), 1)} des Jahresertrags auf November bis Februar, in der Region Flensburg nur ${DE.pct(winter(fl), 1)}. Dafür hat der Norden längere Sommertage: Der Juni bringt dort ${DE.pct(juni(fl), 1)} des Jahres, im Berchtesgadener Raum ${DE.pct(juni(bg), 1)}. Die Monatswerte stammen aus PVGIS.` },
      { q: 'Lohnt sich Photovoltaik auf einem Norddach überhaupt?', a: `Selten. Nach Norden mit 35° Neigung erzeugt 1 kWp in Frankfurt ${DE.num(nord)} kWh, ${DE.pct(nord / sued)} des Südwerts von ${DE.num(sued)} kWh. Bei flacher Neigung schrumpft der Abstand, weil die Module dann fast waagerecht liegen. Wer nur ein Norddach hat, rechnet am besten mit dem tatsächlichen Winkel und vergleicht die Kosten je erzeugter Kilowattstunde im Photovoltaik-Rechner.` },
    ],
    body: (h) => `
<h2>Woher die Werte kommen</h2>
<p>Für jede Postleitzahl liegt ein Wert aus ${h.src('pvgis', 'PVGIS 5.3')} vor, abgefragt über die ${h.src('pvgis_doku', 'Schnittstelle der Forschungsstelle')} für den Mittelpunkt der Postleitzahl; fehlt er, nimmt der Rechner den nächsten von 838 Rasterpunkten. Die Zuordnung von Postleitzahl zu Koordinaten stammt von ${h.src('geonames', 'GeoNames')}, die Einwohnerzahlen für den Bundesdurchschnitt aus dem ${h.src('destatis_gv', 'Gemeindeverzeichnis von Destatis')}. Gerechnet ist für kristalline Module mit ${h.num(P.pvgis.verluste_pct)} Prozent Verlusten durch Kabel, Wechselrichter und Verschmutzung. Verschattung durch Nachbarhäuser oder Bäume kennt PVGIS nicht, nur den Horizont aus Bergen und Hügeln.</p>

<h2>Die Großstädte im Vergleich</h2>
${h.table(['Stadt', 'PLZ', 'kWh je kWp', 'zum Bund'], staedte.map((s) => [s.name, s.plz, h.num(s.ey), h.pct(s.ey / EY_BUND - 1, 1)]), `PVGIS, 35° Süd, je Postleitzahl; Bundesdurchschnitt ${h.num(EY_BUND)} kWh.`, ['l', 'l', 'r', 'r'])}
<p>${top.name} führt mit ${h.num(top.ey)} kWh, ${low.name} liegt mit ${h.num(low.ey)} kWh am Ende. Der Abstand von ${h.pct(top.ey / low.ey - 1, 0)} bedeutet bei gleicher Anlage auch entsprechend mehr Ersparnis. Für Freiburg gibt es eine eigene Seite: ${h.a('balkonkraftwerk-freiburg', 'Balkonkraftwerk in Freiburg')}.</p>

<h2>Bundesländer</h2>
${h.table(['Land', 'kWh je kWp'], laender.map(([k, v]) => [LAND[k]?.[0] ?? k, h.num(v)]), 'Landesmittel aus PVGIS, 35° Süd.', ['l', 'r'])}
<p>${LAND[lTop[0]][0]} liegt mit ${h.num(lTop[1])} kWh vorn, ${LAND[lLow[0]][0]} mit ${h.num(lLow[1])} kWh hinten. Das sind ${h.pct(lTop[1] / lLow[1] - 1, 0)} Unterschied im Landesmittel; einzelne Postleitzahlen weichen weiter ab, wie die Spanne von ${h.num(STANDORT.min)} bis ${h.num(STANDORT.max)} kWh zeigt.</p>

<h2>Neigung und Himmelsrichtung</h2>
${h.table(['Ausrichtung', 'kWh je kWp', 'zum Südwert'], [
  ['Süd 35°', h.num(sued), h.pct(1, 0)], ['Süd 10°', h.num(flach), h.pct(flach / sued, 0)], ['Ost 35°', h.num(ost), h.pct(ost / sued, 0)],
  ['West 35°', h.num(west), h.pct(west / sued, 0)], ['Ost-West 15°', h.num(ow), h.pct(ow / sued, 0)], ['Süd 90° (Fassade)', h.num(senk), h.pct(senk / sued, 0)], ['Nord 35°', h.num(nord), h.pct(nord / sued, 0)],
], `Frankfurt am Main, PLZ ${ffm.plz}.`, ['l', 'r', 'r'])}
<p>Die Umrechnung stützt sich auf 81 PVGIS-Abfragen je Großregion, weil sich das Verhältnis zwischen Süd und Ost im Norden anders verhält als in den Alpen. Für Balkonmodule am Geländer zählt meist die Zeile mit 90°; mehr dazu unter ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung des Balkonkraftwerks')}. Was aus dem Ertrag in Euro wird, rechnet der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')} mit Eigenverbrauch und Vergütung.</p>`,
  },
  en: {
    slug: 'pv-yield-by-postcode',
    nav: 'PV yield by postcode',
    card: 'Annual yield per kWp for your postcode, tilt and direction, with monthly profile and rank in Germany.',
    title: 'PV Yield per kWp Germany 2026 by Postcode: PVGIS Values',
    description: `PV yield per kWp in Germany 2026 for any postcode: PVGIS value between ${EN.num(STANDORT.min)} and ${EN.num(STANDORT.max)} kWh by location, tilt, east, west, monthly profile and national rank.`,
    h1: 'PV yield per kWp 2026 for your German postcode',
    intro: `One kilowatt peak facing south at 35° produces ${EN.num(sued)} kWh a year in Frankfurt am Main, ${EN.num(fl.ey)} kWh in Flensburg and ${EN.num(fr.ey)} kWh in Freiburg. Enter your postcode (Postleitzahl).`,
    resume: `Yield per kWp is the figure every solar calculation rests on, and in Germany it varies more than rules of thumb suggest. For each postcode the calculator reads the value from PVGIS 5.3, the solar radiation service of the European Commission's Joint Research Centre: satellite data for 2005 to 2023, temperature, the horizon from the terrain model and ${EN.num(P.pvgis.verluste_pct)} per cent system losses, calculated for a 35° tilt facing south. Across all grid points the range runs from ${EN.num(STANDORT.min)} to ${EN.num(STANDORT.max)} kWh per kWp, and the population-weighted national average is ${EN.num(EY_BUND)} kWh. Freiburg yields ${EN.pct(spreizung)} more than Flensburg. For other tilts and directions the calculator uses the ratio from 81 PVGIS queries in your region: in Frankfurt an east-west roof at 15° still brings ${EN.num(ow)} kWh and an upright south facade ${EN.num(senk)} kWh per kWp.`,
    faqs: [
      { q: 'How many kWh does 1 kWp produce in Frankfurt am Main?', a: `${EN.num(sued)} kWh a year at a 35° tilt facing south, according to PVGIS for postcode ${ffm.plz}. That is ${EN.pct(ffm.ey / EY_BUND - 1, 1)} above the national average of ${EN.num(EY_BUND)} kWh; Frankfurt is sunnier than ${EN.pct(perzentil(ffm.ey))} of grid points. A ${EN.num(KWP_BSP)} kWp system there would produce about ${EN.num(sued * KWP_BSP)} kWh.` },
      { q: 'How much less does an east or west roof produce per kWp?', a: `In Frankfurt at a 35° tilt, ${EN.num(ost)} kWh facing east and ${EN.num(west)} kWh facing west, against ${EN.num(sued)} kWh facing south. That is ${EN.pct(1 - ost / sued)} and ${EN.pct(1 - west / sued)} less. The flatter the roof, the smaller the gap: an east-west roof at 15° delivers ${EN.num(ow)} kWh per kWp, or ${EN.pct(ow / sued)} of the south value.` },
      { q: 'Why does a system near Berchtesgaden produce more in winter than in Flensburg?', a: `Mainly because the winter sun stands higher in the south: Berchtesgaden lies about seven degrees of latitude further south. In the area around Berchtesgaden, ${EN.pct(winter(bg), 1)} of annual output falls between November and February; around Flensburg only ${EN.pct(winter(fl), 1)}. The north has longer summer days in return: June brings ${EN.pct(juni(fl), 1)} of the year there, against ${EN.pct(juni(bg), 1)} near Berchtesgaden. Monthly figures come from PVGIS.` },
      { q: 'Is solar PV on a north-facing roof worth it at all?', a: `Rarely. Facing north at 35°, 1 kWp in Frankfurt produces ${EN.num(nord)} kWh, ${EN.pct(nord / sued)} of the south value of ${EN.num(sued)} kWh. With a shallow pitch the gap narrows, because the panels then lie almost flat. If you only have a north roof, calculate with the actual angle and compare the cost per kilowatt-hour produced in the rooftop PV calculator.` },
    ],
    body: (h) => `
<h2>Where the figures come from</h2>
<p>For each postcode there is a value from ${h.src('pvgis', 'PVGIS 5.3')}, queried through the ${h.src('pvgis_doku', 'research centre interface')} for the centre of the postcode; if it is missing, the calculator takes the nearest of 838 grid points. Postcodes are matched to coordinates using ${h.src('geonames', 'GeoNames')}, and population figures for the national average come from the ${h.src('destatis_gv', 'Destatis municipality register')}. The calculation assumes crystalline panels with ${h.num(P.pvgis.verluste_pct)} per cent losses from cables, inverter and dirt. PVGIS does not know about shade from neighbouring houses or trees, only the horizon formed by mountains and hills.</p>

<h2>Major cities compared</h2>
${h.table(['City', 'Postcode', 'kWh per kWp', 'vs national'], staedte.map((s) => [s.name, s.plz, h.num(s.ey), h.pct(s.ey / EY_BUND - 1, 1)]), `PVGIS, 35° south, per postcode; national average ${h.num(EY_BUND)} kWh.`, ['l', 'l', 'r', 'r'])}
<p>${top.name} leads with ${h.num(top.ey)} kWh, ${low.name} comes last with ${h.num(low.ey)} kWh. A gap of ${h.pct(top.ey / low.ey - 1, 0)} means correspondingly more saving from the same system. Freiburg has its own page: ${h.a('balkonkraftwerk-freiburg', 'plug-in solar in Freiburg')}.</p>

<h2>Federal states</h2>
${h.table(['State', 'kWh per kWp'], laender.map(([k, v]) => [LAND[k]?.[1] ?? k, h.num(v)]), 'State mean from PVGIS, 35° south.', ['l', 'r'])}
<p>${LAND[lTop[0]][1]} leads with ${h.num(lTop[1])} kWh, ${LAND[lLow[0]][1]} trails with ${h.num(lLow[1])} kWh. That is a gap of ${h.pct(lTop[1] / lLow[1] - 1, 0)} between state means; individual postcodes deviate further, as the range from ${h.num(STANDORT.min)} to ${h.num(STANDORT.max)} kWh shows.</p>

<h2>Tilt and direction</h2>
${h.table(['Orientation', 'kWh per kWp', 'vs south'], [
  ['South 35°', h.num(sued), h.pct(1, 0)], ['South 10°', h.num(flach), h.pct(flach / sued, 0)], ['East 35°', h.num(ost), h.pct(ost / sued, 0)],
  ['West 35°', h.num(west), h.pct(west / sued, 0)], ['East-west 15°', h.num(ow), h.pct(ow / sued, 0)], ['South 90° (facade)', h.num(senk), h.pct(senk / sued, 0)], ['North 35°', h.num(nord), h.pct(nord / sued, 0)],
], `Frankfurt am Main, postcode ${ffm.plz}.`, ['l', 'r', 'r'])}
<p>The conversion relies on 81 PVGIS queries per region, because the ratio between south and east behaves differently in the north than in the Alps. For balcony panels on a railing, the 90° row usually applies; more under ${h.a('balkonkraftwerk-ausrichtung', 'plug-in solar orientation')}. What the yield means in euros is worked out by the ${h.a('photovoltaik-rechner', 'rooftop PV calculator')}, with self-consumption and feed-in tariff.</p>`,
  },
});

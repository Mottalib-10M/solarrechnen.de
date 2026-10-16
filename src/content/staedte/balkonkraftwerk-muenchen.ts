import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, P, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** München: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.muenchen;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispielfamilie: vier Personen, Neubauwohnung mit breitem Südbalkon. */
const VA = 800, VERBRAUCH = 3500, KOSTEN_KLEIN = 450, KOSTEN_GROSS = 750, KLEIN = 900, GROSS = 1800;
const calc = (wp: number, tilt: number, az: number, kosten: number) => rechneBalkon({ ort, modulWp: wp, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: 0, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: kosten });
const klein = calc(KLEIN, 90, 0, KOSTEN_KLEIN), gross = calc(GROSS, 90, 0, KOSTEN_GROSS);
const west = calc(KLEIN, 90, 90, KOSTEN_KLEIN), ost = calc(KLEIN, 90, -90, KOSTEN_KLEIN);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C);
const winterSchnitt = ALL.reduce((a, c) => a + winterAnteil(c), 0) / ALL.length;
const eySchnitt = ALL.reduce((a, c) => a + c.ey, 0) / ALL.length;
const letzte = [...ALL].sort((x, y) => x.ey - y.ey)[0];
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => y.balkon / y.ew - x.balkon / x.ew).findIndex((x) => x.name === C.name) + 1;
const winterKwh = klein.ertrag * winter;
const ausrSumme = Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const anteil = (k: string) => C.ausrichtung[k] / ausrSumme;
const MONATE_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONATE_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monat = (i: number) => klein.ertrag * C.em[i] / summe(C);

export default defineGuide({
  id: 'balkonkraftwerk-muenchen',
  group: 'stadt',
  order: 102,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-800-watt', 'balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mieter', 'pv-ertrag-plz'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'eeg_8', 'weg_20'],
  de: {
    slug: 'balkonkraftwerk-muenchen',
    nav: 'München',
    card: `${DE.num(C.ey)} kWh je kWp, Platz ${rangEy} der Großstädte: warum ein Balkonkraftwerk in München auch im Winter liefert.`,
    title: `Balkonkraftwerk München 2026: höchster Ertrag der Städte`,
    description: `Balkonkraftwerk München 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, bester Wert der Großstädte, Winterstrom, ${DE.num(KLEIN)} oder ${DE.num(GROSS)} Wp am Balkon und Ihre Ersparnis im Jahr.`,
    h1: 'Balkonkraftwerk in München: Sonne, Föhn und Ersparnis 2026',
    intro: `Mit ${DE.num(KLEIN)} Wp senkrecht nach Süden erzeugt ein Balkonkraftwerk in München rund ${DE.num(klein.ertrag)} kWh im Jahr, so viel wie in keiner anderen der verglichenen Großstädte.`,
    resume: `München führt den Solarvergleich der deutschen Großstädte an: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} und ${DE.pct(C.ey / letzte.ey - 1)} mehr als ${letzte.name}. Auch der Winter fällt hier stärker aus als anderswo: November bis Februar liefern ${DE.pct(winter, 1)} des Jahresertrags, im Mittel der Städte sind es ${DE.pct(winterSchnitt, 1)}. Ein Gerät mit ${DE.num(KLEIN)} Wp am Südbalkon erzeugt ${DE.num(klein.ertrag)} kWh im Jahr; eine vierköpfige Familie mit ${DE.num(VERBRAUCH)} kWh Verbrauch spart damit bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(klein.ersparnisJahr)}. Mit ${DE.num(GROSS)} Wp an demselben Wechselrichter mit ${DE.num(VA)} VA steigt der Ertrag auf ${DE.num(gross.ertrag)} kWh und die Ersparnis auf ${DE.eur(gross.ersparnisJahr)}. Trotz der Sonne sind im Marktstammdatenregister nur ${DE.num(C.balkon)} Balkonkraftwerke eingetragen, ${DE.num(dichte, 1)} je 1 000 Einwohner gegenüber ${DE.num(dichteBund, 1)} im Bund.`,
    faqs: [
      { q: 'Warum bringt ein Balkonkraftwerk in München mehr als in Norddeutschland?', a: `Weil München südlicher und höher liegt: Der PVGIS-Punkt der Postleitzahl ${C.plz} liegt auf ${DE.num(C.elev)} Metern, die Sonne steht im Winter höher als an der Küste, und Föhnlagen bringen oft klare Luft aus den Alpen. Das Ergebnis sind ${DE.num(C.ey)} kWh je kWp bei 35 Grad Süd, der beste Wert unter ${ALL.length} Großstädten. Den größten Vorsprung hat München zwischen November und Februar.` },
      { q: 'Wie viel Strom liefert ein Balkonkraftwerk in München von November bis Februar?', a: `Ein Gerät mit ${DE.num(KLEIN)} Wp senkrecht am Südbalkon erzeugt in diesen vier Monaten zusammen rund ${DE.num(winterKwh)} kWh, ${DE.pct(winter, 1)} seines Jahresertrags. Im Dezember sind es ${DE.num(monat(11), 1)} kWh, im Januar ${DE.num(monat(0), 1)} kWh. Das reicht für die Grundlast von Kühlschrank und Router an hellen Tagen, nicht aber für Heizlüfter oder Waschmaschine.` },
      { q: 'Lohnen sich in München vier Module statt zwei am Balkon?', a: `Oft ja. Bei ${DE.num(VERBRAUCH)} kWh Verbrauch bringen ${DE.num(GROSS)} Wp am ${DE.num(VA)}-VA-Wechselrichter ${DE.num(gross.ertrag)} kWh im Jahr und sparen ${DE.eur(gross.ersparnisJahr)}, gegenüber ${DE.eur(klein.ersparnisJahr)} mit ${DE.num(KLEIN)} Wp. Erlaubt sind nach dem EEG bis ${DE.num(P.balkon.max_wp)} Wp Modulleistung. Voraussetzung ist ein Balkon, an dem vier Module sicher Platz finden.` },
    ],
    body: (h) => `
<h2>Spitzenreiter beim Ertrag: Münchens Kennzahlen</h2>
${h.table(['Kennzahl', 'München', 'Mittel der Städte'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `${h.num(eySchnitt)} kWh`],
  ['Platz beim Jahresertrag', `${rangEy} von ${h.num(ALL.length)}`, ''],
  ['Anteil November bis Februar', `${h.pct(winter, 1)} (Platz ${rangWinter})`, h.pct(winterSchnitt, 1)],
  ['Höhe des PVGIS-Punkts', `${h.num(C.elev)} m`, ''],
  ['Balkonkraftwerke in Betrieb', h.num(C.balkon), ''],
  ['je 1 000 Einwohner', `${h.num(dichte, 1)} (Platz ${rangDichte})`, `Bund ${h.num(dichteBund, 1)}`],
], `PVGIS für die PLZ ${C.plz}; Marktstammdatenregister, abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; Einwohner nach Destatis.`, ['l', 'r', 'r'])}

<h2>Winterstrom: wo München den Unterschied macht</h2>
<p>Zwischen Mai und August liegen die Großstädte beim Solarertrag eng beieinander. Den Abstand schafft München im Winter. Die Stadt liegt auf ${h.num(C.elev)} Metern Höhe am Rand des Alpenvorlands, und bei Föhn strömt trockene, klare Luft von den Bergen herab. An solchen Tagen erreicht die flache Wintersonne die Module ohne den Dunst, der im Tiefland häufig liegt. ${h.src('pvgis', 'PVGIS')} weist für München deshalb den höchsten Winteranteil aller verglichenen Städte aus.</p>
${h.table(['Monat', 'Ertrag bei ' + h.num(KLEIN) + ' Wp, senkrecht Süd'], [
  [MONATE_DE[10], `${h.num(monat(10), 1)} kWh`],
  [MONATE_DE[11], `${h.num(monat(11), 1)} kWh`],
  [MONATE_DE[0], `${h.num(monat(0), 1)} kWh`],
  [MONATE_DE[1], `${h.num(monat(1), 1)} kWh`],
  [MONATE_DE[6], `${h.num(monat(6), 1)} kWh`],
], 'PVGIS-Monatswerte, Juli zum Vergleich.', ['l', 'r'])}
<p>Senkrecht montierte Module profitieren davon am meisten, denn sie stehen fast im rechten Winkel zur tiefen Sonne. Schnee spielt am Geländer kaum eine Rolle, er rutscht von senkrechten Flächen ab.</p>

<h2>Zwei Module oder vier?</h2>
<p>Das ${h.src('eeg_8', 'EEG')} erlaubt bei Steckersolargeräten bis ${h.num(P.balkon.max_wp)} Wp Modulleistung, solange der Wechselrichter höchstens ${h.num(P.balkon.max_va)} VA abgibt. Für eine Münchner Familie mit ${h.num(VERBRAUCH)} kWh im Jahr sieht der Vergleich so aus:</p>
${h.table(['Ausstattung', 'Ertrag', 'selbst genutzt', 'Ersparnis/Jahr', 'Amortisation'], [
  [`${h.num(KLEIN)} Wp, ${h.eur(KOSTEN_KLEIN)}`, `${h.num(klein.ertrag)} kWh`, `${h.num(klein.selbst)} kWh`, h.eur(klein.ersparnisJahr), `${h.num(klein.amortisationJahre ?? 0, 1)} Jahre`],
  [`${h.num(GROSS)} Wp, ${h.eur(KOSTEN_GROSS)}`, `${h.num(gross.ertrag)} kWh`, `${h.num(gross.selbst)} kWh`, h.eur(gross.ersparnisJahr), `${h.num(gross.amortisationJahre ?? 0, 1)} Jahre`],
], `Senkrecht nach Süden, ${h.num(STROMPREIS_CT, 1)} ct/kWh, Kaufpreise als Annahme.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die zusätzlichen Module heben vor allem die Morgen- und Abendstunden sowie die trüben Tage, an denen zwei Module den Wechselrichter nicht auslasten. In der Mittagsspitze begrenzt der Wechselrichter, ein Teil des Mehrertrags geht dort verloren. Wie viel, hängt vom Balkon ab; der ${h.a('balkonkraftwerk-800-watt', 'Ratgeber zur 800-Watt-Grenze')} rechnet es durch.</p>

<h2>Westen oder Osten am Münchner Balkon</h2>
<p>Ein Westbalkon liefert mit ${h.num(KLEIN)} Wp ${h.num(west.ertrag)} kWh, ein Ostbalkon ${h.num(ost.ertrag)} kWh. Für Familien, die nachmittags zu Hause sind, ist Westen oft die bessere Lage, obwohl die Jahressumme unter der des Südens bleibt. Bei Dachanlagen zeigt das Register ein klares Bild: ${h.pct(anteil('S'), 0)} der Münchner Gebäudeanlagen weisen hauptsächlich nach Süden, ${h.pct(anteil('OW'), 0)} sind Ost-West-Anlagen.</p>

<h2>Viel Sonne, wenige Geräte</h2>
<p>Mit ${h.num(dichte, 1)} Balkonkraftwerken je 1 000 Einwohner steht München trotz des besten Ertrags nur auf Platz ${rangDichte} der Städte. Die Stadt ist geprägt von Mietwohnungen und großen Eigentümergemeinschaften, in denen über jede Änderung an der Fassade beraten wird. In Wohnungseigentumsanlagen zählt das Balkonkraftwerk nach ${h.src('weg_20', '§ 20 WEG')} zu den privilegierten Maßnahmen: Die Gemeinschaft entscheidet über die Art der Anbringung, kann das Gerät aber nicht grundsätzlich verbieten. Eingetragen wird es im ${h.src('mastr_einheiten', 'Marktstammdatenregister')}, das auch die Zahlen dieser Seite liefert.</p>`,
  },
  en: {
    slug: 'plug-in-solar-munich',
    nav: 'Munich',
    card: `${EN.num(C.ey)} kWh per kWp, rank ${rangEy} among the big cities: why balcony solar in Munich keeps working in winter.`,
    title: `Plug-in Solar Munich 2026: Highest Yield of All Cities`,
    description: `Plug-in solar Munich 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, the best big-city figure, winter output, ${EN.num(KLEIN)} or ${EN.num(GROSS)} Wp on a balcony and what you save each year.`,
    h1: 'Plug-in solar in Munich: sunshine, foehn and savings in 2026',
    intro: `With ${EN.num(KLEIN)} Wp hanging upright facing south, a balcony system in Munich produces about ${EN.num(klein.ertrag)} kWh a year, more than in any other big city compared here.`,
    resume: `Munich tops the solar comparison of Germany's big cities: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of ${ALL.length} and ${EN.pct(C.ey / letzte.ey - 1)} more than ${letzte.name}. Winter is stronger here too: November to February deliver ${EN.pct(winter, 1)} of annual yield, against an average of ${EN.pct(winterSchnitt, 1)} across the cities. A ${EN.num(KLEIN)} Wp plug-in device (Balkonkraftwerk) on a south balcony produces ${EN.num(klein.ertrag)} kWh a year; a family of four using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(klein.ersparnisJahr)} with it at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. With ${EN.num(GROSS)} Wp on the same ${EN.num(VA)} VA inverter, yield rises to ${EN.num(gross.ertrag)} kWh and the saving to ${EN.eur(gross.ersparnisJahr)}. Despite the sun, the Market Master Data Register lists only ${EN.num(C.balkon)} plug-in devices, ${EN.num(dichte, 1)} per 1,000 residents against ${EN.num(dichteBund, 1)} nationally.`,
    faqs: [
      { q: 'Why does balcony solar produce more in Munich than in northern Germany?', a: `Because Munich lies further south and higher up: the PVGIS point for postcode ${C.plz} is at ${EN.num(C.elev)} metres, the winter sun stands higher than on the coast, and foehn spells often bring clear air down from the Alps. The result is ${EN.num(C.ey)} kWh per kWp at 35 degrees south, the best of ${ALL.length} big cities. Munich's lead is largest between November and February.` },
      { q: 'How much power does a Munich balcony system make from November to February?', a: `A ${EN.num(KLEIN)} Wp device upright on a south balcony produces about ${EN.num(winterKwh)} kWh across these four months, ${EN.pct(winter, 1)} of its annual yield. December brings ${EN.num(monat(11), 1)} kWh, January ${EN.num(monat(0), 1)} kWh. On bright days that covers the base load of fridge and router, but not a fan heater or washing machine.` },
      { q: 'Are four panels instead of two worth it on a Munich balcony?', a: `Often, yes. With ${EN.num(VERBRAUCH)} kWh of consumption, ${EN.num(GROSS)} Wp on an ${EN.num(VA)} VA inverter yield ${EN.num(gross.ertrag)} kWh a year and save ${EN.eur(gross.ersparnisJahr)}, against ${EN.eur(klein.ersparnisJahr)} with ${EN.num(KLEIN)} Wp. The Renewable Energy Act allows up to ${EN.num(P.balkon.max_wp)} Wp of panels. You need a balcony where four panels can be fixed safely.` },
    ],
    body: (h) => `
<h2>Top of the table: Munich's key figures</h2>
${h.table(['Indicator', 'Munich', 'Average of cities'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `${h.num(eySchnitt)} kWh`],
  ['Rank for annual yield', `${rangEy} of ${h.num(ALL.length)}`, ''],
  ['Share November to February', `${h.pct(winter, 1)} (rank ${rangWinter})`, h.pct(winterSchnitt, 1)],
  ['Altitude of PVGIS point', `${h.num(C.elev)} m`, ''],
  ['Plug-in devices in operation', h.num(C.balkon), ''],
  ['per 1,000 residents', `${h.num(dichte, 1)} (rank ${rangDichte})`, `Germany ${h.num(dichteBund, 1)}`],
], `PVGIS for postcode ${C.plz}; Market Master Data Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; population from Destatis.`, ['l', 'r', 'r'])}

<h2>Winter power: where Munich makes the difference</h2>
<p>From May to August the big cities sit close together on solar yield. Munich builds its lead in winter. The city lies ${h.num(C.elev)} metres up on the edge of the Alpine foothills, and during foehn spells dry, clear air flows down from the mountains. On such days the low winter sun reaches the panels without the haze that often hangs over the lowlands. ${h.src('pvgis', 'PVGIS')} therefore shows Munich with the highest winter share of all the cities compared.</p>
${h.table(['Month', 'Yield at ' + h.num(KLEIN) + ' Wp, upright south'], [
  [MONATE_EN[10], `${h.num(monat(10), 1)} kWh`],
  [MONATE_EN[11], `${h.num(monat(11), 1)} kWh`],
  [MONATE_EN[0], `${h.num(monat(0), 1)} kWh`],
  [MONATE_EN[1], `${h.num(monat(1), 1)} kWh`],
  [MONATE_EN[6], `${h.num(monat(6), 1)} kWh`],
], 'PVGIS monthly values, July for comparison.', ['l', 'r'])}
<p>Upright panels gain most from this, because they stand almost at right angles to the low sun. Snow hardly matters on a railing; it slides off vertical surfaces.</p>

<h2>Two panels or four?</h2>
<p>The ${h.src('eeg_8', 'Renewable Energy Act')} allows plug-in devices up to ${h.num(P.balkon.max_wp)} Wp of panels as long as the inverter delivers no more than ${h.num(P.balkon.max_va)} VA. For a Munich family using ${h.num(VERBRAUCH)} kWh a year, the comparison looks like this:</p>
${h.table(['Set-up', 'Yield', 'Used at home', 'Saving/year', 'Payback'], [
  [`${h.num(KLEIN)} Wp, ${h.eur(KOSTEN_KLEIN)}`, `${h.num(klein.ertrag)} kWh`, `${h.num(klein.selbst)} kWh`, h.eur(klein.ersparnisJahr), `${h.num(klein.amortisationJahre ?? 0, 1)} years`],
  [`${h.num(GROSS)} Wp, ${h.eur(KOSTEN_GROSS)}`, `${h.num(gross.ertrag)} kWh`, `${h.num(gross.selbst)} kWh`, h.eur(gross.ersparnisJahr), `${h.num(gross.amortisationJahre ?? 0, 1)} years`],
], `Upright facing south, ${h.num(STROMPREIS_CT, 1)} ct/kWh, purchase prices assumed.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The extra panels mainly lift the morning and evening hours and the dull days when two panels cannot fill the inverter. At the midday peak the inverter caps output, so part of the extra yield is lost there. How much depends on the balcony; the ${h.a('balkonkraftwerk-800-watt', 'guide to the 800-watt limit')} works it out.</p>

<h2>West or east on a Munich balcony</h2>
<p>A west balcony gives ${h.num(west.ertrag)} kWh with ${h.num(KLEIN)} Wp, an east balcony ${h.num(ost.ertrag)} kWh. For families at home in the afternoon, west is often the better position even though the annual total stays below south. For roof systems the register is clear: ${h.pct(anteil('S'), 0)} of Munich's building-mounted systems face mainly south, ${h.pct(anteil('OW'), 0)} are east-west systems.</p>

<h2>Lots of sun, few devices</h2>
<p>With ${h.num(dichte, 1)} plug-in devices per 1,000 residents, Munich ranks only ${rangDichte} among the cities despite the best yield. The city is dominated by rented flats and large owners' associations, where every change to the facade is debated. In condominiums, a plug-in device counts as a privileged measure under ${h.src('weg_20', 'section 20 of the Condominium Act')}: the association decides how it is mounted but cannot refuse it outright. It is registered in the ${h.src('mastr_einheiten', 'Market Master Data Register')}, which also supplies the figures on this page.</p>`,
  },
});

import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Leipzig: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.leipzig;
const D = STAEDTE.dresden;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: Familie in einer Plattenbauwohnung in Grünau, Südwestbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 3000, KOSTEN = 450;
const calc = (tilt: number, az: number, verbrauch = VERBRAUCH) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: 0, verbrauchKwh: verbrauch, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const sued = calc(90, 0), suedwest = calc(90, 45), west = calc(90, 90), flach = calc(35, 0);
const suedwestKlein = calc(90, 45, 1500);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const MON_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iMax = C.em.indexOf(Math.max(...C.em));
const monatKwh = (ertrag: number, i: number) => ertrag * C.em[i] / summe(C);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
/** Rang des stärksten Monats: in wie vielen Städten liegt dieser Monatswert höher. */
const rangMonat = [...ALL].sort((x, y) => y.em[iMax] - x.em[iMax]).findIndex((x) => x.name === C.name) + 1;
const ausrAnteil = (c: City, k: string) => c.ausrichtung[k] / Object.values(c.ausrichtung).reduce((a, x) => a + x, 0);
const anteilS = ausrAnteil(C, 'S');
const anteilSBund = B.ausrichtung.S / Object.values(B.ausrichtung).reduce((a, x) => a + x, 0);
const rangSued = [...ALL].sort((x, y) => ausrAnteil(y, 'S') - ausrAnteil(x, 'S')).findIndex((x) => x.name === C.name) + 1;
const anteilOW = ausrAnteil(C, 'OW');
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => y.balkon / y.ew - x.balkon / x.ew).findIndex((x) => x.name === C.name) + 1;
const jeDach = C.balkon / C.gebaeude, jeDachBund = B.balkon / B.gebaeude;
const vollQuote = C.voll / C.gebaeude, vollQuoteBund = B.voll / B.gebaeude;

export default defineGuide({
  id: 'balkonkraftwerk-leipzig',
  group: 'stadt',
  order: 107,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ausrichtung', 'balkonkraftwerk-lohnt-sich', 'balkonkraftwerk-dresden', 'marktstammdatenregister-anmelden'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'bgb_554', 'weg_20'],
  de: {
    slug: 'balkonkraftwerk-leipzig',
    nav: 'Leipzig',
    card: `${DE.num(C.ey)} kWh je kWp und Platz ${rangSued} bei Süddächern: was ein Steckersolargerät in Leipzig liefert.`,
    title: `Balkonkraftwerk Leipzig 2026: Ertrag, Ausrichtung, Ersparnis`,
    description: `Balkonkraftwerk Leipzig 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, Ertrag am Süd- und Westbalkon und was eine dreiköpfige Familie spart.`,
    h1: 'Balkonkraftwerk in Leipzig: Ertrag und Ersparnis 2026',
    intro: `Zwei Module mit zusammen ${DE.num(WP)} Wp, senkrecht am Südwestbalkon, liefern in Leipzig rund ${DE.num(suedwest.ertrag)} kWh im Jahr und sparen einer Familie mit ${DE.num(VERBRAUCH)} kWh Verbrauch ${DE.eur(suedwest.ersparnisJahr)}.`,
    resume: `Leipzig liegt in der flachen Leipziger Tieflandsbucht, und das sieht man den Solardaten an: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} unter ${ALL.length} Großstädten und knapp vor Dresden mit ${DE.num(D.ey)} kWh. Stärkster Monat ist der ${MON_DE[iMax]}, in dem nur ${rangMonat === 1 ? 'keine andere der verglichenen Städte' : `${rangMonat - 1} der verglichenen Städte`} mehr Sonnenstrom je kWp liefert. Ein Balkonkraftwerk mit ${DE.num(WP)} Wp senkrecht nach Südwesten erzeugt rund ${DE.num(suedwest.ertrag)} kWh, nach Süden ${DE.num(sued.ertrag)} kWh, nach Westen ${DE.num(west.ertrag)} kWh. Eine dreiköpfige Familie mit ${DE.num(VERBRAUCH)} kWh Jahresverbrauch nutzt am Südwestbalkon ${DE.pct(suedwest.eigenAnteil)} davon selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(suedwest.ersparnisJahr)} im Jahr; ein Gerät für ${DE.eur(KOSTEN)} hat sich nach ${DE.num(suedwest.amortisationJahre ?? 0, 1)} Jahren bezahlt. Im Marktstammdatenregister stehen ${DE.num(C.balkon)} Steckersolargeräte, ${DE.num(dichte, 1)} je 1 000 Einwohner gegenüber ${DE.num(dichteBund, 1)} im Bund. Auffällig sind die Dächer: ${DE.pct(anteilS)} der Gebäudeanlagen zeigen hauptsächlich nach Süden, der höchste Anteil im Vergleich.`,
    faqs: [
      { q: 'Wie viel bringt ein Balkonkraftwerk in Leipzig im Mai?', a: `Der ${MON_DE[iMax]} ist in Leipzig der ertragreichste Monat. Ein Gerät mit ${DE.num(WP)} Wp senkrecht nach Südwesten erzeugt dann rund ${DE.num(monatKwh(suedwest.ertrag, iMax))} kWh, im Dezember dagegen nur ${DE.num(monatKwh(suedwest.ertrag, 11), 1)} kWh. Grundlage sind die PVGIS-Monatswerte für die Postleitzahl ${C.plz}. Weil die Mittagsspitzen im Frühsommer den Grundbedarf übersteigen, fließt ein Teil davon unvergütet ins Netz.` },
      { q: 'Erzeugt ein Balkonkraftwerk in Leipzig mehr als in Dresden?', a: `Etwas mehr, aber der Unterschied ist klein. PVGIS rechnet für Leipzig mit ${DE.num(C.ey)} kWh je kWp bei 35 Grad Süd, für Dresden mit ${DE.num(D.ey)} kWh. Bei ${DE.num(WP)} Wp am Balkon sind das wenige Kilowattstunden im Jahr, weniger als ein leicht schattiger Baum kostet. Wichtiger als die Stadt sind Ausrichtung, Verschattung und wie viel Strom tagsüber im Haushalt läuft.` },
      { q: 'Wie viele Balkonkraftwerke gibt es in Leipzig?', a: `Beim Abruf des Marktstammdatenregisters waren in Leipzig ${DE.num(C.balkon)} Steckersolargeräte in Betrieb eingetragen, ${DE.num(dichte, 1)} je 1 000 Einwohner. Damit liegt Leipzig auf Platz ${rangDichte} der ${ALL.length} verglichenen Großstädte, aber unter dem Bundesschnitt von ${DE.num(dichteBund, 1)}. Auf jede Solaranlage auf einem Leipziger Gebäude kommen ${DE.num(jeDach, 2)} Balkongeräte, im Bund nur ${DE.num(jeDachBund, 2)}.` },
      { q: 'Lohnt sich ein Balkonkraftwerk für einen Single in Leipzig?', a: `Ja, nur langsamer als für eine Familie. Mit ${DE.num(1500)} kWh Verbrauch und ${DE.num(WP)} Wp am Südwestbalkon nutzt ein Einpersonenhaushalt ${DE.pct(suedwestKlein.eigenAnteil)} des Stroms selbst und spart ${DE.eur(suedwestKlein.ersparnisJahr)} im Jahr. Bei ${DE.eur(KOSTEN)} Anschaffung sind das ${DE.num(suedwestKlein.amortisationJahre ?? 0, 1)} Jahre bis zur Amortisation. Wer tagsüber nicht zu Hause ist, sollte Geräte wie Waschmaschine oder Spülmaschine per Timer in die Mittagsstunden legen.` },
    ],
    body: (h) => `
<h2>Steckbrief Leipzig: Sonne, Dächer, Register</h2>
${h.table(['Merkmal', 'Leipzig', 'Vergleich'], [
  ['Jahresertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `Platz ${rangEy} von ${h.num(ALL.length)}`],
  [`Stärkster Monat (${MON_DE[iMax]})`, `${h.num(C.em[iMax], 1)} kWh je kWp`, `Platz ${rangMonat} von ${h.num(ALL.length)}`],
  ['Gebäudeanlagen mit Hauptausrichtung Süd', h.pct(anteilS, 0), `Bund ${h.pct(anteilSBund, 0)}`],
  ['Steckersolargeräte in Betrieb', h.num(C.balkon), `${h.num(dichte, 1)} je 1 000 Einwohner`],
  ['Balkongeräte je Gebäudeanlage', h.num(jeDach, 2), `Bund ${h.num(jeDachBund, 2)}`],
  ['Anteil Volleinspeisung an Gebäudeanlagen', h.pct(vollQuote, 0), `Bund ${h.pct(vollQuoteBund, 0)}`],
], `PVGIS für die PLZ ${C.plz}; ${h.src('mastr_einheiten', 'Marktstammdatenregister')}, Abruf am ${h.date(ST.source.mastr_retrieved_at)}; Einwohner nach ${h.src('destatis_gv', 'Destatis')}.`, ['l', 'r', 'l'])}

<h2>Flaches Land, freier Horizont</h2>
<p>Zwischen Elster und Pleiße gibt es kaum Erhebungen, die morgens oder abends die Sonne verdecken. Der PVGIS-Rasterpunkt der Stadt liegt auf ${h.num(C.elev)} m, und das Höhenmodell, mit dem PVGIS den Geländehorizont berechnet, findet in der Tieflandsbucht wenig, was Licht wegnimmt. Was in Leipzig Schatten wirft, sind Nachbarhäuser, Straßenbäume und Balkonbrüstungen aus Beton, nicht die Landschaft. Bevor Sie Module bestellen, lohnt deshalb ein Blick an einem klaren Vormittag und an einem späten Nachmittag: Liegt der Balkon dann im Schatten des Gegenübers, tragen Sie im Rechner oben eine Verschattung ein.</p>
<p>Der Jahresverlauf hat seinen Höhepunkt früh. Im ${MON_DE[iMax]} liefert jedes Kilowatt Peak in Leipzig ${h.num(C.em[iMax], 1)} kWh, im Juli ${h.num(C.em[6], 1)} kWh. Für ein Balkonkraftwerk heißt das: Die besten Wochen fallen in die Zeit vor den Sommerferien, in der die meisten Haushalte noch zu Hause sind und den Mittagsstrom tatsächlich verbrauchen.</p>

<h2>Warum fast jede zweite Dachanlage nach Süden zeigt</h2>
<p>Unter den ${h.num(C.gebaeude)} Solaranlagen auf Leipziger Gebäuden ist die Südausrichtung mit ${h.pct(anteilS, 0)} so häufig wie in keiner anderen der verglichenen Städte; Ost-West-Anlagen machen nur ${h.pct(anteilOW, 0)} aus. Die Zahl stammt aus den Angaben der Betreiber im Register und sagt nichts über Balkone, wohl aber über die Bauweise: Viele Dächer in den Ein- und Zweifamilienhausgebieten am Stadtrand haben eine klare Südseite. Wer dort wohnt, fährt mit einer Dachanlage meist besser als mit einem Steckergerät; wer zur Miete im Geschoss wohnt, hat diese Wahl nicht.</p>
<p>Am Balkon zählt der Winkel zur Sonne. Senkrecht nach Süden kommen ${h.num(sued.ertrag)} kWh zusammen, mit 35 Grad aufgeständert wären es ${h.num(flach.ertrag)} kWh. Der Unterschied fällt fast ganz in den Sommer, in dem die Familie mittags ohnehin mehr erzeugt, als sie braucht. Welche Neigung am eigenen Geländer erlaubt und sinnvoll ist, erklärt der Ratgeber zur ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung')}.</p>

<h2>Mehr Balkongeräte im Verhältnis zu den Dächern</h2>
<p>Bundesweit kommen auf jede Gebäudeanlage ${h.num(jeDachBund, 2)} Steckersolargeräte, in Leipzig sind es ${h.num(jeDach, 2)}. Das passt zu einer Stadt, in der die meisten Menschen in Mehrfamilienhäusern wohnen: Gründerzeitviertel, Plattenbaugebiete und Neubauten bieten mehr Balkone als Dächer, auf die man selbst bauen darf. Gemessen an der Einwohnerzahl liegt Leipzig mit ${h.num(dichte, 1)} Geräten je 1 000 Einwohner auf Platz ${rangDichte} der Großstädte, im ländlich geprägten Bundesschnitt sind es ${h.num(dichteBund, 1)}.</p>
<p>Mieter haben seit Oktober 2024 einen Anspruch auf die Zustimmung des Vermieters (${h.src('bgb_554', '§ 554 BGB')}), Wohnungseigentümer auf die der Gemeinschaft (${h.src('weg_20', '§ 20 WEG')}). Über das Wie, also Befestigung und Kabelführung, dürfen beide mitreden. Die Registrierung im Marktstammdatenregister erledigen Sie selbst; wie das geht, zeigt die ${h.a('marktstammdatenregister-anmelden', 'Anleitung zum Register')}.</p>

<h2>Eine Familie in Grünau rechnet nach</h2>
<p>Drei Personen, ${h.num(VERBRAUCH)} kWh im Jahr, eine Wohnung im fünften Stock eines Plattenbaus mit Balkon nach Südwesten und freier Sicht. Das Gerät mit ${h.num(WP)} Wp kostet ${h.eur(KOSTEN)}. Es erzeugt ${h.num(suedwest.ertrag)} kWh, von denen der Haushalt ${h.num(suedwest.selbst)} kWh selbst verbraucht; der Rest geht ohne Vergütung ins Netz. Bei ${h.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde sinkt die Stromrechnung um ${h.eur(suedwest.ersparnisJahr)}, nach ${h.num(suedwest.amortisationJahre ?? 0, 1)} Jahren ist das Gerät bezahlt. Zeigte derselbe Balkon genau nach Westen, wären es ${h.num(west.ertrag)} kWh und ${h.eur(west.ersparnisJahr)} Ersparnis. Ob sich das Gerät auch ohne idealen Balkon rechnet, beantwortet die Seite ${h.a('balkonkraftwerk-lohnt-sich', 'Lohnt sich ein Balkonkraftwerk')}; den Vergleich mit der Nachbarstadt zeigt ${h.a('balkonkraftwerk-dresden', 'Balkonkraftwerk Dresden')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-leipzig',
    nav: 'Leipzig',
    card: `${EN.num(C.ey)} kWh per kWp and rank ${rangSued} for south-facing roofs: what a plug-in system yields in Leipzig.`,
    title: `Plug-in Solar Leipzig 2026: Yield, Orientation and Saving`,
    description: `Plug-in Solar Leipzig 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, the yield on south and west balconies and a family's yearly saving.`,
    h1: 'Plug-in solar in Leipzig: yield and saving in 2026',
    intro: `Two panels totalling ${EN.num(WP)} Wp, hanging upright on a south-west balcony, produce about ${EN.num(suedwest.ertrag)} kWh a year in Leipzig and save a family using ${EN.num(VERBRAUCH)} kWh ${EN.eur(suedwest.ersparnisJahr)}.`,
    resume: `Leipzig sits in the flat Leipzig Lowland Bay, and its solar data reflect it: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} among ${ALL.length} big cities and just ahead of Dresden at ${EN.num(D.ey)} kWh. The best month is ${MON_EN[iMax]}, when ${rangMonat === 1 ? 'no other city compared' : `only ${rangMonat - 1} of the cities compared`} produces more solar power per kWp. A plug-in system (Balkonkraftwerk) of ${EN.num(WP)} Wp hanging upright facing south-west produces about ${EN.num(suedwest.ertrag)} kWh, facing south ${EN.num(sued.ertrag)} kWh, facing west ${EN.num(west.ertrag)} kWh. A family of three using ${EN.num(VERBRAUCH)} kWh a year consumes ${EN.pct(suedwest.eigenAnteil)} of the south-west output itself and saves ${EN.eur(suedwest.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh; a device costing ${EN.eur(KOSTEN)} pays for itself in ${EN.num(suedwest.amortisationJahre ?? 0, 1)} years. The Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices, ${EN.num(dichte, 1)} per 1,000 residents against ${EN.num(dichteBund, 1)} nationally. The roofs stand out: ${EN.pct(anteilS)} of building systems face mainly south, the highest share in the comparison.`,
    faqs: [
      { q: 'How much does balcony solar produce in Leipzig in May?', a: `${MON_EN[iMax]} is Leipzig's most productive month. A ${EN.num(WP)} Wp device hanging upright facing south-west then produces about ${EN.num(monatKwh(suedwest.ertrag, iMax))} kWh, against only ${EN.num(monatKwh(suedwest.ertrag, 11), 1)} kWh in December. The basis is the PVGIS monthly data for postcode ${C.plz}. Because the midday peaks in early summer exceed a household's base load, part of that power flows into the grid unpaid.` },
      { q: 'Does a plug-in system produce more in Leipzig than in Dresden?', a: `Slightly more, but the gap is small. PVGIS gives Leipzig ${EN.num(C.ey)} kWh per kWp at 35 degrees south and Dresden ${EN.num(D.ey)} kWh. For ${EN.num(WP)} Wp on a balcony that is a few kilowatt hours a year, less than a lightly shading tree costs you. Orientation, shade and how much power the household uses during the day matter far more than the city.` },
      { q: 'How many balcony solar devices are there in Leipzig?', a: `When the Market Master Data Register was retrieved, Leipzig had ${EN.num(C.balkon)} plug-in devices registered in operation, ${EN.num(dichte, 1)} per 1,000 residents. That puts Leipzig at rank ${rangDichte} of the ${ALL.length} big cities compared, but below the national ${EN.num(dichteBund, 1)}. For every solar system on a Leipzig building there are ${EN.num(jeDach, 2)} balcony devices, against only ${EN.num(jeDachBund, 2)} nationally.` },
      { q: 'Is balcony solar worth it for a single person in Leipzig?', a: `Yes, just more slowly than for a family. With ${EN.num(1500)} kWh consumption and ${EN.num(WP)} Wp on a south-west balcony, a one-person household uses ${EN.pct(suedwestKlein.eigenAnteil)} of the output itself and saves ${EN.eur(suedwestKlein.ersparnisJahr)} a year. At ${EN.eur(KOSTEN)} purchase cost that means ${EN.num(suedwestKlein.amortisationJahre ?? 0, 1)} years to break even. If you are out during the day, put the washing machine or dishwasher on a timer for the midday hours.` },
    ],
    body: (h) => `
<h2>Leipzig profile: sun, roofs, register</h2>
${h.table(['Feature', 'Leipzig', 'Comparison'], [
  ['Annual yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `rank ${rangEy} of ${h.num(ALL.length)}`],
  [`Best month (${MON_EN[iMax]})`, `${h.num(C.em[iMax], 1)} kWh per kWp`, `rank ${rangMonat} of ${h.num(ALL.length)}`],
  ['Building systems facing mainly south', h.pct(anteilS, 0), `Germany ${h.pct(anteilSBund, 0)}`],
  ['Plug-in devices in operation', h.num(C.balkon), `${h.num(dichte, 1)} per 1,000 residents`],
  ['Balcony devices per building system', h.num(jeDach, 2), `Germany ${h.num(jeDachBund, 2)}`],
  ['Full feed-in share of building systems', h.pct(vollQuote, 0), `Germany ${h.pct(vollQuoteBund, 0)}`],
], `PVGIS for postcode ${C.plz}; ${h.src('mastr_einheiten', 'Market Master Data Register')}, retrieved on ${h.date(ST.source.mastr_retrieved_at)}; population from ${h.src('destatis_gv', 'Destatis')}.`, ['l', 'r', 'l'])}

<h2>Flat land, open horizon</h2>
<p>Between the Weiße Elster and Pleiße rivers there is hardly any high ground to hide the morning or evening sun. The city's PVGIS grid point sits at ${h.num(C.elev)} m, and the terrain model PVGIS uses to calculate the horizon finds little in the lowland that blocks light. In Leipzig, shade comes from the building opposite, street trees and concrete balcony parapets, not from the landscape. Before ordering panels, check your balcony on a clear morning and a late afternoon: if it lies in a neighbour's shadow, enter some shading in the calculator above.</p>
<p>The year peaks early. In ${MON_EN[iMax]}, each kilowatt peak in Leipzig delivers ${h.num(C.em[iMax], 1)} kWh, in July ${h.num(C.em[6], 1)} kWh. For a balcony system this means the best weeks come before the summer holidays, while most households are still at home and actually use the midday power.</p>

<h2>Why nearly every other roof system faces south</h2>
<p>Of the ${h.num(C.gebaeude)} solar systems on Leipzig buildings, ${h.pct(anteilS, 0)} face south, more than in any other city compared; east-west systems account for only ${h.pct(anteilOW, 0)}. The figure comes from operators' entries in the register and says nothing about balconies, but a lot about building styles: many roofs in the detached and semi-detached areas on the city's edge have a clear south side. If you live there, a rooftop system usually beats a plug-in device; if you rent a flat, you do not have that choice.</p>
<p>On a balcony, the angle to the sun counts. Upright facing south gives ${h.num(sued.ertrag)} kWh; tilted at 35 degrees it would be ${h.num(flach.ertrag)} kWh. Almost all of the difference falls in summer, when the family already produces more at midday than it needs. Which tilt is allowed and sensible on your railing is covered in the guide to ${h.a('balkonkraftwerk-ausrichtung', 'orientation')}.</p>

<h2>More balcony devices relative to roofs</h2>
<p>Nationally there are ${h.num(jeDachBund, 2)} plug-in devices for every building system; in Leipzig there are ${h.num(jeDach, 2)}. That fits a city where most people live in apartment blocks: 19th-century quarters, prefab estates and new builds offer more balconies than roofs you are allowed to build on. Per head, Leipzig ranks ${rangDichte} among the big cities at ${h.num(dichte, 1)} devices per 1,000 residents, while the national average, lifted by rural areas, is ${h.num(dichteBund, 1)}.</p>
<p>Since October 2024, tenants have a right to their landlord's consent (${h.src('bgb_554', 'section 554 Civil Code')}) and flat owners to that of the owners' association (${h.src('weg_20', 'section 20 WEG')}). Both may have a say in how it is done, meaning fixings and cable routing. You register the device in the Market Master Data Register yourself; the ${h.a('marktstammdatenregister-anmelden', 'register guide')} shows how.</p>

<h2>A family in Grünau does the maths</h2>
<p>Three people, ${h.num(VERBRAUCH)} kWh a year, a fifth-floor flat in a prefab block (Plattenbau) with a south-west balcony and a clear view. The ${h.num(WP)} Wp device costs ${h.eur(KOSTEN)}. It produces ${h.num(suedwest.ertrag)} kWh, of which the household uses ${h.num(suedwest.selbst)} kWh itself; the rest goes to the grid unpaid. At ${h.num(STROMPREIS_CT, 1)} cents per kWh the electricity bill falls by ${h.eur(suedwest.ersparnisJahr)}, and the device is paid off after ${h.num(suedwest.amortisationJahre ?? 0, 1)} years. If the same balcony faced due west, it would be ${h.num(west.ertrag)} kWh and a saving of ${h.eur(west.ersparnisJahr)}. Whether a device pays without an ideal balcony is answered on ${h.a('balkonkraftwerk-lohnt-sich', 'is balcony solar worth it')}; the comparison with the neighbouring city is on ${h.a('balkonkraftwerk-dresden', 'plug-in solar Dresden')}.</p>`,
  },
});

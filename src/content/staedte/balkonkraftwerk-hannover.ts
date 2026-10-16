import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz, EY_BUND } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Hannover: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.hannover;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: Paar in einer Altbauwohnung in der List, Westbalkon hinter einem Straßenbaum. */
const WP = 900, VA = 800, VERBRAUCH = 2500, KOSTEN = 450;
const calc = (az: number, schatten: number) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: 90, azimut: az, verschattung: schatten, speicherKwh: 0, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const SCHATTEN = [0, 0.1, 0.25, 0.4];
const westReihe = SCHATTEN.map((s) => calc(90, s));
const west = westReihe[0], westBaum = westReihe[1];
const sued = calc(0, 0), ost = calc(-90, 0);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const teil = (c: City, ms: number[]) => ms.reduce((a, i) => a + c.em[i], 0) / summe(c);
const SOMMER = [3, 4, 5, 6, 7];
const sommer = teil(C, SOMMER);
const rangSommer = [...ALL].sort((x, y) => teil(y, SOMMER) - teil(x, SOMMER)).findIndex((x) => x.name === C.name) + 1;
const winter = teil(C, [10, 11, 0, 1]);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const abstandBund = 1 - C.ey / EY_BUND;
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => y.balkon / y.ew - x.balkon / x.ew).findIndex((x) => x.name === C.name) + 1;
const ausrAnteil = (c: City, k: string) => c.ausrichtung[k] / Object.values(c.ausrichtung).reduce((a, x) => a + x, 0);
const anteilS = ausrAnteil(C, 'S'), anteilOW = ausrAnteil(C, 'OW');
const schraeg = ausrAnteil(C, 'SO') + ausrAnteil(C, 'SW');
const schraegBund = (B.ausrichtung.SO + B.ausrichtung.SW) / Object.values(B.ausrichtung).reduce((a, x) => a + x, 0);
const rangOW = [...ALL].sort((x, y) => ausrAnteil(y, 'OW') - ausrAnteil(x, 'OW')).findIndex((x) => x.name === C.name) + 1;
const speicherQuote = C.speicher / C.gebaeude;

export default defineGuide({
  id: 'balkonkraftwerk-hannover',
  group: 'stadt',
  order: 109,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ertrag', 'balkonkraftwerk-mieter', 'photovoltaik-ost-west', 'balkonkraftwerk-800-watt'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-hannover',
    nav: 'Hannover',
    card: `${DE.num(C.ey)} kWh je kWp und viele Bäume vor den Fenstern: was ein Steckersolargerät in Hannover wirklich liefert.`,
    title: `Balkonkraftwerk Hannover 2026: Ertrag, Schatten, Ersparnis`,
    description: `Balkonkraftwerk Hannover 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, was Bäume und Nachbarhäuser kosten und was ein Paar im Jahr spart.`,
    h1: 'Balkonkraftwerk in Hannover: Ertrag und Ersparnis 2026',
    intro: `Ein Westbalkon mit ${DE.num(WP)} Wp bringt in Hannover rund ${DE.num(west.ertrag)} kWh im Jahr; steht ein Baum davor und nimmt ein Zehntel des Lichts, bleiben ${DE.num(westBaum.ertrag)} kWh und ${DE.eur(westBaum.ersparnisJahr)} Ersparnis.`,
    resume: `Hannover liegt im Norddeutschen Tiefland und beim Solarertrag im unteren Drittel der Großstädte: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} und ${DE.pct(abstandBund)} unter dem einwohnergewichteten Bundesdurchschnitt von ${DE.num(EY_BUND)} kWh. Das Jahr ist ausgeprägt sommerlastig: April bis August liefern ${DE.pct(sommer, 1)} des Ertrags, November bis Februar nur ${DE.pct(winter, 1)}. Ein Balkonkraftwerk mit ${DE.num(WP)} Wp senkrecht nach Süden erzeugt rund ${DE.num(sued.ertrag)} kWh, nach Westen ${DE.num(west.ertrag)} kWh, nach Osten ${DE.num(ost.ertrag)} kWh. Mehr als die Himmelsrichtung entscheidet in der grünen Stadt oft der Schatten: Nimmt ein Straßenbaum dem Westbalkon ein Zehntel des Lichts, sinkt der Ertrag auf ${DE.num(westBaum.ertrag)} kWh. Ein Paar mit ${DE.num(VERBRAUCH)} kWh Verbrauch spart dann bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(westBaum.ersparnisJahr)} im Jahr und hat ${DE.eur(KOSTEN)} nach ${DE.num(westBaum.amortisationJahre ?? 0, 1)} Jahren zurück. Im Marktstammdatenregister stehen ${DE.num(C.balkon)} Steckersolargeräte, ${DE.num(dichte, 1)} je 1 000 Einwohner.`,
    faqs: [
      { q: 'Wie viel kostet ein Baum vor dem Balkon in Hannover an Ertrag?', a: `Bei ${DE.num(WP)} Wp am Westbalkon sinkt der Jahresertrag mit einem Zehntel Verschattung von ${DE.num(west.ertrag)} auf ${DE.num(westBaum.ertrag)} kWh, mit einem Viertel auf ${DE.num(westReihe[2].ertrag)} kWh. Die Ersparnis fällt weniger stark, von ${DE.eur(west.ersparnisJahr)} auf ${DE.eur(westBaum.ersparnisJahr)} beziehungsweise ${DE.eur(westReihe[2].ersparnisJahr)}, weil der Haushalt den verbliebenen Strom fast ganz selbst nutzt. Laubbäume schatten vor allem im Sommer.` },
      { q: 'Ist Hannover zu weit im Norden für ein Balkonkraftwerk?', a: `Nein. Mit ${DE.num(C.ey)} kWh je kWp liegt Hannover ${DE.pct(abstandBund)} unter dem Bundesdurchschnitt, das kostet ein Gerät mit ${DE.num(WP)} Wp nur wenige Euro im Jahr. Am Südbalkon spart ein Paar mit ${DE.num(VERBRAUCH)} kWh Verbrauch ${DE.eur(sued.ersparnisJahr)}, das Gerät für ${DE.eur(KOSTEN)} ist nach ${DE.num(sued.amortisationJahre ?? 0, 1)} Jahren bezahlt. Ein kleines Steckergerät deckt ohnehin nur den Grundbedarf, und der wird auch im Norden erreicht.` },
      { q: 'Wie viele Balkonkraftwerke sind in Hannover registriert?', a: `Das Marktstammdatenregister zählte in der Stadt Hannover ${DE.num(C.balkon)} Steckersolargeräte in Betrieb, ${DE.num(dichte, 1)} je 1 000 Einwohner und damit Platz ${rangDichte} von ${ALL.length} Großstädten. Der Bundesschnitt liegt bei ${DE.num(dichteBund, 1)}. Daneben stehen ${DE.num(C.gebaeude)} Solaranlagen auf Gebäuden im Register. Die Zahlen gelten für die Stadt, nicht für die Region Hannover mit ihren Umlandgemeinden.` },
    ],
    body: (h) => `
<h2>Hannover neben dem Bundesdurchschnitt</h2>
${h.table(['Größe', 'Hannover', 'Bund oder Rang'], [
  ['PVGIS-Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `Bund ${h.num(EY_BUND)} kWh, Platz ${rangEy} von ${h.num(ALL.length)}`],
  ['Anteil April bis August', h.pct(sommer, 1), `Platz ${rangSommer} von ${h.num(ALL.length)}`],
  ['Anteil November bis Februar', h.pct(winter, 1), 'PVGIS-Monatswerte'],
  ['Steckersolargeräte je 1 000 Einwohner', h.num(dichte, 1), `Bund ${h.num(dichteBund, 1)}`],
  ['Dachanlagen Süd / Ost-West', `${h.pct(anteilS, 0)} / ${h.pct(anteilOW, 0)}`, `Ost-West: Platz ${rangOW}`],
  ['Dachanlagen Südost oder Südwest', h.pct(schraeg, 0), `Bund ${h.pct(schraegBund, 0)}`],
], `PVGIS für die PLZ ${C.plz}, Bundeswert nach Einwohnern gewichtet; ${h.src('mastr_einheiten', 'Marktstammdatenregister')} vom ${h.date(ST.source.mastr_retrieved_at)}; Einwohner: ${h.src('destatis_gv', 'Destatis')}.`, ['l', 'r', 'l'])}

<h2>Ein Jahr, das im Sommer gemacht wird</h2>
<p>Zwischen Deister und Lüneburger Heide gibt es keinen Höhenzug, der die Sonne verdeckt; der PVGIS-Rasterpunkt liegt auf ${h.num(C.elev)} m. Was Hannover Ertrag kostet, ist der Winter des Nordens: kurze Tage und viele bedeckte Wochen. Von April bis August fallen ${h.pct(sommer, 1)} des Jahresertrags an, Platz ${rangSommer} unter den verglichenen Städten. In dieser Zeit erzeugt ein Gerät mit ${h.num(WP)} Wp mittags oft mehr, als ein Haushalt gerade braucht, und der Überschuss geht ohne Vergütung ins Netz.</p>
<p>Daraus folgt eine einfache Regel: Größer zu bauen bringt in Hannover weniger als anderswo, weil das Mehr vor allem in die Monate fällt, in denen schon genug da ist. Zwei Module am Balkon passen zum Grundbedarf einer Wohnung; wer mehr will, sollte zuerst prüfen, ob er den Strom auch nutzt. Der Vergleich auf der Seite ${h.a('balkonkraftwerk-800-watt', 'Balkonkraftwerk mit 800 Watt')} zeigt, wo die Leistungsgrenze des Wechselrichters liegt.</p>

<h2>Straßenbäume, Stadtwald, Hinterhof: Schatten einrechnen</h2>
<p>Hannover ist eine grüne Stadt, mit der Eilenriede als großem Stadtwald, alten Alleen in der List und in der Südstadt und vielen begrünten Innenhöfen. Für die Lebensqualität ist das ein Gewinn, für ein Balkonkraftwerk ein Abzug. Wie viel, hängt davon ab, welcher Teil des Tageslichts fehlt. Für ${h.num(WP)} Wp am Westbalkon und ${h.num(VERBRAUCH)} kWh Verbrauch rechnet der Motor so:</p>
${h.table(['Verschattung', 'Ertrag im Jahr', 'selbst genutzt', 'Ersparnis'], SCHATTEN.map((s, i) => [h.pct(s, 0), `${h.num(westReihe[i].ertrag)} kWh`, `${h.num(westReihe[i].selbst)} kWh`, h.eur(westReihe[i].ersparnisJahr)]), `Westbalkon, senkrechte Module, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>Die Ersparnis sinkt langsamer als der Ertrag. Ein schattiger Balkon verliert vor allem die Mittagsspitzen, die ohnehin zum Teil ins Netz gegangen wären. Laubbäume nehmen im Sommer mehr Licht als im Winter, wenn die Sonne ohnehin tief steht. Schätzen Sie den Schatten an einem sonnigen Tag zwischen Mittag und frühem Abend und tragen Sie ihn oben im Rechner ein.</p>

<h2>Süd oder Ost-West, wenig dazwischen</h2>
<p>Die ${h.num(C.gebaeude)} Dachanlagen der Stadt zeigen ein klares Muster: ${h.pct(anteilS, 0)} hauptsächlich nach Süden, ${h.pct(anteilOW, 0)} als Ost-West-Anlage, Platz ${rangOW} der Großstädte. Schräge Lagen nach Südost oder Südwest machen nur ${h.pct(schraeg, 0)} aus, im Bund sind es ${h.pct(schraegBund, 0)}. Flache Dächer, auf denen Module beidseitig flach aufgestellt werden, sind eine mögliche Erklärung; das Register selbst nennt keine Gründe. Je Gebäudeanlage stehen in Hannover ${h.num(speicherQuote, 2)} Batteriespeicher im Register. Für den Balkon ist der Ost-West-Gedanke selten umsetzbar, weil eine Wohnung meist nur eine Seite hat. Wie sich Ost-West auf dem Dach rechnet, erklärt die Seite ${h.a('photovoltaik-ost-west', 'Photovoltaik Ost-West')}.</p>

<h2>Rechenweg für ein Paar in der List</h2>
<p>Zwei Personen, ${h.num(VERBRAUCH)} kWh im Jahr, zweiter Stock, Balkon nach Westen über einer Straße mit Linden. Der Baum vor dem Haus nimmt geschätzt ein Zehntel des Lichts. Das Gerät mit ${h.num(WP)} Wp kostet ${h.eur(KOSTEN)} und liefert ${h.num(westBaum.ertrag)} kWh, davon ${h.num(westBaum.selbst)} kWh im eigenen Haushalt. Das sind ${h.eur(westBaum.ersparnisJahr)} weniger auf der Stromrechnung und ${h.num(westBaum.amortisationJahre ?? 0, 1)} Jahre bis zur Amortisation. Ohne den Baum wären es ${h.eur(west.ersparnisJahr)}, an einem freien Südbalkon ${h.eur(sued.ersparnisJahr)}. Für die Zustimmung des Vermieters gilt der Anspruch aus ${h.src('bgb_554', '§ 554 BGB')}; was Mieter dabei beachten, steht im Ratgeber ${h.a('balkonkraftwerk-mieter', 'Balkonkraftwerk für Mieter')}, den Monatsverlauf zeigt die Seite ${h.a('balkonkraftwerk-ertrag', 'Ertrag')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-hanover',
    nav: 'Hanover',
    card: `${EN.num(C.ey)} kWh per kWp and plenty of trees outside the windows: what a plug-in system really yields in Hanover.`,
    title: `Plug-in Solar Hanover 2026: Yield, Shade and Saving`,
    description: `Plug-in Solar Hanover 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, what trees and buildings cost you and what a couple saves a year.`,
    h1: 'Plug-in solar in Hanover: yield and saving in 2026',
    intro: `A west-facing balcony with ${EN.num(WP)} Wp yields about ${EN.num(west.ertrag)} kWh a year in Hanover; if a tree in front takes a tenth of the light, ${EN.num(westBaum.ertrag)} kWh and a saving of ${EN.eur(westBaum.ersparnisJahr)} remain.`,
    resume: `Hanover (Hannover) lies in the North German Plain and in the bottom third of the big cities for solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of ${ALL.length} and ${EN.pct(abstandBund)} below the population-weighted national average of ${EN.num(EY_BUND)} kWh. The year is strongly summer-weighted: April to August deliver ${EN.pct(sommer, 1)} of the yield, November to February only ${EN.pct(winter, 1)}. A plug-in system (Balkonkraftwerk) of ${EN.num(WP)} Wp hanging upright facing south produces about ${EN.num(sued.ertrag)} kWh, facing west ${EN.num(west.ertrag)} kWh, facing east ${EN.num(ost.ertrag)} kWh. In this green city, shade often matters more than direction: if a street tree takes a tenth of the light from a west balcony, the yield drops to ${EN.num(westBaum.ertrag)} kWh. A couple using ${EN.num(VERBRAUCH)} kWh then saves ${EN.eur(westBaum.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh and recovers ${EN.eur(KOSTEN)} in ${EN.num(westBaum.amortisationJahre ?? 0, 1)} years. The Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices, ${EN.num(dichte, 1)} per 1,000 residents.`,
    faqs: [
      { q: 'How much yield does a tree in front of a Hanover balcony cost?', a: `For ${EN.num(WP)} Wp on a west balcony, a tenth of shading cuts the annual yield from ${EN.num(west.ertrag)} to ${EN.num(westBaum.ertrag)} kWh, a quarter to ${EN.num(westReihe[2].ertrag)} kWh. The saving falls less, from ${EN.eur(west.ersparnisJahr)} to ${EN.eur(westBaum.ersparnisJahr)} or ${EN.eur(westReihe[2].ersparnisJahr)}, because the household uses nearly all of the remaining power itself. Deciduous trees shade mainly in summer.` },
      { q: 'Is Hanover too far north for balcony solar?', a: `No. At ${EN.num(C.ey)} kWh per kWp, Hanover is ${EN.pct(abstandBund)} below the national average, which costs a ${EN.num(WP)} Wp device only a few euros a year. On a south balcony, a couple using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(sued.ersparnisJahr)}, and the ${EN.eur(KOSTEN)} device pays for itself in ${EN.num(sued.amortisationJahre ?? 0, 1)} years. A small plug-in device only covers base load anyway, and that is reached in the north too.` },
      { q: 'How many balcony solar devices are registered in Hanover?', a: `The Market Master Data Register counted ${EN.num(C.balkon)} plug-in devices in operation in the city of Hanover, ${EN.num(dichte, 1)} per 1,000 residents, rank ${rangDichte} of ${ALL.length} big cities. The national average is ${EN.num(dichteBund, 1)}. Alongside them are ${EN.num(C.gebaeude)} solar systems on buildings in the register. The figures cover the city itself, not the wider Hanover Region with its surrounding municipalities.` },
    ],
    body: (h) => `
<h2>Hanover next to the national average</h2>
${h.table(['Measure', 'Hanover', 'Germany or rank'], [
  ['PVGIS yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `Germany ${h.num(EY_BUND)} kWh, rank ${rangEy} of ${h.num(ALL.length)}`],
  ['Share April to August', h.pct(sommer, 1), `rank ${rangSommer} of ${h.num(ALL.length)}`],
  ['Share November to February', h.pct(winter, 1), 'PVGIS monthly values'],
  ['Plug-in devices per 1,000 residents', h.num(dichte, 1), `Germany ${h.num(dichteBund, 1)}`],
  ['Roof systems south / east-west', `${h.pct(anteilS, 0)} / ${h.pct(anteilOW, 0)}`, `east-west: rank ${rangOW}`],
  ['Roof systems south-east or south-west', h.pct(schraeg, 0), `Germany ${h.pct(schraegBund, 0)}`],
], `PVGIS for postcode ${C.plz}, national value weighted by population; ${h.src('mastr_einheiten', 'Market Master Data Register')} of ${h.date(ST.source.mastr_retrieved_at)}; population: ${h.src('destatis_gv', 'Destatis')}.`, ['l', 'r', 'l'])}

<h2>A year that is made in summer</h2>
<p>Between the Deister hills and the Lüneburg Heath there is no ridge to hide the sun; the PVGIS grid point sits at ${h.num(C.elev)} m. What costs Hanover yield is the northern winter: short days and many overcast weeks. From April to August, ${h.pct(sommer, 1)} of the annual yield arrives, rank ${rangSommer} among the cities compared. During that time a ${h.num(WP)} Wp device often produces more at midday than a household needs, and the surplus goes to the grid unpaid.</p>
<p>That gives a simple rule: building bigger brings less in Hanover than elsewhere, because the extra lands mostly in months when there is already enough. Two panels on a balcony match a flat's base load; if you want more, first check that you will actually use the power. The page on ${h.a('balkonkraftwerk-800-watt', '800-watt balcony systems')} shows where the inverter limit lies.</p>

<h2>Street trees, city forest, back courtyard: counting shade</h2>
<p>Hanover is a green city, with the Eilenriede as a large urban forest, old tree-lined streets in the List and Südstadt districts and many planted courtyards. That is a gain for quality of life and a deduction for a balcony system. How much depends on which part of the daylight is missing. For ${h.num(WP)} Wp on a west balcony and ${h.num(VERBRAUCH)} kWh consumption, the engine calculates:</p>
${h.table(['Shading', 'Yield per year', 'used at home', 'Saving'], SCHATTEN.map((s, i) => [h.pct(s, 0), `${h.num(westReihe[i].ertrag)} kWh`, `${h.num(westReihe[i].selbst)} kWh`, h.eur(westReihe[i].ersparnisJahr)]), `West balcony, upright panels, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>The saving falls more slowly than the yield. A shaded balcony mainly loses the midday peaks, part of which would have gone to the grid anyway. Deciduous trees take more light in summer than in winter, when the sun is low regardless. Estimate the shade on a sunny day between midday and early evening and enter it in the calculator above.</p>

<h2>South or east-west, little in between</h2>
<p>The city's ${h.num(C.gebaeude)} roof systems show a clear pattern: ${h.pct(anteilS, 0)} face mainly south, ${h.pct(anteilOW, 0)} are east-west systems, rank ${rangOW} among the big cities. Diagonal positions facing south-east or south-west make up only ${h.pct(schraeg, 0)}, against ${h.pct(schraegBund, 0)} nationally. Flat roofs, where panels are set up low on both sides, are one possible explanation; the register itself gives no reasons. Hanover has ${h.num(speicherQuote, 2)} registered batteries per building system. On a balcony the east-west idea rarely works, because a flat usually has only one side. How east-west pays on a roof is explained on ${h.a('photovoltaik-ost-west', 'east-west solar')}.</p>

<h2>Working it through for a couple in the List</h2>
<p>Two people, ${h.num(VERBRAUCH)} kWh a year, second floor, a west balcony above a street lined with lime trees. The tree in front takes an estimated tenth of the light. The ${h.num(WP)} Wp device costs ${h.eur(KOSTEN)} and delivers ${h.num(westBaum.ertrag)} kWh, of which ${h.num(westBaum.selbst)} kWh are used in the home. That is ${h.eur(westBaum.ersparnisJahr)} off the electricity bill and ${h.num(westBaum.amortisationJahre ?? 0, 1)} years to break even. Without the tree it would be ${h.eur(west.ersparnisJahr)}, on an open south balcony ${h.eur(sued.ersparnisJahr)}. Your landlord's consent is covered by the right under ${h.src('bgb_554', 'section 554 Civil Code')}; what tenants should watch is in the guide ${h.a('balkonkraftwerk-mieter', 'balcony solar for tenants')}, and the monthly pattern is on the ${h.a('balkonkraftwerk-ertrag', 'yield')} page.</p>`,
  },
});

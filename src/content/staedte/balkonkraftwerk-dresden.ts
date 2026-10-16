import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, P, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Dresden: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.dresden;
const H = STAEDTE.hamburg;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: Einpersonenhaushalt im Altbau der Äußeren Neustadt, Südostbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 1500, KOSTEN = 450;
const calc = (az: number, verbrauch = VERBRAUCH) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: 90, azimut: az, verschattung: 0, speicherKwh: 0, verbrauchKwh: verbrauch, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const suedost = calc(-45), sued = calc(0), suedwest = calc(45);
const suedPaar = calc(0, 2500);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C), winterH = winterAnteil(H);
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const monat = (ertrag: number, i: number) => ertrag * C.em[i] / summe(C);
const dez = monat(sued.ertrag, 11), jan = monat(sued.ertrag, 0);
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => y.balkon / y.ew - x.balkon / x.ew).findIndex((x) => x.name === C.name) + 1;
const jeDach = C.balkon / C.gebaeude;
const rangJeDach = [...ALL].sort((x, y) => y.balkon / y.gebaeude - x.balkon / x.gebaeude).findIndex((x) => x.name === C.name) + 1;
const vollQuote = (c: { voll: number; gebaeude: number }) => c.voll / c.gebaeude;
const rangVoll = [...ALL].sort((x, y) => vollQuote(y) - vollQuote(x)).findIndex((x) => x.name === C.name) + 1;
const ausrSumme = Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const schraeg = (C.ausrichtung.SO + C.ausrichtung.SW) / ausrSumme;
const anteilS = C.ausrichtung.S / ausrSumme;

export default defineGuide({
  id: 'balkonkraftwerk-dresden',
  group: 'stadt',
  order: 108,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ertrag', 'volleinspeisung-teileinspeisung', 'balkonkraftwerk-leipzig', 'balkonkraftwerk-anmelden'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'mastrv_5', 'eeg_8'],
  de: {
    slug: 'balkonkraftwerk-dresden',
    nav: 'Dresden',
    card: `${DE.num(dichte, 1)} Geräte je 1 000 Einwohner, Platz ${rangDichte} der Großstädte: was ein Balkonkraftwerk an der Elbe bringt.`,
    title: `Balkonkraftwerk Dresden 2026: Ertrag, Winter, Ersparnis`,
    description: `Balkonkraftwerk Dresden 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, Ertrag im Winterhalbjahr, Südost- und Südwestbalkon im Vergleich.`,
    h1: 'Balkonkraftwerk in Dresden: Ertrag und Ersparnis 2026',
    intro: `Am Südostbalkon erzeugen ${DE.num(WP)} Wp in Dresden rund ${DE.num(suedost.ertrag)} kWh im Jahr; ein Einpersonenhaushalt mit ${DE.num(VERBRAUCH)} kWh spart damit ${DE.eur(suedost.ersparnisJahr)}.`,
    resume: `Dresden gehört zu den Großstädten, in denen Balkonkraftwerke am weitesten verbreitet sind: Das Marktstammdatenregister führt ${DE.num(C.balkon)} Steckersolargeräte in Betrieb, ${DE.num(dichte, 1)} je 1 000 Einwohner und damit Platz ${rangDichte} unter ${ALL.length} verglichenen Städten, wenn auch unter dem Bundesschnitt von ${DE.num(dichteBund, 1)}. Auf jede Solaranlage auf einem Dresdner Gebäude kommen ${DE.num(jeDach, 2)} Steckergeräte. PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy}. Bemerkenswert ist das Winterhalbjahr: November bis Februar bringen ${DE.pct(winter, 1)} des Jahresertrags, mehr als in fast allen anderen Städten des Vergleichs. Ein Gerät mit ${DE.num(WP)} Wp senkrecht nach Südosten liefert rund ${DE.num(suedost.ertrag)} kWh, nach Süden ${DE.num(sued.ertrag)} kWh, nach Südwesten ${DE.num(suedwest.ertrag)} kWh. Ein Single mit ${DE.num(VERBRAUCH)} kWh Verbrauch nutzt am Südostbalkon ${DE.pct(suedost.eigenAnteil)} davon selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(suedost.ersparnisJahr)} im Jahr, sodass sich ${DE.eur(KOSTEN)} Anschaffung nach ${DE.num(suedost.amortisationJahre ?? 0, 1)} Jahren bezahlt machen.`,
    faqs: [
      { q: 'Was liefert ein Balkonkraftwerk in Dresden im Dezember und Januar?', a: `Mit ${DE.num(WP)} Wp senkrecht nach Süden rund ${DE.num(dez, 1)} kWh im Dezember und ${DE.num(jan, 1)} kWh im Januar, gerechnet aus den PVGIS-Monatswerten für die Postleitzahl ${C.plz}. Das ist wenig, aber in Dresden entfällt mit ${DE.pct(winter, 1)} ein größerer Teil des Jahres auf November bis Februar als etwa in Hamburg mit ${DE.pct(winterH, 1)}. Schnee auf senkrechten Modulen bleibt selten liegen.` },
      { q: 'Warum gibt es in Dresden so viele Balkonkraftwerke?', a: `Eine amtliche Erklärung gibt es nicht, die Zahlen zeigen nur das Ergebnis: ${DE.num(dichte, 1)} Geräte je 1 000 Einwohner, Platz ${rangDichte} der ${ALL.length} Großstädte, und ${DE.num(jeDach, 2)} Steckergeräte je Dachanlage, Platz ${rangJeDach}. Plausibel ist die Wohnstruktur: Viele Dresdner leben in Mehrfamilienhäusern mit Balkon, aber ohne eigenes Dach. Für sie ist das Steckergerät die einzige Solaranlage, die sie selbst aufstellen können.` },
      { q: 'Muss ich mein Balkonkraftwerk in Dresden beim Stromnetzbetreiber anmelden?', a: `Nein. Für Steckersolargeräte verlangt das EEG keine Meldung beim Netzbetreiber, auch nicht in Dresden. Pflicht ist allein die Registrierung im Marktstammdatenregister innerhalb von ${P.mastr.frist_monate === 1 ? 'einem Monat' : `${P.mastr.frist_monate} Monaten`} nach der Inbetriebnahme (§ 5 MaStRV). Das Register leitet die Daten an den Netzbetreiber weiter, der bei Bedarf den Zähler tauscht. Die Registrierung ist kostenlos; halten Sie Datenblatt und Inbetriebnahmedatum bereit.` },
    ],
    body: (h) => `
<h2>Dresden zwischen Elbtal und Register</h2>
${h.table(['Wert', 'Dresden', 'Einordnung'], [
  ['PVGIS-Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `Platz ${rangEy} von ${h.num(ALL.length)}`],
  ['Anteil November bis Februar', h.pct(winter, 1), `Platz ${rangWinter} von ${h.num(ALL.length)}`],
  ['Steckersolargeräte je 1 000 Einwohner', h.num(dichte, 1), `Platz ${rangDichte}, Bund ${h.num(dichteBund, 1)}`],
  ['Steckergeräte je Gebäudeanlage', h.num(jeDach, 2), `Platz ${rangJeDach}`],
  ['Gebäudeanlagen in Volleinspeisung', h.pct(vollQuote(C), 0), `Platz ${rangVoll}, Bund ${h.pct(vollQuote(B), 0)}`],
  ['Dachanlagen nach Südost oder Südwest', h.pct(schraeg, 0), `nach Süden ${h.pct(anteilS, 0)}`],
], `${h.src('pvgis', 'PVGIS')} für die PLZ ${C.plz}; ${h.src('mastr_einheiten', 'Marktstammdatenregister')}, Stand ${h.date(ST.source.mastr_retrieved_at)}; Einwohner: Destatis.`, ['l', 'r', 'l'])}

<h2>Wenn die Tage kurz werden</h2>
<p>Im Sommer unterscheiden sich die Großstädte kaum, im Winter sehr wohl. Dresden holt aus den vier dunklen Monaten ${h.pct(winter, 1)} seines Jahresertrags und steht damit auf Platz ${rangWinter} im Vergleich, deutlich vor Hamburg mit ${h.pct(winterH, 1)}. Ein Gerät mit ${h.num(WP)} Wp senkrecht nach Süden kommt im Dezember auf ${h.num(dez, 1)} kWh, im Januar auf ${h.num(jan, 1)} kWh. Das deckt bei einem Single etwa den Strom für Kühlschrank und Router an sonnigen Tagen, mehr nicht.</p>
<p>Für die Entscheidung heißt das: Rechnen Sie die Ersparnis mit dem Jahreswert, nicht mit einem schönen Junitag. Senkrecht hängende Module haben im Winter einen Vorteil, weil die tiefe Sonne sie fast im rechten Winkel trifft; flach aufgeständerte holen im Sommer mehr, im Dezember kaum. Der Ratgeber zum ${h.a('balkonkraftwerk-ertrag', 'Ertrag eines Balkonkraftwerks')} zeigt den Monatsverlauf für jede Postleitzahl.</p>

<h2>Talkessel, Hänge und Rasterpunkt</h2>
<p>Die Altstadt liegt im Elbtal, die Stadt steigt zu beiden Seiten an, im Norden zur Dresdner Heide, im Süden zu den Hochflächen Richtung Erzgebirge. Der PVGIS-Rasterpunkt, aus dem der Ertrag für ${C.plz} stammt, liegt auf ${h.num(C.elev)} m und damit höher als das Elbufer. Den Geländehorizont berechnet PVGIS aus einem Höhenmodell; einzelne Häuserzeilen und Bäume kennt es nicht. Wer unten am Fluss zwischen hohen Gründerzeitfassaden wohnt, verliert eher etwas Sonne als jemand am Südhang des rechten Elbufers, wo seit Jahrhunderten Wein wächst.</p>
<p>Schatten von Nachbarhäusern tragen Sie im Rechner oben als Verschattung ein. Schon ein Fünftel Verschattung senkt den Jahresertrag spürbar, die Ersparnis aber weniger stark, weil der Haushalt die verbleibenden Kilowattstunden fast vollständig selbst nutzt.</p>

<h2>Südost oder Südwest am Elbbalkon</h2>
<p>Im Register zeigen ${h.pct(schraeg, 0)} der Dresdner Dachanlagen nach Südost oder Südwest, mehr als in den meisten anderen Großstädten; rein nach Süden sind es ${h.pct(anteilS, 0)}. Am Balkon ist die Richtung durch das Haus vorgegeben. Mit ${h.num(WP)} Wp senkrecht ergibt sich:</p>
${h.table(['Balkon', 'Ertrag im Jahr', 'selbst genutzt', 'Ersparnis'], [
  ['Südost', `${h.num(suedost.ertrag)} kWh`, h.pct(suedost.eigenAnteil, 0), h.eur(suedost.ersparnisJahr)],
  ['Süd', `${h.num(sued.ertrag)} kWh`, h.pct(sued.eigenAnteil, 0), h.eur(sued.ersparnisJahr)],
  ['Südwest', `${h.num(suedwest.ertrag)} kWh`, h.pct(suedwest.eigenAnteil, 0), h.eur(suedwest.ersparnisJahr)],
], `Einpersonenhaushalt, ${h.num(VERBRAUCH)} kWh im Jahr, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>Der Südostbalkon liefert vormittags, der Südwestbalkon nachmittags. Wer im Homeoffice arbeitet, nutzt beides; wer erst abends nach Hause kommt, profitiert vom späteren Strom etwas mehr.</p>

<h2>Was die vielen Volleinspeiser bedeuten</h2>
<p>${h.pct(vollQuote(C), 0)} der Dresdner Gebäudeanlagen speisen ihren gesamten Strom ins Netz, Platz ${rangVoll} der Großstädte. Für Balkonkraftwerke spielt das keine Rolle: Steckersolargeräte sind auf Eigenverbrauch ausgelegt, ihr Überschuss fließt ohne Vergütung ins Netz. Wer dagegen über eine Dachanlage nachdenkt, findet die Abwägung auf der Seite ${h.a('volleinspeisung-teileinspeisung', 'Volleinspeisung oder Teileinspeisung')}.</p>

<h2>Ein Single in der Äußeren Neustadt</h2>
<p>Altbau, dritter Stock, Balkon zum Hof nach Südosten, ${h.num(VERBRAUCH)} kWh Verbrauch im Jahr. Das Gerät für ${h.eur(KOSTEN)} erzeugt ${h.num(suedost.ertrag)} kWh, ${h.num(suedost.selbst)} kWh davon ersetzen Netzstrom. Das ergibt ${h.eur(suedost.ersparnisJahr)} im Jahr und ${h.num(suedost.amortisationJahre ?? 0, 1)} Jahre bis zur Amortisation. Zieht später eine zweite Person ein und steigt der Verbrauch auf ${h.num(2500)} kWh, brächte ein Südbalkon ${h.eur(suedPaar.ersparnisJahr)}. Vor dem Anbringen steht die Zustimmung des Vermieters, danach der Eintrag ins Register nach ${h.src('mastrv_5', '§ 5 MaStRV')}; die Grenzen für Steckersolargeräte stehen in ${h.src('eeg_8', '§ 8 EEG')}. Schritt für Schritt erklärt das die Seite ${h.a('balkonkraftwerk-anmelden', 'Balkonkraftwerk anmelden')}, den Vergleich mit der Nachbarstadt zeigt ${h.a('balkonkraftwerk-leipzig', 'Balkonkraftwerk Leipzig')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-dresden',
    nav: 'Dresden',
    card: `${EN.num(dichte, 1)} devices per 1,000 residents, rank ${rangDichte} of the big cities: what balcony solar yields on the Elbe.`,
    title: `Plug-in Solar Dresden 2026: Yield, Winter Output, Saving`,
    description: `Plug-in Solar Dresden 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, the winter output, and south-east versus south-west balconies.`,
    h1: 'Plug-in solar in Dresden: yield and saving in 2026',
    intro: `On a south-east balcony, ${EN.num(WP)} Wp produce about ${EN.num(suedost.ertrag)} kWh a year in Dresden; a single-person household using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(suedost.ersparnisJahr)}.`,
    resume: `Dresden is one of the big cities where plug-in solar (Balkonkraftwerk) is most widespread: the Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices in operation, ${EN.num(dichte, 1)} per 1,000 residents, rank ${rangDichte} among the ${ALL.length} cities compared, though below the national ${EN.num(dichteBund, 1)}. For every solar system on a Dresden building there are ${EN.num(jeDach, 2)} plug-in devices. PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy}. The winter half stands out: November to February bring ${EN.pct(winter, 1)} of the annual yield, more than in almost every other city compared. A ${EN.num(WP)} Wp device hanging upright facing south-east produces about ${EN.num(suedost.ertrag)} kWh, facing south ${EN.num(sued.ertrag)} kWh, facing south-west ${EN.num(suedwest.ertrag)} kWh. A single person using ${EN.num(VERBRAUCH)} kWh consumes ${EN.pct(suedost.eigenAnteil)} of the south-east output and saves ${EN.eur(suedost.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh, so ${EN.eur(KOSTEN)} of purchase cost is recovered after ${EN.num(suedost.amortisationJahre ?? 0, 1)} years.`,
    faqs: [
      { q: 'What does balcony solar produce in Dresden in December and January?', a: `With ${EN.num(WP)} Wp upright facing south, about ${EN.num(dez, 1)} kWh in December and ${EN.num(jan, 1)} kWh in January, calculated from the PVGIS monthly values for postcode ${C.plz}. That is little, but in Dresden a larger part of the year, ${EN.pct(winter, 1)}, falls between November and February than in Hamburg, for example, at ${EN.pct(winterH, 1)}. Snow rarely settles on upright panels.` },
      { q: 'Why are there so many plug-in solar devices in Dresden?', a: `There is no official explanation; the figures only show the result: ${EN.num(dichte, 1)} devices per 1,000 residents, rank ${rangDichte} of ${ALL.length} big cities, and ${EN.num(jeDach, 2)} plug-in devices per roof system, rank ${rangJeDach}. Housing is a plausible reason: many people in Dresden live in apartment blocks with a balcony but no roof of their own. For them, a plug-in device is the only solar system they can install themselves.` },
      { q: 'Do I have to notify the Dresden grid operator about my balcony solar?', a: `No. The Renewable Energy Sources Act (EEG) requires no notification to the grid operator for plug-in devices, in Dresden or elsewhere. The only duty is registration in the Market Master Data Register within ${P.mastr.frist_monate === 1 ? 'one month' : `${P.mastr.frist_monate} months`} of commissioning (section 5 MaStRV). The register passes the data to the grid operator, which replaces the meter if needed. Registration is free; have the data sheet and the commissioning date to hand.` },
    ],
    body: (h) => `
<h2>Dresden between the Elbe valley and the register</h2>
${h.table(['Value', 'Dresden', 'Context'], [
  ['PVGIS yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `rank ${rangEy} of ${h.num(ALL.length)}`],
  ['Share November to February', h.pct(winter, 1), `rank ${rangWinter} of ${h.num(ALL.length)}`],
  ['Plug-in devices per 1,000 residents', h.num(dichte, 1), `rank ${rangDichte}, Germany ${h.num(dichteBund, 1)}`],
  ['Plug-in devices per building system', h.num(jeDach, 2), `rank ${rangJeDach}`],
  ['Building systems on full feed-in', h.pct(vollQuote(C), 0), `rank ${rangVoll}, Germany ${h.pct(vollQuote(B), 0)}`],
  ['Roof systems facing south-east or south-west', h.pct(schraeg, 0), `facing south ${h.pct(anteilS, 0)}`],
], `${h.src('pvgis', 'PVGIS')} for postcode ${C.plz}; ${h.src('mastr_einheiten', 'Market Master Data Register')}, as of ${h.date(ST.source.mastr_retrieved_at)}; population: Destatis.`, ['l', 'r', 'l'])}

<h2>When the days get short</h2>
<p>In summer the big cities barely differ; in winter they do. Dresden gets ${h.pct(winter, 1)} of its annual yield from the four dark months, rank ${rangWinter} in the comparison and well ahead of Hamburg at ${h.pct(winterH, 1)}. A ${h.num(WP)} Wp device hanging upright facing south reaches ${h.num(dez, 1)} kWh in December and ${h.num(jan, 1)} kWh in January. On sunny days that covers roughly the fridge and router of a single person, no more.</p>
<p>For your decision, this means: work out the saving from the annual figure, not from a fine day in June. Upright panels have an edge in winter because the low sun hits them almost at a right angle; panels tilted flat gain more in summer and hardly anything in December. The guide to the ${h.a('balkonkraftwerk-ertrag', 'yield of a balcony system')} shows the monthly pattern for any postcode.</p>

<h2>Valley basin, slopes and grid point</h2>
<p>The old town lies in the Elbe valley, and the city rises on both sides, to the Dresden Heath in the north and to the uplands towards the Ore Mountains in the south. The PVGIS grid point behind the yield for ${C.plz} sits at ${h.num(C.elev)} m, higher than the riverbank. PVGIS calculates the terrain horizon from an elevation model; it does not know individual rows of houses or trees. If you live down by the river between tall 19th-century facades, you are more likely to lose some sun than someone on the south-facing slope of the right bank, where vines have grown for centuries.</p>
<p>Enter shade from neighbouring buildings as shading in the calculator above. Even a fifth of shading noticeably lowers the annual yield, but the saving less so, because the household uses almost all of the remaining kilowatt hours itself.</p>

<h2>South-east or south-west on an Elbe balcony</h2>
<p>In the register, ${h.pct(schraeg, 0)} of Dresden's roof systems face south-east or south-west, more than in most other big cities; due south accounts for ${h.pct(anteilS, 0)}. On a balcony, the building sets the direction. With ${h.num(WP)} Wp hanging upright the result is:</p>
${h.table(['Balcony', 'Yield per year', 'used at home', 'Saving'], [
  ['South-east', `${h.num(suedost.ertrag)} kWh`, h.pct(suedost.eigenAnteil, 0), h.eur(suedost.ersparnisJahr)],
  ['South', `${h.num(sued.ertrag)} kWh`, h.pct(sued.eigenAnteil, 0), h.eur(sued.ersparnisJahr)],
  ['South-west', `${h.num(suedwest.ertrag)} kWh`, h.pct(suedwest.eigenAnteil, 0), h.eur(suedwest.ersparnisJahr)],
], `Single-person household, ${h.num(VERBRAUCH)} kWh a year, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>A south-east balcony delivers in the morning, a south-west one in the afternoon. If you work from home you use both; if you only get home in the evening, the later power helps you a little more.</p>

<h2>What all the full feed-in systems mean</h2>
<p>${h.pct(vollQuote(C), 0)} of Dresden's building systems feed all their power into the grid, rank ${rangVoll} among the big cities. For balcony systems this does not matter: plug-in devices are designed for self-consumption, and their surplus flows to the grid unpaid. If you are considering a rooftop system instead, the trade-off is set out on ${h.a('volleinspeisung-teileinspeisung', 'full or partial feed-in')}.</p>

<h2>A single person in the Äußere Neustadt</h2>
<p>A period building, third floor, balcony on the courtyard side facing south-east, ${h.num(VERBRAUCH)} kWh consumption a year. The ${h.eur(KOSTEN)} device produces ${h.num(suedost.ertrag)} kWh, of which ${h.num(suedost.selbst)} kWh replace grid power. That gives ${h.eur(suedost.ersparnisJahr)} a year and ${h.num(suedost.amortisationJahre ?? 0, 1)} years to break even. If a second person moves in later and consumption rises to ${h.num(2500)} kWh, a south balcony would bring ${h.eur(suedPaar.ersparnisJahr)}. Before mounting comes the landlord's consent, afterwards the register entry under ${h.src('mastrv_5', 'section 5 MaStRV')}; the limits for plug-in devices are in ${h.src('eeg_8', 'section 8 EEG')}. The page on ${h.a('balkonkraftwerk-anmelden', 'registering a balcony system')} explains each step, and ${h.a('balkonkraftwerk-leipzig', 'plug-in solar Leipzig')} shows the neighbouring city.</p>`,
  },
});

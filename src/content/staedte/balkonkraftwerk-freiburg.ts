import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Freiburg im Breisgau: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.freiburg;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: Studentin in der Wiehre, Ostbalkon, kleiner Verbrauch. */
const WP = 900, VA = 800, VERBRAUCH = 1200, KOSTEN = 450;
const calc = (az: number, verbrauch = VERBRAUCH, schatten = 0) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: 90, azimut: az, verschattung: schatten, speicherKwh: 0, verbrauchKwh: verbrauch, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const ost = calc(-90), west = calc(90), sued = calc(0);
const HANG = 0.15;
const ostHang = calc(-90, VERBRAUCH, HANG);
const suedFamilie = calc(0, 3500);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C);
const sortEy = [...ALL].sort((x, y) => y.ey - x.ey);
const rangEy = sortEy.findIndex((x) => x.name === C.name) + 1;
const davor = sortEy.slice(0, rangEy - 1);
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const dezJun = (c: City) => c.em[11] / c.em[5];
const monat = (ertrag: number, i: number) => ertrag * C.em[i] / summe(C);
const dichte = (c: { balkon: number; ew: number }) => (c.balkon / c.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => dichte(y) - dichte(x)).findIndex((x) => x.name === C.name) + 1;
const vollQuote = (c: { voll: number; gebaeude: number }) => c.voll / c.gebaeude;
const rangVoll = [...ALL].sort((x, y) => vollQuote(y) - vollQuote(x)).findIndex((x) => x.name === C.name) + 1;
const speicherQuote = (c: { speicher: number; gebaeude: number }) => c.speicher / c.gebaeude;
const rangSpeicher = [...ALL].sort((x, y) => speicherQuote(y) - speicherQuote(x)).findIndex((x) => x.name === C.name) + 1;
const anteilS = C.ausrichtung.S / Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const kleinste = [...ALL].sort((x, y) => x.ew - y.ew)[0].name === C.name;

export default defineGuide({
  id: 'balkonkraftwerk-freiburg',
  group: 'stadt',
  order: 111,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-lohnt-sich', 'volleinspeisung-teileinspeisung', 'balkonkraftwerk-muenchen', 'balkonkraftwerk-zaehler'],
  sources: ['pvgis', 'pvgis_doku', 'mastr_einheiten', 'destatis_gv', 'eeg_10a'],
  de: {
    slug: 'balkonkraftwerk-freiburg',
    nav: 'Freiburg',
    card: `${DE.num(C.ey)} kWh je kWp und die höchste Gerätedichte der Großstädte: was ein Balkonkraftwerk in Freiburg bringt.`,
    title: `Balkonkraftwerk Freiburg 2026: Sonne, Ertrag und Ersparnis`,
    description: `Balkonkraftwerk Freiburg 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, was der Schwarzwald am Morgen kostet und was Ihr Balkon im Jahr spart.`,
    h1: 'Balkonkraftwerk in Freiburg: Ertrag und Ersparnis 2026',
    intro: `Selbst am Ostbalkon, mit dem Schwarzwald im Blick, erzeugen ${DE.num(WP)} Wp in Freiburg rund ${DE.num(ost.ertrag)} kWh im Jahr; ein kleiner Haushalt mit ${DE.num(VERBRAUCH)} kWh spart damit ${DE.eur(ost.ersparnisJahr)}.`,
    resume: `Freiburg gilt als Sonnenstadt, und die Daten bestätigen das zum Teil: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} Großstädten, hinter ${davor.map((x) => x.name).join(' und ')}. Der Wert enthält bereits den Geländehorizont, den PVGIS aus einem Höhenmodell berechnet, also auch die Schwarzwaldhöhen im Osten der Stadt. Stark ist Freiburg im Winter: November bis Februar liefern ${DE.pct(winter, 1)} des Jahresertrags, Platz ${rangWinter} im Vergleich. Ein Balkonkraftwerk mit ${DE.num(WP)} Wp senkrecht nach Süden erzeugt rund ${DE.num(sued.ertrag)} kWh, nach Osten ${DE.num(ost.ertrag)} kWh, nach Westen ${DE.num(west.ertrag)} kWh. Ein Einpersonenhaushalt mit ${DE.num(VERBRAUCH)} kWh Verbrauch nutzt am Ostbalkon ${DE.pct(ost.eigenAnteil)} davon selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(ost.ersparnisJahr)} im Jahr. Mit ${DE.num(C.balkon)} Steckersolargeräten im Marktstammdatenregister, ${DE.num(dichte(C), 1)} je 1 000 Einwohner, hat Freiburg die höchste Dichte der verglichenen Großstädte; der Bundesschnitt von ${DE.num(dichteBund, 1)} liegt dennoch darüber.`,
    faqs: [
      { q: 'Ist Freiburg die sonnigste Stadt für ein Balkonkraftwerk?', a: `Unter den ${ALL.length} hier verglichenen Großstädten nicht ganz: Beim PVGIS-Jahresertrag liegt Freiburg mit ${DE.num(C.ey)} kWh je kWp auf Platz ${rangEy}, hinter ${davor.map((x) => `${x.name} (${DE.num(x.ey)} kWh)`).join(' und ')}. Die Unterschiede sind klein. Im Winterhalbjahr steht Freiburg mit ${DE.pct(winter, 1)} des Jahresertrags auf Platz ${rangWinter}. Für einen Balkon zählen Ausrichtung und Schatten am Haus mehr als dieser Abstand.` },
      { q: 'Verliert ein Ostbalkon in Freiburg durch den Schwarzwald Ertrag?', a: `Im Stadtgebiet kaum messbar. Der PVGIS-Wert für ${C.plz} berücksichtigt den Geländehorizont bereits, und ein senkrechter Ostbalkon kommt mit ${DE.num(WP)} Wp auf ${DE.num(ost.ertrag)} kWh im Jahr, ein Westbalkon auf ${DE.num(west.ertrag)} kWh. Wer direkt am Hang wohnt, etwa am Rand von Littenweiler oder Günterstal, kann morgens länger im Schatten liegen. Rechnen Sie dann mit einem Abschlag, bei ${DE.pct(HANG)} wären es ${DE.num(ostHang.ertrag)} kWh.` },
      { q: 'Warum gibt es in Freiburg so viele Balkonkraftwerke je Einwohner?', a: `Das Register nennt keine Gründe, nur Zahlen: ${DE.num(C.balkon)} Geräte bei ${DE.num(C.ew)} Einwohnern, ${DE.num(dichte(C), 1)} je 1 000 und Platz ${rangDichte} der Großstädte. ${kleinste ? 'Freiburg ist zugleich die kleinste Stadt des Vergleichs; ' : ''}kleinere Städte mit mehr Eigentum und Randlagen liegen meist näher am Bundesschnitt von ${DE.num(dichteBund, 1)}. Auch die lange Solartradition der Stadt dürfte eine Rolle spielen, belegen lässt sie sich mit diesen Daten nicht.` },
      { q: 'Wie viel bringt ein Balkonkraftwerk in Freiburg im Dezember?', a: `Mit ${DE.num(WP)} Wp senkrecht nach Süden rund ${DE.num(monat(sued.ertrag, 11), 1)} kWh, im Juni ${DE.num(monat(sued.ertrag, 5))} kWh. Der Dezember erreicht in Freiburg ${DE.pct(dezJun(C))} des Juniwerts, in Hamburg nur ${DE.pct(dezJun(STAEDTE.hamburg))}. Das liegt vor allem an der südlichen Lage: Im Winter steht die Sonne über Freiburg höher als an der Elbe, und senkrechte Module fangen sie fast frontal ein. Grundlage sind die PVGIS-Monatswerte der Postleitzahl.` },
    ],
    body: (h) => `
<h2>Sonnenstadt im Datentest</h2>
${h.table(['Stadt', 'Ertrag je kWp, 35° Süd', 'Anteil Nov. bis Feb.', 'Dezember zu Juni'], [...sortEy.slice(0, Math.max(rangEy, 3)).map((x) => [x.name, `${h.num(x.ey)} kWh`, h.pct(winterAnteil(x), 1), h.pct(dezJun(x), 0)])], `${h.src('pvgis', 'PVGIS')} für die Innenstadt-Postleitzahl, Monatswerte desselben Rasterpunkts.`, ['l', 'r', 'r', 'r'])}
<p>Freiburgs Ruf als sonnigste Großstadt Deutschlands beruht meist auf Sonnenstunden. Für eine Solaranlage zählt die Einstrahlung auf die Modulfläche, und da liegen ${davor.map((x) => x.name).join(' und ')} knapp vorn. Der Abstand ist so klein, dass ihn ein einziger Baum vor dem Balkon mehr als ausgleicht. Wer aus Norddeutschland nach Freiburg zieht, gewinnt dagegen deutlich: Gegenüber Hamburg erzeugt jedes Kilowatt Peak hier ${h.pct(C.ey / STAEDTE.hamburg.ey - 1, 0)} mehr.</p>

<h2>Der Schwarzwald im Rücken</h2>
<p>Im Osten steigt das Gelände von der Rheinebene steil zum Schwarzwald an. PVGIS berechnet für jeden Standort einen Horizont aus dem Höhenmodell (${h.src('pvgis_doku', 'PVGIS-Dokumentation')}), und dieser Horizont steckt im Jahreswert von ${h.num(C.ey)} kWh bereits drin. Der Rasterpunkt für ${C.plz} liegt auf ${h.num(C.elev)} m. Für die Ausrichtung zeigt der Motor in Freiburg sogar einen Ostbalkon mit ${h.num(ost.ertrag)} kWh vor einem Westbalkon mit ${h.num(west.ertrag)} kWh; die Umrechnung stammt allerdings aus PVGIS-Abfragen für die ganze Großregion am Oberrhein, nicht für Ihre Straße.</p>
<p>Unten in der Stadt ist der Bergschatten am Morgen kurz. In den Tälern und an den Hängen am Stadtrand kann die Sonne deutlich später über den Kamm kommen. Wer dort wohnt, prüft an einem klaren Morgen, wann das Licht den Balkon erreicht, und trägt den Schatten im Rechner oben ein: Mit ${h.pct(HANG, 0)} Verschattung bleiben am Ostbalkon ${h.num(ostHang.ertrag)} kWh und ${h.eur(ostHang.ersparnisJahr)} Ersparnis.</p>

<h2>Die meisten Geräte je Einwohner, gemessen an Großstädten</h2>
<p>${h.num(dichte(C), 1)} Steckersolargeräte je 1 000 Einwohner sind der höchste Wert unter den ${h.num(ALL.length)} Städten dieser Seitenreihe. Dass Freiburg trotzdem unter dem Bundesschnitt von ${h.num(dichteBund, 1)} bleibt, sagt mehr über Großstädte als über Freiburg: Mietwohnungen, wenig eigene Fassade, viele Haushalte ohne Balkon. Die Zahlen stammen aus der öffentlichen ${h.src('mastr_einheiten', 'Einheitenübersicht des Marktstammdatenregisters')}, abgerufen am ${h.date(ST.source.mastr_retrieved_at)}, die Einwohnerzahl von ${h.src('destatis_gv', 'Destatis')}.</p>

<h2>Dächer im Register: Volleinspeisung statt Batterie</h2>
<p>Bei den ${h.num(C.gebaeude)} Gebäudeanlagen fällt Freiburg zweimal aus der Reihe. ${h.pct(vollQuote(C), 0)} speisen ihren gesamten Strom ins Netz ein, Platz ${rangVoll} der Großstädte und mehr als die ${h.pct(vollQuote(B), 0)} im Bund. Batteriespeicher gibt es dagegen nur ${h.num(speicherQuote(C), 2)} je Anlage, Platz ${rangSpeicher}. Ein Teil dürften ältere Anlagen sein, die gebaut wurden, als die Einspeisevergütung höher war als der Strompreis; ${h.pct(anteilS, 0)} zeigen hauptsächlich nach Süden. Für ein Balkonkraftwerk gilt diese Logik nicht: Es wird nicht vergütet, sein Wert liegt allein im selbst verbrauchten Strom. Den Unterschied der Modelle erklärt ${h.a('volleinspeisung-teileinspeisung', 'Volleinspeisung oder Teileinspeisung')}.</p>

<h2>Eine Studentin in der Wiehre</h2>
<p>Ein Zimmer mit kleinem Ostbalkon, ${h.num(VERBRAUCH)} kWh Verbrauch im Jahr, tagsüber oft in der Universität. Das Gerät mit ${h.num(WP)} Wp für ${h.eur(KOSTEN)} erzeugt ${h.num(ost.ertrag)} kWh, aber nur ${h.num(ost.selbst)} kWh davon ersetzen Netzstrom, weil der Verbrauch klein ist. Die Ersparnis von ${h.eur(ost.ersparnisJahr)} im Jahr bezahlt das Gerät nach ${h.num(ost.amortisationJahre ?? 0, 1)} Jahren. Eine Familie mit ${h.num(3500)} kWh am Südbalkon käme auf ${h.eur(suedFamilie.ersparnisJahr)}. Ein alter Zähler darf bis zu seinem Tausch weiterlaufen (${h.src('eeg_10a', '§ 10a EEG')}); mehr dazu auf der Seite ${h.a('balkonkraftwerk-zaehler', 'Zähler beim Balkonkraftwerk')}. Ob sich das Gerät bei kleinem Verbrauch rechnet, prüft ${h.a('balkonkraftwerk-lohnt-sich', 'Lohnt sich ein Balkonkraftwerk')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-freiburg',
    nav: 'Freiburg',
    card: `${EN.num(C.ey)} kWh per kWp and the highest device density of the big cities: what balcony solar brings in Freiburg.`,
    title: `Plug-in Solar Freiburg 2026: Sunshine, Yield and Saving`,
    description: `Plug-in Solar Freiburg 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, what the Black Forest costs in the morning, your yearly saving.`,
    h1: 'Plug-in solar in Freiburg: yield and saving in 2026',
    intro: `Even on an east-facing balcony looking towards the Black Forest, ${EN.num(WP)} Wp produce about ${EN.num(ost.ertrag)} kWh a year in Freiburg; a small household using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(ost.ersparnisJahr)}.`,
    resume: `Freiburg is known as a sunshine city, and the data partly bear that out: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of ${ALL.length} big cities, behind ${davor.map((x) => x.name).join(' and ')}. The figure already includes the terrain horizon that PVGIS calculates from an elevation model, so the Black Forest heights east of the city are accounted for. Freiburg is strong in winter: November to February deliver ${EN.pct(winter, 1)} of the annual yield, rank ${rangWinter} in the comparison. A plug-in system (Balkonkraftwerk) of ${EN.num(WP)} Wp hanging upright facing south produces about ${EN.num(sued.ertrag)} kWh, facing east ${EN.num(ost.ertrag)} kWh, facing west ${EN.num(west.ertrag)} kWh. A single-person household using ${EN.num(VERBRAUCH)} kWh consumes ${EN.pct(ost.eigenAnteil)} of the east-balcony output itself and saves ${EN.eur(ost.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. With ${EN.num(C.balkon)} plug-in devices in the Market Master Data Register, ${EN.num(dichte(C), 1)} per 1,000 residents, Freiburg has the highest density of the big cities compared; the national average of ${EN.num(dichteBund, 1)} is still higher.`,
    faqs: [
      { q: 'Is Freiburg the sunniest city for balcony solar?', a: `Not quite, among the ${ALL.length} big cities compared here: for PVGIS annual yield, Freiburg ranks ${rangEy} at ${EN.num(C.ey)} kWh per kWp, behind ${davor.map((x) => `${x.name} (${EN.num(x.ey)} kWh)`).join(' and ')}. The differences are small. In the winter half, Freiburg ranks ${rangWinter} with ${EN.pct(winter, 1)} of its annual yield. For a balcony, orientation and shade at the building matter more than that gap.` },
      { q: 'Does an east-facing balcony in Freiburg lose yield to the Black Forest?', a: `Hardly measurably within the city. The PVGIS value for ${C.plz} already accounts for the terrain horizon, and an upright east balcony with ${EN.num(WP)} Wp reaches ${EN.num(ost.ertrag)} kWh a year, a west balcony ${EN.num(west.ertrag)} kWh. If you live right on a slope, say on the edge of Littenweiler or Günterstal, you may stay in shade longer in the morning. Then allow a deduction; at ${EN.pct(HANG)} it would be ${EN.num(ostHang.ertrag)} kWh.` },
      { q: 'Why does Freiburg have so many balcony solar devices per resident?', a: `The register gives no reasons, only figures: ${EN.num(C.balkon)} devices for ${EN.num(C.ew)} residents, ${EN.num(dichte(C), 1)} per 1,000 and rank ${rangDichte} among the big cities. ${kleinste ? 'Freiburg is also the smallest city in the comparison; ' : ''}smaller towns with more home ownership and outskirts tend to sit closer to the national ${EN.num(dichteBund, 1)}. The city's long solar tradition may also play a part, but these data cannot prove it.` },
      { q: 'How much does balcony solar produce in Freiburg in December?', a: `With ${EN.num(WP)} Wp upright facing south, about ${EN.num(monat(sued.ertrag, 11), 1)} kWh, against ${EN.num(monat(sued.ertrag, 5))} kWh in June. December reaches ${EN.pct(dezJun(C))} of the June value in Freiburg, only ${EN.pct(dezJun(STAEDTE.hamburg))} in Hamburg. That is mainly down to the southern position: in winter the sun stands higher over Freiburg than over the Elbe, and upright panels catch it almost head-on. The basis is the PVGIS monthly data for the postcode.` },
    ],
    body: (h) => `
<h2>Sunshine city, put to the test</h2>
${h.table(['City', 'Yield per kWp, 35° south', 'Share Nov. to Feb.', 'December vs June'], [...sortEy.slice(0, Math.max(rangEy, 3)).map((x) => [x.name, `${h.num(x.ey)} kWh`, h.pct(winterAnteil(x), 1), h.pct(dezJun(x), 0)])], `${h.src('pvgis', 'PVGIS')} for the city-centre postcode, monthly values from the same grid point.`, ['l', 'r', 'r', 'r'])}
<p>Freiburg's reputation as Germany's sunniest big city usually rests on sunshine hours. For a solar system, what counts is the irradiation on the panel surface, and there ${davor.map((x) => x.name).join(' and ')} are just ahead. The gap is so small that a single tree in front of your balcony outweighs it. If you move to Freiburg from northern Germany, however, you gain clearly: compared with Hamburg, each kilowatt peak here produces ${h.pct(C.ey / STAEDTE.hamburg.ey - 1, 0)} more.</p>

<h2>The Black Forest at your back</h2>
<p>To the east, the land rises steeply from the Rhine plain into the Black Forest. PVGIS calculates a horizon for every location from its elevation model (${h.src('pvgis_doku', 'PVGIS documentation')}), and that horizon is already part of the annual ${h.num(C.ey)} kWh. The grid point for ${C.plz} sits at ${h.num(C.elev)} m. For orientation, the engine even puts an east balcony in Freiburg at ${h.num(ost.ertrag)} kWh, ahead of a west balcony at ${h.num(west.ertrag)} kWh; that conversion, however, comes from PVGIS queries for the whole Upper Rhine region, not for your street.</p>
<p>Down in the city, the mountain shadow in the morning is short. In the side valleys and on the slopes at the city's edge, the sun can clear the ridge much later. If you live there, check on a clear morning when light reaches your balcony and enter the shade in the calculator above: with ${h.pct(HANG, 0)} shading, an east balcony keeps ${h.num(ostHang.ertrag)} kWh and a saving of ${h.eur(ostHang.ersparnisJahr)}.</p>

<h2>Most devices per head, by big-city standards</h2>
<p>${h.num(dichte(C), 1)} plug-in devices per 1,000 residents is the highest figure among the ${h.num(ALL.length)} cities in this series. That Freiburg still stays below the national ${h.num(dichteBund, 1)} says more about big cities than about Freiburg: rented flats, little facade of your own, many households without a balcony. The figures come from the public ${h.src('mastr_einheiten', 'unit list of the Market Master Data Register')}, retrieved on ${h.date(ST.source.mastr_retrieved_at)}, and the population from ${h.src('destatis_gv', 'Destatis')}.</p>

<h2>Roofs in the register: full feed-in instead of batteries</h2>
<p>Among its ${h.num(C.gebaeude)} building systems, Freiburg stands out twice. ${h.pct(vollQuote(C), 0)} feed all their power into the grid, rank ${rangVoll} among the big cities and more than the national ${h.pct(vollQuote(B), 0)}. Batteries, by contrast, number only ${h.num(speicherQuote(C), 2)} per system, rank ${rangSpeicher}. Some of these are likely older systems built when the feed-in tariff was higher than the electricity price; ${h.pct(anteilS, 0)} face mainly south. That logic does not apply to a balcony system: it is not paid for exports, and its value lies entirely in the power you use. The difference between the models is explained on ${h.a('volleinspeisung-teileinspeisung', 'full or partial feed-in')}.</p>

<h2>A student in the Wiehre</h2>
<p>A room with a small east balcony, ${h.num(VERBRAUCH)} kWh consumption a year, often at the university during the day. The ${h.num(WP)} Wp device for ${h.eur(KOSTEN)} produces ${h.num(ost.ertrag)} kWh, but only ${h.num(ost.selbst)} kWh of it replace grid power, because consumption is low. The saving of ${h.eur(ost.ersparnisJahr)} a year pays off the device in ${h.num(ost.amortisationJahre ?? 0, 1)} years. A family using ${h.num(3500)} kWh with a south balcony would reach ${h.eur(suedFamilie.ersparnisJahr)}. An old meter may stay in use until it is replaced (${h.src('eeg_10a', 'section 10a EEG')}); more on the ${h.a('balkonkraftwerk-zaehler', 'meter page')}. Whether the device pays with low consumption is checked on ${h.a('balkonkraftwerk-lohnt-sich', 'is balcony solar worth it')}.</p>`,
  },
});

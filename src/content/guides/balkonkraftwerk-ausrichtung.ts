import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon, type BalkonEingabe } from '../../lib/engine/balkon';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Beispiele aus dem Motor: 900 Wp, 800 VA, Bundesmittel, 2 500 kWh. Raster aus Himmelsrichtung und Neigung, dazu Verschattung. */
const basis: BalkonEingabe = { ort: null, modulWp: 900, wechselrichterVa: P.balkon.max_va, neigung: 35, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: STROMPREIS_CT, kostenEur: 450 };
const b = (o: Partial<BalkonEingabe>) => rechneBalkon({ ...basis, ...o });
const best = b({});
const RICHT = [
  { de: 'Süd', en: 'South', az: 0 }, { de: 'Südost', en: 'South-east', az: -45 }, { de: 'Südwest', en: 'South-west', az: 45 },
  { de: 'Ost', en: 'East', az: -90 }, { de: 'West', en: 'West', az: 90 }, { de: 'Nord', en: 'North', az: 180 },
];
const NEIG = [90, 70, 35, 15];
const raster = RICHT.map((r) => ({ ...r, w: NEIG.map((n) => b({ azimut: r.az, neigung: n })) }));
const rel = (x: ReturnType<typeof b>) => x.ertrag / best.ertrag;
const sued90 = raster[0].w[0], ost90 = raster[3].w[0], west90 = raster[4].w[0], nord90 = raster[5].w[0];
const sued70 = raster[0].w[1], ost15 = raster[3].w[3], west35 = raster[4].w[2];
const schatten = [0, 0.1, 0.2, 0.3].map((s) => ({ s, r: b({ neigung: 90, verschattung: s }) }));
/** Ausrichtung aller Solareinheiten im Marktstammdatenregister (alle Größen, nicht nur Balkon). */
const A = ST.bund.ausrichtung;
const summeA = Object.values(A).reduce((x, y) => x + y, 0);
const anteilSued = A.S / summeA, anteilOW = (A.O + A.W + A.OW) / summeA;

export default defineGuide({
  id: 'balkonkraftwerk-ausrichtung',
  group: 'balkon',
  order: 28,
  mini: 'ausrichtung',
  related: ['balkonkraftwerk-ertrag', 'balkonkraftwerk-800-watt', 'photovoltaik-ost-west', 'balkonkraftwerk-lohnt-sich'],
  sources: ['pvgis', 'htw_lastprofile', 'mastr_einheiten'],
  de: {
    slug: 'balkonkraftwerk-ausrichtung',
    nav: 'Balkonkraftwerk Ausrichtung',
    card: 'Süd, Ost, West oder Nord, senkrecht am Geländer oder schräg aufgestellt, und was Schatten kostet.',
    title: 'Balkonkraftwerk Ausrichtung 2026: Süd, Ost, West, senkrecht',
    description: `Balkonkraftwerk Ausrichtung 2026: senkrecht nach Süden bringt ${DE.pct(rel(sued90))} des Bestwerts, nach Osten ${DE.pct(rel(ost90))}, nach Norden ${DE.pct(rel(nord90))}. Neigung und Schatten im Vergleich.`,
    h1: 'Balkonkraftwerk Ausrichtung 2026: Himmelsrichtung, Winkel, Schatten',
    intro: `Senkrecht am Südgeländer erreicht ein Balkonkraftwerk ${DE.pct(rel(sued90))} dessen, was dieselben Module mit 35° nach Süden bringen; nach Westen sind es ${DE.pct(rel(west90))}, nach Osten ${DE.pct(rel(ost90))}. Schräg stellen lohnt mehr als die perfekte Himmelsrichtung.`,
    resume: `Für die Ausrichtung eines Balkonkraftwerks zählen zwei Winkel: die Himmelsrichtung und die Neigung gegen die Waagerechte. Den Bestwert erreichen Module mit etwa 35° nach Süden, im Bundesmittel ${DE.num(best.ertrag)} kWh im Jahr für 900 Wp. Am Balkongeländer hängen sie aber meist senkrecht, und das kostet mehr als die Himmelsrichtung: Senkrecht nach Süden kommen ${DE.num(sued90.ertrag)} kWh zusammen (${DE.pct(rel(sued90))}), mit 70° Neigung schon ${DE.num(sued70.ertrag)} kWh. Senkrecht nach Westen sind es ${DE.num(west90.ertrag)} kWh, nach Osten ${DE.num(ost90.ertrag)} kWh, nach Norden nur ${DE.num(nord90.ertrag)} kWh. Ost- und Westlagen holen beim Eigenverbrauch auf, weil Morgen- und Abendstrom eher im Haushalt landet: Nach Osten nutzt ein Haushalt mit 2 500 kWh ${DE.pct(ost90.eigenAnteil)} der Erzeugung selbst, nach Süden ${DE.pct(sued90.eigenAnteil)}. Schatten wirkt direkt: 20 Prozent Verschattung senken den senkrechten Südertrag auf ${DE.num(schatten[2].r.ertrag)} kWh. Alle Werte rechnet der Motor aus PVGIS-Daten und gemessenen Lastgängen.`,
    faqs: [
      { q: 'Ost- oder Westbalkon: welcher bringt mehr Strom?', a: `Im Bundesmittel der Westbalkon. Senkrecht erzeugen 900 Wp nach Westen ${DE.num(west90.ertrag)} kWh, nach Osten ${DE.num(ost90.ertrag)} kWh im Jahr, weil Nachmittage seltener neblig sind als Vormittage. Für die Ersparnis zählt auch der Zeitpunkt: Abendstrom trifft auf Kochen und Fernsehen, Morgenstrom auf Kaffee und Homeoffice. Wer werktags erst abends heimkommt, ist mit Westen besser bedient.` },
      { q: 'Wie viel verliere ich, wenn die Module senkrecht am Geländer hängen?', a: `Gegenüber 35° Neigung nach Süden etwa ${DE.pct(1 - rel(sued90))}: ${DE.num(sued90.ertrag)} statt ${DE.num(best.ertrag)} kWh im Jahr bei 900 Wp. Der Verlust entsteht im Sommer, wenn die Sonne mittags hoch steht. Schon ein Aufsteller mit 70° holt einen großen Teil zurück, ${DE.num(sued70.ertrag)} kWh. Ob ein Ausstellwinkel am Geländer zulässig ist, regeln Hausordnung und Vermieter, nicht das Energierecht.` },
      { q: 'Lohnt sich ein Balkonkraftwerk am Nordbalkon überhaupt?', a: `Selten. Senkrecht nach Norden erzeugen 900 Wp im Bundesmittel ${DE.num(nord90.ertrag)} kWh, ${DE.pct(rel(nord90))} des Bestwerts, fast nur aus diffusem Himmelslicht. Liegt flach eine Fläche frei, etwa ein Garagendach oder eine Terrasse, bringen 15° Neigung auch ohne Südblick ${DE.num(raster[5].w[3].ertrag)} kWh, weil eine nahezu waagerechte Fläche den ganzen Himmel sieht.` },
      { q: 'Wie stark kostet Schatten vom Balkon darüber?', a: `Im Modell wirkt Verschattung als Abschlag auf die Erzeugung. 10 Prozent Schatten senken 900 Wp senkrecht Süd von ${DE.num(schatten[0].r.ertrag)} auf ${DE.num(schatten[1].r.ertrag)} kWh, 30 Prozent auf ${DE.num(schatten[3].r.ertrag)} kWh. Ein Balkon darüber beschattet im Sommer mittags den oberen Rand; hängen Module in Reihe am selben Wechselrichtereingang, kann ein teilweise verschattetes Modul die anderen mitbremsen.` },
      { q: 'Welche Neigung ist für ein Balkonkraftwerk auf der Terrasse ideal?', a: `Nach Süden rund 35°, im Bundesmittel ${DE.num(best.ertrag)} kWh für 900 Wp. Flacher geht wenig verloren: 15° bringen ${DE.num(raster[0].w[3].ertrag)} kWh und sind windstabiler. Nach Osten oder Westen ist eine flache Neigung sogar besser als eine steile, 15° nach Osten erzeugen ${DE.num(ost15.ertrag)} kWh. Flache Aufständerung braucht Ballast gegen Wind.` },
    ],
    body: (h) => `
<h2>Zwei Winkel bestimmen den Ertrag</h2>
<p>Die Himmelsrichtung, auch Azimut genannt, gibt an, wohin die Moduloberfläche zeigt. Die Neigung beschreibt, wie steil sie steht: 0° liegt flach, 90° hängt senkrecht. Für Deutschland liegt das Optimum bei etwa 35° nach Süden. Der Motor dieser Seite liest für jede Kombination aus beiden Winkeln einen Faktor aus Abfragen bei ${h.src('pvgis', 'PVGIS')} und rechnet damit den Jahresertrag. Das Raster unten zeigt das Ergebnis für 900 Wp im Bundesmittel, jeweils im Verhältnis zum Bestwert von ${h.num(best.ertrag)} kWh.</p>
${h.table(['Richtung', '90° senkrecht', '70°', '35°', '15°'], raster.map((r) => [r.de, ...r.w.map((x) => `${h.num(x.ertrag)} kWh (${h.pct(rel(x), 0)})`)]), '900 Wp, 800 VA, Bundesmittel, Anteil am Bestwert 35° Süd in Klammern.', ['l', 'r', 'r', 'r', 'r'])}
<p>Aus dem Raster lassen sich drei Regeln ablesen. Die Neigung wiegt am Balkon schwerer als die Richtung: Senkrecht nach Süden liegt unter 35° nach Westen (${h.num(west35.ertrag)} kWh). Je weiter die Module von Süden wegzeigen, desto flacher sollten sie stehen. Und Südost und Südwest unterscheiden sich vom reinen Süden nur um wenige Prozent.</p>

<h2>Senkrecht am Geländer: der häufigste Fall</h2>
<p>Die meisten Balkonkraftwerke hängen außen am Geländer, weil das ohne Bohren geht und keine Fläche kostet. Senkrechte Module verlieren vor allem im Sommer, wenn die Mittagssonne steil von oben kommt. Im Winter stehen sie fast optimal zur tiefen Sonne, und Schnee rutscht ab. Ein Aufsteller, der die Module unten etwas nach außen stellt, bringt bei 70° Neigung ${h.num(sued70.ertrag)} statt ${h.num(sued90.ertrag)} kWh. Ob das am Haus erlaubt ist, entscheidet nicht das Energierecht, sondern die Statik des Geländers, die Hausordnung und gegebenenfalls der Vermieter. Bei großer Modulleistung hat die senkrechte Montage einen Nebeneffekt: Der Wechselrichter muss seltener abregeln, wie der Ratgeber ${h.a('balkonkraftwerk-800-watt', 'Balkonkraftwerk 800 Watt')} zeigt.</p>

<h2>Ost und West: weniger Ertrag, mehr Eigenverbrauch</h2>
${h.table(['senkrecht nach', 'Erzeugung', 'selbst genutzt', 'Eigenverbrauchsanteil'], [raster[0], raster[3], raster[4], raster[5]].map((r) => [r.de, `${h.num(r.w[0].ertrag)} kWh`, `${h.num(r.w[0].selbst)} kWh`, h.pct(r.w[0].eigenAnteil, 0)]), 'Haushalt mit 2 500 kWh, Lastgänge von 74 gemessenen Haushalten.', ['l', 'r', 'r', 'r'])}
<p>Ein Ostbalkon erzeugt senkrecht ${h.pct(1 - ost90.ertrag / sued90.ertrag, 0)} weniger als ein Südbalkon, aber der Haushalt nutzt einen größeren Teil davon selbst, weil der Strom morgens kommt, wenn Kaffeemaschine und Licht laufen. Gerechnet ist das mit den ${h.src('htw_lastprofile', 'Lastprofilen der HTW Berlin')}. Der Abstand bei der Ersparnis ist deshalb kleiner als beim Ertrag. Wer auf zwei Balkonseiten Platz hat, verteilt die Module auf Ost und West und schließt sie an getrennte Eingänge des Wechselrichters an. Die Logik für ganze Dächer beschreibt ${h.a('photovoltaik-ost-west', 'Photovoltaik Ost-West')}.</p>

<h2>Schatten: der unterschätzte Faktor</h2>
${h.table(['Verschattung', 'Erzeugung', 'Ersparnis im Jahr'], schatten.map(({ s, r }) => [h.pct(s, 0), `${h.num(r.ertrag)} kWh`, h.eur(r.ersparnisJahr)]), '900 Wp senkrecht nach Süden, Bundesmittel, 2 500 kWh.', ['l', 'r', 'r'])}
<p>Typische Schattenwerfer am Balkon sind der Balkon im Stockwerk darüber, Trennwände zum Nachbarn, Bäume und gegenüberliegende Häuser. Ein Baum im Süden kostet im Sommer viel und im Winter wenig, wenn er das Laub verliert; ein Haus gegenüber dagegen nimmt vor allem im Winter die tiefe Sonne. Prüfen lässt sich das mit einem Blick zu verschiedenen Tageszeiten: Wo am Mittag Schatten fällt, verliert die Anlage am meisten. Wer Module an zwei Stellen montieren kann, setzt das stärker verschattete an einen eigenen Wechselrichtereingang.</p>

<h2>So bestimmen Sie die Ausrichtung Ihres Balkons</h2>
<p>Die Himmelsrichtung lässt sich ohne Werkzeug ermitteln. Ein Smartphone mit Kompass-App, an die Balkonbrüstung gelegt, zeigt die Richtung, in die der Balkon blickt. Wer keinen Kompass zur Hand hat, merkt sich, wann die Sonne frontal steht: gegen Mittag bei einem Südbalkon, am Vormittag bei Ost, am späten Nachmittag bei West. Kartendienste mit Luftbild helfen ebenfalls, weil Hausfassaden dort klar zu erkennen sind. Weicht der Balkon zwischen zwei Richtungen ab, etwa nach Südsüdwest, liegt der Ertrag zwischen den Zeilen des Rasters; der Mini-Rechner oben rechnet die Zwischenwerte Südost und Südwest.</p>
<p>Die Neigung ist am Geländer meist 90°. Bei Aufstellern steht der Winkel im Datenblatt; nachmessen lässt er sich mit einer Wasserwaagen-App. Für Flachdach und Terrasse gilt eine einfache Faustregel aus dem Raster: Je mehr Wind und je weniger Platz, desto flacher, denn zwischen 15° und 35° liegen nach Süden nur ${h.pct(1 - raster[0].w[3].ertrag / best.ertrag, 0)} Unterschied.</p>

<h2>Wie Deutschland seine Module ausrichtet</h2>
<p>Im Marktstammdatenregister ist für jede Solareinheit die Hauptausrichtung eingetragen, für Dächer wie für Balkone. Laut ${h.src('mastr_einheiten', 'öffentlicher Einheitenübersicht')} zeigen ${h.pct(anteilSued, 0)} aller Einheiten nach Süden und ${h.pct(anteilOW, 0)} nach Osten, Westen oder Ost-West. Am Balkon ist die Wahl meist vorgegeben; der Hebel liegt dann in der Neigung, im Schatten und darin, wann der Haushalt Strom braucht. Den Jahres- und Monatsertrag für Ihren Ort zeigt ${h.a('balkonkraftwerk-ertrag', 'Balkonkraftwerk Ertrag')}, die Amortisation ${h.a('balkonkraftwerk-lohnt-sich', 'Lohnt sich ein Balkonkraftwerk?')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-orientation',
    nav: 'Plug-in solar orientation',
    card: 'South, east, west or north, upright on the railing or tilted, and what shade costs.',
    title: 'Plug-in Solar Orientation 2026: South, East, West, Upright',
    description: `Plug-in solar orientation in Germany 2026: upright facing south gives ${EN.pct(rel(sued90))} of the best value, east ${EN.pct(rel(ost90))}, north ${EN.pct(rel(nord90))}. Tilt angle, railing and shade compared.`,
    h1: 'Plug-in solar orientation 2026: direction, angle and shade',
    intro: `Upright on a south-facing railing, a balcony kit reaches ${EN.pct(rel(sued90))} of what the same panels deliver tilted 35° south; facing west it is ${EN.pct(rel(west90))}, facing east ${EN.pct(rel(ost90))}. Tilting the panels matters more than the perfect direction.`,
    resume: `Two angles decide the orientation (Ausrichtung) of a German balcony power plant: the compass direction and the tilt from horizontal. Panels reach their best value at about 35° facing south, ${EN.num(best.ertrag)} kWh a year for 900 Wp on the German average. On a balcony railing, though, they usually hang upright, and that costs more than direction: upright facing south they produce ${EN.num(sued90.ertrag)} kWh (${EN.pct(rel(sued90))}), at a 70° tilt already ${EN.num(sued70.ertrag)} kWh. Upright facing west gives ${EN.num(west90.ertrag)} kWh, east ${EN.num(ost90.ertrag)} kWh and north only ${EN.num(nord90.ertrag)} kWh. East and west catch up on self-consumption, because morning and evening power is more likely to be used at home: facing east a household using 2,500 kWh consumes ${EN.pct(ost90.eigenAnteil)} of output itself, facing south ${EN.pct(sued90.eigenAnteil)}. Shade bites directly: 20 per cent shading lowers the upright south yield to ${EN.num(schatten[2].r.ertrag)} kWh. The engine computes all values from PVGIS data and metered load profiles.`,
    faqs: [
      { q: 'East or west balcony: which produces more power?', a: `On the German average, west. Upright, 900 Wp produce ${EN.num(west90.ertrag)} kWh a year facing west and ${EN.num(ost90.ertrag)} kWh facing east, because afternoons are less often foggy than mornings. Timing matters for the saving too: evening power meets cooking and TV, morning power meets coffee and home office. If you only get home in the evening on weekdays, west suits you better.` },
      { q: 'How much do I lose with panels hanging upright on the railing?', a: `Compared with a 35° south tilt, about ${EN.pct(1 - rel(sued90))}: ${EN.num(sued90.ertrag)} instead of ${EN.num(best.ertrag)} kWh a year for 900 Wp. The loss arises in summer, when the midday sun is high. A stand at 70° already recovers much of it, ${EN.num(sued70.ertrag)} kWh. Whether an angled bracket is allowed on the railing is a matter for house rules and the landlord, not energy law.` },
      { q: 'Is a balcony kit on a north-facing balcony worth it at all?', a: `Rarely. Upright facing north, 900 Wp produce ${EN.num(nord90.ertrag)} kWh on the German average, ${EN.pct(rel(nord90))} of the best value, almost entirely from diffuse skylight. If a flat area is free, such as a garage roof or terrace, a 15° tilt brings ${EN.num(raster[5].w[3].ertrag)} kWh even without a southern view, because a nearly horizontal surface sees the whole sky.` },
      { q: 'How much does shade from the balcony above cost?', a: `In the model, shading acts as a deduction from output. 10 per cent shade lowers 900 Wp upright south from ${EN.num(schatten[0].r.ertrag)} to ${EN.num(schatten[1].r.ertrag)} kWh, 30 per cent to ${EN.num(schatten[3].r.ertrag)} kWh. A balcony above shades the top edge at midday in summer; if panels are wired in series on the same inverter input, one partly shaded panel can hold back the others.` },
      { q: 'What tilt is ideal for a plug-in kit on a terrace?', a: `About 35° facing south, ${EN.num(best.ertrag)} kWh for 900 Wp on the German average. Going flatter loses little: 15° gives ${EN.num(raster[0].w[3].ertrag)} kWh and is more stable in wind. Facing east or west, a flat tilt is even better than a steep one; 15° facing east produces ${EN.num(ost15.ertrag)} kWh. A flat stand needs ballast against wind.` },
    ],
    body: (h) => `
<h2>Two angles decide the yield</h2>
<p>The compass direction, or azimuth, says where the panel surface points. The tilt describes how steep it stands: 0° lies flat, 90° hangs upright. In Germany the optimum is about 35° facing south. This site's engine reads a factor for every combination of both angles from queries to ${h.src('pvgis', 'PVGIS')} and uses it to compute annual yield. The grid below shows the result for 900 Wp on the German average, each relative to the best value of ${h.num(best.ertrag)} kWh.</p>
${h.table(['Direction', '90° upright', '70°', '35°', '15°'], raster.map((r) => [r.en, ...r.w.map((x) => `${h.num(x.ertrag)} kWh (${h.pct(rel(x), 0)})`)]), '900 Wp, 800 VA, German average, share of the 35° south best value in brackets.', ['l', 'r', 'r', 'r', 'r'])}
<p>Three rules follow from the grid. On a balcony, tilt weighs more than direction: upright facing south is below 35° facing west (${h.num(west35.ertrag)} kWh). The further panels point away from south, the flatter they should stand. And south-east and south-west differ from due south by only a few per cent.</p>

<h2>Upright on the railing: the most common case</h2>
<p>Most balcony kits hang on the outside of the railing, because that needs no drilling and takes no floor space. Upright panels lose mainly in summer, when the midday sun comes steeply from above. In winter they face the low sun almost perfectly, and snow slides off. A bracket that angles the bottom of the panels outwards brings ${h.num(sued70.ertrag)} instead of ${h.num(sued90.ertrag)} kWh at a 70° tilt. Whether that is allowed on your building is not a question of energy law but of the railing's load capacity, the house rules and, where relevant, your landlord. With large panel output, upright mounting has a side effect: the inverter has to clip less often, as the guide ${h.a('balkonkraftwerk-800-watt', 'plug-in solar 800 watt')} shows.</p>

<h2>East and west: less yield, more self-use</h2>
${h.table(['upright facing', 'Output', 'used at home', 'self-use share'], [raster[0], raster[3], raster[4], raster[5]].map((r) => [r.en, `${h.num(r.w[0].ertrag)} kWh`, `${h.num(r.w[0].selbst)} kWh`, h.pct(r.w[0].eigenAnteil, 0)]), 'Household using 2,500 kWh, load profiles of 74 metered households.', ['l', 'r', 'r', 'r'])}
<p>An east balcony produces ${h.pct(1 - ost90.ertrag / sued90.ertrag, 0)} less upright than a south balcony, but the household uses a larger part of it, because the power arrives in the morning when the coffee machine and lights are on. This is computed with the ${h.src('htw_lastprofile', 'HTW Berlin load profiles')}. The gap in savings is therefore smaller than the gap in yield. If you have room on two sides, split the panels between east and west and connect them to separate inverter inputs. The logic for whole roofs is under ${h.a('photovoltaik-ost-west', 'east-west solar roof')}.</p>

<h2>Shade: the underrated factor</h2>
${h.table(['Shading', 'Output', 'Saving per year'], schatten.map(({ s, r }) => [h.pct(s, 0), `${h.num(r.ertrag)} kWh`, h.eur(r.ersparnisJahr)]), '900 Wp upright facing south, German average, 2,500 kWh.', ['l', 'r', 'r'])}
<p>Typical sources of shade on a balcony are the balcony on the floor above, partition walls to the neighbours, trees and buildings opposite. A tree to the south costs a lot in summer and little in winter once it drops its leaves; a building opposite, by contrast, mainly takes the low winter sun. A look at different times of day tells you most: where shade falls at midday, the system loses most. If you can mount panels in two places, put the more shaded one on its own inverter input.</p>

<h2>How to find your balcony's orientation</h2>
<p>You can work out the direction without tools. A smartphone compass app laid on the balcony parapet shows the way the balcony faces. Without a compass, note when the sun is straight ahead: around midday for a south balcony, mid-morning for east, late afternoon for west. Map services with aerial images help as well, since building fronts are easy to see there. If your balcony lies between two directions, say south-south-west, the yield falls between the rows of the grid; the mini calculator above covers the in-between values south-east and south-west.</p>
<p>On a railing the tilt is usually 90°. For stands the angle is on the data sheet, and a spirit-level app measures it. For a flat roof or terrace the grid gives a simple rule: the more wind and the less space, the flatter, because facing south there is only ${h.pct(1 - raster[0].w[3].ertrag / best.ertrag, 0)} between 15° and 35°.</p>

<h2>How Germany points its panels</h2>
<p>The Market Master Data Register records the main orientation of every solar unit, rooftop and balcony alike. According to the ${h.src('mastr_einheiten', 'public list of units')}, ${h.pct(anteilSued, 0)} of all units face south and ${h.pct(anteilOW, 0)} face east, west or east-west. On a balcony the choice is usually given; the levers are then tilt, shade and when the household needs power. Annual and monthly yield for your location is under ${h.a('balkonkraftwerk-ertrag', 'plug-in solar yield')}, payback under ${h.a('balkonkraftwerk-lohnt-sich', 'is plug-in solar worth it?')}.</p>`,
  },
});

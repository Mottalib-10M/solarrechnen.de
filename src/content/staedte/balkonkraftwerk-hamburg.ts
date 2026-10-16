import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, P, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Hamburg: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.hamburg;
const M = STAEDTE.muenchen;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
const ortM = ortVonPlz(M.plz)!;
/** Beispielhaushalt: Altbauwohnung, zwei Personen. */
const WP = 900, VA = 800, VERBRAUCH = 2500, KOSTEN = 450;
const calc = (o: typeof ort, tilt: number, az: number) => rechneBalkon({ ort: o, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: 0, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const sued = calc(ort, 90, 0), west = calc(ort, 90, 90), suedwest = calc(ort, 90, 45), suedM = calc(ortM, 90, 0);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const monat = (c: City, ertrag: number, i: number) => ertrag * c.em[i] / summe(c);
const dezH = monat(C, sued.ertrag, 11), dezM = monat(M, suedM.ertrag, 11);
const junH = monat(C, sued.ertrag, 5), junM = monat(M, suedM.ertrag, 5);
const rueckstand = 1 - C.ey / M.ey;
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const speicherQuote = C.speicher / C.gebaeude, speicherQuoteBund = B.speicher / B.gebaeude;
const vollQuote = C.voll / C.gebaeude, vollQuoteBund = B.voll / B.gebaeude;
const ausrSumme = Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const anteilS = C.ausrichtung.S / ausrSumme;

export default defineGuide({
  id: 'balkonkraftwerk-hamburg',
  group: 'stadt',
  order: 101,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ertrag', 'balkonkraftwerk-lohnt-sich', 'balkonkraftwerk-mieter', 'balkonkraftwerk-anmelden'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'bgb_554', 'mastrv_5'],
  de: {
    slug: 'balkonkraftwerk-hamburg',
    nav: 'Hamburg',
    card: `${DE.num(C.ey)} kWh je kWp, der niedrigste Wert der Großstädte: was ein Steckersolargerät an der Elbe trotzdem spart.`,
    title: `Balkonkraftwerk Hamburg 2026: Ertrag im Norden, Ersparnis`,
    description: `Balkonkraftwerk Hamburg 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, Sommer- und Winterertrag sowie die jährliche Ersparnis für Ihren Haushalt.`,
    h1: 'Balkonkraftwerk in Hamburg: was der Norden 2026 hergibt',
    intro: `Ein Steckersolargerät mit ${DE.num(WP)} Wp am Südbalkon liefert in Hamburg rund ${DE.num(sued.ertrag)} kWh im Jahr und spart einem Haushalt mit ${DE.num(VERBRAUCH)} kWh Verbrauch ${DE.eur(sued.ersparnisJahr)}.`,
    resume: `Hamburg hat unter den ${ALL.length} hier verglichenen Großstädten den geringsten Solarertrag: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, ${DE.pct(rueckstand)} weniger als München. Der Abstand entsteht fast nur im Winterhalbjahr. Im Juni erzeugt ein senkrechtes Gerät mit ${DE.num(WP)} Wp an der Elbe ${DE.num(junH)} kWh, in München ${DE.num(junM)} kWh; im Dezember sind es ${DE.num(dezH, 1)} gegenüber ${DE.num(dezM, 1)} kWh. Übers Jahr kommen am Südbalkon ${DE.num(sued.ertrag)} kWh zusammen, nach Westen ${DE.num(west.ertrag)} kWh. Ein Zweipersonenhaushalt mit ${DE.num(VERBRAUCH)} kWh nutzt davon ${DE.pct(sued.eigenAnteil)} selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(sued.ersparnisJahr)}, sodass sich ein Gerät für ${DE.eur(KOSTEN)} nach ${DE.num(sued.amortisationJahre ?? 0, 1)} Jahren bezahlt macht. Das Marktstammdatenregister führt in Hamburg ${DE.num(C.balkon)} Balkonkraftwerke, ${DE.num(dichte, 1)} je 1 000 Einwohner gegenüber ${DE.num(dichteBund, 1)} im Bund.`,
    faqs: [
      { q: 'Lohnt sich ein Balkonkraftwerk in Hamburg trotz des vielen Regens?', a: `Ja. Der Ertrag liegt mit ${DE.num(C.ey)} kWh je kWp zwar am unteren Ende der Großstädte, die Ersparnis aber kaum darunter: ${DE.eur(sued.ersparnisJahr)} im Jahr bei ${DE.num(WP)} Wp am Südbalkon und ${DE.num(VERBRAUCH)} kWh Verbrauch. Weil ein kleines Gerät ohnehin nur einen Teil des Stroms selbst deckt, fallen schwache Monate weniger ins Gewicht als bei einer großen Dachanlage. Rechnen Sie mit gut ${DE.num(Math.floor(sued.amortisationJahre ?? 0))} Jahren bis zur Amortisation.` },
      { q: 'Wie viel weniger erzeugt ein Balkonkraftwerk in Hamburg als in München?', a: `Übers Jahr gut ${DE.pct(1 - sued.ertrag / suedM.ertrag)}: ${DE.num(sued.ertrag)} statt ${DE.num(suedM.ertrag)} kWh bei ${DE.num(WP)} Wp senkrecht nach Süden. Im Juni ist der Unterschied klein, ${DE.num(junH)} gegenüber ${DE.num(junM)} kWh, weil die Tage im Norden länger sind. Im Dezember erreicht Hamburg mit ${DE.num(dezH, 1)} kWh nur ${DE.pct(dezH / dezM)} des Münchner Wertes. So steht es in den PVGIS-Monatsdaten beider Postleitzahlen.` },
      { q: 'Wie viele Balkonkraftwerke sind in Hamburg angemeldet?', a: `Das Marktstammdatenregister zählte beim Abruf am ${ST.source.mastr_retrieved_at.split('-').reverse().join('.')} in Hamburg ${DE.num(C.balkon)} Steckersolargeräte in Betrieb. Das sind ${DE.num(dichte, 1)} je 1 000 Einwohner und deutlich weniger als die ${DE.num(dichteBund, 1)} im Bundesdurchschnitt, den Kleinstädte und Landgemeinden heben, denn alle hier verglichenen Großstädte liegen darunter. Dazu kommen ${DE.num(C.gebaeude)} Solaranlagen auf Gebäuden.` },
      { q: 'Muss ich mein Balkonkraftwerk in Hamburg beim Netzbetreiber melden?', a: `Nein. Für Steckersolargeräte bis ${DE.num(P.balkon.max_wp)} Wp Modulleistung und ${DE.num(P.balkon.max_va)} VA Wechselrichterleistung verlangt das EEG keine Meldung beim Netzbetreiber. Pflicht ist allein der Eintrag im Marktstammdatenregister innerhalb von ${P.mastr.frist_monate === 1 ? 'einem Monat' : `${P.mastr.frist_monate} Monaten`} nach der Inbetriebnahme. Den Zähler tauscht, falls nötig, der Messstellenbetreiber von sich aus.` },
    ],
    body: (h) => `
<h2>Hamburg im Städtevergleich: Schlusslicht beim Jahresertrag</h2>
${h.table(['Kennzahl', 'Hamburg', 'Quelle'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `PVGIS, PLZ ${C.plz}`],
  [`Platz unter ${h.num(ALL.length)} Großstädten`, `${rangEy}`, 'PVGIS'],
  ['November bis Februar am Jahresertrag', `${h.pct(winter, 1)} (Platz ${rangWinter})`, 'PVGIS, Monatswerte'],
  ['Steckersolargeräte in Betrieb', h.num(C.balkon), 'Marktstammdatenregister'],
  ['je 1 000 Einwohner', `${h.num(dichte, 1)} (Bund ${h.num(dichteBund, 1)})`, 'MaStR, Destatis'],
  ['Speicher je Gebäudeanlage', `${h.num(speicherQuote, 2)} (Bund ${h.num(speicherQuoteBund, 2)})`, 'Marktstammdatenregister'],
  ['Volleinspeiser unter den Gebäudeanlagen', `${h.pct(vollQuote, 1)} (Bund ${h.pct(vollQuoteBund, 1)})`, 'Marktstammdatenregister'],
], `Register abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; Einwohner nach Destatis.`, ['l', 'r', 'l'])}
<p>Platz ${rangEy} von ${h.num(ALL.length)} klingt schlechter, als es ist. Hamburg liegt auf ${h.num(C.lat, 1)} Grad nördlicher Breite und damit nördlicher als jede andere Stadt dieses Vergleichs, das Gelände um den Messpunkt nur ${h.num(C.elev)} Meter über dem Meer. Feuchte Luft von der Nordsee bringt häufig geschlossene Wolkendecken, und genau die kosten Ertrag. Ein Balkonkraftwerk wird hier trotzdem nicht zur Fehlinvestition, es braucht nur ein paar Monate länger, bis es sich bezahlt hat.</p>

<h2>Langer Juni, kurzer Dezember</h2>
<p>Wer die Monatswerte von ${h.src('pvgis', 'PVGIS')} nebeneinanderlegt, sieht ein klares Muster. Im Hochsommer steht die Sonne in Hamburg zwar etwas tiefer als in Bayern, dafür bleibt es abends länger hell. Ein senkrecht montiertes Gerät mit ${h.num(WP)} Wp erzeugt im Juni ${h.num(junH)} kWh, kaum weniger als dasselbe Gerät in München mit ${h.num(junM)} kWh. Im Dezember dagegen schrumpft der Ertrag an der Elbe auf ${h.num(dezH, 1)} kWh, während München noch ${h.num(dezM, 1)} kWh schafft.</p>
<p>November bis Februar tragen in Hamburg nur ${h.pct(winter, 1)} zum Jahresertrag bei, der niedrigste Winteranteil aller verglichenen Städte. Für die Kaufentscheidung heißt das: Die Rechnung steht und fällt mit dem Sommerhalbjahr. Ein Gerät, das von Mai bis August verlässlich die Grundlast von Kühlschrank, Router und Standby deckt, spielt in Hamburg den größten Teil seiner Ersparnis ein.</p>

<h2>Register-Befund: mehr Speicher, kaum Volleinspeisung</h2>
<p>Das ${h.src('mastr_einheiten', 'Marktstammdatenregister')} verrät, wie die Hamburger ihre Solaranlagen betreiben. Auf ${h.num(C.gebaeude)} Gebäudeanlagen kommen ${h.num(C.speicher)} Batteriespeicher, ${h.num(speicherQuote, 2)} je Anlage gegenüber ${h.num(speicherQuoteBund, 2)} im Bundesschnitt. Nur ${h.pct(vollQuote, 1)} der Gebäudeanlagen speisen ihren gesamten Strom ins Netz, bundesweit sind es ${h.pct(vollQuoteBund, 1)}. Wer an der Elbe Solarstrom erzeugt, will ihn also möglichst selbst verbrauchen. Bei den Dächern zeigt ${h.pct(anteilS, 0)} der Anlagen hauptsächlich nach Süden.</p>
<p>Für ein Balkonkraftwerk ist ein Akku trotzdem selten die erste Wahl: Der Mehrertrag im Winter ist zu klein, um einen Speicher zu füllen. Ob er sich im eigenen Fall rechnet, zeigt der ${h.a('balkonkraftwerk-mit-speicher', 'Rechner für Balkonkraftwerke mit Speicher')}.</p>

<h2>Beispielrechnung: Altbau in Eimsbüttel</h2>
<p>Zwei Personen, ${h.num(VERBRAUCH)} kWh Stromverbrauch im Jahr, ein Gründerzeithaus mit Balkon zur Straße. Das Gerät mit zwei Modulen und ${h.num(VA)} VA Wechselrichter kostet ${h.eur(KOSTEN)}. Je nach Lage des Balkons ergibt sich:</p>
${h.table(['Ausrichtung, senkrecht', 'Ertrag', 'selbst genutzt', 'Ersparnis/Jahr'], [
  ['Süd', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.eur(sued.ersparnisJahr)],
  ['Südwest', `${h.num(suedwest.ertrag)} kWh`, `${h.num(suedwest.selbst)} kWh`, h.eur(suedwest.ersparnisJahr)],
  ['West', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.eur(west.ersparnisJahr)],
], `Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh, keine Verschattung.`, ['l', 'r', 'r', 'r'])}
<p>Der Westbalkon verliert gegenüber Süden spürbar an Ertrag, beim selbst verbrauchten Strom ist der Abstand kleiner, weil der Nachmittag zum Tagesablauf Berufstätiger passt. Bäume im Hof oder ein Nachbarhaus gegenüber wiegen in Hamburg schwerer als anderswo, denn die tiefe Wintersonne erreicht viele Balkone in engen Straßen gar nicht. Wie stark Ihr Balkon verschattet ist, tragen Sie im Rechner oben ein.</p>

<h2>Was Hamburger vor dem Anbringen klären</h2>
<p>Mieter haben nach ${h.src('bgb_554', '§ 554 BGB')} Anspruch auf die Erlaubnis des Vermieters, wenn nichts Unzumutbares dagegen spricht; in Eigentumswohnungen beschließt die Gemeinschaft über das Wie, nicht über das Ob. Nach der Inbetriebnahme bleibt ${P.mastr.frist_monate === 1 ? 'ein Monat' : `${P.mastr.frist_monate} Monate`} für den Eintrag ins Register (${h.src('mastrv_5', '§ 5 MaStRV')}). Bei Sturmlagen an der Küste lohnt es, die Halterung ordentlich am Geländer zu verschrauben; das ist keine Vorschrift, aber gesunder Menschenverstand.</p>`,
  },
  en: {
    slug: 'plug-in-solar-hamburg',
    nav: 'Hamburg',
    card: `${EN.num(C.ey)} kWh per kWp, the lowest among Germany's big cities: what balcony solar still saves by the Elbe.`,
    title: `Plug-in Solar Hamburg 2026: Northern Yield and Saving`,
    description: `Plug-in solar Hamburg 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, summer and winter output, and what your own household saves a year.`,
    h1: 'Plug-in solar in Hamburg: what the north delivers in 2026',
    intro: `A ${EN.num(WP)} Wp plug-in device on a south-facing balcony yields about ${EN.num(sued.ertrag)} kWh a year in Hamburg and saves ${EN.eur(sued.ersparnisJahr)} for a household using ${EN.num(VERBRAUCH)} kWh.`,
    resume: `Of the ${ALL.length} big cities compared here, Hamburg has the lowest solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, ${EN.pct(rueckstand)} less than Munich. Almost all of that gap opens up in the dark half of the year. In June an upright ${EN.num(WP)} Wp balcony system (Balkonkraftwerk) by the Elbe produces ${EN.num(junH)} kWh against ${EN.num(junM)} kWh in Munich; in December it is ${EN.num(dezH, 1)} against ${EN.num(dezM, 1)} kWh. Over the year a south balcony gathers ${EN.num(sued.ertrag)} kWh, a west balcony ${EN.num(west.ertrag)} kWh. A two-person household using ${EN.num(VERBRAUCH)} kWh consumes ${EN.pct(sued.eigenAnteil)} of that itself and saves ${EN.eur(sued.ersparnisJahr)} at ${EN.num(STROMPREIS_CT, 1)} cents per kWh, so a ${EN.eur(KOSTEN)} device pays for itself in ${EN.num(sued.amortisationJahre ?? 0, 1)} years. The federal register lists ${EN.num(C.balkon)} plug-in devices in Hamburg, ${EN.num(dichte, 1)} per 1,000 residents against ${EN.num(dichteBund, 1)} nationally.`,
    faqs: [
      { q: 'Is balcony solar worth it in Hamburg given all the rain?', a: `Yes. At ${EN.num(C.ey)} kWh per kWp the yield is at the bottom of the big-city table, but the saving barely is: ${EN.eur(sued.ersparnisJahr)} a year for ${EN.num(WP)} Wp on a south balcony and ${EN.num(VERBRAUCH)} kWh of consumption. Because a small device only covers part of your demand anyway, weak months matter less than for a large roof system. Expect a little over ${EN.num(Math.floor(sued.amortisationJahre ?? 0))} years to break even.` },
      { q: 'How much less does a plug-in system produce in Hamburg than in Munich?', a: `About ${EN.pct(1 - sued.ertrag / suedM.ertrag)} less over the year: ${EN.num(sued.ertrag)} instead of ${EN.num(suedM.ertrag)} kWh for ${EN.num(WP)} Wp upright facing south. In June the difference is small, ${EN.num(junH)} against ${EN.num(junM)} kWh, because northern days are longer. In December Hamburg's ${EN.num(dezH, 1)} kWh is only ${EN.pct(dezH / dezM)} of Munich's figure. That is what the PVGIS monthly data for both postcodes show.` },
      { q: 'How many plug-in solar devices are registered in Hamburg?', a: `When the Market Master Data Register was queried on ${ST.source.mastr_retrieved_at}, it listed ${EN.num(C.balkon)} plug-in devices in operation in Hamburg. That is ${EN.num(dichte, 1)} per 1,000 residents, well below the national ${EN.num(dichteBund, 1)}, which small towns and rural areas lift, since every big city compared here sits below it. On top of that come ${EN.num(C.gebaeude)} solar systems on buildings.` },
      { q: 'Do I have to tell the Hamburg grid operator about my balcony system?', a: `No. For plug-in devices up to ${EN.num(P.balkon.max_wp)} Wp of panels and ${EN.num(P.balkon.max_va)} VA of inverter output, the Renewable Energy Act requires no notice to the grid operator. The only duty is the entry in the Market Master Data Register within ${P.mastr.frist_monate === 1 ? 'one month' : `${P.mastr.frist_monate} months`} of switching on. If the meter needs replacing, the metering operator does it on its own initiative.` },
    ],
    body: (h) => `
<h2>Hamburg among the big cities: last for annual yield</h2>
${h.table(['Indicator', 'Hamburg', 'Source'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `PVGIS, postcode ${C.plz}`],
  [`Rank among ${h.num(ALL.length)} big cities`, `${rangEy}`, 'PVGIS'],
  ['November to February share of yield', `${h.pct(winter, 1)} (rank ${rangWinter})`, 'PVGIS monthly values'],
  ['Plug-in devices in operation', h.num(C.balkon), 'Market Master Data Register'],
  ['per 1,000 residents', `${h.num(dichte, 1)} (Germany ${h.num(dichteBund, 1)})`, 'MaStR, Destatis'],
  ['Batteries per building system', `${h.num(speicherQuote, 2)} (Germany ${h.num(speicherQuoteBund, 2)})`, 'Market Master Data Register'],
  ['Full-feed-in share of building systems', `${h.pct(vollQuote, 1)} (Germany ${h.pct(vollQuoteBund, 1)})`, 'Market Master Data Register'],
], `Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; population from Destatis.`, ['l', 'r', 'l'])}
<p>Rank ${rangEy} of ${h.num(ALL.length)} sounds worse than it is. Hamburg sits at ${h.num(C.lat, 1)} degrees north, further north than any other city in this comparison, and the ground at the reference point is only ${h.num(C.elev)} metres above sea level. Moist air from the North Sea often brings unbroken cloud, and that is what costs yield. A balcony system is still no bad buy here; it simply takes a few more months to repay itself.</p>

<h2>Long June, short December</h2>
<p>Put the ${h.src('pvgis', 'PVGIS')} monthly values side by side and a clear pattern appears. In high summer the sun stands a little lower in Hamburg than in Bavaria, but evenings stay light for longer. An upright ${h.num(WP)} Wp device produces ${h.num(junH)} kWh in June, hardly less than the same device in Munich at ${h.num(junM)} kWh. In December, by contrast, output by the Elbe shrinks to ${h.num(dezH, 1)} kWh while Munich still manages ${h.num(dezM, 1)} kWh.</p>
<p>November to February contribute only ${h.pct(winter, 1)} of Hamburg's annual yield, the lowest winter share of all cities compared. For the buying decision this means the sums depend on the summer half. A device that reliably covers the base load of fridge, router and standby from May to August earns most of its saving in Hamburg during those months.</p>

<h2>What the register shows: more batteries, little full feed-in</h2>
<p>The ${h.src('mastr_einheiten', 'Market Master Data Register')} reveals how people in Hamburg run their solar systems. There are ${h.num(C.speicher)} batteries for ${h.num(C.gebaeude)} building-mounted systems, ${h.num(speicherQuote, 2)} per system against ${h.num(speicherQuoteBund, 2)} nationally. Only ${h.pct(vollQuote, 1)} of building systems export all their power (Volleinspeisung), compared with ${h.pct(vollQuoteBund, 1)} across Germany. Solar owners by the Elbe clearly want to use their own power. On roofs, ${h.pct(anteilS, 0)} of systems face mainly south.</p>
<p>For a balcony system a battery is still rarely the first choice: the small winter output is not enough to fill one. Whether it pays in your case is shown by the ${h.a('balkonkraftwerk-mit-speicher', 'calculator for balcony systems with storage')}.</p>

<h2>Worked example: a period flat in Eimsbüttel</h2>
<p>Two people, ${h.num(VERBRAUCH)} kWh of electricity a year, a 19th-century building with a balcony onto the street. The device with two panels and an ${h.num(VA)} VA inverter costs ${h.eur(KOSTEN)}. Depending on where the balcony faces:</p>
${h.table(['Orientation, upright', 'Yield', 'Used at home', 'Saving/year'], [
  ['South', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.eur(sued.ersparnisJahr)],
  ['South-west', `${h.num(suedwest.ertrag)} kWh`, `${h.num(suedwest.selbst)} kWh`, h.eur(suedwest.ersparnisJahr)],
  ['West', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.eur(west.ersparnisJahr)],
], `Electricity price ${h.num(STROMPREIS_CT, 1)} ct/kWh, no shading.`, ['l', 'r', 'r', 'r'])}
<p>A west balcony loses noticeably on yield compared with south; on self-used power the gap is smaller, because the afternoon suits the routine of people who work. Trees in the courtyard or a building opposite weigh more in Hamburg than elsewhere, since the low winter sun never reaches many balconies in narrow streets. Enter how shaded your balcony is in the calculator above.</p>

<h2>What to sort out before mounting in Hamburg</h2>
<p>Tenants are entitled to their landlord's permission under ${h.src('bgb_554', 'section 554 Civil Code')} unless it is unreasonable for the landlord; in owner-occupied flats the owners' association decides how, not whether. After switching on you have ${P.mastr.frist_monate === 1 ? 'one month' : `${P.mastr.frist_monate} months`} to register (${h.src('mastrv_5', 'section 5 MaStRV')}). With coastal storms, it is worth bolting the bracket firmly to the railing; that is not a legal rule, just common sense.</p>`,
  },
});

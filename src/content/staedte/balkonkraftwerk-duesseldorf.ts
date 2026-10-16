import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Düsseldorf: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; lon: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.duesseldorf;
const K = STAEDTE.koeln;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
const ortK = ortVonPlz(K.plz)!;
/** Beispiel: Paar mit Homeoffice in Bilk, Südwestbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 2400, KOSTEN = 450, AKKU_KLEIN = 1, AKKU_GROSS = 2;
const calc = (o: typeof ort, az: number, sp: number) => rechneBalkon({ ort: o, modulWp: WP, wechselrichterVa: VA, neigung: 90, azimut: az, verschattung: 0, speicherKwh: sp, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const ohne = calc(ort, 45, 0), klein = calc(ort, 45, AKKU_KLEIN), gross = calc(ort, 45, AKKU_GROSS);
const koeln = calc(ortK, 45, 0);
const plus = (x: typeof ohne) => x.selbst - ohne.selbst;
const wert = (x: typeof ohne) => plus(x) * STROMPREIS_CT / 100;
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C);
const dezember = ohne.ertrag * C.em[11] / summe(C), maerz = ohne.ertrag * C.em[2] / summe(C);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const quote = (c: City) => c.speicher / c.gebaeude;
const speicherQuote = quote(C), speicherQuoteBund = B.speicher / B.gebaeude;
const rangSpeicher = [...ALL].sort((x, y) => quote(y) - quote(x)).findIndex((x) => x.name === C.name) + 1;
const dichte = (c: City) => (c.balkon / c.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => dichte(y) - dichte(x)).findIndex((x) => x.name === C.name) + 1;
const vollQuote = C.voll / C.gebaeude;
const ausrSumme = Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const anteil = (k: string) => C.ausrichtung[k] / ausrSumme;
const rad = (x: number) => x * Math.PI / 180;
const abstandKm = 6371 * 2 * Math.asin(Math.sqrt(Math.sin(rad(K.lat - C.lat) / 2) ** 2 + Math.cos(rad(C.lat)) * Math.cos(rad(K.lat)) * Math.sin(rad(K.lon - C.lon) / 2) ** 2));

export default defineGuide({
  id: 'balkonkraftwerk-duesseldorf',
  group: 'stadt',
  order: 106,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-mit-speicher', 'stromspeicher-groesse', 'balkonkraftwerk-lohnt-sich', 'balkonkraftwerk-mieter'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'htw_lastprofile', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-duesseldorf',
    nav: 'Düsseldorf',
    card: `${DE.num(C.speicher)} Speicher auf ${DE.num(C.gebaeude)} Dachanlagen: lohnt sich in Düsseldorf ein Akku am Balkonkraftwerk?`,
    title: `Balkonkraftwerk Düsseldorf 2026: Ertrag, Speicher, Ersparnis`,
    description: `Balkonkraftwerk Düsseldorf 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte und ${DE.num(C.speicher)} Speicher im Register, Ersparnis mit oder ohne Akku am Balkon gerechnet.`,
    h1: 'Balkonkraftwerk in Düsseldorf: mit oder ohne Akku? 2026',
    intro: `Am Südwestbalkon erzeugen ${DE.num(WP)} Wp in Düsseldorf ${DE.num(ohne.ertrag)} kWh im Jahr; ein Akku mit ${DE.num(AKKU_KLEIN)} kWh holt davon ${DE.num(plus(klein))} kWh mehr in den eigenen Haushalt.`,
    resume: `Düsseldorf liegt beim Solarertrag knapp hinter Köln: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} Großstädten. Im Marktstammdatenregister fällt die Stadt durch ihre Speicher auf: ${DE.num(C.speicher)} Batteriespeicher stehen ${DE.num(C.gebaeude)} Solaranlagen auf Gebäuden gegenüber, ${DE.num(speicherQuote, 2)} je Anlage und deutlich mehr als im Bund mit ${DE.num(speicherQuoteBund, 2)}. Balkonkraftwerke sind dagegen selten, ${DE.num(C.balkon)} Geräte oder ${DE.num(dichte(C), 1)} je 1 000 Einwohner, Platz ${rangDichte} der Städte. Ein Gerät mit ${DE.num(WP)} Wp senkrecht am Südwestbalkon erzeugt ${DE.num(ohne.ertrag)} kWh im Jahr. Ein Paar mit ${DE.num(VERBRAUCH)} kWh Verbrauch nutzt davon ${DE.num(ohne.selbst)} kWh selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(ohne.ersparnisJahr)}. Mit einem Akku von ${DE.num(AKKU_KLEIN)} kWh kämen ${DE.eur(wert(klein))} im Jahr hinzu, mit ${DE.num(AKKU_GROSS)} kWh ${DE.eur(wert(gross))}. Ob sich der Speicher lohnt, entscheidet also sein Preis.`,
    faqs: [
      { q: 'Lohnt sich in Düsseldorf ein Speicher für das Balkonkraftwerk?', a: `Nur, wenn er günstig ist. Am Südwestbalkon mit ${DE.num(WP)} Wp und ${DE.num(VERBRAUCH)} kWh Verbrauch hebt ein Akku mit ${DE.num(AKKU_KLEIN)} kWh den selbst genutzten Strom um ${DE.num(plus(klein))} kWh, das sind ${DE.eur(wert(klein))} im Jahr. Mit ${DE.num(AKKU_GROSS)} kWh sind es ${DE.eur(wert(gross))}. Teilen Sie den Speicherpreis durch diesen Betrag, dann wissen Sie, nach wie vielen Jahren er sich bezahlt macht.` },
      { q: 'Erzeugt ein Balkonkraftwerk in Düsseldorf so viel wie in Köln?', a: `Fast. PVGIS gibt für Düsseldorf ${DE.num(C.ey)} und für Köln ${DE.num(K.ey)} kWh je kWp an. Ein Gerät mit ${DE.num(WP)} Wp senkrecht nach Südwesten bringt in Düsseldorf ${DE.num(ohne.ertrag)} kWh, in Köln ${DE.num(koeln.ertrag)} kWh im Jahr. Der Unterschied ist kleiner als der, den ein Baum vor dem Balkon ausmacht. Beide Städte liegen im Rheinland auf ähnlicher Höhe.` },
      { q: 'Wie viele Solarspeicher gibt es in Düsseldorf?', a: `Das Marktstammdatenregister zählt in Düsseldorf ${DE.num(C.speicher)} Stromspeicher in Betrieb, bei ${DE.num(C.gebaeude)} Solaranlagen auf Gebäuden. Das Verhältnis von ${DE.num(speicherQuote, 2)} ist eines der höchsten unter den Großstädten (Platz ${rangSpeicher} von ${ALL.length}); im Bund liegt es bei ${DE.num(speicherQuoteBund, 2)}. Gezählt sind alle registrierten Stromspeicher der Stadt, nicht nur solche an Balkonkraftwerken; ein Akku am Steckergerät wird ebenfalls eingetragen.` },
    ],
    body: (h) => `
<h2>Was das Register über Düsseldorf verrät</h2>
${h.table(['Kennzahl', 'Düsseldorf', 'Bund oder Rang'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `Platz ${rangEy} von ${h.num(ALL.length)}`],
  ['Balkonkraftwerke in Betrieb', h.num(C.balkon), ''],
  ['je 1 000 Einwohner', h.num(dichte(C), 1), `Bund ${h.num(dichteBund, 1)}`],
  ['Solaranlagen auf Gebäuden', h.num(C.gebaeude), ''],
  ['Stromspeicher', h.num(C.speicher), ''],
  ['Speicher je Gebäudeanlage', h.num(speicherQuote, 2), `Bund ${h.num(speicherQuoteBund, 2)}, Platz ${rangSpeicher}`],
  ['Volleinspeiser', h.pct(vollQuote, 1), ''],
], `Marktstammdatenregister, abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; PVGIS für die PLZ ${C.plz}; Einwohner nach Destatis.`, ['l', 'r', 'r'])}
<p>Zwei Werte stechen heraus. Auf fast jede Dachanlage kommt in Düsseldorf ein Speicher, und die Stadt hat zugleich eine der niedrigsten Dichten an Balkonkraftwerken. Wer in Düsseldorf ein eigenes Dach hat, setzt offenbar auf möglichst viel Eigenverbrauch; wer zur Miete wohnt, hat bisher seltener zum Steckergerät gegriffen.</p>

<h2>Der Akku am Balkon, durchgerechnet</h2>
<p>Ein Paar in Bilk, beide arbeiten teils von zu Hause, ${h.num(VERBRAUCH)} kWh im Jahr. Der Balkon im dritten Stock zeigt nach Südwesten und ist frei von Schatten. Das Gerät kostet ${h.eur(KOSTEN)}, der Akku kommt optional dazu. Die Lastprofile hinter dem Motor stammen aus den ${h.src('htw_lastprofile', 'Messreihen der HTW Berlin')}.</p>
${h.table(['Variante', 'selbst genutzt', 'Mehr als ohne Akku', 'Wert des Mehrs/Jahr', 'Ersparnis gesamt'], [
  ['ohne Akku', `${h.num(ohne.selbst)} kWh`, '', '', h.eur(ohne.ersparnisJahr)],
  [`Akku ${h.num(AKKU_KLEIN)} kWh`, `${h.num(klein.selbst)} kWh`, `${h.num(plus(klein))} kWh`, h.eur(wert(klein)), h.eur(klein.ersparnisJahr)],
  [`Akku ${h.num(AKKU_GROSS)} kWh`, `${h.num(gross.selbst)} kWh`, `${h.num(plus(gross))} kWh`, h.eur(wert(gross)), h.eur(gross.ersparnisJahr)],
], `${h.num(WP)} Wp senkrecht nach Südwesten, ${h.num(VA)} VA, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die zweite Kilowattstunde Speicher bringt weniger als die erste, weil an vielen Tagen schon der kleine Akku nicht voll wird. Ohne Akku ist das Gerät nach ${h.num(ohne.amortisationJahre ?? 0, 1)} Jahren bezahlt. Für den Speicher gilt eine eigene Rechnung: Sein Preis geteilt durch den Wert des Mehrs ergibt die Jahre bis zur Amortisation, und die sollten unter seiner erwarteten Lebensdauer liegen. Wie groß ein Speicher sein sollte, erklärt der ${h.a('stromspeicher-groesse', 'Ratgeber zur Speichergröße')}.</p>

<h2>Rheinische Nachbarn: Düsseldorf und Köln</h2>
<p>Die Stadtzentren liegen ${h.num(abstandKm)} Kilometer Luftlinie auseinander, beide in der Niederrheinischen Bucht, beide flach am Strom. Beim Ertrag trennt sie wenig: ${h.num(C.ey)} gegen ${h.num(K.ey)} kWh je kWp, am Südwestbalkon ${h.num(ohne.ertrag)} gegen ${h.num(koeln.ertrag)} kWh. Bei der Verbreitung schon: Köln hat ${h.num(dichte(K), 1)} Balkonkraftwerke je 1 000 Einwohner, Düsseldorf ${h.num(dichte(C), 1)}. Am Wetter kann der Unterschied nicht liegen.</p>

<h2>Niederrhein-Wetter: mild, aber grau im Winter</h2>
<p>Der PVGIS-Punkt der Innenstadt liegt auf ${h.num(C.elev)} Metern, offen für die Westwinde vom Atlantik. Die Winter sind mild, aber oft bedeckt. November bis Februar tragen ${h.pct(winter, 1)} zum Jahresertrag bei, Platz ${rangWinter} unter den Städten. Im Dezember erzeugt das Beispielgerät ${h.num(dezember, 1)} kWh, im März schon ${h.num(maerz)} kWh. Bei den Dächern zeigt ${h.pct(anteil('S'), 0)} der Anlagen hauptsächlich nach Süden, ${h.pct(anteil('SW'), 0)} nach Südwesten. Mieter haben nach ${h.src('bgb_554', '§ 554 BGB')} Anspruch auf die Erlaubnis; angemeldet wird nur im ${h.src('mastr_einheiten', 'Marktstammdatenregister')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-duesseldorf',
    nav: 'Düsseldorf',
    card: `${EN.num(C.speicher)} batteries for ${EN.num(C.gebaeude)} roof systems: is a battery worth adding to balcony solar in Düsseldorf?`,
    title: `Plug-in Solar Düsseldorf 2026: Yield, Battery and Saving`,
    description: `Plug-in solar Düsseldorf 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices and ${EN.num(C.speicher)} batteries in the register, the saving worked out with or without storage.`,
    h1: 'Plug-in solar in Düsseldorf: with or without a battery in 2026?',
    intro: `On a south-west balcony, ${EN.num(WP)} Wp produce ${EN.num(ohne.ertrag)} kWh a year in Düsseldorf; a ${EN.num(AKKU_KLEIN)} kWh battery brings ${EN.num(plus(klein))} kWh more of it into your own household.`,
    resume: `Düsseldorf sits just behind Cologne for solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of ${ALL.length} big cities. In the Market Master Data Register the city stands out for its batteries: ${EN.num(C.speicher)} storage units against ${EN.num(C.gebaeude)} building-mounted solar systems, ${EN.num(speicherQuote, 2)} per system and well above the national ${EN.num(speicherQuoteBund, 2)}. Plug-in devices (Balkonkraftwerke), by contrast, are rare: ${EN.num(C.balkon)} devices or ${EN.num(dichte(C), 1)} per 1,000 residents, rank ${rangDichte} among the cities. A ${EN.num(WP)} Wp device hung upright on a south-west balcony produces ${EN.num(ohne.ertrag)} kWh a year. A couple using ${EN.num(VERBRAUCH)} kWh consume ${EN.num(ohne.selbst)} kWh of it themselves and save ${EN.eur(ohne.ersparnisJahr)} at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. A ${EN.num(AKKU_KLEIN)} kWh battery would add ${EN.eur(wert(klein))} a year, a ${EN.num(AKKU_GROSS)} kWh one ${EN.eur(wert(gross))}. Whether storage pays therefore depends on its price.`,
    faqs: [
      { q: 'Is a battery for balcony solar worth it in Düsseldorf?', a: `Only if it is cheap. On a south-west balcony with ${EN.num(WP)} Wp and ${EN.num(VERBRAUCH)} kWh of consumption, a ${EN.num(AKKU_KLEIN)} kWh battery lifts self-used power by ${EN.num(plus(klein))} kWh, worth ${EN.eur(wert(klein))} a year. With ${EN.num(AKKU_GROSS)} kWh it is ${EN.eur(wert(gross))}. Divide the battery price by that amount and you know how many years it takes to pay for itself.` },
      { q: 'Does balcony solar in Düsseldorf produce as much as in Cologne?', a: `Almost. PVGIS gives ${EN.num(C.ey)} kWh per kWp for Düsseldorf and ${EN.num(K.ey)} for Cologne. A ${EN.num(WP)} Wp device hung upright facing south-west yields ${EN.num(ohne.ertrag)} kWh a year in Düsseldorf and ${EN.num(koeln.ertrag)} kWh in Cologne. The difference is smaller than a tree in front of the balcony would make. Both cities lie in the Rhineland at a similar low altitude.` },
      { q: 'How many solar batteries are there in Düsseldorf?', a: `The Market Master Data Register counts ${EN.num(C.speicher)} storage units in operation in Düsseldorf, against ${EN.num(C.gebaeude)} solar systems on buildings. That ratio of ${EN.num(speicherQuote, 2)} is one of the highest among the big cities (rank ${rangSpeicher} of ${ALL.length}); nationally it is ${EN.num(speicherQuoteBund, 2)}. The count covers every registered storage unit in the city, not only those attached to balcony devices; a battery on a plug-in system must be registered too.` },
    ],
    body: (h) => `
<h2>What the register reveals about Düsseldorf</h2>
${h.table(['Indicator', 'Düsseldorf', 'Germany or rank'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `rank ${rangEy} of ${h.num(ALL.length)}`],
  ['Plug-in devices in operation', h.num(C.balkon), ''],
  ['per 1,000 residents', h.num(dichte(C), 1), `Germany ${h.num(dichteBund, 1)}`],
  ['Solar systems on buildings', h.num(C.gebaeude), ''],
  ['Storage units', h.num(C.speicher), ''],
  ['Batteries per building system', h.num(speicherQuote, 2), `Germany ${h.num(speicherQuoteBund, 2)}, rank ${rangSpeicher}`],
  ['Full feed-in systems', h.pct(vollQuote, 1), ''],
], `Market Master Data Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; PVGIS for postcode ${C.plz}; population from Destatis.`, ['l', 'r', 'r'])}
<p>Two values stand out. In Düsseldorf almost every roof system comes with a battery, while the city has one of the lowest densities of plug-in devices. People with their own roof clearly aim for maximum self-consumption; renters have so far been slower to pick up a plug-in device.</p>

<h2>A balcony battery, worked through</h2>
<p>A couple in Bilk, both partly working from home, ${h.num(VERBRAUCH)} kWh a year. Their third-floor balcony faces south-west with no shade. The device costs ${h.eur(KOSTEN)}, the battery is optional. The load profiles behind the engine come from the ${h.src('htw_lastprofile', 'HTW Berlin measurement series')}.</p>
${h.table(['Option', 'Used at home', 'More than without', 'Value of the extra/year', 'Total saving'], [
  ['no battery', `${h.num(ohne.selbst)} kWh`, '', '', h.eur(ohne.ersparnisJahr)],
  [`${h.num(AKKU_KLEIN)} kWh battery`, `${h.num(klein.selbst)} kWh`, `${h.num(plus(klein))} kWh`, h.eur(wert(klein)), h.eur(klein.ersparnisJahr)],
  [`${h.num(AKKU_GROSS)} kWh battery`, `${h.num(gross.selbst)} kWh`, `${h.num(plus(gross))} kWh`, h.eur(wert(gross)), h.eur(gross.ersparnisJahr)],
], `${h.num(WP)} Wp upright facing south-west, ${h.num(VA)} VA, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The second kilowatt hour of storage adds less than the first, because on many days even the small battery does not fill up. Without a battery the device pays for itself in ${h.num(ohne.amortisationJahre ?? 0, 1)} years. The battery needs its own sum: its price divided by the value of the extra gives the years to break even, and those should be fewer than its expected lifetime. How big a battery should be is explained in the ${h.a('stromspeicher-groesse', 'guide to battery size')}.</p>

<h2>Rhineland neighbours: Düsseldorf and Cologne</h2>
<p>The two city centres are ${h.num(abstandKm)} kilometres apart as the crow flies, both in the Lower Rhine Basin, both flat along the river. Yield barely separates them: ${h.num(C.ey)} against ${h.num(K.ey)} kWh per kWp, ${h.num(ohne.ertrag)} against ${h.num(koeln.ertrag)} kWh on a south-west balcony. Uptake does: Cologne has ${h.num(dichte(K), 1)} plug-in devices per 1,000 residents, Düsseldorf ${h.num(dichte(C), 1)}. The weather cannot be the reason.</p>

<h2>Lower Rhine weather: mild but grey in winter</h2>
<p>The PVGIS point for the centre lies at ${h.num(C.elev)} metres, open to westerly winds from the Atlantic. Winters are mild but often overcast. November to February contribute ${h.pct(winter, 1)} of annual yield, rank ${rangWinter} among the cities. In December the example device produces ${h.num(dezember, 1)} kWh, by March already ${h.num(maerz)} kWh. On roofs, ${h.pct(anteil('S'), 0)} of systems face mainly south and ${h.pct(anteil('SW'), 0)} south-west. Tenants are entitled to permission under ${h.src('bgb_554', 'section 554 Civil Code')}; the only registration is in the ${h.src('mastr_einheiten', 'Market Master Data Register')}.</p>`,
  },
});

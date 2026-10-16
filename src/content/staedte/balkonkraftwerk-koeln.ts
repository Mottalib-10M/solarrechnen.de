import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, P, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Köln: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.koeln;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: Einpersonenhaushalt in Ehrenfeld, Ostbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 1500, KOSTEN = 450;
const calc = (az: number, tilt = 90) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: 0, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const ost = calc(-90), suedost = calc(-45), sued = calc(0), suedwest = calc(45), west = calc(90);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const teil = (c: City, ms: number[]) => ms.reduce((a, i) => a + c.em[i], 0) / summe(c);
const winterAnteil = (c: City) => teil(c, [10, 11, 0, 1]);
const winter = winterAnteil(C);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const ausrAnteil = (c: City, k: string) => c.ausrichtung[k] / Object.values(c.ausrichtung).reduce((a, x) => a + x, 0);
const anteil = (k: string) => ausrAnteil(C, k);
const anteilBund = (k: string) => B.ausrichtung[k as keyof typeof B.ausrichtung] / Object.values(B.ausrichtung).reduce((a, x) => a + x, 0);
const rangSued = [...ALL].sort((x, y) => ausrAnteil(x, 'S') - ausrAnteil(y, 'S')).findIndex((x) => x.name === C.name) + 1;
const nichtSued = 1 - anteil('S');
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const jan = ost.ertrag * C.em[0] / summe(C);
const jahreszeiten: Array<[string, string, number[]]> = [
  ['Frühling (März bis Mai)', 'Spring (March to May)', [2, 3, 4]],
  ['Sommer (Juni bis August)', 'Summer (June to August)', [5, 6, 7]],
  ['Herbst (September bis November)', 'Autumn (September to November)', [8, 9, 10]],
  ['Winter (Dezember bis Februar)', 'Winter (December to February)', [11, 0, 1]],
];

export default defineGuide({
  id: 'balkonkraftwerk-koeln',
  group: 'stadt',
  order: 103,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ausrichtung', 'photovoltaik-ost-west', 'balkonkraftwerk-lohnt-sich', 'balkonkraftwerk-zaehler'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'eeg_10a', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-koeln',
    nav: 'Köln',
    card: `${DE.num(C.ey)} kWh je kWp und Dächer, die selten genau nach Süden zeigen: ein Balkonkraftwerk in Köln, nach Lage gerechnet.`,
    title: `Balkonkraftwerk Köln 2026: Ertrag je Himmelsrichtung`,
    description: `Balkonkraftwerk Köln 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, Ost-, Süd- und Westbalkon im Vergleich, ${DE.num(C.balkon)} Geräte im Register und die Ersparnis für Singles.`,
    h1: 'Balkonkraftwerk in Köln: welche Lage wie viel bringt 2026',
    intro: `Selbst am Ostbalkon erzeugt ein Steckersolargerät mit ${DE.num(WP)} Wp in Köln rund ${DE.num(ost.ertrag)} kWh im Jahr und spart einem Einpersonenhaushalt ${DE.eur(ost.ersparnisJahr)}.`,
    resume: `Köln liegt beim Solarertrag im Mittelfeld: PVGIS rechnet für die Postleitzahl ${C.plz} in der Altstadt mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} Großstädten. Auffällig ist die Verteilung über das Jahr: November bis Februar bringen ${DE.pct(winter, 1)} des Ertrags, Platz ${rangWinter} im Vergleich, was zum milden Klima der Kölner Bucht passt. Noch auffälliger sind die Dächer. Nur ${DE.pct(anteil('S'))} der im Marktstammdatenregister erfassten Kölner Gebäudeanlagen zeigen hauptsächlich nach Süden, so wenig wie in keiner anderen der verglichenen Städte; ${DE.pct(anteil('SW'))} weisen nach Südwesten. Am Balkon gilt dasselbe: Wer nach Osten wohnt, erntet mit ${DE.num(WP)} Wp senkrecht ${DE.num(ost.ertrag)} kWh, nach Süden wären es ${DE.num(sued.ertrag)} kWh. Ein Single mit ${DE.num(VERBRAUCH)} kWh Verbrauch spart am Ostbalkon bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(ost.ersparnisJahr)} im Jahr. Eingetragen sind in Köln ${DE.num(C.balkon)} Balkonkraftwerke, ${DE.num(dichte, 1)} je 1 000 Einwohner.`,
    faqs: [
      { q: 'Bringt ein Ostbalkon in Köln genug Strom für ein Balkonkraftwerk?', a: `Ja. Senkrecht montiert liefern ${DE.num(WP)} Wp am Ostbalkon in Köln ${DE.num(ost.ertrag)} kWh im Jahr, ${DE.pct(ost.ertrag / sued.ertrag)} des Südbalkons. Für einen Single, der morgens Kaffee kocht und duscht, passt der Morgenstrom gut: Bei ${DE.num(VERBRAUCH)} kWh Verbrauch nutzt er ${DE.pct(ost.eigenAnteil)} selbst und spart ${DE.eur(ost.ersparnisJahr)} im Jahr. Bei ${DE.eur(KOSTEN)} Kaufpreis ist das Gerät nach ${DE.num(ost.amortisationJahre ?? 0, 1)} Jahren bezahlt.` },
      { q: 'Warum zeigen in Köln so wenige Solardächer nach Süden?', a: `Das Register sagt nur, wohin die Anlagen zeigen, nicht warum. Der Befund ist deutlich: ${DE.pct(anteil('S'))} der Kölner Gebäudeanlagen weisen hauptsächlich nach Süden, bundesweit ${DE.pct(anteilBund('S'))}. Wer ein Dach nach Südwesten, Westen oder Osten hat, belegt es in Köln trotzdem, ${DE.pct(nichtSued)} aller Anlagen haben eine andere Hauptausrichtung. Für Balkone gilt die Lehre ebenso: Nicht genau Süden ist kein Ausschlusskriterium.` },
      { q: 'Wie viel erzeugt ein Kölner Balkonkraftwerk im Januar?', a: `Am Ostbalkon mit ${DE.num(WP)} Wp rund ${DE.num(jan, 1)} kWh. Das ist wenig, aber in Köln vergleichsweise viel: Die Wintermonate November bis Februar tragen ${DE.pct(winter, 1)} zum Jahresertrag bei, Platz ${rangWinter} unter ${ALL.length} Großstädten. Grund ist das milde, oft offene Wetter im Rheintal, wie die PVGIS-Monatswerte für die Postleitzahl ${C.plz} zeigen.` },
    ],
    body: (h) => `
<h2>Kölner Sonnenbilanz in Kürze</h2>
<p>Die Stadt liegt in der Kölner Bucht, einer Tieflandsbucht am Rhein, die sich zwischen Eifel und Bergischem Land nach Norden öffnet. Der PVGIS-Punkt der Altstadt liegt auf ${h.num(C.elev)} Metern. Das Klima ist mild, Frosttage sind vergleichsweise selten, und im Winter liegt Köln beim Solarertrag weiter vorn als im Jahresmittel.</p>
${h.table(['Kennzahl', 'Köln', 'Bund'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh (Platz ${rangEy})`, ''],
  ['Anteil November bis Februar', `${h.pct(winter, 1)} (Platz ${rangWinter})`, ''],
  ['Gebäudeanlagen mit Hauptausrichtung Süd', h.pct(anteil('S'), 1), h.pct(anteilBund('S'), 1)],
  ['davon Südwest', h.pct(anteil('SW'), 1), h.pct(anteilBund('SW'), 1)],
  ['Ost-West-Anlagen', h.pct(anteil('OW'), 1), h.pct(anteilBund('OW'), 1)],
  ['Balkonkraftwerke je 1 000 Einwohner', h.num(dichte, 1), h.num(dichteBund, 1)],
], `PVGIS für die PLZ ${C.plz}; Marktstammdatenregister, abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; Destatis.`, ['l', 'r', 'r'])}

<h2>Köln baut nicht nach Süden</h2>
<p>Im ${h.src('mastr_einheiten', 'Marktstammdatenregister')} hat Köln unter den verglichenen Großstädten den geringsten Anteil an Dachanlagen mit Hauptausrichtung Süd (Platz ${rangSued} von unten). ${h.pct(nichtSued, 0)} der ${h.num(C.gebaeude)} Gebäudeanlagen schauen woandershin, am häufigsten nach Südwesten. Blockränder, Reihenhäuser und Straßen in allen Richtungen dürften dazu beitragen; belegen lässt sich das aus dem Register nicht. Sicher ist nur: Die Eigentümer bauen trotzdem.</p>
<p>Für Mieter mit Balkon ist das eine gute Nachricht. Wer zur Hofseite nach Osten oder Westen wohnt, steht in Köln nicht allein da, und der Ertrag reicht für eine ordentliche Ersparnis.</p>

<h2>Fünf Balkonlagen im Vergleich</h2>
${h.table(['Balkon, senkrecht', 'Ertrag', 'selbst genutzt', 'Ersparnis/Jahr'], [
  ['Ost', `${h.num(ost.ertrag)} kWh`, `${h.num(ost.selbst)} kWh`, h.eur(ost.ersparnisJahr)],
  ['Südost', `${h.num(suedost.ertrag)} kWh`, `${h.num(suedost.selbst)} kWh`, h.eur(suedost.ersparnisJahr)],
  ['Süd', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.eur(sued.ersparnisJahr)],
  ['Südwest', `${h.num(suedwest.ertrag)} kWh`, `${h.num(suedwest.selbst)} kWh`, h.eur(suedwest.ersparnisJahr)],
  ['West', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.eur(west.ersparnisJahr)],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, Verbrauch ${h.num(VERBRAUCH)} kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>Bei kleinem Verbrauch rücken die Lagen enger zusammen, als die Erträge vermuten lassen. Ein Single verbraucht mittags wenig, also landet ein großer Teil des Südstroms unvergütet im Netz. Ost- und Westbalkone treffen dagegen die Zeiten, in denen jemand zu Hause ist. Eine ausführliche Erklärung der Winkel gibt der ${h.a('balkonkraftwerk-ausrichtung', 'Ratgeber zur Ausrichtung')}.</p>

<h2>Wie sich der Kölner Ertrag übers Jahr verteilt</h2>
${h.table(['Jahreszeit', 'Anteil am Jahresertrag', `Ostbalkon, ${h.num(WP)} Wp`], jahreszeiten.map(([de, , ms]) => [de, h.pct(teil(C, ms), 1), `${h.num(ost.ertrag * teil(C, ms))} kWh`]), 'PVGIS-Monatswerte für die PLZ ' + C.plz + '.', ['l', 'r', 'r'])}
<p>Frühling und Sommer tragen den größten Teil. Der Herbst liefert ${h.pct(1 - teil(C, [8, 9, 10]) / teil(C, [2, 3, 4]), 0)} weniger als der Frühling, der Winter bleibt der schwächste Abschnitt, auch wenn er hier mehr hergibt als an der Küste.</p>

<h2>Ein Single in Ehrenfeld</h2>
<p>Altbauwohnung im zweiten Stock, Balkon nach Osten über dem Hof, ${h.num(VERBRAUCH)} kWh im Jahr. Das Gerät für ${h.eur(KOSTEN)} hängt senkrecht am Geländer. Es erzeugt ${h.num(ost.ertrag)} kWh, davon verbraucht die Bewohnerin ${h.num(ost.selbst)} kWh selbst. Nach ${h.num(ost.amortisationJahre ?? 0, 1)} Jahren ist der Kaufpreis wieder eingespielt. Die Erlaubnis des Vermieters steht ihr nach ${h.src('bgb_554', '§ 554 BGB')} zu. Läuft der alte Ferraris-Zähler noch, darf das Gerät nach ${h.src('eeg_10a', '§ 10a EEG')} bis zum Zählertausch daran betrieben werden; der Messstellenbetreiber kümmert sich um den Wechsel.</p>`,
  },
  en: {
    slug: 'plug-in-solar-cologne',
    nav: 'Cologne',
    card: `${EN.num(C.ey)} kWh per kWp and roofs that rarely face due south: balcony solar in Cologne, worked out by orientation.`,
    title: `Plug-in Solar Cologne 2026: Yield by Balcony Direction`,
    description: `Plug-in solar Cologne 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, east, south and west balconies compared, ${EN.num(C.balkon)} registered devices and the saving for singles.`,
    h1: 'Plug-in solar in Cologne: what each balcony direction gives in 2026',
    intro: `Even on an east-facing balcony, a ${EN.num(WP)} Wp plug-in device in Cologne produces about ${EN.num(ost.ertrag)} kWh a year and saves a single-person household ${EN.eur(ost.ersparnisJahr)}.`,
    resume: `Cologne sits mid-table for solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz} in the old town, rank ${rangEy} of ${ALL.length} big cities. The spread over the year stands out: November to February bring ${EN.pct(winter, 1)} of the yield, rank ${rangWinter} in the comparison, which fits the mild climate of the Cologne Lowland. The roofs stand out even more. Only ${EN.pct(anteil('S'))} of the city's building-mounted systems in the Market Master Data Register face mainly south, the lowest share of any city compared; ${EN.pct(anteil('SW'))} face south-west. Balconies follow the same logic: facing east, ${EN.num(WP)} Wp hung upright (Balkonkraftwerk) harvest ${EN.num(ost.ertrag)} kWh, facing south it would be ${EN.num(sued.ertrag)} kWh. A single person using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(ost.ersparnisJahr)} a year on an east balcony at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. Cologne has ${EN.num(C.balkon)} plug-in devices registered, ${EN.num(dichte, 1)} per 1,000 residents.`,
    faqs: [
      { q: 'Does an east-facing balcony in Cologne get enough sun for plug-in solar?', a: `Yes. Hung upright, ${EN.num(WP)} Wp on an east balcony in Cologne deliver ${EN.num(ost.ertrag)} kWh a year, ${EN.pct(ost.ertrag / sued.ertrag)} of a south balcony. For a single person who makes coffee and showers in the morning, that early power fits well: at ${EN.num(VERBRAUCH)} kWh of use, ${EN.pct(ost.eigenAnteil)} is consumed at home, saving ${EN.eur(ost.ersparnisJahr)} a year. At ${EN.eur(KOSTEN)} the device has paid for itself after ${EN.num(ost.amortisationJahre ?? 0, 1)} years.` },
      { q: 'Why do so few solar roofs in Cologne face south?', a: `The register records where systems face, not why. The finding is clear: ${EN.pct(anteil('S'))} of Cologne's building-mounted systems face mainly south, against ${EN.pct(anteilBund('S'))} nationally. People with roofs facing south-west, west or east fit panels anyway; ${EN.pct(nichtSued)} of all systems in the city have another main orientation. The same lesson applies to balconies: not facing due south is no reason to give up.` },
      { q: 'How much does a Cologne balcony system produce in January?', a: `On an east balcony with ${EN.num(WP)} Wp, about ${EN.num(jan, 1)} kWh. That is little, but relatively much for Germany: the winter months November to February contribute ${EN.pct(winter, 1)} of annual yield, rank ${rangWinter} among ${ALL.length} big cities. The reason is the mild, often open weather in the Rhine valley, as the PVGIS monthly values for postcode ${C.plz} show.` },
    ],
    body: (h) => `
<h2>Cologne's solar balance at a glance</h2>
<p>The city lies in the Cologne Lowland (Kölner Bucht), a low basin on the Rhine that opens northwards between the Eifel and the Bergisches Land hills. The PVGIS point for the old town is at ${h.num(C.elev)} metres. The climate is mild, frost days are comparatively rare, and in winter Cologne ranks higher for solar yield than over the year as a whole.</p>
${h.table(['Indicator', 'Cologne', 'Germany'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh (rank ${rangEy})`, ''],
  ['Share November to February', `${h.pct(winter, 1)} (rank ${rangWinter})`, ''],
  ['Building systems facing mainly south', h.pct(anteil('S'), 1), h.pct(anteilBund('S'), 1)],
  ['facing south-west', h.pct(anteil('SW'), 1), h.pct(anteilBund('SW'), 1)],
  ['East-west systems', h.pct(anteil('OW'), 1), h.pct(anteilBund('OW'), 1)],
  ['Plug-in devices per 1,000 residents', h.num(dichte, 1), h.num(dichteBund, 1)],
], `PVGIS for postcode ${C.plz}; Market Master Data Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; Destatis.`, ['l', 'r', 'r'])}

<h2>Cologne does not build facing south</h2>
<p>In the ${h.src('mastr_einheiten', 'Market Master Data Register')}, Cologne has the smallest share of roof systems facing mainly south of all big cities compared (rank ${rangSued} from the bottom). ${h.pct(nichtSued, 0)} of its ${h.num(C.gebaeude)} building-mounted systems look elsewhere, most often south-west. Perimeter blocks, terraced houses and streets running every which way probably play a part; the register cannot prove it. What is certain is that owners install anyway.</p>
<p>For tenants with a balcony that is good news. If you live on the courtyard side facing east or west, you are in good company in Cologne, and the yield is enough for a decent saving.</p>

<h2>Five balcony positions compared</h2>
${h.table(['Balcony, upright', 'Yield', 'Used at home', 'Saving/year'], [
  ['East', `${h.num(ost.ertrag)} kWh`, `${h.num(ost.selbst)} kWh`, h.eur(ost.ersparnisJahr)],
  ['South-east', `${h.num(suedost.ertrag)} kWh`, `${h.num(suedost.selbst)} kWh`, h.eur(suedost.ersparnisJahr)],
  ['South', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.eur(sued.ersparnisJahr)],
  ['South-west', `${h.num(suedwest.ertrag)} kWh`, `${h.num(suedwest.selbst)} kWh`, h.eur(suedwest.ersparnisJahr)],
  ['West', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.eur(west.ersparnisJahr)],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, consumption ${h.num(VERBRAUCH)} kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>With low consumption the positions sit closer together than the yields suggest. A single person uses little at midday, so a large part of south-facing power ends up in the grid unpaid. East and west balconies, by contrast, hit the hours when someone is home. The angles are explained in detail in the ${h.a('balkonkraftwerk-ausrichtung', 'orientation guide')}.</p>

<h2>How Cologne's yield spreads over the year</h2>
${h.table(['Season', 'Share of annual yield', `East balcony, ${h.num(WP)} Wp`], jahreszeiten.map(([, en, ms]) => [en, h.pct(teil(C, ms), 1), `${h.num(ost.ertrag * teil(C, ms))} kWh`]), 'PVGIS monthly values for postcode ' + C.plz + '.', ['l', 'r', 'r'])}
<p>Spring and summer carry most of it. Autumn delivers ${h.pct(1 - teil(C, [8, 9, 10]) / teil(C, [2, 3, 4]), 0)} less than spring; winter remains the weakest stretch, even if it gives more here than on the coast.</p>

<h2>A single person in Ehrenfeld</h2>
<p>A period flat on the second floor, balcony facing east over the courtyard, ${h.num(VERBRAUCH)} kWh a year. The ${h.eur(KOSTEN)} device hangs upright on the railing. It produces ${h.num(ost.ertrag)} kWh, of which the tenant uses ${h.num(ost.selbst)} kWh herself. After ${h.num(ost.amortisationJahre ?? 0, 1)} years the purchase price has been earned back. She is entitled to her landlord's permission under ${h.src('bgb_554', 'section 554 Civil Code')}. If the old spinning-disc meter is still in place, the device may run on it until the meter is replaced under ${h.src('eeg_10a', 'section 10a EEG')}; the metering operator handles the swap.</p>`,
  },
});

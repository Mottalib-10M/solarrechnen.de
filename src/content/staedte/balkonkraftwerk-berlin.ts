import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Berlin: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const C = (ST.staedte as Record<string, City>).berlin;
const ALL = Object.values(ST.staedte as Record<string, City>);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
const b = (tilt: number, az: number, sp = 0) => rechneBalkon({ ort, modulWp: 900, wechselrichterVa: 800, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: sp, verbrauchKwh: 2000, preisCt: STROMPREIS_CT, kostenEur: 450 });
const sued = b(90, 0), west = b(90, 90), ost = b(90, -90), schraeg = b(35, 0);
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const winter = (C.em[10] + C.em[11] + C.em[0] + C.em[1]) / C.em.reduce((a, x) => a + x, 0);
const ausr = C.ausrichtung; const ausrSumme = Object.values(ausr).reduce((a, x) => a + x, 0);
const anteil = (k: string) => ausr[k] / ausrSumme;
const dezember = sued.ertrag * C.em[11] / C.em.reduce((a, x) => a + x, 0);

export default defineGuide({
  id: 'balkonkraftwerk-berlin',
  group: 'stadt',
  order: 100,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mieter', 'balkonkraftwerk-anmelden', 'balkonkraftwerk-mit-speicher'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-berlin',
    nav: 'Berlin',
    card: `${DE.num(C.ey)} kWh je kWp, ${DE.num(C.balkon)} Balkonkraftwerke im Register: was ein Gerät in Berlin bringt.`,
    title: `Balkonkraftwerk Berlin 2026: Ertrag und Ersparnis je Balkon`,
    description: `Balkonkraftwerk in Berlin 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Marktstammdatenregister, Ertrag je Ausrichtung und Ihre Ersparnis im Jahr.`,
    h1: 'Balkonkraftwerk in Berlin: Ertrag und Ersparnis 2026',
    intro: `900 Wp senkrecht am Südbalkon bringen in Berlin rund ${DE.num(sued.ertrag)} kWh im Jahr und sparen bei 2 000 kWh Verbrauch ${DE.eur(sued.ersparnisJahr)}.`,
    resume: `Berlin liegt beim Solarertrag im Mittelfeld der deutschen Großstädte: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} der hier verglichenen Städte. Ein Balkonkraftwerk mit zwei Modulen zu 450 Wp, senkrecht am Geländer nach Süden, erzeugt damit rund ${DE.num(sued.ertrag)} kWh im Jahr; nach Westen sind es ${DE.num(west.ertrag)} kWh, nach Osten ${DE.num(ost.ertrag)} kWh. Ein Zweipersonenhaushalt mit 2 000 kWh Verbrauch nutzt beim Südbalkon ${DE.pct(sued.eigenAnteil)} davon selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(sued.ersparnisJahr)} im Jahr. Im Marktstammdatenregister sind in Berlin ${DE.num(C.balkon)} Steckersolargeräte in Betrieb eingetragen, ${DE.num(dichte, 1)} je 1 000 Einwohner und damit deutlich weniger als im Bundesschnitt von ${DE.num(dichteBund, 1)}: In einer Stadt der Mietwohnungen hängt die Verbreitung weniger an der Sonne als an Vermietern und Balkonen.`,
    faqs: [
      { q: 'Wie viel Strom bringt ein Balkonkraftwerk in Berlin im Winter?', a: `Wenig: November bis Februar liefern in Berlin zusammen nur ${DE.pct(winter)} des Jahresertrags, im Dezember rund ${DE.num(dezember)} kWh bei 900 Wp senkrecht nach Süden. Senkrechte Module verlieren im Winter weniger als flache, weil sie die tiefe Sonne besser treffen. Die Ersparnis entsteht fast ganz zwischen März und Oktober.` },
      { q: 'Brauche ich in Berlin eine Genehmigung für das Balkonkraftwerk?', a: 'Eine Baugenehmigung braucht ein steckerfertiges Gerät am Balkon in der Regel nicht; in denkmalgeschützten Häusern und Erhaltungsgebieten kann der Bezirk mitreden. Als Mieter haben Sie seit Oktober 2024 einen Anspruch auf die Erlaubnis des Vermieters nach § 554 BGB. Angemeldet wird nur im Marktstammdatenregister, nicht bei Stromnetz Berlin.' },
      { q: 'Lohnt sich ein Westbalkon in Berlin?', a: `Ja, mit Abstrichen beim Ertrag: ${DE.num(west.ertrag)} statt ${DE.num(sued.ertrag)} kWh im Jahr bei 900 Wp senkrecht. Dafür fällt der Strom in den Nachmittag und frühen Abend, wenn Berufstätige zu Hause sind. Der Eigenverbrauchsanteil liegt deshalb bei ${DE.pct(west.eigenAnteil)}, die Ersparnis bei ${DE.eur(west.ersparnisJahr)} im Jahr.` },
    ],
    body: (h) => `
<h2>Was die Berliner Daten zeigen</h2>
${h.table(['Kennzahl', 'Berlin', 'Quelle'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `PVGIS, PLZ ${C.plz}`],
  [`Rang unter ${h.num(ALL.length)} Großstädten`, `${rangEy}`, 'PVGIS'],
  ['Anteil November bis Februar', h.pct(winter, 1), 'PVGIS, Monatswerte'],
  ['Balkonkraftwerke in Betrieb', h.num(C.balkon), 'Marktstammdatenregister'],
  ['je 1 000 Einwohner', `${h.num(dichte, 1)} (Bund ${h.num(dichteBund, 1)})`, 'MaStR, Destatis'],
  ['Solaranlagen auf Gebäuden', h.num(C.gebaeude), 'Marktstammdatenregister'],
  ['davon Hauptausrichtung Süd', h.pct(anteil('S'), 0), 'Marktstammdatenregister'],
], `Register abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; Einwohner nach Destatis.`, ['l', 'r', 'l'])}

<h2>Der Berliner Balkon: viel Westen, viel Geländer</h2>
<p>Die Berliner Gründerzeit- und Plattenbauten haben ihre Balkone dort, wo die Straße verläuft, nicht dort, wo die Sonne steht. Wer zur Hofseite nach Westen wohnt, verliert gegenüber dem Südbalkon gut ein Fünftel des Ertrags, gewinnt aber Nachmittagsstrom. Bei Dachanlagen ist das Bild anders: Unter den ${h.num(C.gebaeude)} registrierten Gebäudeanlagen der Stadt zeigt ${h.pct(anteil('S'), 0)} hauptsächlich nach Süden, ${h.pct(anteil('OW'), 0)} sind Ost-West-Anlagen. Auf dem Balkon entscheidet die Wohnung, auf dem Dach der Planer.</p>
<p>Aufgeständert mit 35 Grad brächten dieselben Module am Südbalkon ${h.num(schraeg.ertrag)} statt ${h.num(sued.ertrag)} kWh. Am Geländer ist das selten erlaubt, und der Mehrertrag fällt vor allem in die Mittagsstunden des Sommers, in denen ein kleiner Haushalt ohnehin einspeist. Für die meisten Berliner Wohnungen bleibt die senkrechte Montage die vernünftige Wahl.</p>

<h2>Warum Berlin weniger Balkonkraftwerke hat als das Land</h2>
<p>Mit ${h.num(dichte, 1)} Geräten je 1 000 Einwohner liegt Berlin klar unter dem Bundesschnitt. Das hat wenig mit dem Wetter zu tun: Der Ertrag je kWp ist so hoch wie in vielen Landkreisen, die viel mehr Geräte haben. Entscheidend sind die Wohnverhältnisse. Fast alle Berliner wohnen zur Miete, viele Häuser gehören großen Gesellschaften, und bis Oktober 2024 konnten Vermieter ein Gerät ohne Begründung ablehnen. Seit der Neufassung von ${h.src('bgb_554', '§ 554 BGB')} müssen sie es erlauben, wenn nichts Unzumutbares dagegen spricht; mit diesem Anspruch im Rücken lohnt die Anfrage beim Vermieter.</p>
<p>Wer neu anfängt, registriert das Gerät binnen eines Monats im ${h.src('mastr_einheiten', 'Marktstammdatenregister')}; die Daten dieser Seite stammen aus genau dieser öffentlichen Übersicht. Einen Zählertausch muss niemand selbst beauftragen.</p>

<h2>Ein Rechenbeispiel aus Mitte</h2>
<p>Eine Wohnung in Berlin-Mitte, zwei Personen, 2 000 kWh im Jahr, Balkon nach Süden im dritten Stock, keine Bäume davor. Das Gerät kostet ${h.eur(450)}. Es erzeugt ${h.num(sued.ertrag)} kWh, davon nutzt der Haushalt ${h.num(sued.selbst)} kWh selbst, der Rest fließt unvergütet ins Netz. Bei ${h.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde hat es sich nach ${h.num(sued.amortisationJahre ?? 0, 1)} Jahren bezahlt. Mit einem Speicher von 1,5 kWh stiege der selbst genutzte Strom auf ${h.num(b(90, 0, 1.5).selbst)} kWh; ob sich das rechnet, zeigt der ${h.a('balkonkraftwerk-mit-speicher', 'Speicher-Vergleich')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-berlin',
    nav: 'Berlin',
    card: `${EN.num(C.ey)} kWh per kWp, ${EN.num(C.balkon)} plug-in devices registered: what a balcony system earns in Berlin.`,
    title: `Plug-in Solar Berlin 2026: Yield and Saving per Balcony`,
    description: `Balcony solar in Berlin 2026: ${EN.num(C.ey)} kWh per kWp according to PVGIS, ${EN.num(C.balkon)} devices in the federal register, the yield by orientation, your yearly saving.`,
    h1: 'Plug-in solar in Berlin: yield and saving in 2026',
    intro: `900 Wp hanging upright on a south-facing balcony produce about ${EN.num(sued.ertrag)} kWh a year in Berlin and save ${EN.eur(sued.ersparnisJahr)} for a household using 2,000 kWh.`,
    resume: `Berlin sits mid-table among Germany's big cities for solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of the ${ALL.length} cities compared here. A plug-in system (Balkonkraftwerk) with two 450 Wp panels hanging upright on a south-facing railing therefore produces about ${EN.num(sued.ertrag)} kWh a year; facing west it is ${EN.num(west.ertrag)} kWh, facing east ${EN.num(ost.ertrag)} kWh. A two-person household using 2,000 kWh uses ${EN.pct(sued.eigenAnteil)} of the south-balcony output itself and saves ${EN.eur(sued.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. The federal Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices in operation in Berlin, ${EN.num(dichte, 1)} per 1,000 residents, well below the national ${EN.num(dichteBund, 1)}: in a city of renters, uptake depends less on the sun than on landlords and balconies.`,
    faqs: [
      { q: 'How much does balcony solar produce in Berlin in winter?', a: `Little: November to February together deliver only ${EN.pct(winter)} of the annual yield in Berlin, about ${EN.num(dezember)} kWh in December for 900 Wp upright facing south. Upright panels lose less in winter than flat ones because they catch the low sun better. Almost all of the saving is made between March and October.` },
      { q: 'Do I need a permit for balcony solar in Berlin?', a: 'A plug-in device on a balcony does not normally need building permission; in listed buildings and conservation areas the district office may have a say. As a tenant you have had a right to your landlord’s permission since October 2024 under section 554 of the Civil Code. The only registration is in the Market Master Data Register, not with Stromnetz Berlin.' },
      { q: 'Is a west-facing balcony in Berlin worth it?', a: `Yes, with less yield: ${EN.num(west.ertrag)} instead of ${EN.num(sued.ertrag)} kWh a year for 900 Wp upright. In return the power arrives in the afternoon and early evening, when working people are home. The self-consumption share is therefore ${EN.pct(west.eigenAnteil)} and the saving ${EN.eur(west.ersparnisJahr)} a year.` },
    ],
    body: (h) => `
<h2>What the Berlin data show</h2>
${h.table(['Indicator', 'Berlin', 'Source'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `PVGIS, postcode ${C.plz}`],
  [`Rank among ${h.num(ALL.length)} big cities`, `${rangEy}`, 'PVGIS'],
  ['Share November to February', h.pct(winter, 1), 'PVGIS monthly values'],
  ['Plug-in devices in operation', h.num(C.balkon), 'Market Master Data Register'],
  ['per 1,000 residents', `${h.num(dichte, 1)} (Germany ${h.num(dichteBund, 1)})`, 'MaStR, Destatis'],
  ['Solar systems on buildings', h.num(C.gebaeude), 'Market Master Data Register'],
  ['of which mainly facing south', h.pct(anteil('S'), 0), 'Market Master Data Register'],
], `Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; population from Destatis.`, ['l', 'r', 'l'])}

<h2>The Berlin balcony: often west, nearly always a railing</h2>
<p>Berlin's 19th-century tenements and prefab estates put their balconies where the street runs, not where the sun is. If yours faces the courtyard to the west, you lose a good fifth of the yield compared with a south balcony but gain afternoon power. Roofs look different: of the ${h.num(C.gebaeude)} building-mounted systems registered in the city, ${h.pct(anteil('S'), 0)} face mainly south and ${h.pct(anteil('OW'), 0)} are east-west systems. On a balcony the flat decides, on a roof the planner.</p>
<p>Tilted at 35 degrees, the same panels on a south balcony would give ${h.num(schraeg.ertrag)} instead of ${h.num(sued.ertrag)} kWh. That is rarely allowed on a railing, and the extra comes mostly at summer middays, when a small household exports anyway. For most Berlin flats, hanging the panels upright remains the sensible choice.</p>

<h2>Why Berlin has fewer devices than the country</h2>
<p>At ${h.num(dichte, 1)} devices per 1,000 residents, Berlin is well below the German average. The weather is not the reason: yield per kWp is as high as in many rural districts with far more devices. Housing is. Almost everyone in Berlin rents, many buildings belong to large landlords, and until October 2024 a landlord could refuse without giving reasons. Since the new ${h.src('bgb_554', 'section 554 Civil Code')}, they must allow it unless it is unreasonable for them; with that right behind you, asking is worth it.</p>
<p>Newcomers register the device within one month in the ${h.src('mastr_einheiten', 'Market Master Data Register')}; the figures on this page come from that very public list. Nobody has to order a meter change themselves.</p>

<h2>A worked example from Mitte</h2>
<p>A flat in Berlin-Mitte, two people, 2,000 kWh a year, a south-facing balcony on the third floor with no trees in front. The device costs ${h.eur(450)}. It produces ${h.num(sued.ertrag)} kWh, of which the household uses ${h.num(sued.selbst)} kWh itself; the rest flows into the grid unpaid. At ${h.num(STROMPREIS_CT, 1)} cents per kWh it pays for itself after ${h.num(sued.amortisationJahre ?? 0, 1)} years. With a 1.5 kWh battery, self-used power would rise to ${h.num(b(90, 0, 1.5).selbst)} kWh; whether that pays is shown by the ${h.a('balkonkraftwerk-mit-speicher', 'battery comparison')}.</p>`,
  },
});

import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Nürnberg: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.nuernberg;
const M = STAEDTE.muenchen;
const D = STAEDTE.dresden;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!, ortM = ortVonPlz(M.plz)!, ortD = ortVonPlz(D.plz)!;
/** Beispiel: Rentnerpaar in Gostenhof, Ostbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 2500, KOSTEN = 450;
const calc = (o: typeof ort, tilt: number, az: number, sp = 0) => rechneBalkon({ ort: o, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: sp, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const sued = calc(ort, 90, 0), ost = calc(ort, 90, -90), west = calc(ort, 90, 90), schraeg = calc(ort, 35, 0);
const suedM = calc(ortM, 90, 0), suedD = calc(ortD, 90, 0), schraegD = calc(ortD, 35, 0);
const SPEICHER = [0, 1, 2];
const ostSp = SPEICHER.map((s) => calc(ort, 90, -90, s));
/** Verhältnis senkrecht zu 35° Süd: wie viel der Dachneigung am Geländer übrig bleibt. */
const faktor = sued.ertrag / schraeg.ertrag, faktorD = suedD.ertrag / schraegD.ertrag;
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangEyM = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === M.name) + 1;
const dichte = (c: City) => (c.balkon / c.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const ausrAnteil = (c: City, k: string) => c.ausrichtung[k] / Object.values(c.ausrichtung).reduce((a, x) => a + x, 0);
const rangSued = [...ALL].sort((x, y) => ausrAnteil(y, 'S') - ausrAnteil(x, 'S')).findIndex((x) => x.name === C.name) + 1;
const speicherQuote = (c: { speicher: number; gebaeude: number }) => c.speicher / c.gebaeude;
const rangSpeicher = [...ALL].sort((x, y) => speicherQuote(y) - speicherQuote(x)).findIndex((x) => x.name === C.name) + 1;
const vollQuote = (c: { voll: number; gebaeude: number }) => c.voll / c.gebaeude;

export default defineGuide({
  id: 'balkonkraftwerk-nuernberg',
  group: 'stadt',
  order: 110,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-mit-speicher', 'balkonkraftwerk-muenchen', 'balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mieter'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'weg_20', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-nuernberg',
    nav: 'Nürnberg',
    card: `${DE.num(C.ey)} kWh je kWp und mehr Geräte je Einwohner als München: was ein Balkonkraftwerk in Nürnberg bringt.`,
    title: `Balkonkraftwerk Nürnberg 2026: Ertrag, Speicher, Ersparnis`,
    description: `Balkonkraftwerk Nürnberg 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, ${DE.num(C.balkon)} Geräte im Register, Ost- und Westbalkon, was ein kleiner Speicher bringt und Ihre Ersparnis.`,
    h1: 'Balkonkraftwerk in Nürnberg: Ertrag und Ersparnis 2026',
    intro: `Am Ostbalkon erzeugen ${DE.num(WP)} Wp in Nürnberg rund ${DE.num(ost.ertrag)} kWh im Jahr und sparen einem Paar mit ${DE.num(VERBRAUCH)} kWh Verbrauch ${DE.eur(ost.ersparnisJahr)}.`,
    resume: `Nürnberg steht beim Solarertrag im oberen Mittelfeld: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length} Großstädten, während München mit ${DE.num(M.ey)} kWh auf Platz ${rangEyM} liegt. Bei der Verbreitung ist es umgekehrt: Im Marktstammdatenregister stehen in Nürnberg ${DE.num(C.balkon)} Steckersolargeräte, ${DE.num(dichte(C), 1)} je 1 000 Einwohner, in München nur ${DE.num(dichte(M), 1)}; der Bund liegt bei ${DE.num(dichteBund, 1)}. Ein Balkonkraftwerk mit ${DE.num(WP)} Wp senkrecht nach Süden liefert in Nürnberg rund ${DE.num(sued.ertrag)} kWh, nach Osten ${DE.num(ost.ertrag)} kWh, nach Westen ${DE.num(west.ertrag)} kWh. Ein Paar mit ${DE.num(VERBRAUCH)} kWh Verbrauch nutzt am Ostbalkon ${DE.pct(ost.eigenAnteil)} des Stroms selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(ost.ersparnisJahr)} im Jahr; ${DE.eur(KOSTEN)} Anschaffung sind nach ${DE.num(ost.amortisationJahre ?? 0, 1)} Jahren zurück. Ein Speicher mit ${DE.num(SPEICHER[2])} kWh hebt die Ersparnis auf ${DE.eur(ostSp[2].ersparnisJahr)}. Im Register haben Nürnberger Dachanlagen auffällig selten einen Batteriespeicher: ${DE.num(speicherQuote(C), 2)} je Anlage, Platz ${rangSpeicher} im Vergleich.`,
    faqs: [
      { q: 'Bringt ein Balkonkraftwerk in Nürnberg weniger als in München?', a: `Ja, etwas. Senkrecht nach Süden erzeugt ein Gerät mit ${DE.num(WP)} Wp in Nürnberg ${DE.num(sued.ertrag)} kWh, in München ${DE.num(suedM.ertrag)} kWh. Bei ${DE.num(VERBRAUCH)} kWh Verbrauch ist der Unterschied in der Ersparnis klein, ${DE.eur(sued.ersparnisJahr)} gegenüber ${DE.eur(suedM.ersparnisJahr)} im Jahr, weil ein Teil des Münchner Mehrertrags mittags ohnehin ins Netz fließt. Beide Werte stammen aus PVGIS für die jeweilige Innenstadt-Postleitzahl.` },
      { q: 'Lohnt sich ein Speicher zum Balkonkraftwerk in Nürnberg?', a: `Er hebt den selbst genutzten Strom am Ostbalkon von ${DE.num(ostSp[0].selbst)} auf ${DE.num(ostSp[1].selbst)} kWh mit ${DE.num(SPEICHER[1])} kWh Kapazität und auf ${DE.num(ostSp[2].selbst)} kWh mit ${DE.num(SPEICHER[2])} kWh. Das sind ${DE.eur(ostSp[1].ersparnisJahr - ostSp[0].ersparnisJahr)} beziehungsweise ${DE.eur(ostSp[2].ersparnisJahr - ostSp[0].ersparnisJahr)} mehr im Jahr. Teilen Sie den Aufpreis des Speichers durch diesen Betrag: Liegt das Ergebnis über der erwarteten Lebensdauer der Batterie, rechnet er sich nicht.` },
      { q: 'Ist ein Ostbalkon in Nürnberg schlechter als ein Westbalkon?', a: `Nach den Daten nicht. Mit ${DE.num(WP)} Wp senkrecht erzeugt ein Ostbalkon in Nürnberg ${DE.num(ost.ertrag)} kWh, ein Westbalkon ${DE.num(west.ertrag)} kWh im Jahr. Der Westbalkon liefert allerdings zur Zeit des Abendessens, der Ostbalkon zum Frühstück. Bei ${DE.num(VERBRAUCH)} kWh Verbrauch spart der Ostbalkon ${DE.eur(ost.ersparnisJahr)}, der Westbalkon ${DE.eur(west.ersparnisJahr)}. Entscheidend ist, wann im Haushalt Strom läuft.` },
      { q: 'Darf ich an einem denkmalgeschützten Haus in Nürnberg ein Balkonkraftwerk anbringen?', a: `Möglicherweise nur mit Erlaubnis. Veränderungen an Baudenkmälern brauchen in Bayern eine denkmalrechtliche Erlaubnis, zuständig ist in Nürnberg die Stadt als untere Denkmalschutzbehörde. Fragen Sie dort vor dem Kauf nach, besonders bei Fassaden zur Straße. Unabhängig davon brauchen Mieter die Zustimmung des Vermieters nach § 554 BGB und Wohnungseigentümer einen Beschluss der Gemeinschaft nach § 20 WEG, auf den beide einen Anspruch haben.` },
    ],
    body: (h) => `
<h2>Franken und Oberbayern im Datenvergleich</h2>
${h.table(['Kennzahl', 'Nürnberg', 'München'], [
  ['PVGIS-Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `${h.num(M.ey)} kWh`],
  [`Rang unter ${h.num(ALL.length)} Großstädten`, `${rangEy}`, `${rangEyM}`],
  ['Anteil November bis Februar', h.pct(winterAnteil(C), 1), h.pct(winterAnteil(M), 1)],
  ['Steckersolargeräte je 1 000 Einwohner', h.num(dichte(C), 1), h.num(dichte(M), 1)],
  ['Batteriespeicher je Gebäudeanlage', h.num(speicherQuote(C), 2), h.num(speicherQuote(M), 2)],
  ['Gebäudeanlagen in Volleinspeisung', h.pct(vollQuote(C), 0), h.pct(vollQuote(M), 0)],
  ['Dachanlagen hauptsächlich nach Süden', h.pct(ausrAnteil(C, 'S'), 0), h.pct(ausrAnteil(M, 'S'), 0)],
], `${h.src('pvgis', 'PVGIS')} je Innenstadt-PLZ; ${h.src('mastr_einheiten', 'Marktstammdatenregister')}, Abruf ${h.date(ST.source.mastr_retrieved_at)}; Einwohner: ${h.src('destatis_gv', 'Destatis')}. Bund: ${h.num(dichteBund, 1)} Geräte je 1 000 Einwohner.`, ['l', 'r', 'r'])}
<p>Die beiden größten bayerischen Städte trennt beim Ertrag mehr als bei der Verbreitung: München hat mehr Sonne, Nürnberg mehr Balkonkraftwerke je Einwohner. Wer aus München nach Franken zieht oder umgekehrt, sollte deshalb nicht die Zahlen der anderen Stadt übernehmen, sondern mit der eigenen Postleitzahl rechnen. Der Vergleich mit der Landeshauptstadt steht ausführlich auf der Seite ${h.a('balkonkraftwerk-muenchen', 'Balkonkraftwerk München')}.</p>

<h2>Senkrecht am Geländer: wo Nürnberg Boden verliert</h2>
<p>Bei 35 Grad Süd liegen Nürnberg und Dresden praktisch gleichauf, ${h.num(C.ey)} gegen ${h.num(D.ey)} kWh je kWp. Hängen die Module senkrecht, ändert sich das Bild: In Nürnberg bleiben ${h.pct(faktor, 0)} des Ertrags einer schrägen Montage, in Dresden ${h.pct(faktorD, 0)}. Am Südbalkon sind das ${h.num(sued.ertrag)} gegen ${h.num(suedD.ertrag)} kWh. Die Umrechnung auf andere Neigungen beruht auf eigenen PVGIS-Abfragen für jede Großregion, und für die Region um Nürnberg ergeben sie für senkrechte Flächen einen kleineren Faktor als für das Elbtal.</p>
<p>Wer einen Südbalkon hat und die Module neigen darf, gewinnt in Nürnberg deshalb etwas mehr als anderswo: ${h.num(schraeg.ertrag)} statt ${h.num(sued.ertrag)} kWh. Ob eine Aufständerung am Geländer erlaubt und sicher ist, hängt von Brüstung, Windlast und Vermieter ab; Hinweise dazu gibt der Ratgeber zur ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung')}.</p>

<h2>Frühstücks- oder Abendstrom</h2>
<p>Ost- und Westbalkon liegen in Nürnberg nah beieinander, der Ostbalkon mit ${h.num(ost.ertrag)} kWh sogar knapp vorn, der Westbalkon mit ${h.num(west.ertrag)} kWh dahinter. Beide liefern ${h.pct(1 - ost.ertrag / sued.ertrag, 0)} beziehungsweise ${h.pct(1 - west.ertrag / sued.ertrag, 0)} weniger als ein Südbalkon, nutzen ihren Strom aber zu einem größeren Teil selbst, weil er nicht in der Mittagsspitze anfällt. Bei Ostbalkonen lohnt es, Waschmaschine und Geschirrspüler auf den Vormittag zu legen; bei Westbalkonen fällt der Strom in die Zeit, in der gekocht wird.</p>

<h2>Ein kleiner Speicher, nachgerechnet</h2>
<p>Unter den Großstädten haben Nürnbergs Dachanlagen mit ${h.num(speicherQuote(C), 2)} Batteriespeichern je Anlage einen der niedrigsten Werte, Platz ${rangSpeicher} von ${h.num(ALL.length)}. Für das Balkonkraftwerk sagt das nichts über den Nutzen eines Speichers; der hängt am Verbrauch. Für ein Paar mit ${h.num(VERBRAUCH)} kWh am Ostbalkon:</p>
${h.table(['Speicher', 'selbst genutzt', 'Eigenverbrauchsanteil', 'Ersparnis im Jahr'], SPEICHER.map((s, i) => [s === 0 ? 'ohne' : `${h.num(s)} kWh`, `${h.num(ostSp[i].selbst)} kWh`, h.pct(ostSp[i].eigenAnteil, 0), h.eur(ostSp[i].ersparnisJahr)]), `${h.num(WP)} Wp senkrecht nach Osten, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>Der Mehrbetrag je Jahr ist die Obergrenze dessen, was der Speicher jährlich kosten darf. Die Gegenrechnung mit Anschaffungspreis und Lebensdauer finden Sie im ${h.a('balkonkraftwerk-mit-speicher', 'Speicher-Vergleich')}.</p>

<h2>Sandstein, Fachwerk und Denkmalschutz</h2>
<p>In der Altstadt innerhalb der Stadtmauer und in Teilen der Gründerzeitviertel stehen viele Häuser unter Denkmalschutz. Dort kann schon eine Halterung an der Brüstung eine Erlaubnis der Stadt als unterer Denkmalschutzbehörde erfordern. Außerhalb davon gelten die üblichen Regeln: Mieter haben Anspruch auf Zustimmung nach ${h.src('bgb_554', '§ 554 BGB')}, Eigentümer auf einen Beschluss nach ${h.src('weg_20', '§ 20 WEG')}. Was Mieter beim Antrag schreiben, zeigt der Ratgeber ${h.a('balkonkraftwerk-mieter', 'Balkonkraftwerk für Mieter')}.</p>

<h2>Beispiel: ein Rentnerpaar in Gostenhof</h2>
<p>Zwei Personen im Ruhestand, ${h.num(VERBRAUCH)} kWh im Jahr, Balkon nach Osten im zweiten Stock. Das Gerät mit ${h.num(WP)} Wp kostet ${h.eur(KOSTEN)} und erzeugt ${h.num(ost.ertrag)} kWh; ${h.num(ost.selbst)} kWh davon verbraucht der Haushalt selbst. Die Stromrechnung sinkt um ${h.eur(ost.ersparnisJahr)} im Jahr, nach ${h.num(ost.amortisationJahre ?? 0, 1)} Jahren ist das Gerät bezahlt. Wer tagsüber zu Hause ist, kann den Strom gezielt nutzen, etwa für Waschgänge am Vormittag, und kommt näher an den Wert, den der Rechner oben ausgibt.</p>`,
  },
  en: {
    slug: 'plug-in-solar-nuremberg',
    nav: 'Nuremberg',
    card: `${EN.num(C.ey)} kWh per kWp and more devices per head than Munich: what balcony solar brings in Nuremberg.`,
    title: `Plug-in Solar Nuremberg 2026: Yield, Battery and Saving`,
    description: `Plug-in Solar Nuremberg 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, ${EN.num(C.balkon)} devices in the register, east and west balconies, what a small battery adds and your saving.`,
    h1: 'Plug-in solar in Nuremberg: yield and saving in 2026',
    intro: `On an east-facing balcony, ${EN.num(WP)} Wp produce about ${EN.num(ost.ertrag)} kWh a year in Nuremberg and save a couple using ${EN.num(VERBRAUCH)} kWh ${EN.eur(ost.ersparnisJahr)}.`,
    resume: `Nuremberg (Nürnberg) sits in the upper middle for solar yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, rank ${rangEy} of ${ALL.length} big cities, while Munich ranks ${rangEyM} at ${EN.num(M.ey)} kWh. Uptake is the other way round: the Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices in Nuremberg, ${EN.num(dichte(C), 1)} per 1,000 residents, against only ${EN.num(dichte(M), 1)} in Munich; the national figure is ${EN.num(dichteBund, 1)}. A plug-in system (Balkonkraftwerk) of ${EN.num(WP)} Wp hanging upright facing south produces about ${EN.num(sued.ertrag)} kWh in Nuremberg, facing east ${EN.num(ost.ertrag)} kWh, facing west ${EN.num(west.ertrag)} kWh. A couple using ${EN.num(VERBRAUCH)} kWh consumes ${EN.pct(ost.eigenAnteil)} of the east-balcony output itself and saves ${EN.eur(ost.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh; ${EN.eur(KOSTEN)} of purchase cost comes back after ${EN.num(ost.amortisationJahre ?? 0, 1)} years. A ${EN.num(SPEICHER[2])} kWh battery lifts the saving to ${EN.eur(ostSp[2].ersparnisJahr)}. In the register, Nuremberg's roof systems are strikingly rarely paired with a battery: ${EN.num(speicherQuote(C), 2)} per system, rank ${rangSpeicher} in the comparison.`,
    faqs: [
      { q: 'Does balcony solar produce less in Nuremberg than in Munich?', a: `Yes, a little. Hanging upright facing south, a ${EN.num(WP)} Wp device produces ${EN.num(sued.ertrag)} kWh in Nuremberg and ${EN.num(suedM.ertrag)} kWh in Munich. At ${EN.num(VERBRAUCH)} kWh consumption the difference in saving is small, ${EN.eur(sued.ersparnisJahr)} against ${EN.eur(suedM.ersparnisJahr)} a year, because part of Munich's extra yield flows to the grid at midday anyway. Both values come from PVGIS for each city-centre postcode.` },
      { q: 'Is a battery for a balcony system worth it in Nuremberg?', a: `On an east balcony it lifts self-used power from ${EN.num(ostSp[0].selbst)} to ${EN.num(ostSp[1].selbst)} kWh with ${EN.num(SPEICHER[1])} kWh of capacity and to ${EN.num(ostSp[2].selbst)} kWh with ${EN.num(SPEICHER[2])} kWh. That is ${EN.eur(ostSp[1].ersparnisJahr - ostSp[0].ersparnisJahr)} or ${EN.eur(ostSp[2].ersparnisJahr - ostSp[0].ersparnisJahr)} more a year. Divide the battery's extra cost by that amount: if the result exceeds the battery's expected lifetime, it does not pay.` },
      { q: 'Is an east-facing balcony in Nuremberg worse than a west-facing one?', a: `Not according to the data. With ${EN.num(WP)} Wp upright, an east balcony in Nuremberg produces ${EN.num(ost.ertrag)} kWh and a west balcony ${EN.num(west.ertrag)} kWh a year. The west balcony, however, delivers around dinner time, the east balcony at breakfast. At ${EN.num(VERBRAUCH)} kWh consumption the east balcony saves ${EN.eur(ost.ersparnisJahr)}, the west balcony ${EN.eur(west.ersparnisJahr)}. What decides is when your household uses power.` },
      { q: 'Can I fit balcony solar to a listed building in Nuremberg?', a: `Possibly only with permission. In Bavaria, changes to listed buildings need a heritage permit, and in Nuremberg the city is the lower heritage authority in charge. Ask there before buying, especially for street-facing facades. Separately, tenants need their landlord's consent under section 554 Civil Code and flat owners a resolution of the owners' association under section 20 WEG; both have a right to it.` },
    ],
    body: (h) => `
<h2>Franconia and Upper Bavaria compared</h2>
${h.table(['Indicator', 'Nuremberg', 'Munich'], [
  ['PVGIS yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `${h.num(M.ey)} kWh`],
  [`Rank among ${h.num(ALL.length)} big cities`, `${rangEy}`, `${rangEyM}`],
  ['Share November to February', h.pct(winterAnteil(C), 1), h.pct(winterAnteil(M), 1)],
  ['Plug-in devices per 1,000 residents', h.num(dichte(C), 1), h.num(dichte(M), 1)],
  ['Batteries per building system', h.num(speicherQuote(C), 2), h.num(speicherQuote(M), 2)],
  ['Building systems on full feed-in', h.pct(vollQuote(C), 0), h.pct(vollQuote(M), 0)],
  ['Roof systems facing mainly south', h.pct(ausrAnteil(C, 'S'), 0), h.pct(ausrAnteil(M, 'S'), 0)],
], `${h.src('pvgis', 'PVGIS')} per city-centre postcode; ${h.src('mastr_einheiten', 'Market Master Data Register')}, retrieved ${h.date(ST.source.mastr_retrieved_at)}; population: ${h.src('destatis_gv', 'Destatis')}. Germany: ${h.num(dichteBund, 1)} devices per 1,000 residents.`, ['l', 'r', 'r'])}
<p>Bavaria's two largest cities differ more in yield than in uptake: Munich has more sun, Nuremberg more balcony systems per head. If you move from Munich to Franconia or the other way round, do not carry over the other city's figures; calculate with your own postcode. The comparison with the state capital is set out on ${h.a('balkonkraftwerk-muenchen', 'plug-in solar Munich')}.</p>

<h2>Upright on the railing: where Nuremberg loses ground</h2>
<p>At 35 degrees south, Nuremberg and Dresden are practically level, ${h.num(C.ey)} against ${h.num(D.ey)} kWh per kWp. Hang the panels upright and the picture changes: in Nuremberg, ${h.pct(faktor, 0)} of the tilted yield remains, in Dresden ${h.pct(faktorD, 0)}. On a south balcony that is ${h.num(sued.ertrag)} against ${h.num(suedD.ertrag)} kWh. The conversion to other tilts rests on separate PVGIS queries for each wider region, and for the area around Nuremberg they give a smaller factor for upright surfaces than for the Elbe valley.</p>
<p>If you have a south balcony and may tilt the panels, you therefore gain a little more in Nuremberg than elsewhere: ${h.num(schraeg.ertrag)} instead of ${h.num(sued.ertrag)} kWh. Whether tilting on a railing is allowed and safe depends on the parapet, wind load and landlord; the guide to ${h.a('balkonkraftwerk-ausrichtung', 'orientation')} has pointers.</p>

<h2>Breakfast power or evening power</h2>
<p>East and west balconies are close in Nuremberg, the east one even slightly ahead at ${h.num(ost.ertrag)} kWh, the west one behind at ${h.num(west.ertrag)} kWh. They deliver ${h.pct(1 - ost.ertrag / sued.ertrag, 0)} and ${h.pct(1 - west.ertrag / sued.ertrag, 0)} less than a south balcony respectively but use a larger share of their power at home, because it does not arrive in the midday peak. With an east balcony it pays to run the washing machine and dishwasher in the morning; with a west balcony the power comes while you cook.</p>

<h2>A small battery, worked through</h2>
<p>Among the big cities, Nuremberg's roof systems have one of the lowest battery ratios at ${h.num(speicherQuote(C), 2)} per system, rank ${rangSpeicher} of ${h.num(ALL.length)}. For a balcony system that says nothing about whether a battery helps; that depends on consumption. For a couple using ${h.num(VERBRAUCH)} kWh with an east balcony:</p>
${h.table(['Battery', 'used at home', 'Self-consumption share', 'Saving per year'], SPEICHER.map((s, i) => [s === 0 ? 'none' : `${h.num(s)} kWh`, `${h.num(ostSp[i].selbst)} kWh`, h.pct(ostSp[i].eigenAnteil, 0), h.eur(ostSp[i].ersparnisJahr)]), `${h.num(WP)} Wp upright facing east, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r'])}
<p>The extra amount per year is the ceiling on what the battery may cost you annually. The counter-calculation with purchase price and lifetime is in the ${h.a('balkonkraftwerk-mit-speicher', 'battery comparison')}.</p>

<h2>Sandstone, half-timbering and heritage protection</h2>
<p>In the old town within the city walls and in parts of the 19th-century districts, many buildings are listed. There, even a bracket on the parapet may need permission from the city as the lower heritage authority. Elsewhere the usual rules apply: tenants have a right to consent under ${h.src('bgb_554', 'section 554 Civil Code')}, owners to a resolution under ${h.src('weg_20', 'section 20 WEG')}. What tenants should write in their request is shown in the guide ${h.a('balkonkraftwerk-mieter', 'balcony solar for tenants')}.</p>

<h2>Example: a retired couple in Gostenhof</h2>
<p>Two retired people, ${h.num(VERBRAUCH)} kWh a year, an east-facing balcony on the second floor. The ${h.num(WP)} Wp device costs ${h.eur(KOSTEN)} and produces ${h.num(ost.ertrag)} kWh, of which the household uses ${h.num(ost.selbst)} kWh itself. The electricity bill falls by ${h.eur(ost.ersparnisJahr)} a year, and the device is paid off after ${h.num(ost.amortisationJahre ?? 0, 1)} years. If you are at home during the day you can use the power deliberately, for instance with morning wash cycles, and get closer to the figure the calculator above shows.</p>`,
  },
});

import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, P, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Frankfurt am Main: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.frankfurt;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
/** Beispiel: berufstätiges Paar in Sachsenhausen, tagsüber außer Haus. */
const WP = 900, VA = 800, VERBRAUCH = 2200, KOSTEN = 450, VERSCHATTUNG = 0.1;
const calc = (az: number, tilt = 90, v = 0) => rechneBalkon({ ort, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: v, speicherKwh: 0, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const west = calc(90), ost = calc(-90), sued = calc(0), westSchatten = calc(90, 90, VERSCHATTUNG), westFlach = calc(90, 30);
const vorsprung = west.ertrag / ost.ertrag - 1;
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const proKopf = (c: City, n: number) => (n / c.ew) * 1000;
const dichte = proKopf(C, C.balkon);
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => proKopf(y, y.balkon) - proKopf(x, x.balkon)).findIndex((x) => x.name === C.name) + 1;
const dachDichte = proKopf(C, C.gebaeude);
const rangDach = [...ALL].sort((x, y) => proKopf(y, y.gebaeude) - proKopf(x, x.gebaeude)).findIndex((x) => x.name === C.name) + 1;
const ausrAnteil = (c: City, k: string) => c.ausrichtung[k] / Object.values(c.ausrichtung).reduce((a, x) => a + x, 0);
const anteil = (k: string) => ausrAnteil(C, k);
const anteilOwBund = B.ausrichtung.OW / Object.values(B.ausrichtung).reduce((a, x) => a + x, 0);
const rangOw = [...ALL].sort((x, y) => ausrAnteil(y, 'OW') - ausrAnteil(x, 'OW')).findIndex((x) => x.name === C.name) + 1;
const speicherQuote = C.speicher / C.gebaeude;
const vollQuote = C.voll / C.gebaeude;

export default defineGuide({
  id: 'balkonkraftwerk-frankfurt',
  group: 'stadt',
  order: 104,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-mieter', 'photovoltaik-ost-west', 'balkonkraftwerk-ausrichtung', 'marktstammdatenregister-anmelden'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'bgb_554', 'eeg_8'],
  de: {
    slug: 'balkonkraftwerk-frankfurt',
    nav: 'Frankfurt',
    card: `Platz ${rangEy} beim Ertrag, letzter Platz bei der Verbreitung: wo ein Balkonkraftwerk in Frankfurt am Main am meisten bringt.`,
    title: `Balkonkraftwerk Frankfurt 2026: Westbalkon klar vor Ost`,
    description: `Balkonkraftwerk Frankfurt 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, West- gegen Ostbalkon, ${DE.num(C.balkon)} Geräte im Register und die Ersparnis für Berufstätige am Main.`,
    h1: 'Balkonkraftwerk in Frankfurt am Main: Ertrag und Ersparnis 2026',
    intro: `Am Westbalkon erzeugen ${DE.num(WP)} Wp in Frankfurt ${DE.num(west.ertrag)} kWh im Jahr, ${DE.pct(vorsprung)} mehr als am Ostbalkon, und sparen einem berufstätigen Paar ${DE.eur(west.ersparnisJahr)}.`,
    resume: `Frankfurt am Main gehört zu den sonnigen Großstädten: PVGIS rechnet für die Postleitzahl ${C.plz} in der Innenstadt mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, Platz ${rangEy} von ${ALL.length}. Bei der Verbreitung von Balkonkraftwerken liegt die Stadt dagegen auf Platz ${rangDichte}: ${DE.num(C.balkon)} Geräte stehen im Marktstammdatenregister, ${DE.num(dichte, 1)} je 1 000 Einwohner, im Bund sind es ${DE.num(dichteBund, 1)}. Eine Frankfurter Besonderheit zeigt sich zwischen Ost und West. Senkrecht nach Westen erzeugen ${DE.num(WP)} Wp ${DE.num(west.ertrag)} kWh im Jahr, nach Osten nur ${DE.num(ost.ertrag)} kWh, ein Unterschied von ${DE.pct(vorsprung)}, der in kaum einer anderen Stadt so groß ausfällt. Ein Paar, das tagsüber arbeitet und ${DE.num(VERBRAUCH)} kWh verbraucht, nutzt am Westbalkon ${DE.pct(west.eigenAnteil)} des Stroms selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(west.ersparnisJahr)} im Jahr. Auf den Dächern sind ${DE.pct(anteil('OW'))} der Anlagen Ost-West-Anlagen, mehr als in jeder anderen verglichenen Stadt.`,
    faqs: [
      { q: 'Warum bringt ein Westbalkon in Frankfurt deutlich mehr als ein Ostbalkon?', a: `Die PVGIS-Matrix für die Region um Frankfurt weist dem Nachmittag mehr Einstrahlung zu als dem Vormittag. Senkrecht montiert ergibt das ${DE.num(west.ertrag)} kWh nach Westen und ${DE.num(ost.ertrag)} kWh nach Osten bei ${DE.num(WP)} Wp, ${DE.pct(vorsprung)} Unterschied. Wer die Wahl zwischen zwei Balkonen hat, sollte in Frankfurt den westlichen nehmen, zumal der Abendstrom zu Berufstätigen passt.` },
      { q: 'Warum gibt es in Frankfurt so wenige Balkonkraftwerke?', a: `Mit ${DE.num(dichte, 1)} Geräten je 1 000 Einwohner liegt Frankfurt auf Platz ${rangDichte} von ${ALL.length} Großstädten. Am Wetter liegt es nicht, der Ertrag ist überdurchschnittlich. Auch Dachanlagen sind mit ${DE.num(dachDichte, 1)} je 1 000 Einwohnern selten (Platz ${rangDach}). In einer Stadt mit vielen Mietwohnungen, Hochhäusern und kleinen Balkonen fehlt oft schlicht der Platz oder die Erlaubnis, die Mieter seit Oktober 2024 einfordern können.` },
      { q: 'Wie viel kostet Verschattung ein Balkonkraftwerk in Frankfurt?', a: `Rechnet man am Westbalkon mit ${DE.pct(VERSCHATTUNG)} Verschattung, etwa durch ein Nachbarhaus oder einen Baum, sinkt der Ertrag von ${DE.num(west.ertrag)} auf ${DE.num(westSchatten.ertrag)} kWh im Jahr, die Ersparnis von ${DE.eur(west.ersparnisJahr)} auf ${DE.eur(westSchatten.ersparnisJahr)}. Bei Hochhäusern in der Nachbarschaft kann der Schatten größer sein; tragen Sie Ihren Wert im Rechner oben ein.` },
    ],
    body: (h) => `
<h2>Frankfurt: viel Sonne, wenige Stecker</h2>
<p>Die Stadt liegt in der Mainebene am Nordrand des Oberrheingrabens, der PVGIS-Punkt der Innenstadt auf ${h.num(C.elev)} Metern. Im Norden schirmt der Taunus ab, das Klima ist für deutsche Verhältnisse warm. Beim Solarertrag reicht das für Platz ${rangEy} unter den ${h.num(ALL.length)} Großstädten. Beim Ausbau der Solartechnik bildet Frankfurt dagegen das Schlusslicht.</p>
${h.table(['Kennzahl', 'Frankfurt', 'Platz'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `${rangEy}`],
  ['Balkonkraftwerke je 1 000 Einwohner', h.num(dichte, 1), `${rangDichte}`],
  ['Gebäudeanlagen je 1 000 Einwohner', h.num(dachDichte, 1), `${rangDach}`],
  ['Anteil Ost-West-Anlagen', h.pct(anteil('OW'), 1), `${rangOw}`],
  ['Speicher je Gebäudeanlage', h.num(speicherQuote, 2), ''],
  ['Volleinspeiser unter den Gebäudeanlagen', h.pct(vollQuote, 1), ''],
], `Platz unter ${h.num(ALL.length)} Großstädten. PVGIS, PLZ ${C.plz}; Marktstammdatenregister, abgerufen am ${h.date(ST.source.mastr_retrieved_at)}; Destatis.`, ['l', 'r', 'r'])}
<p>Der Bundesschnitt liegt bei ${h.num(dichteBund, 1)} Balkonkraftwerken je 1 000 Einwohner. Frankfurt erreicht davon nur einen Bruchteil, und das bei einem Ertrag, der über dem Mittel der Großstädte liegt.</p>

<h2>Am Main schlägt West den Osten</h2>
<p>In den meisten deutschen Städten liegen Ost- und Westbalkon beim Jahresertrag nah beieinander. In Frankfurt nicht: Die ${h.src('pvgis', 'PVGIS')}-Daten der Region geben dem Westbalkon einen Vorsprung von ${h.pct(vorsprung, 0)}. Wer zwischen zwei Seiten wählen kann, hängt die Module nach Westen. Dazu kommt der Tagesablauf: Ein Paar, das morgens zur Arbeit fährt, verbraucht den Vormittagsstrom eines Ostbalkons kaum.</p>
${h.table(['Balkon', 'Ertrag', 'selbst genutzt', 'Eigenanteil', 'Ersparnis/Jahr'], [
  ['Ost, senkrecht', `${h.num(ost.ertrag)} kWh`, `${h.num(ost.selbst)} kWh`, h.pct(ost.eigenAnteil, 0), h.eur(ost.ersparnisJahr)],
  ['Süd, senkrecht', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.pct(sued.eigenAnteil, 0), h.eur(sued.ersparnisJahr)],
  ['West, senkrecht', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.pct(west.eigenAnteil, 0), h.eur(west.ersparnisJahr)],
  ['West, 30° geneigt', `${h.num(westFlach.ertrag)} kWh`, `${h.num(westFlach.selbst)} kWh`, h.pct(westFlach.eigenAnteil, 0), h.eur(westFlach.ersparnisJahr)],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, Verbrauch ${h.num(VERBRAUCH)} kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh, ohne Verschattung.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>Ost-West-Dächer als Frankfurter Merkmal</h2>
<p>Das ${h.src('mastr_einheiten', 'Marktstammdatenregister')} zeigt dasselbe Thema von oben. ${h.pct(anteil('OW'), 0)} der Frankfurter Gebäudeanlagen sind als Ost-West-Anlagen eingetragen, im Bund sind es ${h.pct(anteilOwBund, 0)}. Solche Anlagen liegen häufig flach auf Gewerbe- und Mehrfamilienhausdächern, mit Modulen, die abwechselnd nach Osten und Westen geneigt sind. Sie liefern einen breiten Tagesverlauf statt einer Mittagsspitze. Was das bei Dachanlagen bedeutet, erklärt der ${h.a('photovoltaik-ost-west', 'Ratgeber zu Ost-West-Anlagen')}.</p>

<h2>Beispiel: Pendlerpaar in Sachsenhausen</h2>
<p>Zwei Berufstätige, Mietwohnung im vierten Stock, Balkon nach Westen, ${h.num(VERBRAUCH)} kWh Verbrauch. Gegenüber steht ein höheres Haus, das am späten Nachmittag Schatten wirft; angenommen werden ${h.pct(VERSCHATTUNG, 0)} Verlust. Das Gerät für ${h.eur(KOSTEN)} erzeugt dann ${h.num(westSchatten.ertrag)} kWh, das Paar nutzt ${h.num(westSchatten.selbst)} kWh selbst und spart ${h.eur(westSchatten.ersparnisJahr)} im Jahr. Nach ${h.num(westSchatten.amortisationJahre ?? 0, 1)} Jahren ist es bezahlt.</p>
<p>Vor der Montage fragen die beiden ihren Vermieter. Seit der Reform von ${h.src('bgb_554', '§ 554 BGB')} darf er die Erlaubnis nur verweigern, wenn sie ihm nicht zuzumuten ist; über die Art der Befestigung kann er mitreden. Nach ${h.src('eeg_8', '§ 8 Abs. 5a EEG')} gilt das Gerät mit ${h.num(WP)} Wp und ${h.num(VA)} VA als Steckersolargerät, eine Meldung beim Netzbetreiber entfällt. Bleibt der Eintrag im Register, der binnen ${P.mastr.frist_monate === 1 ? 'eines Monats' : `${P.mastr.frist_monate} Monaten`} fällig ist.</p>`,
  },
  en: {
    slug: 'plug-in-solar-frankfurt',
    nav: 'Frankfurt',
    card: `Rank ${rangEy} for yield, last for uptake: where a balcony solar system earns most in Frankfurt am Main.`,
    title: `Plug-in Solar Frankfurt 2026: West Balcony Beats East`,
    description: `Plug-in solar Frankfurt 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, west versus east balcony, ${EN.num(C.balkon)} devices in the register and the saving for working couples.`,
    h1: 'Plug-in solar in Frankfurt am Main: yield and saving in 2026',
    intro: `On a west-facing balcony, ${EN.num(WP)} Wp produce ${EN.num(west.ertrag)} kWh a year in Frankfurt, ${EN.pct(vorsprung)} more than facing east, and save a working couple ${EN.eur(west.ersparnisJahr)}.`,
    resume: `Frankfurt am Main is one of the sunnier big cities: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz} in the centre, rank ${rangEy} of ${ALL.length}. For uptake of plug-in solar (Balkonkraftwerk), though, it ranks ${rangDichte}: the Market Master Data Register lists ${EN.num(C.balkon)} devices, ${EN.num(dichte, 1)} per 1,000 residents, against ${EN.num(dichteBund, 1)} nationally. A Frankfurt peculiarity appears between east and west. Hanging upright facing west, ${EN.num(WP)} Wp produce ${EN.num(west.ertrag)} kWh a year, facing east only ${EN.num(ost.ertrag)} kWh, a gap of ${EN.pct(vorsprung)} that is hardly as large in any other city. A couple who work during the day and use ${EN.num(VERBRAUCH)} kWh consume ${EN.pct(west.eigenAnteil)} of west-balcony power themselves and save ${EN.eur(west.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. On roofs, ${EN.pct(anteil('OW'))} of systems are east-west installations, more than in any other city compared.`,
    faqs: [
      { q: 'Why does a west balcony in Frankfurt produce much more than an east one?', a: `The PVGIS matrix for the Frankfurt region gives the afternoon more irradiation than the morning. For ${EN.num(WP)} Wp hung upright, that means ${EN.num(west.ertrag)} kWh facing west and ${EN.num(ost.ertrag)} kWh facing east, a gap of ${EN.pct(vorsprung)}. If you can choose between two balconies in Frankfurt, take the western one, especially since evening power suits people who work.` },
      { q: 'Why are there so few balcony solar devices in Frankfurt?', a: `At ${EN.num(dichte, 1)} devices per 1,000 residents, Frankfurt ranks ${rangDichte} of ${ALL.length} big cities. The weather is not to blame; yield is above average. Roof systems are rare too, at ${EN.num(dachDichte, 1)} per 1,000 residents (rank ${rangDach}). In a city of rented flats, tower blocks and small balconies, space is often missing, or the landlord's permission, which tenants have been able to demand since October 2024.` },
      { q: 'How much does shading cost a balcony system in Frankfurt?', a: `Assuming ${EN.pct(VERSCHATTUNG)} shading on a west balcony, for example from a neighbouring building or a tree, yield falls from ${EN.num(west.ertrag)} to ${EN.num(westSchatten.ertrag)} kWh a year and the saving from ${EN.eur(west.ersparnisJahr)} to ${EN.eur(westSchatten.ersparnisJahr)}. Next to high-rises the shadow can be larger; enter your own value in the calculator above.` },
    ],
    body: (h) => `
<h2>Frankfurt: plenty of sun, few plugs</h2>
<p>The city lies in the Main plain at the northern end of the Upper Rhine Rift, the PVGIS point for the centre at ${h.num(C.elev)} metres. The Taunus hills shelter it to the north, and the climate is warm by German standards. For solar yield that is enough for rank ${rangEy} of ${h.num(ALL.length)} big cities. When it comes to actually installing solar, however, Frankfurt comes last.</p>
${h.table(['Indicator', 'Frankfurt', 'Rank'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `${rangEy}`],
  ['Plug-in devices per 1,000 residents', h.num(dichte, 1), `${rangDichte}`],
  ['Building systems per 1,000 residents', h.num(dachDichte, 1), `${rangDach}`],
  ['Share of east-west systems', h.pct(anteil('OW'), 1), `${rangOw}`],
  ['Batteries per building system', h.num(speicherQuote, 2), ''],
  ['Full-feed-in share of building systems', h.pct(vollQuote, 1), ''],
], `Rank among ${h.num(ALL.length)} big cities. PVGIS, postcode ${C.plz}; Market Master Data Register retrieved on ${h.date(ST.source.mastr_retrieved_at)}; Destatis.`, ['l', 'r', 'r'])}
<p>The national average is ${h.num(dichteBund, 1)} plug-in devices per 1,000 residents. Frankfurt reaches only a fraction of that, with a yield above the big-city mean.</p>

<h2>On the Main, west beats east</h2>
<p>In most German cities, east and west balconies are close on annual yield. Not in Frankfurt: the regional ${h.src('pvgis', 'PVGIS')} data give the west balcony a lead of ${h.pct(vorsprung, 0)}. If you can choose a side, hang the panels facing west. Daily routine adds to this: a couple who leave for work in the morning barely use the forenoon power of an east balcony.</p>
${h.table(['Balcony', 'Yield', 'Used at home', 'Own share', 'Saving/year'], [
  ['East, upright', `${h.num(ost.ertrag)} kWh`, `${h.num(ost.selbst)} kWh`, h.pct(ost.eigenAnteil, 0), h.eur(ost.ersparnisJahr)],
  ['South, upright', `${h.num(sued.ertrag)} kWh`, `${h.num(sued.selbst)} kWh`, h.pct(sued.eigenAnteil, 0), h.eur(sued.ersparnisJahr)],
  ['West, upright', `${h.num(west.ertrag)} kWh`, `${h.num(west.selbst)} kWh`, h.pct(west.eigenAnteil, 0), h.eur(west.ersparnisJahr)],
  ['West, tilted 30°', `${h.num(westFlach.ertrag)} kWh`, `${h.num(westFlach.selbst)} kWh`, h.pct(westFlach.eigenAnteil, 0), h.eur(westFlach.ersparnisJahr)],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, consumption ${h.num(VERBRAUCH)} kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh, no shading.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>East-west roofs, a Frankfurt trait</h2>
<p>The ${h.src('mastr_einheiten', 'Market Master Data Register')} shows the same theme from above. ${h.pct(anteil('OW'), 0)} of Frankfurt's building-mounted systems are registered as east-west systems, against ${h.pct(anteilOwBund, 0)} nationally. Such systems often sit on flat roofs of commercial and apartment buildings, with panels tilted alternately east and west. They give a broad daily curve instead of a midday peak. What that means for roof systems is explained in the ${h.a('photovoltaik-ost-west', 'guide to east-west systems')}.</p>

<h2>Example: a commuting couple in Sachsenhausen</h2>
<p>Two working people, a rented flat on the fourth floor, balcony facing west, ${h.num(VERBRAUCH)} kWh of consumption. A taller building opposite casts shade in the late afternoon; a loss of ${h.pct(VERSCHATTUNG, 0)} is assumed. The ${h.eur(KOSTEN)} device then produces ${h.num(westSchatten.ertrag)} kWh, the couple use ${h.num(westSchatten.selbst)} kWh themselves and save ${h.eur(westSchatten.ersparnisJahr)} a year. It has paid for itself after ${h.num(westSchatten.amortisationJahre ?? 0, 1)} years.</p>
<p>Before mounting, they ask their landlord. Since the reform of ${h.src('bgb_554', 'section 554 Civil Code')}, permission may only be refused if it is unreasonable for the landlord, who can have a say in how it is fixed. Under ${h.src('eeg_8', 'section 8(5a) EEG')}, a device with ${h.num(WP)} Wp and ${h.num(VA)} VA counts as a plug-in solar device, so no notice to the grid operator is needed. What remains is the register entry, due within ${P.mastr.frist_monate === 1 ? 'one month' : `${P.mastr.frist_monate} months`}.</p>`,
  },
});

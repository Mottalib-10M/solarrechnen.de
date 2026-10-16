import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Stuttgart: Daten aus staedte.json (PVGIS für die PLZ, Marktstammdatenregister, Destatis), Beispiele aus dem Motor. */
type City = { name: string; plz: string; lat: number; ew: number; ey: number; em: number[]; elev: number; balkon: number; gebaeude: number; speicher: number; voll: number; ausrichtung: Record<string, number> };
const STAEDTE = ST.staedte as Record<string, City>;
const C = STAEDTE.stuttgart;
const M = STAEDTE.muenchen;
const ALL = Object.values(STAEDTE);
const B = ST.bund;
const ort = ortVonPlz(C.plz)!;
const ortM = ortVonPlz(M.plz)!;
/** Beispiel: dreiköpfiger Haushalt in Halbhöhenlage, Südbalkon. */
const WP = 900, VA = 800, VERBRAUCH = 2800, KOSTEN = 450, SPEICHER = 1.5;
const calc = (o: typeof ort, tilt: number, az: number, sp = 0) => rechneBalkon({ ort: o, modulWp: WP, wechselrichterVa: VA, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: sp, verbrauchKwh: VERBRAUCH, preisCt: STROMPREIS_CT, kostenEur: KOSTEN });
const senkrecht = calc(ort, 90, 0), schraeg = calc(ort, 35, 0), steil = calc(ort, 60, 0), mitSpeicher = calc(ort, 90, 0, SPEICHER);
const west = calc(ort, 90, 90), muenchen = calc(ortM, 90, 0);
const summe = (c: City) => c.em.reduce((a, x) => a + x, 0);
const winterAnteil = (c: City) => (c.em[10] + c.em[11] + c.em[0] + c.em[1]) / summe(c);
const winter = winterAnteil(C);
const rangEy = [...ALL].sort((x, y) => y.ey - x.ey).findIndex((x) => x.name === C.name) + 1;
const rangWinter = [...ALL].sort((x, y) => winterAnteil(y) - winterAnteil(x)).findIndex((x) => x.name === C.name) + 1;
const dez = senkrecht.ertrag * C.em[11] / summe(C), dezM = muenchen.ertrag * M.em[11] / summe(M);
const jul = senkrecht.ertrag * C.em[6] / summe(C), julM = muenchen.ertrag * M.em[6] / summe(M);
const dichte = (C.balkon / C.ew) * 1000;
const dichteBund = (B.balkon / ST.ew_bund) * 1000;
const rangDichte = [...ALL].sort((x, y) => y.balkon / y.ew - x.balkon / x.ew).findIndex((x) => x.name === C.name) + 1;
const vollQuote = C.voll / C.gebaeude, vollQuoteBund = B.voll / B.gebaeude;
const rangVoll = [...ALL].sort((x, y) => y.voll / y.gebaeude - x.voll / x.gebaeude).findIndex((x) => x.name === C.name) + 1;
const ausrSumme = Object.values(C.ausrichtung).reduce((a, x) => a + x, 0);
const anteilS = C.ausrichtung.S / ausrSumme;
const mehrSchraeg = schraeg.ertrag / senkrecht.ertrag - 1;
const speicherPlus = mitSpeicher.selbst - senkrecht.selbst;

export default defineGuide({
  id: 'balkonkraftwerk-stuttgart',
  group: 'stadt',
  order: 105,
  tool: 'balkon',
  toolPreset: { plz: C.plz },
  related: ['balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mit-speicher', 'volleinspeisung-teileinspeisung', 'balkonkraftwerk-ertrag'],
  sources: ['pvgis', 'mastr_einheiten', 'destatis_gv', 'weg_20', 'bgb_554'],
  de: {
    slug: 'balkonkraftwerk-stuttgart',
    nav: 'Stuttgart',
    card: `${DE.num(C.ey)} kWh je kWp, Platz ${rangEy} der Großstädte: was ein Balkonkraftwerk im Stuttgarter Kessel übers Jahr liefert.`,
    title: `Balkonkraftwerk Stuttgart 2026: Ertrag im Kessel, Ersparnis`,
    description: `Balkonkraftwerk Stuttgart 2026: ${DE.num(C.ey)} kWh je kWp laut PVGIS, starker Sommer und schwacher Dezember, senkrecht oder schräg am Hang und Ihre Ersparnis im Jahr.`,
    h1: 'Balkonkraftwerk in Stuttgart: Kessellage, Hang und Ertrag 2026',
    intro: `In Stuttgart erzeugen ${DE.num(WP)} Wp senkrecht am Südbalkon rund ${DE.num(senkrecht.ertrag)} kWh im Jahr und sparen einer dreiköpfigen Familie ${DE.eur(senkrecht.ersparnisJahr)}.`,
    resume: `Stuttgart ist beim Jahresertrag die Nummer ${rangEy} der deutschen Großstädte: PVGIS rechnet für die Postleitzahl ${C.plz} mit ${DE.num(C.ey)} kWh je Kilowatt Peak bei 35 Grad Süd, nur knapp hinter München. Die Verteilung über das Jahr ist aber eine andere. Im Juli liefert ein senkrechtes Gerät mit ${DE.num(WP)} Wp in Stuttgart ${DE.num(jul)} kWh, etwa so viel wie in München; im Dezember sind es ${DE.num(dez, 1)} kWh gegenüber ${DE.num(dezM, 1)} kWh. November bis Februar tragen nur ${DE.pct(winter, 1)} zum Jahr bei, Platz ${rangWinter} von ${ALL.length}. Über zwölf Monate erzeugt das Gerät am Südbalkon ${DE.num(senkrecht.ertrag)} kWh, auf 35 Grad aufgeständert ${DE.num(schraeg.ertrag)} kWh. Eine Familie mit ${DE.num(VERBRAUCH)} kWh Verbrauch spart bei ${DE.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${DE.eur(senkrecht.ersparnisJahr)} im Jahr. Mit ${DE.num(dichte, 1)} Balkonkraftwerken je 1 000 Einwohnern, insgesamt ${DE.num(C.balkon)} im Marktstammdatenregister, liegt Stuttgart unter den Großstädten auf Platz ${rangDichte}, aber unter dem Bundesschnitt von ${DE.num(dichteBund, 1)}.`,
    faqs: [
      { q: 'Warum liefert ein Balkonkraftwerk in Stuttgart im Dezember weniger als in München?', a: `Beide Städte liegen beim Jahresertrag fast gleichauf, im Dezember aber erzeugen ${DE.num(WP)} Wp senkrecht in Stuttgart ${DE.num(dez, 1)} kWh, in München ${DE.num(dezM, 1)} kWh. So weisen es die PVGIS-Monatswerte aus. Eine naheliegende Erklärung ist die Kessellage: Bei winterlichen Inversionswetterlagen halten sich Dunst und Nebel im Tal länger. München profitiert dagegen von Föhnlagen. Für die Jahresrechnung zählt der Unterschied wenig.` },
      { q: 'Lohnt es sich in Stuttgart, die Balkonmodule schräg aufzustellen?', a: `Beim Ertrag ja: Auf 35 Grad geneigt liefern ${DE.num(WP)} Wp am Südbalkon ${DE.num(schraeg.ertrag)} statt ${DE.num(senkrecht.ertrag)} kWh, ${DE.pct(mehrSchraeg)} mehr. Die Ersparnis steigt weniger, von ${DE.eur(senkrecht.ersparnisJahr)} auf ${DE.eur(schraeg.ersparnisJahr)}, weil der Mehrertrag vor allem mittags im Sommer anfällt. Eine schräge Halterung braucht meist die Zustimmung des Vermieters oder der Eigentümergemeinschaft und eine sichere Befestigung.` },
      { q: 'Wie viele Balkonkraftwerke gibt es in Stuttgart?', a: `Das Marktstammdatenregister führt in Stuttgart ${DE.num(C.balkon)} Steckersolargeräte in Betrieb. Bezogen auf die Einwohnerzahl sind das ${DE.num(dichte, 1)} je 1 000, Platz ${rangDichte} unter ${ALL.length} Großstädten und damit vor Berlin, Hamburg, München, Köln und Frankfurt. Der Bundesschnitt von ${DE.num(dichteBund, 1)} wird trotzdem nicht erreicht. Dazu kommen ${DE.num(C.gebaeude)} Solaranlagen auf Gebäuden.` },
    ],
    body: (h) => `
<h2>Fast so sonnig wie München, nur nicht im Dezember</h2>
<p>Der Jahreswert von ${h.num(C.ey)} kWh je kWp bringt Stuttgart auf Platz ${rangEy}. Wer genauer in die ${h.src('pvgis', 'PVGIS')}-Monatswerte schaut, findet zwei Hälften. Von März bis September liegt die Stadt auf Augenhöhe mit den sonnigsten Orten des Vergleichs, im Juli liefern ${h.num(WP)} Wp senkrecht ${h.num(jul)} kWh (München ${h.num(julM)} kWh). Im Winter fällt sie zurück.</p>
${h.table(['', 'Stuttgart', 'München'], [
  ['Ertrag je kWp, 35° Süd', `${h.num(C.ey)} kWh`, `${h.num(M.ey)} kWh`],
  [`Juli, ${h.num(WP)} Wp senkrecht Süd`, `${h.num(jul)} kWh`, `${h.num(julM)} kWh`],
  [`Dezember, ${h.num(WP)} Wp senkrecht Süd`, `${h.num(dez, 1)} kWh`, `${h.num(dezM, 1)} kWh`],
  ['Anteil November bis Februar', h.pct(winter, 1), h.pct(winterAnteil(M), 1)],
  ['Höhe des PVGIS-Punkts', `${h.num(C.elev)} m`, `${h.num(M.elev)} m`],
], `PVGIS für die PLZ ${C.plz} und ${M.plz}.`, ['l', 'r', 'r'])}

<h2>Der Talkessel und seine Hänge</h2>
<p>Die Innenstadt liegt in einem Kessel, den das Nesenbachtal in die Hochflächen ringsum geschnitten hat; Wohngebiete ziehen sich die Hänge hinauf bis in die Halbhöhenlagen. Der schlechte Luftaustausch des Kessels bei Inversionswetterlagen ist seit Jahrzehnten Thema der Stuttgarter Stadtklimatologie. Ob er den schwachen Dezember in den PVGIS-Daten erklärt, lässt sich aus den Zahlen allein nicht ablesen. Für den Balkon zählt etwas anderes: Am Hang verschattet oft das Gelände selbst. Wer an einem Nordhang wohnt, verliert im Winter die Sonne hinter der Kuppe, wer am Südhang wohnt, hat freie Sicht über die Stadt.</p>

<h2>Halbhöhe, Südbalkon: welcher Winkel?</h2>
<p>Familie mit einem Kind, Wohnung in Halbhöhenlage, ${h.num(VERBRAUCH)} kWh im Jahr, Balkon nach Süden ohne Verschattung, Gerät für ${h.eur(KOSTEN)}.</p>
${h.table(['Montage', 'Ertrag', 'selbst genutzt', 'Ersparnis/Jahr', 'bezahlt nach'], [
  ['senkrecht am Geländer', `${h.num(senkrecht.ertrag)} kWh`, `${h.num(senkrecht.selbst)} kWh`, h.eur(senkrecht.ersparnisJahr), `${h.num(senkrecht.amortisationJahre ?? 0, 1)} Jahren`],
  ['60° geneigt', `${h.num(steil.ertrag)} kWh`, `${h.num(steil.selbst)} kWh`, h.eur(steil.ersparnisJahr), `${h.num(steil.amortisationJahre ?? 0, 1)} Jahren`],
  ['35° aufgeständert', `${h.num(schraeg.ertrag)} kWh`, `${h.num(schraeg.selbst)} kWh`, h.eur(schraeg.ersparnisJahr), `${h.num(schraeg.amortisationJahre ?? 0, 1)} Jahren`],
  [`senkrecht, ${h.num(SPEICHER, 1)} kWh Speicher`, `${h.num(mitSpeicher.ertrag)} kWh`, `${h.num(mitSpeicher.selbst)} kWh`, h.eur(mitSpeicher.ersparnisJahr), 'je nach Speicherpreis'],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Der flachere Winkel holt ${h.pct(mehrSchraeg, 0)} mehr Strom, aber nur einen Teil davon nutzt die Familie selbst. Ein kleiner Speicher hebt den Eigenverbrauch um ${h.num(speicherPlus)} kWh, das sind ${h.eur(speicherPlus * STROMPREIS_CT / 100)} im Jahr; ob das den Akku bezahlt, rechnet der ${h.a('balkonkraftwerk-mit-speicher', 'Speicher-Rechner')} nach. Ein Westbalkon brächte senkrecht ${h.num(west.ertrag)} kWh. In Eigentumswohnungen entscheidet die Gemeinschaft nach ${h.src('weg_20', '§ 20 WEG')} über die Art der Anbringung, Mieter haben nach ${h.src('bgb_554', '§ 554 BGB')} Anspruch auf die Erlaubnis.</p>

<h2>Wo Stuttgart vorn liegt und wo nicht</h2>
<p>Unter den sechs größten Städten nach Berlin hat Stuttgart die meisten Balkonkraftwerke je Einwohner, ${h.num(dichte, 1)} je 1 000. Im ${h.src('mastr_einheiten', 'Marktstammdatenregister')} fällt außerdem auf, dass ${h.pct(vollQuote, 1)} der Gebäudeanlagen ihren gesamten Strom einspeisen, Platz ${rangVoll} der Großstädte; im Bund sind es ${h.pct(vollQuoteBund, 1)}. Die Dächer zeigen zu ${h.pct(anteilS, 0)} hauptsächlich nach Süden. Was Volleinspeisung gegenüber Eigenverbrauch bringt, erklärt der ${h.a('volleinspeisung-teileinspeisung', 'Vergleich von Voll- und Teileinspeisung')}; für ein Balkonkraftwerk stellt sich die Frage nicht, es wird für den eigenen Verbrauch betrieben.</p>`,
  },
  en: {
    slug: 'plug-in-solar-stuttgart',
    nav: 'Stuttgart',
    card: `${EN.num(C.ey)} kWh per kWp, rank ${rangEy} among the big cities: what a balcony system delivers in Stuttgart's valley basin.`,
    title: `Plug-in Solar Stuttgart 2026: Basin Yield and Saving`,
    description: `Plug-in solar Stuttgart 2026: ${EN.num(C.ey)} kWh per kWp from PVGIS, a strong summer and weak December, upright or tilted on a hillside, and what you save per year.`,
    h1: 'Plug-in solar in Stuttgart: basin, hillsides and yield in 2026',
    intro: `In Stuttgart, ${EN.num(WP)} Wp hung upright on a south balcony produce about ${EN.num(senkrecht.ertrag)} kWh a year and save a family of three ${EN.eur(senkrecht.ersparnisJahr)}.`,
    resume: `Stuttgart is number ${rangEy} among Germany's big cities for annual yield: PVGIS gives ${EN.num(C.ey)} kWh per kilowatt peak at 35 degrees south for postcode ${C.plz}, just behind Munich. The spread over the year is different, though. In July an upright ${EN.num(WP)} Wp device (Balkonkraftwerk) produces ${EN.num(jul)} kWh in Stuttgart, about as much as in Munich; in December it is ${EN.num(dez, 1)} kWh against ${EN.num(dezM, 1)} kWh. November to February contribute only ${EN.pct(winter, 1)} of the year, rank ${rangWinter} of ${ALL.length}. Over twelve months the device on a south balcony produces ${EN.num(senkrecht.ertrag)} kWh, tilted at 35 degrees ${EN.num(schraeg.ertrag)} kWh. A family using ${EN.num(VERBRAUCH)} kWh saves ${EN.eur(senkrecht.ersparnisJahr)} a year at ${EN.num(STROMPREIS_CT, 1)} cents per kWh. With ${EN.num(dichte, 1)} plug-in devices per 1,000 residents, ${EN.num(C.balkon)} in total in the Market Master Data Register, Stuttgart ranks ${rangDichte} among the big cities but stays below the national ${EN.num(dichteBund, 1)}.`,
    faqs: [
      { q: 'Why does a balcony system in Stuttgart produce less in December than in Munich?', a: `The two cities are almost level on annual yield, but in December ${EN.num(WP)} Wp upright produce ${EN.num(dez, 1)} kWh in Stuttgart and ${EN.num(dezM, 1)} kWh in Munich, according to the PVGIS monthly values. An obvious explanation is the basin: during winter temperature inversions, haze and fog linger longer in the valley. Munich, by contrast, benefits from foehn spells. For the annual sums the difference matters little.` },
      { q: 'Is it worth tilting balcony panels in Stuttgart?', a: `For yield, yes: tilted at 35 degrees, ${EN.num(WP)} Wp on a south balcony deliver ${EN.num(schraeg.ertrag)} instead of ${EN.num(senkrecht.ertrag)} kWh, ${EN.pct(mehrSchraeg)} more. The saving rises less, from ${EN.eur(senkrecht.ersparnisJahr)} to ${EN.eur(schraeg.ersparnisJahr)}, because the extra comes mostly at summer middays. A tilted bracket usually needs the consent of the landlord or owners' association and secure fixing.` },
      { q: 'How many balcony solar devices are there in Stuttgart?', a: `The Market Master Data Register lists ${EN.num(C.balkon)} plug-in devices in operation in Stuttgart. Relative to population that is ${EN.num(dichte, 1)} per 1,000, rank ${rangDichte} among ${ALL.length} big cities and ahead of Berlin, Hamburg, Munich, Cologne and Frankfurt. The national average of ${EN.num(dichteBund, 1)} is still not reached. On top come ${EN.num(C.gebaeude)} solar systems on buildings.` },
    ],
    body: (h) => `
<h2>Almost as sunny as Munich, except in December</h2>
<p>An annual ${h.num(C.ey)} kWh per kWp puts Stuttgart at rank ${rangEy}. Look closer at the ${h.src('pvgis', 'PVGIS')} monthly values and you find two halves. From March to September the city keeps pace with the sunniest places in the comparison; in July ${h.num(WP)} Wp upright deliver ${h.num(jul)} kWh (Munich ${h.num(julM)} kWh). In winter it falls behind.</p>
${h.table(['', 'Stuttgart', 'Munich'], [
  ['Yield per kWp, 35° south', `${h.num(C.ey)} kWh`, `${h.num(M.ey)} kWh`],
  [`July, ${h.num(WP)} Wp upright south`, `${h.num(jul)} kWh`, `${h.num(julM)} kWh`],
  [`December, ${h.num(WP)} Wp upright south`, `${h.num(dez, 1)} kWh`, `${h.num(dezM, 1)} kWh`],
  ['Share November to February', h.pct(winter, 1), h.pct(winterAnteil(M), 1)],
  ['Altitude of PVGIS point', `${h.num(C.elev)} m`, `${h.num(M.elev)} m`],
], `PVGIS for postcodes ${C.plz} and ${M.plz}.`, ['l', 'r', 'r'])}

<h2>The valley basin and its slopes</h2>
<p>The city centre lies in a basin (Kessel) cut by the Nesenbach valley into the surrounding plateaus; residential areas climb the slopes up to the mid-hillside districts (Halbhöhenlage). Poor air exchange in the basin during temperature inversions has been a topic of Stuttgart's urban climatology for decades. Whether it explains the weak December in the PVGIS data cannot be read from the figures alone. For a balcony something else counts: on a slope, the terrain itself often casts shade. On a north-facing slope you lose the winter sun behind the ridge; on a south-facing slope you look freely across the city.</p>

<h2>Mid-hillside, south balcony: which angle?</h2>
<p>A family with one child, a flat on the hillside, ${h.num(VERBRAUCH)} kWh a year, south balcony without shade, a device costing ${h.eur(KOSTEN)}.</p>
${h.table(['Mounting', 'Yield', 'Used at home', 'Saving/year', 'Paid off after'], [
  ['upright on the railing', `${h.num(senkrecht.ertrag)} kWh`, `${h.num(senkrecht.selbst)} kWh`, h.eur(senkrecht.ersparnisJahr), `${h.num(senkrecht.amortisationJahre ?? 0, 1)} years`],
  ['tilted 60°', `${h.num(steil.ertrag)} kWh`, `${h.num(steil.selbst)} kWh`, h.eur(steil.ersparnisJahr), `${h.num(steil.amortisationJahre ?? 0, 1)} years`],
  ['tilted 35°', `${h.num(schraeg.ertrag)} kWh`, `${h.num(schraeg.selbst)} kWh`, h.eur(schraeg.ersparnisJahr), `${h.num(schraeg.amortisationJahre ?? 0, 1)} years`],
  [`upright, ${h.num(SPEICHER, 1)} kWh battery`, `${h.num(mitSpeicher.ertrag)} kWh`, `${h.num(mitSpeicher.selbst)} kWh`, h.eur(mitSpeicher.ersparnisJahr), 'depends on battery price'],
], `${h.num(WP)} Wp, ${h.num(VA)} VA, ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The flatter angle collects ${h.pct(mehrSchraeg, 0)} more power, but the family uses only part of it. A small battery raises self-consumption by ${h.num(speicherPlus)} kWh, worth ${h.eur(speicherPlus * STROMPREIS_CT / 100)} a year; whether that pays for the battery is worked out by the ${h.a('balkonkraftwerk-mit-speicher', 'battery calculator')}. A west balcony would give ${h.num(west.ertrag)} kWh upright. In condominiums the owners decide how it is mounted under ${h.src('weg_20', 'section 20 Condominium Act')}; tenants are entitled to permission under ${h.src('bgb_554', 'section 554 Civil Code')}.</p>

<h2>Where Stuttgart leads and where it does not</h2>
<p>Of the six largest cities after Berlin, Stuttgart has the most plug-in devices per resident, ${h.num(dichte, 1)} per 1,000. The ${h.src('mastr_einheiten', 'Market Master Data Register')} also shows that ${h.pct(vollQuote, 1)} of building systems export all their power, rank ${rangVoll} among the big cities, against ${h.pct(vollQuoteBund, 1)} nationally. ${h.pct(anteilS, 0)} of roofs face mainly south. What full feed-in brings compared with self-consumption is explained in the ${h.a('volleinspeisung-teileinspeisung', 'comparison of full and partial feed-in')}; for a balcony system the question does not arise, since it runs for your own use.</p>`,
  },
});

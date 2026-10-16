/**
 * Startseite (Säule): Balkonkraftwerk-Rechner. Jede Zahl kommt aus den Datendateien oder aus dem Motor,
 * die Beispiele werden beim Build gerechnet (RECETTE §17.4 Punkt 7).
 */
import type { Helpers, FAQ } from '../lib/guide-types';
import { rechneBalkon } from '../lib/engine/balkon';
import { ortVonPlz, EY_BUND, STANDORT, PLZ_ANZAHL } from '../lib/engine/standort';
import { P, STROMPREIS_CT, STROM, SMARD, SMARD_JAHR } from '../lib/engine/params';
import { EIGEN } from '../lib/engine/eigen';
import ST from '../data/staedte.json';


type C = { name: string; ey: number; ew: number; balkon: number; plz: string };
const city = (k: string) => (ST.staedte as Record<string, C>)[k];
const HH = city('hamburg'), MU = city('muenchen');
const bal = (plz: string, wp: number, tilt: number, az: number, sp = 0, vb = 2500) => rechneBalkon({ ort: ortVonPlz(plz), modulWp: wp, wechselrichterVa: 800, neigung: tilt, azimut: az, verschattung: 0, speicherKwh: sp, verbrauchKwh: vb, preisCt: STROMPREIS_CT, kostenEur: 450 });
const hh90 = bal(HH.plz, 900, 90, 0), mu90 = bal(MU.plz, 900, 90, 0), mu35 = bal(MU.plz, 900, 35, 0), hhW = bal(HH.plz, 900, 90, 90);
const be = ortVonPlz('10115')!;
const beS90 = bal('10115', 900, 90, 0), beS35 = bal('10115', 900, 35, 0), beE = bal('10115', 900, 90, -90);
const be1800 = bal('10115', 1800, 35, 0), be1800sp = bal('10115', 1800, 35, 0, 2);
const v1500 = bal('10115', 900, 35, 0, 0, 1500), v4500 = bal('10115', 900, 35, 0, 0, 4500);
const bundBalkon = ST.bund.balkon;
const neg = SMARD.years[SMARD_JAHR];
const BEISPIELE: Array<[string, string, number, number, number]> = [['Hamburg', HH.plz, 900, 90, 0], ['Berlin', '10115', 900, 35, 0], ['München', MU.plz, 900, 90, 0], ['Köln', city('koeln').plz, 1800, 35, 0], ['Dresden', city('dresden').plz, 1800, 35, 2]];

export interface HomeText { title: string; description: string; h1: string; intro: string; resume: (h: Helpers) => string; faqs: (h: Helpers) => FAQ[]; body: (h: Helpers) => string }

export const HOME: Record<'de' | 'en', HomeText> = {
  de: {
    title: 'Balkonkraftwerk-Rechner 2026: Ertrag für Ihre Postleitzahl',
    description: 'Balkonkraftwerk 2026: Ertrag nach Postleitzahl aus PVGIS, Eigenverbrauch aus 74 echten Haushalten, Ersparnis, Amortisation, 800 VA und 2 000 Wp, ohne Konto.',
    h1: 'Balkonkraftwerk-Rechner 2026: Ertrag und Ersparnis für Ihre Postleitzahl',
    intro: 'Postleitzahl, Module und Ausrichtung eingeben: Der Rechner zeigt sofort, wie viel Strom Ihr Steckersolargerät erzeugt, wie viel davon Ihr Haushalt wirklich nutzt und nach wie vielen Jahren es sich bezahlt hat.',
    resume: (h) => `Ein Balkonkraftwerk mit zwei Modulen zu je 450 Watt Peak, senkrecht am Südgeländer, erzeugt in Hamburg rund ${h.num(hh90.ertrag)} kWh im Jahr und in München rund ${h.num(mu90.ertrag)} kWh: Der Standort macht ${h.pct(mu90.ertrag / hh90.ertrag - 1, 0)} Unterschied, deshalb rechnet diese Seite mit der Postleitzahl und nicht mit einem Durchschnitt. Die Strahlung kommt aus PVGIS, dem Rechenwerk der EU-Kommission, einzeln abgefragt für jede der ${h.num(PLZ_ANZAHL)} deutschen Postleitzahlen. Wie viel davon die Stromrechnung senkt, hängt vom Verbrauch im selben Moment ab: Wir haben jede Viertelstunde eines Jahres gegen 74 gemessene Haushalte gerechnet. Bei ${h.num(2500)} kWh Jahresverbrauch nutzt ein Haushalt in Berlin mit diesem Gerät ${h.pct(beS90.eigenAnteil, 0)} des Stroms selbst und spart bei ${h.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde ${h.eur(beS90.ersparnisJahr)} im Jahr. Erlaubt sind ${h.num(P.balkon.max_wp)} Watt Peak Module an höchstens ${h.num(P.balkon.max_va)} Voltampere Wechselrichter; angemeldet wird nur im Marktstammdatenregister, innerhalb eines Monats.`,
    faqs: (h) => [
      { q: 'Wie viel Strom erzeugt ein 800-Watt-Balkonkraftwerk im Jahr?', a: `Das hängt vor allem von der Ausrichtung ab. Zwei Module mit zusammen 900 Wp bringen in Berlin senkrecht nach Süden rund ${h.num(beS90.ertrag)} kWh, aufgeständert mit 35° rund ${h.num(beS35.ertrag)} kWh und senkrecht nach Osten rund ${h.num(beE.ertrag)} kWh im Jahr. Die 800 W begrenzen nur die Leistung des Wechselrichters, nicht die Jahresmenge. Ihre Postleitzahl ändert den Wert um bis zu ein Sechstel.` },
      { q: 'Lohnt sich ein Balkonkraftwerk auch bei wenig Verbrauch?', a: `Ja, aber weniger. Mit 900 Wp aufgeständert nach Süden in Berlin nutzt ein Haushalt mit ${h.num(1500)} kWh Jahresverbrauch ${h.pct(v1500.eigenAnteil, 0)} des Stroms selbst und spart ${h.eur(v1500.ersparnisJahr)}, ein Haushalt mit ${h.num(4500)} kWh nutzt ${h.pct(v4500.eigenAnteil, 0)} und spart ${h.eur(v4500.ersparnisJahr)}. Entscheidend ist, wie viel tagsüber läuft: Kühlschrank, Router, Homeoffice.` },
      { q: 'Muss ich mein Balkonkraftwerk beim Netzbetreiber anmelden?', a: `Nein. Seit dem Solarpaket I genügt die Registrierung im Marktstammdatenregister der Bundesnetzagentur, innerhalb von ${P.mastr.frist_monate} Monat nach der Inbetriebnahme (§ 5 Abs. 5 MaStRV). Zusätzliche Meldungen beim Netzbetreiber dürfen nicht verlangt werden (§ 8 Abs. 5a EEG); das Register informiert ihn selbst. Ein Speicher wird dort als eigene Einheit eingetragen.` },
      { q: 'Bekomme ich Geld für den Strom, den ich ins Netz einspeise?', a: 'In der Regel nicht. Balkonkraftwerke laufen in der unentgeltlichen Abnahme: Der Überschuss fließt ins Netz, ohne Vergütung. Deshalb zählt im Rechner nur der selbst genutzte Teil als Ersparnis. Wer viel einspeist, gewinnt mehr durch einen kleinen Speicher oder durch Verbraucher, die mittags laufen, als durch größere Module.' },
      { q: 'Darf ich als Mieter ein Balkonkraftwerk aufstellen?', a: 'Sie dürfen es verlangen. Seit dem 17. Oktober 2024 zählt die Stromerzeugung durch Steckersolargeräte zu den baulichen Veränderungen, die der Vermieter erlauben muss, außer sie sind ihm unzumutbar (§ 554 Abs. 1 BGB). In der Eigentümergemeinschaft gilt dasselbe nach § 20 Abs. 2 WEG. Über das Wie, etwa Befestigung und Optik, wird gesprochen, über das Ob nicht mehr.' },
      { q: 'Warum zeigt der Rechner weniger Ersparnis als andere Rechner?', a: `Viele Rechner setzen einen festen Eigenverbrauch von 50 oder sogar 80 Prozent an. Wir simulieren jede Viertelstunde mit gemessenen Haushalten: Morgens und abends braucht der Haushalt Strom, wenn die Sonne schwach ist, mittags ist es umgekehrt. Mit einem Speicher von 2 kWh steigt der Eigenverbrauch einer 1 800-Wp-Anlage in Berlin von ${h.pct(be1800.eigenAnteil, 0)} auf ${h.pct(be1800sp.eigenAnteil, 0)}.` },
      { q: 'Welcher Strompreis steckt im Rechner?', a: `Voreingestellt sind ${h.num(STROMPREIS_CT, 1)} Cent je Kilowattstunde, der Durchschnittspreis deutscher Haushalte mit 2 500 bis 5 000 kWh im ${STROM.letztes_halbjahr.replace('-S1', ', erstes Halbjahr').replace('-S2', ', zweites Halbjahr')} nach Eurostat, einschließlich Grundpreisanteil und Steuern. Für die Ersparnis zählt Ihr Arbeitspreis auf der Rechnung, meist etwas niedriger. Tragen Sie ihn ein, das Ergebnis passt sich sofort an.` },
    ],
    body: (h) => `
<h2>So rechnet der Balkonkraftwerk-Rechner</h2>
<p>Der Rechner geht in vier Schritten vor, und jeder steht im Rechenweg unter dem Ergebnis. Zuerst liest er den Jahresertrag, den ${h.src('pvgis', 'PVGIS')} für den Mittelpunkt Ihrer Postleitzahl liefert: eine Anlage mit 1 kWp, 35° geneigt und nach Süden, mit dem Horizont aus dem Geländemodell. Wir haben dafür alle ${h.num(PLZ_ANZAHL)} deutschen Postleitzahlen einzeln abgefragt, dazu ${h.num(STANDORT.ey.length)} Rasterpunkte für Karten und Regionen. Dann rechnet er diesen Wert auf Ihre Neigung und Himmelsrichtung um, mit einer Matrix aus 81 weiteren PVGIS-Abfragen für Ihre Großregion. Senkrechte Module am Geländer verlieren gegenüber dem Optimum etwa ein Drittel, Ostmodule etwas weniger als Westmodule, weil der Morgen in Deutschland klarer ist als der Nachmittag.</p>
<p>Im dritten Schritt wird der Strom gegen den Verbrauch gelegt. Dafür nutzen wir die ${h.src('htw_lastprofile', 'Lastprofile der HTW Berlin')}: 74 Haushalte, ein Jahr lang minütlich gemessen. Jedes Profil wird auf Ihren Jahresverbrauch skaliert und Viertelstunde für Viertelstunde mit der Erzeugung verglichen. Nur was der Haushalt im selben Moment braucht, spart Geld; der Rest geht unvergütet ins Netz. Liegt die Modulleistung über ${h.num(P.balkon.max_va)} VA, kappt der Wechselrichter die Mittagsspitze, auch das wird abgezogen. Zum Schluss: selbst genutzte Kilowattstunden mal Strompreis ergibt die Ersparnis, Kaufpreis geteilt durch Ersparnis die Amortisation.</p>
<p>Nichts davon verlässt Ihren Browser. Der Rechner fragt weder nach Name noch nach Telefonnummer und leitet keine Anfrage an einen Händler oder Installateur weiter.</p>

<h2>Warum die Postleitzahl den Ertrag verändert</h2>
<p>Deutschland ist für die Sonne kein einheitliches Land. Am Rasterpunkt bei Hamburg liefert ein Kilowatt Peak bei 35° Süd ${h.num(HH.ey)} kWh im Jahr, bei München ${h.num(MU.ey)} kWh, im Bundesdurchschnitt nach Einwohnern ${h.num(EY_BUND)} kWh. Zwischen dem schwächsten und dem stärksten Rasterpunkt liegen ${h.num(STANDORT.min)} und ${h.num(STANDORT.max)} kWh. Wer mit einem Mittelwert für ganz Deutschland rechnet, verschätzt sich im Norden nach oben und im Süden nach unten.</p>
<p>Die gängigen Rechner fragen nach einer Region aus einer Liste oder nach dem Bundesland. Das reicht nicht: Innerhalb Bayerns trennt das Alpenvorland mit seinem Horizont und das Maintal mehr als zwischen manchem Nachbarland. PVGIS rechnet mit Satellitenstrahlung von 2005 bis 2023, mit Temperatur und Wind, und berücksichtigt Berge, die die tiefe Wintersonne verdecken. Ihre Hauswand oder der Baum gegenüber sind darin nicht enthalten; dafür gibt es unter dem Rechner die Verschattung.</p>
${h.table(['Stadt', 'kWh je kWp (35° Süd)', '900 Wp senkrecht Süd', 'Ersparnis/Jahr'], BEISPIELE.slice(0, 3).map(([n, plz]) => { const r = bal(plz, 900, 90, 0); return [n, h.num(ortVonPlz(plz)!.ey), `${h.num(r.ertrag)} kWh`, h.eur(r.ersparnisJahr)]; }), `Verbrauch ${h.num(2500)} kWh, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh, ohne Speicher.`, ['l', 'r', 'r', 'r'])}

<h2>Eigenverbrauch: warum nicht jede Kilowattstunde zählt</h2>
<p>Ein Balkonkraftwerk liefert seinen Strom zwischen zehn und sechzehn Uhr. In dieser Zeit laufen in vielen Wohnungen nur Kühlschrank, Router und Standby, zusammen vielleicht 100 bis 200 Watt. Die Simulation mit den 74 Haushalten zeigt, wie groß der Effekt ist: Mit 900 Wp aufgeständert in Berlin nutzt ein kleiner Haushalt mit ${h.num(1500)} kWh ${h.pct(v1500.eigenAnteil, 0)} des Stroms selbst, ein Haushalt mit ${h.num(4500)} kWh ${h.pct(v4500.eigenAnteil, 0)}.</p>
<p>Hier liegt der häufigste Fehler fremder Rechner: Sie setzen einen festen Prozentsatz an und multiplizieren ihn mit dem Ertrag. Das Ergebnis klingt besser, als es auf der Stromrechnung ankommt. Wer seine Waschmaschine, den Geschirrspüler oder das Laden des E-Bikes in die Mittagsstunden legt, liegt über unserem Mittelwert, wer tagsüber außer Haus ist, darunter.</p>
<!--mini:eigenverbrauch-->

<h2>Senkrecht am Geländer oder aufgeständert</h2>
<p>Die meisten Balkonkraftwerke hängen senkrecht am Geländer. Das ist sicher und unauffällig, kostet aber Ertrag: In Berlin bringen dieselben 900 Wp senkrecht nach Süden ${h.num(beS90.ertrag)} kWh, mit 35° aufgeständert ${h.num(beS35.ertrag)} kWh. Senkrechte Module haben einen Vorteil, den viele übersehen: Sie liefern im Winter vergleichsweise viel, wenn die Sonne tief steht, und im Sommer weniger Spitze, die der Haushalt ohnehin nicht nutzen würde. Der Eigenverbrauchsanteil liegt deshalb höher.</p>
<p>Ost- und Westbalkone sind kein Ausschlussgrund. Senkrecht nach Westen kommt ein Gerät in Hamburg noch auf ${h.num(hhW.ertrag)} kWh, und der Strom fällt in den Nachmittag und frühen Abend, wenn mehr verbraucht wird. Ein Nordbalkon dagegen lohnt sich selten; der Rechner zeigt es, wenn Sie Nord wählen.</p>

<h2>800 Watt, 2 000 Watt Peak und Speicher</h2>
<p>Seit dem Solarpaket I gilt ein Gerät als Steckersolargerät, wenn die Module zusammen höchstens ${h.num(P.balkon.max_wp)} Watt Peak und der Wechselrichter höchstens ${h.num(P.balkon.max_va)} Voltampere haben (${h.src('eeg_8', '§ 8 Abs. 5a EEG')}). Mehr Module an einem 800-VA-Wechselrichter sind also erlaubt. Sie bringen morgens, abends und im Winter mehr Strom; mittags regelt der Wechselrichter ab. Bei 1 800 Wp aufgeständert in Berlin gehen so ${h.num(be1800.abgeregelt)} kWh von ${h.num(be1800.ertragBrutto)} kWh verloren.</p>
<p>Ein Speicher auf der Gleichstromseite fängt genau diese Spitze auf und gibt sie abends ab. Mit 2 kWh steigt der selbst genutzte Strom dieser Anlage von ${h.num(be1800.selbst)} auf ${h.num(be1800sp.selbst)} kWh im Jahr, ein Plus von ${h.eur(be1800sp.ersparnisJahr - be1800.ersparnisJahr)}. Ob sich das rechnet, hängt vom Aufpreis ab; der ${h.a('balkonkraftwerk-mit-speicher', 'Rechner für Balkonkraftwerke mit Speicher')} vergleicht beide Fälle direkt.</p>

<h2>Anmeldung, Zähler und Mietwohnung</h2>
<p>Angemeldet wird ausschließlich im ${h.src('mastr', 'Marktstammdatenregister')}, innerhalb eines Monats nach der Inbetriebnahme (${h.src('mastrv_5', '§ 5 Abs. 5 MaStRV')}). Der Eintrag dauert etwa eine Viertelstunde; ein Speicher wird als zweite Einheit ergänzt. Am ${h.date(ST.source.mastr_retrieved_at)} waren dort bundesweit ${h.num(bundBalkon)} Steckersolargeräte in Betrieb registriert. Ein alter Drehstromzähler darf bis zum Tausch weiterlaufen, auch wenn er bei Überschuss rückwärts zählt (${h.src('eeg_10a', '§ 10a Abs. 3 EEG')}); den Zweirichtungszähler baut der Messstellenbetreiber ohne eigenen Auftrag ein.</p>
<p>Mieter haben seit dem 17. Oktober 2024 (${h.src('bgbl_2024_306', 'BGBl. 2024 I Nr. 306')}) einen Anspruch auf die Erlaubnis (${h.src('bgb_554', '§ 554 BGB')}), Wohnungseigentümer auf den Beschluss der Gemeinschaft (${h.src('weg_20', '§ 20 WEG')}). Beim Kauf zahlen Sie keine Mehrwertsteuer auf Module, Wechselrichter und Speicher (${h.src('ustg_12', '§ 12 Abs. 3 UStG')}), und die Ersparnis ist kein Einkommen.</p>

<h2>Werte und Annahmen 2026</h2>
${h.table(['Wert', 'Stand', 'Quelle'], [
  ['Module höchstens', `${h.num(P.balkon.max_wp)} Wp`, '§ 8 Abs. 5a EEG'],
  ['Wechselrichter höchstens', `${h.num(P.balkon.max_va)} VA`, '§ 8 Abs. 5a EEG'],
  ['Frist für die Registrierung', `${P.mastr.frist_monate} Monat`, '§ 5 Abs. 5 MaStRV'],
  ['Strompreis Haushalte', `${h.num(STROMPREIS_CT, 1)} ct/kWh`, `Eurostat, ${STROM.letztes_halbjahr}`],
  ['Ertrag 35° Süd, Bundesmittel', `${h.num(EY_BUND)} kWh/kWp`, 'PVGIS 5.3, SARAH-3'],
  ['Systemverluste', `${h.num(P.pvgis.verluste_pct)} %`, 'PVGIS-Standard'],
  ['Haushaltsprofile', `${h.num(EIGEN.households)} Haushalte, ${h.num(EIGEN.resolution_min)} Minuten`, 'HTW Berlin'],
  [`Stunden mit negativem Preis ${SMARD_JAHR}`, h.num(neg.neg_hours), 'SMARD'],
], 'Alle Werte werden aus den Datendateien gelesen; ändert sich eine Quelle, ändert sich jede Seite.', ['l', 'r', 'l'])}

<h2>Beispiele aus fünf Städten</h2>
${h.table(['Stadt', 'Anlage', 'Erzeugung', 'selbst genutzt', 'Ersparnis', 'Amortisation'], BEISPIELE.map(([n, plz, wp, tilt, sp]) => { const r = bal(plz, wp, tilt, 0, sp); return [n, `${h.num(wp)} Wp, ${tilt}°${sp ? `, ${h.num(sp)} kWh` : ''}`, `${h.num(r.ertrag)} kWh`, h.pct(r.eigenAnteil, 0), h.eur(r.ersparnisJahr), r.amortisationJahre ? `${h.num(r.amortisationJahre, 1)} J.` : '–']; }), `Ausrichtung Süd, Verbrauch ${h.num(2500)} kWh, Kaufpreis ${h.eur(450)}, beim Speicher dieselben ${h.eur(450)} (Rechnung je Zeile, Preise bitte selbst eintragen).`, ['l', 'l', 'r', 'r', 'r', 'r'])}

<h2>Wann sich ein Balkonkraftwerk nicht lohnt</h2>
<p>Ein Gerät am Nordbalkon, ein Balkon im Schatten eines Nachbarhauses, ein Haushalt, der tagsüber leer ist und kaum Grundlast hat: Dann sinkt die Ersparnis unter 50 Euro im Jahr, und die Amortisation dauert länger als die Lebensdauer des Wechselrichters. Auch ein großer Speicher an einem kleinen Gerät lohnt selten; er wird im Winter kaum voll. Der Rechner zeigt solche Fälle ehrlich, statt sie schönzurechnen.</p>
<p>Wer ein Einfamilienhaus mit freiem Dach hat, sollte die Rechnung auch für eine richtige Anlage machen: Der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')} rechnet mit der Einspeisevergütung des Inbetriebnahme-Zeitraums und der 60-Prozent-Grenze des Solarspitzengesetzes.</p>

<h2>Alle Rechner auf einen Blick</h2>
<ul>
<li>${h.a('balkonkraftwerk-mit-speicher', 'Balkonkraftwerk mit Speicher')}: mit und ohne Batterie im direkten Vergleich.</li>
<li>${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')}: Dachanlage mit Eigenverbrauch und Einspeisung.</li>
<li>${h.a('stromspeicher-rechner', 'Stromspeicher-Rechner')}: was eine Batterie am Hausdach bringt.</li>
<li>${h.a('einspeiseverguetung', 'Einspeisevergütung')}: Satz nach Inbetriebnahme und Leistung.</li>
<li>${h.a('pv-ertrag-plz', 'PV-Ertrag nach Postleitzahl')}: kWh je kWp für jede Ausrichtung.</li>
<li>${h.a('wie-viel-kwp', 'Wie viel kWp?')}: die wirtschaftlichste Anlagengröße.</li>
</ul>`,
  },
  en: {
    title: 'Plug-in Solar Calculator Germany 2026: Yield by Postcode',
    description: 'Balkonkraftwerk calculator 2026: yield for any German postcode from PVGIS, self-use from 74 metered homes, saving and payback, 800 VA and 2,000 Wp rules.',
    h1: 'Plug-in solar calculator 2026: yield and saving for your German postcode',
    intro: 'Enter your postcode, panels and orientation: the calculator instantly shows how much power your balcony solar device (Balkonkraftwerk) produces in Germany, how much of it your household actually uses and when it has paid for itself.',
    resume: (h) => `A plug-in solar device with two 450 Wp panels hanging upright on a south-facing balcony produces about ${h.num(hh90.ertrag)} kWh a year in Hamburg and about ${h.num(mu90.ertrag)} kWh in Munich: location alone makes a ${h.pct(mu90.ertrag / hh90.ertrag - 1, 0)} difference, which is why this page works from the postcode instead of a national average. Radiation comes from PVGIS, the European Commission's solar model, queried separately for each of Germany's ${h.num(PLZ_ANZAHL)} postcodes. How much of that cuts your bill depends on what you use at the same moment, so we ran every quarter-hour of a year against 74 metered German households. At ${h.num(2500)} kWh of annual use, a Berlin household with this device uses ${h.pct(beS90.eigenAnteil, 0)} of the output itself and saves ${h.eur(beS90.ersparnisJahr)} a year at ${h.num(STROMPREIS_CT, 1)} cents per kWh. The law allows ${h.num(P.balkon.max_wp)} Wp of panels on an inverter of at most ${h.num(P.balkon.max_va)} VA, and the only registration is in the federal Market Master Data Register, within one month.`,
    faqs: (h) => [
      { q: 'How much power does an 800 W balcony solar system produce in a year?', a: `Mostly a question of orientation. Two panels totalling 900 Wp give about ${h.num(beS90.ertrag)} kWh a year in Berlin hanging upright facing south, about ${h.num(beS35.ertrag)} kWh tilted at 35° and about ${h.num(beE.ertrag)} kWh upright facing east. The 800 W only caps the inverter output, not the annual amount. Your postcode moves the figure by up to a sixth.` },
      { q: 'Is plug-in solar worth it if my household uses little power?', a: `Yes, but less so. With 900 Wp tilted south in Berlin, a household using ${h.num(1500)} kWh a year uses ${h.pct(v1500.eigenAnteil, 0)} of the output and saves ${h.eur(v1500.ersparnisJahr)}; one using ${h.num(4500)} kWh uses ${h.pct(v4500.eigenAnteil, 0)} and saves ${h.eur(v4500.ersparnisJahr)}. What matters is the daytime load: fridge, router, home office.` },
      { q: 'Do I have to tell the grid operator about my plug-in solar device?', a: `No. Since the 2024 solar package, registering in the Federal Network Agency's Market Master Data Register within ${P.mastr.frist_monate} month of commissioning is enough (section 5(5) MaStRV). The grid operator may not ask for extra notices (section 8(5a) EEG); the register informs it. A battery is entered there as a separate unit.` },
      { q: 'Am I paid for the power my balcony system sends to the grid?', a: 'Usually not. Plug-in devices run under unpaid acceptance: surplus flows into the grid without payment. That is why the calculator counts only the self-used share as a saving. If you export a lot, a small battery or appliances that run at midday gain you more than extra panels.' },
      { q: 'Can I install balcony solar as a tenant in Germany?', a: 'You can require your landlord to allow it. Since 17 October 2024 power generation by plug-in solar devices is one of the alterations a landlord must permit unless it is unreasonable for them (section 554(1) Civil Code). The same applies in owners’ associations under section 20(2) of the Condominium Act. Mounting and appearance can be discussed, the principle no longer.' },
      { q: 'Why does this calculator show a lower saving than others?', a: `Many calculators assume a flat self-consumption of 50 or even 80 per cent. We simulate every quarter-hour with metered households: mornings and evenings need power when the sun is weak, midday is the reverse. With a 2 kWh battery, self-consumption of a 1,800 Wp system in Berlin rises from ${h.pct(be1800.eigenAnteil, 0)} to ${h.pct(be1800sp.eigenAnteil, 0)}.` },
      { q: 'Which electricity price does the calculator use?', a: `The default is ${h.num(STROMPREIS_CT, 1)} cents per kWh, the Eurostat average for German households using 2,500 to 5,000 kWh in ${STROM.letztes_halbjahr.replace('-S1', ', first half').replace('-S2', ', second half')}, including the standing charge share and taxes. For your saving, the unit rate (Arbeitspreis) on your bill counts, usually a little lower. Enter it and the result updates at once.` },
    ],
    body: (h) => `
<h2>How the calculator works</h2>
<p>The calculator goes through four steps, all listed in the calculation path under the result. First it reads the annual yield that ${h.src('pvgis', 'PVGIS')} gives for the centre of your postcode: a 1 kWp system tilted 35° to the south, including the horizon from the terrain model. We queried all ${h.num(PLZ_ANZAHL)} German postcodes one by one, plus ${h.num(STANDORT.ey.length)} grid points for maps and regions. It then converts that value to your tilt and direction using a matrix of 81 further PVGIS queries for your region. Panels hanging upright on a railing lose about a third against the optimum; east-facing panels lose a little less than west-facing ones because German mornings are clearer than afternoons.</p>
<p>The third step sets the output against consumption. We use the ${h.src('htw_lastprofile', 'HTW Berlin load profiles')}: 74 households, metered minute by minute for a year. Each profile is scaled to your annual consumption and compared with generation quarter-hour by quarter-hour. Only what the household needs at that moment saves money; the rest goes to the grid unpaid. If the panels exceed the ${h.num(P.balkon.max_va)} VA inverter, it clips the midday peak, and that is deducted too. Finally, self-used kilowatt-hours times your electricity price give the saving, and purchase price divided by saving gives the payback.</p>
<p>None of this leaves your browser. The calculator never asks for a name or phone number and passes no request to a retailer or installer.</p>

<h2>Why your postcode changes the yield</h2>
<p>Germany is not one country as far as the sun is concerned. At the grid point near Hamburg, one kilowatt peak at 35° south yields ${h.num(HH.ey)} kWh a year; near Munich ${h.num(MU.ey)} kWh; the population-weighted national average is ${h.num(EY_BUND)} kWh. Between the weakest and the strongest grid point lie ${h.num(STANDORT.min)} and ${h.num(STANDORT.max)} kWh. Working from a single German average overestimates the north and underestimates the south.</p>
<p>The usual German calculators ask you to pick a region from a list or your federal state. That is too coarse: within Bavaria, the Alpine foothills with their horizon and the Main valley differ by more than some neighbouring countries. PVGIS uses satellite radiation from 2005 to 2023, temperature and wind, and accounts for mountains that hide the low winter sun. Your own building or the tree opposite are not included; that is what the shading option under the calculator is for.</p>
${h.table(['City', 'kWh per kWp (35° south)', '900 Wp upright south', 'Saving/year'], BEISPIELE.slice(0, 3).map(([n, plz]) => { const r = bal(plz, 900, 90, 0); return [n === 'München' ? 'Munich' : n, h.num(ortVonPlz(plz)!.ey), `${h.num(r.ertrag)} kWh`, h.eur(r.ersparnisJahr)]; }), `Consumption ${h.num(2500)} kWh, electricity price ${h.num(STROMPREIS_CT, 1)} ct/kWh, no battery.`, ['l', 'r', 'r', 'r'])}

<h2>Self-consumption: why not every kilowatt-hour counts</h2>
<p>A balcony system delivers between ten in the morning and four in the afternoon. In many flats, only the fridge, router and standby devices run then, perhaps 100 to 200 watts together. The simulation with 74 households shows how big the effect is: with 900 Wp tilted south in Berlin, a small household using ${h.num(1500)} kWh uses ${h.pct(v1500.eigenAnteil, 0)} of the output itself, one using ${h.num(4500)} kWh uses ${h.pct(v4500.eigenAnteil, 0)}.</p>
<p>This is where other calculators most often go wrong: they apply a fixed percentage to the yield. The result sounds better than what reaches your bill. If you run the washing machine, dishwasher or e-bike charger around midday you will beat our average; if the flat is empty during the day you will fall below it.</p>
<!--mini:eigenverbrauch-->

<h2>Upright on the railing or tilted on a stand</h2>
<p>Most plug-in systems hang upright on the balcony railing. That is safe and discreet but costs yield: in Berlin the same 900 Wp give ${h.num(beS90.ertrag)} kWh upright facing south and ${h.num(beS35.ertrag)} kWh tilted at 35°. Upright panels have an often overlooked advantage: they deliver comparatively well in winter when the sun is low, and less of a summer peak the household could not use anyway. Their self-consumption share is therefore higher.</p>
<p>East and west balconies are no reason to give up. Upright and facing west, a device in Hamburg still reaches ${h.num(hhW.ertrag)} kWh, and the power arrives in the afternoon and early evening when use is higher. A north-facing balcony rarely pays; the calculator shows it if you choose north.</p>

<h2>800 watts, 2,000 watts peak and batteries</h2>
<p>Since the 2024 solar package, a device counts as plug-in solar (Steckersolargerät) if its panels total at most ${h.num(P.balkon.max_wp)} Wp and the inverter at most ${h.num(P.balkon.max_va)} VA (${h.src('eeg_8', 'section 8(5a) EEG')}). More panel output on an 800 VA inverter is therefore allowed. It gives more power in the morning, evening and winter; at midday the inverter clips. With 1,800 Wp tilted south in Berlin, ${h.num(be1800.abgeregelt)} kWh of ${h.num(be1800.ertragBrutto)} kWh are lost that way.</p>
<p>A battery on the DC side catches exactly that peak and releases it in the evening. With 2 kWh, the self-used power of that system rises from ${h.num(be1800.selbst)} to ${h.num(be1800sp.selbst)} kWh a year, a gain of ${h.eur(be1800sp.ersparnisJahr - be1800.ersparnisJahr)}. Whether that pays depends on the extra cost; the ${h.a('balkonkraftwerk-mit-speicher', 'plug-in solar battery calculator')} compares both cases side by side.</p>

<h2>Registration, meters and rented flats</h2>
<p>The only registration is in the ${h.src('mastr', 'Market Master Data Register')}, within one month of commissioning (${h.src('mastrv_5', 'section 5(5) MaStRV')}). It takes about a quarter of an hour; a battery is added as a second unit. On ${h.date(ST.source.mastr_retrieved_at)}, ${h.num(bundBalkon)} plug-in devices in operation were registered there nationwide. An old electromechanical meter may keep running until it is replaced, even if it turns backwards when you export (${h.src('eeg_10a', 'section 10a(3) EEG')}); the metering operator fits the bidirectional meter without you ordering it.</p>
<p>Since 17 October 2024 (${h.src('bgbl_2024_306', 'Federal Law Gazette 2024 I no. 306')}) tenants have a right to permission (${h.src('bgb_554', 'section 554 Civil Code')}) and flat owners to a decision by the owners' association (${h.src('weg_20', 'section 20 Condominium Act')}). You pay no VAT on panels, inverter or battery (${h.src('ustg_12', 'section 12(3) VAT Act')}), and the saving is not taxable income.</p>

<h2>Values and assumptions for 2026</h2>
${h.table(['Value', 'Figure', 'Source'], [
  ['Panels, maximum', `${h.num(P.balkon.max_wp)} Wp`, 'Section 8(5a) EEG'],
  ['Inverter, maximum', `${h.num(P.balkon.max_va)} VA`, 'Section 8(5a) EEG'],
  ['Registration deadline', `${P.mastr.frist_monate} month`, 'Section 5(5) MaStRV'],
  ['Household electricity price', `${h.num(STROMPREIS_CT, 1)} ct/kWh`, `Eurostat, ${STROM.letztes_halbjahr}`],
  ['Yield 35° south, national mean', `${h.num(EY_BUND)} kWh/kWp`, 'PVGIS 5.3, SARAH-3'],
  ['System losses', `${h.num(P.pvgis.verluste_pct)}%`, 'PVGIS default'],
  ['Household profiles', `${h.num(EIGEN.households)} homes, ${h.num(EIGEN.resolution_min)} minutes`, 'HTW Berlin'],
  [`Hours with negative prices in ${SMARD_JAHR}`, h.num(neg.neg_hours), 'SMARD'],
], 'All values are read from the data files; when a source changes, every page changes with it.', ['l', 'r', 'l'])}

<h2>Examples from five cities</h2>
${h.table(['City', 'System', 'Output', 'Used at home', 'Saving', 'Payback'], BEISPIELE.map(([n, plz, wp, tilt, sp]) => { const r = bal(plz, wp, tilt, 0, sp); return [n === 'München' ? 'Munich' : n === 'Köln' ? 'Cologne' : n, `${h.num(wp)} Wp, ${tilt}°${sp ? `, ${h.num(sp)} kWh` : ''}`, `${h.num(r.ertrag)} kWh`, h.pct(r.eigenAnteil, 0), h.eur(r.ersparnisJahr), r.amortisationJahre ? `${h.num(r.amortisationJahre, 1)} yrs` : '–']; }), `Facing south, consumption ${h.num(2500)} kWh, purchase price ${h.eur(450)}, also ${h.eur(450)} for the battery row (one calculation per row, enter your own prices).`, ['l', 'l', 'r', 'r', 'r', 'r'])}

<h2>When plug-in solar does not pay</h2>
<p>A device on a north balcony, a balcony shaded by the building opposite, a household that is empty all day with little base load: then the saving drops below 50 euros a year and payback takes longer than the inverter lasts. A large battery on a small device rarely pays either; in winter it hardly fills. The calculator shows such cases honestly instead of flattering them.</p>
<p>If you own a house with a free roof, run the numbers for a full system too: the ${h.a('photovoltaik-rechner', 'rooftop PV calculator')} uses the feed-in tariff for the commissioning period and the 60 per cent limit of the 2025 solar peak law.</p>

<h2>All calculators at a glance</h2>
<ul>
<li>${h.a('balkonkraftwerk-mit-speicher', 'Plug-in solar with battery')}: with and without, side by side.</li>
<li>${h.a('photovoltaik-rechner', 'Rooftop PV calculator')}: self-consumption and feed-in.</li>
<li>${h.a('stromspeicher-rechner', 'Home battery calculator')}: what a battery adds to a roof system.</li>
<li>${h.a('einspeiseverguetung', 'Feed-in tariff')}: the rate by commissioning date and size.</li>
<li>${h.a('pv-ertrag-plz', 'PV yield by postcode')}: kWh per kWp for any orientation.</li>
<li>${h.a('wie-viel-kwp', 'How many kWp?')}: the most economic system size.</li>
</ul>`,
  },
};

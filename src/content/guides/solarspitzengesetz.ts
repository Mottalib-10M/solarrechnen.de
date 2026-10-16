import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { PERIODEN } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT, SMARD, SMARD_JAHR } from '../../lib/fmt';

/**
 * Beispiele aus dem Motor (Bundesmittel, Süd 30°, 4 000 kWh): 10 kWp neu ohne und mit Smart Meter, mit 5 kWh Speicher,
 * Ost-West, Volleinspeisung, und dieselbe Anlage mit Inbetriebnahme vor dem Stichtag (Bestandsanlage).
 */
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 15000 };
const neu = rechnePv(base);
const sm = rechnePv({ ...base, smartMeter: true });
const sp = rechnePv({ ...base, speicherKwh: 5 });
const ow = rechnePv({ ...base, ostWest: true });
const voll = rechnePv({ ...base, modus: 'voll' });
const alt = rechnePv({ ...base, inbetrieb: '2024-06-01' });
const kapEur = neu.abgeregelt * neu.satzCt / 100;
const kapAnteil = neu.ertrag ? neu.abgeregelt / neu.ertrag : 0;
const vollAnteil = voll.ertrag ? voll.abgeregelt / voll.ertrag : 0;
const S = P.solarspitzen;
const eeg23Start = PERIODEN[0].von;
const negStd = SMARD.years[SMARD_JAHR].neg_hours;
const tag = (iso: string, l: 'de' | 'en', shift = 0) => new Date(Date.parse(iso) + shift * 864e5).toLocaleDateString(l === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const jahrAlt = P.eeg.anwendbar_bis.slice(0, 4);

export default defineGuide({
  id: 'solarspitzengesetz',
  group: 'recht',
  order: 60,
  mini: 'sechzig',
  miniHref: 'photovoltaik-rechner',
  related: ['negative-strompreise', 'einspeiseverguetung', 'stromspeicher-groesse', 'balkonkraftwerk-800-watt', 'einspeiseverguetung-2027'],
  sources: ['eeg_9', 'eeg_51', 'eeg_51a', 'eeg_100', 'smard'],
  de: {
    slug: 'solarspitzengesetz',
    nav: 'Solarspitzengesetz',
    card: 'Was seit Februar 2025 für neue Dachanlagen gilt: 60-Prozent-Deckel, negative Preise, Verlängerung nach § 51a.',
    title: 'Solarspitzengesetz 2026: 60-%-Grenze und negative Preise',
    description: `Solarspitzengesetz 2026: wann die 60-%-Grenze greift, warum bei negativen Preisen nichts gezahlt wird, was § 51a zurückgibt und welche Anlagen ausgenommen sind.`,
    h1: 'Solarspitzengesetz 2026: was der Deckel Ihre Dachanlage kostet',
    intro: `Eine neue 10-kWp-Anlage ohne Smart Meter verliert durch die Grenze von ${DE.pct(S.begrenzung_anteil)} rund ${DE.num(neu.abgeregelt)} kWh im Jahr, also ${DE.eur(kapEur)}. Mit Smart Meter entfällt der Deckel, dafür fehlen bei negativen Preisen etwa ${DE.eur(sm.negVerlustJahr)}.`,
    resume: `Das Solarspitzengesetz ist eine Änderung des EEG 2023, die am ${tag(S.stichtag, 'de')} in Kraft trat und zwei Stellschrauben für neue Solaranlagen unter ${DE.num(S.begrenzung_bis_kw)} kW setzt. Solange kein intelligentes Messsystem mit Steuerbox eingebaut und vom Netzbetreiber getestet ist, darf eine Anlage in der Einspeisevergütung höchstens ${DE.pct(S.begrenzung_anteil)} ihrer installierten Leistung ins Netz geben (§ 9 Abs. 2 EEG). Für eine 10-kWp-Anlage nach Süden mit 4 000 kWh Hausverbrauch kostet das im Bundesmittel ${DE.num(neu.abgeregelt)} kWh oder ${DE.pct(kapAnteil, 1)} des Ertrags, rund ${DE.eur(kapEur)} im Jahr. Ist der Smart Meter da, fällt die Grenze weg, aber ab dem folgenden Kalenderjahr gibt es für Viertelstunden mit negativem Börsenpreis keine Vergütung (§ 51 EEG). Bei ${DE.pct(SMARD.years[SMARD_JAHR].pv_neg_share)} des Solarstroms in solchen Stunden ${SMARD_JAHR} wären das ${DE.eur(sm.negVerlustJahr)} im Jahr. Die Hälfte dieser Zeit hängt § 51a an das Ende der ${DE.num(P.eeg.dauer_jahre)} Förderjahre an. Steckersolargeräte und Anlagen, die vor dem Stichtag liefen, sind ausgenommen.`,
    faqs: [
      { q: 'Gilt das Solarspitzengesetz auch für meine Anlage von 2023?', a: `Nein, nicht zwingend. Für Anlagen, die zwischen dem Start des EEG 2023 und dem ${tag(S.stichtag, 'de', -1)} ans Netz gingen, schließt § 100 Abs. 3b EEG die Grenze von ${DE.pct(S.begrenzung_anteil)} aus, und § 100 Abs. 46 lässt die alte Fassung der Regel zu negativen Preisen weiter gelten. Wer freiwillig wechseln will, kann das nach § 100 Abs. 47 schriftlich erklären, frühestens zum Ende des Jahres, in dem der Smart Meter kommt.` },
      { q: 'Wie viel Ertrag kostet die 60-Prozent-Grenze bei einem Ost-West-Dach?', a: `Deutlich weniger als bei einem Süddach. Im Bundesmittel verliert eine 10-kWp-Anlage nach Süden ${DE.num(neu.abgeregelt)} kWh im Jahr, dieselbe Anlage je zur Hälfte nach Osten und Westen nur ${DE.num(ow.abgeregelt)} kWh. Die Spitze ist bei Ost-West flacher, weil die beiden Flächen ihr Maximum zu verschiedenen Tageszeiten erreichen und mittags selten gleichzeitig volle Leistung liefern.` },
      { q: 'Wann endet der Deckel, wenn der Smart Meter eingebaut wird?', a: `Nicht schon mit dem Zähler selbst. § 9 Abs. 2 EEG verlangt den Einbau des intelligenten Messsystems und der Steuerungseinrichtung sowie den ersten erfolgreichen Test der Ansteuerbarkeit durch den Netzbetreiber. Erst danach darf die Anlage mit voller Leistung einspeisen. Bis dahin bleibt die Begrenzung auf ${DE.pct(S.begrenzung_anteil)} der installierten Leistung am Netzanschlusspunkt bestehen.` },
      { q: 'Muss ich für Stunden mit negativem Preis Strom abschalten?', a: `Nein. § 51 EEG setzt in diesen Viertelstunden nur den anzulegenden Wert auf null: Die Anlage darf weiter einspeisen, bekommt dafür aber nichts. Für neue Anlagen unter ${DE.num(S.neg_preis_bis_kw)} kW gilt das erst ab dem Jahr nach dem Einbau des intelligenten Messsystems. Wirtschaftlich klug ist es dann, mittags Speicher, Wärmepumpe oder Auto zu laden.` },
      { q: 'Was bringt die Verlängerung nach § 51a in Euro?', a: `Weniger als der Ausfall, aber nicht nichts. Die Viertelstunden ohne Vergütung werden mit dem Faktor ${DE.num(S.verlaengerung_faktor, 1)} gewichtet und als Zeitkontingent an das Ende der ${DE.num(P.eeg.dauer_jahre)} Jahre gehängt, angerechnet mit festen Volllastviertelstunden je Monat. Bei ${DE.eur(sm.negVerlustJahr)} Ausfall im Jahr kommt in den Nachlaufmonaten grob die Hälfte zurück, allerdings erst nach zwei Jahrzehnten und zum dann gültigen Satz Ihrer Anlage.` },
      { q: 'Ist ein Balkonkraftwerk von der 60-Prozent-Regel betroffen?', a: `Nein. § 9 Abs. 2 Satz 4 EEG nimmt Steckersolargeräte bis ${DE.num(P.balkon.max_wp)} Watt Modulleistung und ${DE.num(P.balkon.max_va)} Voltampere Wechselrichterleistung hinter dem Zähler eines Haushalts ausdrücklich aus. Ein Balkonkraftwerk wird ohnehin nicht vergütet, deshalb spielt auch die Regel zu negativen Preisen für es keine Rolle. Begrenzt ist es nur durch seinen Wechselrichter.` },
    ],
    body: (h) => `
<h2>Zwei Hebel für die Mittagsspitze</h2>
<p>Das Gesetz zur Vermeidung temporärer Erzeugungsüberschüsse, im Alltag Solarspitzengesetz genannt, reagiert auf ein neues Problem: An sonnigen Frühlingstagen erzeugen Millionen Dachanlagen mittags mehr Strom, als das Netz aufnimmt, und der Börsenpreis fällt unter null. ${SMARD_JAHR} gab es laut ${h.src('smard', 'SMARD')} ${h.num(negStd)} solcher Stunden. Die Reform setzt deshalb an zwei Stellen an. Erstens wird die Einspeiseleistung kleiner Anlagen gedeckelt, solange der Netzbetreiber sie nicht fernsteuern kann. Zweitens entfällt die Vergütung, wenn der Strom an der Börse nichts wert ist, sobald die Anlage digital gemessen wird. Beide Hebel greifen nicht gleichzeitig: Entweder gilt der Deckel oder die Nullstellung.</p>

<h2>Die Grenze von ${h.pct(S.begrenzung_anteil)} im Wortlaut</h2>
<p>${h.src('eeg_9', '§ 9 Abs. 2 Satz 1 Nr. 2 Buchst. b und Nr. 3 EEG')} verpflichtet Betreiber von Anlagen unter ${h.num(S.begrenzung_bis_kw)} kW, die der Einspeisevergütung zugeordnet sind, die maximale Wirkleistungseinspeisung am Verknüpfungspunkt auf ${h.pct(S.begrenzung_anteil)} der installierten Leistung zu begrenzen. Entscheidend ist der Netzanschlusspunkt, nicht der Wechselrichter: Was das Haus gleichzeitig verbraucht oder der Speicher aufnimmt, zählt nicht gegen die Grenze. Eine 10-kWp-Anlage darf also mit ${h.num(10 * S.begrenzung_anteil)} kW einspeisen und darüber hinaus beliebig viel selbst nutzen. Die Pflicht endet erst, wenn intelligentes Messsystem und Steuerungseinrichtung eingebaut sind und der Netzbetreiber die Ansteuerung einmal erfolgreich getestet hat.</p>
<p>In der Praxis kappt der Wechselrichter oder ein Energiemanager die Leistung an wenigen Tagen im Jahr für einige Mittagsstunden. Die Simulation mit 74 gemessenen Haushalten zeigt, wie klein der Verlust meist ist:</p>
${h.table(['Fall (10 kWp, 4 000 kWh)', 'abgeregelt', 'Anteil am Ertrag', 'Verlust bei Bestandsregel'], [
  ['Süd 30°, ohne Speicher', `${h.num(neu.abgeregelt)} kWh`, h.pct(kapAnteil, 1), h.eur(kapEur)],
  ['Süd 30°, 5 kWh Speicher', `${h.num(sp.abgeregelt)} kWh`, h.pct(sp.ertrag ? sp.abgeregelt / sp.ertrag : 0, 1), h.eur(sp.abgeregelt * sp.satzCt / 100)],
  ['Ost-West 30°', `${h.num(ow.abgeregelt)} kWh`, h.pct(ow.ertrag ? ow.abgeregelt / ow.ertrag : 0, 1), h.eur(ow.abgeregelt * ow.satzCt / 100)],
  ['Volleinspeisung Süd', `${h.num(voll.abgeregelt)} kWh`, h.pct(vollAnteil, 1), h.eur(voll.abgeregelt * voll.satzCt / 100)],
], `Bundesmittel, Inbetriebnahme ab ${h.date(neu.periodeVon)}, kein Smart Meter. Verlust bewertet zum Satz der Anlage.`, ['l', 'r', 'r', 'r'])}
<p>Bemerkenswert ist der kleine Effekt des Speichers: Ein Batteriespeicher ist mittags oft schon voll, wenn die Spitze kommt, und hilft gegen den Deckel nur, wenn ihn ein Energiemanager gezielt erst zur Mittagszeit lädt. Bei Volleinspeisung wirkt die Grenze stärker, weil kein Hausverbrauch die Spitze abfängt. Den Speicher dimensionieren Sie besser nach Ihrem Abendverbrauch; wie, steht unter ${h.a('stromspeicher-groesse', 'Speichergröße')}.</p>

<h2>Null Cent bei negativen Preisen</h2>
<p>${h.src('eeg_51', '§ 51 Abs. 1 EEG')} ist knapp: Für Zeiträume mit negativem Spotmarktpreis verringert sich der anzulegende Wert auf null. Seit dem Stichtag gilt das viertelstundengenau und schon ab der ersten negativen Viertelstunde. Für Anlagen unter ${h.num(S.neg_preis_bis_kw)} kW greift die Nullstellung allerdings erst nach Ablauf des Kalenderjahres, in dem der Smart Meter eingebaut wurde (§ 51 Abs. 2 Nr. 1). Wer ihn im Herbst bekommt, behält die volle Vergütung also noch bis Silvester.</p>
<p>Im Bundesmittel fehlen der 10-kWp-Anlage mit Smart Meter dadurch ${h.eur(sm.negVerlustJahr)} im Jahr, gerechnet mit dem Anteil des Solarstroms, der ${SMARD_JAHR} in Stunden mit negativem Preis erzeugt wurde. Gleichzeitig speist sie ohne Deckel ${h.num(sm.einspeisung - neu.einspeisung)} kWh mehr ein. Der Tausch ist also kein gutes Geschäft für den Betreiber, solange er seinen Verbrauch nicht verschiebt; sinnvoll wird er mit Speicher, Wallbox oder Wärmepumpe, die mittags laufen. Monatswerte und Jahresvergleich finden Sie unter ${h.a('negative-strompreise', 'negative Strompreise')}.</p>

<h2>Was § 51a zurückgibt</h2>
<p>Damit der Ausfall nicht ganz verloren ist, verlängert ${h.src('eeg_51a', '§ 51a EEG')} den Vergütungszeitraum. Für Solaranlagen zählt die Zahl der genullten Viertelstunden nur zur Hälfte (Faktor ${h.num(S.verlaengerung_faktor, 1)}). Das Ergebnis heißt Volllastviertelstunden und wird nach dem regulären Ende als Zeitkontingent angehängt, wobei jeder Monat nach seiner typischen Sonnenausbeute unterschiedlich viele Volllastviertelstunden verbraucht: Ein Juni zählt viel, ein Dezember wenig. Die Verlängerung läuft bis zum Ende des Monats, in den die letzte Viertelstunde fällt. Für die Kalkulation heißt das: Der Ausfall heute wird teilweise in rund zwei Jahrzehnten ausgeglichen, ohne Zinsen und nur, wenn die Anlage dann noch läuft.</p>

<h2>Wer nicht betroffen ist</h2>
<ul>
<li><strong>Bestandsanlagen:</strong> Für Anlagen mit Inbetriebnahme ab dem ${h.date(eeg23Start)} und vor dem ${h.date(S.stichtag)} gilt die Grenze von ${h.pct(S.begrenzung_anteil)} nicht (${h.src('eeg_100', '§ 100 Abs. 3b EEG')}); für negative Preise bleibt die frühere Fassung von § 51 anwendbar (Abs. 46). Dieselbe 10-kWp-Anlage von 2024 speist ungedrosselt ${h.num(alt.einspeisung)} kWh ein und bringt zum Satz von ${h.ct(alt.satzCt)} ${h.eur(alt.verguetungJahr)} im Jahr.</li>
<li><strong>Freiwilliger Wechsel:</strong> Nach § 100 Abs. 47 kann ein Betreiber einer älteren Anlage in Textform erklären, dass die neuen §§ 51 und 51a gelten sollen. Wirksam wird das frühestens zum Ende des Jahres, in dem der Smart Meter eingebaut wurde; im Gegenzug steigt der anzulegende Wert um einen festen Aufschlag.</li>
<li><strong>Steckersolargeräte:</strong> Bis ${h.num(P.balkon.max_wp)} Wp und ${h.num(P.balkon.max_va)} VA hinter dem Haushaltszähler gilt weder der Deckel noch die Nullstellung; siehe ${h.a('balkonkraftwerk-800-watt', 'Balkonkraftwerk 800 Watt')}.</li>
<li><strong>Direktvermarktung:</strong> Die Grenze von ${h.pct(S.begrenzung_anteil)} betrifft nur Strom in der Einspeisevergütung; wer direkt vermarktet, unterliegt anderen Steuerungspflichten.</li>
</ul>

<h2>Und ab 2027?</h2>
<p>Der Regierungsentwurf zum EEG 2027 (${h.src('bt_eeg2027', 'Drucksache 21/7867')}) ist noch nicht beschlossen. Er sieht für neue Dachanlagen unter ${h.num(S.begrenzung_bis_kw)} kW eine dauerhafte Kappung auf ${h.pct(P.eeg2027.kappung_anteil)} vor, auch mit Smart Meter. Für Anlagen, die bis Ende ${jahrAlt} laufen, bleibt es nach dem Entwurf beim heutigen Recht. Einzelheiten: ${h.a('einspeiseverguetung-2027', 'Einspeisevergütung 2027')}.</p>`,
  },
  en: {
    slug: 'solar-peak-law',
    nav: 'Solar peak law',
    card: 'What has applied to new rooftop systems since February 2025: 60 per cent cap, negative prices, extension under section 51a.',
    title: 'Solar Peak Law Germany 2026: 60% Cap and Negative Prices',
    description: `Solar peak law 2026 in Germany: when the 60% feed-in cap applies, why negative prices pay nothing, what section 51a returns, which systems are exempt.`,
    h1: 'Solar peak law 2026: what the cap costs your German rooftop system',
    intro: `A new 10 kWp system without a smart meter loses about ${EN.num(neu.abgeregelt)} kWh a year to the ${EN.pct(S.begrenzung_anteil)} cap, or ${EN.eur(kapEur)}. With a smart meter the cap goes, but roughly ${EN.eur(sm.negVerlustJahr)} of payment disappears at negative prices.`,
    resume: `The solar peak law (Solarspitzengesetz) is an amendment to the EEG 2023 that took effect on ${tag(S.stichtag, 'en')} and sets two levers for new solar systems below ${EN.num(S.begrenzung_bis_kw)} kW. Until a smart metering system with a control box has been installed and tested by the grid operator, a system on the feed-in tariff may export no more than ${EN.pct(S.begrenzung_anteil)} of its installed capacity (section 9(2) EEG). For a south-facing 10 kWp system in a home using 4,000 kWh, that costs ${EN.num(neu.abgeregelt)} kWh on the national average, ${EN.pct(kapAnteil, 1)} of output or about ${EN.eur(kapEur)} a year. Once the smart meter is in, the cap falls away, but from the following calendar year quarter-hours with a negative wholesale price earn nothing (section 51 EEG). With ${EN.pct(SMARD.years[SMARD_JAHR].pv_neg_share)} of solar output produced in such hours in ${SMARD_JAHR}, that is ${EN.eur(sm.negVerlustJahr)} a year. Section 51a adds half of that time to the end of the ${EN.num(P.eeg.dauer_jahre)} years of support. Plug-in solar and systems running before the cut-off date are exempt.`,
    faqs: [
      { q: 'Does the solar peak law apply to a system I installed in 2023?', a: `Not automatically. For systems connected between the start of the EEG 2023 and ${tag(S.stichtag, 'en', -1)}, section 100(3b) EEG excludes the ${EN.pct(S.begrenzung_anteil)} cap, and section 100(46) keeps the earlier version of the negative-price rule. If you want to switch voluntarily, section 100(47) lets you declare it in writing, effective at the earliest from the end of the year your smart meter is fitted.` },
      { q: 'How much output does the 60 per cent cap cost on an east-west roof?', a: `Much less than on a south roof. On the national average, a south-facing 10 kWp system loses ${EN.num(neu.abgeregelt)} kWh a year, the same system split half east, half west only ${EN.num(ow.abgeregelt)} kWh. The peak is flatter because the two faces reach their maximum at different times of day and rarely deliver full power together at noon.` },
      { q: 'When does the cap end after a smart meter is installed?', a: `Not with the meter alone. Section 9(2) EEG requires the smart metering system and the control unit to be installed and the grid operator to have tested remote control successfully for the first time. Only then may the system export at full power. Until that point, the limit of ${EN.pct(S.begrenzung_anteil)} of installed capacity at the grid connection point stays in place.` },
      { q: 'Do I have to switch off my panels when prices are negative?', a: `No. Section 51 EEG only sets the reference value to zero for those quarter-hours: the system may keep exporting but earns nothing for it. For new systems below ${EN.num(S.neg_preis_bis_kw)} kW, this applies only from the year after the smart meter is installed. The sensible response is to charge a battery, heat pump or car at midday.` },
      { q: 'What is the section 51a extension worth in euros?', a: `Less than the loss, but not nothing. Quarter-hours without payment are weighted by a factor of ${EN.num(S.verlaengerung_faktor, 1)} and added as a time allowance after the ${EN.num(P.eeg.dauer_jahre)} years, counted in fixed full-load quarter-hours per month. With ${EN.eur(sm.negVerlustJahr)} lost a year, roughly half comes back in the extra months, but only after two decades and at your system’s rate.` },
      { q: 'Is a balcony solar kit affected by the 60 per cent rule?', a: `No. Section 9(2) sentence 4 EEG expressly exempts plug-in solar devices (Steckersolargeräte) up to ${EN.num(P.balkon.max_wp)} watts of panels and ${EN.num(P.balkon.max_va)} volt-amperes of inverter output behind a household meter. A balcony kit is not paid for its exports anyway, so the negative-price rule does not matter for it either. Only its inverter limits it.` },
    ],
    body: (h) => `
<h2>Two levers against the midday peak</h2>
<p>The act on avoiding temporary generation surpluses, commonly called the solar peak law, responds to a new problem: on sunny spring days millions of rooftop systems produce more power at midday than the grid can absorb, and the wholesale price drops below zero. In ${SMARD_JAHR}, ${h.src('smard', 'SMARD')} recorded ${h.num(negStd)} such hours. The reform therefore works in two places. First, small systems have their export capped as long as the grid operator cannot control them remotely. Second, payment stops when the power is worth nothing on the exchange, once the system is metered digitally. The two levers never apply at the same time: it is either the cap or the zero rate.</p>

<h2>The ${h.pct(S.begrenzung_anteil)} cap in the wording of the law</h2>
<p>${h.src('eeg_9', 'Section 9(2) sentence 1 no. 2(b) and no. 3 EEG')} requires operators of systems below ${h.num(S.begrenzung_bis_kw)} kW on the feed-in tariff (Einspeisevergütung) to limit active power export at the grid connection point to ${h.pct(S.begrenzung_anteil)} of installed capacity. What counts is the connection point, not the inverter: whatever the house uses or the battery absorbs at the same moment does not count against the cap. A 10 kWp system may therefore export ${h.num(10 * S.begrenzung_anteil)} kW and use any amount above that itself. The duty only ends once a smart metering system and control unit are installed and the grid operator has tested control successfully.</p>
<p>In practice, the inverter or an energy manager trims output for a few midday hours on a limited number of days. The simulation with 74 metered households shows how small the loss usually is:</p>
${h.table(['Case (10 kWp, 4,000 kWh)', 'curtailed', 'share of output', 'loss at current rate'], [
  ['South 30°, no battery', `${h.num(neu.abgeregelt)} kWh`, h.pct(kapAnteil, 1), h.eur(kapEur)],
  ['South 30°, 5 kWh battery', `${h.num(sp.abgeregelt)} kWh`, h.pct(sp.ertrag ? sp.abgeregelt / sp.ertrag : 0, 1), h.eur(sp.abgeregelt * sp.satzCt / 100)],
  ['East-west 30°', `${h.num(ow.abgeregelt)} kWh`, h.pct(ow.ertrag ? ow.abgeregelt / ow.ertrag : 0, 1), h.eur(ow.abgeregelt * ow.satzCt / 100)],
  ['Full feed-in, south', `${h.num(voll.abgeregelt)} kWh`, h.pct(vollAnteil, 1), h.eur(voll.abgeregelt * voll.satzCt / 100)],
], `National average, commissioned from ${h.date(neu.periodeVon)}, no smart meter. Loss valued at the system’s tariff.`, ['l', 'r', 'r', 'r'])}
<p>The battery barely helps, which surprises many owners: it is often already full when the peak arrives, and only reduces curtailment if an energy manager deliberately holds it back until midday. With full feed-in the cap bites harder because no household load absorbs the peak. Size the battery for your evening consumption instead; see ${h.a('stromspeicher-groesse', 'battery size')}.</p>

<h2>Zero cents at negative prices</h2>
<p>${h.src('eeg_51', 'Section 51(1) EEG')} is brief: for periods with a negative spot price, the reference value falls to zero. Since the cut-off date this applies per quarter-hour and from the very first negative quarter-hour. For systems below ${h.num(S.neg_preis_bis_kw)} kW, however, the zero rate only starts after the end of the calendar year in which the smart meter was installed (section 51(2) no. 1). If yours arrives in autumn, you keep full payment until New Year’s Eve.</p>
<p>On the national average, the 10 kWp system with a smart meter loses ${h.eur(sm.negVerlustJahr)} a year this way, based on the share of solar output produced in negative-price hours in ${SMARD_JAHR}. At the same time, without the cap, it exports ${h.num(sm.einspeisung - neu.einspeisung)} kWh more. The swap does not pay for the owner unless consumption moves; it starts to make sense with a battery, wallbox or heat pump running at midday. Monthly figures and the year-on-year comparison are under ${h.a('negative-strompreise', 'negative power prices')}.</p>

<h2>What section 51a gives back</h2>
<p>To soften the loss, ${h.src('eeg_51a', 'section 51a EEG')} extends the payment period. For solar systems, the number of zero-rated quarter-hours counts only half (factor ${h.num(S.verlaengerung_faktor, 1)}). The result, called full-load quarter-hours, is added after the regular end as a time allowance, and each month uses up a different number of them according to its typical solar output: a June counts for a lot, a December for little. The extension runs until the end of the month in which the last quarter-hour falls. For your budget, this means today’s loss is partly made up in about two decades, without interest and only if the system is still running.</p>

<h2>Who is not affected</h2>
<ul>
<li><strong>Existing systems:</strong> systems commissioned from ${h.date(eeg23Start)} and before ${h.date(S.stichtag)} are not subject to the ${h.pct(S.begrenzung_anteil)} cap (${h.src('eeg_100', 'section 100(3b) EEG')}), and the earlier version of section 51 still applies to negative prices (para. 46). The same 10 kWp system from 2024 exports ${h.num(alt.einspeisung)} kWh unthrottled and earns ${h.eur(alt.verguetungJahr)} a year at ${h.ct(alt.satzCt)}.</li>
<li><strong>Voluntary switch:</strong> under section 100(47), the operator of an older system can declare in text form that the new sections 51 and 51a should apply. It takes effect at the earliest from the end of the year the smart meter was fitted; in return, the reference value rises by a fixed premium.</li>
<li><strong>Plug-in solar:</strong> up to ${h.num(P.balkon.max_wp)} Wp and ${h.num(P.balkon.max_va)} VA behind the household meter, neither the cap nor the zero rate applies; see ${h.a('balkonkraftwerk-800-watt', 'plug-in solar 800 watts')}.</li>
<li><strong>Direct marketing:</strong> the ${h.pct(S.begrenzung_anteil)} cap only concerns power on the feed-in tariff; directly marketed systems have other control duties.</li>
</ul>

<h2>And from 2027?</h2>
<p>The government draft of the EEG 2027 (${h.src('bt_eeg2027', 'printed paper 21/7867')}) has not been passed. It proposes a permanent cap at ${h.pct(P.eeg2027.kappung_anteil)} for new rooftop systems below ${h.num(S.begrenzung_bis_kw)} kW, even with a smart meter. For systems running by the end of ${jahrAlt}, the draft keeps today’s rules. Details: ${h.a('einspeiseverguetung-2027', 'feed-in tariff 2027')}.</p>`,
  },
});

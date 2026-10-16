import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { PERIODEN, AKTUELL, mischsatz } from '../../lib/engine/eeg';
import { displayDate } from '../../lib/format';
import { P, EEG, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Sätze aller Zeiträume aus eeg-saetze.json (Bundesnetzagentur). Beispiele aus dem Motor: Stuttgart (70173),
 * Süd 30°, 4 000 kWh Verbrauch, 8 und 12 kWp, Teil- und Volleinspeisung, ohne und mit Smart Meter.
 */
const st = ortVonPlz('70173')!;
const VB = 4000;
const basis = { ort: st, neigung: 30, azimut: 0, verbrauchKwh: VB, speicherKwh: 0, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 0 };
const t8 = rechnePv({ ...basis, kwp: 8, modus: 'teil' }), v8 = rechnePv({ ...basis, kwp: 8, modus: 'voll' });
const t12 = rechnePv({ ...basis, kwp: 12, modus: 'teil' }), v12 = rechnePv({ ...basis, kwp: 12, modus: 'voll' });
const sm12 = rechnePv({ ...basis, kwp: 12, modus: 'teil', smartMeter: true });
const m12 = mischsatz(AKTUELL, 12, 'teil'), m25 = mischsatz(AKTUELL, 25, 'teil'), m60 = mischsatz(AKTUELL, 60, 'teil');
const mv12 = mischsatz(AKTUELL, 12, 'voll');
const ERST = PERIODEN[0];
const rueckgang = 1 - AKTUELL.teil[0] / ERST.teil[0];
const G = EEG.grenzen_kw;
const dDe = (iso: string) => displayDate(iso, 'de-DE'), dEn = (iso: string) => displayDate(iso, 'en-GB');
/** Wo liegt Volleinspeisung vorn? Ergebnis des Motors, nicht feste Behauptung. */
const vollVorn12 = v12.nutzenJahr > t12.nutzenJahr, vollVorn8 = v8.nutzenJahr > t8.nutzenJahr;

export default defineGuide({
  id: 'einspeiseverguetung',
  group: 'recht',
  order: 10,
  tool: 'eeg',
  related: ['einspeiseverguetung-2027', 'volleinspeisung-teileinspeisung', 'solarspitzengesetz', 'negative-strompreise', 'photovoltaik-rechner', 'photovoltaik-steuer'],
  sources: ['bnetza_saetze', 'bnetza_archiv', 'eeg_21', 'eeg_48', 'eeg_49', 'eeg_51', 'eeg_9', 'bt_eeg2027'],
  de: {
    slug: 'einspeiseverguetung',
    nav: 'Einspeisevergütung',
    card: 'Satz des Inbetriebnahme-Zeitraums nach Leistung, Teil- oder Volleinspeisung, Vergütung im Jahr und über 20 Jahre.',
    title: 'Einspeisevergütung 2026: Tabelle der Sätze und Rechner',
    description: `Einspeisevergütung 2026 ab ${dDe(AKTUELL.von)}: ${DE.ct(AKTUELL.teil[0])} bis 10 kWp, ${DE.ct(AKTUELL.voll[0])} bei Volleinspeisung, alle Zeiträume seit 2023 und Mischsatz je Leistung.`,
    h1: 'Einspeisevergütung 2026: Sätze aller Zeiträume und Ihr Mischsatz',
    intro: `Für Anlagen, die vom ${dDe(AKTUELL.von)} bis zum ${dDe(AKTUELL.bis)} in Betrieb gehen, zahlt der Netzbetreiber ${DE.ct(AKTUELL.teil[0])} für den Überschuss bis 10 kWp und ${DE.ct(AKTUELL.voll[0])} bei Volleinspeisung, ${P.eeg.dauer_jahre} Jahre lang.`,
    resume: `Die Einspeisevergütung nach dem EEG 2023 richtet sich nach dem Tag der Inbetriebnahme und bleibt danach ${P.eeg.dauer_jahre} Jahre lang fest. Die Bundesnetzagentur veröffentlicht die Sätze je Zeitraum; seit Februar 2024 sinken sie alle sechs Monate um ${DE.pct(P.eeg.degression_halbjahr)}. Wer zwischen dem ${dDe(AKTUELL.von)} und dem ${dDe(AKTUELL.bis)} anschließt, bekommt bei Teileinspeisung ${DE.ct(AKTUELL.teil[0])} für den Leistungsanteil bis ${G[0]} kW, ${DE.ct(AKTUELL.teil[1])} für den Teil bis ${G[1]} kW und ${DE.ct(AKTUELL.teil[2])} bis ${G[2]} kW. Bei Volleinspeisung sind es ${DE.ct(AKTUELL.voll[0])} und ${DE.ct(AKTUELL.voll[1])}. Größere Anlagen erhalten einen Mischsatz, eine 12-kWp-Anlage ${DE.ct(m12)}. Im Beispiel Stuttgart speist diese Anlage bei ${DE.num(VB)} kWh Verbrauch ${DE.num(t12.einspeisung)} kWh ein und erhält ${DE.eur(t12.verguetungJahr)} im Jahr. Das EEG 2023 gilt für Anlagen, die bis zum ${dDe(P.eeg.anwendbar_bis)} in Betrieb gehen; für spätere Anlagen liegt bisher nur ein Gesetzentwurf vor.`,
    faqs: [
      { q: 'Welcher Einspeisesatz gilt für eine Anlage, die im November 2026 ans Netz geht?', a: `Der Satz des Zeitraums vom ${dDe(AKTUELL.von)} bis ${dDe(AKTUELL.bis)}: ${DE.ct(AKTUELL.teil[0])} bis 10 kWp bei Teileinspeisung, ${DE.ct(AKTUELL.voll[0])} bei Volleinspeisung. Maßgeblich ist der Tag der Inbetriebnahme, nicht der Kaufvertrag oder die Anmeldung. Der Satz gilt dann für das Jahr der Inbetriebnahme und ${P.eeg.dauer_jahre} weitere Kalenderjahre (§ 25 EEG).` },
      { q: 'Wie hoch ist der Mischsatz einer 12-kWp-Anlage?', a: `${DE.ct(m12)} bei Teileinspeisung und Inbetriebnahme ab ${dDe(AKTUELL.von)}. Die ersten ${G[0]} kW werden mit ${DE.ct(AKTUELL.teil[0])} bewertet, die übrigen 2 kW mit ${DE.ct(AKTUELL.teil[1])}, gewichtet nach Leistung (§ 48 Abs. 2 EEG). Bei Volleinspeisung ergibt dieselbe Rechnung ${DE.ct(mv12)}. Der Satz hängt also von der installierten Leistung ab, nicht davon, wie viel tatsächlich eingespeist wird.` },
      { q: 'Lohnt sich Volleinspeisung bei 12 kWp und 4 000 kWh Verbrauch?', a: `Im Beispiel Stuttgart ${vollVorn12 ? 'knapp ja' : 'nein'}: Volleinspeisung bringt ${DE.eur(v12.nutzenJahr)} im Jahr, Teileinspeisung ${DE.eur(t12.nutzenJahr)} aus Vergütung und gesparter Stromrechnung. Bei 8 kWp liegt ${vollVorn8 ? 'ebenfalls die Volleinspeisung' : 'die Teileinspeisung'} vorn (${DE.eur(v8.nutzenJahr)} gegen ${DE.eur(t8.nutzenJahr)}). Wer Volleinspeisung wählt, muss sie dem Netzbetreiber vor der Inbetriebnahme mitteilen und kann jedes Jahr vor dem 1. Dezember wechseln (§ 48 Abs. 2a EEG).` },
      { q: 'Was kostet der Smart Meter an Vergütung bei negativen Preisen?', a: `Mit Smart Meter entfällt die Vergütung in Viertelstunden mit negativem Börsenpreis (§ 51 EEG). Für 12 kWp in Stuttgart sind das rechnerisch ${DE.eur(sm12.negVerlustJahr)} im Jahr, gemessen am Anteil negativer Stunden aus SMARD. Ohne Smart Meter gilt dafür die 60-Prozent-Grenze, die hier ${DE.num(t12.abgeregelt)} kWh kostet. Die ausgefallenen Zeiten werden am Ende des Förderzeitraums zum Teil angehängt.` },
      { q: 'Um wie viel ist der Satz bis 10 kWp seit 2023 gesunken?', a: `Von ${DE.ct(ERST.teil[0])} im Zeitraum ab ${dDe(ERST.von)} auf ${DE.ct(AKTUELL.teil[0])} ab ${dDe(AKTUELL.von)}, also um ${DE.pct(rueckgang, 1)}. Bis Januar 2024 blieb der Satz unverändert, seitdem wird er alle sechs Monate um ${DE.pct(P.eeg.degression_halbjahr)} abgesenkt (§ 49 EEG). Wer früher angeschlossen hat, behält seinen alten Satz für die volle Laufzeit.` },
    ],
    body: (h) => `
<h2>Sätze aller Zeiträume seit 2023</h2>
${h.table(['Inbetriebnahme', `Teil bis ${G[0]} kW`, `Teil bis ${G[1]} kW`, `Teil bis ${G[2]} kW`, `Voll bis ${G[0]} kW`, `Voll bis ${G[1]} kW`, `Voll bis ${G[2]} kW`], PERIODEN.slice().reverse().map((p) => [
  `${h.date(p.von)} bis ${h.date(p.bis)}`, h.num(p.teil[0], 2), h.num(p.teil[1], 2), h.num(p.teil[2], 2), h.num(p.voll[0], 2), h.num(p.voll[1], 2), h.num(p.voll[2], 2),
]), 'Einspeisevergütung in ct/kWh für Anlagen auf Gebäuden, je Leistungsanteil, laut Bundesnetzagentur.', ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>Die Werte stammen aus den Veröffentlichungen der ${h.src('bnetza_saetze', 'Bundesnetzagentur')}, frühere Zeiträume aus ihrem ${h.src('bnetza_archiv', 'Archiv')}. Teileinspeisung heißt: Der Haushalt verbraucht zuerst selbst, nur der Überschuss wird vergütet (${h.src('eeg_21', '§ 21 EEG')}). Bei Volleinspeisung geht der ganze Strom ins Netz, dafür ist der Satz höher (${h.src('eeg_48', '§ 48 Abs. 2a EEG')}). Alle Sätze der Tabelle sind bereits um ${h.num(P.eeg.abzug_einspeiseverguetung_ct, 1)} ct je kWh gegenüber dem anzulegenden Wert gemindert, wie es § 53 Abs. 1 EEG für die Einspeisevergütung vorsieht.</p>

<h2>Wie der Mischsatz entsteht</h2>
<p>Die Leistungsgrenzen sind keine Stufen, ab denen die ganze Anlage weniger bekommt. Jeder Teil der Leistung wird mit seinem eigenen Satz bewertet, und der Durchschnitt gilt für jede eingespeiste Kilowattstunde.</p>
${h.table(['Anlage', 'Teileinspeisung', 'Volleinspeisung'], [10, 12, 15, 25, 40, 60, 100].map((k) => [`${h.num(k)} kWp`, h.ct(mischsatz(AKTUELL, k, 'teil')), h.ct(mischsatz(AKTUELL, k, 'voll'))]), `Mischsatz bei Inbetriebnahme ab ${h.date(AKTUELL.von)}.`, ['l', 'r', 'r'])}
<p>Eine 25-kWp-Anlage kommt so auf ${h.ct(m25)}, eine 60-kWp-Anlage auf ${h.ct(m60)}. Der Rechner oben bildet diesen Mischsatz für jede Leistung und jeden Zeitraum und rechnet mit dem Ertrag Ihrer Postleitzahl aus, wie viel im Jahr ankommt.</p>

<h2>Was die Vergütung im Jahr schmälert</h2>
<p>Zwei Regeln des Solarspitzengesetzes betreffen Anlagen ab dem ${h.date(P.solarspitzen.stichtag)}. Ohne Smart Meter dürfen sie nur ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} ihrer Leistung einspeisen (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}); mit Smart Meter entfällt die Vergütung, solange der Börsenpreis negativ ist (${h.src('eeg_51', '§ 51 EEG')}). Der Rechner berücksichtigt je nach Auswahl das eine oder das andere. Die Absenkung um ${h.pct(P.eeg.degression_halbjahr, 0)} je Halbjahr regelt ${h.src('eeg_49', '§ 49 EEG')}; sie trifft nur neue Anlagen. Mehr dazu unter ${h.a('solarspitzengesetz', 'Solarspitzengesetz')} und ${h.a('negative-strompreise', 'negative Strompreise')}.</p>

<h2>Was ab 2027 geplant ist</h2>
<p>Alle Sätze auf dieser Seite gelten nach dem EEG 2023 für Anlagen, die bis zum ${h.date(P.eeg.anwendbar_bis)} in Betrieb gehen. Für spätere Anlagen hat die Bundesregierung einen ${h.src('bt_eeg2027', 'Gesetzentwurf')} vorgelegt, der die feste Vergütung für neue Anlagen durch eine befristete Übergangszahlung ersetzen würde. Er ist noch nicht beschlossen. Was er für eine Anlage bedeuten würde, rechnet ${h.a('einspeiseverguetung-2027', 'Einspeisevergütung 2027')} als Vergleich. Wer zwischen Teil- und Volleinspeisung schwankt, findet die Abwägung unter ${h.a('volleinspeisung-teileinspeisung', 'Volleinspeisung oder Teileinspeisung')}.</p>`,
  },
  en: {
    slug: 'feed-in-tariff',
    nav: 'Feed-in tariff',
    card: 'Rate for your commissioning period by capacity, surplus or full feed-in, payment per year and over 20 years.',
    title: 'Feed-in Tariff Germany 2026: Current Rates, Blended Rate',
    description: `Feed-in tariff Germany 2026 from ${dEn(AKTUELL.von)}: ${EN.ct(AKTUELL.teil[0])} up to 10 kWp, ${EN.ct(AKTUELL.voll[0])} for full feed-in, every period since 2023, blended rate by capacity.`,
    h1: 'Feed-in tariff 2026: rates for every period and your blended rate',
    intro: `For systems commissioned from ${dEn(AKTUELL.von)} to ${dEn(AKTUELL.bis)}, the grid operator pays ${EN.ct(AKTUELL.teil[0])} for surplus power up to 10 kWp and ${EN.ct(AKTUELL.voll[0])} for full feed-in, for ${P.eeg.dauer_jahre} years.`,
    resume: `The German feed-in tariff (Einspeisevergütung) under the EEG 2023 depends on the commissioning date and then stays fixed for ${P.eeg.dauer_jahre} years. The Federal Network Agency publishes the rates for each period; since February 2024 they have fallen by ${EN.pct(P.eeg.degression_halbjahr)} every six months. If you connect between ${dEn(AKTUELL.von)} and ${dEn(AKTUELL.bis)}, surplus feed-in earns ${EN.ct(AKTUELL.teil[0])} for the share of capacity up to ${G[0]} kW, ${EN.ct(AKTUELL.teil[1])} for the part up to ${G[1]} kW and ${EN.ct(AKTUELL.teil[2])} up to ${G[2]} kW. For full feed-in the rates are ${EN.ct(AKTUELL.voll[0])} and ${EN.ct(AKTUELL.voll[1])}. Larger systems receive a blended rate, which is ${EN.ct(m12)} for a 12 kWp system. In the Stuttgart example, with ${EN.num(VB)} kWh of consumption, that system exports ${EN.num(t12.einspeisung)} kWh and receives ${EN.eur(t12.verguetungJahr)} a year. The EEG 2023 covers systems commissioned up to ${dEn(P.eeg.anwendbar_bis)}; for later systems there is so far only a draft bill.`,
    faqs: [
      { q: 'Which feed-in rate applies to a system connected in November 2026?', a: `The rate for the period from ${dEn(AKTUELL.von)} to ${dEn(AKTUELL.bis)}: ${EN.ct(AKTUELL.teil[0])} up to 10 kWp for surplus feed-in, ${EN.ct(AKTUELL.voll[0])} for full feed-in. What counts is the commissioning date, not the purchase contract or the registration. The rate then applies for the commissioning year and ${P.eeg.dauer_jahre} further calendar years (section 25 EEG).` },
      { q: 'What is the blended feed-in rate for a 12 kWp system?', a: `${EN.ct(m12)} for surplus feed-in with commissioning from ${dEn(AKTUELL.von)}. The first ${G[0]} kW are valued at ${EN.ct(AKTUELL.teil[0])}, the remaining 2 kW at ${EN.ct(AKTUELL.teil[1])}, weighted by capacity (section 48(2) EEG). For full feed-in the same calculation gives ${EN.ct(mv12)}. The rate therefore depends on installed capacity, not on how much is actually exported.` },
      { q: 'Does full feed-in pay with 12 kWp and 4,000 kWh of consumption?', a: `In the Stuttgart example, ${vollVorn12 ? 'narrowly yes' : 'no'}: full feed-in brings ${EN.eur(v12.nutzenJahr)} a year, surplus feed-in ${EN.eur(t12.nutzenJahr)} from payment plus the saved electricity bill. At 8 kWp, ${vollVorn8 ? 'full feed-in is also ahead' : 'surplus feed-in is ahead'} (${EN.eur(v8.nutzenJahr)} against ${EN.eur(t8.nutzenJahr)}). Choosing full feed-in requires notice to the grid operator before commissioning, and you can switch each year before 1 December (section 48(2a) EEG).` },
      { q: 'How much tariff does a smart meter cost at negative prices?', a: `With a smart meter, no payment is made in quarter-hours with a negative wholesale price (section 51 EEG). For 12 kWp in Stuttgart that comes to about ${EN.eur(sm12.negVerlustJahr)} a year, based on the share of negative hours in SMARD data. Without a smart meter the 60 per cent cap applies instead, costing ${EN.num(t12.abgeregelt)} kWh here. Part of the lost time is added at the end of the payment period.` },
      { q: 'How far has the rate up to 10 kWp fallen since 2023?', a: `From ${EN.ct(ERST.teil[0])} in the period from ${dEn(ERST.von)} to ${EN.ct(AKTUELL.teil[0])} from ${dEn(AKTUELL.von)}, a drop of ${EN.pct(rueckgang, 1)}. The rate stayed unchanged until January 2024 and has since been reduced by ${EN.pct(P.eeg.degression_halbjahr)} every six months (section 49 EEG). Anyone who connected earlier keeps their old rate for the full term.` },
    ],
    body: (h) => `
<h2>Rates for every period since 2023</h2>
${h.table(['Commissioned', `Surplus to ${G[0]} kW`, `Surplus to ${G[1]} kW`, `Surplus to ${G[2]} kW`, `Full to ${G[0]} kW`, `Full to ${G[1]} kW`, `Full to ${G[2]} kW`], PERIODEN.slice().reverse().map((p) => [
  `${h.date(p.von)} to ${h.date(p.bis)}`, h.num(p.teil[0], 2), h.num(p.teil[1], 2), h.num(p.teil[2], 2), h.num(p.voll[0], 2), h.num(p.voll[1], 2), h.num(p.voll[2], 2),
]), 'Feed-in tariff in ct/kWh for systems on buildings, per capacity share, according to the Federal Network Agency.', ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>The figures come from the publications of the ${h.src('bnetza_saetze', 'Federal Network Agency')}, earlier periods from its ${h.src('bnetza_archiv', 'archive')}. Surplus feed-in (Teileinspeisung) means the household uses power first and only the surplus is paid for (${h.src('eeg_21', 'section 21 EEG')}). With full feed-in (Volleinspeisung) all power goes to the grid, and the rate is higher (${h.src('eeg_48', 'section 48(2a) EEG')}). All rates in the table are already ${h.num(P.eeg.abzug_einspeiseverguetung_ct, 1)} ct per kWh below the reference value (anzulegender Wert), as section 53(1) EEG provides for the feed-in tariff.</p>

<h2>How the blended rate works</h2>
<p>The capacity thresholds are not steps above which the whole system gets less. Each share of capacity is valued at its own rate, and the average applies to every kilowatt-hour exported.</p>
${h.table(['System', 'Surplus feed-in', 'Full feed-in'], [10, 12, 15, 25, 40, 60, 100].map((k) => [`${h.num(k)} kWp`, h.ct(mischsatz(AKTUELL, k, 'teil')), h.ct(mischsatz(AKTUELL, k, 'voll'))]), `Blended rate for commissioning from ${h.date(AKTUELL.von)}.`, ['l', 'r', 'r'])}
<p>A 25 kWp system thus reaches ${h.ct(m25)}, a 60 kWp system ${h.ct(m60)}. The calculator above forms this blended rate for any capacity and period and, using the yield for your postcode, works out how much arrives each year.</p>

<h2>What reduces the annual payment</h2>
<p>Two rules of the solar peak law affect systems from ${h.date(P.solarspitzen.stichtag)}. Without a smart meter they may export only ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of their capacity (${h.src('eeg_9', 'section 9(2) EEG')}); with one, no payment is made while the wholesale price is negative (${h.src('eeg_51', 'section 51 EEG')}). The calculator applies one or the other depending on your choice. The reduction of ${h.pct(P.eeg.degression_halbjahr, 0)} per half-year is set by ${h.src('eeg_49', 'section 49 EEG')}; it only affects new systems. More under ${h.a('solarspitzengesetz', 'solar peak law')} and ${h.a('negative-strompreise', 'negative power prices')}.</p>

<h2>What is planned from 2027</h2>
<p>All rates on this page apply under the EEG 2023 to systems commissioned up to ${h.date(P.eeg.anwendbar_bis)}. For later systems the federal government has tabled a ${h.src('bt_eeg2027', 'draft bill')} that would replace the fixed payment for new systems with a time-limited transitional payment. It has not been passed. What it would mean for a system is compared under ${h.a('einspeiseverguetung-2027', 'feed-in tariff 2027')}. If you are torn between surplus and full feed-in, see ${h.a('volleinspeisung-teileinspeisung', 'full or surplus feed-in')}.</p>`,
  },
});

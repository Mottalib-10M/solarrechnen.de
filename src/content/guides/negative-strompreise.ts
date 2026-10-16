import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { P, DE, EN, STROMPREIS_CT, SMARD, SMARD_JAHR } from '../../lib/fmt';

/**
 * Negative Strompreise: Stunden und Anteil des Solarstroms je Jahr und Monat aus SMARD (src/data/smard.json),
 * Wirkung auf die Vergütung mit und ohne Smart Meter aus dem Motor (Bundesmittel, Süd 30°, 4 000 kWh).
 */
const JAHRE = Object.keys(SMARD.years).sort();
const Y = SMARD.years[SMARD_JAHR];
const letztes = JAHRE[JAHRE.length - 1];
const L = SMARD.years[letztes];
const laufend = L.hours < 8700;
const MON = Array.from({ length: 12 }, (_, i) => String(i + 1));
const spitze = MON.reduce((a, m) => (Y.months[m].neg_hours > Y.months[a].neg_hours ? m : a), '1');
const winterStd = ['11', '12', '1', '2'].reduce((s, m) => s + Y.months[m].neg_hours, 0);
const fruehSommer = ['4', '5', '6', '7', '8'].reduce((s, m) => s + Y.months[m].neg_hours, 0);
const erstes = SMARD.years[JAHRE[0]];
const MDE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: true, preisCt: STROMPREIS_CT, kostenEur: 15000 };
const sm10 = rechnePv(base);
const alt10 = rechnePv({ ...base, smartMeter: false });
const sm5 = rechnePv({ ...base, kwp: 5 });
const sm15 = rechnePv({ ...base, kwp: 15 });
const sm10sp = rechnePv({ ...base, speicherKwh: 8 });
const ow10 = rechnePv({ ...base, ostWest: true });
const tag = (iso: string, l: 'de' | 'en') => new Date(Date.parse(iso)).toLocaleDateString(l === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const anteilVerg = sm10.einspeisung * sm10.satzCt / 100 > 0 ? sm10.negVerlustJahr / (sm10.einspeisung * sm10.satzCt / 100) : 0;

export default defineGuide({
  id: 'negative-strompreise',
  group: 'recht',
  order: 66,
  mini: 'negPreise',
  miniHref: 'photovoltaik-rechner',
  related: ['solarspitzengesetz', 'stromspeicher-groesse', 'einspeiseverguetung', 'balkonkraftwerk-zaehler', 'einspeiseverguetung-2027'],
  sources: ['smard', 'eeg_51', 'eeg_51a', 'bnetza_saetze'],
  de: {
    slug: 'negative-strompreise-photovoltaik',
    nav: 'Negative Strompreise',
    card: 'Wie oft der Börsenpreis unter null fällt, in welchen Monaten, und was das mit Smart Meter für die Einspeisevergütung heißt.',
    title: 'Negative Strompreise 2026: Folgen für Photovoltaik',
    description: `Negative Strompreise 2026: ${DE.num(Y.neg_hours)} Stunden mit Minuspreis im Jahr ${SMARD_JAHR}, Monatswerte von SMARD und was mit Smart Meter von der Vergütung Ihrer PV-Anlage wegfällt.`,
    h1: 'Negative Strompreise 2026: was sie Ihrer Solaranlage nehmen',
    intro: `${SMARD_JAHR} lag der Börsenpreis in ${DE.num(Y.neg_hours)} Stunden unter null, und ${DE.pct(Y.pv_neg_share)} des deutschen Solarstroms fielen in diese Stunden. Eine neue 10-kWp-Anlage mit Smart Meter verliert dadurch rund ${DE.eur(sm10.negVerlustJahr)} Vergütung im Jahr.`,
    resume: `Negative Strompreise entstehen, wenn an der Strombörse mehr Strom angeboten als nachgefragt wird und Erzeuger dafür bezahlen, ihn loszuwerden. Die Marktdaten der Bundesnetzagentur (SMARD) zeigen den Trend: ${JAHRE[0]} gab es ${DE.num(erstes.neg_hours)} Stunden mit negativem Day-Ahead-Preis, ${SMARD_JAHR} schon ${DE.num(Y.neg_hours)}. Die meisten liegen an sonnigen Mittagen zwischen April und August; allein der ${MDE[Number(spitze) - 1]} ${SMARD_JAHR} brachte ${DE.num(Y.months[spitze].neg_hours)} Stunden. Für Photovoltaik zählt vor allem, wie viel Solarstrom in diesen Stunden erzeugt wird: ${DE.pct(Y.pv_neg_share)} im Jahr ${SMARD_JAHR}. Nach § 51 EEG bekommen neue Anlagen für diese Viertelstunden keine Vergütung, sobald ein Smart Meter eingebaut ist, kleine Anlagen ab dem folgenden Kalenderjahr. Eine 10-kWp-Anlage im Bundesmittel verliert so ${DE.eur(sm10.negVerlustJahr)} im Jahr, mit 8 kWh Speicher ${DE.eur(sm10sp.negVerlustJahr)}. Ohne Smart Meter bleibt die Vergütung voll, dafür gilt die Grenze von ${DE.pct(P.solarspitzen.begrenzung_anteil)}. § 51a hängt die Hälfte der verlorenen Zeit an das Förderende an.`,
    faqs: [
      { q: `In welchem Monat gab es ${SMARD_JAHR} die meisten Stunden mit negativem Strompreis?`, a: `Im ${MDE[Number(spitze) - 1]} mit ${DE.num(Y.months[spitze].neg_hours)} Stunden, gefolgt von den übrigen Monaten zwischen April und August, die zusammen ${DE.num(fruehSommer)} Stunden brachten. Von November bis Februar waren es nur ${DE.num(winterStd)}. Ursache ist die Kombination aus hoher Solarleistung zur Mittagszeit, Feiertagen mit wenig Industrielast und Wind. Die Werte stammen aus der stündlichen Day-Ahead-Reihe von SMARD.` },
      { q: 'Verliert eine Anlage ohne Smart Meter bei negativen Preisen Geld?', a: `Nein. § 51 Abs. 2 Nr. 1 EEG nimmt Anlagen unter ${DE.num(P.solarspitzen.neg_preis_bis_kw)} kW aus, bis das Kalenderjahr abgelaufen ist, in dem ein intelligentes Messsystem eingebaut wurde. Die 10-kWp-Anlage ohne Smart Meter erhält daher für alle eingespeisten ${DE.num(alt10.einspeisung)} kWh ihren Satz. Dafür darf sie nur ${DE.pct(P.solarspitzen.begrenzung_anteil)} ihrer Leistung einspeisen und verliert ${DE.num(alt10.abgeregelt)} kWh durch die Grenze.` },
      { q: 'Wie viel Prozent der Vergütung fallen mit Smart Meter weg?', a: `Etwa so viel, wie Solarstrom in Stunden mit negativem Preis entsteht: im Bundesmittel ${DE.pct(anteilVerg)} der Jahresvergütung, gerechnet mit den Zahlen von ${SMARD_JAHR}. Bei 5 kWp sind das ${DE.eur(sm5.negVerlustJahr)}, bei 15 kWp ${DE.eur(sm15.negVerlustJahr)} im Jahr. Eine Ost-West-Anlage mit 10 kWp verliert ${DE.eur(ow10.negVerlustJahr)}, weil sie mittags weniger erzeugt.` },
      { q: 'Lohnt sich ein dynamischer Stromtarif mit Photovoltaik?', a: `Er kann sich lohnen, wenn ein großer Verbraucher flexibel ist. In Stunden mit negativem Börsenpreis ist der Netzstrom bei dynamischen Tarifen besonders günstig, auch wenn Netzentgelte, Umlagen und Steuern bleiben. Wer dann ein Elektroauto oder einen Wärmespeicher lädt, nutzt billigen Strom, während die eigene Anlage ohnehin unvergütet einspeisen würde. Voraussetzung ist ein intelligentes Messsystem.` },
      { q: `Wie viele negative Stunden gab es ${letztes} bisher?`, a: `Bis zum Abruf am ${tag(SMARD.retrieved_at, 'de')} zählte SMARD für ${letztes} ${DE.num(L.neg_hours)} Stunden mit negativem Preis, und ${DE.pct(L.pv_neg_share)} des Solarstroms fielen in diese Zeit. Am meisten waren es im ${MDE[Number(MON.reduce((a, m) => ((L.months[m]?.neg_hours ?? 0) > (L.months[a]?.neg_hours ?? 0) ? m : a), '1')) - 1]}. Ob das Jahr den Wert von ${SMARD_JAHR} übertrifft, entscheidet sich nicht mehr: Im Winter gibt es kaum solche Stunden.` },
      { q: 'Zählt bei negativen Preisen die volle Stunde oder jede Viertelstunde?', a: `Für Anlagen ab dem ${tag(P.solarspitzen.stichtag, 'de')} zählt jede Viertelstunde mit negativem Spotmarktpreis, ohne Mindestdauer. Ältere Fassungen von § 51 setzten erst ein, wenn der Preis mehrere Stunden am Stück negativ war; sie gelten für Bestandsanlagen weiter (§ 100 Abs. 46 EEG). Die Verlängerung nach § 51a rechnet ebenfalls in Viertelstunden. Die SMARD-Zahlen auf dieser Seite sind Stunden.` },
    ],
    body: (h) => `
<h2>Warum Strom manchmal weniger als nichts kostet</h2>
<p>Am Day-Ahead-Markt der Strombörse wird für jede Stunde des Folgetags ein Preis ermittelt, seit 2025 sogar für jede Viertelstunde. Liegt das Angebot über der Nachfrage, sinkt der Preis, und wenn Kraftwerke nicht schnell genug drosseln können oder Anlagen fest vergütet werden, rutscht er unter null. Dann zahlen Verkäufer dafür, dass jemand ihren Strom abnimmt. Für Betreiber kleiner Solaranlagen war das lange folgenlos, weil ihr Satz fest war. Seit dem ${h.date(P.solarspitzen.stichtag)} ist das für neue Anlagen anders: ${h.src('eeg_51', '§ 51 EEG')} setzt den anzulegenden Wert in diesen Zeiträumen auf null.</p>

<h2>Die Jahre im Vergleich</h2>
${h.table(['Jahr', 'Stunden mit negativem Preis', 'Anteil des Solarstroms', 'Börsenwert Solarstrom'], JAHRE.map((j) => {
  const y = SMARD.years[j];
  return [y.hours < 8700 ? `${j} (bis ${h.date(SMARD.retrieved_at)})` : j, h.num(y.neg_hours), h.pct(y.pv_neg_share, 1), `${h.num(y.pv_marktwert_ct, 2)} ct/kWh`];
}), `${h.src('smard', 'SMARD')}, Day-Ahead-Preis Deutschland/Luxemburg und Solarerzeugung je Stunde; Börsenwert nach Erzeugung gewichtet.`, ['l', 'r', 'r', 'r'])}
<p>Die Zahl der Stunden steigt, weil jedes Jahr mehrere Gigawatt Photovoltaik hinzukommen, die mittags gleichzeitig produzieren. Der Anteil des Solarstroms in negativen Stunden ist die für Betreiber wichtigere Größe: Er sagt, welcher Teil der Jahreseinspeisung unvergütet bliebe. Der nach Erzeugung gewichtete Börsenwert zeigt zugleich, wie wenig eine Kilowattstunde Solarstrom am Markt im Schnitt erlöst, verglichen mit dem festen Satz von ${h.ct(sm10.satzCt)} für eine neue 10-kWp-Anlage.</p>

<h2>Monat für Monat</h2>
${h.table(['Monat', ...JAHRE.map((j) => `Stunden ${j}`), `Solaranteil ${SMARD_JAHR}`], MON.map((m, i) => [MDE[i], ...JAHRE.map((j) => (SMARD.years[j].months[m] ? h.num(SMARD.years[j].months[m].neg_hours) : '–')), h.pct(Y.months[m].pv_neg_share, 1)]), laufend ? `${letztes}: Daten bis ${h.date(SMARD.retrieved_at)}.` : undefined, ['l', ...JAHRE.map(() => 'r' as const), 'r'])}
<p>Das Muster ist deutlich. Im Winter fallen negative Preise fast nur in windreichen Nächten an, wenn ohnehin kaum Solarstrom fließt; der Anteil des Solarstroms bleibt dann bei null. Von April bis August dagegen liegen sie mittags, genau in den Stunden, in denen eine Dachanlage am meisten einspeist. Der ${h.num(Y.months[spitze].neg_hours)}-Stunden-Monat ${MDE[Number(spitze) - 1]} ${SMARD_JAHR} nahm einer Anlage mit Smart Meter ${h.pct(Y.months[spitze].pv_neg_share)} ihrer Monatsvergütung. Auffällig ist auch, wie stark einzelne Monate zwischen den Jahren schwanken: Wetter, Feiertage und Wind verschieben die Zahlen deutlich.</p>

<h2>Was das für Ihre Vergütung heißt</h2>
<p>Ob Ihre Anlage betroffen ist, entscheiden Inbetriebnahmedatum und Zähler. Anlagen, die vor dem ${h.date(P.solarspitzen.stichtag)} liefen, folgen der alten Regel. Neue Anlagen unter ${h.num(P.solarspitzen.neg_preis_bis_kw)} kW bekommen ohne intelligentes Messsystem weiter jede Kilowattstunde vergütet. Mit Smart Meter gilt die Nullstellung ab dem 1. Januar des Folgejahres nach dem Einbau.</p>
${h.table(['Anlage (Smart Meter)', 'Einspeisung', 'Vergütung ohne Nullstellung', 'davon fällt weg'], [
  ['5 kWp', `${h.num(sm5.einspeisung)} kWh`, h.eur(sm5.verguetungJahr + sm5.negVerlustJahr), h.eur(sm5.negVerlustJahr)],
  ['10 kWp', `${h.num(sm10.einspeisung)} kWh`, h.eur(sm10.verguetungJahr + sm10.negVerlustJahr), h.eur(sm10.negVerlustJahr)],
  ['10 kWp mit 8 kWh Speicher', `${h.num(sm10sp.einspeisung)} kWh`, h.eur(sm10sp.verguetungJahr + sm10sp.negVerlustJahr), h.eur(sm10sp.negVerlustJahr)],
  ['10 kWp Ost-West', `${h.num(ow10.einspeisung)} kWh`, h.eur(ow10.verguetungJahr + ow10.negVerlustJahr), h.eur(ow10.negVerlustJahr)],
  ['15 kWp', `${h.num(sm15.einspeisung)} kWh`, h.eur(sm15.verguetungJahr + sm15.negVerlustJahr), h.eur(sm15.negVerlustJahr)],
], `Bundesmittel, Süd 30° (außer Ost-West), 4 000 kWh Verbrauch, Satz ab ${h.date(sm10.periodeVon)} laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')}, Solaranteil ${SMARD_JAHR}.`, ['l', 'r', 'r', 'r'])}
<p>Die Rechnung nimmt an, dass Ihre Anlage im selben Verhältnis betroffen ist wie der gesamte deutsche Solarstrom. Ein Speicher senkt den Verlust nur wenig, weil er an sonnigen Tagen meist schon mittags voll ist; erst eine Steuerung, die ihn gezielt in den negativen Stunden lädt, macht daraus einen Vorteil. Zum Teil ausgeglichen wird der Ausfall durch ${h.src('eeg_51a', '§ 51a EEG')}: Die Hälfte der verlorenen Viertelstunden wird als Zeitkontingent an das Ende der ${h.num(P.eeg.dauer_jahre)} Jahre angehängt. Die Einzelheiten dazu und zum Wechsel zwischen Deckel und Nullstellung stehen unter ${h.a('solarspitzengesetz', 'Solarspitzengesetz')}.</p>

<h2>Wer die Zahlen liefert</h2>
<p>Ob eine Viertelstunde negativ war, prüft nicht Ihr Netzbetreiber nach Gefühl. Die Strombörsen melden den Übertragungsnetzbetreibern jedes Jahr bis Mitte Januar die Zahl der Viertelstunden und Stunden mit genulltem Wert, und diese veröffentlichen sie bis Ende Januar auf einer gemeinsamen Internetseite (§ 51a Abs. 3 und 4 EEG). Daraus ergibt sich auch das Zeitkontingent für die spätere Verlängerung. In Ihrer Jahresabrechnung sehen Sie den Abzug als geringere Vergütung für die betroffenen Zeiträume; prüfen können Sie ihn mit den Lastgangdaten Ihres Smart Meters.</p>

<h2>Dynamischer Tarif als Gegenstück</h2>
<p>Für Haushalte mit Smart Meter haben negative Preise auch eine gute Seite. Dynamische Stromtarife geben den Börsenpreis stündlich oder viertelstündlich weiter; Netzentgelte, Abgaben und Umsatzsteuer kommen zwar hinzu, der Arbeitspreis sinkt in diesen Stunden aber deutlich. Wer ein Elektroauto, eine Wärmepumpe mit Pufferspeicher oder einen Heizstab flexibel steuert, kann gerade dann Strom beziehen. Mit eigener Solaranlage ist der Vorteil kleiner, weil mittags ohnehin eigener Strom da ist; er zeigt sich vor allem an trüben Tagen mit viel Wind. Welcher Zähler dafür nötig ist, steht unter ${h.a('balkonkraftwerk-zaehler', 'Zähler')}. Nach dem Regierungsentwurf zum EEG 2027 bliebe die Nullstellung bei negativen Preisen für Neuanlagen bestehen (${h.a('einspeiseverguetung-2027', 'Einspeisevergütung 2027')}).</p>`,
  },
  en: {
    slug: 'negative-power-prices-solar',
    nav: 'Negative power prices',
    card: 'How often the wholesale price drops below zero, in which months, and what that means for your feed-in tariff with a smart meter.',
    title: 'Negative Power Prices Germany 2026: Impact on Solar PV',
    description: `Negative power prices in Germany 2026: ${EN.num(Y.neg_hours)} hours below zero in ${SMARD_JAHR}, monthly SMARD figures, and how much feed-in tariff your PV loses with a smart meter.`,
    h1: 'Negative power prices 2026: what they take from your solar system',
    intro: `In ${SMARD_JAHR}, the German wholesale price was below zero for ${EN.num(Y.neg_hours)} hours, and ${EN.pct(Y.pv_neg_share)} of German solar output fell into those hours. A new 10 kWp system with a smart meter loses about ${EN.eur(sm10.negVerlustJahr)} of feed-in payment a year as a result.`,
    resume: `Negative power prices occur when more electricity is offered on the exchange than is demanded and generators pay to get rid of it. The Federal Network Agency’s market data platform SMARD shows the trend: in ${JAHRE[0]} there were ${EN.num(erstes.neg_hours)} hours with a negative day-ahead price, in ${SMARD_JAHR} already ${EN.num(Y.neg_hours)}. Most fall on sunny middays between April and August; ${MEN[Number(spitze) - 1]} ${SMARD_JAHR} alone had ${EN.num(Y.months[spitze].neg_hours)} hours. For solar, what matters most is how much solar power is produced in those hours: ${EN.pct(Y.pv_neg_share)} in ${SMARD_JAHR}. Under section 51 EEG, new systems earn nothing for those quarter-hours once a smart meter is installed, small systems from the following calendar year. A 10 kWp system on the national average loses ${EN.eur(sm10.negVerlustJahr)} a year, or ${EN.eur(sm10sp.negVerlustJahr)} with an 8 kWh battery. Without a smart meter the payment stays whole, but the ${EN.pct(P.solarspitzen.begrenzung_anteil)} cap applies. Section 51a adds half of the lost time to the end of support.`,
    faqs: [
      { q: `Which month of ${SMARD_JAHR} had the most negative-price hours in Germany?`, a: `${MEN[Number(spitze) - 1]}, with ${EN.num(Y.months[spitze].neg_hours)} hours, followed by the other months from April to August, which together brought ${EN.num(fruehSommer)} hours. From November to February there were only ${EN.num(winterStd)}. The cause is high midday solar output combined with public holidays with little industrial load, and wind. The figures come from SMARD’s hourly day-ahead series.` },
      { q: 'Does a system without a smart meter lose money at negative prices?', a: `No. Section 51(2) no. 1 EEG exempts systems below ${EN.num(P.solarspitzen.neg_preis_bis_kw)} kW until the end of the calendar year in which a smart metering system is installed. The 10 kWp system without a smart meter therefore earns its rate on all ${EN.num(alt10.einspeisung)} kWh it exports. In return, it may only export ${EN.pct(P.solarspitzen.begrenzung_anteil)} of its capacity and loses ${EN.num(alt10.abgeregelt)} kWh to the cap.` },
      { q: 'What percentage of the feed-in payment is lost with a smart meter?', a: `Roughly as much as solar output produced in negative-price hours: on the national average ${EN.pct(anteilVerg)} of the annual payment, based on ${SMARD_JAHR} figures. For 5 kWp that is ${EN.eur(sm5.negVerlustJahr)}, for 15 kWp ${EN.eur(sm15.negVerlustJahr)} a year. An east-west 10 kWp system loses ${EN.eur(ow10.negVerlustJahr)}, because it produces less at midday.` },
      { q: 'Is a dynamic electricity tariff worth it with solar panels?', a: `It can be, if a large load is flexible. In hours with a negative wholesale price, grid power on a dynamic tariff is particularly cheap, even though network charges, levies and taxes remain. Charging an electric car or a heat store at those times uses cheap power while your own system would be exporting unpaid anyway. A smart metering system is required.` },
      { q: `How many negative-price hours has ${letztes} had so far?`, a: `Up to the data retrieval on ${tag(SMARD.retrieved_at, 'en')}, SMARD counted ${EN.num(L.neg_hours)} hours with a negative price in ${letztes}, and ${EN.pct(L.pv_neg_share)} of solar output fell into that time. The busiest month was ${MEN[Number(MON.reduce((a, m) => ((L.months[m]?.neg_hours ?? 0) > (L.months[a]?.neg_hours ?? 0) ? m : a), '1')) - 1]}. Whether the year beats ${SMARD_JAHR} is already decided by the season: winter brings hardly any such hours.` },
      { q: 'Do negative prices count by the full hour or by each quarter-hour?', a: `For systems from ${tag(P.solarspitzen.stichtag, 'en')}, every quarter-hour with a negative spot price counts, with no minimum duration. Earlier versions of section 51 only applied once the price had been negative for several hours in a row; they still apply to existing systems (section 100(46) EEG). The section 51a extension is also counted in quarter-hours. The SMARD figures on this page are hours.` },
    ],
    body: (h) => `
<h2>Why power sometimes costs less than nothing</h2>
<p>On the exchange’s day-ahead market, a price is set for every hour of the next day, and since 2025 for every quarter-hour. When supply exceeds demand the price falls, and if power stations cannot throttle quickly enough or systems are paid a fixed rate, it slips below zero. Sellers then pay for someone to take their power. For owners of small solar systems this long had no consequences, because their rate was fixed. Since ${h.date(P.solarspitzen.stichtag)}, new systems are treated differently: ${h.src('eeg_51', 'section 51 EEG')} sets the reference value to zero for those periods.</p>

<h2>The years compared</h2>
${h.table(['Year', 'Hours with negative price', 'Share of solar output', 'Market value of solar'], JAHRE.map((j) => {
  const y = SMARD.years[j];
  return [y.hours < 8700 ? `${j} (to ${h.date(SMARD.retrieved_at)})` : j, h.num(y.neg_hours), h.pct(y.pv_neg_share, 1), `${h.num(y.pv_marktwert_ct, 2)} ct/kWh`];
}), `${h.src('smard', 'SMARD')}, day-ahead price Germany/Luxembourg and hourly solar generation; market value weighted by output.`, ['l', 'r', 'r', 'r'])}
<p>The number of hours keeps rising because several gigawatts of PV are added every year, all producing at the same time around noon. For system owners, the share of solar output in negative hours is the more important figure: it tells you which part of annual exports would go unpaid. The output-weighted market value also shows how little a kilowatt-hour of solar power earns on the market on average, compared with the fixed rate of ${h.ct(sm10.satzCt)} for a new 10 kWp system.</p>

<h2>Month by month</h2>
${h.table(['Month', ...JAHRE.map((j) => `Hours ${j}`), `Solar share ${SMARD_JAHR}`], MON.map((m, i) => [MEN[i], ...JAHRE.map((j) => (SMARD.years[j].months[m] ? h.num(SMARD.years[j].months[m].neg_hours) : '–')), h.pct(Y.months[m].pv_neg_share, 1)]), laufend ? `${letztes}: data to ${h.date(SMARD.retrieved_at)}.` : undefined, ['l', ...JAHRE.map(() => 'r' as const), 'r'])}
<p>The pattern is clear. In winter, negative prices occur almost only on windy nights, when there is hardly any solar output; the solar share then stays at zero. From April to August, by contrast, they fall at midday, exactly when a rooftop system exports most. The ${h.num(Y.months[spitze].neg_hours)}-hour month of ${MEN[Number(spitze) - 1]} ${SMARD_JAHR} took ${h.pct(Y.months[spitze].pv_neg_share)} of the monthly payment from a system with a smart meter. Individual months also swing strongly between years: weather, holidays and wind move the figures considerably.</p>

<h2>What it means for your payment</h2>
<p>Whether your system is affected depends on its commissioning date and meter. Systems running before ${h.date(P.solarspitzen.stichtag)} follow the old rule. New systems below ${h.num(P.solarspitzen.neg_preis_bis_kw)} kW keep earning on every kilowatt-hour without a smart metering system. With a smart meter, the zero rate applies from 1 January of the year after installation.</p>
${h.table(['System (smart meter)', 'Export', 'Payment without zero rate', 'of which lost'], [
  ['5 kWp', `${h.num(sm5.einspeisung)} kWh`, h.eur(sm5.verguetungJahr + sm5.negVerlustJahr), h.eur(sm5.negVerlustJahr)],
  ['10 kWp', `${h.num(sm10.einspeisung)} kWh`, h.eur(sm10.verguetungJahr + sm10.negVerlustJahr), h.eur(sm10.negVerlustJahr)],
  ['10 kWp with 8 kWh battery', `${h.num(sm10sp.einspeisung)} kWh`, h.eur(sm10sp.verguetungJahr + sm10sp.negVerlustJahr), h.eur(sm10sp.negVerlustJahr)],
  ['10 kWp east-west', `${h.num(ow10.einspeisung)} kWh`, h.eur(ow10.verguetungJahr + ow10.negVerlustJahr), h.eur(ow10.negVerlustJahr)],
  ['15 kWp', `${h.num(sm15.einspeisung)} kWh`, h.eur(sm15.verguetungJahr + sm15.negVerlustJahr), h.eur(sm15.negVerlustJahr)],
], `National average, south 30° (except east-west), 4,000 kWh consumption, rate from ${h.date(sm10.periodeVon)} per the ${h.src('bnetza_saetze', 'Federal Network Agency')}, solar share ${SMARD_JAHR}.`, ['l', 'r', 'r', 'r'])}
<p>The calculation assumes your system is affected in the same proportion as German solar output as a whole. A battery reduces the loss only a little, because on sunny days it is usually full by midday; only a control that charges it deliberately during negative hours turns this into an advantage. The loss is partly made up by ${h.src('eeg_51a', 'section 51a EEG')}: half of the lost quarter-hours is added as a time allowance after the ${h.num(P.eeg.dauer_jahre)} years. Details on this and on the switch between cap and zero rate are under ${h.a('solarspitzengesetz', 'solar peak law')}.</p>

<h2>Who supplies the figures</h2>
<p>Whether a quarter-hour was negative is not left to your grid operator’s judgement. Each year, by mid-January, the power exchanges report the number of zero-rated quarter-hours and hours to the transmission system operators, who publish them by the end of January on a joint website (section 51a(3) and (4) EEG). This also sets the time allowance for the later extension. In your annual statement, the deduction shows up as a lower payment for the affected periods; you can check it against your smart meter’s load profile.</p>

<h2>Dynamic tariffs as the flip side</h2>
<p>For households with a smart meter, negative prices also have an upside. Dynamic electricity tariffs pass on the exchange price hourly or per quarter-hour; network charges, levies and VAT are added, but the energy price drops sharply in those hours. If you control an electric car, a heat pump with a buffer tank or an immersion heater flexibly, you can draw power exactly then. With your own solar system the benefit is smaller, since your own power is there at midday anyway; it shows mainly on dull, windy days. Which meter you need is under ${h.a('balkonkraftwerk-zaehler', 'meters')}. Under the government draft of the EEG 2027, the zero rate at negative prices would remain for new systems (${h.a('einspeiseverguetung-2027', 'feed-in tariff 2027')}).</p>`,
  },
});

import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { vergleich2027 } from '../../lib/engine/eeg2027';
import { AKTUELL } from '../../lib/engine/eeg';
import { P, EEG, DE, EN, STROMPREIS_CT } from '../../lib/fmt';
const KW100 = P.solarspitzen.begrenzung_bis_kw;

/**
 * Zwei Rechtsstände: EEG 2023 (Inbetriebnahme bis P.eeg.anwendbar_bis) und Regierungsentwurf EEG 2027 (BT-Drs. 21/7867,
 * nicht in Kraft). Beispiele: Bundesmittel, Süd 30°, 4 000 kWh, Einspeisemenge aus dem Motor, Vergleich mit vergleich2027.
 * Die Leistungsstufen der Übergangszahlung stehen in den Schlüsseln von P.eeg2027 (uebergang_ltXX_inbetrieb_vor).
 */
const E = P.eeg2027;
const STUFEN = Object.entries(E)
  .filter(([k]) => /^uebergang_lt\d+_inbetrieb_vor$/.test(k))
  .map(([k, v]) => ({ kw: Number(k.match(/\d+/)![0]), vor: String(v) }))
  .sort((a, b) => b.kw - a.kw);
const [S1, S2, S3] = STUFEN;
const start27 = new Date(Date.parse(P.eeg.anwendbar_bis) + 864e5).toISOString().slice(0, 10);
const jahr = (iso: string, d = 0) => String(Number(iso.slice(0, 4)) + d);
const tag = (iso: string, l: 'de' | 'en') => new Date(Date.parse(iso)).toLocaleDateString(l === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fall = (kwp: number) => { const r = rechnePv({ ort: null, kwp, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil', smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 15000 }); return { r, v: vergleich2027(kwp, r.einspeisung) }; };
const k6 = fall(6), k10 = fall(10), k15 = fall(15), k30 = fall(30);
const dvBonusJahr = k10.r.einspeisung * E.dv_bonus_ct / 100;
const luecke = k10.v.satz26 - k10.v.satz27;
const vgJahre = P.eeg.dauer_jahre;
const uebJahre = E.uebergang_monate / 12;

export default defineGuide({
  id: 'einspeiseverguetung-2027',
  group: 'recht',
  order: 62,
  mini: 'eeg2027',
  miniHref: 'einspeiseverguetung',
  related: ['einspeiseverguetung', 'solarspitzengesetz', 'nulleinspeisung', 'photovoltaik-lohnt-sich', 'stromspeicher-groesse'],
  sources: ['bt_eeg2027', 'bnetza_saetze', 'eeg_48', 'eeg_21', 'eeg_100'],
  de: {
    slug: 'einspeiseverguetung-2027',
    nav: 'Einspeisevergütung 2027',
    card: 'Geltendes EEG 2023 bis Jahresende, Regierungsentwurf ab 2027: Übergangszahlung, Stufen, 50-Prozent-Kappung im Vergleich.',
    title: 'Einspeisevergütung 2027: Entwurf gegen Recht von 2026',
    description: `Einspeisevergütung 2027 laut Regierungsentwurf: Übergangszahlung für ${E.uebergang_monate} Monate statt ${vgJahre} Jahre Vergütung. Was 2026 noch gilt und was die Inbetriebnahme kostet.`,
    h1: 'Einspeisevergütung 2027: was der Entwurf ändert und was 2026 noch gilt',
    intro: `Eine 10-kWp-Anlage, die bis zum ${tag(P.eeg.anwendbar_bis, 'de')} ans Netz geht, bekommt ${vgJahre} Jahre lang ${DE.ct(k10.v.satz26)}, zusammen rund ${DE.eur(k10.v.summe26)}. Nach dem Entwurf erhielte dieselbe Anlage 2027 nur ${E.uebergang_monate} Monate Übergangszahlung, etwa ${DE.eur(k10.v.summe27)}.`,
    resume: `Für die Einspeisevergütung 2027 gibt es zwei Rechtsstände, die man auseinanderhalten muss. Geltendes Recht ist das EEG 2023: Wer eine Dachanlage bis zum ${tag(P.eeg.anwendbar_bis, 'de')} in Betrieb nimmt, bekommt ${vgJahre} Jahre lang den Satz seines Zeitraums, derzeit ${DE.ct(AKTUELL.teil[0])} bis ${EEG.grenzen_kw[0]} kWp bei Teileinspeisung. Der Regierungsentwurf zum EEG 2027 (Bundestagsdrucksache ${E.drucksache} vom ${tag(E.datum, 'de')}) ist dagegen noch nicht beschlossen. Er schafft die feste Vergütung für Neuanlagen ab und ersetzt sie durch eine befristete Übergangszahlung: anzulegender Wert minus ${DE.num(E.uebergang_abzug_ct)} Cent, höchstens ${E.uebergang_monate} Monate, für Anlagen unter ${S1.kw} kW mit Inbetriebnahme ${jahr(start27)}, unter ${S2.kw} kW ${jahr(start27, 1)} und unter ${S3.kw} kW bis ${jahr(S3.vor, -1)}. Danach müssten sie direkt vermarkten oder ohne Einspeisung laufen. Für eine 10-kWp-Anlage im Bundesmittel heißt das rechnerisch ${DE.eur(k10.v.summe26)} Vergütung über ${vgJahre} Jahre nach heutigem Recht gegen ${DE.eur(k10.v.summe27)} über ${DE.num(uebJahre)} Jahre nach Entwurf. Bestandsanlagen behalten ihr Recht.`,
    faqs: [
      { q: 'Bekommt meine Anlage von 2026 nach dem EEG 2027 weniger Geld?', a: `Nach dem Entwurf nicht. § 100 Abs. 1 EEG 2027 in der Fassung der Drucksache ${E.drucksache} hält fest, dass für Anlagen mit Inbetriebnahme vor dem ${tag(start27, 'de')} das bisherige Recht weiter gilt, einschließlich der Übergangsregeln des EEG 2023. Ihr Satz bleibt also ${vgJahre} Jahre lang so, wie ihn die Bundesnetzagentur für Ihren Inbetriebnahmezeitraum veröffentlicht hat.` },
      { q: 'Wie hoch wäre die Übergangszahlung für eine 10-kWp-Anlage 2027?', a: `Das steht noch nicht fest, weil der anzulegende Wert für 2027 nicht veröffentlicht ist. Nimmt man den letzten Wert, ergäben sich ${DE.ct(k10.v.satz27)}, also ${DE.ct(luecke)} weniger als heute. Bei ${DE.num(k10.r.einspeisung)} kWh Einspeisung im Bundesmittel wären das gut ${DE.eur(k10.v.summe27 / uebJahre)} im Jahr, aber nur für ${E.uebergang_monate} Monate.` },
      { q: `Was passiert nach den ${E.uebergang_monate} Monaten Übergangszahlung?`, a: `Laut Begründung zu § 25 Abs. 2 EEG 2027 bleiben drei Wege: Die Anlage läuft als Nulleinspeiseanlage, ihr Strom wird über einen Dienstleister direkt vermarktet, oder er geht über die unentgeltliche Abnahme ohne Bezahlung ins Netz. Für kleine Anlagen unter ${S2.kw} kW sieht der Entwurf einen Bonus von ${DE.num(E.dv_bonus_ct, 1)} Cent je kWh für bis zu ${E.dv_bonus_monate} Monate Direktvermarktung vor.` },
      { q: 'Lohnt es sich, die Anlage noch 2026 in Betrieb zu nehmen?', a: `Rechnerisch ja, sofern das Recht so kommt. Eine 15-kWp-Anlage käme nach heutigem Recht auf etwa ${DE.eur(k15.v.summe26)} Vergütung über ${vgJahre} Jahre, nach Entwurf auf ${DE.eur(k15.v.summe27)}. Maßgeblich ist das Datum der Inbetriebnahme, nicht der Kauf. Ein Termin kurz vor Jahresende ist riskant, wenn Zählersetzung oder Netzanschluss sich verzögern.` },
      { q: 'Gilt die Übergangszahlung auch für ein Balkonkraftwerk?', a: `Nein. Nach § 21 Abs. 1 Satz 2 EEG 2027 im Entwurf können neue Steckersolargeräte bis ${DE.num(P.balkon.max_wp)} Watt Modulleistung und ${DE.num(P.balkon.max_va)} Voltampere keine Übergangszahlung beanspruchen. Ihr Überschuss darf weiter unentgeltlich ins Netz fließen. Das ändert für sie wenig, denn schon heute wird ein Balkonkraftwerk nicht vergütet und rechnet sich über den gesparten Netzstrom.` },
      { q: 'Kommt mit dem EEG 2027 eine strengere Einspeisegrenze?', a: `Der Entwurf sieht in § 9 Abs. 2b für neue Dachanlagen unter ${KW100} kW eine dauerhafte Begrenzung auf ${DE.pct(E.kappung_anteil)} der installierten Leistung vor, auch mit Smart Meter und unabhängig von der Vermarktung. Heute liegt die Grenze bei ${DE.pct(P.solarspitzen.begrenzung_anteil)} und entfällt mit Smart Meter. Nulleinspeiseanlagen und Steckersolargeräte wären ausgenommen. Ein Speicher würde damit wertvoller.` },
    ],
    body: (h) => `
<h2>Zwei Rechtsstände nebeneinander</h2>
<p>Wer im Herbst ${jahr(P.eeg.anwendbar_bis)} eine Dachanlage plant, rechnet mit zwei Gesetzen. Das eine gilt: Das EEG 2023 garantiert jeder Anlage, die bis zum ${h.date(P.eeg.anwendbar_bis)} in Betrieb geht, die Einspeisevergütung ihres Zeitraums (${h.src('eeg_21', '§ 21 EEG')}, ${h.src('eeg_48', '§ 48 EEG')}) für ${h.num(vgJahre)} Jahre ab Inbetriebnahme, verlängert bis zum 31. Dezember des letzten dieser Jahre (§ 25 EEG). Das andere ist ein Plan: Der ${h.src('bt_eeg2027', 'Regierungsentwurf zum EEG 2027')} liegt dem Bundestag seit dem ${h.date(E.datum)} vor und soll am ${h.date(start27)} in Kraft treten. Bis zur Verabschiedung kann sich jede Zahl darin noch ändern. Diese Seite rechnet deshalb mit dem geltenden Recht und stellt den Entwurf daneben, nie an dessen Stelle.</p>

<h2>Was bis Jahresende gilt</h2>
<p>Für Inbetriebnahmen vom ${h.date(AKTUELL.von)} bis ${h.date(AKTUELL.bis)} veröffentlicht die ${h.src('bnetza_saetze', 'Bundesnetzagentur')} bei Teileinspeisung ${h.ct(AKTUELL.teil[0])} für die ersten ${h.num(EEG.grenzen_kw[0])} kW, ${h.ct(AKTUELL.teil[1])} für den Teil bis ${h.num(EEG.grenzen_kw[1])} kW und ${h.ct(AKTUELL.teil[2])} darüber. Die Sätze sinken jedes halbe Jahr um ${h.pct(P.eeg.degression_halbjahr)}. Ohne Smart Meter gilt die Einspeisegrenze aus dem ${h.a('solarspitzengesetz', 'Solarspitzengesetz')}, mit Smart Meter entfällt die Vergütung bei negativen Preisen. Beides ist in der Rechnung unten enthalten.</p>

<h2>Was der Entwurf für Neuanlagen vorsieht</h2>
<p>Kern des Entwurfs ist der Satz aus der Begründung, die fixe Einspeisevergütung für Neuanlagen werde „konsequent abgeschafft“. An ihre Stelle tritt die Direktvermarktung als Regelfall. Kleine Anlagen bekommen eine Brücke, die befristete Übergangszahlung nach § 21 Abs. 1 Satz 1 Nr. 1 EEG 2027. Sie berechnet sich wie die alte Vergütung aus dem anzulegenden Wert, von dem aber ${h.num(E.uebergang_abzug_ct)} Cent abgezogen werden (§ 53 Abs. 1 im Entwurf) statt heute ${h.num(P.eeg.abzug_einspeiseverguetung_ct, 1)} Cent. Gezahlt wird sie bis zum ${h.num(E.uebergang_monate)}. Kalendermonat nach der Inbetriebnahme. Der Zugang wird Jahr für Jahr enger:</p>
${h.table(['Inbetriebnahme', 'Übergangszahlung für Anlagen', 'Dauer'], [
  [`${jahr(start27)}`, `unter ${h.num(S1.kw)} kW`, `${h.num(E.uebergang_monate)} Monate`],
  [`${jahr(S1.vor)}`, `unter ${h.num(S2.kw)} kW`, `${h.num(E.uebergang_monate)} Monate`],
  [`${jahr(S2.vor)} bis ${jahr(S3.vor, -1)}`, `unter ${h.num(S3.kw)} kW`, `${h.num(E.uebergang_monate)} Monate`],
  [`ab ${jahr(S3.vor)}`, 'keine', '–'],
], `Regierungsentwurf, Drucksache ${E.drucksache}, Begründung zu § 21 EEG 2027. Nicht in Kraft.`, ['l', 'l', 'r'])}
<p>Die Bundesnetzagentur soll die Übergangsphase für Anlagen unter ${h.num(S2.kw)} kW per Festlegung befristet verlängern dürfen, wenn Direktvermarktung für sie noch nicht mit vertretbarem Aufwand möglich ist. Wer danach einspeist, kann einen Direktvermarktungsbonus von ${h.num(E.dv_bonus_ct, 1)} Cent je kWh für höchstens ${h.num(E.dv_bonus_monate)} Monate erhalten (§ 50c im Entwurf), wenn die Anlage unter ${h.num(S2.kw)} kW liegt. Daneben bleibt die unentgeltliche Abnahme für Anlagen unter ${KW100} kW: Der Netzbetreiber nimmt den Strom, zahlt aber nichts.</p>

<h2>Der Vergleich in Euro</h2>
<p>Die Tabelle rechnet beide Wege für Anlagen im Bundesmittel, Süd 30°, Haushalt mit 4 000 kWh. Für 2027 ist der anzulegende Wert unbekannt; angenommen ist der zuletzt veröffentlichte. Die Einspeisemenge ist die heutige, die strengere Kappung des Entwurfs ist nicht abgezogen.</p>
${h.table(['Anlage', 'Einspeisung/Jahr', `Satz ${jahr(P.eeg.anwendbar_bis)}`, `Summe ${vgJahre} Jahre`, 'Satz Entwurf', `Summe ${E.uebergang_monate} Monate`], [
  ['6 kWp', `${h.num(k6.r.einspeisung)} kWh`, h.ct(k6.v.satz26), h.eur(k6.v.summe26), h.ct(k6.v.satz27), h.eur(k6.v.summe27)],
  ['10 kWp', `${h.num(k10.r.einspeisung)} kWh`, h.ct(k10.v.satz26), h.eur(k10.v.summe26), h.ct(k10.v.satz27), h.eur(k10.v.summe27)],
  ['15 kWp', `${h.num(k15.r.einspeisung)} kWh`, h.ct(k15.v.satz26), h.eur(k15.v.summe26), h.ct(k15.v.satz27), h.eur(k15.v.summe27)],
  ['30 kWp', `${h.num(k30.r.einspeisung)} kWh`, h.ct(k30.v.satz26), h.eur(k30.v.summe26), h.ct(k30.v.satz27), h.eur(k30.v.summe27)],
], 'Ohne Zinsen, ohne Preisänderung. Entwurf: nur die Übergangszahlung, ohne spätere Erlöse aus Direktvermarktung.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Der Abstand wirkt dramatisch, ist aber zu relativieren. Nach dem Ende der Übergangszahlung bringt der eingespeiste Strom weiter etwas, wenn ein Direktvermarkter ihn abnimmt; für die 10-kWp-Anlage käme der Bonus mit rund ${h.eur(dvBonusJahr)} im Jahr hinzu. Den größeren Teil des Nutzens liefert ohnehin der selbst verbrauchte Strom: Dieselbe Anlage spart bei ${h.num(STROMPREIS_CT, 1)} ct/kWh rund ${h.eur(k10.r.ersparnisJahr)} im Jahr, unabhängig vom Gesetz. Deshalb verschiebt der Entwurf die Rechnung zu höherem Eigenverbrauch und zum Speicher, wie die Begründung offen sagt.</p>

<h2>Weitere Punkte des Entwurfs</h2>
<ul>
<li><strong>Kappung:</strong> neue Dachanlagen unter ${KW100} kW speisen dauerhaft höchstens ${h.pct(E.kappung_anteil)} ihrer Leistung ein, auch mit Smart Meter (§ 9 Abs. 2b im Entwurf).</li>
<li><strong>Messtechnik:</strong> Der Rollout intelligenter Messsysteme soll schon Erzeugungsanlagen ab mehr als ${h.num(E.smgw_ab_kw)} kW erfassen.</li>
<li><strong>Volleinspeisung:</strong> Die höheren Sätze für Volleinspeiser fallen für Neuanlagen weg.</li>
<li><strong>Negative Preise:</strong> Die Nullstellung der Zahlung bei negativen Preisen wird fortgeführt.</li>
<li><strong>Nulleinspeisung:</strong> Anlagen ohne Einspeisung werden von mehreren technischen Pflichten befreit, müssen aber weiter ins Marktstammdatenregister; mehr dazu unter ${h.a('nulleinspeisung', 'Nulleinspeisung')}.</li>
</ul>

<h2>Wie Sie mit der Unsicherheit planen</h2>
<p>Für eine Entscheidung im Jahr ${jahr(P.eeg.anwendbar_bis)} zählt nur, was bis zur Inbetriebnahme sicher ist. Wer bis zum ${h.date(P.eeg.anwendbar_bis)} anschließt, plant nach heutigem Recht; der Entwurf betrifft diese Anlage nach seinem eigenen § 100 nicht. Wer erst ${jahr(start27)} anschließen kann, rechnet am besten vorsichtig: Eigenverbrauch voll, Einspeisung nur für die Übergangszeit, danach mit null. Rechnet sich die Anlage so, ist sie auch mit einem späteren Vermarktungserlös sicher. Den heutigen Satz für Ihre Größe zeigt der ${h.a('einspeiseverguetung', 'Einspeisevergütungsrechner')}.</p>`,
  },
  en: {
    slug: 'feed-in-tariff-2027',
    nav: 'Feed-in tariff 2027',
    card: 'Current EEG 2023 until year end, government draft from 2027: transition payment, stages and 50 per cent cap compared.',
    title: 'Feed-in Tariff 2027 Germany: the Draft vs. the 2026 Rules',
    description: `Feed-in tariff 2027 in Germany under the draft bill: a ${E.uebergang_monate}-month transition payment instead of ${vgJahre} years of tariff. What applies in 2026 and what timing costs.`,
    h1: 'Feed-in tariff 2027: what the draft changes and what applies in 2026',
    intro: `A 10 kWp system connected by ${tag(P.eeg.anwendbar_bis, 'en')} receives ${EN.ct(k10.v.satz26)} for ${vgJahre} years, about ${EN.eur(k10.v.summe26)} in total. Under the draft, the same system connected in 2027 would get a transition payment for only ${E.uebergang_monate} months, about ${EN.eur(k10.v.summe27)}.`,
    resume: `For the feed-in tariff (Einspeisevergütung) in 2027 there are two legal states to keep apart. The law in force is the EEG 2023: a rooftop system commissioned by ${tag(P.eeg.anwendbar_bis, 'en')} receives the rate of its period for ${vgJahre} years, currently ${EN.ct(AKTUELL.teil[0])} up to ${EEG.grenzen_kw[0]} kWp with surplus feed-in. The government draft of the EEG 2027 (Bundestag printed paper ${E.drucksache} of ${tag(E.datum, 'en')}) has not been passed. It abolishes the fixed tariff for new systems and replaces it with a temporary transition payment: the reference value minus ${EN.num(E.uebergang_abzug_ct)} cent, for at most ${E.uebergang_monate} months, for systems below ${S1.kw} kW commissioned in ${jahr(start27)}, below ${S2.kw} kW in ${jahr(start27, 1)} and below ${S3.kw} kW until ${jahr(S3.vor, -1)}. After that they would have to sell through direct marketing or run without export. For a 10 kWp system on the national average, that means ${EN.eur(k10.v.summe26)} over ${vgJahre} years under current law against ${EN.eur(k10.v.summe27)} over ${EN.num(uebJahre)} years under the draft. Existing systems keep their rules.`,
    faqs: [
      { q: 'Will my system from 2026 earn less under the EEG 2027?', a: `Not under the draft. Section 100(1) EEG 2027 as worded in printed paper ${E.drucksache} states that systems commissioned before ${tag(start27, 'en')} stay under the previous law, including the transitional rules of the EEG 2023. Your rate therefore stays for ${vgJahre} years exactly as the Federal Network Agency published it for your commissioning period.` },
      { q: 'How much would the 2027 transition payment be for 10 kWp?', a: `That is not settled, because the reference value for 2027 has not been published. Taking the latest value gives ${EN.ct(k10.v.satz27)}, which is ${EN.ct(luecke)} less than today. With ${EN.num(k10.r.einspeisung)} kWh exported on the national average, that is a little over ${EN.eur(k10.v.summe27 / uebJahre)} a year, but only for ${E.uebergang_monate} months.` },
      { q: `What happens after the ${E.uebergang_monate} months of transition payment?`, a: `According to the explanatory notes on section 25(2) EEG 2027, three routes remain: the system runs with zero export, its power is sold through a direct marketing provider, or it goes into the grid unpaid via free acceptance (unentgeltliche Abnahme). For small systems below ${S2.kw} kW, the draft adds a bonus of ${EN.num(E.dv_bonus_ct, 1)} cents per kWh for up to ${E.dv_bonus_monate} months of direct marketing.` },
      { q: 'Is it worth commissioning my system before the end of 2026?', a: `On paper yes, if the law passes as drafted. A 15 kWp system would earn about ${EN.eur(k15.v.summe26)} over ${vgJahre} years under current law, against ${EN.eur(k15.v.summe27)} under the draft. What counts is the commissioning date, not the purchase. A slot just before year end is risky if the meter change or grid connection slips.` },
      { q: 'Does the transition payment cover balcony solar?', a: `No. Under section 21(1) sentence 2 of the draft EEG 2027, new plug-in solar devices up to ${EN.num(P.balkon.max_wp)} watts of panels and ${EN.num(P.balkon.max_va)} volt-amperes cannot claim the transition payment. Their surplus may still flow into the grid unpaid. Little changes for them, because a balcony kit is not paid today either and earns its keep through the grid power it saves.` },
      { q: 'Does the EEG 2027 bring a stricter export limit?', a: `The draft proposes in section 9(2b) a permanent limit of ${EN.pct(E.kappung_anteil)} of installed capacity for new rooftop systems below ${KW100} kW, even with a smart meter and whatever the marketing route. Today the limit is ${EN.pct(P.solarspitzen.begrenzung_anteil)} and ends with a smart meter. Zero-export systems and plug-in solar would be exempt. A battery would become more valuable as a result.` },
    ],
    body: (h) => `
<h2>Two legal states side by side</h2>
<p>Anyone planning a rooftop system in autumn ${jahr(P.eeg.anwendbar_bis)} is working with two laws. One is in force: the EEG 2023 guarantees every system commissioned by ${h.date(P.eeg.anwendbar_bis)} the feed-in tariff of its period (${h.src('eeg_21', 'section 21 EEG')}, ${h.src('eeg_48', 'section 48 EEG')}) for ${h.num(vgJahre)} years from commissioning, extended to 31 December of the last of those years (section 25 EEG). The other is a plan: the ${h.src('bt_eeg2027', 'government draft of the EEG 2027')} has been before the Bundestag since ${h.date(E.datum)} and is meant to take effect on ${h.date(start27)}. Until it is passed, any figure in it may change. This page therefore calculates with current law and sets the draft beside it, never in its place.</p>

<h2>What applies until the end of the year</h2>
<p>For systems commissioned from ${h.date(AKTUELL.von)} to ${h.date(AKTUELL.bis)}, the ${h.src('bnetza_saetze', 'Federal Network Agency')} publishes, for surplus feed-in, ${h.ct(AKTUELL.teil[0])} for the first ${h.num(EEG.grenzen_kw[0])} kW, ${h.ct(AKTUELL.teil[1])} for the part up to ${h.num(EEG.grenzen_kw[1])} kW and ${h.ct(AKTUELL.teil[2])} above that. Rates fall by ${h.pct(P.eeg.degression_halbjahr)} every six months. Without a smart meter, the export limit of the ${h.a('solarspitzengesetz', 'solar peak law')} applies; with one, payment stops at negative prices. Both are included in the figures below.</p>

<h2>What the draft proposes for new systems</h2>
<p>The core of the draft is the sentence in its explanatory memorandum that the fixed feed-in tariff for new systems will be abolished “consistently”. Direct marketing becomes the rule. Small systems get a bridge, the temporary transition payment (befristete Übergangszahlung) under section 21(1) sentence 1 no. 1 EEG 2027. It is calculated like the old tariff from the reference value, but with ${h.num(E.uebergang_abzug_ct)} cent deducted (section 53(1) of the draft) instead of today’s ${h.num(P.eeg.abzug_einspeiseverguetung_ct, 1)} cent. It is paid until the ${h.num(E.uebergang_monate)}th calendar month after commissioning. Access narrows year by year:</p>
${h.table(['Commissioned', 'Transition payment for systems', 'Duration'], [
  [`${jahr(start27)}`, `below ${h.num(S1.kw)} kW`, `${h.num(E.uebergang_monate)} months`],
  [`${jahr(S1.vor)}`, `below ${h.num(S2.kw)} kW`, `${h.num(E.uebergang_monate)} months`],
  [`${jahr(S2.vor)} to ${jahr(S3.vor, -1)}`, `below ${h.num(S3.kw)} kW`, `${h.num(E.uebergang_monate)} months`],
  [`from ${jahr(S3.vor)}`, 'none', '–'],
], `Government draft, printed paper ${E.drucksache}, notes on section 21 EEG 2027. Not in force.`, ['l', 'l', 'r'])}
<p>The Federal Network Agency would be allowed to extend the transition phase for systems below ${h.num(S2.kw)} kW for a limited time if direct marketing cannot yet be done at reasonable cost. Systems below ${h.num(S2.kw)} kW that then export can receive a direct marketing bonus of ${h.num(E.dv_bonus_ct, 1)} cents per kWh for at most ${h.num(E.dv_bonus_monate)} months (section 50c of the draft). Free acceptance remains for systems below ${KW100} kW: the grid operator takes the power but pays nothing.</p>

<h2>The comparison in euros</h2>
<p>The table works out both routes on the national average, south 30°, for a household using 4,000 kWh. The 2027 reference value is unknown; the latest published one is assumed. Export volume is today’s; the draft’s stricter cap is not deducted.</p>
${h.table(['System', 'Export/year', `Rate ${jahr(P.eeg.anwendbar_bis)}`, `Total ${vgJahre} years`, 'Draft rate', `Total ${E.uebergang_monate} months`], [
  ['6 kWp', `${h.num(k6.r.einspeisung)} kWh`, h.ct(k6.v.satz26), h.eur(k6.v.summe26), h.ct(k6.v.satz27), h.eur(k6.v.summe27)],
  ['10 kWp', `${h.num(k10.r.einspeisung)} kWh`, h.ct(k10.v.satz26), h.eur(k10.v.summe26), h.ct(k10.v.satz27), h.eur(k10.v.summe27)],
  ['15 kWp', `${h.num(k15.r.einspeisung)} kWh`, h.ct(k15.v.satz26), h.eur(k15.v.summe26), h.ct(k15.v.satz27), h.eur(k15.v.summe27)],
  ['30 kWp', `${h.num(k30.r.einspeisung)} kWh`, h.ct(k30.v.satz26), h.eur(k30.v.summe26), h.ct(k30.v.satz27), h.eur(k30.v.summe27)],
], 'No interest, no price change. Draft: transition payment only, without later direct marketing income.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The gap looks dramatic but needs context. After the transition payment ends, exported power still earns something if a direct marketer takes it; for the 10 kWp system the bonus would add about ${h.eur(dvBonusJahr)} a year. Most of the benefit comes from self-used power anyway: at ${h.num(STROMPREIS_CT, 1)} ct/kWh the same system saves about ${h.eur(k10.r.ersparnisJahr)} a year, whatever the law says. That is why the draft pushes the calculation towards higher self-consumption and batteries, as its explanatory notes say openly.</p>

<h2>Other points in the draft</h2>
<ul>
<li><strong>Cap:</strong> new rooftop systems below ${KW100} kW export at most ${h.pct(E.kappung_anteil)} of their capacity permanently, even with a smart meter (section 9(2b) of the draft).</li>
<li><strong>Metering:</strong> the smart meter rollout would cover generators above ${h.num(E.smgw_ab_kw)} kW.</li>
<li><strong>Full feed-in:</strong> the higher rates for full feed-in systems end for new systems.</li>
<li><strong>Negative prices:</strong> zero payment at negative prices continues.</li>
<li><strong>Zero export:</strong> systems without export are freed from several technical duties but must still be entered in the Market Master Data Register; more under ${h.a('nulleinspeisung', 'zero export')}.</li>
</ul>

<h2>How to plan around the uncertainty</h2>
<p>For a decision in ${jahr(P.eeg.anwendbar_bis)}, only what is certain by commissioning counts. If you connect by ${h.date(P.eeg.anwendbar_bis)}, plan under current law; by its own section 100, the draft does not affect that system. If you can only connect in ${jahr(start27)}, calculate cautiously: full self-consumption, export paid only for the transition period, zero after that. If the system pays on that basis, it is safe with any later marketing income too. Today’s rate for your size is in the ${h.a('einspeiseverguetung', 'feed-in tariff calculator')}.</p>`,
  },
});

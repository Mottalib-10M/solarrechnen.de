import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { AKTUELL, mischsatz } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Volleinspeisung gegen Teileinspeisung im Bundesmittel, Süd 30°, ohne Smart Meter, Inbetriebnahme im aktuellen Zeitraum.
 * Verbrauchsreihe nur im gültigen Bereich der Simulationstabelle (Ertrag höchstens das Vierfache des Verbrauchs).
 */
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 15000 };
const voll = rechnePv({ ...base, modus: 'voll' });
const teil = rechnePv(base);
const reihe = [3000, 4000, 5000, 6000].map((vb) => ({ vb, t: rechnePv({ ...base, verbrauchKwh: vb }) }));
/** Verbrauch, ab dem Teileinspeisung mehr bringt (Bisektion im gültigen Bereich). */
let lo = 2700, hi = 6000;
for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (rechnePv({ ...base, verbrauchKwh: m }).nutzenJahr >= voll.nutzenJahr) hi = m; else lo = m; }
const schwelle = Math.round(hi / 100) * 100;
const zuschlag = AKTUELL.voll[0] - AKTUELL.teil[0];
const vollSm = rechnePv({ ...base, modus: 'voll', smartMeter: true });
const k5t = rechnePv({ ...base, kwp: 5 }), k5v = rechnePv({ ...base, kwp: 5, modus: 'voll' });
/** Annahme: günstigerer Stromtarif von 25 ct, etwa ein Wärmepumpentarif oder ein dynamischer Tarif. */
const BILLIG = 25;
const tB = rechnePv({ ...base, preisCt: BILLIG }), vB = rechnePv({ ...base, preisCt: BILLIG, modus: 'voll' });
const VON_DE = new Date(AKTUELL.von).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const VON_EN = new Date(AKTUELL.von).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const sv15 = mischsatz(AKTUELL, 15, 'voll'), st15 = mischsatz(AKTUELL, 15, 'teil');

export default defineGuide({
  id: 'volleinspeisung-teileinspeisung',
  group: 'pv',
  order: 46,
  mini: 'vollTeil',
  related: ['einspeiseverguetung', 'photovoltaik-rechner', 'solarspitzengesetz', 'negative-strompreise', 'photovoltaik-lohnt-sich'],
  sources: ['eeg_48', 'bnetza_saetze', 'eeg_9', 'eeg_51', 'pvgis'],
  de: {
    slug: 'volleinspeisung-oder-teileinspeisung',
    nav: 'Volleinspeisung oder Teileinspeisung',
    card: 'Höherer Satz für den ganzen Strom oder Eigenverbrauch plus Überschuss: die Verbrauchsschwelle und die Mitteilung nach § 48 Abs. 2a EEG.',
    title: 'Volleinspeisung oder Teileinspeisung 2026: Schwelle, Frist',
    description: `Volleinspeisung oder Teileinspeisung 2026: ${DE.ct(AKTUELL.voll[0])} gegen ${DE.ct(AKTUELL.teil[0])}, ab rund ${DE.num(schwelle)} kWh Verbrauch gewinnt Teil. Dazu die Frist nach § 48 Abs. 2a EEG.`,
    h1: 'Volleinspeisung oder Teileinspeisung: wo 2026 die Grenze liegt',
    intro: `Volleinspeisung zahlt ${DE.ct(AKTUELL.voll[0])} statt ${DE.ct(AKTUELL.teil[0])}, aber für jede Kilowattstunde, auch die, die Sie sonst selbst nutzen würden. Bei 10 kWp im Bundesmittel kippt die Wahl bei rund ${DE.num(schwelle)} kWh Jahresverbrauch.`,
    resume: `Bei Teileinspeisung nutzt der Haushalt den Solarstrom zuerst selbst und speist nur den Überschuss ein, für Anlagen ab dem ${VON_DE} zu ${DE.ct(AKTUELL.teil[0])} bis 10 kWp. Bei Volleinspeisung geht der gesamte Strom eines Kalenderjahres ins Netz, und der anzulegende Wert erhöht sich nach § 48 Abs. 2a EEG; die Bundesnetzagentur weist für diesen Zeitraum ${DE.ct(AKTUELL.voll[0])} aus, also ${DE.ct(zuschlag)} mehr. Welche Variante mehr bringt, hängt am Verbrauch. Eine 10-kWp-Anlage nach Süden erzeugt im Bundesmittel ${DE.num(voll.ertrag)} kWh. Als Volleinspeisung bringt sie ${DE.eur(voll.nutzenJahr)} im Jahr, wobei ohne Smart Meter ${DE.num(voll.abgeregelt)} kWh an der 60-Prozent-Grenze verloren gehen. Als Teileinspeisung bringt sie bei 4 000 kWh Verbrauch ${DE.eur(teil.nutzenJahr)}, bei 6 000 kWh ${DE.eur(reihe[3].t.nutzenJahr)}. Die Schwelle liegt bei rund ${DE.num(schwelle)} kWh. Wer voll einspeisen will, muss das dem Netzbetreiber vor der Inbetriebnahme in Textform mitteilen und danach jeweils vor dem 1. Dezember für das Folgejahr.`,
    faqs: [
      { q: 'Ab welchem Stromverbrauch lohnt sich Teileinspeisung bei 10 kWp?', a: `Im Bundesmittel ab rund ${DE.num(schwelle)} kWh im Jahr, gerechnet für eine Südanlage mit 30° Neigung, ohne Speicher und Smart Meter, bei ${DE.num(STROMPREIS_CT, 1)} ct Strompreis. Darunter bringt Volleinspeisung mit ${DE.eur(voll.nutzenJahr)} mehr, darüber die Teileinspeisung. Bei 6 000 kWh sind es ${DE.eur(reihe[3].t.nutzenJahr)} gegen ${DE.eur(voll.nutzenJahr)}. Mit Speicher sinkt die Schwelle, weil noch mehr Strom im Haus bleibt.` },
      { q: 'Bis wann muss ich dem Netzbetreiber die Volleinspeisung mitteilen?', a: `Im Jahr der Inbetriebnahme vor der Inbetriebnahme, danach jeweils vor dem 1. Dezember des Vorjahres, in Textform, also etwa per E-Mail oder Formular (§ 48 Abs. 2a EEG). Verpassen Sie die Frist, gilt für das ganze Kalenderjahr der niedrigere Satz der Teileinspeisung von ${DE.ct(AKTUELL.teil[0])}. Der Wechsel ist jedes Jahr möglich, immer mit Wirkung zum 1. Januar.` },
      { q: 'Darf ich bei Volleinspeisung gar keinen Strom selbst verbrauchen?', a: `Nein. Der erhöhte Satz gilt nur, wenn der gesamte in einem Kalenderjahr erzeugte Strom eingespeist wird. Ausgenommen ist allein der Strom, den die Anlage selbst und ihre Neben- und Hilfsanlagen technisch verbrauchen. Schon das Laden eines Elektroautos aus der Anlage würde den Anspruch auf den Satz von ${DE.ct(AKTUELL.voll[0])} für dieses Jahr kosten.` },
      { q: 'Kann ich ein Dach voll und ein zweites teilweise einspeisen lassen?', a: `Ja. § 48 Abs. 2a EEG erlaubt, zwei Anlagen auf demselben Grundstück getrennt zu behandeln, auch wenn sie innerhalb von zwölf Monaten in Betrieb gehen. Voraussetzung: Jede hat eine eigene Messeinrichtung, und Sie teilen dem Netzbetreiber vor Inbetriebnahme der zweiten mit, welche den erhöhten Satz bekommt. Die Wahl lässt sich vor dem 1. Dezember zum Folgejahr ändern.` },
      { q: 'Spricht ein günstiger Stromtarif für Volleinspeisung?', a: `Ja, weil dann jede selbst genutzte Kilowattstunde weniger spart. Bei angenommenen ${DE.num(BILLIG)} ct statt ${DE.num(STROMPREIS_CT, 1)} ct bringt die 10-kWp-Anlage mit 4 000 kWh Verbrauch als Teileinspeisung ${DE.eur(tB.nutzenJahr)}, als Volleinspeisung weiter ${DE.eur(vB.nutzenJahr)}. Die Vergütung hängt nicht vom Tarif ab, die Ersparnis schon. Prüfen Sie deshalb Ihren tatsächlichen Arbeitspreis, bevor Sie sich festlegen.` },
      { q: 'Wie hoch ist der Volleinspeise-Satz für eine 15-kWp-Anlage?', a: `Er wird wie bei der Teileinspeisung nach Leistung gestaffelt: die ersten 10 kW zu ${DE.ct(AKTUELL.voll[0])}, der Teil darüber zu ${DE.ct(AKTUELL.voll[1])}. Für 15 kWp ergibt das einen Mischsatz von ${DE.ct(sv15)}, gegenüber ${DE.ct(st15)} bei Teileinspeisung. Die Sätze gelten für Inbetriebnahmen im Zeitraum ab dem ${VON_DE} laut Bundesnetzagentur.` },
    ],
    body: (h) => `
<h2>Zwei Arten, dieselbe Anlage abzurechnen</h2>
<p>Technisch ist es dieselbe Anlage, abrechnungstechnisch sind es zwei Welten. Bei der Teileinspeisung läuft der Solarstrom zuerst in die Steckdosen des Hauses; nur was gerade niemand braucht, fließt über den Zweirichtungszähler ins Netz und wird vergütet. Bei der Volleinspeisung wird der gesamte Strom eingespeist, und das Haus bezieht seinen Strom weiter vollständig aus dem Netz. Dafür erhöht ${h.src('eeg_48', '§ 48 Abs. 2a EEG')} den anzulegenden Wert. Für Anlagen, die ab dem ${h.date(AKTUELL.von)} in Betrieb gehen, weist die ${h.src('bnetza_saetze', 'Bundesnetzagentur')} folgende Sätze aus:</p>
${h.table(['Leistungsanteil', 'Teileinspeisung', 'Volleinspeisung', 'Unterschied'], [
  ['bis 10 kW', h.ct(AKTUELL.teil[0]), h.ct(AKTUELL.voll[0]), h.ct(AKTUELL.voll[0] - AKTUELL.teil[0])],
  ['über 10 bis 40 kW', h.ct(AKTUELL.teil[1]), h.ct(AKTUELL.voll[1]), h.ct(AKTUELL.voll[1] - AKTUELL.teil[1])],
  ['über 40 bis 100 kW', h.ct(AKTUELL.teil[2]), h.ct(AKTUELL.voll[2]), h.ct(AKTUELL.voll[2] - AKTUELL.teil[2])],
], `Sätze für Inbetriebnahmen von ${h.date(AKTUELL.von)} bis ${h.date(AKTUELL.bis)}, anteilig nach Leistung, fest für ${h.num(P.eeg.dauer_jahre)} Jahre.`, ['l', 'r', 'r', 'r'])}

<h2>Die Verbrauchsschwelle</h2>
<p>Der höhere Satz klingt verlockend, aber er ersetzt eine Ersparnis, die viel mehr wert ist. Jede Kilowattstunde, die das Haus selbst nutzt, spart ${h.num(STROMPREIS_CT, 1)} ct; als Volleinspeisung bringt sie nur ${h.ct(AKTUELL.voll[0])}. Umgekehrt bekommt jede ohnehin eingespeiste Kilowattstunde bei Volleinspeisung ${h.ct(zuschlag)} mehr. Welche Seite überwiegt, entscheidet das Verhältnis von Eigenverbrauch zu Einspeisung, und damit der Verbrauch.</p>
${h.table(['Verbrauch im Jahr', 'selbst genutzt', 'Teileinspeisung', 'Volleinspeisung'], reihe.map((r) => [`${h.num(r.vb)} kWh`, `${h.num(r.t.selbst)} kWh`, h.eur(r.t.nutzenJahr), h.eur(voll.nutzenJahr)]), '10 kWp im Bundesmittel, Süd 30°, ohne Speicher, ohne Smart Meter, Nutzen im ersten Jahr.', ['l', 'r', 'r', 'r'])}
<p>Bei 10 kWp und ${h.src('pvgis', 'PVGIS')}-Ertrag im Bundesmittel liegt die Schwelle bei rund ${h.num(schwelle)} kWh. Das liegt nahe an den 4 000 kWh, mit denen die Beispiele dieser Website rechnen; für viele Häuser fällt die Entscheidung deshalb knapp aus. Kleinere Anlagen verschieben sie zugunsten der Teileinspeisung: Mit 5 kWp und 4 000 kWh bringt Teil ${h.eur(k5t.nutzenJahr)}, Voll nur ${h.eur(k5v.nutzenJahr)}, weil ein größerer Anteil des Stroms im Haus bleibt. Ein Speicher wirkt in dieselbe Richtung.</p>

<h2>Die 60-Prozent-Grenze trifft Volleinspeiser härter</h2>
<p>Für Neuanlagen ohne Smart Meter darf die Einspeisung ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} der Nennleistung nicht übersteigen (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}). Bei Teileinspeisung schluckt der Haushalt einen Teil der Mittagsspitze, bei Volleinspeisung muss alles über die Grenze. Die 10-kWp-Anlage verliert deshalb als Volleinspeiser ${h.num(voll.abgeregelt)} kWh im Jahr, als Teileinspeiser mit 4 000 kWh Verbrauch ${h.num(teil.abgeregelt)} kWh. Ein Smart Meter hebt die Grenze auf, bringt aber den Verlust der Vergütung in Viertelstunden mit negativem Preis (${h.src('eeg_51', '§ 51 EEG')}). Gerade für Volleinspeiser ist das teuer, weil jede eingespeiste Kilowattstunde betroffen sein kann: Mit Smart Meter sinkt der Jahresnutzen im Modell auf ${h.eur(vollSm.nutzenJahr)}. Die Hintergründe stehen unter ${h.a('negative-strompreise', 'negative Strompreise')}.</p>

<h2>Die Mitteilung an den Netzbetreiber</h2>
<p>Der erhöhte Satz kommt nicht automatisch. Nach § 48 Abs. 2a EEG muss der Anlagenbetreiber dem Netzbetreiber in Textform mitteilen, dass er voll einspeist, und zwar im Jahr der Inbetriebnahme vor der Inbetriebnahme, in jedem weiteren Jahr vor dem 1. Dezember des vorangegangenen Kalenderjahres. Textform heißt: eine lesbare Erklärung, etwa per E-Mail oder im Portal des Netzbetreibers, eine Unterschrift ist nicht nötig. Wer die Frist verpasst, erhält für das betreffende Jahr den Satz der Teileinspeisung.</p>
<p>Die Regel hat eine praktische Folge: Sie können jedes Jahr neu entscheiden. Ziehen etwa eine Wärmepumpe oder ein Elektroauto ein, wechseln Sie mit einer Mitteilung vor dem 1. Dezember zum folgenden 1. Januar in die Teileinspeisung. Der Vergütungszeitraum von ${h.num(P.eeg.dauer_jahre)} Jahren und die Sätze des Inbetriebnahme-Zeitraums bleiben dabei erhalten.</p>
<h3>Zwei Anlagen, zwei Modelle</h3>
<p>Mehrere Solaranlagen auf demselben Grundstück, die innerhalb von zwölf Monaten in Betrieb gehen, gelten zur Bestimmung der Leistung grundsätzlich als eine. Für die Volleinspeisung macht § 48 Abs. 2a eine Ausnahme: Der Betreiber kann bestimmen, dass es zwei Anlagen sind, wenn jede über eine eigene Messeinrichtung abgerechnet wird und er vor Inbetriebnahme der zweiten mitteilt, welche den erhöhten Satz erhält. So lässt sich etwa das Wohnhaus als Teileinspeisung und die Scheune als Volleinspeisung betreiben. Auch diese Zuordnung kann mit Mitteilung vor dem 1. Dezember zum Folgejahr geändert werden.</p>

<h2>Wann Volleinspeisung die richtige Wahl ist</h2>
<p>Volleinspeisung passt zu Dächern ohne nennenswerten Verbrauch dahinter: Nebengebäude, Ferienhäuser, Hallen, ein leer stehendes Haus. Sie passt auch, wenn der eigene Strom sehr günstig ist, etwa über einen Sondertarif, weil dann die Ersparnis durch Eigenverbrauch kleiner wird. In einem bewohnten Einfamilienhaus mit üblichem Verbrauch liegen beide Modelle nahe beieinander, und jede Veränderung im Haushalt spricht später eher für Teileinspeisung. Ihren genauen Fall mit Postleitzahl, Speicher und Smart Meter rechnet der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')}; alle Sätze und Zeiträume stehen unter ${h.a('einspeiseverguetung', 'Einspeisevergütung')}.</p>`,
  },
  en: {
    slug: 'full-or-surplus-feed-in',
    nav: 'Full or surplus feed-in',
    card: 'A higher rate for all your power, or self-use plus surplus: the consumption threshold and the notice under section 48(2a) EEG.',
    title: 'Full or Surplus Feed-in Germany 2026: Threshold, Deadline',
    description: `Full or surplus feed-in in Germany 2026: ${EN.ct(AKTUELL.voll[0])} against ${EN.ct(AKTUELL.teil[0])}; surplus wins from about ${EN.num(schwelle)} kWh of use. Notice deadline under section 48(2a) EEG.`,
    h1: 'Full or surplus feed-in: where the line falls in 2026',
    intro: `Full feed-in pays ${EN.ct(AKTUELL.voll[0])} instead of ${EN.ct(AKTUELL.teil[0])}, but for every kilowatt-hour, including those you would otherwise use yourself. For 10 kWp at the German average, the choice tips at about ${EN.num(schwelle)} kWh of annual consumption.`,
    resume: `With surplus feed-in (Teileinspeisung), the household uses solar power first and only exports the rest, which for systems commissioned from ${VON_EN} earns ${EN.ct(AKTUELL.teil[0])} up to 10 kWp. With full feed-in (Volleinspeisung), all the power produced in a calendar year goes to the grid, and section 48(2a) of the Renewable Energy Sources Act (EEG) raises the reference value; the Federal Network Agency lists ${EN.ct(AKTUELL.voll[0])} for this period, ${EN.ct(zuschlag)} more. Which option earns more depends on consumption. A 10 kWp system facing south produces ${EN.num(voll.ertrag)} kWh at the German average. As full feed-in it earns ${EN.eur(voll.nutzenJahr)} a year, with ${EN.num(voll.abgeregelt)} kWh lost to the 60 per cent cap without a smart meter. As surplus feed-in it earns ${EN.eur(teil.nutzenJahr)} with 4,000 kWh of consumption and ${EN.eur(reihe[3].t.nutzenJahr)} with 6,000 kWh. The threshold lies at about ${EN.num(schwelle)} kWh. If you want full feed-in, you must tell the grid operator in text form before commissioning, and thereafter before 1 December for the following year.`,
    faqs: [
      { q: 'From what consumption does surplus feed-in pay off at 10 kWp?', a: `At the German average, from about ${EN.num(schwelle)} kWh a year, for a south-facing system at 30° with no battery or smart meter and an electricity price of ${EN.num(STROMPREIS_CT, 1)} ct. Below that, full feed-in earns more at ${EN.eur(voll.nutzenJahr)}; above it, surplus feed-in wins. At 6,000 kWh it is ${EN.eur(reihe[3].t.nutzenJahr)} against ${EN.eur(voll.nutzenJahr)}. A battery lowers the threshold because even more power stays at home.` },
      { q: 'When do I have to notify the grid operator of full feed-in?', a: `In the commissioning year, before commissioning; after that, before 1 December of the previous year each time, in text form such as an email or online form (section 48(2a) EEG). If you miss the deadline, the lower surplus rate of ${EN.ct(AKTUELL.teil[0])} applies for the whole calendar year. You can switch every year, always with effect from 1 January.` },
      { q: 'Can I use any of my own solar power with full feed-in?', a: `No. The higher rate only applies if all the power generated in a calendar year is exported. The only exception is power the system itself and its auxiliary equipment consume for technical reasons. Even charging an electric car from the system would cost the ${EN.ct(AKTUELL.voll[0])} rate for that year.` },
      { q: 'Can one roof use full feed-in and another surplus feed-in?', a: `Yes. Section 48(2a) EEG lets you treat two systems on the same property separately, even if they are commissioned within twelve months of each other. The conditions: each has its own meter, and before the second one goes live you tell the grid operator which one gets the higher rate. You can change that choice before 1 December for the following year.` },
      { q: 'Does a cheap electricity tariff favour full feed-in?', a: `Yes, because each self-used kilowatt-hour then saves less. At an assumed ${EN.num(BILLIG)} ct instead of ${EN.num(STROMPREIS_CT, 1)} ct, the 10 kWp system with 4,000 kWh of consumption earns ${EN.eur(tB.nutzenJahr)} as surplus feed-in and still ${EN.eur(vB.nutzenJahr)} as full feed-in. The tariff does not affect the feed-in payment, only the saving. So check the unit price you actually pay before deciding.` },
      { q: 'What is the full feed-in rate for a 15 kWp system?', a: `It is tiered by capacity as with surplus feed-in: the first 10 kW at ${EN.ct(AKTUELL.voll[0])}, the part above at ${EN.ct(AKTUELL.voll[1])}. For 15 kWp that gives a blended rate of ${EN.ct(sv15)}, against ${EN.ct(st15)} for surplus feed-in. These rates apply to systems commissioned in the period starting ${VON_EN}, according to the Federal Network Agency.` },
    ],
    body: (h) => `
<h2>Two ways to bill the same system</h2>
<p>Technically it is the same system; in billing terms they are two different worlds. With surplus feed-in, solar power flows into the house's sockets first, and only what nobody needs at that moment goes through the bidirectional meter to the grid and gets paid. With full feed-in, all the power is exported and the house keeps buying all its electricity from the grid. In return, ${h.src('eeg_48', 'section 48(2a) EEG')} raises the reference value. For systems commissioned from ${h.date(AKTUELL.von)}, the ${h.src('bnetza_saetze', 'Federal Network Agency')} lists these rates:</p>
${h.table(['Capacity band', 'Surplus feed-in', 'Full feed-in', 'Difference'], [
  ['up to 10 kW', h.ct(AKTUELL.teil[0]), h.ct(AKTUELL.voll[0]), h.ct(AKTUELL.voll[0] - AKTUELL.teil[0])],
  ['over 10 to 40 kW', h.ct(AKTUELL.teil[1]), h.ct(AKTUELL.voll[1]), h.ct(AKTUELL.voll[1] - AKTUELL.teil[1])],
  ['over 40 to 100 kW', h.ct(AKTUELL.teil[2]), h.ct(AKTUELL.voll[2]), h.ct(AKTUELL.voll[2] - AKTUELL.teil[2])],
], `Rates for systems commissioned from ${h.date(AKTUELL.von)} to ${h.date(AKTUELL.bis)}, weighted by capacity, fixed for ${h.num(P.eeg.dauer_jahre)} years.`, ['l', 'r', 'r', 'r'])}

<h2>The consumption threshold</h2>
<p>The higher rate sounds tempting, but it replaces a saving worth much more. Every kilowatt-hour the house uses itself saves ${h.num(STROMPREIS_CT, 1)} ct; as full feed-in it earns only ${h.ct(AKTUELL.voll[0])}. Conversely, every kilowatt-hour that would be exported anyway earns ${h.ct(zuschlag)} more with full feed-in. Which side wins depends on the ratio of self-use to exports, and therefore on consumption.</p>
${h.table(['Annual consumption', 'Used at home', 'Surplus feed-in', 'Full feed-in'], reihe.map((r) => [`${h.num(r.vb)} kWh`, `${h.num(r.t.selbst)} kWh`, h.eur(r.t.nutzenJahr), h.eur(voll.nutzenJahr)]), '10 kWp at the German average, south 30°, no battery, no smart meter, benefit in year one.', ['l', 'r', 'r', 'r'])}
<p>With 10 kWp and the national ${h.src('pvgis', 'PVGIS')} yield, the threshold is about ${h.num(schwelle)} kWh, close to the 4,000 kWh used in this site's examples, so for many homes the decision is a close one. Smaller systems shift it towards surplus feed-in: with 5 kWp and 4,000 kWh, surplus earns ${h.eur(k5t.nutzenJahr)} and full only ${h.eur(k5v.nutzenJahr)}, because a larger share stays in the house. A battery works the same way.</p>

<h2>The 60 per cent cap hits full feed-in harder</h2>
<p>For new systems without a smart meter, feed-in may not exceed ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of rated output (${h.src('eeg_9', 'section 9(2) EEG')}). With surplus feed-in, the household absorbs part of the midday peak; with full feed-in, everything has to pass the cap. The 10 kWp system therefore loses ${h.num(voll.abgeregelt)} kWh a year under full feed-in, against ${h.num(teil.abgeregelt)} kWh under surplus feed-in with 4,000 kWh of consumption. A smart meter removes the cap but brings the loss of payment in quarter-hours with negative prices (${h.src('eeg_51', 'section 51 EEG')}). That is costly for full feed-in, where every exported kilowatt-hour can be affected: with a smart meter, the annual benefit in the model drops to ${h.eur(vollSm.nutzenJahr)}. Background is under ${h.a('negative-strompreise', 'negative power prices')}.</p>

<h2>Notifying the grid operator</h2>
<p>The higher rate is not automatic. Under section 48(2a) EEG, the operator must tell the grid operator (Netzbetreiber) in text form that the system feeds in fully: in the commissioning year before commissioning, and in every later year before 1 December of the preceding calendar year. Text form means a legible declaration, for example by email or through the grid operator's portal; no signature is needed. If you miss the deadline, the surplus rate applies for that year.</p>
<p>The rule has a practical upside: you can decide afresh each year. If a heat pump or electric car arrives, a notice before 1 December moves you to surplus feed-in from the following 1 January. The ${h.num(P.eeg.dauer_jahre)}-year payment period and the rates of your commissioning period stay unchanged.</p>
<h3>Two systems, two models</h3>
<p>Several solar systems on the same property commissioned within twelve months normally count as one for determining capacity. For full feed-in, section 48(2a) makes an exception: the operator can treat them as two systems if each is billed through its own meter and, before the second goes live, the grid operator is told which one gets the higher rate. That way the house can run on surplus feed-in and the barn on full feed-in. This allocation, too, can be changed with a notice before 1 December for the following year.</p>

<h2>When full feed-in is the right choice</h2>
<p>Full feed-in suits roofs with little consumption behind them: outbuildings, holiday homes, workshops, an empty house. It also suits households whose own power is very cheap, for example on a special tariff, because the saving from self-use shrinks. In an occupied family home with typical consumption the two models are close, and any later change in the household tends to favour surplus feed-in. Your exact case with postcode, battery and smart meter is worked out by the ${h.a('photovoltaik-rechner', 'solar PV calculator')}; all rates and periods are under ${h.a('einspeiseverguetung', 'feed-in tariff')}.</p>`,
  },
});

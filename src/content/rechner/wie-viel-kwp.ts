import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Beispiele aus dem Motor: Hannover (30159), Süd 30°, Teileinspeisung ohne Smart Meter.
 * Kosten = 2 000 € fest + 1 500 € je kWp (Annahmen, Startwerte des Rechners). Größen 3 bis 15 kWp.
 */
const han = ortVonPlz('30159')!;
const FIX = 2000, JE_KWP = 1500;
const GR = [3, 4, 5, 6, 8, 10, 12, 15];
const liste = (vb: number, sp = 0) => GR.map((k) => ({ k, r: rechnePv({ ort: han, kwp: k, neigung: 30, azimut: 0, verbrauchKwh: vb, speicherKwh: sp, modus: 'teil', smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: FIX + k * JE_KWP }) }));
const bestOf = (l: ReturnType<typeof liste>) => l.reduce((a, b) => (b.r.gewinn > a.r.gewinn ? b : a));
const deckt = (l: ReturnType<typeof liste>, vb: number) => l.find((x) => x.r.ertrag >= vb) ?? l[l.length - 1];
const VB = 4000, VB_WP = 7000;
const l4 = liste(VB), b4 = bestOf(l4), d4 = deckt(l4, VB);
const l7 = liste(VB_WP), b7 = bestOf(l7);
const lSp = liste(VB, 6), bSp = bestOf(lSp);
const x = (l: ReturnType<typeof liste>, k: number) => l.find((e) => e.k === k)!.r;
const r4 = x(l4, 4), r10 = x(l4, 10), r15 = x(l4, 15);

export default defineGuide({
  id: 'wie-viel-kwp',
  group: 'pv',
  order: 14,
  tool: 'groesse',
  related: ['photovoltaik-rechner', 'photovoltaik-kosten', 'stromspeicher-groesse', 'photovoltaik-lohnt-sich', 'pv-ertrag-plz', 'photovoltaik-steuer'],
  sources: ['pvgis', 'htw_lastprofile', 'eeg_9', 'estg_3', 'bnetza_saetze'],
  de: {
    slug: 'wie-viel-kwp',
    nav: 'Wie viel kWp?',
    card: 'Größen von 3 bis 20 kWp nebeneinander: Ertrag, Eigenverbrauch, Autarkie und Amortisation für Ihren Verbrauch.',
    title: 'kWp-Bedarf 2026: wie viel Photovoltaik zum Verbrauch passt',
    description: `Wie viel kWp brauche ich 2026? Der Größenrechner vergleicht 3 bis 20 kWp nach PLZ und Verbrauch: Eigenverbrauch, Autarkie, Amortisation, Gewinn nach 20 Jahren.`,
    h1: 'Wie viel kWp brauche ich 2026? Alle Größen im Vergleich',
    intro: `Für ${DE.num(VB)} kWh Verbrauch in Hannover deckt eine ${DE.num(d4.k)}-kWp-Anlage den Jahresbedarf rechnerisch, den höchsten Überschuss nach ${P.eeg.dauer_jahre} Jahren bringen unter den Größen bis 15 kWp aber ${DE.num(b4.k)} kWp.`,
    resume: `Die Frage, wie viel kWp ein Haus braucht, hat zwei Antworten, und der Größenrechner zeigt beide. Die erste ist die Deckung: Ab welcher Leistung erzeugt das Dach so viel, wie der Haushalt im Jahr verbraucht? In Hannover mit ${DE.num(VB)} kWh sind das ${DE.num(d4.k)} kWp, die ${DE.num(d4.r.ertrag)} kWh liefern. Die zweite ist die Wirtschaftlichkeit: Weil Gerüst, Zählerplatz und Anmeldung fast gleich viel kosten, ob vier oder zwölf Module montiert werden, sinkt der Preis je kWp mit der Größe. Jede zusätzliche Kilowattstunde wird zwar meist eingespeist, bringt aber noch die Vergütung. Bei ${DE.eur(FIX)} Fixkosten und ${DE.eur(JE_KWP)} je kWp erzielt in diesem Beispiel eine ${DE.num(b4.k)}-kWp-Anlage den größten Überschuss nach ${P.eeg.dauer_jahre} Jahren, nämlich ${DE.eur(b4.r.gewinn)}, obwohl der Haushalt nur ${DE.pct(b4.r.eigenAnteil)} ihres Stroms selbst nutzt. Die kleinste Anlage hat die kürzeste Amortisation, die mittlere den höchsten Gewinn.`,
    faqs: [
      { q: 'Wie viel kWp brauche ich für 4 000 kWh Verbrauch?', a: `Rechnerisch ${DE.num(d4.k)} kWp: In Hannover erzeugen sie bei Süddach mit 30° ${DE.num(d4.r.ertrag)} kWh im Jahr. Wirtschaftlich lohnt sich mehr, wenn das Dach Platz hat: Mit ${DE.eur(FIX)} Fixkosten und ${DE.eur(JE_KWP)} je kWp bringt ${DE.num(b4.k)} kWp nach ${P.eeg.dauer_jahre} Jahren ${DE.eur(b4.r.gewinn)} Überschuss, ${DE.num(4)} kWp nur ${DE.eur(r4.gewinn)}. Die Kosten sind Annahmen; tragen Sie Ihr Angebot ein.` },
      { q: 'Wie groß sollte die Anlage mit Wärmepumpe und 7 000 kWh sein?', a: `Im Beispiel Hannover bringt bei ${DE.num(VB_WP)} kWh Verbrauch eine ${DE.num(b7.k)}-kWp-Anlage den höchsten Überschuss, ${DE.eur(b7.r.gewinn)} nach ${P.eeg.dauer_jahre} Jahren, bei ${DE.pct(b7.r.eigenAnteil)} Eigenverbrauch. Die Wärmepumpe braucht ihren Strom aber vor allem im Winter, und die Lastprofile der Simulation stammen aus Haushalten ohne Wärmepumpe. Rechnen Sie das Ergebnis deshalb eher als Obergrenze für den Eigenverbrauch.` },
      { q: 'Verändert ein 6-kWh-Speicher die richtige Anlagengröße?', a: `${bSp.k === b4.k ? "Nein." : "Ja, sie rückt nach oben."} Mit ${DE.num(6)} kWh Speicher und ${DE.num(VB)} kWh Verbrauch liegt der höchste Überschuss in Hannover bei ${DE.num(bSp.k)} kWp, ohne Speicher bei ${DE.num(b4.k)} kWp. Die Batterie nimmt einen Teil des Mittagsüberschusses größerer Anlagen auf und hebt so deren Eigenverbrauch; ihr eigener Preis ist in diesem Vergleich nicht enthalten. Ob sich die Batterie selbst rechnet, zeigt der Stromspeicher-Rechner getrennt.` },
      { q: 'Warum sinkt die Amortisation nicht, wenn die Anlage größer wird?', a: `Weil der Eigenverbrauch nicht mitwächst. In Hannover nutzt ein Haushalt mit ${DE.num(VB)} kWh von ${DE.num(4)} kWp ${DE.pct(r4.eigenAnteil)} selbst, von ${DE.num(15)} kWp nur ${DE.pct(r15.eigenAnteil)}. Der Rest bringt die Vergütung, die unter dem Strompreis liegt. Die Amortisation steigt daher von ${DE.num(r4.amortisationJahre ?? 0, 1)} auf ${DE.num(r15.amortisationJahre ?? 0, 1)} Jahre, der Gewinn über die Laufzeit kann trotzdem größer sein.` },
    ],
    body: (h) => `
<h2>Was der Größenrechner nebeneinanderstellt</h2>
<p>Der Rechner lässt jede Größe von 3 bis 20 kWp durch dieselbe Jahressimulation laufen: Süddach mit 30° Neigung, Ertrag aus ${h.src('pvgis', 'PVGIS')} für Ihre Postleitzahl, Verbrauch aus den Viertelstundenprofilen der ${h.src('htw_lastprofile', 'HTW Berlin')}, Teileinspeisung zum Satz des aktuellen Zeitraums laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')}. Ohne Smart Meter gilt für neue Anlagen die Begrenzung auf ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} der Nennleistung (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}), die große Anlagen mittags stärker trifft. Die Kosten setzen sich aus einem festen Betrag und einem Preis je kWp zusammen; beide tragen Sie selbst ein.</p>

<h2>Das Beispiel Hannover</h2>
${h.table(['Größe', 'Ertrag', 'Eigenverbrauch', 'Autarkie', 'Amortisation', 'Überschuss'], l4.map(({ k, r }) => [`${h.num(k)} kWp`, `${h.num(r.ertrag)} kWh`, h.pct(r.eigenAnteil, 0), h.pct(r.autarkie, 0), `${h.num(r.amortisationJahre ?? 0, 1)} J.`, h.eur(r.gewinn)]), `PLZ ${han.plz}, Verbrauch ${h.num(VB)} kWh, Kosten ${h.eur(FIX)} plus ${h.eur(JE_KWP)} je kWp, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh, Überschuss nach ${P.eeg.dauer_jahre} Jahren.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Die Autarkie wächst langsam: Von ${h.num(4)} auf ${h.num(10)} kWp steigt sie nur von ${h.pct(r4.autarkie, 0)} auf ${h.pct(r10.autarkie, 0)}, weil der Haushalt nachts und im Winter ohnehin Netzstrom braucht. Der Überschuss dagegen steigt bis ${h.num(b4.k)} kWp, danach überwiegt bei diesen Kosten der Abschlag beim Satz über 10 kWp und die 60-Prozent-Grenze.</p>

<h2>Wann eine kleinere Anlage richtig ist</h2>
<p>Wer wenig Kapital binden möchte oder ein verwinkeltes Dach hat, für das jedes weitere Modul teuer wird, fährt mit der Größe der kürzesten Amortisation besser. Gleiches gilt, wenn der Preis je kWp im Angebot deutlich über der Annahme liegt: Dann rückt das Optimum nach unten, wie der Rechner sofort zeigt. Was eine Anlage je kWp kostet, ordnet der Ratgeber ${h.a('photovoltaik-kosten', 'Photovoltaik-Kosten')} ein.</p>

<h2>Grenzen, die mit der Größe zählen</h2>
<p>Einnahmen aus Anlagen bis ${h.num(P.steuer.estg_kwp_je_einheit)} kWp je Wohneinheit, höchstens ${h.num(P.steuer.estg_kwp_gesamt)} kWp je Steuerpflichtigem, sind einkommensteuerfrei (${h.src('estg_3', '§ 3 Nr. 72 EStG')}). Über 10 kWp sinkt der Vergütungssatz für den zusätzlichen Leistungsanteil; den Mischsatz rechnet die Seite ${h.a('einspeiseverguetung', 'Einspeisevergütung')}. Den Ertrag Ihres Ortes für andere Neigungen zeigt ${h.a('pv-ertrag-plz', 'PV-Ertrag nach Postleitzahl')}.</p>`,
  },
  en: {
    slug: 'how-many-kwp',
    nav: 'How many kWp?',
    card: 'Sizes from 3 to 20 kWp side by side: output, self-consumption, self-sufficiency and payback for your consumption.',
    title: 'PV System Size 2026: How Many kWp Your Household Needs',
    description: `How many kWp do I need in 2026? The sizing calculator compares 3 to 20 kWp by postcode and use: self-consumption, autarky, payback and net gain over 20 years.`,
    h1: 'How many kWp do I need in 2026? Every size compared',
    intro: `For ${EN.num(VB)} kWh of consumption in Hanover, a ${EN.num(d4.k)} kWp system covers annual demand on paper, but among sizes up to 15 kWp the highest net gain after ${P.eeg.dauer_jahre} years comes from ${EN.num(b4.k)} kWp.`,
    resume: `The question of how many kWp a house needs has two answers, and the sizing calculator shows both. The first is coverage: at what capacity does the roof produce as much as the household uses in a year? In Hanover, with ${EN.num(VB)} kWh, that is ${EN.num(d4.k)} kWp, delivering ${EN.num(d4.r.ertrag)} kWh. The second is economics: because scaffolding, the meter cabinet and registration cost almost the same whether four or twelve panels go up, the price per kWp falls with size. Each extra kilowatt-hour is mostly exported, but it still earns the feed-in tariff (Einspeisevergütung). With ${EN.eur(FIX)} of fixed costs and ${EN.eur(JE_KWP)} per kWp, a ${EN.num(b4.k)} kWp system achieves the largest net gain after ${P.eeg.dauer_jahre} years in this example, ${EN.eur(b4.r.gewinn)}, even though the household uses only ${EN.pct(b4.r.eigenAnteil)} of its power itself. The smallest system has the shortest payback, the mid-sized one the highest profit.`,
    faqs: [
      { q: 'How many kWp do I need for 4,000 kWh of consumption?', a: `On paper ${EN.num(d4.k)} kWp: in Hanover they produce ${EN.num(d4.r.ertrag)} kWh a year on a south roof at 30°. Economically, more pays if the roof has space: with ${EN.eur(FIX)} of fixed costs and ${EN.eur(JE_KWP)} per kWp, ${EN.num(b4.k)} kWp bring a net gain of ${EN.eur(b4.r.gewinn)} after ${P.eeg.dauer_jahre} years, ${EN.num(4)} kWp only ${EN.eur(r4.gewinn)}. The costs are assumptions; enter your quote.` },
      { q: 'How big should the system be with a heat pump and 7,000 kWh?', a: `In the Hanover example, at ${EN.num(VB_WP)} kWh of consumption a ${EN.num(b7.k)} kWp system brings the highest net gain, ${EN.eur(b7.r.gewinn)} after ${P.eeg.dauer_jahre} years, with ${EN.pct(b7.r.eigenAnteil)} self-consumption. A heat pump needs most of its power in winter, though, and the simulation's load profiles come from households without one. Treat the result as an upper bound for self-consumption.` },
      { q: 'Does a 6 kWh battery change the right system size?', a: `${bSp.k === b4.k ? "No." : "Yes, it moves up."} With ${EN.num(6)} kWh of storage and ${EN.num(VB)} kWh of consumption, the highest net gain in Hanover is at ${EN.num(bSp.k)} kWp, against ${EN.num(b4.k)} kWp without storage. The battery absorbs part of the midday surplus of larger systems and so raises their self-consumption; its own price is not included in this comparison. Whether the battery itself pays is worked out separately by the home battery calculator.` },
      { q: 'Why does payback not get shorter as the system gets bigger?', a: `Because self-consumption does not grow with it. In Hanover a household using ${EN.num(VB)} kWh uses ${EN.pct(r4.eigenAnteil)} of a ${EN.num(4)} kWp system's output itself, but only ${EN.pct(r15.eigenAnteil)} of a ${EN.num(15)} kWp system's. The rest earns the feed-in tariff, which is below the electricity price. Payback therefore rises from ${EN.num(r4.amortisationJahre ?? 0, 1)} to ${EN.num(r15.amortisationJahre ?? 0, 1)} years, while the profit over the term can still be larger.` },
    ],
    body: (h) => `
<h2>What the sizing calculator puts side by side</h2>
<p>The calculator runs every size from 3 to 20 kWp through the same annual simulation: south roof at 30°, yield from ${h.src('pvgis', 'PVGIS')} for your postcode, consumption from the quarter-hour profiles of ${h.src('htw_lastprofile', 'HTW Berlin')}, surplus feed-in at the current period's rate from the ${h.src('bnetza_saetze', 'Federal Network Agency')}. Without a smart meter, new systems are capped at ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of rated output (${h.src('eeg_9', 'section 9(2) EEG')}), which hits large systems harder at midday. Costs are a fixed amount plus a price per kWp; you enter both yourself.</p>

<h2>The Hanover example</h2>
${h.table(['Size', 'Output', 'Self-use', 'Self-sufficiency', 'Payback', 'Net gain'], l4.map(({ k, r }) => [`${h.num(k)} kWp`, `${h.num(r.ertrag)} kWh`, h.pct(r.eigenAnteil, 0), h.pct(r.autarkie, 0), `${h.num(r.amortisationJahre ?? 0, 1)} yrs`, h.eur(r.gewinn)]), `Postcode ${han.plz}, consumption ${h.num(VB)} kWh, cost ${h.eur(FIX)} plus ${h.eur(JE_KWP)} per kWp, price ${h.num(STROMPREIS_CT, 1)} ct/kWh, net gain after ${P.eeg.dauer_jahre} years.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Self-sufficiency grows slowly: from ${h.num(4)} to ${h.num(10)} kWp it only rises from ${h.pct(r4.autarkie, 0)} to ${h.pct(r10.autarkie, 0)}, because the household needs grid power at night and in winter anyway. The net gain, by contrast, rises up to ${h.num(b4.k)} kWp; beyond that, at these costs, the lower rate above 10 kWp and the 60 per cent cap outweigh it.</p>

<h2>When a smaller system is the right choice</h2>
<p>If you want to tie up less capital, or have a complicated roof where each extra panel gets expensive, the size with the shortest payback is the better pick. The same applies if your quote per kWp is well above the assumption: the optimum then moves down, as the calculator shows at once. What a system costs per kWp is covered in the guide to ${h.a('photovoltaik-kosten', 'solar PV cost')}.</p>

<h2>Limits that matter with size</h2>
<p>Income from systems up to ${h.num(P.steuer.estg_kwp_je_einheit)} kWp per dwelling, at most ${h.num(P.steuer.estg_kwp_gesamt)} kWp per taxpayer, is exempt from income tax (${h.src('estg_3', 'section 3 no. 72 Income Tax Act')}). Above 10 kWp the tariff falls for the additional share of capacity; the blended rate is worked out on the ${h.a('einspeiseverguetung', 'feed-in tariff')} page. The yield for your location at other tilts is shown under ${h.a('pv-ertrag-plz', 'PV yield by postcode')}.</p>`,
  },
});

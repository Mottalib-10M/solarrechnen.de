import { defineGuide } from '../../lib/guide-types';
import { rechnePv, type PvErgebnis } from '../../lib/engine/pv';
import { AKTUELL } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Zahlungsströme Jahr für Jahr: 10 kWp im Bundesmittel, Süd 30°, 4 000 kWh, Kosten angenommen mit 15 000 €.
 * Strompreisänderung ist eine Hypothese (0, 2 und 4 % im Jahr); die Vergütung bleibt fest.
 */
const J = P.eeg.dauer_jahre;
const KOSTEN = 15000;
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: KOSTEN };
const G = [0, 0.02, 0.04];
const fall = G.map((g) => ({ g, r: rechnePv({ ...base, preisSteigerung: g }) }));
/** Zahlungsfluss in Jahr j (1-basiert). */
const fluss = (r: PvErgebnis, g: number, j: number) => r.verguetungJahr + r.ersparnisJahr * Math.pow(1 + g, j - 1);
const kumuliert = (r: PvErgebnis, g: number, bis: number, kosten = KOSTEN) => { let s = -kosten; for (let j = 1; j <= bis; j++) s += fluss(r, g, j); return s; };
const plusJahr = (r: PvErgebnis, g: number, kosten = KOSTEN) => { let s = -kosten; for (let j = 1; j <= 40; j++) { s += fluss(r, g, j); if (s >= 0) return j; } return 0; };
/** Interner Zinsfuß über J Jahre (Bisektion). */
const irr = (r: PvErgebnis, g: number, kosten = KOSTEN) => { let lo = -0.5, hi = 0.5; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; let npv = -kosten; for (let j = 1; j <= J; j++) npv += fluss(r, g, j) / Math.pow(1 + m, j); if (npv > 0) lo = m; else hi = m; } return lo; };
const [f0, f2, f4] = fall;
const z0 = irr(f0.r, 0), z2 = irr(f2.r, 0.02), z4 = irr(f4.r, 0.04);
const j0 = plusJahr(f0.r, 0), j2 = plusJahr(f2.r, 0.02), j4 = plusJahr(f4.r, 0.04);
const STUETZ = [1, 5, 10, 12, 15, 20];
/** Mit 8 kWh Speicher, angenommen 6 000 € zusätzlich. */
const KSP = KOSTEN + 6000;
const sp0 = rechnePv({ ...base, speicherKwh: 8, kostenEur: KSP });
const sp2 = rechnePv({ ...base, speicherKwh: 8, kostenEur: KSP, preisSteigerung: 0.02 });
const jsp0 = plusJahr(sp0, 0, KSP), jsp2 = plusJahr(sp2, 0.02, KSP);
/** Strompreis fällt: Hypothese −1 % im Jahr. */
const fm = rechnePv({ ...base, preisSteigerung: -0.01 });
const jm = plusJahr(fm, -0.01);
/** Ersparnisanteil am Nutzen im ersten Jahr. */
const anteilErsparnis = f0.r.ersparnisJahr / f0.r.nutzenJahr;
/** Wechselrichtertausch als Annahme in Jahr 12. */
const WR = 2000;
const gewinnWr = f2.r.gewinn - WR;

export default defineGuide({
  id: 'amortisation-photovoltaik',
  group: 'pv',
  order: 48,
  mini: 'cashflow',
  related: ['photovoltaik-lohnt-sich', 'photovoltaik-kosten', 'photovoltaik-rechner', 'stromspeicher-rechner', 'einspeiseverguetung'],
  sources: ['eurostat_strom', 'bnetza_saetze', 'pvgis', 'eeg_49'],
  de: {
    slug: 'amortisation-photovoltaik',
    nav: 'Amortisation Photovoltaik',
    card: 'Zahlungsströme Jahr für Jahr, das Jahr, in dem die Anlage im Plus ist, und der Zinsfuß, mit und ohne steigenden Strompreis.',
    title: 'Amortisation Photovoltaik 2026: Jahr für Jahr ins Plus',
    description: `Amortisation einer Photovoltaikanlage 2026: ab Jahr ${j0} im Plus bei festem Strompreis, ab Jahr ${j2} bei +2 % im Jahr. Zahlungsströme, Zinsfuß und Speicher.`,
    h1: 'Amortisation der Photovoltaik 2026: wann die Anlage im Plus ist',
    intro: `Eine 10-kWp-Anlage für angenommene ${DE.eur(KOSTEN)} ist im Bundesmittel im Jahr ${j0} im Plus, wenn der Strompreis gleich bleibt. Steigt er um 2 % im Jahr, schon im Jahr ${j2}.`,
    resume: `Die Amortisation einer Photovoltaikanlage ist das Jahr, in dem die Summe der jährlichen Rückflüsse den Kaufpreis erreicht. Jeder Rückfluss besteht aus zwei Teilen mit verschiedenem Verhalten. Die Einspeisevergütung ist für ${J} Jahre fest: Eine 10-kWp-Anlage im Bundesmittel nach Süden bringt bei 4 000 kWh Verbrauch ${DE.eur(f0.r.verguetungJahr)} im Jahr zum Satz von ${DE.ct(AKTUELL.teil[0])}. Die Ersparnis von ${DE.eur(f0.r.ersparnisJahr)} im ersten Jahr wächst dagegen mit dem Strompreis, heute ${DE.num(STROMPREIS_CT, 1)} ct laut Eurostat. Wie er sich entwickelt, weiß niemand; wir rechnen deshalb drei Hypothesen. Bei angenommenen ${DE.eur(KOSTEN)} Kaufpreis ist die Anlage bei gleichbleibendem Preis im Jahr ${j0} im Plus, bei 2 % Anstieg im Jahr ${j2}, bei 4 % im Jahr ${j4}. Nach ${J} Jahren bleiben ${DE.eur(f0.r.gewinn)}, ${DE.eur(f2.r.gewinn)} oder ${DE.eur(f4.r.gewinn)} übrig. Als Verzinsung des eingesetzten Geldes entspricht das ${DE.pct(z0, 1)}, ${DE.pct(z2, 1)} oder ${DE.pct(z4, 1)} im Jahr. Ein Speicher verändert vor allem die Summe am Ende, kaum das Jahr des Plus.`,
    faqs: [
      { q: 'In welchem Jahr ist eine 10-kWp-Anlage für 15 000 € im Plus?', a: `Im Bundesmittel, nach Süden mit 30° und bei 4 000 kWh Verbrauch, im Jahr ${j0}, wenn der Strompreis bei ${DE.num(STROMPREIS_CT, 1)} ct bleibt. Der Nutzen beträgt ${DE.eur(f0.r.nutzenJahr)} im Jahr, die rechnerische Amortisation ${DE.num(f0.r.amortisationJahre ?? 0, 1)} Jahre. Bei 2 % Strompreisanstieg im Jahr verschiebt sich der Zeitpunkt auf Jahr ${j2}. Der Kaufpreis ist eine Annahme; tragen Sie Ihr Angebot ein.` },
      { q: 'Wie stark hängt die Amortisation vom künftigen Strompreis ab?', a: `Weniger, als man denkt, weil die Vergütung fest ist. Im ersten Jahr macht die Ersparnis ${DE.pct(anteilErsparnis, 0)} des Nutzens aus, nur dieser Teil reagiert auf den Preis. Zwischen 0 % und 4 % Anstieg im Jahr liegen bei der 10-kWp-Anlage ${j0 - j4} Jahre Unterschied bis zum Plus. Fällt der Preis um 1 % im Jahr, ist die Anlage im Jahr ${jm} im Plus, mit kleinerem Überschuss am Ende.` },
      { q: 'Welche Rendite bringt eine Photovoltaikanlage über 20 Jahre?', a: `Als interner Zinsfuß gerechnet, also wie ein Sparbrief mit jährlichen Rückzahlungen, ${DE.pct(z0, 1)} im Jahr bei festem Strompreis und ${DE.pct(z2, 1)} bei 2 % Anstieg, für die 10-kWp-Anlage zu angenommenen ${DE.eur(KOSTEN)}. Die Zahl berücksichtigt, dass ein Euro in Jahr 18 weniger wert ist als heute. Laufende Kosten und ein Wechselrichtertausch senken sie.` },
      { q: 'Wann ist eine PV-Anlage mit 8-kWh-Speicher im Plus?', a: `Bei angenommenen ${DE.eur(KSP)} für Anlage und Speicher im Jahr ${jsp0}, wenn der Strompreis gleich bleibt, und im Jahr ${jsp2} bei 2 % Anstieg. Der Speicher hebt den Nutzen auf ${DE.eur(sp0.nutzenJahr)} im Jahr, ohne Speicher sind es ${DE.eur(f0.r.nutzenJahr)}. Nach ${J} Jahren bleiben mit Speicher ${DE.eur(sp0.gewinn)} übrig, ohne ${DE.eur(f0.r.gewinn)}; ohne Speicher ist dieselbe Anlage im Jahr ${j0} im Plus.` },
      { q: 'Wie verändert ein Wechselrichtertausch die Bilanz nach 20 Jahren?', a: `Er wird einfach vom Überschuss abgezogen. Mit angenommenen ${DE.eur(WR)} für einen neuen Wechselrichter um das Jahr 12 sinkt der Überschuss der 10-kWp-Anlage bei 2 % Strompreisanstieg von ${DE.eur(f2.r.gewinn)} auf ${DE.eur(gewinnWr)}. Ob und wann der Tausch nötig wird, ist offen; die Annahme dient nur als Vorsichtsposten.` },
    ],
    body: (h) => `
<h2>Zwei Geldströme mit unterschiedlichem Takt</h2>
<p>Eine Photovoltaikanlage zahlt sich über zwei Kanäle zurück. Die Einspeisevergütung ist der verlässliche Teil: Der Satz des Inbetriebnahme-Zeitraums, laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')} ${h.ct(AKTUELL.teil[0])} bis 10 kWp, gilt für ${h.num(J)} Jahre und ändert sich nicht. Bei der 10-kWp-Anlage im Bundesmittel sind das ${h.eur(f0.r.verguetungJahr)} im Jahr. Die Ersparnis ist der bewegliche Teil: Sie entspricht dem Netzstrom, den das Haus nicht mehr kaufen muss, und folgt dem Strompreis. Im ersten Jahr sind es ${h.eur(f0.r.ersparnisJahr)} bei ${h.num(STROMPREIS_CT, 1)} ct je kWh laut ${h.src('eurostat_strom', 'Eurostat')}.</p>
<p>Ob der Strompreis steigt oder fällt, lässt sich nicht vorhersagen. Die Eurostat-Reihe für deutsche Haushalte zeigt in den letzten Jahren beides, einen Sprung nach oben und wieder eine Entspannung. Wir setzen deshalb drei Pfade als Hypothesen an: gleichbleibend, plus 2 % und plus 4 % im Jahr. Wählen Sie im Mini-Rechner oben Ihren eigenen Wert.</p>

<h2>Der kumulierte Saldo Jahr für Jahr</h2>
${h.table(['nach Jahr', 'Strompreis konstant', '+2 % im Jahr', '+4 % im Jahr'], STUETZ.map((j) => [String(j), h.eur(kumuliert(f0.r, 0, j)), h.eur(kumuliert(f2.r, 0.02, j)), h.eur(kumuliert(f4.r, 0.04, j))]), `10 kWp, Bundesmittel, Süd 30°, 4 000 kWh Verbrauch, Kaufpreis angenommen mit ${h.eur(KOSTEN)} in Jahr 0, keine laufenden Kosten, keine Zinsen. Negativer Saldo: noch nicht amortisiert.`, ['l', 'r', 'r', 'r'])}
<p>Die Tabelle beginnt mit dem Kaufpreis als Minus und addiert jedes Jahr den Rückfluss. Der Saldo dreht im Jahr ${h.num(j0)} ins Plus, wenn der Preis gleich bleibt, im Jahr ${h.num(j2)} bei 2 % und im Jahr ${h.num(j4)} bei 4 %. Dass der Abstand zwischen den Pfaden klein bleibt, liegt an der Zusammensetzung: Im ersten Jahr sind nur ${h.pct(anteilErsparnis, 0)} des Nutzens Ersparnis, der Rest ist feste Vergütung. Erst gegen Ende der Laufzeit, wenn sich die Preissteigerung aufgezinst hat, gehen die Kurven deutlich auseinander.</p>
<p>Zum Vergleich ein ungünstiger Pfad: Sinkt der Strompreis um 1 % im Jahr, ist die Anlage im Jahr ${h.num(jm)} im Plus, und nach ${h.num(J)} Jahren bleiben ${h.eur(fm.gewinn)}. Auch das ist kein Verlust, aber eine deutlich dünnere Reserve.</p>

<h2>Amortisationszeit und Verzinsung sind zwei Fragen</h2>
<p>Die Amortisationszeit sagt, wann das Geld zurück ist, nicht, wie gut es angelegt war. Dafür eignet sich der interne Zinsfuß: der Zinssatz, zu dem die Rückflüsse auf heute abgezinst genau den Kaufpreis ergeben. Für die 10-kWp-Anlage liegt er bei ${h.pct(z0, 1)} im Jahr mit konstantem Strompreis, bei ${h.pct(z2, 1)} mit 2 % und bei ${h.pct(z4, 1)} mit 4 % Anstieg. Diese Zahlen können Sie direkt mit einem Festgeld oder dem Zins eines Kredits vergleichen. Liegt der Kreditzins über dem Zinsfuß, frisst die Finanzierung den Vorteil auf.</p>

<h2>Was die Rechnung bewusst weglässt</h2>
<h3>Laufende Kosten und Ersatzteile</h3>
<p>Versicherung, Zählergebühr und ein möglicher Wechselrichtertausch fehlen in der Tabelle, weil sie für jedes Haus anders sind. Ein angenommener Tausch für ${h.eur(WR)} um das Jahr 12 senkt den Überschuss bei 2 % Strompreisanstieg von ${h.eur(f2.r.gewinn)} auf ${h.eur(gewinnWr)}. Setzen Sie Ihre eigenen Beträge an.</p>
<h3>Alterung der Module</h3>
<p>Module verlieren über die Jahre etwas Leistung. Der Rechner setzt den Ertrag aus ${h.src('pvgis', 'PVGIS')} für alle Jahre gleich an; wer vorsichtiger rechnen will, kalkuliert mit einem etwas kleineren Ertrag oder einem späteren Plus-Jahr.</p>
<h3>Die Jahre nach der Vergütung</h3>
<p>Nach ${h.num(J)} Jahren endet die feste Vergütung, die Anlage läuft meist weiter. Wie der Überschussstrom dann vergütet wird, regelt das dann geltende Recht; diese Seite rechnet nichts davon ein. Jedes weitere Betriebsjahr mit Eigenverbrauch ist ein Bonus obendrauf.</p>

<h2>Die Tabelle auf Ihr Angebot übertragen</h2>
<p>Ihr Angebot wird selten genau ${h.eur(KOSTEN)} lauten. Die Umrechnung ist einfach: Jeder Euro mehr oder weniger verschiebt den Saldo in jeder Zeile um genau diesen Betrag. Bei einem Nutzen von ${h.eur(f0.r.nutzenJahr)} im Jahr verschieben ${h.eur(1000)} Mehrpreis das Plus-Jahr um rund ${h.num(1000 / f0.r.nutzenJahr, 1)} Jahre nach hinten, ${h.eur(1000)} Rabatt um ebenso viel nach vorne. Ein höherer Verbrauch wirkt umgekehrt: Er erhöht die Ersparnis in jedem Jahr und zieht das Plus nach vorn. Genauer als diese Faustrechnung ist der Mini-Rechner oben, der das Jahr für Ihren Preis und Ihren Strompreispfad direkt ausgibt.</p>

<h2>Speicher und Zeitpunkt</h2>
<p>Ein 8-kWh-Speicher hebt den Jahresnutzen auf ${h.eur(sp0.nutzenJahr)}, weil mehr Solarstrom abends im Haus genutzt wird. Mit angenommenen ${h.eur(KSP)} für Anlage und Speicher ist das Paket im Jahr ${h.num(jsp0)} im Plus, bei 2 % Strompreisanstieg im Jahr ${h.num(jsp2)}. Der Speicher reagiert stärker auf den Strompreis als die Anlage allein, weil er nur Ersparnis erzeugt und keine Vergütung. Wer mit kräftig steigenden Preisen rechnet, sieht ihn deshalb günstiger. Die Einzelrechnung macht der ${h.a('stromspeicher-rechner', 'Stromspeicher-Rechner')}.</p>
<p>Beachten Sie auch den Kalender: Der Vergütungssatz sinkt für neue Anlagen alle sechs Monate um ${h.pct(P.eeg.degression_halbjahr, 0)} (${h.src('eeg_49', '§ 49 EEG')}). Für die Amortisation fällt das kaum ins Gewicht. Den eigenen Fall mit Postleitzahl rechnet der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')}, die Bewertung des Angebotspreises ${h.a('photovoltaik-kosten', 'Photovoltaik-Kosten')}.</p>`,
  },
  en: {
    slug: 'solar-pv-payback',
    nav: 'Solar PV payback',
    card: 'Cash flows year by year, the year your system breaks even, and its rate of return, with and without rising power prices.',
    title: 'Solar PV Payback in Germany 2026: Year-by-Year Cash Flow',
    description: `Solar PV payback in Germany 2026: in profit from year ${j0} at a flat power price, from year ${j2} at +2% a year. Cash flows, rate of return and a battery compared.`,
    h1: 'Solar PV payback in Germany 2026: when your system is in profit',
    intro: `A 10 kWp system at an assumed ${EN.eur(KOSTEN)} is in profit in year ${j0} at the German average if the electricity price stays flat. If it rises by 2% a year, already in year ${j2}.`,
    resume: `The payback of a solar PV system is the year in which the sum of annual returns reaches the purchase price. Each year's return has two parts that behave differently. The feed-in tariff (Einspeisevergütung) is fixed for ${J} years: a south-facing 10 kWp system at the German average, with 4,000 kWh of consumption, earns ${EN.eur(f0.r.verguetungJahr)} a year at ${EN.ct(AKTUELL.teil[0])}. The saving of ${EN.eur(f0.r.ersparnisJahr)} in year one, by contrast, moves with the electricity price, currently ${EN.num(STROMPREIS_CT, 1)} ct according to Eurostat. Nobody knows how that price will develop, so we calculate three hypotheses. At an assumed purchase price of ${EN.eur(KOSTEN)}, the system is in profit in year ${j0} if the price stays flat, in year ${j2} at a 2% annual rise and in year ${j4} at 4%. After ${J} years, ${EN.eur(f0.r.gewinn)}, ${EN.eur(f2.r.gewinn)} or ${EN.eur(f4.r.gewinn)} remain. As a return on the money invested, that equals ${EN.pct(z0, 1)}, ${EN.pct(z2, 1)} or ${EN.pct(z4, 1)} a year. A battery mainly changes the final total, hardly the break-even year.`,
    faqs: [
      { q: 'In which year is a 10 kWp system costing €15,000 in profit?', a: `At the German average, facing south at 30° with 4,000 kWh of consumption, in year ${j0} if the electricity price stays at ${EN.num(STROMPREIS_CT, 1)} ct. The benefit is ${EN.eur(f0.r.nutzenJahr)} a year and the simple payback ${EN.num(f0.r.amortisationJahre ?? 0, 1)} years. With a 2% annual rise in power prices it moves to year ${j2}. The purchase price is an assumption; enter your own quote.` },
      { q: 'How much does solar payback depend on future electricity prices?', a: `Less than you might think, because the feed-in payment is fixed. In year one the saving makes up ${EN.pct(anteilErsparnis, 0)} of the benefit, and only that part responds to price. Between a 0% and a 4% annual rise, the 10 kWp system's break-even year differs by ${j0 - j4} years. If prices fall by 1% a year, it is in profit in year ${jm}, with a smaller surplus at the end.` },
      { q: 'What return does a solar PV system make over 20 years?', a: `As an internal rate of return, in other words like a savings bond with annual repayments, ${EN.pct(z0, 1)} a year at a flat electricity price and ${EN.pct(z2, 1)} with a 2% rise, for the 10 kWp system at an assumed ${EN.eur(KOSTEN)}. The figure accounts for a euro in year 18 being worth less than one today. Running costs and an inverter replacement lower it.` },
      { q: 'When is a solar system with an 8 kWh battery in profit?', a: `At an assumed ${EN.eur(KSP)} for system and battery, in year ${jsp0} if the electricity price stays flat and in year ${jsp2} with a 2% rise. The battery lifts the benefit to ${EN.eur(sp0.nutzenJahr)} a year against ${EN.eur(f0.r.nutzenJahr)} without. After ${J} years, ${EN.eur(sp0.gewinn)} remain with the battery and ${EN.eur(f0.r.gewinn)} without; without it, the same system is in profit in year ${j0}.` },
      { q: 'How does replacing the inverter change the 20-year balance?', a: `It is simply subtracted from the surplus. With an assumed ${EN.eur(WR)} for a new inverter around year 12, the 10 kWp system's surplus at a 2% annual price rise falls from ${EN.eur(f2.r.gewinn)} to ${EN.eur(gewinnWr)}. Whether and when a replacement is needed is open; the assumption only serves as a cautious allowance.` },
    ],
    body: (h) => `
<h2>Two cash flows on different clocks</h2>
<p>A solar PV system pays back through two channels. The feed-in tariff is the dependable part: the rate for your commissioning period, ${h.ct(AKTUELL.teil[0])} up to 10 kWp according to the ${h.src('bnetza_saetze', 'Federal Network Agency')}, applies for ${h.num(J)} years and does not change. For the 10 kWp system at the German average that is ${h.eur(f0.r.verguetungJahr)} a year. The saving is the moving part: it equals the grid power the house no longer has to buy and follows the electricity price. In year one it is ${h.eur(f0.r.ersparnisJahr)} at ${h.num(STROMPREIS_CT, 1)} ct per kWh according to ${h.src('eurostat_strom', 'Eurostat')}.</p>
<p>Whether the electricity price will rise or fall cannot be predicted. The Eurostat series for German households shows both in recent years, a jump upwards and then some easing. We therefore use three paths as hypotheses: flat, plus 2% and plus 4% a year. Choose your own value in the mini calculator above.</p>

<h2>The cumulative balance year by year</h2>
${h.table(['after year', 'flat price', '+2% a year', '+4% a year'], STUETZ.map((j) => [String(j), h.eur(kumuliert(f0.r, 0, j)), h.eur(kumuliert(f2.r, 0.02, j)), h.eur(kumuliert(f4.r, 0.04, j))]), `10 kWp, German average, south 30°, 4,000 kWh consumption, purchase price assumed at ${h.eur(KOSTEN)} in year 0, no running costs, no interest. Negative balance: not yet paid back.`, ['l', 'r', 'r', 'r'])}
<p>The table starts with the purchase price as a minus and adds each year's return. The balance turns positive in year ${h.num(j0)} if the price stays flat, in year ${h.num(j2)} at 2% and in year ${h.num(j4)} at 4%. The paths stay close because of the mix: in year one only ${h.pct(anteilErsparnis, 0)} of the benefit is saving, the rest is fixed payment. Only towards the end of the term, once the price rise has compounded, do the curves move clearly apart.</p>
<p>For comparison, an unfavourable path: if the electricity price falls by 1% a year, the system is in profit in year ${h.num(jm)}, and after ${h.num(J)} years ${h.eur(fm.gewinn)} remain. That is still no loss, but a much thinner cushion.</p>

<h2>Payback time and return are two questions</h2>
<p>Payback time says when the money is back, not how well it was invested. For that, the internal rate of return is the right tool: the interest rate at which the returns, discounted to today, exactly equal the purchase price. For the 10 kWp system it is ${h.pct(z0, 1)} a year with a flat price, ${h.pct(z2, 1)} with a 2% rise and ${h.pct(z4, 1)} with a 4% rise. You can compare these directly with a fixed-term deposit or the rate on a loan. If the loan rate is above the internal rate, financing eats up the advantage.</p>

<h2>What the calculation deliberately leaves out</h2>
<h3>Running costs and spare parts</h3>
<p>Insurance, the meter fee and a possible inverter replacement are missing from the table because they differ for every house. An assumed replacement for ${h.eur(WR)} around year 12 lowers the surplus at a 2% price rise from ${h.eur(f2.r.gewinn)} to ${h.eur(gewinnWr)}. Use your own amounts.</p>
<h3>Panel ageing</h3>
<p>Panels lose a little output over the years. The calculator keeps the ${h.src('pvgis', 'PVGIS')} yield the same for every year; if you want to be more cautious, assume a slightly lower yield or a later break-even year.</p>
<h3>The years after the payment period</h3>
<p>After ${h.num(J)} years the fixed payment ends, while the system usually keeps running. How surplus power is paid for then depends on the law in force at the time; this page counts none of it. Every further year of self-consumption is a bonus on top.</p>

<h2>Applying the table to your quote</h2>
<p>Your quote will rarely be exactly ${h.eur(KOSTEN)}. Converting is simple: each euro more or less shifts the balance in every row by exactly that amount. With a benefit of ${h.eur(f0.r.nutzenJahr)} a year, ${h.eur(1000)} more on the price pushes the break-even year back by about ${h.num(1000 / f0.r.nutzenJahr, 1)} years, and a ${h.eur(1000)} discount brings it forward by the same. The mini calculator above gives the exact year for your price and price path.</p>

<h2>Batteries and timing</h2>
<p>An 8 kWh battery lifts the annual benefit to ${h.eur(sp0.nutzenJahr)}, because more solar power is used in the evening. At an assumed ${h.eur(KSP)} for system and battery, the package is in profit in year ${h.num(jsp0)}, or year ${h.num(jsp2)} with a 2% price rise. The battery reacts more strongly to the electricity price than the system alone, because it only produces savings and no feed-in payment. If you expect sharply rising prices, it looks better. The separate calculation is in the ${h.a('stromspeicher-rechner', 'home battery calculator')}.</p>
<p>Mind the calendar too: the rate for new systems falls by ${h.pct(P.eeg.degression_halbjahr, 0)} every six months (${h.src('eeg_49', 'section 49 EEG')}). For payback that hardly matters. Your own case with postcode is in the ${h.a('photovoltaik-rechner', 'solar PV calculator')}, and how to judge the quoted price is in ${h.a('photovoltaik-kosten', 'solar PV cost')}.</p>`,
  },
});

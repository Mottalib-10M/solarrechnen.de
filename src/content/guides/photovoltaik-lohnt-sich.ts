import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { AKTUELL } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Beispiele aus dem Motor: 10 kWp, Süd 30°, 4 000 kWh Verbrauch, Bundesmittel, Bremen und München.
 * Die Kosten sind Annahmen (1 500 € je kWp), die der Leser durch sein Angebot ersetzt.
 */
const PREIS_KWP = 1500;
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 10 * PREIS_KWP };
const bund = rechnePv(base);
const bremen = rechnePv({ ...base, ort: ortVonPlz('28195') });
const muenchen = rechnePv({ ...base, ort: ortVonPlz('80331') });
const viel = rechnePv({ ...base, verbrauchKwh: 6000 });
const klein = rechnePv({ ...base, kwp: 5, kostenEur: 5 * PREIS_KWP });
const speicher = rechnePv({ ...base, speicherKwh: 8, kostenEur: 10 * PREIS_KWP + 6000 });
const sm = rechnePv({ ...base, smartMeter: true });
/** Höchster Speicherpreis, den der Mehrnutzen in J Jahren deckt. */
const speicherGrenz = (speicher.nutzenJahr - rechnePv(base).nutzenJahr) * P.eeg.dauer_jahre;
/** Preis je kWp, bei dem die Summe aus 20 Jahren Nutzen genau den Kaufpreis deckt. */
const grenzpreis = bund.summe / base.kwp;
const J = P.eeg.dauer_jahre;
/** Laufende Kosten im Jahr: reine Annahme des Lesers (Versicherung, Zählergebühr, Rücklage für den Wechselrichter). */
const LAUFEND = 150;
const gewinnLaufend = bund.gewinn - LAUFEND * J;
/** Nächster Halbjahresschritt der Vergütung (§ 49 EEG: 1 % alle sechs Monate), gerundet wie in der Rechnung. */
const satzNaechst = AKTUELL.teil[0] * (1 - P.eeg.degression_halbjahr);
const verlustDegression = bund.einspeisung * (AKTUELL.teil[0] - satzNaechst) / 100 * J;

export default defineGuide({
  id: 'photovoltaik-lohnt-sich',
  group: 'pv',
  order: 40,
  mini: 'pvLohnt',
  related: ['photovoltaik-rechner', 'amortisation-photovoltaik', 'photovoltaik-kosten', 'stromspeicher-rechner', 'pv-ertrag-plz', 'solarspitzengesetz'],
  sources: ['pvgis', 'bnetza_saetze', 'htw_lastprofile', 'eurostat_strom', 'eeg_9', 'eeg_51'],
  de: {
    slug: 'photovoltaik-lohnt-sich',
    nav: 'Lohnt sich Photovoltaik?',
    card: 'Grenzpreis je kWp, Standort, Verbrauch und Speicher: wann eine Dachanlage 2026 mehr einbringt, als sie kostet.',
    title: 'Photovoltaik lohnt sich 2026? Grenzpreis, Ertrag, Bilanz',
    description: `Photovoltaik lohnt sich 2026, solange das Angebot unter ${DE.eur(grenzpreis)} je kWp bleibt: Bilanz nach ${J} Jahren für Bremen, München, mit Speicher und mehr Verbrauch.`,
    h1: 'Lohnt sich Photovoltaik 2026? Die Bilanz nach zwanzig Jahren',
    intro: `Eine 10-kWp-Anlage im Bundesmittel bringt in ${J} Jahren ${DE.eur(bund.summe)} ein. Unter ${DE.eur(grenzpreis)} je kWp Kaufpreis bleibt also ein Überschuss.`,
    resume: `Ob sich Photovoltaik lohnt, entscheidet eine einzige Gegenüberstellung: der Kaufpreis gegen die Summe aus gesparter Stromrechnung und Einspeisevergütung über die ${J} Jahre, in denen der Vergütungssatz fest ist. Im deutschen Mittel erzeugt eine 10-kWp-Anlage nach Süden mit 30° Neigung laut PVGIS ${DE.num(bund.ertrag)} kWh im Jahr. Ein Haushalt mit 4 000 kWh Verbrauch nutzt davon ${DE.pct(bund.eigenAnteil)} selbst und spart bei ${DE.num(STROMPREIS_CT, 1)} ct/kWh ${DE.eur(bund.ersparnisJahr)}, der Rest bringt zum Satz von ${DE.ct(AKTUELL.teil[0])} weitere ${DE.eur(bund.verguetungJahr)}. Das sind ${DE.eur(bund.nutzenJahr)} im Jahr und ${DE.eur(bund.summe)} in ${J} Jahren, ohne jede Strompreissteigerung. Daraus folgt der Grenzpreis: Kostet die Anlage weniger als ${DE.eur(grenzpreis)} je kWp, bleibt am Ende Geld übrig. Bei angenommenen ${DE.eur(PREIS_KWP)} je kWp sind es ${DE.eur(bund.gewinn)} Überschuss. In München steigt er auf ${DE.eur(muenchen.gewinn)}, in Bremen sinkt er auf ${DE.eur(bremen.gewinn)}; mehr Verbrauch zählt stärker als der Standort.`,
    faqs: [
      { q: 'Bis zu welchem Preis je kWp lohnt sich eine 10-kWp-Anlage?', a: `Im Bundesmittel bis etwa ${DE.eur(grenzpreis)} je kWp. Bei diesem Preis decken ${J} Jahre Nutzen, also ${DE.eur(bund.summe)} bei 4 000 kWh Verbrauch und unverändertem Strompreis von ${DE.num(STROMPREIS_CT, 1)} ct/kWh, genau den Kaufpreis. Jeder Euro darunter ist Überschuss. Steigt der Strompreis, verschiebt sich die Grenze nach oben; fällt er, nach unten.` },
      { q: 'Lohnt sich Photovoltaik in Norddeutschland weniger als in Bayern?', a: `Etwas. Dieselbe 10-kWp-Anlage erzeugt in Bremen ${DE.num(bremen.ertrag)} kWh, in München ${DE.num(muenchen.ertrag)} kWh. Bei angenommenen ${DE.eur(base.kostenEur)} Kaufpreis hat sie sich in Bremen nach ${DE.num(bremen.amortisationJahre ?? 0, 1)} Jahren bezahlt, in München nach ${DE.num(muenchen.amortisationJahre ?? 0, 1)} Jahren. Der Abstand ist kleiner als der zwischen zwei Haushalten mit unterschiedlichem Verbrauch.` },
      { q: 'Lohnt sich Photovoltaik mit Wärmepumpe oder E-Auto eher?', a: `Ja, weil mehr Strom im Haus bleibt. Steigt der Verbrauch von 4 000 auf 6 000 kWh, wächst der Überschuss der 10-kWp-Anlage nach ${J} Jahren von ${DE.eur(bund.gewinn)} auf ${DE.eur(viel.gewinn)}, die Amortisation sinkt auf ${DE.num(viel.amortisationJahre ?? 0, 1)} Jahre. Jede selbst genutzte Kilowattstunde ersetzt Netzstrom zu ${DE.num(STROMPREIS_CT, 1)} ct statt ${DE.ct(AKTUELL.teil[0])} Vergütung zu bringen.` },
      { q: 'Rechnet sich eine kleine 5-kWp-Anlage besser als 10 kWp?', a: `Bei gleichem Preis je kWp amortisiert sie sich schneller: ${DE.num(klein.amortisationJahre ?? 0, 1)} statt ${DE.num(bund.amortisationJahre ?? 0, 1)} Jahre, weil ${DE.pct(klein.eigenAnteil)} des Stroms im Haus bleiben. Der Überschuss nach ${J} Jahren ist mit ${DE.eur(klein.gewinn)} aber kleiner als die ${DE.eur(bund.gewinn)} der größeren Anlage. In der Praxis kosten kleine Anlagen je kWp oft mehr; das kippt den Vorteil.` },
      { q: 'Macht ein Speicher die Photovoltaik rentabler?', a: `Nur, wenn er günstig genug ist. Mit 8 kWh Speicher steigt der Eigenverbrauch der 10-kWp-Anlage auf ${DE.pct(speicher.eigenAnteil)} und der Nutzen auf ${DE.eur(speicher.nutzenJahr)} im Jahr. Kostet der Speicher angenommene ${DE.eur(6000)} zusätzlich, bleibt nach ${J} Jahren ein Überschuss von ${DE.eur(speicher.gewinn)} statt ${DE.eur(bund.gewinn)}. Der Mehrnutzen deckt über ${J} Jahre höchstens ${DE.eur(speicherGrenz)} Speicherpreis; teurer darf er nicht sein.` },
      { q: 'Lohnt sich eine Photovoltaikanlage noch, wenn die Vergütung jedes Halbjahr sinkt?', a: `Ja, der Effekt ist klein. Nach § 49 EEG sinkt der Satz für neue Anlagen alle sechs Monate um ${DE.pct(P.eeg.degression_halbjahr, 0)}, von ${DE.ct(AKTUELL.teil[0])} auf rund ${DE.ct(satzNaechst)}. Für die 10-kWp-Anlage mit ${DE.num(bund.einspeisung)} kWh Einspeisung kostet ein halbes Jahr Warten über ${J} Jahre nur etwa ${DE.eur(verlustDegression)}. Ein günstigeres Angebot wiegt das schnell auf.` },
    ],
    body: (h) => `
<h2>Die eine Rechnung, auf die es ankommt</h2>
<p>Eine Dachanlage verdient auf zwei Wegen Geld. Der größere Hebel ist der Strom, den das Haus selbst verbraucht: Jede solche Kilowattstunde muss nicht mehr zum Haushaltspreis gekauft werden, den ${h.src('eurostat_strom', 'Eurostat')} für das erste Halbjahr mit ${h.num(STROMPREIS_CT, 1)} ct ausweist. Der zweite Weg ist der Überschuss, den der Netzbetreiber zum festen Satz des Inbetriebnahme-Zeitraums vergütet, für Anlagen ab dem ${h.date(AKTUELL.von)} laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')} ${h.ct(AKTUELL.teil[0])} bis 10 kWp. Beides zusammen ergibt den Jahresnutzen. Über ${h.num(J)} Jahre summiert und dem Kaufpreis gegenübergestellt, zeigt er, ob am Ende ein Plus steht.</p>
<p>Diese Seite rechnet konservativ: Der Strompreis bleibt über die ganze Laufzeit gleich, der Ertrag auch, und nach dem Ende der Vergütung wird nichts mehr angesetzt, obwohl Module meist länger laufen. Wer mit steigenden Preisen rechnen will, findet die Jahr-für-Jahr-Sicht unter ${h.a('amortisation-photovoltaik', 'Amortisation der Photovoltaik')}.</p>

<h2>Der Grenzpreis: ab wann es kippt</h2>
<p>Statt zu fragen, wie schnell sich eine bestimmte Anlage bezahlt macht, lässt sich umgekehrt fragen: Wie teuer darf sie höchstens sein? Im Bundesmittel bringt eine 10-kWp-Anlage bei 4 000 kWh Verbrauch ${h.eur(bund.summe)} in ${h.num(J)} Jahren. Geteilt durch die Leistung sind das ${h.eur(grenzpreis)} je kWp. Liegt Ihr Angebot darunter, lohnt sich die Anlage rechnerisch schon ohne steigende Strompreise; liegt es darüber, nur wenn der Strom teurer wird oder der Verbrauch wächst. Diese Schwelle ist ehrlicher als jede Faustregel, weil sie nichts über Marktpreise voraussetzt: Sie vergleichen sie direkt mit der Summe auf Ihrem Angebot, geteilt durch die Kilowatt Peak.</p>

<h2>Fünf Fälle im Vergleich</h2>
${h.table(['Fall', 'Nutzen im Jahr', 'Amortisation', `Überschuss nach ${h.num(J)} Jahren`], [
  ['Bundesmittel, 10 kWp', h.eur(bund.nutzenJahr), `${h.num(bund.amortisationJahre ?? 0, 1)} Jahre`, h.eur(bund.gewinn)],
  ['Bremen, 10 kWp', h.eur(bremen.nutzenJahr), `${h.num(bremen.amortisationJahre ?? 0, 1)} Jahre`, h.eur(bremen.gewinn)],
  ['München, 10 kWp', h.eur(muenchen.nutzenJahr), `${h.num(muenchen.amortisationJahre ?? 0, 1)} Jahre`, h.eur(muenchen.gewinn)],
  ['6 000 kWh Verbrauch', h.eur(viel.nutzenJahr), `${h.num(viel.amortisationJahre ?? 0, 1)} Jahre`, h.eur(viel.gewinn)],
  ['5 kWp statt 10', h.eur(klein.nutzenJahr), `${h.num(klein.amortisationJahre ?? 0, 1)} Jahre`, h.eur(klein.gewinn)],
  ['mit 8 kWh Speicher', h.eur(speicher.nutzenJahr), `${h.num(speicher.amortisationJahre ?? 0, 1)} Jahre`, h.eur(speicher.gewinn)],
], `Süd 30°, Verbrauch 4 000 kWh wenn nicht anders angegeben, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh konstant, Kosten angenommen mit ${h.eur(PREIS_KWP)} je kWp, Speicher mit ${h.eur(6000)} zusätzlich. Ersetzen Sie diese Annahmen durch Ihr Angebot.`, ['l', 'r', 'r', 'r'])}
<p>Drei Dinge fallen auf. Der Standort verschiebt das Ergebnis weniger, als oft vermutet wird: Zwischen Bremen und München liegen rund ${h.pct(muenchen.ertrag / bremen.ertrag - 1, 0)} Ertrag, aber das Plus kommt fast nur aus der Einspeisung, die schlecht bezahlt ist. Der Verbrauch wirkt stärker, weil er den teuren Netzstrom ersetzt. Und der Speicher bringt im Jahr ${h.eur(speicher.nutzenJahr - bund.nutzenJahr)} mehr; über ${h.num(J)} Jahre deckt das einen Speicherpreis bis ${h.eur(speicherGrenz)}. Mit den angenommenen ${h.eur(6000)} verbessert er die Bilanz, bei einem teureren Angebot kehrt sich das um. Den genauen Ertrag für Ihre Postleitzahl liefert der ${h.a('pv-ertrag-plz', 'Ertragsrechner nach PLZ')}, gestützt auf ${h.src('pvgis', 'PVGIS')}.</p>

<h2>Woran die Wirtschaftlichkeit scheitern kann</h2>
<h3>Verschattung und Dachzustand</h3>
<p>Ein Schornstein, eine Gaube oder ein Nachbarbaum, der mittags Schatten wirft, kostet mehr Ertrag als jede Himmelsrichtung. Steht in den nächsten Jahren eine Dachsanierung an, gehört sie vor die Montage: Module ab- und wieder aufzubauen, frisst einen Teil des Überschusses.</p>
<h3>Die 60-Prozent-Grenze ohne Smart Meter</h3>
<p>Neue Anlagen unter ${h.num(P.solarspitzen.begrenzung_bis_kw)} kW ohne intelligentes Messsystem dürfen nur ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} ihrer Nennleistung einspeisen (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}). Im Bundesmittel gehen der 10-kWp-Anlage so ${h.num(bund.abgeregelt)} kWh im Jahr verloren, ${h.pct(bund.abgeregelt / bund.ertrag, 1)} des Ertrags. Mit Smart Meter entfällt die Grenze, dafür gibt es in Viertelstunden mit negativem Börsenpreis keine Vergütung (${h.src('eeg_51', '§ 51 EEG')}); der Jahresnutzen liegt dann bei ${h.eur(sm.nutzenJahr)} statt ${h.eur(bund.nutzenJahr)}. Mehr dazu unter ${h.a('solarspitzengesetz', 'Solarspitzengesetz')}.</p>
<h3>Ein zu großer Rahmen für den eigenen Verbrauch</h3>
<p>Der Eigenverbrauch stammt aus einer Simulation mit den ${h.src('htw_lastprofile', 'Lastprofilen der HTW Berlin')}. Ein Haushalt, der tagsüber leer steht, nutzt weniger Solarstrom als der Durchschnitt; einer mit Homeoffice mehr. Wer unsicher ist, rechnet mit kleinerem Eigenverbrauch und schaut, ob die Bilanz dann noch trägt.</p>

<h2>Laufende Kosten: Ihre eigene Annahme</h2>
<p>Die Tabelle rechnet ohne Betriebskosten, weil sie von Haus zu Haus verschieden sind. Manche Gebäudeversicherung deckt die Anlage ohne Aufpreis, andere verlangt einen Zuschlag; der Messstellenbetreiber berechnet für den Zweirichtungszähler eine Jahresgebühr; und ein Wechselrichter hält oft nicht so lange wie die Module, sodass eine Rücklage für den Austausch vernünftig ist. Setzen Sie für all das einen Betrag im Jahr an, den Sie aus Ihren eigenen Unterlagen kennen. Zur Veranschaulichung: Mit angenommenen ${h.eur(LAUFEND)} im Jahr schrumpft der Überschuss der 10-kWp-Anlage im Bundesmittel über ${h.num(J)} Jahre von ${h.eur(bund.gewinn)} auf ${h.eur(gewinnLaufend)}. Der Grenzpreis sinkt entsprechend um ${h.eur(LAUFEND * J / base.kwp)} je kWp.</p>
<p>Wer finanziert, zieht zusätzlich die Zinsen ab. Auch hier gilt: Der Zinssatz steht in Ihrem Kreditangebot, nicht in einer Tabelle. Eine Anlage, die sich bar knapp lohnt, kann mit Kredit ins Minus rutschen; eine mit großem Abstand zum Grenzpreis trägt auch einen Kredit.</p>

<h2>Was danach kommt</h2>
<p>Für Anlagen, die bis Ende ${P.eeg.anwendbar_bis.slice(0, 4)} in Betrieb gehen, gilt das EEG 2023 mit seinem festen Satz. Der Regierungsentwurf zum EEG 2027 ist noch nicht beschlossen; er würde die feste Vergütung für neue Anlagen umstellen, mehr unter ${h.a('einspeiseverguetung-2027', 'Einspeisevergütung 2027')}. Den eigenen Fall mit Postleitzahl, Speicher und Smart Meter rechnet der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')}, die Kostenseite zerlegt ${h.a('photovoltaik-kosten', 'Photovoltaik-Kosten')}.</p>`,
  },
  en: {
    slug: 'is-solar-pv-worth-it',
    nav: 'Is solar PV worth it?',
    card: 'Break-even price per kWp, location, consumption and battery: when a German rooftop system earns more than it costs in 2026.',
    title: 'Is Solar PV Worth It in Germany 2026? Break-even Price',
    description: `Is solar PV worth it in Germany in 2026? Yes while the quote stays below ${EN.eur(grenzpreis)} per kWp: the ${J}-year balance for Bremen, Munich, a battery and more use.`,
    h1: 'Is solar PV worth it in Germany in 2026? The 20-year balance',
    intro: `A 10 kWp system at the German average earns ${EN.eur(bund.summe)} over ${J} years. Below ${EN.eur(grenzpreis)} per kWp purchase price, you end up ahead.`,
    resume: `Whether rooftop solar is worth it in Germany comes down to one comparison: the purchase price against the sum of the electricity bill you avoid and the feed-in tariff (Einspeisevergütung) over the ${J} years in which the rate is fixed. At the national average, a 10 kWp system facing south at 30° produces ${EN.num(bund.ertrag)} kWh a year according to PVGIS. A household using 4,000 kWh uses ${EN.pct(bund.eigenAnteil)} of that itself and saves ${EN.eur(bund.ersparnisJahr)} at ${EN.num(STROMPREIS_CT, 1)} ct/kWh; the rest earns another ${EN.eur(bund.verguetungJahr)} at ${EN.ct(AKTUELL.teil[0])}. That is ${EN.eur(bund.nutzenJahr)} a year and ${EN.eur(bund.summe)} over ${J} years, with no rise in power prices at all. Hence the break-even price: if the system costs less than ${EN.eur(grenzpreis)} per kWp, money is left over. At an assumed ${EN.eur(PREIS_KWP)} per kWp, the surplus is ${EN.eur(bund.gewinn)}. In Munich it rises to ${EN.eur(muenchen.gewinn)}, in Bremen it falls to ${EN.eur(bremen.gewinn)}; higher consumption matters more than location.`,
    faqs: [
      { q: 'Up to what price per kWp does a 10 kWp system pay off in Germany?', a: `At the national average, up to about ${EN.eur(grenzpreis)} per kWp. At that price, ${J} years of benefit, ${EN.eur(bund.summe)} with 4,000 kWh of consumption and a flat electricity price of ${EN.num(STROMPREIS_CT, 1)} ct/kWh, exactly cover the purchase. Every euro below is surplus. If power prices rise, the threshold moves up; if they fall, it moves down.` },
      { q: 'Is solar less worthwhile in northern Germany than in Bavaria?', a: `Slightly. The same 10 kWp system produces ${EN.num(bremen.ertrag)} kWh in Bremen and ${EN.num(muenchen.ertrag)} kWh in Munich. At an assumed purchase price of ${EN.eur(base.kostenEur)}, it pays for itself after ${EN.num(bremen.amortisationJahre ?? 0, 1)} years in Bremen and ${EN.num(muenchen.amortisationJahre ?? 0, 1)} years in Munich. The gap is smaller than the one between two households with different consumption.` },
      { q: 'Does solar pay off faster with a heat pump or an electric car?', a: `Yes, because more power stays in the house. If consumption rises from 4,000 to 6,000 kWh, the 10 kWp system's surplus after ${J} years grows from ${EN.eur(bund.gewinn)} to ${EN.eur(viel.gewinn)}, and payback drops to ${EN.num(viel.amortisationJahre ?? 0, 1)} years. Each self-used kilowatt-hour replaces grid power at ${EN.num(STROMPREIS_CT, 1)} ct instead of earning ${EN.ct(AKTUELL.teil[0])}.` },
      { q: 'Is a small 5 kWp system a better deal than 10 kWp?', a: `At the same price per kWp it pays back faster: ${EN.num(klein.amortisationJahre ?? 0, 1)} instead of ${EN.num(bund.amortisationJahre ?? 0, 1)} years, because ${EN.pct(klein.eigenAnteil)} of its output stays in the home. Its surplus after ${J} years, ${EN.eur(klein.gewinn)}, is smaller than the ${EN.eur(bund.gewinn)} of the larger system, though. In practice small systems often cost more per kWp, which erodes the advantage.` },
      { q: 'Does a battery make rooftop solar more profitable?', a: `Only if it is cheap enough. With an 8 kWh battery, the 10 kWp system's self-consumption rises to ${EN.pct(speicher.eigenAnteil)} and its benefit to ${EN.eur(speicher.nutzenJahr)} a year. If the battery adds an assumed ${EN.eur(6000)}, the surplus after ${J} years is ${EN.eur(speicher.gewinn)} instead of ${EN.eur(bund.gewinn)}. Over ${J} years the extra benefit covers a battery price of at most ${EN.eur(speicherGrenz)}.` },
      { q: 'Is solar still worth it if the feed-in rate drops every six months?', a: `Yes, the effect is small. Under section 49 EEG the rate for new systems falls by ${EN.pct(P.eeg.degression_halbjahr, 0)} every six months, from ${EN.ct(AKTUELL.teil[0])} to about ${EN.ct(satzNaechst)}. For the 10 kWp system feeding in ${EN.num(bund.einspeisung)} kWh, waiting half a year costs only about ${EN.eur(verlustDegression)} over ${J} years. A cheaper quote easily outweighs that.` },
    ],
    body: (h) => `
<h2>The one calculation that matters</h2>
<p>A rooftop system earns money in two ways. The bigger lever is the power the house uses itself: each such kilowatt-hour no longer has to be bought at the household price, which ${h.src('eurostat_strom', 'Eurostat')} puts at ${h.num(STROMPREIS_CT, 1)} ct for the first half of the year. The second is the surplus, which the grid operator (Netzbetreiber) pays at the fixed rate of the commissioning period: for systems from ${h.date(AKTUELL.von)}, ${h.ct(AKTUELL.teil[0])} up to 10 kWp according to the ${h.src('bnetza_saetze', 'Federal Network Agency')}. Together they make the annual benefit. Added up over ${h.num(J)} years and set against the purchase price, it shows whether you end up ahead.</p>
<p>This page calculates conservatively: the electricity price stays flat for the whole term, so does the yield, and nothing is counted after the payment period ends, even though panels usually keep working. If you want to factor in rising prices, the year-by-year view is under ${h.a('amortisation-photovoltaik', 'solar PV payback')}.</p>

<h2>The break-even price: where it tips</h2>
<p>Instead of asking how quickly a given system pays for itself, you can turn the question round: how expensive may it be at most? At the national average, a 10 kWp system with 4,000 kWh of consumption brings in ${h.eur(bund.summe)} over ${h.num(J)} years. Divided by its capacity, that is ${h.eur(grenzpreis)} per kWp. If your quote is below this, the system pays even without rising power prices; if it is above, only if electricity gets dearer or your use grows. This threshold is more honest than any rule of thumb because it assumes nothing about market prices: you compare it directly with the total on your quote divided by the kilowatts peak.</p>

<h2>Five cases compared</h2>
${h.table(['Case', 'Benefit per year', 'Payback', `Surplus after ${h.num(J)} years`], [
  ['National average, 10 kWp', h.eur(bund.nutzenJahr), `${h.num(bund.amortisationJahre ?? 0, 1)} years`, h.eur(bund.gewinn)],
  ['Bremen, 10 kWp', h.eur(bremen.nutzenJahr), `${h.num(bremen.amortisationJahre ?? 0, 1)} years`, h.eur(bremen.gewinn)],
  ['Munich, 10 kWp', h.eur(muenchen.nutzenJahr), `${h.num(muenchen.amortisationJahre ?? 0, 1)} years`, h.eur(muenchen.gewinn)],
  ['6,000 kWh consumption', h.eur(viel.nutzenJahr), `${h.num(viel.amortisationJahre ?? 0, 1)} years`, h.eur(viel.gewinn)],
  ['5 kWp instead of 10', h.eur(klein.nutzenJahr), `${h.num(klein.amortisationJahre ?? 0, 1)} years`, h.eur(klein.gewinn)],
  ['with 8 kWh battery', h.eur(speicher.nutzenJahr), `${h.num(speicher.amortisationJahre ?? 0, 1)} years`, h.eur(speicher.gewinn)],
], `South 30°, consumption 4,000 kWh unless stated, electricity price ${h.num(STROMPREIS_CT, 1)} ct/kWh flat, cost assumed at ${h.eur(PREIS_KWP)} per kWp, battery ${h.eur(6000)} extra. Replace these assumptions with your quote.`, ['l', 'r', 'r', 'r'])}
<p>Three things stand out. Location moves the result less than people expect: Munich yields about ${h.pct(muenchen.ertrag / bremen.ertrag - 1, 0)} more than Bremen, but almost all of that extra goes to the grid, where it is poorly paid. Consumption has a stronger effect because it replaces expensive grid power. And the battery adds ${h.eur(speicher.nutzenJahr - bund.nutzenJahr)} a year; over ${h.num(J)} years that covers a battery price of up to ${h.eur(speicherGrenz)}. At the assumed ${h.eur(6000)} it improves the balance, and a dearer quote would reverse that. The exact yield for your postcode comes from the ${h.a('pv-ertrag-plz', 'yield calculator by postcode')}, based on ${h.src('pvgis', 'PVGIS')}.</p>

<h2>What can make it fail</h2>
<h3>Shade and the state of the roof</h3>
<p>A chimney, dormer or neighbour's tree that casts shade at midday costs more yield than any compass direction. If the roof needs renovating in the next few years, do that before mounting: taking panels down and putting them back up eats into the surplus.</p>
<h3>The 60 per cent cap without a smart meter</h3>
<p>New systems below ${h.num(P.solarspitzen.begrenzung_bis_kw)} kW without a smart meter (intelligentes Messsystem) may feed in only ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of their rated output (${h.src('eeg_9', 'section 9(2) EEG')}). At the national average, the 10 kWp system loses ${h.num(bund.abgeregelt)} kWh a year this way, ${h.pct(bund.abgeregelt / bund.ertrag, 1)} of its output. With a smart meter the cap goes, but quarter-hours with negative wholesale prices earn nothing (${h.src('eeg_51', 'section 51 EEG')}); the annual benefit is then ${h.eur(sm.nutzenJahr)} instead of ${h.eur(bund.nutzenJahr)}. More under ${h.a('solarspitzengesetz', 'solar peak law')}.</p>
<h3>A system too big for your consumption</h3>
<p>Self-consumption comes from a simulation using the ${h.src('htw_lastprofile', 'HTW Berlin load profiles')}. A household that is empty during the day uses less solar power than the average; one with a home office uses more. If unsure, assume lower self-consumption and see whether the balance still holds.</p>

<h2>Running costs: your own assumption</h2>
<p>The table leaves out running costs because they differ from house to house. Some building insurance policies cover the system at no extra charge, others add a premium; the metering operator charges an annual fee for the bidirectional meter; and an inverter often does not last as long as the panels, so setting money aside for a replacement makes sense. Put in one yearly figure that you know from your own paperwork. As an illustration: with an assumed ${h.eur(LAUFEND)} a year, the national-average 10 kWp system's surplus over ${h.num(J)} years shrinks from ${h.eur(bund.gewinn)} to ${h.eur(gewinnLaufend)}, and the break-even price drops by ${h.eur(LAUFEND * J / base.kwp)} per kWp.</p>
<p>If you finance the purchase, subtract the interest too; the rate is in your loan offer, not in any table.</p>

<h2>What comes next</h2>
<p>Systems commissioned by the end of ${P.eeg.anwendbar_bis.slice(0, 4)} fall under the EEG 2023 with its fixed rate. The government draft of the EEG 2027 has not been passed; it would change the fixed payment for new systems, see ${h.a('einspeiseverguetung-2027', 'feed-in tariff 2027')}. Your own case with postcode, battery and smart meter is worked out by the ${h.a('photovoltaik-rechner', 'solar PV calculator')}, and ${h.a('photovoltaik-kosten', 'solar PV cost')} breaks down the price side.</p>`,
  },
});

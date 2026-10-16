import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { AKTUELL } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Kosten je erzeugter Kilowattstunde über die Vergütungsdauer, aus dem Ertrag des Motors (Bundesmittel, Süd 30°).
 * Preise je kWp sind ausdrücklich Annahmen in drei Stufen, die der Leser durch sein Angebot ersetzt; kein Marktpreis.
 */
const J = P.eeg.dauer_jahre;
const KWP = 10;
const STUFEN = [1200, 1500, 1800];
const base = { ort: null, kwp: KWP, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: KWP * 1500 };
const bund = rechnePv(base);
const muenchen = rechnePv({ ...base, ort: ortVonPlz('80331') });
const hamburg = rechnePv({ ...base, ort: ortVonPlz('20095') });
/** ct je kWh: Kaufpreis geteilt durch die Erzeugung über J Jahre. */
const ctKwh = (kosten: number, ertragJahr: number) => (kosten / (ertragJahr * J)) * 100;
const zeilen = STUFEN.map((pk) => ({ pk, k: pk * KWP, c: ctKwh(pk * KWP, bund.ertrag), cm: ctKwh(pk * KWP, muenchen.ertrag), ch: ctKwh(pk * KWP, hamburg.ertrag) }));
const mitte = zeilen[1];
/** Preis je kWp, ab dem eine erzeugte kWh mehr kostet als die Vergütung bringt. */
const pkGleichVerguetung = (AKTUELL.teil[0] / 100) * bund.ertrag * J / KWP;
/** Gleicher Nettopreis mit dem Regelsatz der Umsatzsteuer, wie er ohne § 12 Abs. 3 UStG gälte. */
const mitUst = mitte.k * (1 + P.steuer.ust_regelsatz);
const ctMitUst = ctKwh(mitUst, bund.ertrag);
/** Laufende Kosten als Leserannahme. */
const LAUFEND = 150;
const ctLaufend = ctKwh(mitte.k + LAUFEND * J, bund.ertrag);
/** Zwei erfundene Vergleichsangebote (Annahmen), um die Methode zu zeigen. */
const angA = { kwp: 8.5, k: 14000 }, angB = { kwp: 11.2, k: 16500 };
const rA = rechnePv({ ...base, kwp: angA.kwp, kostenEur: angA.k }), rB = rechnePv({ ...base, kwp: angB.kwp, kostenEur: angB.k });
const cA = ctKwh(angA.k, rA.ertrag), cB = ctKwh(angB.k, rB.ertrag);

export default defineGuide({
  id: 'photovoltaik-kosten',
  group: 'pv',
  order: 42,
  mini: 'kostenKwp',
  related: ['photovoltaik-lohnt-sich', 'photovoltaik-steuer', 'amortisation-photovoltaik', 'wie-viel-kwp', 'photovoltaik-rechner'],
  sources: ['ustg_12', 'pvgis', 'eurostat_strom', 'bnetza_saetze', 'mastr'],
  de: {
    slug: 'photovoltaik-kosten',
    nav: 'Photovoltaik-Kosten',
    card: 'Preisbestandteile eines Angebots, 0 % Mehrwertsteuer und was eine selbst erzeugte Kilowattstunde über zwanzig Jahre kostet.',
    title: 'Photovoltaik-Kosten 2026: Angebot prüfen, Preis je kWh',
    description: `Photovoltaik-Kosten 2026 richtig lesen: Bestandteile des Angebots, 0 % Umsatzsteuer bis ${P.steuer.ust_null_bis_kwp} kWp und was eine Kilowattstunde vom eigenen Dach über ${J} Jahre.`,
    h1: 'Photovoltaik-Kosten 2026: was eine Kilowattstunde vom Dach kostet',
    intro: `Bei angenommenen ${DE.eur(mitte.pk)} je kWp kostet eine Kilowattstunde vom eigenen Dach im Bundesmittel ${DE.num(mitte.c, 1)} ct, gerechnet über ${J} Jahre. Netzstrom kostet ${DE.num(STROMPREIS_CT, 1)} ct.`,
    resume: `Was eine Photovoltaikanlage kostet, steht auf dem Angebot; was sie wert ist, zeigt erst der Preis je erzeugter Kilowattstunde. Er ergibt sich aus dem Gesamtpreis geteilt durch die Erzeugung über die ${J} Jahre der festen Vergütung. Eine 10-kWp-Anlage nach Süden mit 30° Neigung erzeugt im deutschen Mittel laut PVGIS ${DE.num(bund.ertrag)} kWh im Jahr, also ${DE.num(bund.ertrag * J)} kWh in ${J} Jahren. Wir setzen keine Marktpreise an, sondern drei Annahmen: Bei ${DE.eur(zeilen[0].pk)} je kWp kostet die Kilowattstunde ${DE.num(zeilen[0].c, 1)} ct, bei ${DE.eur(zeilen[1].pk)} sind es ${DE.num(zeilen[1].c, 1)} ct, bei ${DE.eur(zeilen[2].pk)} ${DE.num(zeilen[2].c, 1)} ct. Zum Vergleich: Netzstrom kostet laut Eurostat ${DE.num(STROMPREIS_CT, 1)} ct, die Einspeisevergütung bringt ${DE.ct(AKTUELL.teil[0])}. Solange der Preis je kWh unter der Vergütung liegt, verdient sogar jede eingespeiste Kilowattstunde; das ist bis rund ${DE.eur(pkGleichVerguetung)} je kWp der Fall. Auf Module, Speicher und Montage fallen bis ${P.steuer.ust_null_bis_kwp} kWp 0 % Umsatzsteuer an.`,
    faqs: [
      { q: 'Was kostet eine Kilowattstunde aus einer 10-kWp-Anlage?', a: `Das hängt nur vom Angebotspreis und vom Ertrag ab. Im Bundesmittel erzeugt die Anlage ${DE.num(bund.ertrag * J)} kWh in ${J} Jahren. Bei angenommenen ${DE.eur(mitte.k)} Gesamtpreis sind das ${DE.num(mitte.c, 1)} ct je kWh, in München ${DE.num(mitte.cm, 1)} ct, in Hamburg ${DE.num(mitte.ch, 1)} ct. Teilen Sie Ihren Angebotspreis durch die Erzeugung Ihrer Postleitzahl, dann haben Sie Ihren Wert.` },
      { q: 'Muss auf einem Photovoltaik-Angebot Mehrwertsteuer stehen?', a: `Bis ${P.steuer.ust_null_bis_kwp} kWp laut Marktstammdatenregister nicht: Für Lieferung und Installation von Modulen, wesentlichen Komponenten und Speichern gilt dann der Nullsteuersatz nach § 12 Abs. 3 UStG. Stünden ${DE.pct(P.steuer.ust_regelsatz, 0)} auf ${DE.eur(mitte.k)}, wären das ${DE.eur(mitUst - mitte.k)} mehr, und die Kilowattstunde stiege von ${DE.num(mitte.c, 1)} auf ${DE.num(ctMitUst, 1)} ct.` },
      { q: 'Ab welchem Preis je kWp lohnt sich das Einspeisen nicht mehr?', a: `Wenn eine erzeugte Kilowattstunde mehr kostet, als die Vergütung von ${DE.ct(AKTUELL.teil[0])} bringt. Im Bundesmittel ist das ab etwa ${DE.eur(pkGleichVerguetung)} je kWp der Fall. Darüber verdient die Anlage nur noch mit dem selbst genutzten Strom; die Einspeisung verringert dann bloß den Verlust. Der Eigenverbrauch bleibt bis weit darüber rentabel, weil er Netzstrom zu ${DE.num(STROMPREIS_CT, 1)} ct ersetzt.` },
      { q: 'Welche Posten gehören in ein vollständiges PV-Angebot?', a: `Module mit Typ und Leistung, Wechselrichter, Unterkonstruktion und Dachhaken, Verkabelung, die Arbeiten am Zählerschrank, Montage und Gerüst, die Anmeldung beim Netzbetreiber und gegebenenfalls ein Speicher. Fehlt ein Posten, kommt er später als Nachtrag. Vergleichbar werden zwei Angebote erst, wenn beide dieselben Posten enthalten und Sie den Gesamtpreis durch die Leistung in kWp teilen.` },
      { q: 'Wie verändern laufende Kosten den Preis je Kilowattstunde?', a: `Sie kommen zum Kaufpreis hinzu. Setzen Sie zum Beispiel ${DE.eur(LAUFEND)} im Jahr für Versicherung, Zählergebühr und eine Rücklage für den Wechselrichter an, steigt der Preis je kWh der 10-kWp-Anlage bei ${DE.eur(mitte.pk)} je kWp von ${DE.num(mitte.c, 1)} auf ${DE.num(ctLaufend, 1)} ct. Den Betrag kennen Sie aus Ihren eigenen Verträgen; er ist hier nur eine Annahme.` },
      { q: 'Ist ein größeres PV-Angebot je Kilowattstunde günstiger?', a: `Meist ja, weil Gerüst, Elektroarbeiten und Anmeldung fast gleich viel kosten, egal wie viele Module aufs Dach kommen. Im Beispiel dieser Seite liefern angenommene ${DE.eur(angB.k)} für ${DE.num(angB.kwp, 1)} kWp die Kilowattstunde für ${DE.num(cB, 1)} ct, ${DE.eur(angA.k)} für ${DE.num(angA.kwp, 1)} kWp für ${DE.num(cA, 1)} ct. Der Zusatzstrom bringt aber nur dann viel, wenn Sie ihn selbst verbrauchen.` },
    ],
    body: (h) => `
<h2>Wofür das Geld ausgegeben wird</h2>
<p>Ein Angebot für eine Dachanlage fasst Material und Arbeit zusammen, die sich gut getrennt prüfen lassen. Die Module liefern die Leistung in Kilowatt Peak und machen die Anlage erst vergleichbar. Der Wechselrichter wandelt Gleich- in Wechselstrom und ist das Bauteil, das am ehesten vor dem Ende der Laufzeit getauscht werden muss. Unterkonstruktion, Dachhaken und Kabel hängen von der Dachdeckung ab: Ziegel, Schiefer, Blech und Flachdach verlangen unterschiedliche Systeme. Dazu kommen die Elektroarbeiten, oft der Umbau des Zählerschranks, wenn der alte nicht mehr den heutigen Vorgaben entspricht, sowie Gerüst und Montage. Ein Speicher ist optional und wird am besten als eigener Posten ausgewiesen, damit sich seine Wirtschaftlichkeit getrennt beurteilen lässt.</p>
<p>Eine Liste mit Marktpreisen geben wir bewusst nicht an: Preise je kWp schwanken nach Region, Dach, Anlagengröße und Auslastung der Betriebe, und jede Zahl ohne Quelle wäre eine Behauptung. Nützlicher ist ein Maßstab, an dem Sie jedes Angebot selbst messen können, und das ist der Preis je erzeugter Kilowattstunde.</p>

<h2>Vom Angebotspreis zum Preis je Kilowattstunde</h2>
<p>Die Rechnung ist einfach. Gesamtpreis geteilt durch die Kilowattstunden, die die Anlage in ${h.num(J)} Jahren erzeugt. Die Erzeugung stammt aus ${h.src('pvgis', 'PVGIS')}: im deutschen Mittel ${h.num(bund.spez)} kWh je kWp und Jahr bei 30° Süd. Für drei angenommene Preisstufen ergibt sich:</p>
${h.table(['Annahme je kWp', 'Gesamtpreis 10 kWp', 'Bundesmittel', 'München', 'Hamburg'], zeilen.map((z) => [h.eur(z.pk), h.eur(z.k), `${h.num(z.c, 1)} ct`, `${h.num(z.cm, 1)} ct`, `${h.num(z.ch, 1)} ct`]), `Preis je erzeugter kWh über ${h.num(J)} Jahre, ohne Zinsen und laufende Kosten. Erzeugung je Jahr: Bundesmittel ${h.num(bund.ertrag)} kWh, München ${h.num(muenchen.ertrag)} kWh, Hamburg ${h.num(hamburg.ertrag)} kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Zwei Vergleichswerte ordnen die Zahlen ein. Der Haushaltsstrompreis liegt laut ${h.src('eurostat_strom', 'Eurostat')} bei ${h.num(STROMPREIS_CT, 1)} ct je kWh: Jede selbst genutzte Kilowattstunde spart also die Differenz zwischen diesem Preis und dem Preis aus der Tabelle. Die Einspeisevergütung für Anlagen ab dem ${h.date(AKTUELL.von)} beträgt laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')} ${h.ct(AKTUELL.teil[0])} bis 10 kWp. Liegt der Preis je kWh darunter, verdient auch der eingespeiste Strom etwas. Diese Schwelle erreicht die 10-kWp-Anlage im Bundesmittel bei rund ${h.eur(pkGleichVerguetung)} je kWp.</p>
<p>Die Größe der Anlage wirkt in beide Richtungen. Fixe Posten wie Gerüst und Zählerschrank verteilen sich bei mehr Leistung auf mehr Kilowattstunden, deshalb sind größere Anlagen je kWp meist günstiger. Gleichzeitig sinkt der Anteil, den das Haus selbst verbraucht. Welche Größe zu Ihrem Verbrauch passt, rechnet ${h.a('wie-viel-kwp', 'wie viel kWp')}.</p>

<h2>Null Prozent Umsatzsteuer: was das Gesetz abdeckt</h2>
<p>Nach ${h.src('ustg_12', '§ 12 Abs. 3 UStG')} fällt auf die Lieferung von Solarmodulen an den Betreiber, auf die für den Betrieb wesentlichen Komponenten, auf Speicher und auf die Installation keine Umsatzsteuer an, wenn die Anlage auf oder in der Nähe einer Wohnung oder eines dem Gemeinwohl dienenden Gebäudes installiert wird. Bei einer Bruttoleistung von höchstens ${h.num(P.steuer.ust_null_bis_kwp)} kWp laut ${h.src('mastr', 'Marktstammdatenregister')} gilt diese Voraussetzung als erfüllt, ohne weiteren Nachweis. Ein Angebot für ein Einfamilienhaus sollte deshalb 0 % ausweisen. Wie viel das ausmacht, zeigt der Vergleich: Mit dem Regelsatz von ${h.pct(P.steuer.ust_regelsatz, 0)} würde die Anlage aus der mittleren Zeile ${h.eur(mitUst)} statt ${h.eur(mitte.k)} kosten und die Kilowattstunde ${h.num(ctMitUst, 1)} statt ${h.num(mitte.c, 1)} ct. Was danach steuerlich noch zu beachten ist, steht unter ${h.a('photovoltaik-steuer', 'Photovoltaik und Steuer')}.</p>

<h2>Zwei Angebote auf einen Nenner bringen</h2>
<p>Angebote unterscheiden sich selten nur im Preis, meist auch in der Leistung, weil jeder Betrieb das Dach anders belegt. Ein Beispiel mit zwei ausgedachten Angeboten zeigt, warum der Gesamtbetrag allein in die Irre führt. Angebot A bietet ${h.num(angA.kwp, 1)} kWp für ${h.eur(angA.k)}, Angebot B ${h.num(angB.kwp, 1)} kWp für ${h.eur(angB.k)}. B wirkt teurer, kostet aber ${h.eur(angB.k / angB.kwp)} je kWp gegen ${h.eur(angA.k / angA.kwp)} bei A. Über ${h.num(J)} Jahre erzeugt A im Bundesmittel ${h.num(rA.ertrag * J)} kWh, B ${h.num(rB.ertrag * J)} kWh; je Kilowattstunde sind das ${h.num(cA, 1)} ct gegen ${h.num(cB, 1)} ct. Das größere Angebot liefert den billigeren Strom. Ob sich der Mehrbetrag rechnet, hängt dann davon ab, wie viel des zusätzlichen Stroms Sie selbst nutzen; der Rest bringt nur die Vergütung.</p>
<p>Prüfen Sie dabei, ob beide Angebote denselben Lieferumfang haben. Ein fehlender Zählerschrankumbau oder ein nicht enthaltenes Gerüst macht ein Angebot auf dem Papier billiger, nicht in der Wirklichkeit.</p>

<h2>Was nicht im Angebotspreis steht</h2>
<p>Im Preis je Kilowattstunde oben fehlen drei Dinge, die Sie selbst ergänzen. Erstens laufende Kosten: Versicherung, die Jahresgebühr des Messstellenbetreibers und eine Rücklage für einen neuen Wechselrichter. Mit angenommenen ${h.eur(LAUFEND)} im Jahr steigt der Wert der mittleren Zeile auf ${h.num(ctLaufend, 1)} ct. Zweitens Zinsen, wenn Sie finanzieren. Drittens der Ertrag nach dem Ende der Vergütung: Module laufen meist länger als ${h.num(J)} Jahre, und jede weitere Kilowattstunde senkt den Durchschnittspreis. Diese Seite rechnet ihn nicht ein, damit die Zahl auf der vorsichtigen Seite bleibt.</p>
<p>Ob sich der Preis am Ende rechnet, ist eine zweite Frage: Dafür zählt, wie viel Strom im Haus bleibt. Die Antwort mit Überschuss nach ${h.num(J)} Jahren gibt ${h.a('photovoltaik-lohnt-sich', 'Lohnt sich Photovoltaik?')}, den Verlauf Jahr für Jahr ${h.a('amortisation-photovoltaik', 'Amortisation der Photovoltaik')}.</p>`,
  },
  en: {
    slug: 'solar-pv-cost',
    nav: 'Solar PV cost',
    card: 'What goes into a quote, 0% VAT, and what a self-generated kilowatt-hour costs over twenty years.',
    title: 'Solar PV Cost in Germany 2026: Quote Check, Price per kWh',
    description: `Solar PV cost in Germany 2026: what goes into a quote, 0% VAT up to ${P.steuer.ust_null_bis_kwp} kWp, and what a kilowatt-hour from your own roof really costs you over ${J} years.`,
    h1: 'Solar PV cost in Germany 2026: what a rooftop kilowatt-hour costs',
    intro: `At an assumed ${EN.eur(mitte.pk)} per kWp, a kilowatt-hour from your own roof costs ${EN.num(mitte.c, 1)} ct at the German average, spread over ${J} years. Grid power costs ${EN.num(STROMPREIS_CT, 1)} ct.`,
    resume: `What a solar PV system costs is on the quote; what it is worth only shows in the price per kilowatt-hour it generates. That figure is the total price divided by the output over the ${J} years of fixed feed-in payment. A 10 kWp system facing south at 30° produces ${EN.num(bund.ertrag)} kWh a year at the German average according to PVGIS, or ${EN.num(bund.ertrag * J)} kWh over ${J} years. We do not quote market prices; instead we use three assumptions. At ${EN.eur(zeilen[0].pk)} per kWp a kilowatt-hour costs ${EN.num(zeilen[0].c, 1)} ct, at ${EN.eur(zeilen[1].pk)} it is ${EN.num(zeilen[1].c, 1)} ct, at ${EN.eur(zeilen[2].pk)} ${EN.num(zeilen[2].c, 1)} ct. For comparison, household electricity costs ${EN.num(STROMPREIS_CT, 1)} ct according to Eurostat, and the feed-in tariff (Einspeisevergütung) pays ${EN.ct(AKTUELL.teil[0])}. As long as the cost per kWh stays below the tariff, even exported power earns money; that holds up to about ${EN.eur(pkGleichVerguetung)} per kWp. Panels, batteries and installation carry 0% VAT up to ${P.steuer.ust_null_bis_kwp} kWp.`,
    faqs: [
      { q: 'What does a kilowatt-hour from a 10 kWp system cost in Germany?', a: `It depends only on the quoted price and the yield. At the German average the system produces ${EN.num(bund.ertrag * J)} kWh in ${J} years. At an assumed total of ${EN.eur(mitte.k)}, that is ${EN.num(mitte.c, 1)} ct per kWh, ${EN.num(mitte.cm, 1)} ct in Munich and ${EN.num(mitte.ch, 1)} ct in Hamburg. Divide your quote by the output for your postcode and you have your own figure.` },
      { q: 'Should a German solar quote include VAT?', a: `Not up to ${P.steuer.ust_null_bis_kwp} kWp as recorded in the Market Master Data Register: supply and installation of panels, essential components and batteries then fall under the zero rate of section 12(3) of the VAT Act (UStG). At ${EN.pct(P.steuer.ust_regelsatz, 0)} on ${EN.eur(mitte.k)}, you would pay ${EN.eur(mitUst - mitte.k)} more, and the kilowatt-hour would rise from ${EN.num(mitte.c, 1)} to ${EN.num(ctMitUst, 1)} ct.` },
      { q: 'At what price per kWp does exporting solar power stop paying?', a: `When a generated kilowatt-hour costs more than the ${EN.ct(AKTUELL.teil[0])} feed-in tariff brings in. At the German average that happens from about ${EN.eur(pkGleichVerguetung)} per kWp. Above it, the system only earns through the power you use yourself, and exporting merely reduces the loss. Self-consumption stays profitable far beyond that, because it replaces grid power at ${EN.num(STROMPREIS_CT, 1)} ct.` },
      { q: 'Which items belong in a complete rooftop solar quote?', a: `Panels with model and output, inverter, mounting rails and roof hooks, cabling, the work on the meter cabinet, installation and scaffolding, registration with the grid operator and, if wanted, a battery. A missing item tends to come back later as an extra charge. Two quotes only become comparable when both contain the same items and you divide each total by its capacity in kWp.` },
      { q: 'How do running costs change the price per kilowatt-hour?', a: `They come on top of the purchase price. If you assume, say, ${EN.eur(LAUFEND)} a year for insurance, the meter fee and a reserve for a new inverter, the cost per kWh of the 10 kWp system at ${EN.eur(mitte.pk)} per kWp rises from ${EN.num(mitte.c, 1)} to ${EN.num(ctLaufend, 1)} ct. You know the real amount from your own contracts; here it is only an assumption.` },
      { q: 'Is a larger solar quote cheaper per kilowatt-hour?', a: `Usually, because scaffolding, electrical work and registration cost almost the same however many panels go on the roof. In this page's example, an assumed ${EN.eur(angB.k)} for ${EN.num(angB.kwp, 1)} kWp delivers power at ${EN.num(cB, 1)} ct per kWh, against ${EN.num(cA, 1)} ct for ${EN.eur(angA.k)} and ${EN.num(angA.kwp, 1)} kWp. The extra output only pays well if you use it yourself.` },
    ],
    body: (h) => `
<h2>Where the money goes</h2>
<p>A quote for a rooftop system bundles material and labour that are easy to check one by one. The panels provide the capacity in kilowatts peak and are what makes systems comparable. The inverter turns direct current into alternating current and is the part most likely to need replacing before the end of the term. Mounting rails, roof hooks and cables depend on the roofing: clay tiles, slate, metal and flat roofs each need different systems. Then there is the electrical work, often an upgrade of the meter cabinet (Zählerschrank) if the old one no longer meets current standards, plus scaffolding and installation. A battery is optional and is best listed as a separate item so that its economics can be judged on their own.</p>
<p>We deliberately do not give a list of market prices: prices per kWp vary by region, roof, system size and how busy installers are, and any figure without a source would be a claim. More useful is a yardstick you can apply to any quote yourself, and that is the price per kilowatt-hour generated.</p>

<h2>From quoted price to price per kilowatt-hour</h2>
<p>The calculation is simple: total price divided by the kilowatt-hours the system produces in ${h.num(J)} years. Output comes from ${h.src('pvgis', 'PVGIS')}: ${h.num(bund.spez)} kWh per kWp a year at the German average for 30° south. Three assumed price levels give:</p>
${h.table(['Assumed per kWp', 'Total for 10 kWp', 'German average', 'Munich', 'Hamburg'], zeilen.map((z) => [h.eur(z.pk), h.eur(z.k), `${h.num(z.c, 1)} ct`, `${h.num(z.cm, 1)} ct`, `${h.num(z.ch, 1)} ct`]), `Price per kWh generated over ${h.num(J)} years, excluding interest and running costs. Output per year: German average ${h.num(bund.ertrag)} kWh, Munich ${h.num(muenchen.ertrag)} kWh, Hamburg ${h.num(hamburg.ertrag)} kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Two reference points put the figures in context. Household electricity costs ${h.num(STROMPREIS_CT, 1)} ct per kWh according to ${h.src('eurostat_strom', 'Eurostat')}, so each self-used kilowatt-hour saves the difference between that price and the price in the table. The feed-in tariff for systems from ${h.date(AKTUELL.von)} is ${h.ct(AKTUELL.teil[0])} up to 10 kWp according to the ${h.src('bnetza_saetze', 'Federal Network Agency')}. If the cost per kWh is below it, even exported power earns something. The 10 kWp system reaches that threshold at the German average at about ${h.eur(pkGleichVerguetung)} per kWp.</p>
<p>System size cuts both ways. Fixed items such as scaffolding and the meter cabinet are spread over more kilowatt-hours when the system is bigger, which is why larger systems are usually cheaper per kWp. At the same time, the share the house uses itself falls. Which size suits your consumption is worked out by ${h.a('wie-viel-kwp', 'how many kWp')}.</p>

<h2>Zero per cent VAT: what the law covers</h2>
<p>Under the zero rate in ${h.src('ustg_12', 'section 12(3) of the VAT Act')}, no VAT is charged on supplying solar panels to the operator, on the components essential for running the system, on batteries or on installation, provided the system is installed on or near a dwelling or a building used for public-interest purposes. If the gross capacity recorded in the ${h.src('mastr', 'Market Master Data Register')} is no more than ${h.num(P.steuer.ust_null_bis_kwp)} kWp, this condition is deemed met with no further proof. A quote for a family home should therefore show 0%. How much that matters: at the standard rate of ${h.pct(P.steuer.ust_regelsatz, 0)}, the system in the middle row would cost ${h.eur(mitUst)} instead of ${h.eur(mitte.k)}, and the kilowatt-hour ${h.num(ctMitUst, 1)} instead of ${h.num(mitte.c, 1)} ct. What else matters for tax afterwards is under ${h.a('photovoltaik-steuer', 'solar PV and tax')}.</p>

<h2>Putting two quotes on the same footing</h2>
<p>Quotes rarely differ only in price; usually capacity differs too, because each installer lays out the roof differently. An example with two made-up quotes shows why the total alone misleads. Quote A offers ${h.num(angA.kwp, 1)} kWp for ${h.eur(angA.k)}, quote B ${h.num(angB.kwp, 1)} kWp for ${h.eur(angB.k)}. B looks dearer but costs ${h.eur(angB.k / angB.kwp)} per kWp against ${h.eur(angA.k / angA.kwp)} for A. Over ${h.num(J)} years at the German average, A produces ${h.num(rA.ertrag * J)} kWh and B ${h.num(rB.ertrag * J)} kWh: ${h.num(cA, 1)} ct against ${h.num(cB, 1)} ct per kilowatt-hour. The bigger quote delivers cheaper power. Whether the extra outlay pays then depends on how much of the additional output you use yourself. Check too that both quotes cover the same scope: a missing meter cabinet upgrade makes a quote cheaper on paper only.</p>

<h2>What the quote does not include</h2>
<p>The price per kilowatt-hour above leaves out three things you add yourself. First, running costs: insurance, the metering operator's annual fee and a reserve for a new inverter. With an assumed ${h.eur(LAUFEND)} a year, the middle row rises to ${h.num(ctLaufend, 1)} ct. Second, interest if you finance. Third, output after the payment period: panels usually run longer than ${h.num(J)} years, and every extra kilowatt-hour lowers the average price. This page leaves that out so the figure stays on the cautious side.</p>
<p>Whether the price pays off in the end is a separate question that depends on how much power stays in the house. The answer, with the surplus after ${h.num(J)} years, is in ${h.a('photovoltaik-lohnt-sich', 'is solar PV worth it?')}, and the year-by-year path in ${h.a('amortisation-photovoltaik', 'solar PV payback')}.</p>`,
  },
});

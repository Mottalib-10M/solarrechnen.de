import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon, type BalkonEingabe } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/** Beispiele aus dem Motor: 900 Wp senkrecht nach Süden am Geländer, Bundesmittel, 2 500 kWh, 450 € (Standard des Mini-Rechners). */
const basis: BalkonEingabe = { ort: null, modulWp: 900, wechselrichterVa: P.balkon.max_va, neigung: 90, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: STROMPREIS_CT, kostenEur: 450 };
const b = (o: Partial<BalkonEingabe>) => rechneBalkon({ ...basis, ...o });
const std = b({});
const preise = [300, 450, 700, 1000].map((k) => ({ k, r: b({ kostenEur: k }) }));
const verbrauch = [1000, 2500, 5000].map((v) => ({ v, r: b({ verbrauchKwh: v }) }));
const richtungen = [
  { de: 'Süd', en: 'south', az: 0 }, { de: 'Südwest', en: 'south-west', az: 45 }, { de: 'Ost', en: 'east', az: -90 },
  { de: 'West', en: 'west', az: 90 }, { de: 'Nord', en: 'north', az: 180 },
].map((x) => ({ ...x, r: b({ azimut: x.az }) }));
const nord = richtungen[4].r, ost = richtungen[2].r;
const strompreise = [30, STROMPREIS_CT, 45].map((p) => ({ p, r: b({ preisCt: p }) }));
const steigend = b({ preisSteigerung: 0.02 });
/** Ungünstigster Fall: Ost, 40 % Schatten, Single-Haushalt mit 1 000 kWh, 700 €. */
const schlecht = b({ azimut: -90, verschattung: 0.4, verbrauchKwh: 1000, kostenEur: 700 });
/** Großes Set mit Speicher: 2 000 Wp, 35° Süd, 2 kWh, 1 500 €. */
const gross = b({ modulWp: P.balkon.max_wp, neigung: 35, speicherKwh: 2, kostenEur: 1500 });
const v1000 = verbrauch[0].r, v5000 = verbrauch[2].r;
/** Küste und Alpenrand: Flensburg und München, sonst wie das Standardbeispiel. */
const flensburg = b({ ort: ortVonPlz('24937') }), muenchen = b({ ort: ortVonPlz('80313') });
const spanne = muenchen.ertrag / flensburg.ertrag - 1;
/** Ab welchem Jahr die Summe der Ersparnis den Kaufpreis übersteigt, mit 2 % Preissteigerung. */
const jahrAusgleich = (() => { let s = 0; for (let j = 1; j <= 20; j++) { s += std.ersparnisJahr * Math.pow(1.02, j - 1); if (s >= 450) return j; } return 0; })();
const defekt = b({ kostenEur: 450 + 200 });

export default defineGuide({
  id: 'balkonkraftwerk-lohnt-sich',
  group: 'balkon',
  order: 24,
  mini: 'lohnt',
  related: ['balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mit-speicher', 'balkonkraftwerk-mieter', 'balkonkraftwerk-ertrag', 'amortisation-photovoltaik'],
  sources: ['eurostat_strom', 'pvgis', 'htw_lastprofile', 'eeg_8'],
  de: {
    slug: 'balkonkraftwerk-lohnt-sich',
    nav: 'Lohnt sich ein Balkonkraftwerk?',
    card: 'Amortisation nach Kaufpreis, Verbrauch, Himmelsrichtung und Strompreis, und die Fälle, in denen es sich nicht rechnet.',
    title: 'Balkonkraftwerk lohnt sich 2026? Amortisation in Jahren',
    description: `Balkonkraftwerk lohnt sich 2026 meist: 900 Wp senkrecht Süd sparen ${DE.eur(std.ersparnisJahr)} im Jahr, bezahlt nach ${DE.num(std.amortisationJahre ?? 0, 1)} Jahren. Nordbalkon und viel Schatten rechnen anders.`,
    h1: 'Lohnt sich ein Balkonkraftwerk 2026? Die Rechnung in Jahren',
    intro: `Ein Set mit 900 Wp für ${DE.eur(450)}, senkrecht nach Süden, spart einem Haushalt mit 2 500 kWh im Bundesmittel ${DE.eur(std.ersparnisJahr)} im Jahr und hat sich nach ${DE.num(std.amortisationJahre ?? 0, 1)} Jahren bezahlt. An der Nordseite dauert es ${DE.num(nord.amortisationJahre ?? 0, 1)} Jahre.`,
    resume: `Ob sich ein Balkonkraftwerk lohnt, entscheidet eine einfache Division: Kaufpreis geteilt durch die jährliche Ersparnis. Die Ersparnis ist der Strom, den der Haushalt selbst verbraucht, mal dem eigenen Strompreis; der Überschuss geht ohne Vergütung ins Netz. Mit 900 Wp senkrecht am Südgeländer erzeugt ein Gerät im Bundesmittel ${DE.num(std.ertrag)} kWh, davon nutzt ein Haushalt mit 2 500 kWh Verbrauch ${DE.num(std.selbst)} kWh selbst. Bei ${DE.num(STROMPREIS_CT, 1)} ct/kWh sind das ${DE.eur(std.ersparnisJahr)} im Jahr, ein Set für ${DE.eur(450)} ist nach ${DE.num(std.amortisationJahre ?? 0, 1)} Jahren bezahlt, eines für ${DE.eur(1000)} nach ${DE.num(preise[3].r.amortisationJahre ?? 0, 1)} Jahren. Über 20 Jahre summiert sich die Ersparnis auf ${DE.eur(std.summe)}. Nicht lohnend wird es, wenn mehrere Nachteile zusammenkommen: Nach Osten, mit 40 Prozent Schatten und nur 1 000 kWh Verbrauch spart dasselbe Gerät ${DE.eur(schlecht.ersparnisJahr)} im Jahr, ein Set für ${DE.eur(700)} braucht dann ${DE.num(schlecht.amortisationJahre ?? 0, 1)} Jahre.`,
    faqs: [
      { q: 'Nach wie vielen Jahren hat sich ein Balkonkraftwerk für 450 Euro bezahlt?', a: `Mit 900 Wp senkrecht nach Süden, 2 500 kWh Verbrauch und ${DE.num(STROMPREIS_CT, 1)} ct/kWh nach ${DE.num(std.amortisationJahre ?? 0, 1)} Jahren, gerechnet im Bundesmittel. Die Ersparnis beträgt ${DE.eur(std.ersparnisJahr)} im Jahr. Danach ist jede weitere Kilowattstunde Gewinn: Nach 20 Jahren bleiben ${DE.eur(std.gewinn)} Überschuss, wenn der Strompreis gleich bleibt. Steigt er um 2 Prozent im Jahr, sind es ${DE.eur(steigend.gewinn)}.` },
      { q: 'Lohnt sich ein Balkonkraftwerk für einen Single-Haushalt mit 1 000 kWh?', a: `Ja, aber langsamer. Mit 900 Wp senkrecht Süd nutzt ein Haushalt mit 1 000 kWh nur ${DE.num(v1000.selbst)} kWh selbst, weil tagsüber wenig läuft. Die Ersparnis sinkt auf ${DE.eur(v1000.ersparnisJahr)} im Jahr, das 450-Euro-Set braucht ${DE.num(v1000.amortisationJahre ?? 0, 1)} Jahre. Mit 5 000 kWh Verbrauch wären es ${DE.num(v5000.amortisationJahre ?? 0, 1)} Jahre. Grundlast wie Kühlschrank und Router zählt am meisten.` },
      { q: 'Rechnet sich ein Balkonkraftwerk an einem Nordbalkon?', a: `Kaum. Senkrecht nach Norden kommen im Bundesmittel nur ${DE.num(nord.ertrag)} kWh im Jahr zusammen, gegenüber ${DE.num(std.ertrag)} kWh nach Süden. Die Ersparnis liegt bei ${DE.eur(nord.ersparnisJahr)}, das 450-Euro-Set ist erst nach ${DE.num(nord.amortisationJahre ?? 0, 1)} Jahren bezahlt. Besser ist eine schräg gestellte Halterung auf einer Terrasse oder dem Garagendach mit Blick nach Süden, Osten oder Westen.` },
      { q: 'Lohnt sich das große Set mit 2 000 Wp und Speicher für 1 500 Euro?', a: `Im Modell ja: ${DE.num(P.balkon.max_wp)} Wp mit 35° nach Süden und 2 kWh Speicher decken bei 2 500 kWh Verbrauch ${DE.num(gross.selbst)} kWh, die Ersparnis liegt bei ${DE.eur(gross.ersparnisJahr)} im Jahr und das Paket ist nach ${DE.num(gross.amortisationJahre ?? 0, 1)} Jahren bezahlt. Voraussetzung sind Platz für die geneigte Montage und ein Speicher, der 20 Jahre hält; das tun viele Batterien nicht.` },
      { q: 'Welcher Strompreis macht ein Balkonkraftwerk wirtschaftlich?', a: `Je höher der Preis, desto schneller. Bei 30 ct/kWh spart das 900-Wp-Gerät ${DE.eur(strompreise[0].r.ersparnisJahr)} im Jahr (${DE.num(strompreise[0].r.amortisationJahre ?? 0, 1)} Jahre bis zum Ausgleich von 450 Euro), bei 45 ct/kWh ${DE.eur(strompreise[2].r.ersparnisJahr)} (${DE.num(strompreise[2].r.amortisationJahre ?? 0, 1)} Jahre). Wer einen dynamischen Tarif hat, rechnet mit seinem mittleren Tagespreis, weil der Balkonstrom tagsüber anfällt.` },
      { q: 'Bekomme ich für den Überschuss vom Balkon eine Vergütung?', a: `Nein. Ein Steckersolargerät ist nach § 8 Abs. 5a EEG der unentgeltlichen Abnahme zugeordnet: Was der Haushalt nicht verbraucht, nimmt der Netzbetreiber ohne Bezahlung ab. Im Beispiel sind das ${DE.num(std.einspeisung)} kWh im Jahr. Die Wirtschaftlichkeit hängt deshalb allein am selbst genutzten Strom, und genau den rechnet der Mini-Rechner oben.` },
    ],
    body: (h) => `
<h2>Die Formel hinter der Amortisation</h2>
<p>Ein Balkonkraftwerk verdient kein Geld, es vermeidet Strombezug. Jede Kilowattstunde, die Kühlschrank, Router, Waschmaschine oder Homeoffice direkt vom Balkon nehmen, steht nicht auf der Rechnung. Der Rest fließt durch den Zähler ins Netz und bringt nichts, denn ${h.src('eeg_8', '§ 8 Abs. 5a EEG')} ordnet Steckersolargeräte der unentgeltlichen Abnahme zu. Die Ersparnis im Jahr ist also selbst genutzter Strom mal Strompreis, die Amortisation Kaufpreis geteilt durch Ersparnis. Wie viel ein Haushalt im Moment der Erzeugung verbraucht, simuliert der Motor mit gemessenen Lastgängen von 74 Haushalten der ${h.src('htw_lastprofile', 'HTW Berlin')}, die Erzeugung kommt aus ${h.src('pvgis', 'PVGIS')}, der Strompreis von ${h.num(STROMPREIS_CT, 1)} ct/kWh aus der ${h.src('eurostat_strom', 'Eurostat-Statistik')} für deutsche Haushalte.</p>

<h2>Hebel eins: der Kaufpreis</h2>
${h.table(['Kaufpreis', 'Ersparnis im Jahr', 'Amortisation', 'Überschuss nach 20 Jahren'], preise.map(({ k, r }) => [h.eur(k), h.eur(r.ersparnisJahr), `${h.num(r.amortisationJahre ?? 0, 1)} Jahre`, h.eur(r.gewinn)]), `900 Wp senkrecht Süd, Bundesmittel, 2 500 kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh, Strompreis konstant.`, ['l', 'r', 'r', 'r'])}
<p>Der Preis wirkt linear: doppelter Preis, doppelte Wartezeit. Montagematerial gehört dazu, also Halterung, Kabel und gegebenenfalls eine Wieland-Steckdose vom Elektriker. Wer selbst montiert und eine einfache Geländerhalterung nutzt, bleibt meist in den ersten beiden Zeilen.</p>

<h2>Hebel zwei: wann Sie Strom verbrauchen</h2>
<p>Entscheidend ist nicht der Jahresverbrauch an sich, sondern was tagsüber läuft. Ein Haushalt mit 1 000 kWh nutzt vom selben Gerät ${h.num(v1000.selbst)} kWh, einer mit 2 500 kWh ${h.num(std.selbst)} kWh und einer mit 5 000 kWh ${h.num(v5000.selbst)} kWh. Wer tagsüber zu Hause arbeitet, die Spülmaschine mittags startet oder ein Aquarium betreibt, liegt eher oben. Wer werktags außer Haus ist, liegt eher unten; dann bringt eine Zeitschaltung für Waschmaschine und Trockner mehr als jedes zusätzliche Modul.</p>

<h2>Hebel drei: Himmelsrichtung und Schatten</h2>
${h.table(['Ausrichtung (senkrecht)', 'Erzeugung', 'Ersparnis', 'Amortisation bei 450 €'], richtungen.map((x) => [x.de, `${h.num(x.r.ertrag)} kWh`, h.eur(x.r.ersparnisJahr), `${h.num(x.r.amortisationJahre ?? 0, 1)} Jahre`]), '900 Wp, Bundesmittel, 2 500 kWh.', ['l', 'r', 'r', 'r'])}
<p>Süd und Südwest liegen fast gleichauf, Ost und West verlieren ein Drittel der Erzeugung, aber weniger an Ersparnis, weil Morgen- und Abendstrom öfter selbst verbraucht wird: nach Osten ${h.eur(ost.ersparnisJahr)} statt ${h.eur(std.ersparnisJahr)}. Die Nordseite fällt deutlich ab. Schatten von Nachbarhaus, Baum oder dem Balkon darüber wirkt wie ein Abschlag auf die Erzeugung; die Ausrichtung im Detail rechnet ${h.a('balkonkraftwerk-ausrichtung', 'Balkonkraftwerk Ausrichtung')}.</p>

<h2>Hebel vier: der Strompreis über die Jahre</h2>
<p>Bei konstantem Preis bringt das Beispielgerät in 20 Jahren ${h.eur(std.summe)}. Steigt der Strompreis um 2 Prozent im Jahr, sind es ${h.eur(steigend.summe)}. Umgekehrt verlängert ein günstiger Tarif die Amortisation: Wer 30 ct/kWh zahlt, wartet ${h.num(strompreise[0].r.amortisationJahre ?? 0, 1)} Jahre, wer 45 ct/kWh zahlt, ${h.num(strompreise[2].r.amortisationJahre ?? 0, 1)} Jahre.</p>

<h2>Wann es sich nicht lohnt</h2>
<p>Ein einzelner Nachteil reicht selten, um die Rechnung zu kippen. Kritisch wird es, wenn mehrere zusammenkommen: Ostbalkon, ein Baum davor, der 40 Prozent der Sonne nimmt, und ein Single-Haushalt, der tagsüber kaum Strom braucht. Dann spart ein Set für ${h.eur(700)} nur ${h.eur(schlecht.ersparnisJahr)} im Jahr und ist erst nach ${h.num(schlecht.amortisationJahre ?? 0, 1)} Jahren bezahlt. Auch ein geplanter Umzug in eine Wohnung ohne Balkon verlängert die Rechnung; was dann gilt, steht unter ${h.a('balkonkraftwerk-mieter', 'Balkonkraftwerk für Mieter')}. Teure Speicherpakete lohnen sich nur, wenn sie lange genug halten; den Vergleich rechnet ${h.a('balkonkraftwerk-mit-speicher', 'Balkonkraftwerk mit Speicher')}. Wer seinen Wohnort genau kennt, nutzt die Postleitzahl im Rechner, denn München erzeugt mit demselben Gerät ${h.pct(spanne, 0)} mehr als Flensburg: ${h.num(muenchen.ertrag)} statt ${h.num(flensburg.ertrag)} kWh (${h.a('balkonkraftwerk-ertrag', 'Balkonkraftwerk Ertrag')}).</p>

<h2>Was in der Rechnung fehlt</h2>
<p>Die Amortisation oben beschreibt gute Bedingungen, sie ist keine Garantie. Drei Dinge rechnet sie nicht mit. Erstens altern Module: Ihre Leistung sinkt über die Jahre leicht, das verschiebt den Ausgleich bei kurzen Amortisationszeiten kaum, schmälert aber den Überschuss nach 20 Jahren. Zweitens hält ein Wechselrichter oft nicht so lange wie die Module. Muss er nach einigen Jahren für angenommen ${h.eur(200)} ersetzt werden, steigt der Gesamtpreis im Beispiel auf ${h.eur(450 + 200)}, und die Amortisation verlängert sich auf ${h.num(defekt.amortisationJahre ?? 0, 1)} Jahre. Drittens zählt die eigene Arbeit nicht: Montage, Anmeldung im Register und gelegentliches Abwischen der Module kosten Zeit, aber kein Geld.</p>
<p>Umgekehrt gibt es Effekte zu Ihren Gunsten, die ebenfalls nicht enthalten sind. Mit 2 Prozent Preissteigerung im Jahr ist der Kaufpreis im Beispiel in Jahr ${h.num(jahrAusgleich)} wieder hereingeholt. Und wer Verbraucher bewusst in die Mittagsstunden legt, hebt den selbst genutzten Anteil über den Durchschnitt der gemessenen Haushalte.</p>

<h2>So prüfen Sie Ihre eigene Rechnung</h2>
<p>Nehmen Sie die letzte Jahresabrechnung: Dort stehen Verbrauch und Arbeitspreis in Cent je Kilowattstunde, ohne Grundpreis, denn den zahlen Sie weiter. Tragen Sie beides und den Preis des Angebots in den Mini-Rechner ein. Liegt das Ergebnis unter fünf Jahren, ist das Gerät in fast jedem denkbaren Fall ein gutes Geschäft. Zwischen fünf und zehn Jahren lohnt ein zweiter Blick auf Schatten und Montageort. Darüber hilft oft schon eine andere Stelle am Haus mehr als ein günstigeres Set.</p>`,
  },
  en: {
    slug: 'is-plug-in-solar-worth-it',
    nav: 'Is plug-in solar worth it?',
    card: 'Payback by purchase price, consumption, direction and power price, and the cases where it does not add up.',
    title: 'Is Plug-in Solar Worth It in Germany 2026? Payback in Years',
    description: `Is plug-in solar worth it in Germany 2026? Usually: 900 Wp upright south saves ${EN.eur(std.ersparnisJahr)} a year and pays back in ${EN.num(std.amortisationJahre ?? 0, 1)} years. North side, shade and low use differ.`,
    h1: 'Is a balcony solar kit worth it in 2026? The sum in years',
    intro: `A 900 Wp kit costing ${EN.eur(450)}, hung upright facing south, saves a household using 2,500 kWh ${EN.eur(std.ersparnisJahr)} a year on the German average and pays for itself after ${EN.num(std.amortisationJahre ?? 0, 1)} years. On a north side it takes ${EN.num(nord.amortisationJahre ?? 0, 1)} years.`,
    resume: `Whether a balcony power plant (Balkonkraftwerk) is worth it comes down to one division: purchase price divided by the annual saving. The saving is the power the household uses itself, times its own electricity price; the surplus goes to the grid without payment. With 900 Wp upright on a south-facing railing, a device produces ${EN.num(std.ertrag)} kWh on the German average, of which a household using 2,500 kWh consumes ${EN.num(std.selbst)} kWh itself. At ${EN.num(STROMPREIS_CT, 1)} ct/kWh that is ${EN.eur(std.ersparnisJahr)} a year, so a kit costing ${EN.eur(450)} pays back after ${EN.num(std.amortisationJahre ?? 0, 1)} years and one costing ${EN.eur(1000)} after ${EN.num(preise[3].r.amortisationJahre ?? 0, 1)} years. Over 20 years the saving adds up to ${EN.eur(std.summe)}. It stops paying when several drawbacks combine: facing east, with 40 per cent shade and only 1,000 kWh of consumption, the same device saves ${EN.eur(schlecht.ersparnisJahr)} a year, and a kit costing ${EN.eur(700)} then needs ${EN.num(schlecht.amortisationJahre ?? 0, 1)} years.`,
    faqs: [
      { q: 'How many years until a 450 euro balcony kit pays for itself?', a: `With 900 Wp upright facing south, 2,500 kWh of consumption and ${EN.num(STROMPREIS_CT, 1)} ct/kWh, after ${EN.num(std.amortisationJahre ?? 0, 1)} years on the German average. The saving is ${EN.eur(std.ersparnisJahr)} a year. After that every kilowatt-hour is profit: after 20 years ${EN.eur(std.gewinn)} remain if the power price stays flat. If it rises by 2 per cent a year, it is ${EN.eur(steigend.gewinn)}.` },
      { q: 'Is plug-in solar worth it for a single person using 1,000 kWh?', a: `Yes, but more slowly. With 900 Wp upright south, a household using 1,000 kWh consumes only ${EN.num(v1000.selbst)} kWh itself, because little runs during the day. The saving drops to ${EN.eur(v1000.ersparnisJahr)} a year and the 450 euro kit needs ${EN.num(v1000.amortisationJahre ?? 0, 1)} years. At 5,000 kWh it would be ${EN.num(v5000.amortisationJahre ?? 0, 1)} years. Base load such as the fridge and router counts most.` },
      { q: 'Does a balcony kit pay off on a north-facing balcony?', a: `Hardly. Upright facing north, the German average gives only ${EN.num(nord.ertrag)} kWh a year, against ${EN.num(std.ertrag)} kWh facing south. The saving is ${EN.eur(nord.ersparnisJahr)} and the 450 euro kit only pays back after ${EN.num(nord.amortisationJahre ?? 0, 1)} years. A tilted stand on a terrace or garage roof facing south, east or west is the better option.` },
      { q: 'Is the large 2,000 Wp kit with battery for 1,500 euros worth it?', a: `In the model, yes: ${EN.num(P.balkon.max_wp)} Wp tilted 35° south with a 2 kWh battery covers ${EN.num(gross.selbst)} kWh of a 2,500 kWh household, saving ${EN.eur(gross.ersparnisJahr)} a year and paying back after ${EN.num(gross.amortisationJahre ?? 0, 1)} years. It needs space for a tilted mounting and a battery that lasts 20 years, which many batteries do not.` },
      { q: 'What electricity price makes plug-in solar pay?', a: `The higher the price, the faster. At 30 ct/kWh the 900 Wp device saves ${EN.eur(strompreise[0].r.ersparnisJahr)} a year (${EN.num(strompreise[0].r.amortisationJahre ?? 0, 1)} years to recover 450 euros), at 45 ct/kWh ${EN.eur(strompreise[2].r.ersparnisJahr)} (${EN.num(strompreise[2].r.amortisationJahre ?? 0, 1)} years). On a dynamic tariff, use your average daytime price, because balcony power arrives during the day.` },
      { q: 'Do I get paid for surplus power from my balcony?', a: `No. Under section 8(5a) EEG a plug-in device is assigned to unpaid acceptance (unentgeltliche Abnahme): whatever the household does not use, the grid operator takes without payment. In the example that is ${EN.num(std.einspeisung)} kWh a year. The economics therefore rest entirely on the power you use yourself, which is exactly what the mini calculator above works out.` },
    ],
    body: (h) => `
<h2>The formula behind payback</h2>
<p>A balcony kit does not earn money; it avoids buying power. Every kilowatt-hour that the fridge, router, washing machine or home office takes straight from the balcony does not appear on the bill. The rest flows through the meter to the grid and earns nothing, because ${h.src('eeg_8', 'section 8(5a) EEG')} assigns plug-in devices to unpaid acceptance. The annual saving is therefore self-used power times the electricity price, and payback is price divided by saving. How much a household consumes at the moment of generation is simulated by the engine with metered load profiles of 74 households from ${h.src('htw_lastprofile', 'HTW Berlin')}; generation comes from ${h.src('pvgis', 'PVGIS')}, and the power price of ${h.num(STROMPREIS_CT, 1)} ct/kWh from the ${h.src('eurostat_strom', 'Eurostat statistics')} for German households.</p>

<h2>Lever one: the purchase price</h2>
${h.table(['Purchase price', 'Saving per year', 'Payback', 'Net gain after 20 years'], preise.map(({ k, r }) => [h.eur(k), h.eur(r.ersparnisJahr), `${h.num(r.amortisationJahre ?? 0, 1)} years`, h.eur(r.gewinn)]), `900 Wp upright south, German average, 2,500 kWh, ${h.num(STROMPREIS_CT, 1)} ct/kWh, flat power price.`, ['l', 'r', 'r', 'r'])}
<p>Price works linearly: double the price, double the wait. Mounting material belongs in it, meaning brackets, cable and, where wanted, a dedicated Wieland socket fitted by an electrician. If you mount it yourself on a simple railing bracket, you usually stay in the first two rows.</p>

<h2>Lever two: when you use power</h2>
<p>What matters is not annual consumption as such but what runs in daylight. A household using 1,000 kWh takes ${h.num(v1000.selbst)} kWh from the same device, one using 2,500 kWh ${h.num(std.selbst)} kWh and one using 5,000 kWh ${h.num(v5000.selbst)} kWh. If you work from home, start the dishwasher at noon or run an aquarium, you are near the top. If you are out on weekdays, you are near the bottom; a timer for washing machine and dryer then does more than any extra panel.</p>

<h2>Lever three: direction and shade</h2>
${h.table(['Facing (upright)', 'Output', 'Saving', 'Payback at 450 €'], richtungen.map((x) => [x.en, `${h.num(x.r.ertrag)} kWh`, h.eur(x.r.ersparnisJahr), `${h.num(x.r.amortisationJahre ?? 0, 1)} years`]), '900 Wp, German average, 2,500 kWh.', ['l', 'r', 'r', 'r'])}
<p>South and south-west are almost level; east and west lose a third of output but less of the saving, because morning and evening power is used at home more often: facing east ${h.eur(ost.ersparnisJahr)} instead of ${h.eur(std.ersparnisJahr)}. The north side falls far behind. Shade from the house opposite, a tree or the balcony above acts as a deduction from output; orientation in detail is covered under ${h.a('balkonkraftwerk-ausrichtung', 'plug-in solar orientation')}.</p>

<h2>Lever four: the power price over the years</h2>
<p>At a flat price the example device brings ${h.eur(std.summe)} over 20 years. If the power price rises by 2 per cent a year, it is ${h.eur(steigend.summe)}. Conversely a cheap tariff stretches payback: at 30 ct/kWh you wait ${h.num(strompreise[0].r.amortisationJahre ?? 0, 1)} years, at 45 ct/kWh ${h.num(strompreise[2].r.amortisationJahre ?? 0, 1)} years.</p>

<h2>When it does not pay</h2>
<p>A single drawback rarely tips the sum. It becomes critical when several combine: an east balcony, a tree in front that takes 40 per cent of the sun, and a single household that barely uses power in daylight. A kit costing ${h.eur(700)} then saves only ${h.eur(schlecht.ersparnisJahr)} a year and pays back after ${h.num(schlecht.amortisationJahre ?? 0, 1)} years. A planned move to a flat without a balcony also stretches the sum; what applies then is under ${h.a('balkonkraftwerk-mieter', 'plug-in solar for tenants')}. Expensive battery bundles only pay if they last long enough; the comparison is under ${h.a('balkonkraftwerk-mit-speicher', 'plug-in solar with battery')}. If you know your location, use the postcode in the calculator, since the same device in Munich produces ${h.pct(spanne, 0)} more than in Flensburg: ${h.num(muenchen.ertrag)} instead of ${h.num(flensburg.ertrag)} kWh (${h.a('balkonkraftwerk-ertrag', 'plug-in solar yield')}).</p>

<h2>What the sum leaves out</h2>
<p>The payback above describes good conditions; it is not a guarantee. Three things are not in it. First, panels age: their output declines slightly over the years, which barely shifts break-even when payback is short but trims the net gain after 20 years. Second, an inverter often does not last as long as the panels. If it has to be replaced after some years for an assumed ${h.eur(200)}, the total price in the example rises to ${h.eur(450 + 200)} and payback stretches to ${h.num(defekt.amortisationJahre ?? 0, 1)} years. Third, your own work is not counted: mounting, registering and the odd wipe of the panels cost time, not money.</p>
<p>On the other hand, some effects in your favour are left out too. With power prices rising 2 per cent a year, the example recovers its price in year ${h.num(jahrAusgleich)}. And if you deliberately shift appliances to midday, you raise your self-used share above the average of the metered households.</p>

<h2>How to check your own numbers</h2>
<p>Take your last annual bill (Jahresabrechnung): it shows consumption and the unit price (Arbeitspreis) in cents per kilowatt-hour, without the standing charge, which you keep paying anyway. Enter both and the price of the offer into the mini calculator. Under five years, the device is a good deal in almost any case. Between five and ten years, take a second look at shade and mounting spot. Above that, a different place on the building often helps more than a cheaper kit.</p>`,
  },
});

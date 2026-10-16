import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { AKTUELL, mischsatz } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/** Beispiele aus dem Motor: 10 kWp in Köln, Süd 30°, 4 000 kWh, ohne und mit 8 kWh Speicher, mit und ohne Smart Meter. */
const koeln = ortVonPlz('50667')!;
const base = { ort: koeln, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, modus: 'teil' as const, preisCt: STROMPREIS_CT, kostenEur: 15000 };
const ohne = rechnePv({ ...base, speicherKwh: 0, smartMeter: false });
const mitSp = rechnePv({ ...base, speicherKwh: 8, smartMeter: false, kostenEur: 21000 });
const sm = rechnePv({ ...base, speicherKwh: 0, smartMeter: true });
const voll = rechnePv({ ...base, speicherKwh: 0, smartMeter: false, modus: 'voll' });
const s10 = mischsatz(AKTUELL, 10, 'teil'), s15 = mischsatz(AKTUELL, 15, 'teil');

export default defineGuide({
  id: 'photovoltaik-rechner',
  group: 'pv',
  order: 10,
  tool: 'pv',
  related: ['stromspeicher-rechner', 'einspeiseverguetung', 'wie-viel-kwp', 'solarspitzengesetz', 'photovoltaik-lohnt-sich', 'pv-ertrag-plz'],
  sources: ['pvgis', 'bnetza_saetze', 'eeg_9', 'eeg_48', 'eeg_51', 'estg_3', 'ustg_12'],
  de: {
    slug: 'photovoltaik-rechner',
    nav: 'Photovoltaik-Rechner',
    card: 'Dachanlage mit Eigenverbrauch, Einspeisevergütung des Zeitraums und 60-%-Grenze, für Ihre Postleitzahl.',
    title: 'PV-Rechner 2026: Photovoltaik-Ertrag, Vergütung, Ersparnis',
    description: `Photovoltaik-Rechner 2026 nach PLZ: Ertrag laut PVGIS, Eigenverbrauch, Vergütung ${DE.ct(s10)} bis 10 kWp, 60-%-Grenze und Amortisation, ohne jede Anfrage.`,
    h1: 'Photovoltaik-Rechner 2026: was Ihre Dachanlage bringt',
    intro: `Eine 10-kWp-Anlage in Köln bringt ${DE.eur(ohne.nutzenJahr)} im Jahr und hat sich nach ${DE.num(ohne.amortisationJahre ?? 0, 1)} Jahren bezahlt, wenn sie ${DE.eur(15000)} kostet. Rechnen Sie Ihr Dach.`,
    resume: `Der Photovoltaik-Rechner verbindet drei Dinge, die Angebotsrechner meist trennen. Erstens den Ertrag am eigenen Ort: PVGIS der EU-Kommission für Ihre Postleitzahl, umgerechnet auf Neigung und Himmelsrichtung, in Köln ${DE.num(ohne.spez)} kWh je kWp bei 30° Süd. Zweitens den Eigenverbrauch aus einer Viertelstunden-Simulation mit 74 gemessenen Haushalten: Von ${DE.num(ohne.ertrag)} kWh einer 10-kWp-Anlage nutzt ein Haushalt mit 4 000 kWh ${DE.pct(ohne.eigenAnteil)} selbst, mit 8 kWh Speicher ${DE.pct(mitSp.eigenAnteil)}. Drittens die Regeln für Neuanlagen ab dem 1. August 2026: ${DE.ct(s10)} Einspeisevergütung bis 10 kWp, über 10 kWp anteilig weniger, Einspeisung ohne Smart Meter höchstens 60 Prozent der Leistung, und mit Smart Meter keine Vergütung bei negativen Börsenpreisen. Der Nutzen ist die Summe aus gesparter Stromrechnung und Vergütung, die Amortisation der Kaufpreis geteilt durch diesen Nutzen.`,
    faqs: [
      { q: 'Wie viel bringt eine 10-kWp-Anlage im Jahr?', a: `In Köln, nach Süden mit 30° Neigung, rund ${DE.num(ohne.ertrag)} kWh. Bei 4 000 kWh Verbrauch nutzt der Haushalt ${DE.num(ohne.selbst)} kWh selbst und spart ${DE.eur(ohne.ersparnisJahr)}, ${DE.num(ohne.einspeisung)} kWh gehen für ${DE.eur(ohne.verguetungJahr)} ins Netz. Zusammen ${DE.eur(ohne.nutzenJahr)} im Jahr. In München liegt der Ertrag um rund zehn Prozent höher, in Hamburg niedriger.` },
      { q: 'Lohnt sich ein Smart Meter für eine neue Anlage?', a: `Er hebt die 60-Prozent-Grenze auf, kostet aber die Vergütung bei negativen Preisen. In Köln mit 10 kWp verliert die Anlage ohne Smart Meter ${DE.num(ohne.abgeregelt)} kWh durch die Grenze, mit Smart Meter entfallen rechnerisch ${DE.eur(sm.negVerlustJahr)} Vergütung im Jahr; diese Viertelstunden werden zur Hälfte am Ende der 20 Jahre angehängt (§ 51a EEG).` },
      { q: 'Warum ist die Vergütung über 10 kWp niedriger?', a: `Die Sätze sind gestaffelt: bis 10 kW ${DE.ct(AKTUELL.teil[0])}, für den Teil bis 40 kW ${DE.ct(AKTUELL.teil[1])}. Eine 15-kWp-Anlage bekommt deshalb einen Mischsatz von ${DE.ct(s15)}: zwei Drittel der Leistung zum ersten, ein Drittel zum zweiten Satz. Der Rechner rechnet diesen Mischsatz für jede Größe.` },
      { q: 'Teileinspeisung oder Volleinspeisung?', a: `Das hängt vom Verhältnis zwischen Anlage und Verbrauch ab. In Köln bringt die 10-kWp-Anlage bei 4 000 kWh als Teileinspeisung ${DE.eur(ohne.nutzenJahr)} im Jahr, als Volleinspeisung zum Satz von ${DE.ct(voll.satzCt)} ${DE.eur(voll.nutzenJahr)}. Je größer das Dach im Verhältnis zum Verbrauch, desto eher gewinnt die Volleinspeisung; ein Speicher, eine Wärmepumpe oder ein E-Auto sprechen für die Teileinspeisung. Der Rechner zeigt beide Fälle.` },
    ],
    body: (h) => `
<h2>Was der Rechner rechnet</h2>
<p>Aus der Postleitzahl liest der Rechner den PVGIS-Ertrag einer 35° nach Süden geneigten Anlage und rechnet ihn auf Ihre Dachneigung und Ausrichtung um; ein Ost-West-Dach wird je zur Hälfte nach Osten und Westen gerechnet. Dann wird jede Viertelstunde eines Jahres simuliert: erst der Haushalt, dann der Speicher, dann das Netz. Für Anlagen, die ab dem ${h.date(P.solarspitzen.stichtag)} in Betrieb gehen und keinen Smart Meter haben, gilt die Begrenzung der Einspeisung auf ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} der Nennleistung (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}): Was darüber liegt und nicht im Haus gebraucht oder gespeichert wird, verfällt.</p>
<p>Die Vergütung ist die des Zeitraums Ihrer Inbetriebnahme laut ${h.src('bnetza_saetze', 'Bundesnetzagentur')}, anteilig nach Leistung. Steuern spielen bei Anlagen bis ${h.num(P.steuer.estg_kwp_je_einheit)} kWp je Wohneinheit keine Rolle: Die Einnahmen sind einkommensteuerfrei (${h.src('estg_3', '§ 3 Nr. 72 EStG')}), und auf Kauf und Montage fällt keine Umsatzsteuer an (${h.src('ustg_12', '§ 12 Abs. 3 UStG')}).</p>

<h2>Das Beispiel Köln</h2>
${h.table(['', 'ohne Speicher', 'mit 8 kWh Speicher'], [
  ['Erzeugung', `${h.num(ohne.ertrag)} kWh`, `${h.num(mitSp.ertrag)} kWh`],
  ['selbst genutzt', `${h.num(ohne.selbst)} kWh (${h.pct(ohne.eigenAnteil, 0)})`, `${h.num(mitSp.selbst)} kWh (${h.pct(mitSp.eigenAnteil, 0)})`],
  ['eingespeist', `${h.num(ohne.einspeisung)} kWh`, `${h.num(mitSp.einspeisung)} kWh`],
  ['durch 60-%-Grenze verloren', `${h.num(ohne.abgeregelt)} kWh`, `${h.num(mitSp.abgeregelt)} kWh`],
  ['Nutzen im Jahr', h.eur(ohne.nutzenJahr), h.eur(mitSp.nutzenJahr)],
  ['Kosten (Annahme)', h.eur(15000), h.eur(21000)],
  ['Amortisation', `${h.num(ohne.amortisationJahre ?? 0, 1)} Jahre`, `${h.num(mitSp.amortisationJahre ?? 0, 1)} Jahre`],
], `10 kWp, Süd 30°, Verbrauch 4 000 kWh, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh, Inbetriebnahme ab ${h.date(AKTUELL.von)}, kein Smart Meter.`, ['l', 'r', 'r'])}
<p>Der Speicher verdoppelt fast den selbst genutzten Strom, aber jede gespeicherte Kilowattstunde bringt nur den Unterschied zwischen Strompreis und Vergütung. Ob er sich lohnt, entscheidet sein Preis; der ${h.a('stromspeicher-rechner', 'Stromspeicher-Rechner')} rechnet das getrennt. Die Kosten sind Annahmen: Tragen Sie Ihr Angebot ein, denn Preise je kWp unterscheiden sich stark nach Dach, Region und Ausstattung.</p>

<h2>Grenzen der Rechnung</h2>
<p>Verschattung durch Gauben, Kamine oder Bäume ist nicht enthalten; jede Stunde Schatten mittags kostet mehr als morgens. Wärmepumpe und Elektroauto verschieben den Verbrauch, und die gemessenen Haushalte von 2010 hatten beides kaum. Wer eines davon plant, rechnet mit höherem Verbrauch und prüft das Ergebnis mit dem ${h.a('wie-viel-kwp', 'Größenrechner')}. Für die Regeln ab 2027 gilt: Der Gesetzentwurf ist noch nicht beschlossen, gerechnet wird mit dem geltenden EEG 2023; was geplant ist, steht unter ${h.a('einspeiseverguetung-2027', 'Einspeisevergütung 2027')}.</p>`,
  },
  en: {
    slug: 'solar-pv-calculator',
    nav: 'Rooftop PV calculator',
    card: 'Rooftop system with self-consumption, the period’s feed-in tariff and the 60% limit, for your postcode.',
    title: 'Solar PV Calculator Germany 2026: Yield, Tariff, Payback',
    description: `Solar PV calculator for Germany 2026 by postcode: PVGIS yield, self-consumption, feed-in tariff ${EN.ct(s10)} up to 10 kWp, 60% limit and payback, no quotes.`,
    h1: 'Solar PV calculator 2026: what your German rooftop system earns',
    intro: `A 10 kWp system in Cologne earns ${EN.eur(ohne.nutzenJahr)} a year and pays for itself after ${EN.num(ohne.amortisationJahre ?? 0, 1)} years if it costs ${EN.eur(15000)}. Work out your own roof.`,
    resume: `This rooftop PV calculator combines three things that quote-driven calculators usually keep apart. First, the yield at your own location: the European Commission's PVGIS value for your postcode, converted to your tilt and direction, which in Cologne is ${EN.num(ohne.spez)} kWh per kWp at 30° south. Second, self-consumption from a quarter-hour simulation with 74 metered German households: of the ${EN.num(ohne.ertrag)} kWh from a 10 kWp system, a household using 4,000 kWh uses ${EN.pct(ohne.eigenAnteil)} itself, or ${EN.pct(mitSp.eigenAnteil)} with an 8 kWh battery. Third, the rules for systems commissioned from 1 August 2026: a feed-in tariff (Einspeisevergütung) of ${EN.ct(s10)} up to 10 kWp, a little less above that, feed-in capped at 60 per cent of rated output without a smart meter, and no payment at negative wholesale prices with one. The benefit is the saving on your bill plus the feed-in payment; payback is the price divided by that benefit.`,
    faqs: [
      { q: 'How much does a 10 kWp system produce in Germany?', a: `In Cologne, facing south at 30°, about ${EN.num(ohne.ertrag)} kWh a year. At 4,000 kWh of consumption the household uses ${EN.num(ohne.selbst)} kWh itself and saves ${EN.eur(ohne.ersparnisJahr)}, while ${EN.num(ohne.einspeisung)} kWh go to the grid for ${EN.eur(ohne.verguetungJahr)}. Together ${EN.eur(ohne.nutzenJahr)} a year. Munich yields roughly ten per cent more, Hamburg less.` },
      { q: 'Is a smart meter worth it for a new system?', a: `It lifts the 60 per cent cap but costs the payment at negative prices. With 10 kWp in Cologne, the system loses ${EN.num(ohne.abgeregelt)} kWh to the cap without a smart meter; with one, about ${EN.eur(sm.negVerlustJahr)} of payment a year falls away, half of which is added back at the end of the 20 years (section 51a EEG).` },
      { q: 'Why is the tariff lower above 10 kWp?', a: `Rates are tiered: up to 10 kW ${EN.ct(AKTUELL.teil[0])}, for the part up to 40 kW ${EN.ct(AKTUELL.teil[1])}. A 15 kWp system therefore receives a blended rate of ${EN.ct(s15)}: two thirds of its capacity at the first rate, one third at the second. The calculator works out this blend for any size.` },
      { q: 'Surplus feed-in or full feed-in?', a: `It depends on how big the system is compared with your consumption. In Cologne the 10 kWp system earns ${EN.eur(ohne.nutzenJahr)} a year as surplus feed-in at 4,000 kWh, and ${EN.eur(voll.nutzenJahr)} as full feed-in at ${EN.ct(voll.satzCt)}. The larger the roof relative to consumption, the more likely full feed-in wins; a battery, heat pump or electric car favour surplus feed-in. The calculator shows both.` },
    ],
    body: (h) => `
<h2>What the calculator works out</h2>
<p>From the postcode, the calculator reads the PVGIS yield of a system tilted 35° to the south and converts it to your roof pitch and orientation; an east-west roof counts as half east, half west. It then simulates every quarter-hour of a year: home first, then battery, then grid. For systems commissioned from ${h.date(P.solarspitzen.stichtag)} without a smart meter, feed-in is capped at ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of rated output (${h.src('eeg_9', 'section 9(2) EEG')}): whatever exceeds it and is neither used nor stored is lost.</p>
<p>The payment is the rate for your commissioning period according to the ${h.src('bnetza_saetze', 'Federal Network Agency')}, weighted by capacity. Tax does not come into it for systems up to ${h.num(P.steuer.estg_kwp_je_einheit)} kWp per dwelling: the income is exempt from income tax (${h.src('estg_3', 'section 3 no. 72 Income Tax Act')}) and no VAT is charged on purchase and installation (${h.src('ustg_12', 'section 12(3) VAT Act')}).</p>

<h2>The Cologne example</h2>
${h.table(['', 'no battery', 'with 8 kWh battery'], [
  ['Output', `${h.num(ohne.ertrag)} kWh`, `${h.num(mitSp.ertrag)} kWh`],
  ['Used at home', `${h.num(ohne.selbst)} kWh (${h.pct(ohne.eigenAnteil, 0)})`, `${h.num(mitSp.selbst)} kWh (${h.pct(mitSp.eigenAnteil, 0)})`],
  ['Fed in', `${h.num(ohne.einspeisung)} kWh`, `${h.num(mitSp.einspeisung)} kWh`],
  ['Lost to the 60% cap', `${h.num(ohne.abgeregelt)} kWh`, `${h.num(mitSp.abgeregelt)} kWh`],
  ['Benefit per year', h.eur(ohne.nutzenJahr), h.eur(mitSp.nutzenJahr)],
  ['Cost (assumed)', h.eur(15000), h.eur(21000)],
  ['Payback', `${h.num(ohne.amortisationJahre ?? 0, 1)} years`, `${h.num(mitSp.amortisationJahre ?? 0, 1)} years`],
], `10 kWp, south 30°, consumption 4,000 kWh, price ${h.num(STROMPREIS_CT, 1)} ct/kWh, commissioned from ${h.date(AKTUELL.von)}, no smart meter.`, ['l', 'r', 'r'])}
<p>The battery almost doubles the self-used power, but each stored kilowatt-hour only earns the gap between your electricity price and the feed-in tariff. Whether it pays depends on its price; the ${h.a('stromspeicher-rechner', 'home battery calculator')} works that out separately. The costs are assumptions: enter your quote, because prices per kWp vary a lot by roof, region and equipment.</p>

<h2>Limits of the calculation</h2>
<p>Shading from dormers, chimneys or trees is not included; an hour of shade at midday costs more than in the morning. A heat pump or electric car shifts consumption, and the households metered in 2010 hardly had either. If you plan one, enter a higher consumption and check the result with the ${h.a('wie-viel-kwp', 'sizing calculator')}. As for the rules from 2027: the bill has not been passed, so the current EEG 2023 applies here; what is planned is under ${h.a('einspeiseverguetung-2027', 'feed-in tariff 2027')}.</p>`,
  },
});

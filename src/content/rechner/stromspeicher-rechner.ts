import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { ortVonPlz } from '../../lib/engine/standort';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Beispiele aus dem Motor: Dresden (01067), 8 kWp Süd 30°, Teileinspeisung ohne Smart Meter, 4 500 kWh Verbrauch,
 * Speicher 0 bis 12 kWh. Der Speicherpreis von 6 000 € ist eine Annahme (Startwert des Rechners).
 */
const dd = ortVonPlz('01067')!;
const KWP = 8, VB = 4500, SP = 8, PREIS_SP = 6000;
const basis = { ort: dd, kwp: KWP, neigung: 30, azimut: 0, verbrauchKwh: VB, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 0 };
const run = (o: Partial<typeof basis> & { speicherKwh: number }) => rechnePv({ ...basis, ...o });
const ohne = run({ speicherKwh: 0 });
const mit = run({ speicherKwh: SP });
const plus = mit.nutzenJahr - ohne.nutzenJahr;
const amort = PREIS_SP / plus;
const reihe = [0, 2, 4, 6, 8, 10, 12].map((s) => ({ s, r: run({ speicherKwh: s }) }));
const r6 = reihe.find((x) => x.s === 6)!.r, r10 = reihe.find((x) => x.s === 10)!.r, r12 = reihe.find((x) => x.s === 12)!.r;
/** Wert einer verschobenen Kilowattstunde: Strompreis minus Vergütung. */
const spanne = STROMPREIS_CT - ohne.satzCt;
/** Kleiner Haushalt mit 3 000 kWh, gleicher Speicher. */
const k0 = run({ verbrauchKwh: 3000, speicherKwh: 0 }), k8 = run({ verbrauchKwh: 3000, speicherKwh: SP });
const plusKlein = k8.nutzenJahr - k0.nutzenJahr;
/** Haushalt mit Wärmepumpe oder E-Auto, 7 000 kWh, 10 kWp. */
const w0 = run({ kwp: 10, verbrauchKwh: 7000, speicherKwh: 0 }), w8 = run({ kwp: 10, verbrauchKwh: 7000, speicherKwh: SP });
const plusGross = w8.nutzenJahr - w0.nutzenJahr;
const rundweg = P.speicher.eta_richtung * P.speicher.eta_richtung;

export default defineGuide({
  id: 'stromspeicher-rechner',
  group: 'speicher',
  order: 10,
  tool: 'speicher',
  related: ['stromspeicher-groesse', 'photovoltaik-rechner', 'wie-viel-kwp', 'balkonkraftwerk-mit-speicher', 'negative-strompreise', 'amortisation-photovoltaik'],
  sources: ['htw_lastprofile', 'pvgis', 'bnetza_saetze', 'eeg_9', 'ustg_12'],
  de: {
    slug: 'stromspeicher-rechner',
    nav: 'Stromspeicher-Rechner',
    card: 'Dieselbe Dachanlage mit und ohne Batterie: Eigenverbrauch, Autarkie, Mehrnutzen und Amortisation des Speichers.',
    title: 'Stromspeicher-Rechner 2026: lohnt sich der PV-Speicher?',
    description: `Stromspeicher-Rechner 2026 für Ihre Dachanlage: Eigenverbrauch und Autarkie mit 0 bis 12 kWh, Mehrnutzen gegen ${DE.ct(ohne.satzCt)} Vergütung, Amortisation nach PLZ.`,
    h1: 'Stromspeicher-Rechner 2026: was die Batterie an der Dachanlage bringt',
    intro: `Ein ${DE.num(SP)}-kWh-Speicher an einer ${DE.num(KWP)}-kWp-Anlage in Dresden hebt die Autarkie eines Haushalts mit ${DE.num(VB)} kWh von ${DE.pct(ohne.autarkie)} auf ${DE.pct(mit.autarkie)} und bringt ${DE.eur(plus)} mehr im Jahr. Bei ${DE.eur(PREIS_SP)} hat er sich nach ${DE.num(amort, 1)} Jahren bezahlt.`,
    resume: `Ob sich ein Stromspeicher lohnt, entscheidet nicht die Autarkie, sondern eine einfache Spanne: Jede Kilowattstunde, die der Speicher vom Mittag in den Abend verschiebt, spart den Bezugspreis von ${DE.num(STROMPREIS_CT, 1)} ct, verliert aber die Einspeisevergütung von ${DE.ct(ohne.satzCt)}. Übrig bleiben rund ${DE.num(spanne, 1)} ct, abzüglich der Verluste beim Laden und Entladen. Der Rechner simuliert dafür jede Viertelstunde eines Jahres mit PVGIS-Erträgen für Ihre Postleitzahl und 74 gemessenen Haushaltsprofilen der HTW Berlin. Im Beispiel Dresden mit ${DE.num(KWP)} kWp nach Süden und ${DE.num(VB)} kWh Verbrauch steigt der Eigenverbrauch mit ${DE.num(SP)} kWh von ${DE.pct(ohne.eigenAnteil)} auf ${DE.pct(mit.eigenAnteil)} des Ertrags. Der Nutzen der Anlage wächst von ${DE.eur(ohne.nutzenJahr)} auf ${DE.eur(mit.nutzenJahr)} im Jahr. Diese ${DE.eur(plus)} muss der Speicher über seine Lebensdauer verdienen; ob das gelingt, hängt am Preis, den Sie in den Rechner eintragen.`,
    faqs: [
      { q: 'Wie viel Autarkie bringt ein 8-kWh-Speicher an 8 kWp?', a: `In Dresden, Süddach 30°, bei ${DE.num(VB)} kWh Verbrauch steigt die Autarkie von ${DE.pct(ohne.autarkie)} ohne Batterie auf ${DE.pct(mit.autarkie)}. Der Haushalt kauft dann nur noch ${DE.num(VB - mit.selbst)} kWh im Jahr zu statt ${DE.num(VB - ohne.selbst)} kWh. Vollständig autark wird kein Haus mit Solarstrom allein, weil im Dezember und Januar der Ertrag den Bedarf nicht deckt.` },
      { q: 'Ab wann bringt ein größerer Stromspeicher kaum noch etwas?', a: `Im Beispiel Dresden ab etwa ${DE.num(6)} bis ${DE.num(SP)} kWh. Von ${DE.num(6)} auf ${DE.num(SP)} kWh wächst der Nutzen um ${DE.eur(mit.nutzenJahr - r6.nutzenJahr)}, von ${DE.num(10)} auf ${DE.num(12)} kWh nur noch um ${DE.eur(r12.nutzenJahr - r10.nutzenJahr)} im Jahr. Ein Haushalt mit ${DE.num(VB)} kWh verbraucht abends und nachts selten mehr, als ein mittelgroßer Speicher hält. Die Tabelle im Rechner zeigt die Kurve für Ihre Zahlen.` },
      { q: 'Lohnt sich ein Stromspeicher auch bei 3 000 kWh Verbrauch?', a: `Weniger als bei einem großen Haushalt. Mit ${DE.num(KWP)} kWp und ${DE.num(SP)} kWh in Dresden bringt der Speicher bei ${DE.num(3000)} kWh Verbrauch ${DE.eur(plusKlein)} im Jahr, bei ${DE.num(VB)} kWh ${DE.eur(plus)}. Der kleine Haushalt kann abends weniger aus der Batterie abrufen, sie bleibt öfter halb voll. Hier passt eher eine kleinere Kapazität; der Rechner zeigt, welche.` },
      { q: 'Wie verändert eine Wärmepumpe die Rechnung für den Stromspeicher?', a: `Mehr Verbrauch am Abend füllt die Batterie besser aus. Bei ${DE.num(10)} kWp und ${DE.num(7000)} kWh Verbrauch in Dresden bringt ein ${DE.num(SP)}-kWh-Speicher ${DE.eur(plusGross)} im Jahr. Der Effekt ist aber begrenzt: Die Wärmepumpe braucht ihren Strom vor allem im Winter, wenn der Speicher mangels Überschuss leer bleibt. Das Lastprofil der Simulation stammt aus Haushalten ohne Wärmepumpe.` },
    ],
    body: (h) => `
<h2>Was der Rechner vergleicht</h2>
<p>Der Rechner lässt dieselbe Dachanlage zweimal durch ein ganzes Jahr laufen, einmal ohne und einmal mit Batterie. In jeder Viertelstunde versorgt der Solarstrom zuerst den Haushalt, dann lädt der Überschuss den Speicher, erst danach geht der Rest ins Netz. Abends und nachts entlädt die Batterie, bis sie leer ist. Hin und zurück bleiben nach der Annahme der Simulation rund ${h.pct(rundweg, 0)} der eingespeicherten Energie übrig. Ertrag und Verbrauch kommen aus ${h.src('pvgis', 'PVGIS')} und den Lastprofilen der ${h.src('htw_lastprofile', 'HTW Berlin')}; Dach nach Süden mit 30° Neigung, Teileinspeisung, kein Smart Meter.</p>
<p>Der Mehrnutzen ist die Differenz zweier Summen: gesparter Netzbezug plus Vergütung mit Speicher, minus dasselbe ohne Speicher. Weil jede gespeicherte Kilowattstunde nicht mehr eingespeist wird, kostet sie den Satz des ${h.src('bnetza_saetze', 'Inbetriebnahme-Zeitraums')}, hier ${h.ct(ohne.satzCt)}.</p>

<h2>Speicher von 0 bis 12 kWh in Dresden</h2>
${h.table(['Speicher', 'Eigenverbrauch', 'Autarkie', 'Netzbezug', 'Nutzen/Jahr'], reihe.map(({ s, r }) => [
  s === 0 ? 'ohne' : `${h.num(s)} kWh`, h.pct(r.eigenAnteil, 0), h.pct(r.autarkie, 0), `${h.num(VB - r.selbst)} kWh`, h.eur(r.nutzenJahr),
]), `${h.num(KWP)} kWp, Süd 30°, ${h.num(ohne.ertrag)} kWh Ertrag, Verbrauch ${h.num(VB)} kWh, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die Kurve flacht früh ab. Die ersten Kilowattstunden Kapazität werden an den meisten Tagen des Sommerhalbjahrs voll genutzt, die letzten nur an langen Sommertagen mit hohem Abendverbrauch. Wie man die passende Kapazität findet, erklärt der Ratgeber ${h.a('stromspeicher-groesse', 'Stromspeicher-Größe')}.</p>

<h2>Speicher und 60-Prozent-Grenze</h2>
<p>Neue Anlagen ohne Smart Meter dürfen seit dem ${h.date(P.solarspitzen.stichtag)} höchstens ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} ihrer Nennleistung einspeisen (${h.src('eeg_9', '§ 9 Abs. 2 EEG')}). Ein Speicher kann einen Teil der Mittagsspitze aufnehmen, die sonst verfällt. Im Beispiel sinkt der abgeregelte Strom aber nur von ${h.num(ohne.abgeregelt)} auf ${h.num(mit.abgeregelt)} kWh, weil die Batterie an sonnigen Tagen oft schon am Vormittag voll ist. Wer den Speicher gezielt für die Mittagsspitze nutzen will, braucht eine Ladesteuerung, die erst mittags lädt; das rechnet der Rechner nicht.</p>

<h2>Preis, Steuer und Amortisation</h2>
<p>Auf Kauf und Einbau eines Speichers für eine Photovoltaikanlage fällt keine Umsatzsteuer an (${h.src('ustg_12', '§ 12 Abs. 3 UStG')}). Die Amortisation ist der Speicherpreis geteilt durch den Mehrnutzen: Bei ${h.eur(PREIS_SP)} und ${h.eur(plus)} im Jahr sind es ${h.num(amort, 1)} Jahre, ohne Preissteigerung beim Strom. Halten Sie diese Zahl gegen die Garantiezeit der Zellen und tragen Sie Ihr eigenes Angebot ein. Wie sich die ganze Anlage mit Speicher über die Jahre rechnet, zeigt ${h.a('amortisation-photovoltaik', 'Amortisation der Photovoltaik')}.</p>`,
  },
  en: {
    slug: 'home-battery-calculator',
    nav: 'Home battery calculator',
    card: 'The same rooftop system with and without a battery: self-consumption, self-sufficiency, extra benefit and battery payback.',
    title: 'Home Battery Calculator Germany 2026: Does Storage Pay?',
    description: `Home battery calculator for Germany 2026: self-use and self-sufficiency with 0 to 12 kWh, extra benefit against a ${EN.ct(ohne.satzCt)} tariff, payback by postcode.`,
    h1: 'Home battery calculator 2026: what storage adds to a rooftop system',
    intro: `An ${EN.num(SP)} kWh battery on an ${EN.num(KWP)} kWp system in Dresden raises a ${EN.num(VB)} kWh household's self-sufficiency from ${EN.pct(ohne.autarkie)} to ${EN.pct(mit.autarkie)} and adds ${EN.eur(plus)} a year. At ${EN.eur(PREIS_SP)} it pays for itself in ${EN.num(amort, 1)} years.`,
    resume: `Whether a home battery (Stromspeicher) pays off is decided not by self-sufficiency but by a simple margin: every kilowatt-hour the battery shifts from midday to the evening saves the purchase price of ${EN.num(STROMPREIS_CT, 1)} ct, but gives up the feed-in tariff of ${EN.ct(ohne.satzCt)}. That leaves about ${EN.num(spanne, 1)} ct, minus the losses from charging and discharging. The calculator simulates every quarter-hour of a year using PVGIS yields for your postcode and 74 metered household profiles from HTW Berlin. In the Dresden example, with ${EN.num(KWP)} kWp facing south and ${EN.num(VB)} kWh of consumption, self-consumption rises from ${EN.pct(ohne.eigenAnteil)} to ${EN.pct(mit.eigenAnteil)} of output with ${EN.num(SP)} kWh. The system's benefit grows from ${EN.eur(ohne.nutzenJahr)} to ${EN.eur(mit.nutzenJahr)} a year. Those ${EN.eur(plus)} are what the battery has to earn over its life; whether it does depends on the price you enter in the calculator.`,
    faqs: [
      { q: 'How much self-sufficiency does an 8 kWh battery give with 8 kWp?', a: `In Dresden, on a south roof at 30° with ${EN.num(VB)} kWh of consumption, self-sufficiency rises from ${EN.pct(ohne.autarkie)} without storage to ${EN.pct(mit.autarkie)}. The household then buys only ${EN.num(VB - mit.selbst)} kWh a year instead of ${EN.num(VB - ohne.selbst)} kWh. No home becomes fully independent on solar alone, because in December and January the output does not cover demand.` },
      { q: 'At what point does a bigger home battery add very little?', a: `In the Dresden example from about ${EN.num(6)} to ${EN.num(SP)} kWh. Going from ${EN.num(6)} to ${EN.num(SP)} kWh raises the benefit by ${EN.eur(mit.nutzenJahr - r6.nutzenJahr)}, from ${EN.num(10)} to ${EN.num(12)} kWh by only ${EN.eur(r12.nutzenJahr - r10.nutzenJahr)} a year. A household using ${EN.num(VB)} kWh rarely needs more in the evening and at night than a mid-sized battery holds. The table in the calculator shows the curve for your figures.` },
      { q: 'Is a home battery worth it with 3,000 kWh of consumption?', a: `Less than for a larger household. With ${EN.num(KWP)} kWp and ${EN.num(SP)} kWh in Dresden, the battery adds ${EN.eur(plusKlein)} a year at ${EN.num(3000)} kWh of consumption and ${EN.eur(plus)} at ${EN.num(VB)} kWh. The small household draws less from the battery in the evening, so it often stays half full. A smaller capacity fits better here; the calculator shows which.` },
      { q: 'How does a heat pump change the case for a home battery?', a: `More evening consumption makes better use of the battery. With ${EN.num(10)} kWp and ${EN.num(7000)} kWh of consumption in Dresden, an ${EN.num(SP)} kWh battery adds ${EN.eur(plusGross)} a year. The effect is limited, though: a heat pump needs most of its power in winter, when the battery stays empty for lack of surplus. The simulation's load profiles come from households without heat pumps.` },
    ],
    body: (h) => `
<h2>What the calculator compares</h2>
<p>The calculator runs the same rooftop system through a whole year twice, once without and once with a battery. In each quarter-hour, solar power first supplies the home, then the surplus charges the battery, and only then does the rest go to the grid. In the evening and at night the battery discharges until it is empty. On the simulation's assumption, about ${h.pct(rundweg, 0)} of the stored energy is left after the round trip. Yield and consumption come from ${h.src('pvgis', 'PVGIS')} and the load profiles of ${h.src('htw_lastprofile', 'HTW Berlin')}; south-facing roof at 30°, surplus feed-in, no smart meter.</p>
<p>The extra benefit is the difference between two sums: saved grid purchases plus feed-in payment with the battery, minus the same without it. Because each stored kilowatt-hour is no longer exported, it costs the rate for the ${h.src('bnetza_saetze', 'commissioning period')}, here ${h.ct(ohne.satzCt)}.</p>

<h2>Batteries from 0 to 12 kWh in Dresden</h2>
${h.table(['Battery', 'Self-use', 'Self-sufficiency', 'Bought from grid', 'Benefit/year'], reihe.map(({ s, r }) => [
  s === 0 ? 'none' : `${h.num(s)} kWh`, h.pct(r.eigenAnteil, 0), h.pct(r.autarkie, 0), `${h.num(VB - r.selbst)} kWh`, h.eur(r.nutzenJahr),
]), `${h.num(KWP)} kWp, south 30°, ${h.num(ohne.ertrag)} kWh output, consumption ${h.num(VB)} kWh, price ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The curve flattens early. The first kilowatt-hours of capacity are used fully on most days of the summer half-year, the last ones only on long summer days with high evening use. How to find the right capacity is explained in the guide to ${h.a('stromspeicher-groesse', 'home battery size')}.</p>

<h2>Battery and the 60 per cent cap</h2>
<p>Since ${h.date(P.solarspitzen.stichtag)}, new systems without a smart meter may export at most ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of their rated output (${h.src('eeg_9', 'section 9(2) EEG')}). A battery can take part of the midday peak that would otherwise be lost. In the example, though, clipped power only falls from ${h.num(ohne.abgeregelt)} to ${h.num(mit.abgeregelt)} kWh, because on sunny days the battery is often full by late morning. Using the battery deliberately for the midday peak needs charge control that waits until midday; the calculator does not model that.</p>

<h2>Price, tax and payback</h2>
<p>No VAT is charged on buying and installing a battery for a photovoltaic system (${h.src('ustg_12', 'section 12(3) VAT Act')}). Payback is the battery price divided by the extra benefit: at ${h.eur(PREIS_SP)} and ${h.eur(plus)} a year that is ${h.num(amort, 1)} years, with no rise in electricity prices. Set this against the warranty period of the cells and enter your own quote. How the whole system with a battery works out over the years is shown under ${h.a('amortisation-photovoltaik', 'solar PV payback')}.</p>`,
  },
});

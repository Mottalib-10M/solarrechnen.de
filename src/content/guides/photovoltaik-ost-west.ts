import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Ost-West gegen Süd im Bundesmittel, 4 000 kWh Verbrauch, ohne Smart Meter (60-%-Grenze).
 * Neigungsreihe 10° bis 45°, reine Ost- und Westdächer, mehr Module auf Ost-West, Speicher.
 * Kosten sind Annahmen (1 500 € je kWp), nur für die Amortisation des Größenvergleichs.
 */
const PK = 1500;
const base = { ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil' as const, smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 10 * PK };
const sued = rechnePv(base);
const ow = rechnePv({ ...base, ostWest: true });
const ost = rechnePv({ ...base, azimut: -90 });
const west = rechnePv({ ...base, azimut: 90 });
const reihe = [10, 15, 20, 30, 45].map((n) => ({ n, s: rechnePv({ ...base, neigung: n }), o: rechnePv({ ...base, neigung: n, ostWest: true }) }));
const flach = reihe[0];
const steil = reihe[4];
const ow12 = rechnePv({ ...base, kwp: 12, ostWest: true, kostenEur: 12 * PK });
const owSp = rechnePv({ ...base, ostWest: true, speicherKwh: 8 });
const sSp = rechnePv({ ...base, speicherKwh: 8 });
const quote = ow.ertrag / sued.ertrag;
const suedSm = rechnePv({ ...base, smartMeter: true });
const owSm = rechnePv({ ...base, ostWest: true, smartMeter: true });

export default defineGuide({
  id: 'photovoltaik-ost-west',
  group: 'pv',
  order: 44,
  mini: 'ostWest',
  related: ['pv-ertrag-plz', 'balkonkraftwerk-ausrichtung', 'solarspitzengesetz', 'wie-viel-kwp', 'photovoltaik-rechner', 'stromspeicher-groesse'],
  sources: ['pvgis', 'htw_lastprofile', 'eeg_9', 'bnetza_saetze'],
  de: {
    slug: 'photovoltaik-ost-west',
    nav: 'Photovoltaik Ost-West',
    card: 'Ost-West-Dach gegen Süddach: Ertrag nach Neigung, Eigenverbrauch, 60-%-Grenze und ob mehr Module den Rückstand ausgleichen.',
    title: 'Photovoltaik Ost-West 2026: Ertrag nach Neigung, Nutzen',
    description: `Photovoltaik Ost-West 2026: bei 30° Neigung ${DE.pct(quote, 0)} des Süd-Ertrags, flach ${DE.pct(flach.o.ertrag / flach.s.ertrag, 0)}. Eigenverbrauch, 60-%-Grenze, Speicher und mehr Module im direkten Vergleich.`,
    h1: 'Photovoltaik auf dem Ost-West-Dach 2026: was die Lage kostet',
    intro: `Ein Ost-West-Dach mit 30° Neigung erzeugt ${DE.pct(quote, 0)} dessen, was dieselbe Anlage nach Süden bringt. Je flacher das Dach, desto kleiner der Abstand: bei 10° sind es ${DE.pct(flach.o.ertrag / flach.s.ertrag, 0)}.`,
    resume: `Ein Satteldach, dessen Flächen nach Osten und Westen zeigen, bekommt morgens Sonne auf die eine und nachmittags auf die andere Hälfte. Mittags trifft das Licht beide Flächen schräg. Deshalb erzeugt eine 10-kWp-Anlage, je zur Hälfte nach Ost und West belegt, im deutschen Mittel laut PVGIS bei 30° Neigung ${DE.num(ow.ertrag)} kWh im Jahr, nach Süden wären es ${DE.num(sued.ertrag)} kWh. Der Rückstand hängt stark von der Neigung ab: Bei 10° liegt Ost-West bei ${DE.pct(flach.o.ertrag / flach.s.ertrag, 0)} des Süd-Ertrags, bei 45° nur bei ${DE.pct(steil.o.ertrag / steil.s.ertrag, 0)}. Zwei Effekte mildern den Abstand im Geldbeutel. Die Erzeugung verteilt sich gleichmäßiger über den Tag, sodass der Eigenverbrauchsanteil von ${DE.pct(sued.eigenAnteil)} auf ${DE.pct(ow.eigenAnteil)} steigt. Und die Spitze am Mittag ist flacher, sodass die 60-Prozent-Grenze für Neuanlagen ohne Smart Meter nur ${DE.num(ow.abgeregelt)} statt ${DE.num(sued.abgeregelt)} kWh kostet. Unter dem Strich bringt Ost-West bei 4 000 kWh Verbrauch ${DE.eur(ow.nutzenJahr)} im Jahr, Süd ${DE.eur(sued.nutzenJahr)}.`,
    faqs: [
      { q: 'Wie viel weniger Ertrag bringt ein Ost-West-Dach mit 30° Neigung?', a: `Im Bundesmittel etwa ${DE.pct(1 - quote, 0)} weniger als nach Süden: ${DE.num(ow.ertrag)} statt ${DE.num(sued.ertrag)} kWh im Jahr bei 10 kWp, gerechnet mit PVGIS. Im Geld ist der Abstand kleiner, ${DE.eur(ow.nutzenJahr)} gegen ${DE.eur(sued.nutzenJahr)} bei 4 000 kWh Verbrauch, weil ein höherer Anteil im Haus genutzt wird und weniger an der 60-Prozent-Grenze verloren geht.` },
      { q: 'Bringt eine Ost-West-Anlage wirklich mehr Eigenverbrauch?', a: `Prozentual ja, absolut kaum. Der Anteil steigt bei 10 kWp und 4 000 kWh Verbrauch von ${DE.pct(sued.eigenAnteil)} auf ${DE.pct(ow.eigenAnteil)}. Weil Ost-West insgesamt weniger erzeugt, nutzt der Haushalt aber ${DE.num(ow.selbst)} kWh selbst, gegenüber ${DE.num(sued.selbst)} kWh beim Süddach. Der Vorteil liegt in der gleichmäßigeren Kurve, nicht in mehr gespartem Netzstrom.` },
      { q: 'Ist auf einem flachen Ost-West-Dach der Verlust kleiner?', a: `Ja, deutlich. Bei 10° Neigung erreicht die Ost-West-Anlage ${DE.pct(flach.o.ertrag / flach.s.ertrag, 0)} des Süd-Ertrags, ${DE.num(flach.o.ertrag)} gegen ${DE.num(flach.s.ertrag)} kWh, bei 45° nur ${DE.pct(steil.o.ertrag / steil.s.ertrag, 0)}. Auf einem flachen Dach sehen beide Flächen mittags fast dieselbe Sonne wie eine Südfläche. Deshalb werden Flachdächer oft flach in Ost-West-Richtung aufgeständert.` },
      { q: 'Gleichen zwei zusätzliche kWp auf Ost-West den Süd-Ertrag aus?', a: `Beim Ertrag fast: ${DE.num(ow12.ertrag)} kWh mit 12 kWp Ost-West gegen ${DE.num(sued.ertrag)} kWh mit 10 kWp Süd. Im Nutzen nicht ganz, ${DE.eur(ow12.nutzenJahr)} gegen ${DE.eur(sued.nutzenJahr)} im Jahr, weil der Mehrertrag größtenteils eingespeist wird und der Satz über 10 kWp sinkt. Bei angenommenen ${DE.eur(PK)} je kWp amortisiert sich die größere Anlage nach ${DE.num(ow12.amortisationJahre ?? 0, 1)} statt ${DE.num(sued.amortisationJahre ?? 0, 1)} Jahren.` },
      { q: 'Ist ein reines Westdach besser als ein reines Ostdach?', a: `Etwas. Mit 30° Neigung erzeugt eine 10-kWp-Anlage nach Westen im Bundesmittel ${DE.num(west.ertrag)} kWh, nach Osten ${DE.num(ost.ertrag)} kWh; der Nutzen liegt bei ${DE.eur(west.nutzenJahr)} gegen ${DE.eur(ost.nutzenJahr)}. Ein möglicher Grund: Morgendunst und Frühnebel dämpfen die Ostseite öfter als die Westseite am Nachmittag. Für Ihren Ort kann das anders ausfallen, PVGIS rechnet es nach Postleitzahl.` },
      { q: 'Lohnt sich ein Smart Meter auf einem Ost-West-Dach?', a: `Meist nicht. Ohne Smart Meter verliert die 10-kWp-Anlage mit 30° Neigung an der 60-Prozent-Grenze nur ${DE.num(ow.abgeregelt)} kWh im Jahr. Mit Smart Meter entfällt die Grenze, dafür fehlen nach dem Rechenmodell ${DE.eur(owSm.negVerlustJahr)} Vergütung in Stunden mit negativem Preis. Der Jahresnutzen sinkt so von ${DE.eur(ow.nutzenJahr)} auf ${DE.eur(owSm.nutzenJahr)}, bei 4 000 kWh Verbrauch im Bundesmittel.` },
    ],
    body: (h) => `
<h2>Zwei Dachhälften statt einer Hauptrichtung</h2>
<p>Ein Süddach bündelt den Ertrag in den Mittagsstunden. Ein Ost-West-Dach teilt ihn: Die Ostfläche liefert vom Sonnenaufgang bis in den späten Vormittag, die Westfläche vom frühen Nachmittag bis zum Abend. Um zwölf Uhr treffen die Strahlen beide Flächen schräg, deshalb fehlt dem Tag die hohe Spitze. Für die Jahressumme ist das ein Nachteil, für den Haushalt nicht unbedingt: Gefrühstückt, gekocht und gewaschen wird eher morgens und abends als um die Mittagszeit.</p>
<p>Die Zahlen auf dieser Seite stammen aus ${h.src('pvgis', 'PVGIS')} für das deutsche Mittel. Eine Ost-West-Anlage wird je zur Hälfte als Ost- und als Westfläche gerechnet, der Eigenverbrauch aus einer Viertelstunden-Simulation mit den ${h.src('htw_lastprofile', 'Lastprofilen der HTW Berlin')}. Den Wert für Ihren Ort liefert der ${h.a('pv-ertrag-plz', 'Ertrag nach Postleitzahl')}.</p>

<h2>Die Neigung entscheidet über den Rückstand</h2>
${h.table(['Neigung', 'Süd', 'Ost-West', 'Ost-West in % von Süd', 'Eigenverbrauch Süd / Ost-West'], reihe.map((r) => [`${r.n}°`, `${h.num(r.s.ertrag)} kWh`, `${h.num(r.o.ertrag)} kWh`, h.pct(r.o.ertrag / r.s.ertrag, 0), `${h.pct(r.s.eigenAnteil, 0)} / ${h.pct(r.o.eigenAnteil, 0)}`]), '10 kWp im Bundesmittel, 4 000 kWh Verbrauch, ohne Speicher.', ['l', 'r', 'r', 'r', 'r'])}
<p>Bei Süd ist die Neigung von 30° nahe am Optimum, steiler oder flacher verliert wenig. Bei Ost-West wirkt die Neigung dagegen fast linear: Jeder Grad mehr dreht die Flächen weiter von der Mittagssonne weg. Das erklärt, warum auf Flachdächern Ost-West-Aufständerungen mit geringer Neigung verbreitet sind. Sie verschatten sich gegenseitig kaum und lassen sich dicht an dicht setzen, sodass mehr Leistung auf dieselbe Fläche passt als bei steil nach Süden gestellten Reihen mit großen Abständen.</p>

<h2>Wo Ost-West aufholt</h2>
<h3>Die 60-Prozent-Grenze greift seltener</h3>
<p>Für neue Anlagen ohne Smart Meter begrenzt ${h.src('eeg_9', '§ 9 Abs. 2 EEG')} die Einspeisung auf ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} der Nennleistung. Ein Süddach überschreitet diese Linie an klaren Sommertagen über Stunden, ein Ost-West-Dach erreicht sie wegen seiner flachen Kurve nur selten. Bei 30° und 10 kWp verliert die Südanlage ${h.num(sued.abgeregelt)} kWh im Jahr, die Ost-West-Anlage ${h.num(ow.abgeregelt)} kWh. Damit ist Ost-West ausgerechnet die Lage, die von der neuen Regel am wenigsten betroffen ist; mehr dazu unter ${h.a('solarspitzengesetz', 'Solarspitzengesetz')}.</p>
<h3>Ein höherer Anteil im Haus</h3>
<p>Der Eigenverbrauchsanteil steigt bei 30° von ${h.pct(sued.eigenAnteil)} auf ${h.pct(ow.eigenAnteil)}. In Kilowattstunden bleibt der Gewinn allerdings aus: ${h.num(ow.selbst)} gegen ${h.num(sued.selbst)} kWh. Der Anteil steigt, weil der Nenner, der Gesamtertrag, kleiner ist. Eingespeist werden ${h.num(ow.einspeisung)} statt ${h.num(sued.einspeisung)} kWh, und dort entsteht der eigentliche Unterschied im Nutzen, zum Satz der ${h.src('bnetza_saetze', 'Bundesnetzagentur')}.</p>
<h3>Mit Speicher</h3>
<p>Ein 8-kWh-Speicher hebt den Eigenverbrauch der Ost-West-Anlage auf ${h.pct(owSp.eigenAnteil)}, bei Süd auf ${h.pct(sSp.eigenAnteil)}. Der Speicher füllt sich bei Süd mittags schneller und hat dann mehr Strom für den Abend; deshalb bleibt der Nutzen nach Süden höher, ${h.eur(sSp.nutzenJahr)} gegen ${h.eur(owSp.nutzenJahr)} im Jahr. Wie groß ein Speicher sein sollte, beantwortet ${h.a('stromspeicher-groesse', 'Stromspeicher-Größe')}.</p>

<h2>Ost-West mit Smart Meter</h2>
<p>Wer ein intelligentes Messsystem einbauen lässt, ist die 60-Prozent-Grenze los, bekommt aber in Viertelstunden mit negativem Börsenpreis keine Vergütung. Im Rechenmodell kostet das die Südanlage ${h.eur(suedSm.negVerlustJahr)} im Jahr, die Ost-West-Anlage ${h.eur(owSm.negVerlustJahr)}; der Jahresnutzen liegt dann bei ${h.eur(suedSm.nutzenJahr)} gegen ${h.eur(owSm.nutzenJahr)}. Das Modell setzt für beide Lagen denselben Anteil negativer Stunden an der Einspeisung an. Weil negative Preise vor allem an sonnigen Mittagen auftreten, wenn ein Süddach am meisten liefert, dürfte der Nachteil für Ost-West in Wirklichkeit eher kleiner ausfallen als hier gerechnet. Für die Wahl zwischen Smart Meter und Grenze ist das ein Argument mehr, auf einem Ost-West-Dach ohne Smart Meter zu bleiben: Die Grenze kostet dort kaum etwas.</p>

<h2>Mehr Module als Ausgleich</h2>
<p>Ost-West belegt oft beide Dachhälften, ein Süddach nur eine. Wer zwei kWp mehr unterbringt, kommt mit 12 kWp Ost-West auf ${h.num(ow12.ertrag)} kWh und damit fast an die ${h.num(sued.ertrag)} kWh von 10 kWp Süd heran. Der Mehrertrag geht aber überwiegend ins Netz, und für den Teil über 10 kWp ist der Satz niedriger, im Mittel ${h.ct(ow12.satzCt)} für die ganze Anlage. Bei angenommenen ${h.eur(PK)} je kWp bringt das ${h.eur(ow12.nutzenJahr)} im Jahr und eine Amortisation nach ${h.num(ow12.amortisationJahre ?? 0, 1)} Jahren. Ob sich das lohnt, hängt vor allem davon ab, wie günstig die zusätzlichen Module im Angebot sind; die passende Größe rechnet ${h.a('wie-viel-kwp', 'wie viel kWp')}.</p>

<h2>Reines Ost- oder Westdach</h2>
<p>Nicht jedes Haus hat zwei nutzbare Hälften. Steht nur eine Fläche zur Verfügung, ist West im Bundesmittel leicht im Vorteil: ${h.num(west.ertrag)} kWh gegen ${h.num(ost.ertrag)} kWh nach Osten. Für eine Haushaltskurve mit Abendspitze passt West ohnehin besser. Für Balkonkraftwerke an senkrechten Geländern gelten andere Werte, siehe ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung des Balkonkraftwerks')}. Ihr Dach mit genauer Neigung und Postleitzahl rechnet der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')}.</p>`,
  },
  en: {
    slug: 'east-west-solar-roof',
    nav: 'East-west solar roof',
    card: 'East-west roof against south roof: yield by pitch, self-consumption, the 60% cap and whether extra panels close the gap.',
    title: 'East-West Solar Roof in Germany 2026: Yield by Roof Pitch',
    description: `East-west solar roof in Germany 2026: at 30° pitch ${EN.pct(quote, 0)} of a south roof's yield, ${EN.pct(flach.o.ertrag / flach.s.ertrag, 0)} when flat. Self-use, the 60% cap and extra panels compared side by side.`,
    h1: 'East-west solar roof in Germany 2026: what the orientation costs',
    intro: `An east-west roof at 30° pitch produces ${EN.pct(quote, 0)} of what the same system yields facing south. The flatter the roof, the smaller the gap: at 10° it is ${EN.pct(flach.o.ertrag / flach.s.ertrag, 0)}.`,
    resume: `A pitched roof whose faces point east and west gets morning sun on one half and afternoon sun on the other. At midday the light hits both faces at an angle. That is why a 10 kWp system split evenly between east and west produces ${EN.num(ow.ertrag)} kWh a year at the German average at 30° pitch according to PVGIS, against ${EN.num(sued.ertrag)} kWh facing south. The gap depends heavily on the pitch: at 10°, east-west reaches ${EN.pct(flach.o.ertrag / flach.s.ertrag, 0)} of the south yield, at 45° only ${EN.pct(steil.o.ertrag / steil.s.ertrag, 0)}. Two effects narrow the gap in money terms. Output is spread more evenly over the day, so the self-consumption share rises from ${EN.pct(sued.eigenAnteil)} to ${EN.pct(ow.eigenAnteil)}. And the midday peak is flatter, so the 60 per cent feed-in cap for new systems without a smart meter costs only ${EN.num(ow.abgeregelt)} instead of ${EN.num(sued.abgeregelt)} kWh. On balance, with 4,000 kWh of consumption, east-west brings in ${EN.eur(ow.nutzenJahr)} a year and south ${EN.eur(sued.nutzenJahr)}.`,
    faqs: [
      { q: 'How much less does an east-west roof at 30° pitch produce?', a: `At the German average about ${EN.pct(1 - quote, 0)} less than facing south: ${EN.num(ow.ertrag)} instead of ${EN.num(sued.ertrag)} kWh a year for 10 kWp, calculated with PVGIS. In money the gap is smaller, ${EN.eur(ow.nutzenJahr)} against ${EN.eur(sued.nutzenJahr)} with 4,000 kWh of consumption, because a higher share is used in the home and less is lost to the 60 per cent cap.` },
      { q: 'Does an east-west system really increase self-consumption?', a: `As a percentage yes, in absolute terms hardly. With 10 kWp and 4,000 kWh of consumption the share rises from ${EN.pct(sued.eigenAnteil)} to ${EN.pct(ow.eigenAnteil)}. Because east-west produces less overall, though, the household uses ${EN.num(ow.selbst)} kWh itself, against ${EN.num(sued.selbst)} kWh with a south roof. The advantage lies in the smoother curve, not in more grid power saved.` },
      { q: 'Is the loss smaller on a low-pitch east-west roof?', a: `Yes, clearly. At 10° pitch the east-west system reaches ${EN.pct(flach.o.ertrag / flach.s.ertrag, 0)} of the south yield, ${EN.num(flach.o.ertrag)} against ${EN.num(flach.s.ertrag)} kWh, but at 45° only ${EN.pct(steil.o.ertrag / steil.s.ertrag, 0)}. On a flat roof both faces see almost the same midday sun. That is why flat roofs are often fitted with low east-west mounting frames.` },
      { q: 'Do two extra kWp on an east-west roof make up for south?', a: `In yield almost: ${EN.num(ow12.ertrag)} kWh with 12 kWp east-west against ${EN.num(sued.ertrag)} kWh with 10 kWp south. In benefit not quite, ${EN.eur(ow12.nutzenJahr)} against ${EN.eur(sued.nutzenJahr)} a year, because most of the extra output is exported and the rate drops above 10 kWp. At an assumed ${EN.eur(PK)} per kWp, the larger system pays back after ${EN.num(ow12.amortisationJahre ?? 0, 1)} instead of ${EN.num(sued.amortisationJahre ?? 0, 1)} years.` },
      { q: 'Is a west-only roof better than an east-only roof?', a: `Slightly. At 30° pitch a 10 kWp system facing west produces ${EN.num(west.ertrag)} kWh at the German average, facing east ${EN.num(ost.ertrag)} kWh; the benefit is ${EN.eur(west.nutzenJahr)} against ${EN.eur(ost.nutzenJahr)}. One likely reason is that morning haze and fog dim the east face more often than afternoon conditions dim the west face. Your location may differ, and PVGIS calculates it by postcode.` },
      { q: 'Is a smart meter worth it on an east-west roof?', a: `Usually not. Without one, the 10 kWp system at 30° pitch loses only ${EN.num(ow.abgeregelt)} kWh a year to the 60 per cent cap. With a smart meter the cap goes, but according to the model ${EN.eur(owSm.negVerlustJahr)} of payment is lost in negative-price hours. The annual benefit drops from ${EN.eur(ow.nutzenJahr)} to ${EN.eur(owSm.nutzenJahr)}, with 4,000 kWh of consumption at the German average.` },
    ],
    body: (h) => `
<h2>Two roof halves instead of one main direction</h2>
<p>A south roof concentrates its output in the midday hours. An east-west roof splits it: the east face delivers from sunrise to late morning, the west face from early afternoon into the evening. At noon the rays hit both faces at an angle, so the day lacks a tall peak. For the annual total that is a drawback, for the household not necessarily: breakfast, cooking and laundry tend to happen in the morning and evening rather than at lunchtime.</p>
<p>The figures on this page come from ${h.src('pvgis', 'PVGIS')} for the German average. An east-west system is counted as half east face, half west face, and self-consumption comes from a quarter-hour simulation using the ${h.src('htw_lastprofile', 'HTW Berlin load profiles')}. The value for your location is in the ${h.a('pv-ertrag-plz', 'yield by postcode')} tool.</p>

<h2>Roof pitch decides the gap</h2>
${h.table(['Pitch', 'South', 'East-west', 'East-west as % of south', 'Self-use south / east-west'], reihe.map((r) => [`${r.n}°`, `${h.num(r.s.ertrag)} kWh`, `${h.num(r.o.ertrag)} kWh`, h.pct(r.o.ertrag / r.s.ertrag, 0), `${h.pct(r.s.eigenAnteil, 0)} / ${h.pct(r.o.eigenAnteil, 0)}`]), '10 kWp at the German average, 4,000 kWh consumption, no battery.', ['l', 'r', 'r', 'r', 'r'])}
<p>Facing south, a 30° pitch is close to the optimum, and steeper or flatter loses little. On an east-west roof, by contrast, pitch acts almost linearly: each extra degree turns the faces further away from the midday sun. That explains why low east-west frames are common on flat roofs. They barely shade each other and can be placed side by side, so more capacity fits on the same area than with steep south-facing rows that need wide gaps.</p>

<h2>Where east-west catches up</h2>
<h3>The 60 per cent cap bites less often</h3>
<p>For new systems without a smart meter, ${h.src('eeg_9', 'section 9(2) EEG')} caps feed-in at ${h.pct(P.solarspitzen.begrenzung_anteil, 0)} of rated output. A south roof crosses that line for hours on clear summer days; an east-west roof rarely reaches it because of its flat curve. At 30° and 10 kWp, the south system loses ${h.num(sued.abgeregelt)} kWh a year and the east-west system ${h.num(ow.abgeregelt)} kWh. So east-west is the orientation least affected by the new rule; more under ${h.a('solarspitzengesetz', 'solar peak law')}.</p>
<h3>A higher share used at home</h3>
<p>At 30°, the self-consumption share rises from ${h.pct(sued.eigenAnteil)} to ${h.pct(ow.eigenAnteil)}. In kilowatt-hours there is no gain, though: ${h.num(ow.selbst)} against ${h.num(sued.selbst)} kWh. The share rises because the denominator, total output, is smaller. Exports are ${h.num(ow.einspeisung)} instead of ${h.num(sued.einspeisung)} kWh, and that is where the real difference in benefit arises, at the rate set by the ${h.src('bnetza_saetze', 'Federal Network Agency')}.</p>
<h3>With a battery</h3>
<p>An 8 kWh battery lifts the east-west system's self-consumption to ${h.pct(owSp.eigenAnteil)}, the south system's to ${h.pct(sSp.eigenAnteil)}. Facing south, the battery fills faster at midday and has more power left for the evening, so the south benefit stays higher, ${h.eur(sSp.nutzenJahr)} against ${h.eur(owSp.nutzenJahr)} a year. How big a battery should be is covered in ${h.a('stromspeicher-groesse', 'home battery size')}.</p>

<h2>East-west with a smart meter</h2>
<p>With a smart meter the 60 per cent cap goes, but quarter-hours with negative wholesale prices earn nothing. In the model this costs the south system ${h.eur(suedSm.negVerlustJahr)} a year and the east-west system ${h.eur(owSm.negVerlustJahr)}, for an annual benefit of ${h.eur(suedSm.nutzenJahr)} against ${h.eur(owSm.nutzenJahr)}. The model applies the same share of negative-price hours to both orientations. Since negative prices mostly occur on sunny middays, when a south roof delivers most, the real penalty for east-west is probably smaller than calculated here. For an east-west roof that is one more reason to stay without a smart meter: the cap costs it almost nothing.</p>

<h2>More panels to compensate</h2>
<p>East-west often uses both roof halves, a south roof only one. Fitting two more kWp, a 12 kWp east-west system reaches ${h.num(ow12.ertrag)} kWh, close to the ${h.num(sued.ertrag)} kWh of 10 kWp facing south. Most of the extra output goes to the grid, however, and the rate is lower for the part above 10 kWp: ${h.ct(ow12.satzCt)} on average for the whole system. At an assumed ${h.eur(PK)} per kWp that gives ${h.eur(ow12.nutzenJahr)} a year and payback after ${h.num(ow12.amortisationJahre ?? 0, 1)} years. Whether it pays depends mainly on how cheaply the extra panels are quoted; the right size is worked out by ${h.a('wie-viel-kwp', 'how many kWp')}.</p>

<h2>East-only or west-only roof</h2>
<p>Not every house has two usable halves. If only one face is available, west has a slight edge at the German average: ${h.num(west.ertrag)} kWh against ${h.num(ost.ertrag)} kWh facing east. West also suits a household curve with an evening peak. Plug-in systems on vertical balcony railings follow other rules, see ${h.a('balkonkraftwerk-ausrichtung', 'plug-in solar orientation')}. Your roof with its exact pitch and postcode is calculated by the ${h.a('photovoltaik-rechner', 'solar PV calculator')}.</p>`,
  },
});

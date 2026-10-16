import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Speichergröße: Autarkie und Mehrnutzen je zusätzlicher kWh aus dem Motor (Bundesmittel, Süd 30°), Grundfall
 * 8 kWp und 4 500 kWh wie der Mini-Rechner, dazu ein kleiner und ein großer Haushalt. Simulationsannahmen aus P.speicher.
 */
const r = (kwp: number, vb: number, sp: number) => rechnePv({ ort: null, kwp, neigung: 30, azimut: 0, verbrauchKwh: vb, speicherKwh: sp, modus: 'teil', smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 15000 });
const GR = [0, 2, 4, 6, 8, 10, 12, 15];
const reihe = GR.map((g) => ({ g, x: r(8, 4500, g) }));
const schritte = reihe.slice(1).map((s, i) => ({ von: reihe[i].g, bis: s.g, jeKwh: (s.x.nutzenJahr - reihe[i].x.nutzenJahr) / (s.g - reihe[i].g) }));
const erster = schritte[0].jeKwh;
const knick = (schritte.find((s) => s.jeKwh < erster / 2) ?? schritte[schritte.length - 1]).von;
const s0 = reihe[0].x, s6 = reihe[3].x, s10 = reihe[5].x, s15 = reihe[7].x;
const klein0 = r(5, 2500, 0), klein3 = r(5, 2500, 3), klein6 = r(5, 2500, 6);
const gross0 = r(12, 6000, 0), gross6 = r(12, 6000, 6), gross10 = r(12, 6000, 10);
const eta = P.speicher.eta_richtung;
const JN = 15;
const wert = (jeKwh: number) => jeKwh * JN;

export default defineGuide({
  id: 'stromspeicher-groesse',
  group: 'speicher',
  order: 72,
  mini: 'speicherGroesse',
  miniHref: 'stromspeicher-rechner',
  related: ['stromspeicher-rechner', 'nulleinspeisung', 'wie-viel-kwp', 'balkonkraftwerk-mit-speicher', 'negative-strompreise'],
  sources: ['htw_lastprofile', 'pvgis', 'ustg_12', 'eurostat_strom'],
  de: {
    slug: 'stromspeicher-groesse',
    nav: 'Speichergröße',
    card: 'Wie viele kWh Batterie zu Anlage und Verbrauch passen: Autarkie, Nutzen jeder weiteren kWh und der Punkt, ab dem es sich kaum noch lohnt.',
    title: 'Stromspeicher Größe 2026: wie viel kWh zu Ihrer PV passen',
    description: `Stromspeicher Größe 2026: Für 8 kWp und 4 500 kWh flacht der Nutzen ab etwa ${DE.num(knick)} kWh ab. Autarkie, Mehrnutzen je kWh und drei Haushalte im direkten Vergleich.`,
    h1: 'Stromspeicher-Größe 2026: wie viele kWh sich wirklich lohnen',
    intro: `Ein Haushalt mit 4 500 kWh und 8 kWp deckt ohne Speicher ${DE.pct(s0.autarkie)} seines Bedarfs selbst, mit 6 kWh ${DE.pct(s6.autarkie)}, mit 15 kWh ${DE.pct(s15.autarkie)}. Jede kWh über etwa ${DE.num(knick)} kWh bringt nur noch wenig.`,
    resume: `Die richtige Größe eines Stromspeichers ergibt sich aus dem Verbrauch zwischen Sonnenuntergang und Sonnenaufgang, nicht aus der Größe der Solaranlage. Die Viertelstunden-Simulation mit 74 gemessenen Haushalten zeigt das deutlich: Ein Haushalt mit 4 500 kWh im Jahr und einer 8-kWp-Anlage im Bundesmittel kommt ohne Speicher auf ${DE.pct(s0.autarkie)} Autarkie. Die ersten 2 kWh Speicher bringen je kWh ${DE.eur(erster)} Mehrnutzen im Jahr, weil sie fast jeden Abend voll geladen und leer gefahren werden. Ab etwa ${DE.num(knick)} kWh halbiert sich dieser Wert, und von 10 auf 15 kWh bringt jede zusätzliche kWh nur noch ${DE.eur(schritte[schritte.length - 1].jeKwh)}, denn ein großer Speicher wird im Winter nicht voll und im Sommer nachts nicht leer. Mit 6 kWh steigt der Nutzen der Anlage von ${DE.eur(s0.nutzenJahr)} auf ${DE.eur(s6.nutzenJahr)} im Jahr. Als Faustregel für Haushalte ohne Wärmepumpe und Elektroauto bewährt sich in der Simulation gut eine kWh nutzbare Kapazität je 1 000 kWh Jahresverbrauch. Seit 2023 fällt auf Speicher bis ${DE.num(P.steuer.ust_null_bis_kwp)} kWp Anlagenleistung keine Umsatzsteuer an.`,
    faqs: [
      { q: 'Wie groß sollte der Speicher bei 8 kWp und 4 500 kWh Verbrauch sein?', a: `In der Simulation liegt der sinnvolle Bereich zwischen ${DE.num(knick)} und 8 kWh nutzbarer Kapazität. Mit 6 kWh steigt die Autarkie von ${DE.pct(s0.autarkie)} auf ${DE.pct(s6.autarkie)} und der Jahresnutzen um ${DE.eur(s6.nutzenJahr - s0.nutzenJahr)}. Von 6 auf 10 kWh kommen nur noch ${DE.eur(s10.nutzenJahr - s6.nutzenJahr)} hinzu. Mehr lohnt sich erst, wenn Wärmepumpe oder Elektroauto abends zusätzlich Strom brauchen.` },
      { q: 'Welche Speichergröße passt zu einem Zwei-Personen-Haushalt mit 2 500 kWh?', a: `Eher eine kleine. Mit 5 kWp und 2 500 kWh Verbrauch bringen 3 kWh Speicher im Bundesmittel ${DE.eur(klein3.nutzenJahr - klein0.nutzenJahr)} Mehrnutzen im Jahr, eine Verdopplung auf 6 kWh nur weitere ${DE.eur(klein6.nutzenJahr - klein3.nutzenJahr)}. Der Abend- und Nachtverbrauch eines kleinen Haushalts ist schlicht zu gering, um einen großen Speicher jeden Tag zu leeren.` },
      { q: 'Bringt ein großer Speicher etwas für den Winter?', a: `Wenig. Von November bis Februar erzeugt eine Dachanlage oft kaum mehr, als das Haus tagsüber direkt verbraucht, sodass kein Überschuss zum Laden bleibt. Ein großer Speicher steht dann halb leer. Sein Zusatznutzen entsteht fast nur zwischen April und September. Deshalb flacht der Mehrnutzen je zusätzlicher kWh in der Simulation ab etwa ${DE.num(knick)} kWh so deutlich ab.` },
      { q: 'Was darf eine zusätzliche kWh Speicher kosten, damit sie sich lohnt?', a: `Höchstens so viel, wie sie über ihre Lebensdauer einbringt. Rechnet man mit ${JN} Jahren und konstantem Strompreis, sind die ersten 2 kWh bei 8 kWp und 4 500 kWh je ${DE.eur(wert(erster))} wert, der Schritt von 10 auf 15 kWh nur ${DE.eur(wert(schritte[schritte.length - 1].jeKwh))} je kWh. Liegt der Aufpreis je kWh darüber, rechnet sich die Erweiterung nicht.` },
      { q: 'Zählt die Brutto- oder die nutzbare Kapazität eines Speichers?', a: `Die nutzbare. Datenblätter nennen oft die Bruttokapazität der Zellen, von der ein Teil zum Schutz der Batterie nie entladen wird. Die Simulation rechnet mit nutzbarer Kapazität, einem Wirkungsgrad von ${DE.pct(eta, 1)} je Richtung und einer Leistung von ${DE.num(P.speicher.leistung_kw_je_kwh, 1)} kW je kWh, mindestens ${DE.num(P.speicher.leistung_min_kw, 1)} kW. Vergleichen Sie Angebote immer mit nutzbaren kWh.` },
      { q: 'Sollte der Speicher so viele kWh haben wie die Anlage kWp?', a: `Diese alte Regel führt bei großen Dächern zu zu großen Speichern. Bei 12 kWp und 6 000 kWh Verbrauch bringen 6 kWh im Bundesmittel ${DE.eur(gross6.nutzenJahr - gross0.nutzenJahr)} Mehrnutzen im Jahr, 10 kWh zusammen ${DE.eur(gross10.nutzenJahr - gross0.nutzenJahr)}; ein Speicher mit 12 kWh brächte kaum mehr. Maßgeblich ist der Nachtverbrauch des Haushalts, die Dachgröße bestimmt nur, ob der Speicher voll wird.` },
    ],
    body: (h) => `
<h2>Der Speicher folgt dem Abend, nicht dem Dach</h2>
<p>Ein Batteriespeicher verschiebt Solarstrom vom Mittag in den Abend und die Nacht. Er ist nur so viel wert, wie er in dieser Zeit tatsächlich abgeben kann, und das begrenzt der Verbrauch nach Sonnenuntergang: Kühlschrank, Beleuchtung, Kochen, Fernseher, Router, Standby. In einem typischen Haushalt ohne elektrische Heizung sind das wenige Kilowattstunden pro Nacht. Ein Speicher, der größer ist als dieser Bedarf, wird an den meisten Tagen nicht leer, und eine kWh, die nicht entladen wird, spart nichts. Deshalb lautet die erste Frage nicht, wie groß die Solaranlage ist, sondern wie viel Strom Sie nachts brauchen. Die Anlage muss nur groß genug sein, um den Speicher an sonnigen Tagen zusätzlich zum Tagesverbrauch zu füllen, was bei üblichen Dachanlagen von Frühjahr bis Herbst fast immer gelingt.</p>

<h2>Was jede zusätzliche kWh bringt</h2>
<p>Die Tabelle zeigt den Grundfall des Rechners oben: 8 kWp nach Süden im Bundesmittel laut ${h.src('pvgis', 'PVGIS')}, 4 500 kWh Verbrauch, simuliert mit den ${h.src('htw_lastprofile', 'Lastprofilen der HTW Berlin')} und einem Strompreis von ${h.num(STROMPREIS_CT, 1)} ct/kWh nach ${h.src('eurostat_strom', 'Eurostat')}.</p>
${h.table(['Speicher', 'Autarkie', 'Eigenverbrauchsanteil', 'Nutzen im Jahr', 'Mehrnutzen je zusätzlicher kWh'], reihe.map((s, i) => [
  `${h.num(s.g)} kWh`, h.pct(s.x.autarkie), h.pct(s.x.eigenAnteil), h.eur(s.x.nutzenJahr), i === 0 ? '–' : h.eur(schritte[i - 1].jeKwh),
]), 'Nutzen = gesparter Strombezug plus Einspeisevergütung. Mehrnutzen je kWh bezogen auf den vorigen Schritt.', ['l', 'r', 'r', 'r', 'r'])}
<p>Die Kurve hat einen klaren Knick. Bis etwa ${h.num(knick)} kWh bringt jede kWh viel, weil sie an fast jedem Tag von März bis Oktober einmal voll durchläuft. Danach sinkt der Ertrag je kWh deutlich, und ab 10 kWh ist er so klein, dass er kaum noch eine Batterie bezahlt. Die Autarkie steigt dabei weiter, aber immer langsamer: Wer auf hohe Prozentzahlen zielt, kauft vor allem teure Winterreserve, die im Winter mangels Überschuss nicht geladen wird.</p>

<h2>Drei Haushalte im Vergleich</h2>
${h.table(['Haushalt', 'ohne Speicher', 'mittlerer Speicher', 'großer Speicher'], [
  ['5 kWp, 2 500 kWh', `${h.pct(klein0.autarkie)} / ${h.eur(klein0.nutzenJahr)}`, `3 kWh: ${h.pct(klein3.autarkie)} / ${h.eur(klein3.nutzenJahr)}`, `6 kWh: ${h.pct(klein6.autarkie)} / ${h.eur(klein6.nutzenJahr)}`],
  ['8 kWp, 4 500 kWh', `${h.pct(s0.autarkie)} / ${h.eur(s0.nutzenJahr)}`, `6 kWh: ${h.pct(s6.autarkie)} / ${h.eur(s6.nutzenJahr)}`, `10 kWh: ${h.pct(s10.autarkie)} / ${h.eur(s10.nutzenJahr)}`],
  ['12 kWp, 6 000 kWh', `${h.pct(gross0.autarkie)} / ${h.eur(gross0.nutzenJahr)}`, `6 kWh: ${h.pct(gross6.autarkie)} / ${h.eur(gross6.nutzenJahr)}`, `10 kWh: ${h.pct(gross10.autarkie)} / ${h.eur(gross10.nutzenJahr)}`],
], 'Autarkie / Nutzen im Jahr. Bundesmittel, Süd 30°, kein Smart Meter.', ['l', 'r', 'r', 'r'])}
<p>Der Vergleich bestätigt die Faustregel von gut einer kWh je 1 000 kWh Jahresverbrauch. Der kleine Haushalt gewinnt mit 3 kWh am meisten je Euro, der große mit 6 bis 10 kWh. Eine Wärmepumpe oder ein abends geladenes Elektroauto verschiebt die Rechnung nach oben, weil dann auch nachts Strom gebraucht wird; tragen Sie in diesem Fall den höheren Verbrauch in den ${h.a('stromspeicher-rechner', 'Stromspeicher-Rechner')} ein.</p>

<h2>Was die Simulation annimmt</h2>
<ul>
<li>Nutzbare Kapazität, nicht Bruttokapazität der Zellen.</li>
<li>Wirkungsgrad ${h.pct(eta, 1)} beim Laden und ebenso beim Entladen, zusammen also ${h.pct(eta * eta, 1)}.</li>
<li>Lade- und Entladeleistung ${h.num(P.speicher.leistung_kw_je_kwh, 1)} kW je kWh Kapazität, mindestens ${h.num(P.speicher.leistung_min_kw, 1)} kW.</li>
<li>Der Speicher lädt nur aus Solarüberschuss, nie aus dem Netz, und entlädt nur für den eigenen Verbrauch.</li>
<li>Gemessene Lastgänge von 74 Haushalten aus dem Jahr 2010, also ohne Wärmepumpe und Elektroauto.</li>
</ul>
<p>Alterung ist nicht eingerechnet. Ein Speicher verliert über die Jahre Kapazität; wer an der Grenze rechnet, wählt deshalb eher die nächste Stufe als die kleinere. Die Steuer spielt keine Rolle: Lieferung und Montage eines Speichers für eine Anlage bis ${h.num(P.steuer.ust_null_bis_kwp)} kWp sind von der Umsatzsteuer befreit (${h.src('ustg_12', '§ 12 Abs. 3 UStG')}).</p>

<h2>Wann ein größerer Speicher doch sinnvoll ist</h2>
<p>Drei Situationen sprechen für mehr Kapazität. Erstens hoher Abend- und Nachtverbrauch durch Wärmepumpe, Elektroauto oder Schichtarbeit. Zweitens die Nulleinspeisung, bei der jede nicht gespeicherte kWh verloren ist statt vergütet; dazu die Seite ${h.a('nulleinspeisung', 'Nulleinspeisung')}. Drittens eine strengere Einspeisegrenze: Der Regierungsentwurf zum EEG 2027 sieht für neue Dachanlagen eine dauerhafte Kappung auf ${h.pct(P.eeg2027.kappung_anteil)} vor, und mit Smart Meter gehen schon heute die Stunden mit ${h.a('negative-strompreise', 'negativen Strompreisen')} unvergütet aus. Ein Speicher hilft dagegen aber nur, wenn ein Energiemanager ihn gezielt mittags lädt, statt ihn schon am Vormittag zu füllen. Ohne eine solche Steuerung bleibt die Größe nach dem Abendverbrauch die bessere Wahl.</p>`,
  },
  en: {
    slug: 'home-battery-size',
    nav: 'Battery size',
    card: 'How many kWh of battery suit your system and consumption: self-sufficiency, value of each extra kWh and the point where more hardly pays.',
    title: 'Home Battery Size Germany 2026: How Many kWh You Need',
    description: `Home battery size 2026: for 8 kWp and 4,500 kWh, the benefit flattens from about ${EN.num(knick)} kWh. Self-sufficiency, value per extra kWh and three German homes compared.`,
    h1: 'Home battery size 2026: how many kWh are really worth it',
    intro: `A household using 4,500 kWh with 8 kWp covers ${EN.pct(s0.autarkie)} of its needs itself without a battery, ${EN.pct(s6.autarkie)} with 6 kWh and ${EN.pct(s15.autarkie)} with 15 kWh. Every kWh above about ${EN.num(knick)} kWh adds little.`,
    resume: `The right size for a home battery (Stromspeicher) follows from consumption between sunset and sunrise, not from the size of the solar system. The quarter-hour simulation with 74 metered German households shows this clearly: a household using 4,500 kWh a year with an 8 kWp system on the national average reaches ${EN.pct(s0.autarkie)} self-sufficiency without a battery. The first 2 kWh of storage add ${EN.eur(erster)} of benefit per kWh a year, because they are charged and emptied almost every evening. From about ${EN.num(knick)} kWh this value halves, and going from 10 to 15 kWh each extra kWh adds only ${EN.eur(schritte[schritte.length - 1].jeKwh)}, because a large battery is not filled in winter and not emptied on summer nights. With 6 kWh, the system’s benefit rises from ${EN.eur(s0.nutzenJahr)} to ${EN.eur(s6.nutzenJahr)} a year. As a rule of thumb for homes without a heat pump or electric car, the simulation supports a little over one kWh of usable capacity per 1,000 kWh of annual consumption. Since 2023, no VAT is charged on batteries for systems up to ${EN.num(P.steuer.ust_null_bis_kwp)} kWp.`,
    faqs: [
      { q: 'What battery size suits 8 kWp and 4,500 kWh of consumption?', a: `In the simulation, the sensible range is ${EN.num(knick)} to 8 kWh of usable capacity. With 6 kWh, self-sufficiency rises from ${EN.pct(s0.autarkie)} to ${EN.pct(s6.autarkie)} and the annual benefit by ${EN.eur(s6.nutzenJahr - s0.nutzenJahr)}. Going from 6 to 10 kWh adds only ${EN.eur(s10.nutzenJahr - s6.nutzenJahr)}. More only pays if a heat pump or electric car also needs power in the evening.` },
      { q: 'Which battery size fits a two-person home using 2,500 kWh?', a: `A small one. With 5 kWp and 2,500 kWh of consumption, a 3 kWh battery adds ${EN.eur(klein3.nutzenJahr - klein0.nutzenJahr)} of benefit a year on the national average; doubling to 6 kWh adds only another ${EN.eur(klein6.nutzenJahr - klein3.nutzenJahr)}. The evening and night consumption of a small household is simply too low to empty a large battery every day.` },
      { q: 'Does a large battery help in winter?', a: `Not much. From November to February, a rooftop system often produces little more than the house uses directly during the day, leaving no surplus to charge with. A large battery then sits half empty. Its extra benefit arises almost entirely between April and September. That is why, in the simulation, the value of each additional kWh flattens so clearly from about ${EN.num(knick)} kWh.` },
      { q: 'How much can an extra kWh of battery cost and still pay off?', a: `At most what it earns over its life. Assuming ${JN} years and a constant electricity price, the first 2 kWh at 8 kWp and 4,500 kWh are worth ${EN.eur(wert(erster))} each, the step from 10 to 15 kWh only ${EN.eur(wert(schritte[schritte.length - 1].jeKwh))} per kWh. If the extra price per kWh is higher, the upgrade does not pay.` },
      { q: 'Does gross or usable battery capacity count?', a: `Usable. Data sheets often state the gross capacity of the cells, part of which is never discharged to protect the battery. The simulation uses usable capacity, an efficiency of ${EN.pct(eta, 1)} in each direction and a power of ${EN.num(P.speicher.leistung_kw_je_kwh, 1)} kW per kWh, at least ${EN.num(P.speicher.leistung_min_kw, 1)} kW. Always compare quotes in usable kWh.` },
      { q: 'Should battery kWh match the system’s kWp?', a: `That old rule leads to oversized batteries on large roofs. With 12 kWp and 6,000 kWh of consumption, 6 kWh add ${EN.eur(gross6.nutzenJahr - gross0.nutzenJahr)} of benefit a year on the national average, 10 kWh ${EN.eur(gross10.nutzenJahr - gross0.nutzenJahr)} in total; a 12 kWh battery would add little more. What counts is the household’s night-time consumption; the roof size only decides whether the battery gets full.` },
    ],
    body: (h) => `
<h2>The battery follows your evenings, not your roof</h2>
<p>A battery shifts solar power from midday to the evening and night. It is only worth as much as it can actually deliver in that time, and evening consumption sets the limit: fridge, lighting, cooking, television, router, standby. In a typical home without electric heating, that is a few kilowatt-hours a night. A battery larger than that need is not emptied on most days, and a kWh that is never discharged saves nothing. So the first question is not how big the solar system is, but how much power you use at night. The system only has to be large enough to fill the battery on sunny days on top of daytime use, which typical rooftop systems manage almost every day from spring to autumn.</p>

<h2>What each extra kWh brings</h2>
<p>The table shows the base case of the calculator above: 8 kWp facing south on the national average according to ${h.src('pvgis', 'PVGIS')}, 4,500 kWh consumption, simulated with the ${h.src('htw_lastprofile', 'HTW Berlin load profiles')} and an electricity price of ${h.num(STROMPREIS_CT, 1)} ct/kWh according to ${h.src('eurostat_strom', 'Eurostat')}.</p>
${h.table(['Battery', 'Self-sufficiency', 'Self-consumption share', 'Benefit per year', 'Extra benefit per added kWh'], reihe.map((s, i) => [
  `${h.num(s.g)} kWh`, h.pct(s.x.autarkie), h.pct(s.x.eigenAnteil), h.eur(s.x.nutzenJahr), i === 0 ? '–' : h.eur(schritte[i - 1].jeKwh),
]), 'Benefit = grid power saved plus feed-in payment. Extra benefit per kWh relative to the previous step.', ['l', 'r', 'r', 'r', 'r'])}
<p>The curve has a clear bend. Up to about ${h.num(knick)} kWh, each kWh brings a lot, because it cycles fully on almost every day from March to October. After that, the return per kWh drops markedly, and above 10 kWh it is so small that it barely pays for a battery. Self-sufficiency keeps rising, but ever more slowly: chasing high percentages mostly buys expensive winter reserve that cannot be charged in winter for lack of surplus.</p>

<h2>Three households compared</h2>
${h.table(['Household', 'no battery', 'medium battery', 'large battery'], [
  ['5 kWp, 2,500 kWh', `${h.pct(klein0.autarkie)} / ${h.eur(klein0.nutzenJahr)}`, `3 kWh: ${h.pct(klein3.autarkie)} / ${h.eur(klein3.nutzenJahr)}`, `6 kWh: ${h.pct(klein6.autarkie)} / ${h.eur(klein6.nutzenJahr)}`],
  ['8 kWp, 4,500 kWh', `${h.pct(s0.autarkie)} / ${h.eur(s0.nutzenJahr)}`, `6 kWh: ${h.pct(s6.autarkie)} / ${h.eur(s6.nutzenJahr)}`, `10 kWh: ${h.pct(s10.autarkie)} / ${h.eur(s10.nutzenJahr)}`],
  ['12 kWp, 6,000 kWh', `${h.pct(gross0.autarkie)} / ${h.eur(gross0.nutzenJahr)}`, `6 kWh: ${h.pct(gross6.autarkie)} / ${h.eur(gross6.nutzenJahr)}`, `10 kWh: ${h.pct(gross10.autarkie)} / ${h.eur(gross10.nutzenJahr)}`],
], 'Self-sufficiency / benefit per year. National average, south 30°, no smart meter.', ['l', 'r', 'r', 'r'])}
<p>The comparison confirms the rule of a little over one kWh per 1,000 kWh of annual consumption. The small household gains most per euro with 3 kWh, the large one with 6 to 10 kWh. A heat pump or an electric car charged in the evening pushes the figure up, because power is then needed at night as well; in that case, enter the higher consumption in the ${h.a('stromspeicher-rechner', 'home battery calculator')}.</p>

<h2>What the simulation assumes</h2>
<ul>
<li>Usable capacity, not the gross capacity of the cells.</li>
<li>Efficiency of ${h.pct(eta, 1)} when charging and again when discharging, ${h.pct(eta * eta, 1)} for the round trip.</li>
<li>Charge and discharge power of ${h.num(P.speicher.leistung_kw_je_kwh, 1)} kW per kWh of capacity, at least ${h.num(P.speicher.leistung_min_kw, 1)} kW.</li>
<li>The battery charges only from solar surplus, never from the grid, and discharges only for your own consumption.</li>
<li>Metered load profiles of 74 households from 2010, so without heat pumps or electric cars.</li>
</ul>
<p>Ageing is not included. A battery loses capacity over the years; if you are on the borderline, choose the next size up rather than the smaller one. Tax does not matter: supply and installation of a battery for a system up to ${h.num(P.steuer.ust_null_bis_kwp)} kWp are zero-rated for VAT (${h.src('ustg_12', 'section 12(3) VAT Act')}).</p>

<h2>When a larger battery does make sense</h2>
<p>Three situations argue for more capacity. First, high evening and night consumption from a heat pump, electric car or shift work. Second, zero export, where every kWh not stored is lost rather than paid for; see ${h.a('nulleinspeisung', 'zero export')}. Third, a stricter export limit: the government draft of the EEG 2027 proposes a permanent cap at ${h.pct(P.eeg2027.kappung_anteil)} for new rooftop systems, and with a smart meter the hours with ${h.a('negative-strompreise', 'negative power prices')} already go unpaid today. A battery only helps against these if an energy manager charges it deliberately at midday instead of filling it in the morning. Without such control, sizing to your evening consumption remains the better choice.</p>`,
  },
});

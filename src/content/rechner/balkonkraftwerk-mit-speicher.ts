import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { ortVonPlz } from '../../lib/engine/standort';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Beispiele aus dem Motor: München (80331), 1 800 Wp an 800 VA, 35° Süd, 2 500 kWh Verbrauch,
 * ohne Speicher und mit 1 bis 4 kWh; dazu 800 Wp, senkrechtes Geländer und zwei Verbrauchsstufen.
 * Der Aufpreis von 900 € für die Batterie ist eine Annahme (Startwert des Rechners).
 */
const muc = ortVonPlz('80331')!;
const VB = 2500, AUF = 900;
const basis = { ort: muc, modulWp: 1800, wechselrichterVa: P.balkon.max_va, neigung: 35, azimut: 0, verschattung: 0, verbrauchKwh: VB, preisCt: STROMPREIS_CT, kostenEur: 0 };
const run = (o: Partial<typeof basis> & { speicherKwh: number }) => rechneBalkon({ ...basis, ...o });
const o0 = run({ speicherKwh: 0 });
const m2 = run({ speicherKwh: 2 });
const m4 = run({ speicherKwh: 4 });
const plus2 = m2.ersparnisJahr - o0.ersparnisJahr;
const plus4 = m4.ersparnisJahr - o0.ersparnisJahr;
const amort2 = AUF / plus2;
const groessen = [0, 1, 1.5, 2, 3, 4].map((s) => ({ s, r: run({ speicherKwh: s }) }));
/** Kleines Set mit 800 Wp: kaum Überschuss, also wenig für den Speicher. */
const k0 = run({ modulWp: 800, speicherKwh: 0 }), k2 = run({ modulWp: 800, speicherKwh: 2 });
const plusKlein = k2.ersparnisJahr - k0.ersparnisJahr;
/** Senkrecht am Geländer (90°). */
const g0 = run({ neigung: 90, speicherKwh: 0 }), g2 = run({ neigung: 90, speicherKwh: 2 });
const plusGel = g2.ersparnisJahr - g0.ersparnisJahr;
/** Single-Haushalt (1 500 kWh) und Familie (3 500 kWh), je 1 800 Wp und 2 kWh. */
const s0 = run({ verbrauchKwh: 1500, speicherKwh: 0 }), s2 = run({ verbrauchKwh: 1500, speicherKwh: 2 });
const f0 = run({ verbrauchKwh: 3500, speicherKwh: 0 }), f2 = run({ verbrauchKwh: 3500, speicherKwh: 2 });
const plusSingle = s2.ersparnisJahr - s0.ersparnisJahr, plusFam = f2.ersparnisJahr - f0.ersparnisJahr;
const rundweg = P.speicher.eta_richtung * P.speicher.eta_richtung;

export default defineGuide({
  id: 'balkonkraftwerk-mit-speicher',
  group: 'balkon',
  order: 12,
  tool: 'balkonspeicher',
  related: ['balkonkraftwerk-800-watt', 'balkonkraftwerk-lohnt-sich', 'stromspeicher-rechner', 'nulleinspeisung', 'balkonkraftwerk-ertrag', 'balkonkraftwerk-anmelden'],
  sources: ['pvgis', 'htw_lastprofile', 'eeg_8', 'ustg_12', 'bnetza_solar'],
  de: {
    slug: 'balkonkraftwerk-mit-speicher',
    nav: 'Balkonkraftwerk mit Speicher',
    card: 'Dieselben Module mit und ohne Batterie: zusätzlich selbst genutzter Strom, Mehrersparnis und Amortisation des Speichers.',
    title: 'Balkonkraftwerk mit Speicher 2026: lohnt sich die Batterie?',
    description: `Balkonkraftwerk mit Speicher 2026 nach PLZ: Eigenverbrauch mit 1 bis 4 kWh Batterie, gespeicherter Strom über ${DE.num(P.balkon.max_va)} VA, Mehrersparnis und Amortisation in Jahren.`,
    h1: 'Balkonkraftwerk mit Speicher 2026: was die Batterie zusätzlich spart',
    intro: `Ein Balkonkraftwerk mit ${DE.num(1800)} Wp in München deckt mit 2 kWh Speicher ${DE.pct(m2.eigenAnteil)} statt ${DE.pct(o0.eigenAnteil)} seines Ertrags im Haushalt und spart ${DE.eur(plus2)} mehr im Jahr. Bei ${DE.eur(AUF)} Aufpreis ist die Batterie nach ${DE.num(amort2, 1)} Jahren bezahlt.`,
    resume: `Ein Balkonkraftwerk mit Speicher spart nur dann mehr, wenn mittags Strom übrig ist, den sonst niemand im Haushalt verbraucht. Der Rechner vergleicht deshalb dieselbe Anlage zweimal: ohne Batterie und mit der gewählten Kapazität, jeweils mit PVGIS-Ertrag für Ihre Postleitzahl und dem Verbrauch gemessener Haushalte der HTW Berlin. Im Beispiel München liefern ${DE.num(1800)} Wp bei 35° Süd ${DE.num(o0.ertragBrutto)} kWh vor dem Wechselrichter. Ohne Speicher nutzt ein Haushalt mit ${DE.num(VB)} kWh davon ${DE.num(o0.selbst)} kWh, ${DE.num(o0.abgeregelt)} kWh gehen an der ${DE.num(P.balkon.max_va)}-VA-Grenze verloren. Mit 2 kWh steigt der selbst genutzte Strom auf ${DE.num(m2.selbst)} kWh, weil die Batterie auch einen Teil der Spitze über ${DE.num(P.balkon.max_va)} VA aufnimmt. Das sind ${DE.eur(plus2)} Mehrersparnis im Jahr bei ${DE.num(STROMPREIS_CT, 1)} ct je kWh. Ein 800-Wp-Set gewinnt mit derselben Batterie nur ${DE.eur(plusKlein)}: Der Speicher lohnt sich vor allem bei viel Modulleistung.`,
    faqs: [
      { q: 'Wie viel spart ein Balkonkraftwerk mit 2 kWh Speicher mehr als ohne?', a: `In München mit ${DE.num(1800)} Wp, Süd 35° und ${DE.num(VB)} kWh Verbrauch steigt die Ersparnis von ${DE.eur(o0.ersparnisJahr)} auf ${DE.eur(m2.ersparnisJahr)} im Jahr, also um ${DE.eur(plus2)}. Gerechnet ist mit ${DE.num(STROMPREIS_CT, 1)} ct je kWh, dem Haushaltsstrompreis laut Eurostat. Eingespeister Strom bringt im Rechner nichts, deshalb zählt nur die zusätzlich selbst genutzte Kilowattstunde.` },
      { q: 'Lohnt sich ein Speicher an einem 800-Wp-Balkonkraftwerk?', a: `Kaum. Mit ${DE.num(800)} Wp bleibt in München mittags wenig übrig: Ohne Batterie nutzt der Beispielhaushalt schon ${DE.pct(k0.eigenAnteil)} des Ertrags, mit 2 kWh steigt die Ersparnis nur um ${DE.eur(plusKlein)} im Jahr. Bei ${DE.eur(AUF)} Aufpreis dauert die Amortisation ${DE.num(AUF / plusKlein, 1)} Jahre. Erst mit mehr Modulfläche, bis ${DE.num(P.balkon.max_wp)} Wp sind erlaubt, entsteht genug Überschuss für die Batterie.` },
      { q: 'Ist 4 kWh Speicher am Balkon besser als 2 kWh?', a: `Für einen Haushalt mit ${DE.num(VB)} kWh nur wenig. Mit ${DE.num(1800)} Wp in München bringt 2 kWh ${DE.eur(plus2)} Mehrersparnis, 4 kWh ${DE.eur(plus4)}. Die zweite Hälfte der Kapazität füllt sich vor allem im Sommer und bleibt im Winter leer, weil dann schon der Tagesverbrauch den Ertrag aufnimmt. Der Rechner zeigt, ob der höhere Aufpreis diesen Unterschied rechtfertigt.` },
      { q: 'Bringt die Batterie mehr, wenn die Module senkrecht am Geländer hängen?', a: `Weniger. Senkrecht montiert erzeugen dieselben ${DE.num(1800)} Wp in München ${DE.num(g0.ertragBrutto)} kWh statt ${DE.num(o0.ertragBrutto)} kWh, die Mittagsspitze ist flacher. Mit 2 kWh Speicher beträgt die Mehrersparnis dann ${DE.eur(plusGel)} statt ${DE.eur(plus2)} im Jahr. Wer aufständern kann, gewinnt meist mehr durch den besseren Winkel als durch eine Batterie.` },
      { q: 'Spielt die Haushaltsgröße beim Balkonspeicher eine Rolle?', a: `Weniger als gedacht. Mit ${DE.num(1800)} Wp und 2 kWh in München spart ein Single-Haushalt mit ${DE.num(1500)} kWh ${DE.eur(plusSingle)} zusätzlich, eine Familie mit ${DE.num(3500)} kWh ${DE.eur(plusFam)}. Der kleine Haushalt hat mehr Überschuss, braucht abends aber weniger; der große verbraucht abends mehr, hat dafür mittags weniger übrig. Beide Effekte gleichen sich weitgehend aus.` },
    ],
    body: (h) => `
<h2>Was die Batterie am Balkon verschiebt</h2>
<p>Ein Balkonkraftwerk erzeugt mittags am meisten, der Haushalt verbraucht morgens und abends. Ohne Speicher fließt der Überschuss unbezahlt ins Netz, und was die Module über ${h.num(P.balkon.max_va)} VA hinaus liefern, regelt der Wechselrichter ab. Der Rechner nimmt einen Speicher auf der Gleichstromseite an: Er lädt den Überschuss einschließlich dieser Spitze und gibt ihn abends bis zur Wechselrichtergrenze wieder ab. Je Richtung geht ein Teil verloren, hin und zurück bleiben rund ${h.pct(rundweg, 0)} übrig. Die Lade- und Entladeleistung setzt die Simulation mit ${h.num(P.speicher.leistung_kw_je_kwh, 1)} kW je kWh an, mindestens ${h.num(P.speicher.leistung_min_kw, 1)} kW.</p>
<p>Der Ertrag kommt aus ${h.src('pvgis', 'PVGIS')} für Ihre Postleitzahl, der Verbrauch aus den Viertelstundenprofilen von 74 Haushalten (${h.src('htw_lastprofile', 'HTW Berlin')}). So entsteht kein Durchschnittswert, sondern ein ganzes Jahr mit trüben Wochen, Urlaubstagen und hellen Sommerabenden.</p>

<h2>Speichergrößen im Vergleich</h2>
${h.table(['Speicher', 'selbst genutzt', 'Anteil', 'abgeregelt', 'Ersparnis/Jahr'], groessen.map(({ s, r }) => [
  s === 0 ? 'ohne' : `${h.num(s, s % 1 ? 1 : 0)} kWh`, `${h.num(r.selbst)} kWh`, h.pct(r.eigenAnteil, 0), `${h.num(r.abgeregelt)} kWh`, h.eur(r.ersparnisJahr),
]), `München, ${h.num(1800)} Wp an ${h.num(P.balkon.max_va)} VA, Süd 35°, Verbrauch ${h.num(VB)} kWh, Strompreis ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die erste Kilowattstunde Kapazität bringt am meisten, jede weitere weniger. Zwischen 2 und 4 kWh liegen hier nur ${h.eur(plus4 - plus2)} im Jahr. Der Grund ist der Winter: Von November bis Februar reicht der Ertrag selten, um die Batterie überhaupt zu füllen.</p>

<h2>Wann sich der Aufpreis rechnet</h2>
<p>Die Amortisation ist der Aufpreis für den Speicher geteilt durch die Mehrersparnis, nicht durch die gesamte Ersparnis der Anlage. Bei ${h.eur(AUF)} und ${h.eur(plus2)} im Jahr sind das ${h.num(amort2, 1)} Jahre. Vergleichen Sie diese Zahl mit der Garantie des Herstellers auf die Zellen: Liegt die Amortisation darüber, rechnet sich die Batterie nur, wenn der Strompreis steigt. Am meisten bringt sie bei großer Modulleistung, freier Südlage und einem Haushalt, der tagsüber leer steht. Wer mit ${h.num(800)} Wp beginnt, prüft zuerst im ${h.a('balkonkraftwerk-800-watt', 'Ratgeber zu 800 und 2 000 Watt')}, ob mehr Module möglich sind.</p>

<h2>Regeln, die mit Batterie unverändert gelten</h2>
<p>Für Steckersolargeräte nennt ${h.src('eeg_8', '§ 8 Abs. 5a EEG')} höchstens ${h.num(P.balkon.max_wp)} Watt Modulleistung und ${h.num(P.balkon.max_va)} Voltampere Wechselrichterleistung; der Rechner rechnet mit dieser Ausgangsgrenze. Auf die Lieferung von Speichern für Photovoltaikanlagen fällt keine Umsatzsteuer an (${h.src('ustg_12', '§ 12 Abs. 3 UStG')}). Die Anmeldung im Marktstammdatenregister beschreibt der Ratgeber ${h.a('balkonkraftwerk-anmelden', 'Balkonkraftwerk anmelden')}; Fragen zur Technik beantwortet die ${h.src('bnetza_solar', 'Bundesnetzagentur')}. Wer gar nichts einspeisen möchte, findet die Varianten unter ${h.a('nulleinspeisung', 'Nulleinspeisung')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-with-battery',
    nav: 'Plug-in solar with battery',
    card: 'The same panels with and without a battery: extra power used at home, extra saving and battery payback.',
    title: 'Plug-in Solar with Battery Germany 2026: Is It Worth It?',
    description: `Plug-in solar with battery in Germany 2026 by postcode: self-use with 1 to 4 kWh storage, stored power above ${EN.num(P.balkon.max_va)} VA, extra saving and payback in years.`,
    h1: 'Plug-in solar with battery 2026: what the storage adds',
    intro: `A ${EN.num(1800)} Wp balcony system (Balkonkraftwerk) in Munich covers ${EN.pct(m2.eigenAnteil)} instead of ${EN.pct(o0.eigenAnteil)} of its output at home with a 2 kWh battery and saves ${EN.eur(plus2)} more a year. At an extra ${EN.eur(AUF)}, the battery pays for itself in ${EN.num(amort2, 1)} years.`,
    resume: `A plug-in solar system with a battery only saves more if there is power left over at midday that nobody in the home would use. The calculator therefore runs the same system twice: once without storage and once with the capacity you choose, each time with the PVGIS yield for your postcode and the consumption of metered households from HTW Berlin. In the Munich example, ${EN.num(1800)} Wp facing south at 35° produce ${EN.num(o0.ertragBrutto)} kWh before the inverter. Without a battery, a household using ${EN.num(VB)} kWh uses ${EN.num(o0.selbst)} kWh of it, and ${EN.num(o0.abgeregelt)} kWh are lost at the ${EN.num(P.balkon.max_va)} VA limit. With 2 kWh, self-used power rises to ${EN.num(m2.selbst)} kWh, because the battery also absorbs part of the peak above ${EN.num(P.balkon.max_va)} VA. That is ${EN.eur(plus2)} of extra saving a year at ${EN.num(STROMPREIS_CT, 1)} ct per kWh. An 800 Wp kit gains only ${EN.eur(plusKlein)} with the same battery: storage pays mainly when there is plenty of panel capacity.`,
    faqs: [
      { q: 'How much more does a balcony system with a 2 kWh battery save?', a: `In Munich, with ${EN.num(1800)} Wp facing south at 35° and ${EN.num(VB)} kWh of consumption, the saving rises from ${EN.eur(o0.ersparnisJahr)} to ${EN.eur(m2.ersparnisJahr)} a year, an increase of ${EN.eur(plus2)}. The price used is ${EN.num(STROMPREIS_CT, 1)} ct per kWh, the household rate reported by Eurostat. Power exported to the grid earns nothing in the calculator, so only each extra kilowatt-hour used at home counts.` },
      { q: 'Is a battery worth adding to an 800 Wp plug-in kit?', a: `Hardly. With ${EN.num(800)} Wp there is little left over at midday in Munich: without storage the example household already uses ${EN.pct(k0.eigenAnteil)} of the output, and 2 kWh only add ${EN.eur(plusKlein)} a year. At an extra cost of ${EN.eur(AUF)}, payback takes ${EN.num(AUF / plusKlein, 1)} years. Only with more panel area, up to ${EN.num(P.balkon.max_wp)} Wp being allowed, is there enough surplus to fill a battery.` },
      { q: 'Is 4 kWh of balcony storage better than 2 kWh?', a: `Only slightly for a household using ${EN.num(VB)} kWh. With ${EN.num(1800)} Wp in Munich, 2 kWh bring ${EN.eur(plus2)} of extra saving and 4 kWh ${EN.eur(plus4)}. The second half of the capacity fills mainly in summer and stays empty in winter, when daytime use already absorbs the output. The calculator shows whether the higher price justifies the difference.` },
      { q: 'Does the battery add more if the panels hang upright on the railing?', a: `Less. Mounted upright, the same ${EN.num(1800)} Wp in Munich produce ${EN.num(g0.ertragBrutto)} kWh instead of ${EN.num(o0.ertragBrutto)} kWh, and the midday peak is flatter. With 2 kWh of storage the extra saving is then ${EN.eur(plusGel)} instead of ${EN.eur(plus2)} a year. If you can tilt the panels on a stand, the better angle usually gains more than a battery.` },
      { q: 'Does household size matter for balcony storage?', a: `Less than you might think. With ${EN.num(1800)} Wp and 2 kWh in Munich, a single person using ${EN.num(1500)} kWh saves an extra ${EN.eur(plusSingle)}, a family using ${EN.num(3500)} kWh ${EN.eur(plusFam)}. The small household has more surplus but needs less in the evening; the large one uses more in the evening but has less to spare at midday. The two effects largely cancel out.` },
    ],
    body: (h) => `
<h2>What the battery shifts on a balcony</h2>
<p>A plug-in system produces most at midday, while a household uses power in the morning and evening. Without storage the surplus flows into the grid unpaid, and whatever the panels deliver above ${h.num(P.balkon.max_va)} VA is clipped by the inverter. The calculator assumes a battery on the direct-current side: it charges with the surplus, including that peak, and releases it in the evening up to the inverter limit. Some energy is lost in each direction, leaving about ${h.pct(rundweg, 0)} for the round trip. The simulation sets charging and discharging power at ${h.num(P.speicher.leistung_kw_je_kwh, 1)} kW per kWh, at least ${h.num(P.speicher.leistung_min_kw, 1)} kW.</p>
<p>Yield comes from ${h.src('pvgis', 'PVGIS')} for your postcode, consumption from the quarter-hour profiles of 74 households (${h.src('htw_lastprofile', 'HTW Berlin')}). The result is not an average but a full year with dull weeks, holidays away and bright summer evenings.</p>

<h2>Battery sizes compared</h2>
${h.table(['Battery', 'Used at home', 'Share', 'Clipped', 'Saving/year'], groessen.map(({ s, r }) => [
  s === 0 ? 'none' : `${h.num(s, s % 1 ? 1 : 0)} kWh`, `${h.num(r.selbst)} kWh`, h.pct(r.eigenAnteil, 0), `${h.num(r.abgeregelt)} kWh`, h.eur(r.ersparnisJahr),
]), `Munich, ${h.num(1800)} Wp on ${h.num(P.balkon.max_va)} VA, south 35°, consumption ${h.num(VB)} kWh, price ${h.num(STROMPREIS_CT, 1)} ct/kWh.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The first kilowatt-hour of capacity earns the most, each further one less. Between 2 and 4 kWh the gap here is just ${h.eur(plus4 - plus2)} a year. The reason is winter: from November to February the output is rarely enough to fill the battery at all.</p>

<h2>When the extra cost pays off</h2>
<p>Payback is the extra price of the battery divided by the extra saving, not by the whole saving of the system. At ${h.eur(AUF)} and ${h.eur(plus2)} a year that is ${h.num(amort2, 1)} years. Compare this with the manufacturer's warranty on the cells: if payback is longer, the battery only pays if electricity prices rise. It earns most with high panel capacity, an open south-facing spot and a home that is empty during the day. If you start with ${h.num(800)} Wp, first check in the ${h.a('balkonkraftwerk-800-watt', 'guide to 800 and 2,000 watts')} whether more panels are possible.</p>

<h2>Rules that stay the same with a battery</h2>
<p>For plug-in solar devices (Steckersolargeräte), ${h.src('eeg_8', 'section 8(5a) EEG')} sets a maximum of ${h.num(P.balkon.max_wp)} watts of panel capacity and ${h.num(P.balkon.max_va)} volt-amperes of inverter output; the calculator uses that output limit. No VAT is charged on batteries supplied for photovoltaic systems (${h.src('ustg_12', 'section 12(3) VAT Act')}). Registration in the market data register is covered in ${h.a('balkonkraftwerk-anmelden', 'registering plug-in solar')}; technical questions are answered by the ${h.src('bnetza_solar', 'Federal Network Agency')}. If you want to export nothing at all, see ${h.a('nulleinspeisung', 'zero export')}.</p>`,
  },
});

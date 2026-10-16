import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';
import ST from '../../data/staedte.json';

/** Beispiele aus dem Motor: ein Set mit 1 800 Wp und 800 VA (Bundesmittel, 35° Süd), dazu ein zu großes Set mit 2 400 Wp. */
const basis = { ort: null, wechselrichterVa: P.balkon.max_va, neigung: 35, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: STROMPREIS_CT, kostenEur: 700 };
const set = rechneBalkon({ ...basis, modulWp: 1800 });
const zuGross = rechneBalkon({ ...basis, modulWp: 2400 });
const mitSpeicher = rechneBalkon({ ...basis, modulWp: 1800, speicherKwh: 2 });
const imRegister = ST.bund.balkon;
const stand = ST.source.mastr_retrieved_at;
const frist = P.mastr.frist_monate;

export default defineGuide({
  id: 'balkonkraftwerk-anmelden',
  group: 'balkon',
  order: 20,
  mini: 'anmeldung',
  related: ['marktstammdatenregister-anmelden', 'balkonkraftwerk-zaehler', 'balkonkraftwerk-800-watt', 'balkonkraftwerk-mit-speicher'],
  sources: ['mastr', 'mastrv_5', 'eeg_8', 'eeg_10a', 'bnetza_solar', 'mastr_einheiten'],
  de: {
    slug: 'balkonkraftwerk-anmelden',
    nav: 'Balkonkraftwerk anmelden',
    card: 'Eintrag im Marktstammdatenregister Schritt für Schritt, Speicher als eigene Einheit, keine Meldung an den Netzbetreiber.',
    title: 'Balkonkraftwerk anmelden 2026: Register in fünf Schritten',
    description: `Balkonkraftwerk anmelden 2026: nur im Marktstammdatenregister, binnen ${frist} Monat, ohne Netzbetreiber. Schritte, Pflichtangaben, Speicher als zweite Einheit.`,
    h1: 'Balkonkraftwerk anmelden 2026: der Eintrag im Register, Schritt für Schritt',
    intro: `Ein Steckersolargerät bis ${DE.num(P.balkon.max_wp)} Wp und ${DE.num(P.balkon.max_va)} VA wird nur noch im Marktstammdatenregister eingetragen, spätestens ${frist} Monat nach dem ersten Einstecken. Den Netzbetreiber informiert das Register selbst.`,
    resume: `Wer ein Balkonkraftwerk anmelden will, hat seit dem Solarpaket I genau eine Stelle: das Marktstammdatenregister (MaStR) der Bundesnetzagentur. Die Frist beträgt ${frist} Monat ab Inbetriebnahme (§ 5 Abs. 5 MaStRV). Eine zusätzliche Meldung beim Netzbetreiber darf für Geräte bis ${DE.num(P.balkon.max_wp)} Wp Modulleistung und ${DE.num(P.balkon.max_va)} VA Wechselrichterleistung nicht verlangt werden (§ 8 Abs. 5a EEG). Ein Set mit 1 800 Wp liegt innerhalb dieser Grenzen und erzeugt im Bundesmittel bei 35° Südneigung rund ${DE.num(set.ertrag)} kWh im Jahr; eines mit 2 400 Wp ist kein Steckersolargerät mehr und braucht den Weg über Elektrofachkraft und Netzbetreiber. Ein Batteriespeicher ist im Register eine eigene Einheit mit eigener Nummer, also zwei Einträge statt einem. Laut öffentlicher Einheitenübersicht stehen ${DE.num(imRegister)} Steckersolargeräte im Register (Abruf ${stand}). Der Eintrag ist kostenlos und dauert mit Kaufbeleg und Typenschild etwa eine Viertelstunde.`,
    faqs: [
      { q: 'Muss ich mein Balkonkraftwerk beim Netzbetreiber und im Register anmelden?', a: `Nur im Register. § 8 Abs. 5a EEG sagt ausdrücklich, dass der Netzbetreiber für Steckersolargeräte bis ${DE.num(P.balkon.max_wp)} Wp und ${DE.num(P.balkon.max_va)} VA keine zusätzlichen Meldungen verlangen kann. Er erfährt von Ihrem Gerät über das Marktstammdatenregister, prüft dort die Daten und veranlasst später den Zählertausch. Ein Formular des Netzbetreibers müssen Sie nicht ausfüllen, auch wenn manche Webseiten das noch verlangen.` },
      { q: 'Welche Angaben verlangt das Register für ein Steckersolargerät?', a: 'Den Standort mit Adresse, das Datum der ersten Inbetriebnahme, die Summe der Modulleistung in Watt peak und die Leistung des Wechselrichters in Voltampere, dazu Ihre Daten als Betreiber. Die Werte stehen auf dem Typenschild und im Datenblatt. Für Steckersolargeräte fragt das Register deutlich weniger ab als für eine Dachanlage. Den zuständigen Netzbetreiber ordnet das System über die Adresse zu, suchen müssen Sie ihn nicht.' },
      { q: 'Bekommt der Speicher am Balkonkraftwerk einen eigenen Registereintrag?', a: `Ja. Das Register führt Solarmodule und Stromspeicher als getrennte Einheiten, jede mit eigener Nummer. Wer 1 800 Wp mit einem 2-kWh-Speicher betreibt, legt also zwei Einheiten an und verknüpft sie. Der Speicher hebt im Beispiel den selbst genutzten Strom von ${DE.num(set.selbst)} auf ${DE.num(mitSpeicher.selbst)} kWh im Jahr, ändert an der Frist von ${frist} Monat aber nichts.` },
      { q: 'Was passiert, wenn mein Set 2 400 Wp Module hat?', a: `Dann ist es rechtlich kein Steckersolargerät mehr, denn § 8 Abs. 5a EEG endet bei ${DE.num(P.balkon.max_wp)} Wp. Die vereinfachte Anmeldung, der Betrieb am alten Zähler und der Verzicht auf die Meldung beim Netzbetreiber gelten nicht. Eine solche Anlage gehört zu einer Elektrofachkraft, die sie beim Netzbetreiber anmeldet. Der Mini-Rechner oben zeigt diese Grenze sofort an.` },
      { q: 'Muss ich ein vor Mai 2024 gekauftes Gerät neu anmelden?', a: 'Nein, ein vorhandener Registereintrag bleibt gültig. Damals war zusätzlich der Netzbetreiber zu informieren; diese Pflicht ist mit dem Solarpaket I entfallen, eine bereits erledigte Meldung schadet nicht. Ändern Sie aber etwas am Gerät, etwa ein zusätzliches Modul oder einen neuen Wechselrichter, passen Sie den Eintrag im Register an. Fehlt der Eintrag ganz, holen Sie ihn sofort nach.' },
      { q: 'Wie melde ich das Balkonkraftwerk beim Umzug oder Verkauf ab?', a: 'Im Register ändern Sie den Standort der Einheit oder tragen die endgültige Stilllegung ein, wenn das Gerät verkauft oder entsorgt wird. Der Käufer legt dann einen eigenen Eintrag an. Auch hier gilt die Frist von einem Monat nach § 5 MaStRV. Der Netzbetreiber am alten Wohnort erfährt die Änderung wiederum über das Register, ein Schreiben an ihn ist nicht nötig.' },
    ],
    body: (h) => `
<h2>Was das Solarpaket I an der Anmeldung geändert hat</h2>
<p>Bis Mai 2024 hatte ein Balkonkraftwerk zwei Adressaten: den Netzbetreiber mit einem eigenen Formular und das Marktstammdatenregister. Seit dem 16. Mai 2024 gilt die Fassung des ${h.src('eeg_8', '§ 8 Abs. 5a EEG')}, die drei Dinge regelt. Ein Steckersolargerät ist ein Gerät mit bis zu ${h.num(h.P.balkon.max_wp)} Wp Modulleistung und bis zu ${h.num(h.P.balkon.max_va)} VA Wechselrichterleistung hinter der Entnahmestelle eines Haushalts. Die Pflichten aus der Marktstammdatenregisterverordnung bleiben bestehen. Und der Netzbetreiber kann darüber hinaus keine Meldung verlangen. Dazu kam ${h.src('eeg_10a', '§ 10a Abs. 3 EEG')}: Das Gerät darf am vorhandenen Zähler laufen, bis der Messstellenbetreiber tauscht. Was das für den Zähler bedeutet, steht unter ${h.a('balkonkraftwerk-zaehler', 'Balkonkraftwerk und Zähler')}.</p>
<p>Die Frist ist kurz: ${h.num(h.P.mastr.frist_monate)} Monat ab dem Tag, an dem der Stecker zum ersten Mal in der Dose steckt (${h.src('mastrv_5', '§ 5 Abs. 5 MaStRV')}). Wer im Mai montiert, ist im Juni fällig.</p>

<h2>Die Anmeldung in fünf Schritten</h2>
<h3>Schritt eins: Konto im Webportal</h3>
<p>Im ${h.src('mastr', 'Marktstammdatenregister')} legen Sie ein Benutzerkonto mit E-Mail-Adresse und Passwort an und bestätigen den Link aus der Mail. Das Konto gehört Ihnen als Person, nicht dem Gerät; ein zweites Gerät oder ein späterer Speicher kommen in dasselbe Konto.</p>
<h3>Schritt zwei: Sie als Anlagenbetreiber</h3>
<p>Als Betreiber tragen Sie sich als natürliche Person ein, mit Name und Anschrift. Das Register vergibt dafür eine eigene Betreibernummer. Mieter sind selbst Betreiber, nicht der Vermieter.</p>
<h3>Schritt drei: die Einheit Steckersolargerät</h3>
<p>Für Balkonkraftwerke gibt es eine verkürzte Eingabe. Abgefragt werden der Standort, das Datum der Inbetriebnahme, die Modulleistung in Wp und die Wechselrichterleistung in VA. Bei mehreren Geräten an derselben Wohnung zählt die Summe: Zwei Sets mit je 1 200 Wp überschreiten zusammen die Grenze. Halten Sie Rechnung und Typenschild bereit, damit die Zahlen stimmen.</p>
<h3>Schritt vier: Speicher als zweite Einheit</h3>
<p>Ein Batteriespeicher ist keine Eigenschaft des Solargeräts, sondern eine eigene Einheit mit eigener Nummer. Sie legen ihn getrennt an, mit nutzbarer Kapazität und Leistung, und ordnen ihn dem Standort zu. Ein später nachgerüsteter Speicher löst wieder die Frist von einem Monat aus.</p>
<h3>Schritt fünf: Bestätigung aufbewahren</h3>
<p>Nach dem Speichern zeigt das Portal die Nummer der Einheit. Speichern Sie die Bestätigung; der Messstellenbetreiber oder der Vermieter fragen manchmal danach. Ihr Eintrag erscheint danach in der ${h.src('mastr_einheiten', 'öffentlichen Einheitenübersicht')}, ohne Ihren Namen.</p>

<h2>Wer die Grenzen verlässt, meldet anders</h2>
${h.table(['', '1 800 Wp, 800 VA', '2 400 Wp, 800 VA'], [
  ['Steckersolargerät nach § 8 Abs. 5a', set.zulaessig ? 'ja' : 'nein', zuGross.zulaessig ? 'ja' : 'nein'],
  ['Meldung beim Netzbetreiber', 'nicht verlangt', 'erforderlich'],
  ['Anschluss', 'Stecker durch Sie', 'Elektrofachkraft'],
  ['Betrieb am alten Zähler', 'erlaubt bis zum Tausch', 'nein'],
  ['Erzeugung im Jahr (Bundesmittel, 35° Süd)', `${h.num(set.ertrag)} kWh`, `${h.num(zuGross.ertrag)} kWh`],
], 'Werte aus dem Motor dieser Seite, Verbrauch 2 500 kWh. Die Erzeugung des großen Sets ist zum Vergleich auf 800 VA gerechnet.', ['l', 'r', 'r'])}
<p>Die größere Modulfläche bringt bei 800 VA nur ${h.num(zuGross.ertrag - set.ertrag)} kWh mehr, kostet aber den vereinfachten Weg. Wie viel ein Wechselrichter an Spitzenleistung abschneidet, rechnet der Ratgeber ${h.a('balkonkraftwerk-800-watt', 'Balkonkraftwerk 800 Watt')}.</p>

<h2>Typische Fehler beim Eintrag</h2>
<p>Am häufigsten wird die Leistung verwechselt: Das Register will die Modulleistung in Wp und getrennt davon die Ausgangsleistung des Wechselrichters. Ein Wechselrichter, der per Software auf ${h.num(h.P.balkon.max_va)} VA begrenzt ist, wird mit diesem Wert eingetragen. Zweiter Fehler ist das Datum: Maßgeblich ist der erste Betrieb, nicht der Kauf. Drittens vergessen viele den Speicher, weil er im Set mitgeliefert wurde. Wer zusätzlich eine Dachanlage hat, findet die längeren Pflichten für sie unter ${h.a('marktstammdatenregister-anmelden', 'Marktstammdatenregister anmelden')}; das Steckersolargerät wird dort nicht mitgezählt, sondern bleibt eine eigene Einheit. Antworten der Bundesnetzagentur zu Einzelfällen stehen in ihren ${h.src('bnetza_solar', 'Fragen und Antworten zu Steckersolargeräten')}.</p>

<h2>Was nach dem Eintrag mit Ihren Daten geschieht</h2>
<p>Der Eintrag ist kein Antrag, den jemand genehmigen müsste. Das Gerät darf vom ersten Tag an laufen, die Frist betrifft nur die Eintragung. Im Hintergrund läuft dann eine Kette, die das Gesetz in ${h.src('eeg_10a', '§ 10a Abs. 2 EEG')} beschreibt: Die Bundesnetzagentur fordert den Netzbetreiber auf, die im Register eingetragenen Daten zu prüfen. Danach stattet der Messstellenbetreiber Ihren Zählpunkt mit einem Zweirichtungszähler oder einem intelligenten Messsystem aus, ohne dass Sie ihn beauftragen. Der Tausch kann Monate dauern; bis dahin läuft das Gerät am alten Zähler weiter.</p>
<p>Öffentlich sichtbar werden Leistung, Datum und die Gemeinde, nicht Ihr Name und nicht die genaue Adresse einer privaten Einheit. Aus genau diesen Einträgen stammen die ${h.num(imRegister)} Geräte, die das Register heute zählt.</p>

<h2>Frist verpasst: was jetzt zu tun ist</h2>
<p>Wer ein Gerät seit Monaten betreibt und den Eintrag vergessen hat, trägt es jetzt nach, mit dem tatsächlichen Datum der ersten Inbetriebnahme, nicht mit dem heutigen. Ein falsches Datum wäre die eigentliche Unrichtigkeit. Für Steckersolargeräte gibt es keine Einspeisevergütung, die gekürzt werden könnte, weil der Überschuss unentgeltlich ins Netz geht. Der Nachtrag beseitigt den Verstoß gegen die Registrierungspflicht für die Zukunft. Gleiches gilt für den vergessenen Speicher: als zweite Einheit nachtragen und mit dem Solargerät am selben Standort verbinden.</p>`,
  },
  en: {
    slug: 'register-plug-in-solar',
    nav: 'Register plug-in solar',
    card: 'Entry in the Market Master Data Register step by step, battery as a separate unit, no notice to the grid operator.',
    title: 'Register Plug-in Solar in Germany 2026: Five Steps Online',
    description: `Register plug-in solar in Germany 2026: one online entry in the federal register within ${frist} month, no grid operator form, required data, battery as a second unit.`,
    h1: 'Register plug-in solar 2026: the German register entry, step by step',
    intro: `A plug-in solar device up to ${EN.num(P.balkon.max_wp)} Wp and ${EN.num(P.balkon.max_va)} VA only goes into the Market Master Data Register, at the latest ${frist} month after you first plug it in. The register informs the grid operator itself.`,
    resume: `To register a balcony power plant (Balkonkraftwerk) in Germany you now deal with exactly one office: the Market Master Data Register (Marktstammdatenregister, MaStR) run by the Federal Network Agency. The deadline is ${frist} month from commissioning (section 5(5) MaStRV). For devices up to ${EN.num(P.balkon.max_wp)} Wp of panels and ${EN.num(P.balkon.max_va)} VA of inverter output, the grid operator may not demand any additional notice (section 8(5a) EEG). A 1,800 Wp kit stays within these limits and produces about ${EN.num(set.ertrag)} kWh a year on the German average at a 35° south tilt; a 2,400 Wp kit is no longer plug-in solar in law and needs an electrician and a grid application. A battery is a unit of its own in the register with its own number, so two entries instead of one. The public unit list shows ${EN.num(imRegister)} plug-in devices (retrieved ${stand}). Registration is free and takes about fifteen minutes with your receipt and the rating plate.`,
    faqs: [
      { q: 'Do I have to tell my grid operator about my balcony solar kit?', a: `No, the register is enough. Section 8(5a) EEG states that for plug-in devices up to ${EN.num(P.balkon.max_wp)} Wp and ${EN.num(P.balkon.max_va)} VA the grid operator cannot require any further notice. It learns about your device through the Market Master Data Register, checks the data there and later arranges the meter change. You do not need to fill in a grid operator form, even if some websites still ask for one.` },
      { q: 'What details does the German register ask for a plug-in device?', a: 'The location with address, the date it first ran, the total panel output in watt peak and the inverter output in volt-amperes, plus your details as operator. The values are on the rating plate and the data sheet. For plug-in solar the register asks far less than for a rooftop system. The responsible grid operator is assigned from the address, so you do not have to look it up.' },
      { q: 'Does a battery on a plug-in kit need its own register entry?', a: `Yes. The register keeps solar panels and electricity storage as separate units, each with its own number. Running 1,800 Wp with a 2 kWh battery means creating two units and linking them. In the example the battery raises the power used at home from ${EN.num(set.selbst)} to ${EN.num(mitSpeicher.selbst)} kWh a year, but the deadline of ${frist} month stays the same.` },
      { q: 'What if my kit has 2,400 Wp of panels?', a: `Then it is no longer plug-in solar in law, because section 8(5a) EEG ends at ${EN.num(P.balkon.max_wp)} Wp. The simplified registration, running on the old meter and the exemption from notifying the grid operator no longer apply. Such a system belongs with an electrician, who registers it with the grid operator. The mini calculator above flags this limit at once.` },
      { q: 'Must I re-register a device bought before May 2024?', a: 'No, an existing register entry stays valid. Back then the grid operator also had to be told; that duty ended with the Solar Package I (Solarpaket I), and a notice already sent does no harm. If you change the device, for example by adding a panel or a new inverter, update the register entry. If there is no entry at all, make it now.' },
      { q: 'How do I deregister plug-in solar when I move or sell it?', a: 'In the register you change the location of the unit, or record its final decommissioning if you sell or dispose of it. The buyer then creates an entry of their own. The one-month deadline of section 5 MaStRV applies here too. The grid operator at your old address learns of the change through the register, so no letter to it is needed.' },
    ],
    body: (h) => `
<h2>What the Solar Package I changed</h2>
<p>Until May 2024 a balcony kit had two addressees: the grid operator, with its own form, and the Market Master Data Register. Since 16 May 2024 the version of ${h.src('eeg_8', 'section 8(5a) EEG')} sets out three things. A plug-in solar device (Steckersolargerät) has up to ${h.num(h.P.balkon.max_wp)} Wp of panels and up to ${h.num(h.P.balkon.max_va)} VA of inverter output behind a household's point of supply. The duties under the register regulation remain. And the grid operator cannot ask for any notice beyond that. On top came ${h.src('eeg_10a', 'section 10a(3) EEG')}: the device may run on the existing meter until the metering operator replaces it. What this means for your meter is explained under ${h.a('balkonkraftwerk-zaehler', 'plug-in solar and the meter')}.</p>
<p>The deadline is short: ${h.num(h.P.mastr.frist_monate)} month from the day the plug first goes into the socket (${h.src('mastrv_5', 'section 5(5) MaStRV')}). Install in May and you are due in June.</p>

<h2>Registration in five steps</h2>
<h3>Step one: an account on the web portal</h3>
<p>On the ${h.src('mastr', 'Market Master Data Register')} you create a user account with an email address and password and confirm the link in the email. The account belongs to you as a person, not to the device; a second kit or a later battery goes into the same account.</p>
<h3>Step two: you as the operator</h3>
<p>You enter yourself as a private individual operator (Anlagenbetreiber), with name and address, and receive an operator number. Tenants are operators themselves, not their landlord.</p>
<h3>Step three: the plug-in solar unit</h3>
<p>Balcony kits have a shortened form. It asks for the location, the commissioning date, the panel output in Wp and the inverter output in VA. With several devices at the same flat the total counts: two kits of 1,200 Wp each exceed the limit together. Keep the invoice and rating plate at hand so the numbers are right.</p>
<h3>Step four: the battery as a second unit</h3>
<p>A battery is not a feature of the solar device but a separate unit with its own number. You create it separately, with usable capacity and power, and assign it to the same location. A battery added later triggers the one-month deadline again.</p>
<h3>Step five: keep the confirmation</h3>
<p>After saving, the portal shows the unit number. Keep the confirmation; the metering operator or your landlord sometimes ask for it. Your entry then appears in the ${h.src('mastr_einheiten', 'public list of units')}, without your name.</p>

<h2>Outside the limits, a different route</h2>
${h.table(['', '1,800 Wp, 800 VA', '2,400 Wp, 800 VA'], [
  ['Plug-in device under section 8(5a)', set.zulaessig ? 'yes' : 'no', zuGross.zulaessig ? 'yes' : 'no'],
  ['Notice to grid operator', 'not required', 'required'],
  ['Connection', 'plug, by you', 'electrician'],
  ['Running on the old meter', 'allowed until replaced', 'no'],
  ['Output per year (German average, 35° south)', `${h.num(set.ertrag)} kWh`, `${h.num(zuGross.ertrag)} kWh`],
], 'Values from this site’s engine, consumption 2,500 kWh. The larger kit is shown at 800 VA for comparison.', ['l', 'r', 'r'])}
<p>The extra panel area adds only ${h.num(zuGross.ertrag - set.ertrag)} kWh at 800 VA but costs you the simple route. How much an inverter clips off at peak times is worked out in the guide ${h.a('balkonkraftwerk-800-watt', 'plug-in solar 800 watt')}.</p>

<h2>Common mistakes in the entry</h2>
<p>The most frequent one is mixing up output figures: the register wants the panel output in Wp and, separately, the inverter's output. An inverter limited by software to ${h.num(h.P.balkon.max_va)} VA is entered with that value. The second is the date: what counts is first operation, not purchase. Third, many forget the battery because it came in the box. If you also own a rooftop system, its longer list of duties is under ${h.a('marktstammdatenregister-anmelden', 'Market Master Data Register')}; the plug-in device is not added to it but stays a unit of its own. The Federal Network Agency answers individual cases in its ${h.src('bnetza_solar', 'questions and answers on plug-in solar')}.</p>

<h2>What happens to your data after the entry</h2>
<p>The entry is not an application that anyone has to approve. The device may run from day one; the deadline only concerns the registration. In the background a chain starts that the law describes in ${h.src('eeg_10a', 'section 10a(2) EEG')}: the Federal Network Agency asks the grid operator to check the data in the register. The metering operator then fits your metering point with a bidirectional meter (Zweirichtungszähler) or a smart metering system, without you having to order it. The swap can take months; until then the device keeps running on the old meter.</p>
<p>What becomes public is the output, the date and the municipality, not your name and not the exact address of a private unit. The ${h.num(imRegister)} devices the register counts today come from exactly these entries.</p>

<h2>Missed the deadline: what to do now</h2>
<p>If you have run a device for months and forgot the entry, add it now with the real date of first operation, not today's date. A wrong date would be the actual inaccuracy. Plug-in solar earns no feed-in tariff that could be cut, because the surplus goes to the grid unpaid. The late entry ends the breach of the registration duty for the future. The same goes for a forgotten battery: add it as a second unit and link it to the solar device at the same location.</p>`,
  },
});

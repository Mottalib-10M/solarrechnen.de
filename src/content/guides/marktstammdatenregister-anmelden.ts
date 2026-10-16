import { defineGuide } from '../../lib/guide-types';
import { mastrZahlung, PERIODEN } from '../../lib/engine/eeg';
import { rechnePv } from '../../lib/engine/pv';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Registrierung einer Dachanlage im Marktstammdatenregister: Frist (§ 5 Abs. 5 MaStRV), Zahlung bei Verstoß
 * (§ 52 Abs. 1 Nr. 11, Abs. 2, Abs. 3 EEG 2023), Beispiele mit mastrZahlung und der Jahresvergütung aus dem Motor.
 */
const M = P.mastr;
const frist = { de: M.frist_monate === 1 ? 'einem Monat' : `${M.frist_monate} Monaten`, en: M.frist_monate === 1 ? 'one month' : `${M.frist_monate} months` };
const z3n = mastrZahlung(10, 3, true), z3o = mastrZahlung(10, 3, false);
const z12n = mastrZahlung(10, 12, true), z12o = mastrZahlung(10, 12, false);
const z6g = mastrZahlung(25, 6, false), z6gn = mastrZahlung(25, 6, true);
const pv10 = rechnePv({ ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil', smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: 15000 });
const monatVerg = pv10.verguetungJahr / 12;
const monatStrafe = 10 * M.zahlung_eur_kw_monat;
const tag = (iso: string, l: 'de' | 'en') => new Date(Date.parse(iso)).toLocaleDateString(l === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const ab23 = PERIODEN[0].von;

export default defineGuide({
  id: 'marktstammdatenregister-anmelden',
  group: 'recht',
  order: 64,
  mini: 'mastrStrafe',
  miniHref: 'einspeiseverguetung',
  related: ['balkonkraftwerk-anmelden', 'einspeiseverguetung', 'photovoltaik-steuer', 'nulleinspeisung'],
  sources: ['mastr', 'mastrv_5', 'eeg_52', 'eeg_100', 'bnetza_solar'],
  de: {
    slug: 'marktstammdatenregister-anmelden',
    nav: 'Marktstammdatenregister',
    card: 'Dachanlage und Speicher im Marktstammdatenregister eintragen: Schritte, Frist, Prüfung durch den Netzbetreiber, Folgen nach § 52 EEG.',
    title: 'Marktstammdatenregister anmelden 2026: Schritte und Frist',
    description: `Marktstammdatenregister 2026: Dachanlage und Speicher in ${frist.de} eintragen, welche Daten Sie brauchen, was der Netzbetreiber prüft und was § 52 EEG kostet.`,
    h1: 'Marktstammdatenregister anmelden 2026: Dachanlage Schritt für Schritt',
    intro: `Eine Dachanlage muss binnen ${frist.de} nach Inbetriebnahme im Marktstammdatenregister stehen. Fehlt der Eintrag, schuldet der Betreiber dem Netzbetreiber ${DE.eur(M.zahlung_eur_kw_monat)} je kW und Monat, bei 10 kWp also ${DE.eur(monatStrafe)} im Monat.`,
    resume: `Das Marktstammdatenregister der Bundesnetzagentur ist das amtliche Verzeichnis aller Stromerzeuger in Deutschland, vom Balkonkraftwerk bis zum Windpark. Wer eine Photovoltaikanlage auf dem Dach betreibt, muss sich selbst als Anlagenbetreiber und die Anlage als Einheit eintragen, und zwar innerhalb von ${frist.de} nach der Inbetriebnahme (§ 5 Abs. 5 MaStRV). Ein Batteriespeicher ist eine eigene Einheit und wird zusätzlich registriert. Die Eintragung ist kostenlos; bereitliegen sollten Inbetriebnahmeprotokoll und Datenblätter. Danach prüft der Netzbetreiber die Angaben. Wer die Frist versäumt und auch keine Jahresdaten an den Netzbetreiber gemeldet hat, schuldet nach § 52 EEG ${DE.eur(M.zahlung_eur_kw_monat)} je Kilowatt und angefangenem Monat. Holt er die Registrierung nach, sinkt der Betrag rückwirkend auf ${DE.eur(M.zahlung_nach_nachholung_eur_kw_monat)}. Für eine 10-kWp-Anlage, die drei Monate fehlte, sind das ${DE.eur(z3n)} statt ${DE.eur(z3o)}. Der Netzbetreiber darf die Summe mit der Einspeisevergütung verrechnen.`,
    faqs: [
      { q: 'Wer muss die Solaranlage auf dem Dach im Marktstammdatenregister eintragen?', a: `Der Anlagenbetreiber, also wer die Anlage auf eigene Rechnung betreibt, meist der Hauseigentümer. Der Installateur darf helfen und kann mit einer Vollmacht eintragen, die Pflicht und die Folgen einer versäumten Frist bleiben aber beim Betreiber. Bei einem Ehepaar genügt ein Eintrag; als Betreiber wird dann die Person oder Personengemeinschaft angegeben, die die Anlage tatsächlich betreibt.` },
      { q: 'Muss ich den Batteriespeicher extra im Marktstammdatenregister anmelden?', a: `Ja. Der Speicher ist im Register eine eigene Einheit, auch wenn er am selben Hybridwechselrichter hängt wie die Module. Sie tragen ihn mit nutzbarer Kapazität in kWh und Leistung in kW ein, nach derselben Frist von ${frist.de} ab Inbetriebnahme. Wird er später nachgerüstet, läuft die Frist ab seiner eigenen Inbetriebnahme.` },
      { q: 'Was kostet es, wenn ich die Anlage ein Jahr zu spät registriere?', a: `Bei 10 kWp und zwölf Monaten ohne Eintrag wären nach § 52 Abs. 2 EEG ${DE.eur(z12o)} fällig. Sobald Sie nachregistrieren, gilt rückwirkend der ermäßigte Satz von ${DE.eur(M.zahlung_nach_nachholung_eur_kw_monat)} je kW und Monat, also ${DE.eur(z12n)}. Voraussetzung für die Zahlung ist außerdem, dass Sie dem Netzbetreiber auch keine Abrechnungsdaten nach § 71 EEG übermittelt haben.` },
      { q: 'Wie lange dauert die Prüfung durch den Netzbetreiber?', a: `Eine gesetzliche Frist dafür gibt es nicht. Der Netzbetreiber gleicht Ihre Angaben mit seinen eigenen Daten ab, etwa Leistung, Standort und Zählpunkt, und bestätigt sie oder fragt nach. Für Ihre Pflicht kommt es auf die Übermittlung der Daten an, nicht auf den Abschluss der Prüfung. Rückfragen sollten Sie trotzdem zügig beantworten, damit die Vergütung ohne Abzug fließt.` },
      { q: 'Gilt § 52 auch für eine Anlage, die vor 2023 ans Netz ging?', a: `Ja. § 100 Abs. 9 EEG ordnet an, dass bei einem Verstoß gegen eine Registrierungspflicht ab dem ${tag(ab23, 'de')} ausschließlich § 52 in der heutigen Fassung gilt, auch für ältere Anlagen. Wer eine Anlage von 2015 bis heute nicht eingetragen hat, sollte das sofort nachholen, damit der ermäßigte Satz rückwirkend greift.` },
      { q: 'Ersetzt der Registereintrag die Anmeldung der Dachanlage beim Netzbetreiber?', a: `Nein. Eine Dachanlage wird vor dem Anschluss beim Netzbetreiber angemeldet, meist durch den Elektroinstallateur, der im Installateurverzeichnis eingetragen sein muss. Danach setzt der Netzbetreiber den Zweirichtungszähler. Der Registereintrag kommt zusätzlich. Nur für Steckersolargeräte bis ${DE.num(P.balkon.max_va)} VA darf der Netzbetreiber keine Meldung neben dem Register verlangen (§ 8 Abs. 5a EEG).` },
    ],
    body: (h) => `
<h2>Wann die Uhr läuft</h2>
<p>Die Frist beginnt mit der Inbetriebnahme, nicht mit dem Kauf und nicht mit dem Zählertausch. Für Photovoltaik ist das der Zeitpunkt, an dem die Anlage erstmals Strom erzeugt, nachdem sie fest installiert ist; das Datum steht im Inbetriebnahmeprotokoll Ihres Installateurs. Ab diesem Tag haben Sie ${frist.de}, um Betreiber und Einheit im ${h.src('mastr', 'Marktstammdatenregister')} einzutragen (${h.src('mastrv_5', '§ 5 Abs. 5 MaStRV')}). Das gilt unabhängig davon, wann der Netzbetreiber den Zweirichtungszähler setzt.</p>

<h2>Was Sie vorher bereitlegen</h2>
<ul>
<li>Inbetriebnahmeprotokoll mit Datum und installierter Leistung der Module in kWp,</li>
<li>Datenblatt des Wechselrichters mit seiner Nennleistung in kW,</li>
<li>Anzahl der Module, Hauptausrichtung und Neigung der Fläche,</li>
<li>Adresse oder Flurstück des Gebäudes und den Namen Ihres Netzbetreibers,</li>
<li>bei einem Speicher: nutzbare Kapazität in kWh, Lade- und Entladeleistung in kW,</li>
<li>die Entscheidung, ob Sie Teil- oder Volleinspeisung gewählt haben.</li>
</ul>
<p>Die installierte Leistung der Module ist die Bruttoleistung, die Wechselrichterleistung die Nettonennleistung. Beide Werte fragt das Register getrennt ab; wer sie verwechselt, bekommt eine Rückfrage des Netzbetreibers.</p>

<h2>Die Registrierung in fünf Schritten</h2>
<h3>Benutzerkonto anlegen</h3>
<p>Auf der Startseite des Registers legen Sie mit E-Mail-Adresse und Passwort ein Benutzerkonto an und bestätigen den Link aus der Bestätigungsmail. Das Konto ist der Zugang, mit dem Sie später auch Änderungen eintragen.</p>
<h3>Sich als Anlagenbetreiber eintragen</h3>
<p>Als Nächstes registrieren Sie sich selbst als Marktakteur in der Rolle Anlagenbetreiber, als natürliche Person mit Ihren persönlichen Angaben. Das Register vergibt Ihnen eine eigene MaStR-Nummer.</p>
<h3>Die Solaranlage als Einheit eintragen</h3>
<p>Dann legen Sie die Stromerzeugungseinheit an: Energieträger solare Strahlungsenergie, Lage auf einem Gebäude, Standort, Inbetriebnahmedatum, Leistungen, Module, Ausrichtung und Einspeiseart. Die Einheit erhält eine zweite MaStR-Nummer, die Sie dem Netzbetreiber mitteilen; viele verlangen sie für die Abrechnung der Vergütung.</p>
<h3>Den Speicher ergänzen</h3>
<p>Ein Batteriespeicher wird als eigene Stromspeichereinheit angelegt und der Solaranlage zugeordnet. Das gilt für AC- wie für DC-gekoppelte Speicher.</p>
<h3>Prüfung abwarten und Nummer weitergeben</h3>
<p>Nach dem Absenden prüft der Netzbetreiber die Angaben im Register. Ihre Pflicht ist mit der vollständigen Übermittlung erfüllt; Rückfragen beantworten Sie über dasselbe Konto. Ein Steckersolargerät läuft über einen verkürzten Weg mit weniger Angaben, den die Seite ${h.a('balkonkraftwerk-anmelden', 'Balkonkraftwerk anmelden')} beschreibt.</p>

<h2>Was eine versäumte Frist kostet</h2>
<p>${h.src('eeg_52', '§ 52 Abs. 1 Nr. 11 EEG')} verpflichtet Betreiber zu einer Zahlung an den Netzbetreiber, wenn die zur Registrierung erforderlichen Angaben nicht übermittelt wurden und auch keine Meldung der Abrechnungsdaten nach § 71 Abs. 1 Nr. 1 EEG erfolgt ist. Der Betrag ist ${h.eur(M.zahlung_eur_kw_monat)} je Kilowatt installierter Leistung für jeden Kalendermonat, in dem der Verstoß ganz oder teilweise besteht. Holen Sie die Registrierung nach, verringert er sich rückwirkend bis zum Beginn auf ${h.eur(M.zahlung_nach_nachholung_eur_kw_monat)} je kW und Monat (Abs. 3 Nr. 1).</p>
${h.table(['Fall', 'nicht nachgeholt', 'nachgeholt'], [
  ['10 kWp, 3 Monate', h.eur(z3o), h.eur(z3n)],
  ['10 kWp, 12 Monate', h.eur(z12o), h.eur(z12n)],
  ['25 kWp, 6 Monate', h.eur(z6g), h.eur(z6gn)],
], '§ 52 Abs. 2 und 3 EEG 2023. Ein angefangener Monat zählt voll.', ['l', 'r', 'r'])}
<p>Zum Vergleich: Dieselbe 10-kWp-Anlage bringt im Bundesmittel rund ${h.eur(monatVerg)} Einspeisevergütung im Monat. Ein einziger Monat ohne Eintrag zum vollen Satz kostet also mehr, als die Anlage in dieser Zeit vergütet bekommt. Der Netzbetreiber darf die Zahlung mit Ihren Vergütungsansprüchen und Abschlägen aufrechnen (Abs. 6); der Anspruch verjährt mit Ablauf des zweiten Kalenderjahres nach dem Verstoß. Für ältere Anlagen gilt bei Registrierungsverstößen seit dem ${h.date(ab23)} ebenfalls nur noch § 52 (${h.src('eeg_100', '§ 100 Abs. 9 EEG')}).</p>

<h2>Fehler, die Rückfragen auslösen</h2>
<p>Die meisten Rückfragen des Netzbetreibers haben wenige Ursachen. Häufig steht im Register das Datum des Zählertauschs statt des Inbetriebnahmedatums; maßgeblich ist das Protokoll. Ebenso oft werden Modulleistung und Wechselrichterleistung vertauscht, sodass eine 10-kWp-Anlage mit 8 kW eingetragen ist. Ein dritter Klassiker ist die doppelte Einheit: Der Installateur legt sie mit Vollmacht an, der Betreiber einige Wochen später noch einmal. Klären Sie deshalb vorher, wer einträgt. Schließlich wird der Speicher gern vergessen, weil er im selben Gehäuse wie der Wechselrichter steckt. Jeder dieser Fehler ist über das Konto korrigierbar, und solange die Daten fristgerecht übermittelt wurden, entsteht daraus keine Zahlung nach § 52.</p>

<h2>Nach dem Eintrag</h2>
<p>Der Eintrag ist kein einmaliger Vorgang. Ändert sich etwas an der Anlage, etwa durch zusätzliche Module, einen neuen Speicher, den Verkauf des Hauses oder die Stilllegung, tragen Sie das über Ihr Konto ein; bei einem Eigentümerwechsel registriert sich der neue Betreiber selbst. Auch eine Anlage ohne Einspeisung muss eingetragen werden, wie die Seite zur ${h.a('nulleinspeisung', 'Nulleinspeisung')} erklärt. Für die Steuer spielt das Register keine Rolle; was dort gilt, steht unter ${h.a('photovoltaik-steuer', 'Photovoltaik und Steuer')}. Häufige Fragen beantwortet die ${h.src('bnetza_solar', 'Bundesnetzagentur')} auf ihrer Seite zu Solaranlagen.</p>`,
  },
  en: {
    slug: 'market-master-data-register',
    nav: 'Market Master Data Register',
    card: 'Entering a rooftop system and battery in the Market Master Data Register: steps, deadline, grid operator check, consequences under section 52 EEG.',
    title: 'Market Master Data Register 2026: How to Register Solar PV',
    description: `Market Master Data Register 2026: enter rooftop PV and battery within ${frist.en}, the data you need, what the grid operator checks, what section 52 EEG costs.`,
    h1: 'Market Master Data Register 2026: registering a rooftop system step by step',
    intro: `A rooftop system must be in the Market Master Data Register within ${frist.en} of commissioning. Without the entry, the operator owes the grid operator ${EN.eur(M.zahlung_eur_kw_monat)} per kW and month, which is ${EN.eur(monatStrafe)} a month for 10 kWp.`,
    resume: `The Market Master Data Register (Marktstammdatenregister, MaStR) of the Federal Network Agency is the official list of every power generator in Germany, from a balcony kit to a wind farm. If you operate a rooftop PV system, you must enter yourself as the operator and the system as a unit, within ${frist.en} of commissioning (section 5(5) MaStRV). A battery is a separate unit and is registered as well. Registration is free; have the commissioning report and data sheets to hand. The grid operator then checks the entries. If you miss the deadline and have not reported annual data to the grid operator either, section 52 EEG makes you owe ${EN.eur(M.zahlung_eur_kw_monat)} per kilowatt and month or part month. Once you catch up, the amount drops retroactively to ${EN.eur(M.zahlung_nach_nachholung_eur_kw_monat)}. For a 10 kWp system that was missing for three months, that is ${EN.eur(z3n)} instead of ${EN.eur(z3o)}. The grid operator may offset the sum against your feed-in payments.`,
    faqs: [
      { q: 'Who has to enter a rooftop solar system in the MaStR?', a: `The operator, meaning whoever runs the system for their own account, usually the homeowner. The installer may help and can register with a power of attorney, but the duty and the consequences of a missed deadline stay with the operator. A married couple needs one entry; the operator is the person or group of people who actually run the system.` },
      { q: 'Do I need to register my home battery separately in the MaStR?', a: `Yes. In the register the battery is a unit of its own, even if it sits on the same hybrid inverter as the panels. You enter it with usable capacity in kWh and power in kW, with the same deadline of ${frist.en} from commissioning. If you add it later, the deadline runs from its own commissioning date.` },
      { q: 'What does registering my rooftop system a year late cost?', a: `For 10 kWp and twelve months without an entry, section 52(2) EEG would make ${EN.eur(z12o)} due. As soon as you register, the reduced rate of ${EN.eur(M.zahlung_nach_nachholung_eur_kw_monat)} per kW and month applies retroactively, so ${EN.eur(z12n)}. The payment also requires that you have not sent billing data to the grid operator under section 71 EEG.` },
      { q: 'How long does the grid operator take to check my entry?', a: `There is no statutory deadline. The grid operator compares your entries with its own data, such as capacity, location and metering point, and either confirms them or asks questions. For your duty, what counts is that the data was submitted, not that the check is finished. Still, answer queries promptly so that the feed-in payment arrives without deductions.` },
      { q: 'Does section 52 also apply to a system connected before 2023?', a: `Yes. Section 100(9) EEG provides that for a breach of a registration duty from ${tag(ab23, 'en')}, only today’s section 52 applies, older systems included. If you have a system from 2015 that was never entered, register it now so that the reduced rate applies retroactively.` },
      { q: 'Does the register entry replace notifying the grid operator of a rooftop system?', a: `No. A rooftop system is notified to the grid operator before connection, usually by the electrician, who must be listed in the operator’s register of installers. The grid operator then fits the bidirectional meter. The MaStR entry comes on top. Only for plug-in solar up to ${EN.num(P.balkon.max_va)} VA may the grid operator not demand any notification beyond the register (section 8(5a) EEG).` },
    ],
    body: (h) => `
<h2>When the clock starts</h2>
<p>The deadline starts at commissioning, not at purchase and not at the meter change. For PV, that is the moment the system first generates power after being permanently installed; the date is on your installer’s commissioning report (Inbetriebnahmeprotokoll). From that day you have ${frist.en} to enter operator and unit in the ${h.src('mastr', 'Market Master Data Register')} (${h.src('mastrv_5', 'section 5(5) MaStRV')}). This applies regardless of when the grid operator fits the bidirectional meter.</p>

<h2>What to have ready</h2>
<ul>
<li>the commissioning report with the date and installed panel capacity in kWp,</li>
<li>the inverter data sheet with its rated output in kW,</li>
<li>the number of panels, main orientation and tilt of the roof face,</li>
<li>the address or land parcel of the building and the name of your grid operator,</li>
<li>for a battery: usable capacity in kWh, charge and discharge power in kW,</li>
<li>whether you chose surplus or full feed-in.</li>
</ul>
<p>The installed panel capacity is the gross output, the inverter rating the net rated output. The register asks for both separately; mixing them up triggers a query from the grid operator.</p>

<h2>Registration in five steps</h2>
<h3>Create a user account</h3>
<p>On the register’s home page you create a user account with an e-mail address and password and confirm the link in the confirmation e-mail. The account is also how you enter changes later on.</p>
<h3>Register yourself as operator</h3>
<p>Next you register yourself as a market actor in the role of system operator (Anlagenbetreiber), as a private individual with your personal details. The register gives you a MaStR number of your own.</p>
<h3>Enter the solar system as a unit</h3>
<p>Then you create the generating unit: energy source solar radiation, located on a building, site, commissioning date, capacities, panels, orientation and feed-in type. The unit receives a second MaStR number, which you pass on to the grid operator; many need it to pay the feed-in tariff.</p>
<h3>Add the battery</h3>
<p>A battery is created as a separate storage unit and linked to the solar system. This applies to AC- and DC-coupled batteries alike.</p>
<h3>Wait for the check and pass on the number</h3>
<p>After submission, the grid operator checks the entries in the register. Your duty is fulfilled once complete data has been submitted; you answer any queries through the same account. A plug-in solar device follows a shorter route with fewer fields, described on ${h.a('balkonkraftwerk-anmelden', 'registering plug-in solar')}.</p>

<h2>What a missed deadline costs</h2>
<p>${h.src('eeg_52', 'Section 52(1) no. 11 EEG')} makes operators pay the grid operator if the data required for registration was not submitted and no billing data was reported under section 71(1) no. 1 EEG either. The amount is ${h.eur(M.zahlung_eur_kw_monat)} per kilowatt of installed capacity for each calendar month in which the breach exists in whole or in part. If you catch up, it drops retroactively to ${h.eur(M.zahlung_nach_nachholung_eur_kw_monat)} per kW and month from the start (para. 3 no. 1).</p>
${h.table(['Case', 'not registered', 'registered later'], [
  ['10 kWp, 3 months', h.eur(z3o), h.eur(z3n)],
  ['10 kWp, 12 months', h.eur(z12o), h.eur(z12n)],
  ['25 kWp, 6 months', h.eur(z6g), h.eur(z6gn)],
], 'Section 52(2) and (3) EEG 2023. A part month counts in full.', ['l', 'r', 'r'])}
<p>For comparison: on the national average, the same 10 kWp system earns about ${h.eur(monatVerg)} of feed-in tariff a month. A single month without an entry at the full rate therefore costs more than the system is paid in that time. The grid operator may offset the payment against your tariff claims and instalments (para. 6); the claim lapses at the end of the second calendar year after the breach. For older systems, too, only section 52 has applied to registration breaches since ${h.date(ab23)} (${h.src('eeg_100', 'section 100(9) EEG')}).</p>

<h2>Mistakes that trigger queries</h2>
<p>Most grid operator queries have a handful of causes. Often the register shows the date of the meter change instead of the commissioning date; the report is what counts. Just as often, panel capacity and inverter rating are swapped, so a 10 kWp system appears as 8 kW. A third classic is the duplicate unit: the installer creates it with a power of attorney and the operator creates it again a few weeks later. Agree beforehand who registers. Finally, the battery is often forgotten because it sits in the same housing as the inverter. Each of these errors can be corrected through the account, and as long as the data was submitted on time, none of them leads to a section 52 payment.</p>

<h2>After the entry</h2>
<p>Registration is not a one-off. If anything changes, such as extra panels, a new battery, selling the house or decommissioning, enter it through your account; after a change of owner, the new operator registers themselves. A system without export must also be entered, as the page on ${h.a('nulleinspeisung', 'zero export')} explains. The register has no bearing on tax; the rules there are under ${h.a('photovoltaik-steuer', 'solar PV and tax')}. The ${h.src('bnetza_solar', 'Federal Network Agency')} answers common questions on its solar page.</p>`,
  },
});

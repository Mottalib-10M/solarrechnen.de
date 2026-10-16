import { defineGuide } from '../../lib/guide-types';
import { rechnePv } from '../../lib/engine/pv';
import { AKTUELL } from '../../lib/engine/eeg';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/**
 * Steuerregeln aus P.steuer (§ 3 Nr. 72 EStG, § 12 Abs. 3 UStG), Beispiele aus dem Motor (Bundesmittel, 10 kWp).
 * Angebotspreise sind Annahmen. Keine Steuerberatung: Fälle über den Grenzen werden nur beschrieben, nicht berechnet.
 */
const S = P.steuer;
const NETTO = 15000;
const ustGespart = NETTO * S.ust_regelsatz;
const NETTO_SP = 6000;
const ustSpeicher = NETTO_SP * S.ust_regelsatz;
const pv10 = rechnePv({ ort: null, kwp: 10, neigung: 30, azimut: 0, verbrauchKwh: 4000, speicherKwh: 0, modus: 'teil', smartMeter: false, preisCt: STROMPREIS_CT, kostenEur: NETTO });
/** Steuerfreie Leistung je Gebäude nach Zahl der Wohn- oder Gewerbeeinheiten, gedeckelt je Steuerpflichtigem. */
const frei = (einheiten: number) => Math.min(einheiten * S.estg_kwp_je_einheit, S.estg_kwp_gesamt);
const EINHEITEN = [1, 2, 3, 4];
/** Anzahl Einheiten, ab der die Gesamtgrenze greift. */
const abEinheiten = Math.ceil(S.estg_kwp_gesamt / S.estg_kwp_je_einheit);
const summeVerg = pv10.verguetungJahr * P.eeg.dauer_jahre;

export default defineGuide({
  id: 'photovoltaik-steuer',
  group: 'recht',
  order: 50,
  mini: 'steuer',
  related: ['photovoltaik-kosten', 'einspeiseverguetung', 'marktstammdatenregister-anmelden', 'photovoltaik-rechner', 'balkonkraftwerk-anmelden'],
  sources: ['estg_3', 'ustg_12', 'mastr', 'bnetza_saetze'],
  de: {
    slug: 'photovoltaik-steuer',
    nav: 'Photovoltaik und Steuer',
    card: `Einkommensteuerfrei bis ${S.estg_kwp_je_einheit} kWp je Einheit, 0 % Umsatzsteuer beim Kauf, und was über diesen Grenzen noch zu erklären ist.`,
    title: 'Photovoltaik-Steuer 2026: steuerfrei, 0 % USt, was bleibt',
    description: `Photovoltaik-Steuer 2026: Einnahmen steuerfrei bis ${S.estg_kwp_je_einheit} kWp je Wohneinheit und ${S.estg_kwp_gesamt} kWp gesamt, 0 % Umsatzsteuer auf Kauf und Montage. Was darüber zu erklären ist.`,
    h1: 'Photovoltaik und Steuer 2026: was frei ist und was bleibt',
    intro: `Auf eine 10-kWp-Anlage für ${DE.eur(NETTO)} fallen keine ${DE.eur(ustGespart)} Umsatzsteuer an, und die Vergütung von ${DE.eur(pv10.verguetungJahr)} im Jahr ist einkommensteuerfrei. Die Grenzen liegen bei ${S.estg_kwp_je_einheit} kWp je Einheit.`,
    resume: `Zwei Vorschriften haben die Photovoltaik auf Wohnhäusern steuerlich fast unsichtbar gemacht. Nach § 3 Nr. 72 EStG sind Einnahmen und Entnahmen aus Photovoltaikanlagen auf, an oder in Gebäuden einkommensteuerfrei, wenn die installierte Bruttoleistung laut Marktstammdatenregister höchstens ${S.estg_kwp_je_einheit} kWp je Wohn- oder Gewerbeeinheit beträgt und insgesamt ${S.estg_kwp_gesamt} kWp je Steuerpflichtigem nicht übersteigt. Werden nur solche steuerfreien Einnahmen erzielt, muss kein Gewinn ermittelt werden. Nach § 12 Abs. 3 UStG gilt für die Lieferung von Modulen, wesentlichen Komponenten und Speichern sowie für die Installation ein Steuersatz von 0 %, wenn die Anlage auf oder bei einer Wohnung installiert wird; bis ${S.ust_null_bis_kwp} kWp laut Register gilt das als erfüllt. Für eine 10-kWp-Anlage zu angenommenen ${DE.eur(NETTO)} heißt das: ${DE.eur(ustGespart)} weniger als mit dem Regelsatz von ${DE.pct(S.ust_regelsatz, 0)}, und die Vergütung von ${DE.eur(pv10.verguetungJahr)} im Jahr taucht in keiner Steuererklärung auf. Zu erklären bleibt etwas erst über den Grenzen oder bei einem Verzicht auf die Kleinunternehmerregelung.`,
    faqs: [
      { q: 'Muss ich die Einspeisevergütung meiner 10-kWp-Anlage versteuern?', a: `Nein, solange die Anlage höchstens ${S.estg_kwp_je_einheit} kWp je Wohn- oder Gewerbeeinheit hat und Ihre Anlagen zusammen ${S.estg_kwp_gesamt} kWp nicht übersteigen (§ 3 Nr. 72 EStG). Die ${DE.eur(pv10.verguetungJahr)} im Jahr, die eine solche Anlage im Bundesmittel bei 4 000 kWh Verbrauch einbringt, sind steuerfrei, und ein Gewinn muss nicht ermittelt werden. Maßgeblich ist die Leistung im Marktstammdatenregister.` },
      { q: 'Wie viel kWp sind auf einem Dreifamilienhaus steuerfrei?', a: `Bis zu ${frei(3)} kWp, denn die Grenze von ${S.estg_kwp_je_einheit} kWp gilt je Wohn- oder Gewerbeeinheit. Bei einem Zweifamilienhaus sind es ${frei(2)} kWp. Ab ${abEinheiten} Einheiten greift die Obergrenze von ${S.estg_kwp_gesamt} kWp, die je Steuerpflichtigem oder Mitunternehmerschaft für alle Anlagen zusammen gilt. Wer weitere Anlagen auf anderen Gebäuden betreibt, rechnet deren Leistung mit.` },
      { q: 'Gilt der Nullsteuersatz auch für einen nachgerüsteten Speicher?', a: `Ja. § 12 Abs. 3 UStG nennt ausdrücklich Speicher, die den mit Solarmodulen erzeugten Strom speichern, und ihre Installation. Bei angenommenen ${DE.eur(NETTO_SP)} für einen Speicher entfallen so ${DE.eur(ustSpeicher)} Umsatzsteuer. Voraussetzung bleibt, dass die Anlage auf oder bei einer Wohnung steht; bis ${S.ust_null_bis_kwp} kWp Bruttoleistung laut Marktstammdatenregister gilt das ohne weiteren Nachweis als erfüllt.` },
      { q: 'Was passiert steuerlich mit einer 40-kWp-Anlage auf einem Einfamilienhaus?', a: `Sie liegt über der Grenze von ${S.estg_kwp_je_einheit} kWp je Einheit, deshalb greift § 3 Nr. 72 EStG nicht, und zwar für die ganze Anlage, nicht nur für den Teil darüber. Die Einnahmen gehören dann zu den Einkünften aus Gewerbebetrieb, ein Gewinn ist zu ermitteln. Beim Kauf ist der Nullsteuersatz möglich, die Vermutung bis ${S.ust_null_bis_kwp} kWp gilt aber nicht; die Voraussetzungen sind darzulegen.` },
      { q: 'Ist der selbst verbrauchte Solarstrom steuerpflichtig?', a: `Nicht bei Anlagen innerhalb der Grenzen. § 3 Nr. 72 EStG stellt neben den Einnahmen ausdrücklich auch die Entnahmen steuerfrei, also den Strom, den Sie im eigenen Haushalt nutzen, ob für Licht, Wärmepumpe oder Elektroauto. Bei der 10-kWp-Anlage im Bundesmittel sind das ${DE.num(pv10.selbst)} kWh im Jahr, die weder als Einnahme noch als Entnahme angesetzt werden.` },
      { q: 'Muss ich auf die Einspeisevergütung Umsatzsteuer abführen?', a: `In aller Regel nicht, weil private Betreiber unter die Kleinunternehmerregelung nach § 19 UStG fallen und dann keine Umsatzsteuer berechnen. Wer darauf verzichtet, muss auf die Vergütung Umsatzsteuer abführen und Voranmeldungen abgeben. Seit beim Kauf ohnehin ${DE.pct(0, 0)} gelten, gibt es keine Vorsteuer mehr zurückzuholen, sodass sich der Verzicht für eine Wohnhausanlage kaum noch rechnet.` },
    ],
    body: (h) => `
<h2>Zwei Steuern, zwei Vorschriften</h2>
<p>Bei einer Photovoltaikanlage stellen sich zwei steuerliche Fragen, die oft vermischt werden. Die erste betrifft den Kauf: Fällt auf Module, Wechselrichter, Speicher und Montage Umsatzsteuer an? Die zweite betrifft den Betrieb: Sind die Vergütung und der selbst genutzte Strom Einkommen? Für beide hat der Gesetzgeber Ausnahmen geschaffen, die für die meisten Wohnhäuser alles auf null setzen. Diese Seite liest die Vorschriften im Wortlaut nach und rechnet mit dem Mini-Rechner oben, was sie für Ihren Angebotspreis bedeuten. Eine Steuerberatung ersetzt sie nicht.</p>

<h2>Beim Kauf: 0 % nach § 12 Abs. 3 UStG</h2>
<p>${h.src('ustg_12', '§ 12 Abs. 3 UStG')} ermäßigt die Umsatzsteuer auf 0 % für die Lieferung von Solarmodulen an den Betreiber einer Photovoltaikanlage, einschließlich der für den Betrieb wesentlichen Komponenten und der Speicher, sowie für die Installation. Bedingung ist, dass die Anlage auf oder in der Nähe von Privatwohnungen, Wohnungen oder öffentlichen und anderen Gebäuden installiert wird, die für dem Gemeinwohl dienende Tätigkeiten genutzt werden. Beträgt die installierte Bruttoleistung laut ${h.src('mastr', 'Marktstammdatenregister')} nicht mehr als ${h.num(S.ust_null_bis_kwp)} kWp, gilt diese Bedingung als erfüllt.</p>
${h.table(['Posten (Annahme)', 'netto', `Umsatzsteuer zum Regelsatz ${h.pct(S.ust_regelsatz, 0)}`, 'nach § 12 Abs. 3 UStG'], [
  ['10-kWp-Anlage mit Montage', h.eur(NETTO), h.eur(ustGespart), h.eur(0)],
  ['Speicher, später nachgerüstet', h.eur(NETTO_SP), h.eur(ustSpeicher), h.eur(0)],
  ['zusammen', h.eur(NETTO + NETTO_SP), h.eur(ustGespart + ustSpeicher), h.eur(0)],
], 'Beträge angenommen; ersetzen Sie sie durch Ihr Angebot.', ['l', 'r', 'r', 'r'])}
<p>Zwei Folgerungen ergeben sich direkt aus dem Wortlaut. Erstens gilt die Regel auch für einen Speicher, der Jahre nach der Anlage dazukommt, denn er ist eigens genannt. Zweitens fällt auch ein Steckersolargerät darunter, wenn es an einer Wohnung betrieben wird; es bleibt weit unter der Vermutungsgrenze. Über ${h.num(S.ust_null_bis_kwp)} kWp ist der Nullsatz nicht ausgeschlossen, aber die Vermutung entfällt: Dann muss belegt werden, dass die Anlage an einem der genannten Gebäude installiert ist.</p>

<h2>Im Betrieb: steuerfrei nach § 3 Nr. 72 EStG</h2>
<p>Nach ${h.src('estg_3', '§ 3 Nr. 72 EStG')} sind die Einnahmen und Entnahmen im Zusammenhang mit dem Betrieb von Photovoltaikanlagen auf, an oder in Gebäuden einschließlich Nebengebäuden steuerfrei, wenn die installierte Bruttoleistung laut Marktstammdatenregister bis zu ${h.num(S.estg_kwp_je_einheit)} kWp je Wohn- oder Gewerbeeinheit beträgt. Zusätzlich gilt eine Obergrenze von ${h.num(S.estg_kwp_gesamt)} kWp für alle Anlagen eines Steuerpflichtigen oder einer Mitunternehmerschaft. Einnahmen sind die Einspeisevergütung, bei der 10-kWp-Anlage im Bundesmittel ${h.eur(pv10.verguetungJahr)} im Jahr zum Satz der ${h.src('bnetza_saetze', 'Bundesnetzagentur')} von ${h.ct(AKTUELL.teil[0])}, über ${h.num(P.eeg.dauer_jahre)} Jahre ${h.eur(summeVerg)}. Entnahmen sind der Strom, den Sie selbst verbrauchen.</p>
${h.table(['Wohn- oder Gewerbeeinheiten', 'steuerfreie Leistung'], EINHEITEN.map((n) => [String(n), `${h.num(frei(n))} kWp`]), `${h.num(S.estg_kwp_je_einheit)} kWp je Einheit, höchstens ${h.num(S.estg_kwp_gesamt)} kWp je Steuerpflichtigem oder Mitunternehmerschaft.`, ['l', 'r'])}
<p>Der vielleicht wichtigste Satz steht am Ende der Vorschrift: Werden im Rahmen des Betriebs ausschließlich steuerfreie Einnahmen erzielt, ist kein Gewinn zu ermitteln. Für eine Anlage innerhalb der Grenzen gibt es deshalb keine Einnahmenüberschussrechnung und keine Abschreibung, und die Vergütung erscheint nicht in der Einkommensteuererklärung. Umgekehrt lassen sich auch keine Kosten der Anlage steuerlich absetzen.</p>

<h2>Was trotzdem zu erklären bleibt</h2>
<h3>Anlagen über den Grenzen</h3>
<p>Übersteigt eine Anlage ${h.num(S.estg_kwp_je_einheit)} kWp je Einheit oder überschreiten alle Anlagen zusammen ${h.num(S.estg_kwp_gesamt)} kWp, greift die Befreiung nicht. Dann gehören Vergütung und Entnahmen zu den gewerblichen Einkünften, ein Gewinn ist zu ermitteln, und Kosten wie die Abschreibung mindern ihn. Wie hoch die Steuer ausfällt, hängt vom persönlichen Steuersatz ab; diese Seite rechnet sie deshalb nicht aus.</p>
<h3>Die Umsatzsteuer auf die Einspeisung</h3>
<p>Wer Strom gegen Vergütung ins Netz liefert, ist umsatzsteuerlich Unternehmer. Private Betreiber sind in aller Regel Kleinunternehmer nach § 19 UStG und berechnen keine Umsatzsteuer. Ein Verzicht auf diese Regelung war früher üblich, um die Vorsteuer aus dem Kaufpreis zurückzuholen. Mit 0 % beim Kauf gibt es diese Vorsteuer nicht mehr; der Verzicht brächte nur noch Voranmeldungen und Umsatzsteuer auf die Vergütung.</p>
<h3>Die Leistung im Register</h3>
<p>Beide Befreiungen knüpfen an die Bruttoleistung im Marktstammdatenregister an. Eine korrekte und fristgerechte Registrierung ist deshalb auch steuerlich wichtig; wie sie geht, steht unter ${h.a('marktstammdatenregister-anmelden', 'Marktstammdatenregister anmelden')}, für Steckersolargeräte unter ${h.a('balkonkraftwerk-anmelden', 'Balkonkraftwerk anmelden')}.</p>

<h2>Was das für die Rechnung bedeutet</h2>
<p>Für eine Wohnhausanlage bis ${h.num(S.estg_kwp_je_einheit)} kWp je Einheit rechnen Sie mit dem Nettopreis und ohne Steuer auf die Erträge. So arbeiten auch der ${h.a('photovoltaik-rechner', 'Photovoltaik-Rechner')} und die Seite ${h.a('photovoltaik-kosten', 'Photovoltaik-Kosten')}: Steht auf Ihrem Angebot Umsatzsteuer, obwohl die Anlage unter ${h.num(S.ust_null_bis_kwp)} kWp bleibt und an Ihrer Wohnung installiert wird, fragen Sie nach.</p>`,
  },
  en: {
    slug: 'solar-pv-tax',
    nav: 'Solar PV and tax',
    card: `Income tax-free up to ${S.estg_kwp_je_einheit} kWp per unit, 0% VAT on purchase, and what still needs declaring above these limits.`,
    title: 'Solar PV Tax in Germany 2026: Exempt Income and 0% VAT',
    description: `Solar PV tax in Germany 2026: income tax-free up to ${S.estg_kwp_je_einheit} kWp per dwelling and ${S.estg_kwp_gesamt} kWp in total, 0% VAT on purchase and fitting. What you still declare above that.`,
    h1: 'Solar PV and tax in Germany 2026: what is exempt and what remains',
    intro: `A 10 kWp system for ${EN.eur(NETTO)} carries no ${EN.eur(ustGespart)} of VAT, and its feed-in payment of ${EN.eur(pv10.verguetungJahr)} a year is free of income tax. The limits are ${S.estg_kwp_je_einheit} kWp per unit.`,
    resume: `Two provisions have made rooftop solar on homes almost invisible for tax purposes in Germany. Under section 3 no. 72 of the Income Tax Act (EStG), income and withdrawals from solar PV systems on, at or in buildings are exempt from income tax if the installed gross capacity recorded in the Market Master Data Register (Marktstammdatenregister) is no more than ${S.estg_kwp_je_einheit} kWp per residential or commercial unit and no more than ${S.estg_kwp_gesamt} kWp in total per taxpayer. If only such exempt income arises, no profit has to be calculated. Under section 12(3) of the VAT Act (UStG), the supply of panels, essential components and batteries, and their installation, are taxed at 0% if the system is installed on or near a dwelling; up to ${S.ust_null_bis_kwp} kWp in the register this condition is deemed met. For a 10 kWp system at an assumed ${EN.eur(NETTO)}, that means ${EN.eur(ustGespart)} less than at the standard rate of ${EN.pct(S.ust_regelsatz, 0)}, and the feed-in payment of ${EN.eur(pv10.verguetungJahr)} a year appears in no tax return. Something only needs declaring above the limits or if you opt out of the small business scheme.`,
    faqs: [
      { q: 'Do I pay income tax on the feed-in payment from a 10 kWp system?', a: `No, as long as the system has no more than ${S.estg_kwp_je_einheit} kWp per residential or commercial unit and all your systems together stay within ${S.estg_kwp_gesamt} kWp (section 3 no. 72 EStG). The ${EN.eur(pv10.verguetungJahr)} a year such a system earns at the German average with 4,000 kWh of consumption are exempt, and no profit has to be calculated. What counts is the capacity in the Market Master Data Register.` },
      { q: 'How many kWp are tax-free on a three-flat building?', a: `Up to ${frei(3)} kWp, because the ${S.estg_kwp_je_einheit} kWp limit applies per residential or commercial unit. For a two-flat house it is ${frei(2)} kWp. From ${abEinheiten} units, the ceiling of ${S.estg_kwp_gesamt} kWp applies, which covers all systems of one taxpayer or partnership together. If you run other systems on other buildings, their capacity counts too.` },
      { q: 'Does the zero VAT rate cover a battery added later?', a: `Yes. Section 12(3) UStG expressly names batteries that store power generated by solar panels, and their installation. At an assumed ${EN.eur(NETTO_SP)} for a battery, that removes ${EN.eur(ustSpeicher)} of VAT. The condition remains that the system is on or near a dwelling; up to ${S.ust_null_bis_kwp} kWp gross capacity in the Market Master Data Register it is deemed met without further proof.` },
      { q: 'How is a 40 kWp system on a single-family house taxed?', a: `It exceeds the ${S.estg_kwp_je_einheit} kWp per unit limit, so section 3 no. 72 EStG does not apply, and that is for the whole system, not just the part above the limit. The income then counts as business income and a profit must be calculated. The zero VAT rate on purchase is still possible, but the presumption up to ${S.ust_null_bis_kwp} kWp does not apply; the conditions must be shown.` },
      { q: 'Is solar power I use myself taxable in Germany?', a: `Not for systems within the limits. Besides income, section 3 no. 72 EStG expressly exempts withdrawals, that is the power you use in your own household, whether for lighting, a heat pump or an electric car. For the 10 kWp system at the German average, that is ${EN.num(pv10.selbst)} kWh a year that count neither as income nor as a withdrawal.` },
      { q: 'Do I have to charge VAT on the feed-in payment?', a: `As a rule no, because private operators fall under the small business scheme (Kleinunternehmerregelung) in section 19 UStG and then charge no VAT. If you opt out, you must pay VAT on the feed-in payment and file advance returns. Since the purchase is taxed at ${EN.pct(0, 0)} anyway, there is no input VAT left to reclaim, so opting out hardly pays for a system on a home.` },
    ],
    body: (h) => `
<h2>Two taxes, two provisions</h2>
<p>A solar PV system raises two tax questions that are often mixed up. The first concerns the purchase: is VAT charged on panels, inverter, battery and installation? The second concerns operation: are the feed-in payment and the power you use yourself income? For both, the legislator has created exemptions that set everything to zero for most homes. This page reads the provisions in their wording and uses the mini calculator above to show what they mean for your quoted price. It does not replace tax advice.</p>

<h2>On purchase: 0% under section 12(3) UStG</h2>
<p>${h.src('ustg_12', 'Section 12(3) of the VAT Act')} reduces VAT to 0% for the supply of solar panels to the operator of a PV system, including the components essential for running it and batteries, and for installation. The condition is that the system is installed on or near private homes, dwellings, or public and other buildings used for activities serving the common good. If the installed gross capacity recorded in the ${h.src('mastr', 'Market Master Data Register')} is no more than ${h.num(S.ust_null_bis_kwp)} kWp, the condition is deemed met.</p>
${h.table(['Item (assumed)', 'net', `VAT at the standard ${h.pct(S.ust_regelsatz, 0)}`, 'under section 12(3) UStG'], [
  ['10 kWp system with installation', h.eur(NETTO), h.eur(ustGespart), h.eur(0)],
  ['battery, added later', h.eur(NETTO_SP), h.eur(ustSpeicher), h.eur(0)],
  ['total', h.eur(NETTO + NETTO_SP), h.eur(ustGespart + ustSpeicher), h.eur(0)],
], 'Amounts assumed; replace them with your quote.', ['l', 'r', 'r', 'r'])}
<p>Two conclusions follow directly from the wording. First, the rule also covers a battery added years after the system, since batteries are named explicitly. Second, a plug-in solar device (Steckersolargerät) run at a dwelling is covered too; it stays far below the presumption limit. Above ${h.num(S.ust_null_bis_kwp)} kWp the zero rate is not ruled out, but the presumption falls away: you must then show that the system is installed at one of the buildings named.</p>

<h2>In operation: exempt under section 3 no. 72 EStG</h2>
<p>Under ${h.src('estg_3', 'section 3 no. 72 of the Income Tax Act')}, income and withdrawals connected with running solar PV systems on, at or in buildings, including outbuildings, are exempt if the installed gross capacity in the Market Master Data Register is up to ${h.num(S.estg_kwp_je_einheit)} kWp per residential or commercial unit. On top of that, a ceiling of ${h.num(S.estg_kwp_gesamt)} kWp applies to all systems of one taxpayer or partnership. Income means the feed-in payment: for the 10 kWp system at the German average, ${h.eur(pv10.verguetungJahr)} a year at the ${h.src('bnetza_saetze', 'Federal Network Agency')} rate of ${h.ct(AKTUELL.teil[0])}, or ${h.eur(summeVerg)} over ${h.num(P.eeg.dauer_jahre)} years. Withdrawals are the power you use yourself.</p>
${h.table(['Residential or commercial units', 'exempt capacity'], EINHEITEN.map((n) => [String(n), `${h.num(frei(n))} kWp`]), `${h.num(S.estg_kwp_je_einheit)} kWp per unit, at most ${h.num(S.estg_kwp_gesamt)} kWp per taxpayer or partnership.`, ['l', 'r'])}
<p>Perhaps the most important sentence comes at the end of the provision: if only exempt income arises from the activity, no profit has to be calculated. For a system within the limits there is therefore no cash-basis profit statement and no depreciation, and the payment does not appear in the income tax return. Conversely, none of the system's costs can be deducted.</p>

<h2>What still needs declaring</h2>
<h3>Systems above the limits</h3>
<p>If a system exceeds ${h.num(S.estg_kwp_je_einheit)} kWp per unit, or all systems together exceed ${h.num(S.estg_kwp_gesamt)} kWp, the exemption does not apply. Payment and withdrawals then count as business income, a profit must be calculated, and costs such as depreciation reduce it. How much tax results depends on your personal rate, so this page does not calculate it.</p>
<h3>VAT on exported power</h3>
<p>Anyone supplying power to the grid for payment is a business for VAT purposes. Private operators are as a rule small businesses under section 19 UStG and charge no VAT. Opting out used to be common in order to reclaim the input VAT on the purchase. With 0% on purchase there is no such input VAT any more; opting out would only bring advance returns and VAT on the payment.</p>
<h3>Capacity in the register</h3>
<p>Both exemptions refer to the gross capacity in the Market Master Data Register, so correct and timely registration matters for tax as well; how it works is under ${h.a('marktstammdatenregister-anmelden', 'Market Master Data Register')}, and for plug-in devices under ${h.a('balkonkraftwerk-anmelden', 'register plug-in solar')}.</p>

<h2>What this means for your sums</h2>
<p>For a home system up to ${h.num(S.estg_kwp_je_einheit)} kWp per unit, calculate with the net price and no tax on the returns. That is how the ${h.a('photovoltaik-rechner', 'solar PV calculator')} and ${h.a('photovoltaik-kosten', 'solar PV cost')} work. If your quote shows VAT although the system stays below ${h.num(S.ust_null_bis_kwp)} kWp and is installed at your home, ask why.</p>`,
  },
});

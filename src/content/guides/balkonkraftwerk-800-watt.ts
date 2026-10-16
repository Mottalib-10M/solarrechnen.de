import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon } from '../../lib/engine/balkon';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/** Beispiele aus dem Motor: Bundesmittel, 800 VA, Verbrauch 2 500 kWh. Modulleistung von 800 bis 2 000 Wp, Süd 35°, senkrecht, Ost und West, mit Speicher. */
const va = P.balkon.max_va, wpMax = P.balkon.max_wp;
const b = (modulWp: number, o: { neigung?: number; azimut?: number; speicherKwh?: number } = {}) =>
  rechneBalkon({ ort: null, modulWp, wechselrichterVa: va, neigung: o.neigung ?? 35, azimut: o.azimut ?? 0, verschattung: 0, speicherKwh: o.speicherKwh ?? 0, verbrauchKwh: 2500, preisCt: STROMPREIS_CT, kostenEur: 600 });
const s800 = b(800), s1200 = b(1200), s1600 = b(1600), s2000 = b(wpMax);
const v800 = b(800, { neigung: 90 }), v2000 = b(wpMax, { neigung: 90 });
const ost2000 = b(wpMax, { azimut: -90 }), west2000 = b(wpMax, { azimut: 90 });
const sp2000 = b(wpMax, { speicherKwh: 2 });
const anteil = (r: ReturnType<typeof b>) => (r.ertragBrutto ? r.abgeregelt / r.ertragBrutto : 0);
const plus1600 = s2000.ertrag - s1600.ertrag, plus800 = s2000.ertrag - s800.ertrag;
/** Wert der zusätzlich selbst genutzten Kilowattstunden beim Schritt von 1 600 auf 2 000 Wp (Süd 35°) und senkrecht. */
const euro1600 = (s2000.selbst - s1600.selbst) * STROMPREIS_CT / 100;
const v1600 = b(1600, { neigung: 90 });
const euroV1600 = (v2000.selbst - v1600.selbst) * STROMPREIS_CT / 100;

export default defineGuide({
  id: 'balkonkraftwerk-800-watt',
  group: 'balkon',
  order: 22,
  mini: 'abregelung',
  related: ['balkonkraftwerk-anmelden', 'balkonkraftwerk-ausrichtung', 'balkonkraftwerk-mit-speicher', 'balkonkraftwerk-ertrag'],
  sources: ['eeg_8', 'eeg_9', 'bnetza_solar', 'pvgis'],
  de: {
    slug: 'balkonkraftwerk-800-watt',
    nav: 'Balkonkraftwerk 800 Watt',
    card: 'Was 800 VA und 2 000 Wp bedeuten, wie viel der Wechselrichter abregelt und wann mehr Module trotzdem lohnen.',
    title: 'Balkonkraftwerk 800 Watt 2026: 2 000 Wp und Abregelung',
    description: `Balkonkraftwerk 800 Watt 2026: 800 VA am Wechselrichter, bis 2 000 Wp Module. Bei 2 000 Wp nach Süden regelt er ${DE.pct(anteil(s2000))} ab, senkrecht am Geländer nur ${DE.pct(anteil(v2000))}.`,
    h1: 'Balkonkraftwerk 800 Watt 2026: was der Wechselrichter abschneidet',
    intro: `Mit ${DE.num(wpMax)} Wp Modulen nach Süden erzeugt ein 800-Watt-Balkonkraftwerk ${DE.num(s2000.ertrag)} kWh im Jahr, ${DE.num(s2000.abgeregelt)} kWh schneidet der Wechselrichter in Mittagsspitzen ab. Senkrecht montiert sind es nur ${DE.num(v2000.abgeregelt)} kWh.`,
    resume: `Die 800 Watt eines Balkonkraftwerks sind eine Grenze für den Wechselrichter, nicht für die Module. § 8 Abs. 5a EEG erlaubt für ein Steckersolargerät ${DE.num(va)} VA Wechselrichterleistung und ${DE.num(wpMax)} Wp installierte Modulleistung, jeweils insgesamt für alle Geräte an einer Entnahmestelle. Wer mehr Modulfläche anschließt, als der Wechselrichter abgeben darf, verliert an sonnigen Mittagen die Spitze: Der Wechselrichter regelt ab. Im Bundesmittel bei 35° Südneigung sind das mit 1 200 Wp ${DE.num(s1200.abgeregelt)} kWh im Jahr (${DE.pct(anteil(s1200))} der Erzeugung), mit 1 600 Wp ${DE.num(s1600.abgeregelt)} kWh, mit ${DE.num(wpMax)} Wp ${DE.num(s2000.abgeregelt)} kWh oder ${DE.pct(anteil(s2000))}. Trotzdem steigt die nutzbare Menge von ${DE.num(s800.ertrag)} kWh bei 800 Wp auf ${DE.num(s2000.ertrag)} kWh bei ${DE.num(wpMax)} Wp, weil morgens, abends und im Winter jedes Modul zählt. Senkrecht am Geländer oder nach Osten und Westen fällt die Abregelung viel kleiner aus. Die alte Praxisgrenze von 600 Watt gilt seit dem Solarpaket I im Mai 2024 nicht mehr.`,
    faqs: [
      { q: 'Darf ich 2 000 Wp Module an einen 800-VA-Wechselrichter hängen?', a: `Ja. § 8 Abs. 5a EEG nennt zwei getrennte Grenzen: ${DE.num(wpMax)} Wp installierte Leistung und ${DE.num(va)} VA Wechselrichterleistung. Beide gelten für alle Steckersolargeräte an Ihrer Entnahmestelle zusammen. Ein Set mit ${DE.num(wpMax)} Wp und einem 800-VA-Wechselrichter ist also ein zulässiges Steckersolargerät. Der Wechselrichter muss für diese Modulleistung an seinen Eingängen ausgelegt sein; das steht im Datenblatt.` },
      { q: 'Wie viel Strom geht bei 2 000 Wp nach Süden durch Abregelung verloren?', a: `Im Bundesmittel bei 35° Neigung erzeugen die Module ${DE.num(s2000.ertragBrutto)} kWh, der Wechselrichter lässt ${DE.num(s2000.ertrag)} kWh durch. ${DE.num(s2000.abgeregelt)} kWh, also ${DE.pct(anteil(s2000))}, bleiben an hellen Mittagen hängen. Mit einem 2-kWh-Speicher auf der Modulseite sinkt der Verlust auf ${DE.num(sp2000.abgeregelt)} kWh, weil die Spitze in die Batterie fließt.` },
      { q: 'Lohnen sich die Module zwischen 1 600 und 2 000 Wp noch?', a: `Weniger als die ersten. Von 1 600 auf ${DE.num(wpMax)} Wp steigt die nutzbare Erzeugung bei 35° Süd nur um ${DE.num(plus1600)} kWh, weil die Spitzen schon gekappt sind. Davon nutzt ein Haushalt mit 2 500 kWh einen Teil selbst, der Rest geht unvergütet ins Netz. Senkrecht oder nach Osten lohnt der Ausbau eher, weil dort mehr Licht unter der Grenze von ${DE.num(va)} VA bleibt.` },
      { q: 'Muss ich mein altes 600-Watt-Gerät auf 800 VA umstellen?', a: 'Nein. Ein Gerät mit 600 W Wechselrichter bleibt zulässig, die 800 VA sind eine Obergrenze. Manche Wechselrichter lassen sich per App oder Firmware höher einstellen, wenn der Hersteller das für das Modell freigibt. Dann ändern Sie die Wechselrichterleistung auch im Marktstammdatenregister. Mehr Ertrag bringt das nur, wenn Ihre Module mittags tatsächlich mehr als 600 W liefern.' },
      { q: 'Gilt die 60-Prozent-Grenze auch für ein 800-Watt-Balkonkraftwerk?', a: `Nein. Die Begrenzung der Einspeisung auf ${DE.pct(P.solarspitzen.begrenzung_anteil)} der Nennleistung für neue Anlagen ohne Smart Meter nimmt Steckersolargeräte ausdrücklich aus. Auch die Pflicht, die Anlage fernsteuerbar zu machen (§ 9 Abs. 1 EEG), gilt für Geräte bis ${DE.num(wpMax)} Wp und ${DE.num(va)} VA nicht. Abgeregelt wird bei Ihnen allein durch den Wechselrichter.` },
      { q: 'Zählen zwei Balkonkraftwerke an einer Wohnung zusammen?', a: `Ja. Das Gesetz spricht von einer Leistung von insgesamt ${DE.num(wpMax)} Wp und insgesamt ${DE.num(va)} VA hinter derselben Entnahmestelle. Zwei Geräte mit je 600 VA ergeben 1 200 VA und liegen damit über der Grenze. Wer ein zweites Set an denselben Zähler hängen will, braucht entweder einen gemeinsamen Wechselrichter mit höchstens ${DE.num(va)} VA oder den Weg über eine Elektrofachkraft.` },
    ],
    body: (h) => `
<h2>Watt, Watt peak, Voltampere: drei Zahlen auf dem Karton</h2>
<p>Auf einem Set stehen oft „800 Watt“ und daneben „2 000 Wp“. Die erste Zahl beschreibt den Wechselrichter, der aus dem Gleichstrom der Module Wechselstrom für die Steckdose macht. Das Gesetz nennt sie in Voltampere: ${h.src('eeg_8', '§ 8 Abs. 5a EEG')} erlaubt ${h.num(va)} VA. Bei einem Wechselrichter, der nahezu reine Wirkleistung abgibt, sind 800 VA praktisch 800 Watt. Die zweite Zahl, Watt peak, ist die Leistung der Module unter Laborlicht von 1 000 W/m² bei 25 °C. Diese Bedingung gibt es auf einem Balkon fast nie: Meistens liefert ein Modul weniger als seine Nennleistung, deshalb dürfen Sie mehr Module anschließen, als der Wechselrichter abgibt.</p>
<p>Vor dem Solarpaket I kannte das EEG keine eigene Leistungsgrenze für Steckersolargeräte; die Wechselrichter solcher Geräte hatten nach Angaben der ${h.src('bnetza_solar', 'Bundesnetzagentur')} in der Regel bis zu 600 Watt, und für den vereinfachten Anschluss kam es auf die technischen Anforderungen des VDE an. Seit dem 16. Mai 2024 (${h.src('bgbl_2024_151', 'BGBl. 2024 I Nr. 151')}) stehen die Grenzen im Gesetz selbst, dazu die Regel, dass der Netzbetreiber keine Extra-Meldung verlangen darf. Die Anmeldung ist unter ${h.a('balkonkraftwerk-anmelden', 'Balkonkraftwerk anmelden')} erklärt.</p>

<h2>Wie viel der Wechselrichter abregelt</h2>
<p>Wenn die Module mehr Leistung liefern, als der Wechselrichter abgeben darf, hält er seine Ausgangsleistung bei ${h.num(va)} VA fest. Die Überschussleistung wird nicht erzeugt, sie geht verloren. Der Motor dieser Seite rechnet das aus der Verteilung der Sonneneinstrahlung über die Viertelstunden eines Jahres nach PVGIS.</p>
${h.table(['Modulleistung', 'vor dem Wechselrichter', 'abgeregelt', 'nutzbar', 'selbst genutzt'], [
  ['800 Wp', `${h.num(s800.ertragBrutto)} kWh`, `${h.num(s800.abgeregelt)} kWh`, `${h.num(s800.ertrag)} kWh`, `${h.num(s800.selbst)} kWh`],
  ['1 200 Wp', `${h.num(s1200.ertragBrutto)} kWh`, `${h.num(s1200.abgeregelt)} kWh`, `${h.num(s1200.ertrag)} kWh`, `${h.num(s1200.selbst)} kWh`],
  ['1 600 Wp', `${h.num(s1600.ertragBrutto)} kWh`, `${h.num(s1600.abgeregelt)} kWh`, `${h.num(s1600.ertrag)} kWh`, `${h.num(s1600.selbst)} kWh`],
  [`${h.num(wpMax)} Wp`, `${h.num(s2000.ertragBrutto)} kWh`, `${h.num(s2000.abgeregelt)} kWh`, `${h.num(s2000.ertrag)} kWh`, `${h.num(s2000.selbst)} kWh`],
], `Bundesmittel, Süd, 35° Neigung, ${h.num(va)} VA, Verbrauch 2 500 kWh im Jahr.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Zwischen 800 Wp und ${h.num(wpMax)} Wp wächst die Modulfläche um das Zweieinhalbfache, die nutzbare Erzeugung nur um ${h.num(plus800)} kWh. Die Abregelung beginnt erst oberhalb von etwa 1 000 Wp spürbar und frisst danach einen immer größeren Teil jedes zusätzlichen Moduls. Den Wert für Ihre Modulleistung und Himmelsrichtung zeigt der Mini-Rechner oben.</p>

<h2>Warum senkrechte Module die 800 VA kaum erreichen</h2>
<p>Am Balkongeländer stehen Module meist senkrecht. Dann trifft die hohe Mittagssonne im Sommer flach auf, und die Leistung bleibt meist unter der Grenze. Mit ${h.num(wpMax)} Wp senkrecht nach Süden regelt der Wechselrichter im Jahr nur ${h.num(v2000.abgeregelt)} kWh ab (${h.pct(anteil(v2000))}), nutzbar bleiben ${h.num(v2000.ertrag)} kWh, mehr als doppelt so viel wie mit 800 Wp senkrecht (${h.num(v800.ertrag)} kWh). Nach Osten gerichtet sind es bei 35° Neigung ${h.num(ost2000.abgeregelt)} kWh Abregelung, nach Westen ${h.num(west2000.abgeregelt)} kWh, weil sich die Erzeugung über den Vor- oder Nachmittag verteilt. Hier ist die volle Modulleistung am sinnvollsten. Mehr zu Himmelsrichtung und Neigung im Ratgeber ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung')}.</p>

<h2>Speicher auf der Modulseite fängt die Spitze ab</h2>
<p>Ein Speicher, der den Gleichstrom vor dem Wechselrichter aufnimmt, lädt genau dann, wenn die Module über ${h.num(va)} VA liefern, und gibt die Energie abends ab. Mit ${h.num(wpMax)} Wp nach Süden und 2 kWh Kapazität sinkt die Abregelung im Modell von ${h.num(s2000.abgeregelt)} auf ${h.num(sp2000.abgeregelt)} kWh, der selbst genutzte Strom steigt von ${h.num(s2000.selbst)} auf ${h.num(sp2000.selbst)} kWh. Ob sich das bezahlt macht, rechnet ${h.a('balkonkraftwerk-mit-speicher', 'Balkonkraftwerk mit Speicher')}. Wichtig ist der Wortlaut des Gesetzes: Die ${h.num(va)} VA gelten für die Wechselrichterleistung insgesamt. Ein Speicher mit eigenem Wechselrichter am Hausnetz zählt nach diesem Wortlaut mit.</p>

<h2>Wie viele Module für Ihren Balkon sinnvoll sind</h2>
<p>Die Frage ist nicht, ob ${h.num(wpMax)} Wp erlaubt sind, sondern was das letzte Modul noch bringt. Gerechnet in Geld: Der Schritt von 1 600 auf ${h.num(wpMax)} Wp spart bei 35° Süd und ${h.num(STROMPREIS_CT, 1)} ct/kWh nur ${h.eur(euro1600)} im Jahr, weil der zusätzliche Strom vor allem mittags anfällt, wenn ohnehin Überschuss ins Netz geht. Senkrecht nach Süden bringt derselbe Schritt ${h.eur(euroV1600)} im Jahr. Ein zusätzliches Modul hat sich also erst nach seinem Preis geteilt durch diesen Betrag bezahlt, und es braucht Platz, eine sichere Befestigung und einen Wechselrichter mit genügend Eingängen.</p>
<p>Wer Module auf zwei Seiten verteilen kann, etwa an zwei Balkonseiten nach Osten und Westen, schließt sie an getrennte Eingänge des Wechselrichters an. Dann liefern sie zu unterschiedlichen Tageszeiten, und die Grenze von ${h.num(va)} VA wird seltener erreicht als bei derselben Fläche nach Süden. Bei einer Südwand mit flach geneigtem Gestell reicht dagegen oft schon eine Modulleistung knapp über 1 000 Wp, um fast die ganze Wechselrichterleistung auszuschöpfen.</p>

<h2>Was für 800-Watt-Geräte nicht gilt</h2>
<p>Für Dachanlagen ohne Smart Meter begrenzt ${h.src('eeg_9', '§ 9 EEG')} seit dem ${h.date(h.P.solarspitzen.stichtag)} die Einspeisung auf ${h.pct(h.P.solarspitzen.begrenzung_anteil, 0)} der Nennleistung; Steckersolargeräte sind davon ausgenommen. Ebenso entfällt die Pflicht, die Einspeisung fernsteuerbar zu machen. Die einzige Grenze, die Ihren Ertrag drückt, ist der eigene Wechselrichter. Antworten der Bundesnetzagentur zu Leistungsfragen stehen in ihren ${h.src('bnetza_solar', 'Fragen und Antworten zu Steckersolargeräten')}; die Einstrahlungsdaten stammen aus ${h.src('pvgis', 'PVGIS')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-800-watt',
    nav: 'Plug-in solar 800 watt',
    card: 'What 800 VA and 2,000 Wp mean, how much the inverter clips and when more panels still pay.',
    title: 'Plug-in Solar 800 Watt 2026: 2,000 Wp Panels and Clipping',
    description: `Plug-in solar 800 watt in Germany 2026: 800 VA inverter, up to 2,000 Wp of panels. Facing south, 2,000 Wp loses ${EN.pct(anteil(s2000))} to clipping, mounted upright only ${EN.pct(anteil(v2000))}.`,
    h1: 'Plug-in solar 800 watt 2026: what the inverter cuts off',
    intro: `With ${EN.num(wpMax)} Wp of panels facing south, an 800-watt balcony system delivers ${EN.num(s2000.ertrag)} kWh a year, while the inverter clips ${EN.num(s2000.abgeregelt)} kWh at midday peaks. Mounted upright it clips only ${EN.num(v2000.abgeregelt)} kWh.`,
    resume: `The 800 watts of a German balcony power plant (Balkonkraftwerk) are a limit on the inverter, not on the panels. Section 8(5a) EEG allows a plug-in solar device ${EN.num(va)} VA of inverter output and ${EN.num(wpMax)} Wp of installed panel output, each counted for all devices behind one point of supply together. If you connect more panel area than the inverter may deliver, you lose the peak on sunny middays: the inverter clips (Abregelung). On the German average at a 35° south tilt that is ${EN.num(s1200.abgeregelt)} kWh a year with 1,200 Wp (${EN.pct(anteil(s1200))} of output), ${EN.num(s1600.abgeregelt)} kWh with 1,600 Wp and ${EN.num(s2000.abgeregelt)} kWh or ${EN.pct(anteil(s2000))} with ${EN.num(wpMax)} Wp. Still, the usable amount rises from ${EN.num(s800.ertrag)} kWh at 800 Wp to ${EN.num(s2000.ertrag)} kWh at ${EN.num(wpMax)} Wp, because every panel counts in the morning, the evening and in winter. Upright on a railing, or facing east or west, clipping is much smaller. The old practical limit of 600 watts no longer applies since the Solar Package I of May 2024.`,
    faqs: [
      { q: 'Can I connect 2,000 Wp of panels to an 800 VA inverter in Germany?', a: `Yes. Section 8(5a) EEG sets two separate limits: ${EN.num(wpMax)} Wp of installed output and ${EN.num(va)} VA of inverter output. Both apply to all plug-in devices behind your point of supply together. A kit with ${EN.num(wpMax)} Wp and an 800 VA inverter is therefore a lawful plug-in device. The inverter's inputs must be rated for that panel output; the data sheet says so.` },
      { q: 'How much power is clipped with 2,000 Wp facing south?', a: `On the German average at a 35° tilt the panels produce ${EN.num(s2000.ertragBrutto)} kWh and the inverter passes ${EN.num(s2000.ertrag)} kWh. ${EN.num(s2000.abgeregelt)} kWh, or ${EN.pct(anteil(s2000))}, are lost on bright middays. With a 2 kWh battery on the panel side the loss drops to ${EN.num(sp2000.abgeregelt)} kWh, because the peak flows into the battery.` },
      { q: 'Are panels between 1,600 and 2,000 Wp still worth adding?', a: `Less than the first ones. Going from 1,600 to ${EN.num(wpMax)} Wp at 35° south raises usable output by only ${EN.num(plus1600)} kWh, because the peaks are already clipped. A household using 2,500 kWh consumes part of it, the rest goes to the grid unpaid. Upright or facing east, the extra panels pay off better, because more light stays below the ${EN.num(va)} VA limit.` },
      { q: 'Do I have to upgrade my old 600 watt kit to 800 VA?', a: 'No. A device with a 600 W inverter remains lawful; 800 VA is a ceiling. Some inverters can be set higher by app or firmware if the manufacturer releases this for the model. In that case also update the inverter output in the Market Master Data Register. It only adds yield if your panels actually deliver more than 600 W at midday.' },
      { q: 'Does the 60 per cent feed-in cap apply to an 800 watt balcony kit?', a: `No. The cap on feed-in at ${EN.pct(P.solarspitzen.begrenzung_anteil)} of rated output for new systems without a smart meter expressly excludes plug-in solar. The duty to make a system remotely controllable (section 9(1) EEG) does not apply to devices up to ${EN.num(wpMax)} Wp and ${EN.num(va)} VA either. In your case only the inverter itself limits output.` },
      { q: 'Do two balcony kits on one flat count together?', a: `Yes. The law speaks of a total of ${EN.num(wpMax)} Wp and a total of ${EN.num(va)} VA behind the same point of supply. Two devices of 600 VA each add up to 1,200 VA and are over the limit. If you want a second kit on the same meter, you need either one shared inverter of at most ${EN.num(va)} VA or an electrician and a grid application.` },
    ],
    body: (h) => `
<h2>Watts, watt peak, volt-amperes: three numbers on the box</h2>
<p>A kit often says “800 watts” and next to it “2,000 Wp”. The first number describes the inverter (Wechselrichter), which turns the panels' direct current into alternating current for the socket. The law states it in volt-amperes: ${h.src('eeg_8', 'section 8(5a) EEG')} allows ${h.num(va)} VA. For an inverter delivering almost pure active power, 800 VA is in practice 800 watts. The second number, watt peak, is the panels' output under laboratory light of 1,000 W/m² at 25 °C. A balcony almost never sees that: most of the time a panel delivers less than its rating, which is why you may connect more panel capacity than the inverter passes on.</p>
<p>Before the Solar Package I (Solarpaket I), the EEG set no output limit of its own for plug-in devices; according to the ${h.src('bnetza_solar', 'Federal Network Agency')}, their inverters were usually rated up to 600 watts, and simplified connection depended on the technical requirements of the VDE. Since 16 May 2024 (${h.src('bgbl_2024_151', 'Federal Law Gazette 2024 I no. 151')}) the limits are in the statute itself, together with the rule that the grid operator may not demand an extra notice. Registration is explained under ${h.a('balkonkraftwerk-anmelden', 'register plug-in solar')}.</p>

<h2>How much the inverter clips</h2>
<p>When the panels deliver more power than the inverter may output, it holds its output at ${h.num(va)} VA. The surplus power is never generated; it is lost. This site's engine works it out from the distribution of sunlight over the quarter-hours of a year according to PVGIS.</p>
${h.table(['Panel output', 'before the inverter', 'clipped', 'usable', 'used at home'], [
  ['800 Wp', `${h.num(s800.ertragBrutto)} kWh`, `${h.num(s800.abgeregelt)} kWh`, `${h.num(s800.ertrag)} kWh`, `${h.num(s800.selbst)} kWh`],
  ['1,200 Wp', `${h.num(s1200.ertragBrutto)} kWh`, `${h.num(s1200.abgeregelt)} kWh`, `${h.num(s1200.ertrag)} kWh`, `${h.num(s1200.selbst)} kWh`],
  ['1,600 Wp', `${h.num(s1600.ertragBrutto)} kWh`, `${h.num(s1600.abgeregelt)} kWh`, `${h.num(s1600.ertrag)} kWh`, `${h.num(s1600.selbst)} kWh`],
  [`${h.num(wpMax)} Wp`, `${h.num(s2000.ertragBrutto)} kWh`, `${h.num(s2000.abgeregelt)} kWh`, `${h.num(s2000.ertrag)} kWh`, `${h.num(s2000.selbst)} kWh`],
], `German average, south, 35° tilt, ${h.num(va)} VA, consumption 2,500 kWh a year.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Between 800 Wp and ${h.num(wpMax)} Wp the panel area grows two and a half times, usable output by only ${h.num(plus800)} kWh. Clipping only becomes noticeable above roughly 1,000 Wp and then eats an ever larger share of each extra panel. The mini calculator above shows the value for your panel output and direction.</p>

<h2>Why upright panels rarely reach 800 VA</h2>
<p>On a balcony railing, panels usually hang upright. The high summer sun at midday then strikes them at a shallow angle, and output mostly stays below the limit. With ${h.num(wpMax)} Wp upright facing south, the inverter clips only ${h.num(v2000.abgeregelt)} kWh a year (${h.pct(anteil(v2000))}), leaving ${h.num(v2000.ertrag)} kWh usable, more than twice as much as 800 Wp upright (${h.num(v800.ertrag)} kWh). Facing east at a 35° tilt, clipping is ${h.num(ost2000.abgeregelt)} kWh, facing west ${h.num(west2000.abgeregelt)} kWh, because generation spreads over the morning or afternoon. This is where full panel capacity makes most sense. More on direction and tilt in the guide on ${h.a('balkonkraftwerk-ausrichtung', 'orientation')}.</p>

<h2>A battery on the panel side catches the peak</h2>
<p>A battery that takes the direct current before the inverter charges exactly when the panels exceed ${h.num(va)} VA and releases the energy in the evening. With ${h.num(wpMax)} Wp facing south and 2 kWh of capacity, clipping in the model falls from ${h.num(s2000.abgeregelt)} to ${h.num(sp2000.abgeregelt)} kWh, and power used at home rises from ${h.num(s2000.selbst)} to ${h.num(sp2000.selbst)} kWh. Whether it pays is worked out under ${h.a('balkonkraftwerk-mit-speicher', 'plug-in solar with battery')}. The wording of the law matters here: the ${h.num(va)} VA apply to total inverter output. By that wording, a battery with its own inverter on the household circuit counts towards it.</p>

<h2>How many panels make sense for your balcony</h2>
<p>The question is not whether ${h.num(wpMax)} Wp is allowed but what the last panel still adds. In money: going from 1,600 to ${h.num(wpMax)} Wp at 35° south and ${h.num(STROMPREIS_CT, 1)} ct/kWh saves only ${h.eur(euro1600)} a year, because the extra power arrives mostly at midday, when surplus already flows to the grid. Upright facing south, the same step brings ${h.eur(euroV1600)} a year. An extra panel therefore only pays for itself after its price divided by that amount, and it needs space, a safe mounting and an inverter with enough inputs.</p>
<p>If you can spread panels over two sides, for example two balcony faces east and west, connect them to separate inverter inputs. They then deliver at different times of day, and the ${h.num(va)} VA limit is reached less often than with the same area facing south. On a south wall with a gently tilted frame, by contrast, a panel output just above 1,000 Wp is often enough to use almost all of the inverter's capacity.</p>

<h2>What does not apply to 800 watt devices</h2>
<p>For rooftop systems without a smart meter, ${h.src('eeg_9', 'section 9 EEG')} has capped feed-in at ${h.pct(h.P.solarspitzen.begrenzung_anteil, 0)} of rated output since ${h.date(h.P.solarspitzen.stichtag)}; plug-in solar is exempt. The duty to make feed-in remotely controllable does not apply either. The only limit that holds your yield down is your own inverter. The Federal Network Agency answers output questions in its ${h.src('bnetza_solar', 'questions and answers on plug-in solar')}; the irradiation data come from ${h.src('pvgis', 'PVGIS')}.</p>`,
  },
});

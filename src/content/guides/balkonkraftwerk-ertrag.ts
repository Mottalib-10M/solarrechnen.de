import { defineGuide } from '../../lib/guide-types';
import { rechneBalkon, type BalkonEingabe } from '../../lib/engine/balkon';
import { ortVonPlz, monatsAnteile, REG_MITTE, type Ort } from '../../lib/engine/standort';
import { P, DE, EN, STROMPREIS_CT } from '../../lib/fmt';

/** Beispiele aus dem Motor: 900 Wp, 800 VA, 2 500 kWh, senkrecht (90°) und schräg (35°) nach Süden, Bundesmittel und neun Städte von Nord nach Süd. */
const basis: BalkonEingabe = { ort: null, modulWp: 900, wechselrichterVa: P.balkon.max_va, neigung: 90, azimut: 0, verschattung: 0, speicherKwh: 0, verbrauchKwh: 2500, preisCt: STROMPREIS_CT, kostenEur: 450 };
const b = (o: Partial<BalkonEingabe>) => rechneBalkon({ ...basis, ...o });
const bund90 = b({}), bund35 = b({ neigung: 35 });
const anteileMitte = monatsAnteile(REG_MITTE);
const mon90 = anteileMitte.map((x) => x * bund90.ertrag), mon35 = anteileMitte.map((x) => x * bund35.ertrag);
const sommer = (m: number[]) => m.slice(3, 9).reduce((a, c) => a + c, 0);
const MON_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iMax = mon90.indexOf(Math.max(...mon90));
const STAEDTE: Array<[string, string]> = [['Flensburg', '24937'], ['Hamburg', '20038'], ['Berlin', '10178'], ['Köln', '50667'], ['Dresden', '01067'], ['Frankfurt am Main', '60311'], ['Stuttgart', '70173'], ['Freiburg im Breisgau', '79098'], ['München', '80313']];
const orte = STAEDTE.map(([name, plz]) => {
  const o = ortVonPlz(plz) as Ort;
  const r90 = b({ ort: o }), r35 = b({ ort: o, neigung: 35 });
  const m = monatsAnteile(o.reg);
  return { name, o, r90, r35, dez: m[11] * r90.ertrag, jun: m[5] * r90.ertrag };
});
const fl = orte[0], mu = orte[8], fr = orte[7], be = orte[2];
const nordSued = mu.r90.ertrag / fl.r90.ertrag - 1;
const proTag = bund90.ertrag / 365;
/** Ertrag je kWp und je Modul (ein Modul mit 450 Wp als Rechenbeispiel), senkrecht und 35° im Bundesmittel. */
const kwp90 = bund90.ertrag / 0.9, kwp35 = bund35.ertrag / 0.9;
const modul = b({ modulWp: 450 }), zwei = b({ modulWp: 1800 });

export default defineGuide({
  id: 'balkonkraftwerk-ertrag',
  group: 'balkon',
  order: 26,
  mini: 'ertragMonat',
  related: ['pv-ertrag-plz', 'balkonkraftwerk-ausrichtung', 'balkonkraftwerk-lohnt-sich', 'balkonkraftwerk-berlin', 'balkonkraftwerk-muenchen'],
  sources: ['pvgis', 'pvgis_doku', 'destatis_gv', 'htw_lastprofile'],
  de: {
    slug: 'balkonkraftwerk-ertrag',
    nav: 'Balkonkraftwerk Ertrag',
    card: 'Kilowattstunden im Jahr und in jedem Monat, von Flensburg bis München, senkrecht und schräg.',
    title: 'Balkonkraftwerk Ertrag 2026: kWh pro Jahr und pro Monat',
    description: `Balkonkraftwerk Ertrag 2026: 900 Wp senkrecht nach Süden erzeugen im Mittel ${DE.num(bund90.ertrag)} kWh im Jahr, im Dezember nur ${DE.num(mon90[11])} kWh. München liegt ${DE.pct(nordSued)} über Flensburg.`,
    h1: 'Balkonkraftwerk Ertrag 2026: was 900 Wp im Jahr und im Monat liefern',
    intro: `Senkrecht am Südgeländer erzeugen 900 Wp im deutschen Mittel ${DE.num(bund90.ertrag)} kWh im Jahr, schräg mit 35° ${DE.num(bund35.ertrag)} kWh. Im ${MON_DE[iMax]} sind es ${DE.num(mon90[iMax])} kWh, im Dezember nur ${DE.num(mon90[11])} kWh.`,
    resume: `Der Ertrag eines Balkonkraftwerks hängt von drei Größen ab: Modulleistung, Montagewinkel und Wohnort. Ein Set mit 900 Wp, senkrecht nach Süden am Geländer, erzeugt im Bundesmittel ${DE.num(bund90.ertrag)} kWh im Jahr, rund ${DE.num(proTag, 1)} kWh am Tag. Dieselben Module schräg auf 35° gestellt liefern ${DE.num(bund35.ertrag)} kWh. Über das Jahr ist der Ertrag sehr ungleich verteilt: Von April bis September fallen ${DE.num(sommer(mon90))} kWh an, also ${DE.pct(sommer(mon90) / bund90.ertrag)} des Jahres, im Dezember nur ${DE.num(mon90[11])} kWh. Zwischen Nord und Süd liegt ein deutliches Gefälle. Senkrecht nach Süden kommt ein 900-Wp-Gerät in Flensburg auf ${DE.num(fl.r90.ertrag)} kWh, in Berlin auf ${DE.num(be.r90.ertrag)} kWh und in München auf ${DE.num(mu.r90.ertrag)} kWh, ${DE.pct(nordSued)} mehr als an der Förde. Die Werte stammen aus PVGIS der EU-Kommission je Postleitzahl, mit ${P.pvgis.verluste_pct} Prozent Systemverlusten und Geländehorizont, umgerechnet vom Motor dieser Seite.`,
    faqs: [
      { q: 'Wie viele kWh liefert ein Balkonkraftwerk mit 900 Wp am Tag?', a: `Im Jahresschnitt rund ${DE.num(proTag, 1)} kWh, wenn die Module senkrecht nach Süden hängen, gerechnet im Bundesmittel. Der Tageswert schwankt aber stark: Ein Tag im ${MON_DE[iMax]} bringt im Mittel ${DE.num(mon90[iMax] / 30, 1)} kWh, ein Tag im Dezember ${DE.num(mon90[11] / 31, 1)} kWh. An klaren Sommertagen ist es deutlich mehr, an trüben Wintertagen fast nichts.` },
      { q: 'Wie viel erzeugt ein Balkonkraftwerk im Winter?', a: `Wenig. Von Oktober bis März erzeugen 900 Wp senkrecht nach Süden im Bundesmittel zusammen ${DE.num(bund90.ertrag - sommer(mon90))} kWh, im Dezember allein ${DE.num(mon90[11])} kWh. Senkrechte Module sind im Winter vergleichsweise günstig, weil die tiefe Sonne fast im rechten Winkel auftrifft und Schnee nicht liegen bleibt. Der Großteil der Jahresersparnis entsteht trotzdem im Sommerhalbjahr.` },
      { q: 'Wie groß ist der Ertragsunterschied zwischen Flensburg und München?', a: `Senkrecht nach Süden erzeugen 900 Wp in Flensburg ${DE.num(fl.r90.ertrag)} kWh im Jahr, in München ${DE.num(mu.r90.ertrag)} kWh, also ${DE.pct(nordSued)} mehr. Der Süden hat mehr Sonnenstunden und einen höheren Sonnenstand. Für die Amortisation zählt der Unterschied weniger, als er klingt, weil ein Teil des Mehrertrags mittags als Überschuss ins Netz geht.` },
      { q: 'Erreicht mein Balkonkraftwerk die Werte aus der Tabelle?', a: `Nur ohne Schatten. Die Werte gelten für freie Sicht nach Süden, mit dem Geländehorizont aus PVGIS und ${P.pvgis.verluste_pct} Prozent Verlusten für Kabel, Wechselrichter und Verschmutzung. Ein Balkon darüber, ein Nachbarhaus oder ein Baum ziehen einen Abschlag ab. Ablesen lässt sich der echte Ertrag am Wechselrichter oder an einer Messsteckdose; ein Vergleich nach einem vollen Jahr ist aussagekräftiger als einzelne Monate.` },
      { q: 'Bringt Freiburg mehr Ertrag als Stuttgart?', a: `Beide Städte liegen nahe beieinander. Senkrecht nach Süden erzeugen 900 Wp in Freiburg ${DE.num(fr.r90.ertrag)} kWh, in Stuttgart ${DE.num(orte[6].r90.ertrag)} kWh im Jahr. Die Unterschiede innerhalb einer Region entstehen eher durch Nebellagen, Höhe und Horizont als durch die geografische Breite. Die eigene Postleitzahl im Rechner liefert den Wert für den nächstgelegenen PVGIS-Rasterpunkt.` },
      { q: 'Wie viel bringt ein einzelnes Modul mit 450 Wp am Balkon?', a: `Senkrecht nach Süden im Bundesmittel ${DE.num(modul.ertrag)} kWh im Jahr, je Kilowatt peak gerechnet also rund ${DE.num(kwp90)} kWh. Ein einzelnes Modul ist sinnvoll, wenn das Geländer kurz ist: Es deckt vor allem die Grundlast des Haushalts, fast alles wird selbst verbraucht. Mit vier Modulen und 1 800 Wp wären es ${DE.num(zwei.ertrag)} kWh, aber mit deutlich mehr Überschuss.` },
    ],
    body: (h) => `
<h2>Jahresertrag: die drei Stellschrauben</h2>
<p>Die Nennleistung der Module legt fest, wie viel Fläche Licht einfängt. Der Montagewinkel entscheidet, wie viel davon senkrecht auftrifft. Und der Wohnort bestimmt, wie viel Sonne überhaupt ankommt. Die Daten kommen aus ${h.src('pvgis', 'PVGIS')}, dem Strahlungsdienst der Gemeinsamen Forschungsstelle der EU-Kommission, abgefragt über die ${h.src('pvgis_doku', 'automatische Schnittstelle')} für jeden Rasterpunkt Deutschlands. Jeder Postleitzahl ist über das ${h.src('destatis_gv', 'Gemeindeverzeichnis')} ein Punkt zugeordnet. Der Ertrag ist nach Abzug von ${h.num(h.P.pvgis.verluste_pct)} Prozent Systemverlusten angegeben, also das, was aus der Steckdose kommt.</p>

<h2>Monat für Monat im deutschen Mittel</h2>
${h.table(['Monat', '900 Wp senkrecht', '900 Wp, 35° geneigt'], MON_DE.map((m, i) => [m, `${h.num(mon90[i])} kWh`, `${h.num(mon35[i])} kWh`]), 'Süd, Bundesmittel, Monatsanteile der Region Mitte (Kassel) nach PVGIS.', ['l', 'r', 'r'])}
<p>Der Verlauf ist eine flache Glocke mit dem Gipfel im ${MON_DE[iMax]}. Die sechs Monate von April bis September liefern ${h.pct(sommer(mon90) / bund90.ertrag, 0)} des Jahresertrags. Im Dezember, dem schwächsten Monat, sind es ${h.num(mon90[11])} kWh, ein Bruchteil des Junis. Wer den Ertrag für einen bestimmten Monat und eine andere Modulleistung wissen will, stellt beides im Mini-Rechner oben ein.</p>

<h2>Von der Förde bis an den Alpenrand</h2>
${h.table(['Stadt', 'senkrecht', '35° geneigt', 'Juni', 'Dezember'], orte.map((x) => [x.name, `${h.num(x.r90.ertrag)} kWh`, `${h.num(x.r35.ertrag)} kWh`, `${h.num(x.jun)} kWh`, `${h.num(x.dez)} kWh`]), '900 Wp nach Süden, 800 VA, Monatswerte für senkrechte Montage. PVGIS-Wert der jeweiligen Postleitzahl.', ['l', 'r', 'r', 'r', 'r'])}
<p>Das Gefälle verläuft grob von Nord nach Süd, aber nicht gleichmäßig. Berlin und Dresden liegen trotz ihrer nördlicheren Lage nahe an Frankfurt, weil das kontinentale Klima im Osten mehr klare Tage bringt als das maritime im Westen. Köln am Niederrhein liegt etwas darunter. Den höchsten Wert der Liste hat München mit ${h.num(mu.r90.ertrag)} kWh senkrecht, den niedrigsten Flensburg mit ${h.num(fl.r90.ertrag)} kWh. Ausführliche Seiten gibt es für ${h.a('balkonkraftwerk-berlin', 'Berlin')} und ${h.a('balkonkraftwerk-muenchen', 'München')}; jede andere Postleitzahl rechnet ${h.a('pv-ertrag-plz', 'Ertrag nach Postleitzahl')}.</p>

<h2>Senkrecht oder geneigt: was der Winkel ausmacht</h2>
<p>Im Bundesmittel bringt dasselbe Set mit 35° Neigung ${h.num(bund35.ertrag)} kWh, senkrecht ${h.num(bund90.ertrag)} kWh, also ${h.pct(1 - bund90.ertrag / bund35.ertrag, 0)} weniger. Der Verlust entsteht fast ganz im Sommer, wenn die Sonne mittags hoch steht. Im Dezember liegen beide Montagearten dicht beieinander, ${h.num(mon90[11])} gegenüber ${h.num(mon35[11])} kWh. Den Winkel genauer und zusammen mit der Himmelsrichtung behandelt der Ratgeber ${h.a('balkonkraftwerk-ausrichtung', 'Ausrichtung')}.</p>

<h2>Ertrag je kWp: die Zahl für den Vergleich</h2>
<p>Angebote und Datenblätter nennen oft den spezifischen Ertrag in Kilowattstunden je Kilowatt peak. Für ein Balkonkraftwerk liegt er im Bundesmittel bei ${h.num(kwp90)} kWh je kWp senkrecht nach Süden und bei ${h.num(kwp35)} kWh je kWp mit 35° Neigung. Dachanlagen werden meist mit dem zweiten Wert beworben; für ein Geländer gilt der erste. Wer Zahlen aus dem Internet vergleicht, prüft daher zuerst, für welchen Winkel sie gelten. Ab etwa 1 000 Wp Modulleistung sinkt der Wert je kWp zusätzlich, weil der Wechselrichter mit ${h.num(h.P.balkon.max_va)} VA an hellen Mittagen abregelt.</p>

<h2>Warum kein Jahr wie das andere ist</h2>
<p>Die Werte dieser Seite sind langjährige Mittel aus Satellitendaten. Ein einzelnes Jahr kann darüber oder darunter liegen, je nachdem, wie sonnig Frühjahr und Sommer ausfallen. Ein verregneter Juli wiegt schwerer als ein trüber Januar, weil im Juli ein Vielfaches erzeugt wird. Wer den eigenen Ertrag am Wechselrichter oder an einer Messsteckdose abliest, vergleicht deshalb ganze Jahre und nicht einzelne Wochen. Liegt das eigene Ergebnis dauerhaft deutlich unter der Tabelle, ist fast immer Schatten der Grund: ein Dachüberstand, der Balkon darüber oder ein Baum, der im Sommer belaubt ist.</p>

<h2>Erzeugt ist nicht gespart</h2>
<p>Der Ertrag ist die Menge, die das Gerät liefert. Gespart wird nur, was der Haushalt im selben Moment verbraucht. Von den ${h.num(bund90.ertrag)} kWh des Beispiels nutzt ein Haushalt mit 2 500 kWh im Jahr ${h.num(bund90.selbst)} kWh selbst, gerechnet mit den gemessenen Lastgängen der ${h.src('htw_lastprofile', 'HTW Berlin')}. Ein höherer Ertrag im Süden wird deshalb nicht eins zu eins zu einer höheren Ersparnis: In München sind es ${h.num(mu.r90.selbst)} kWh, in Flensburg ${h.num(fl.r90.selbst)} kWh. Was das in Euro und Jahren bedeutet, rechnet ${h.a('balkonkraftwerk-lohnt-sich', 'Lohnt sich ein Balkonkraftwerk?')}.</p>`,
  },
  en: {
    slug: 'plug-in-solar-yield',
    nav: 'Plug-in solar yield',
    card: 'Kilowatt-hours per year and per month, from Flensburg to Munich, upright and tilted.',
    title: 'Plug-in Solar Yield Germany 2026: kWh per Year and Month',
    description: `Plug-in solar yield in Germany 2026: 900 Wp upright facing south make ${EN.num(bund90.ertrag)} kWh a year on average, only ${EN.num(mon90[11])} kWh in December. Munich is ${EN.pct(nordSued)} above Flensburg.`,
    h1: 'Plug-in solar yield 2026: what 900 Wp deliver per year and month',
    intro: `Upright on a south-facing railing, 900 Wp produce ${EN.num(bund90.ertrag)} kWh a year on the German average, or ${EN.num(bund35.ertrag)} kWh tilted at 35°. In ${MON_EN[iMax]} that is ${EN.num(mon90[iMax])} kWh, in December only ${EN.num(mon90[11])} kWh.`,
    resume: `The yield (Ertrag) of a German balcony power plant depends on three things: panel output, mounting angle and location. A 900 Wp kit hung upright facing south on the railing produces ${EN.num(bund90.ertrag)} kWh a year on the German average, about ${EN.num(proTag, 1)} kWh a day. The same panels tilted at 35° deliver ${EN.num(bund35.ertrag)} kWh. Yield is very unevenly spread over the year: April to September brings ${EN.num(sommer(mon90))} kWh, or ${EN.pct(sommer(mon90) / bund90.ertrag)} of the year, December only ${EN.num(mon90[11])} kWh. There is a clear north-south gradient. Upright facing south, a 900 Wp device reaches ${EN.num(fl.r90.ertrag)} kWh in Flensburg, ${EN.num(be.r90.ertrag)} kWh in Berlin and ${EN.num(mu.r90.ertrag)} kWh in Munich, ${EN.pct(nordSued)} more than on the Baltic coast. The values come from the European Commission's PVGIS for each postcode, with ${P.pvgis.verluste_pct} per cent system losses and the terrain horizon, converted by this site's engine.`,
    faqs: [
      { q: 'How many kWh does a 900 Wp balcony kit produce per day?', a: `About ${EN.num(proTag, 1)} kWh on the annual average with the panels upright facing south, on the German average. The daily figure varies a lot: a day in ${MON_EN[iMax]} brings ${EN.num(mon90[iMax] / 30, 1)} kWh on average, a day in December ${EN.num(mon90[11] / 31, 1)} kWh. Clear summer days give much more, dull winter days almost nothing.` },
      { q: 'How much does plug-in solar produce in a German winter?', a: `Little. From October to March, 900 Wp upright facing south produce ${EN.num(bund90.ertrag - sommer(mon90))} kWh in total on the German average, December alone ${EN.num(mon90[11])} kWh. Upright panels do relatively well in winter because the low sun strikes them almost at right angles and snow does not settle. Most of the annual saving still arises in the summer half-year.` },
      { q: 'How big is the yield gap between Flensburg and Munich?', a: `Upright facing south, 900 Wp produce ${EN.num(fl.r90.ertrag)} kWh a year in Flensburg and ${EN.num(mu.r90.ertrag)} kWh in Munich, ${EN.pct(nordSued)} more. The south has more sunshine hours and a higher sun. For payback the gap matters less than it sounds, because part of the extra yield goes to the grid as midday surplus.` },
      { q: 'Will my balcony kit reach the values in the table?', a: `Only without shade. The values assume a clear view south, with the PVGIS terrain horizon and ${P.pvgis.verluste_pct} per cent losses for cables, inverter and dirt. A balcony above, a neighbouring building or a tree takes a deduction. You can read the real yield on the inverter or a metering plug; comparing after a full year says more than single months.` },
      { q: 'Does Freiburg yield more than Stuttgart?', a: `The two are close. Upright facing south, 900 Wp produce ${EN.num(fr.r90.ertrag)} kWh in Freiburg and ${EN.num(orte[6].r90.ertrag)} kWh in Stuttgart a year. Differences within a region come more from fog, altitude and horizon than from latitude. Your own postcode in the calculator gives the value for the nearest PVGIS grid point.` },
      { q: 'How much does a single 450 Wp panel produce on a balcony?', a: `Upright facing south, ${EN.num(modul.ertrag)} kWh a year on the German average, which is about ${EN.num(kwp90)} kWh per kilowatt peak. A single panel makes sense on a short railing: it mainly covers the household's base load, and almost all of it is used at home. Four panels with 1,800 Wp would give ${EN.num(zwei.ertrag)} kWh, but with far more surplus.` },
    ],
    body: (h) => `
<h2>Annual yield: the three levers</h2>
<p>The panels' rated output sets how much area catches light. The mounting angle decides how much of it strikes squarely. And the location determines how much sun arrives at all. The data come from ${h.src('pvgis', 'PVGIS')}, the irradiation service of the European Commission's Joint Research Centre, queried through its ${h.src('pvgis_doku', 'non-interactive interface')} for every grid point in Germany. Each postcode is assigned a point via the ${h.src('destatis_gv', 'municipality register')}. Yield is stated after ${h.num(h.P.pvgis.verluste_pct)} per cent system losses, meaning what comes out of the socket.</p>

<h2>Month by month on the German average</h2>
${h.table(['Month', '900 Wp upright', '900 Wp, 35° tilt'], MON_EN.map((m, i) => [m, `${h.num(mon90[i])} kWh`, `${h.num(mon35[i])} kWh`]), 'South, German average, monthly shares of the central region (Kassel) according to PVGIS.', ['l', 'r', 'r'])}
<p>The curve is a flat bell peaking in ${MON_EN[iMax]}. The six months from April to September deliver ${h.pct(sommer(mon90) / bund90.ertrag, 0)} of annual yield. In December, the weakest month, it is ${h.num(mon90[11])} kWh, a fraction of June. For a specific month and a different panel output, set both in the mini calculator above.</p>

<h2>From the Baltic coast to the edge of the Alps</h2>
${h.table(['City', 'upright', '35° tilt', 'June', 'December'], orte.map((x) => [x.name, `${h.num(x.r90.ertrag)} kWh`, `${h.num(x.r35.ertrag)} kWh`, `${h.num(x.jun)} kWh`, `${h.num(x.dez)} kWh`]), '900 Wp facing south, 800 VA, monthly values for upright mounting. PVGIS value of each postcode.', ['l', 'r', 'r', 'r', 'r'])}
<p>The gradient runs roughly north to south, but not evenly. Berlin and Dresden, though further north, come close to Frankfurt, because the continental climate in the east brings more clear days than the maritime one in the west. Cologne on the Lower Rhine sits a little below. Munich has the highest value in the list at ${h.num(mu.r90.ertrag)} kWh upright, Flensburg the lowest at ${h.num(fl.r90.ertrag)} kWh. There are detailed pages for ${h.a('balkonkraftwerk-berlin', 'Berlin')} and ${h.a('balkonkraftwerk-muenchen', 'Munich')}; any other postcode is covered by ${h.a('pv-ertrag-plz', 'yield by postcode')}.</p>

<h2>Upright or tilted: what the angle does</h2>
<p>On the German average the same kit yields ${h.num(bund35.ertrag)} kWh at 35° and ${h.num(bund90.ertrag)} kWh upright, ${h.pct(1 - bund90.ertrag / bund35.ertrag, 0)} less. The loss arises almost entirely in summer, when the sun stands high at midday. In December the two are close, ${h.num(mon90[11])} against ${h.num(mon35[11])} kWh. The angle, together with direction, is covered in more detail in the guide on ${h.a('balkonkraftwerk-ausrichtung', 'orientation')}.</p>

<h2>Yield per kWp: the number for comparisons</h2>
<p>Offers and data sheets often state the specific yield in kilowatt-hours per kilowatt peak. For a balcony kit it is ${h.num(kwp90)} kWh per kWp upright facing south on the German average, and ${h.num(kwp35)} kWh per kWp at a 35° tilt. Rooftop systems are usually advertised with the second value; a railing gets the first. When comparing figures found online, check first which angle they refer to. Above about 1,000 Wp of panels the value per kWp falls further, because the ${h.num(h.P.balkon.max_va)} VA inverter clips on bright middays.</p>

<h2>Why no two years are alike</h2>
<p>The values on this page are long-term averages from satellite data. A single year can come in above or below, depending on how sunny spring and summer turn out. A rainy July weighs more than a dull January, because July produces many times as much. If you read your own yield on the inverter or a metering plug, compare whole years, not single weeks. If your result stays well below the table, shade is almost always the reason: a roof overhang, the balcony above or a tree in full summer leaf.</p>

<h2>Produced is not saved</h2>
<p>Yield is what the device delivers. You only save what the household uses at the same moment. Of the ${h.num(bund90.ertrag)} kWh in the example, a household using 2,500 kWh a year consumes ${h.num(bund90.selbst)} kWh itself, based on the metered load profiles from ${h.src('htw_lastprofile', 'HTW Berlin')}. Higher yield in the south therefore does not translate one to one into a higher saving: in Munich it is ${h.num(mu.r90.selbst)} kWh, in Flensburg ${h.num(fl.r90.selbst)} kWh. What that means in euros and years is worked out under ${h.a('balkonkraftwerk-lohnt-sich', 'is plug-in solar worth it?')}.</p>`,
  },
});

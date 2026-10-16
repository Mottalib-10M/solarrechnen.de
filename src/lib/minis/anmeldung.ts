import { P } from '../engine/params';
import { T, num, janein, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Ist Ihr Gerät ein Steckersolargerät, und was ist anzumelden?', 'Is your device plug-in solar, and what must you register?'),
  cta: T(l, 'Ertrag rechnen', 'Work out the yield'),
  inputs: [{ id: 'wp', label: T(l, 'Modulleistung', 'Panel output'), def: 1800, unit: 'Wp', max: 100000 }, { id: 'va', label: T(l, 'Wechselrichter', 'Inverter'), def: 800, unit: 'VA', max: 100000 }, { id: 'sp', label: T(l, 'Mit Speicher?', 'With a battery?'), def: 0, options: janein(l) }],
  run: ({ wp, va, sp }: Record<string, number>) => { const ok = wp <= P.balkon.max_wp && va <= P.balkon.max_va;
    return { head: [T(l, 'Steckersolargerät nach § 8 Abs. 5a EEG', 'Plug-in device under section 8(5a) EEG'), ok ? T(l, 'Ja', 'Yes') : T(l, 'Nein', 'No')], rows: [
      [T(l, 'Grenzen', 'Limits'), `${num(P.balkon.max_wp, l)} Wp · ${num(P.balkon.max_va, l)} VA`],
      [T(l, 'Anmeldung', 'Registration'), ok ? T(l, 'nur Marktstammdatenregister', 'register only (MaStR)') : T(l, 'Netzbetreiber und Register, Elektrofachkraft', 'grid operator and register, electrician')],
      [T(l, 'Frist', 'Deadline'), T(l, `${P.mastr.frist_monate} Monat nach Inbetriebnahme`, `${P.mastr.frist_monate} month after commissioning`)],
      [T(l, 'Einträge im Register', 'Register entries'), sp ? T(l, '2 (Solar und Speicher)', '2 (solar and battery)') : '1'],
    ] as [string, string][] }; },
});

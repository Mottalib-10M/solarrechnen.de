import { T, eur, janein, type L } from './_kit';
import { mastrZahlung } from '../engine/eeg';
export default (l: L) => ({
  title: T(l, 'Was eine verspätete Registrierung kosten kann', 'What a late registration can cost'),
  cta: T(l, 'Einspeisevergütung rechnen', 'Work out the feed-in tariff'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 1000, decimals: 1 }, { id: 'm', label: T(l, 'Monate ohne Eintrag', 'Months without entry'), def: 3, unit: T(l, 'Mon.', 'mo'), max: 120 }, { id: 'n', label: T(l, 'Inzwischen nachgeholt?', 'Registered since?'), def: 1, options: janein(l) }],
  run: ({ kwp, m, n }: Record<string, number>) => { const z = mastrZahlung(kwp, m, n === 1); const voll = mastrZahlung(kwp, m, false);
    return { head: [T(l, 'Zahlung an den Netzbetreiber', 'Payment to the grid operator'), eur(z, l)], rows: [[T(l, 'Satz', 'Rate'), n === 1 ? T(l, '2 € je kW und Monat', '€2 per kW and month') : T(l, '10 € je kW und Monat', '€10 per kW and month')], [T(l, 'ohne Nachholung wären es', 'without registering it would be'), eur(voll, l)], [T(l, 'Grundlage', 'Basis'), '§ 52 EEG 2023']] as [string, string][] }; },
});

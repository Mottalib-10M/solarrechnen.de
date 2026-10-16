import { SMARD, SMARD_JAHR } from '../engine/params';
import { T, eur, num, pct, janein, type L } from './_kit';
import { pv } from './_calc';
export default (l: L) => ({
  title: T(l, 'Was negative Strompreise für Ihre Einspeisung bedeuten', 'What negative prices mean for your feed-in'),
  cta: T(l, 'Photovoltaik-Rechner öffnen', 'Open the PV calculator'),
  inputs: [{ id: 'kwp', label: T(l, 'Anlagenleistung', 'System size'), def: 10, unit: 'kWp', max: 99, decimals: 1 }, { id: 'sm', label: T(l, 'Smart Meter?', 'Smart meter?'), def: 1, options: janein(l) }],
  run: ({ kwp, sm }: Record<string, number>) => { const r = pv({ kwp, sm: sm === 1 }); const y = SMARD.years[SMARD_JAHR];
    return { head: [T(l, 'Vergütung, die im Jahr entfällt', 'Payment lost per year'), eur(r.negVerlustJahr, l)], rows: [[T(l, `Stunden mit negativem Preis ${SMARD_JAHR}`, `Hours with negative prices ${SMARD_JAHR}`), num(y.neg_hours, l)], [T(l, 'Anteil des Solarstroms in diesen Stunden', 'Share of solar output in those hours'), pct(y.pv_neg_share, l)], [T(l, 'Regel für Ihre Anlage', 'Rule for your system'), r.negPreis ? T(l, 'keine Vergütung (§ 51 EEG)', 'no payment (section 51 EEG)') : T(l, 'Vergütung bleibt (ohne Smart Meter)', 'payment continues (no smart meter)')]] as [string, string][] }; },
});

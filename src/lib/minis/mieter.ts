import { T, eur, type L } from './_kit';
import { bk } from './_calc';
export default (l: L) => ({
  title: T(l, 'Lohnt es sich, wenn Sie in ein paar Jahren umziehen?', 'Does it pay if you move out in a few years?'),
  cta: T(l, 'Ertrag für Ihre Wohnung', 'Yield for your flat'),
  inputs: [{ id: 'k', label: T(l, 'Kaufpreis', 'Purchase price'), def: 450, unit: '€', max: 10000 }, { id: 'j', label: T(l, 'Jahre bis zum Auszug', 'Years until you move'), def: 3, unit: T(l, 'J.', 'yrs'), max: 40 }],
  run: ({ k, j }: Record<string, number>) => { const r = bk({ kosten: k, tilt: 90 }); const bis = r.ersparnisJahr * j;
    return { head: [T(l, 'Ersparnis bis zum Auszug', 'Saving until you move'), eur(bis, l)], rows: [[T(l, 'Ersparnis im Jahr (900 Wp senkrecht)', 'Saving per year (900 Wp upright)'), eur(r.ersparnisJahr, l)], [T(l, 'noch offen vom Kaufpreis', 'purchase price still to recover'), eur(Math.max(0, k - bis), l)], [T(l, 'Gerät zieht mit um', 'The device moves with you'), T(l, 'ja, Stecker ziehen', 'yes, unplug it')]] as [string, string][] }; },
});

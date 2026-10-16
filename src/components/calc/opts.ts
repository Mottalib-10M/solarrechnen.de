/** Auswahllisten der Rechner, in beiden Sprachen. */
import { tx, type L } from './kit';
export const azimutOpt = (l: L) => [
  { value: '0', label: tx(l, 'Süd', 'South') }, { value: '-45', label: tx(l, 'Südost', 'South-east') }, { value: '45', label: tx(l, 'Südwest', 'South-west') },
  { value: '-90', label: tx(l, 'Ost', 'East') }, { value: '90', label: tx(l, 'West', 'West') },
  { value: '-135', label: tx(l, 'Nordost', 'North-east') }, { value: '135', label: tx(l, 'Nordwest', 'North-west') }, { value: '180', label: tx(l, 'Nord', 'North') },
];
export const dachAzimutOpt = (l: L) => [...azimutOpt(l).slice(0, 5), { value: 'ow', label: tx(l, 'Ost-West (je zur Hälfte)', 'East-west (half each)') }, ...azimutOpt(l).slice(5)];
export const neigungBalkonOpt = (l: L) => [
  { value: '90', label: tx(l, '90° senkrecht', '90° upright') },
  { value: '70', label: tx(l, '70° leicht schräg', '70° slight tilt') },
  { value: '35', label: tx(l, '35° aufgeständert', '35° on a stand') },
  { value: '20', label: tx(l, '20° flach', '20° low') },
  { value: '10', label: tx(l, '10° fast flach', '10° almost flat') },
];
export const schattenOpt = (l: L) => [
  { value: '0', label: tx(l, 'keine', 'none') }, { value: '0.1', label: tx(l, 'wenig (−10 %)', 'light (−10%)') },
  { value: '0.25', label: tx(l, 'mittel (−25 %)', 'moderate (−25%)') }, { value: '0.4', label: tx(l, 'stark (−40 %)', 'heavy (−40%)') },
];
export const balkonSpeicherOpt = (l: L) => [
  { value: '0', label: tx(l, 'ohne Speicher', 'no battery') }, { value: '1', label: '1 kWh' }, { value: '1.5', label: '1,5 kWh' },
  { value: '2', label: '2 kWh' }, { value: '3', label: '3 kWh' }, { value: '4', label: '4 kWh' },
].map((o) => (l === 'en' ? { ...o, label: o.label.replace(',', '.') } : o));
export const janeinOpt = (l: L) => [{ value: '0', label: tx(l, 'Nein', 'No') }, { value: '1', label: tx(l, 'Ja', 'Yes') }];
export const modusOpt = (l: L) => [{ value: 'teil', label: tx(l, 'Teil', 'Part') }, { value: 'voll', label: tx(l, 'Voll', 'Full') }];

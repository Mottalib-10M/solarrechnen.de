import { route, type Locale } from './routes';
import { PAGES, pageById, GROUPS } from '../lib/guides';
import type { Group } from '../lib/guide-types';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const CORE: Record<Locale, Record<string, string>> = {
  de: { home: 'Balkonkraftwerk-Rechner', method: 'So rechnen wir', about: 'Über uns', widget: 'Rechner einbinden', contact: 'Kontakt', editorial: 'Redaktionsgrundsätze', privacy: 'Datenschutz', terms: 'Impressum', cookies: 'Cookies' },
  en: { home: 'Plug-in solar calculator', method: 'How we calculate', about: 'About', widget: 'Embed a calculator', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies' },
};
const GROUP_LABEL: Record<Locale, Record<Group, string>> = {
  de: { balkon: 'Balkonkraftwerk', pv: 'Photovoltaik', speicher: 'Speicher', recht: 'Einspeisung und Recht', stadt: 'Ertrag in Großstädten' },
  en: { balkon: 'Plug-in solar', pv: 'Rooftop PV', speicher: 'Batteries', recht: 'Feed-in and rules', stadt: 'Yield in major cities' },
};
export const label = (id: string, lang: Locale) => CORE[lang][id] ?? pageById(id)?.[lang].nav ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
const inGroup = (g: Group, lang: Locale) => PAGES.filter((p) => p.group === g).map((p) => link(p.id, lang));
export const groupLabel = (g: Group, lang: Locale) => GROUP_LABEL[lang][g];
export function navCategories(lang: Locale): NavCategory[] {
  return GROUPS.filter((g) => g !== 'stadt').map((g) => ({ label: GROUP_LABEL[lang][g], links: g === 'balkon' ? [link('home', lang), ...inGroup(g, lang)] : inGroup(g, lang) })).filter((c) => c.links.length);
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [
  ...GROUPS.map((g) => ({ label: GROUP_LABEL[lang][g], links: g === 'balkon' ? [link('home', lang), ...inGroup(g, lang)] : inGroup(g, lang) })).filter((c) => c.links.length),
  { label: lang === 'de' ? 'Diese Seite' : 'This site', links: ['method', 'about', 'contact', 'editorial', 'widget', 'terms', 'privacy', 'cookies'].map((i) => link(i, lang)) },
];
export const popularLinks = (_lang: Locale): NavLink[] => [];

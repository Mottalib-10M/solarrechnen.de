import { makeRouter, type RouteDef } from './routes-core';
import { PAGES } from '../lib/guides';
export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';
const R = (id: string, de: string, en: string, noindex = false): RouteDef<Locale> => ({ id, paths: { de: `/de/${de}/`, en: `/en/${en}/` }, ...(noindex ? { noindex } : {}) });
/** Kernseiten. Rechner, Ratgeber und Städte kommen aus `src/content/` (lib/guides.ts). */
const CORE: RouteDef<Locale>[] = [
  { id: 'home', paths: { de: '/de/', en: '/en/' } },
  R('method', 'methodik', 'method'),
  R('about', 'ueber-uns', 'about'),
  R('widget', 'widget', 'widget', true),
  R('contact', 'kontakt', 'contact', true),
  R('editorial', 'redaktionsgrundsaetze', 'editorial-policy', true),
  R('privacy', 'datenschutz', 'privacy', true),
  R('terms', 'impressum', 'legal-notice', true),
  R('cookies', 'cookies', 'cookies', true),
];
export const ROUTES: RouteDef<Locale>[] = [CORE[0], ...PAGES.map((p) => R(p.id, p.de.slug, p.en.slug)), ...CORE.slice(1)];
export const { NOINDEX_PATHS, route, altPaths } = makeRouter(LOCALES, ROUTES);

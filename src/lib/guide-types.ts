/**
 * Eine Seite = EINE Datei in `src/content/rechner/` (Rechnerseiten), `src/content/guides/` (Ratgeber) oder
 * `src/content/staedte/` (Großstädte). Die Datei trägt beide Sprachen, Text, FAQ, Quellen, Mini-Rechner und
 * Verlinkung. Der Kern (Routen, Menüs, Sitemap, hreflang, Schemas) liest sie selbst. Anleitung: CONTRIBUTING-SEITEN.md.
 */
import type { SourceKey, Params } from './engine/params';

export type Lang = 'de' | 'en';
/** Menügruppe. */
export type Group = 'balkon' | 'pv' | 'speicher' | 'recht' | 'stadt';
export interface FAQ { q: string; a: string }

export interface Helpers {
  lang: Lang;
  /** Interner Link per Seiten-ID. */
  a: (id: string, text: string) => string;
  eur: (n: number, decimals?: number) => string;
  num: (n: number, decimals?: number) => string;
  /** Prozent aus einem Anteil (0,247 → „24,7 %“). */
  pct: (x: number, decimals?: number) => string;
  /** Cent je kWh mit zwei Nachkommastellen, wie im Gesetz („7,70 ct/kWh“). */
  ct: (x: number) => string;
  date: (iso: string) => string;
  table: (headers: string[], rows: Array<Array<string | number>>, caption?: string, align?: Array<'l' | 'r'>) => string;
  /** Link auf eine amtliche Quelle aus params-2026.json. */
  src: (key: SourceKey, text?: string) => string;
  P: Params;
}

export interface PageText {
  /** URL-Segment ohne Schrägstrich, ohne Jahreszahl. */
  slug: string;
  nav: string;
  card: string;
  /** 50 bis 60 Zeichen, Suchbegriff zuerst, mit 2026 (RECETTE §11). */
  title: string;
  /** 150 bis 160 Zeichen, mit 2026. */
  description: string;
  h1: string;
  /** Ein bis zwei Sätze unter dem H1, mit dem Kernergebnis. */
  intro: string;
  /** Zitierbarer Absatz, mindestens 120 Wörter, mit den Zahlen (RECETTE §21). */
  resume: string;
  faqs: FAQ[];
  /** HTML-Körper. `<!--mini:kind-->` setzt einen weiteren Mini-Rechner ein. */
  body: (h: Helpers) => string;
}

export type Tool = 'balkon' | 'balkonspeicher' | 'pv' | 'speicher' | 'eeg' | 'ertrag' | 'groesse';

export interface PageDef {
  id: string;
  group: Group;
  order: number;
  /** Mini-Rechner nach dem Kopf (Datei `src/lib/minis/<kind>.ts`). Entfällt bei `tool`. */
  mini?: string;
  miniDefaults?: Record<string, number>;
  /** Ziel des Mini-Rechner-Links (Standard: Startseite). */
  miniHref?: string;
  tool?: Tool;
  /** Startwerte des Rechners, z. B. die Postleitzahl einer Stadtseite. */
  toolPreset?: Record<string, number | string | boolean>;
  related: string[];
  sources: SourceKey[];
  de: PageText;
  en: PageText;
}
export const defineGuide = (g: PageDef): PageDef => g;

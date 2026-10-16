import type { Locale } from './routes';
const de = {
  updatedOn: 'Aktualisiert am', editorialPolicy: 'Redaktionsgrundsätze', contactLabel: 'Kontakt', reviewedBy: 'Geprüft von',
  skipToContent: 'Zum Inhalt', mainNav: 'Hauptnavigation', breadcrumbLabel: 'Brotkrümelnavigation', breadcrumbHome: 'Start', menuOpen: 'Menü öffnen',
  faqTitle: 'Was Leser fragen', relatedCalculators: 'Weiterrechnen', sourcesTitle: 'Gesetze und Daten', writtenBy: 'Verfasst von',
  asOf: 'Fördersätze', lastUpdated: 'nachgelesen am', footerValidated: 'Strahlung nach PVGIS für jede Postleitzahl, Eigenverbrauch aus 74 gemessenen Haushalten, Sätze der Bundesnetzagentur', footerBrowser: 'Gerechnet wird in Ihrem Browser · keine Eingabe wird gespeichert oder gesendet · kostenlos',
  footerDisclaimer: 'Solarrechnen ist ein unabhängiges Angebot von Radif Partners. Wir verkaufen keine Module und vermitteln keine Angebote von Installateuren. Ergebnisse sind Schätzungen; verbindlich sind Ihr Netzbetreiber, der Bescheid des Finanzamts und Ihr Vertrag.', footerPopular: '', notFound: 'Unter dieser Adresse gibt es keine Seite.',
  readMore: 'Weiterlesen',
};
const en: typeof de = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Questions readers ask', relatedCalculators: 'Keep calculating', sourcesTitle: 'Laws and data', writtenBy: 'Written by',
  asOf: 'Rates', lastUpdated: 'read on', footerValidated: 'PVGIS radiation for every postcode, self-consumption from 74 metered households, Federal Network Agency rates', footerBrowser: 'Everything is calculated in your browser · no input is stored or sent · free',
  footerDisclaimer: 'Solarrechnen is an independent service by Radif Partners. We sell no panels and pass no quote requests to installers. Results are estimates only and do not replace advice; your grid operator, the tax office and your contract have the final word.', footerPopular: '', notFound: 'There is no page at this address.',
  readMore: 'Read more',
};
export function t(lang: Locale) { return lang === 'en' ? en : de; }

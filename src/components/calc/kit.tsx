/** Gemeinsame Bausteine der Rechner: Rechenzeilen, Ergebnis-Kopf, Rechenweg, Aktionen (Kopieren, Link, Drucken). */
import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatPercent, formatNumber } from '../../lib/format';

export type L = 'de' | 'en';
export const tx = <A,>(l: L, de: A, en: A) => (l === 'en' ? en : de);
export const kwh = (l: L, x: number) => `${formatNumber(Math.round(x), 0, l)} kWh`;
export const fm = (l: L) => ({
  eur: (x: number, d = 0) => formatMoney(x, d, l),
  eur2: (x: number) => formatMoney(x, Number.isInteger(Math.round(x * 100) / 100) ? 0 : 2, l),
  pct: (x: number, d = 1) => formatPercent(x, d, l),
  num: (x: number, d = 0) => formatNumber(x, d, l),
});

export interface Zeile { label: string; value: string; strong?: boolean; muted?: boolean; sep?: boolean }
/** Zeilen einer Abrechnung: Bezeichnung links, Betrag rechts. */
export function Zeilen({ rows, caption }: { rows: Zeile[]; caption?: string }) {
  return (
    <table className="mt-3 w-full text-sm tabular-nums">
      {caption && <caption className="mb-1 text-left text-xs font-semibold uppercase tracking-wide text-navy-600">{caption}</caption>}
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={`${r.sep ? 'border-t-2 border-navy-800' : 'border-t border-navy-200'} ${r.strong ? 'font-semibold text-navy-900' : r.muted ? 'text-navy-600' : 'text-navy-800'}`}>
            <th scope="row" className="py-1.5 pr-3 text-left font-normal">{r.label}</th>
            <td className="whitespace-nowrap py-1.5 pl-2 text-right">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Rechenweg in Schritten, nummeriert: zeigt, welche Regel welche Zahl erzeugt. */
export function Rechenweg({ lang, steps }: { lang: L; steps: string[] }) {
  if (!steps.length) return null;
  return (
    <details className="mt-4 rounded-lg border border-navy-200 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-navy-900">{tx(lang, 'Rechenweg Schritt für Schritt', 'Step-by-step calculation')}</summary>
      <ol className="rechenweg mt-2 list-decimal pl-5 text-navy-800">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
    </details>
  );
}

export function Aktionen({ lang, text }: { lang: L; text: () => string }) {
  const [done, setDone] = useState('');
  const copy = (what: 'text' | 'link') => {
    const s = what === 'text' ? `${text()} · ${window.location.href}` : window.location.href;
    navigator.clipboard?.writeText(s).then(() => { setDone(what); setTimeout(() => setDone(''), 1500); });
  };
  const b = 'rounded-md border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-800 hover:bg-navy-50';
  return (
    <div className="no-print mt-4 flex flex-wrap gap-2">
      <button type="button" className={b} onClick={() => copy('text')}>{done === 'text' ? tx(lang, 'Kopiert', 'Copied') : tx(lang, 'Ergebnis kopieren', 'Copy result')}</button>
      <button type="button" className={b} onClick={() => copy('link')}>{done === 'link' ? tx(lang, 'Link kopiert', 'Link copied') : tx(lang, 'Link teilen', 'Share link')}</button>
      <button type="button" className={b} onClick={() => window.print()}>{tx(lang, 'Drucken', 'Print')}</button>
    </div>
  );
}

/**
 * Ergebnis-Kopf: eine große Zahl, eine Zeile darunter. Auf dem Telefon steht das Ergebnis unter den
 * Feldern: solange der Rechner im Bild ist, das Ergebnis aber noch darunter liegt, zeigt eine Leiste
 * am unteren Rand die Zahl (RECETTE §5, Regel vom 2026-10-11); ein Tipp darauf springt zum Ergebnis.
 */
export function Kopf({ label, wert, unter }: { label: string; wert: string; unter?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [leiste, setLeiste] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const box = (el.closest('[data-resultat]') as HTMLElement | null) ?? el;
    const rechner = (el.closest('.rechner') as HTMLElement | null) ?? box;
    const pruefen = () => {
      const h = window.innerHeight;
      setLeiste(window.innerWidth < 1024 && rechner.getBoundingClientRect().top < h * 0.85 && box.getBoundingClientRect().top > h - 24);
    };
    pruefen();
    window.addEventListener('scroll', pruefen, { passive: true });
    window.addEventListener('resize', pruefen);
    return () => { window.removeEventListener('scroll', pruefen); window.removeEventListener('resize', pruefen); };
  }, []);
  return (
    <div ref={ref}>
      <p className="text-sm font-medium text-navy-700">{label}</p>
      <p className="tabular-nums mt-1 font-serif text-4xl font-bold text-navy-900">{wert}</p>
      {unter && <p className="tabular-nums mt-1 text-sm text-navy-700">{unter}</p>}
      {leiste && (
        <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="no-print fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-accent-200 bg-white px-4 py-3 text-left shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
          <span className="text-sm font-medium text-navy-700">{label}</span>
          <span className="tabular-nums whitespace-nowrap font-serif text-2xl font-bold text-navy-900">{wert}</span>
        </button>
      )}
    </div>
  );
}

/** Hinweis im Ergebnis: Schätzung, keine Garantie für den Ertrag einzelner Jahre. */
export function Hinweis({ lang, methodHref }: { lang: L; methodHref?: string }) {
  return (
    <p className="mt-3 text-xs text-navy-600">
      {tx(lang, 'Schätzung mit dem mittleren Wetter 2005 bis 2023 (PVGIS) und gemessenen Haushaltslasten. Ein einzelnes Jahr weicht um einige Prozent ab. ', 'Estimate based on average weather 2005 to 2023 (PVGIS) and metered household loads. A single year can differ by a few per cent. ')}
      {methodHref && <a className="underline" href={methodHref}>{tx(lang, 'So rechnen wir', 'How we calculate')}</a>}
    </p>
  );
}

/** Monatsbalken: Erzeugung je Monat aus den PVGIS-Monatswerten der Region. */
export function Monate({ lang, werte }: { lang: L; werte: number[] }) {
  const max = Math.max(...werte, 1);
  const mon = lang === 'en' ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const f = fm(lang);
  return (
    <figure className="mt-4" aria-label={tx(lang, 'Erzeugung je Monat', 'Generation per month')}>
      <div className="flex h-24 items-end gap-1" role="img" aria-label={werte.map((w, i) => `${i + 1}: ${f.num(w)} kWh`).join(', ')}>
        {werte.map((w, i) => (
          <div key={i} className="monat flex-1 rounded-t-sm" style={{ height: `${Math.max(4, (w / max) * 100)}%` }} title={`${f.num(w)} kWh`} />
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-center text-[11px] text-navy-600" aria-hidden="true">{mon.map((m, i) => <span key={i} className="flex-1">{m}</span>)}</div>
      <figcaption className="mt-1 text-xs text-navy-600">{tx(lang, `Erzeugung je Monat: Dezember ${f.num(werte[11])} kWh, Juni ${f.num(werte[5])} kWh`, `Generation per month: December ${f.num(werte[11])} kWh, June ${f.num(werte[5])} kWh`)}</figcaption>
    </figure>
  );
}

export const kasten = 'mt-6 rounded-xl border border-accent-200 bg-accent-50/50 p-4 sm:p-5 lg:mt-0 lg:sticky lg:top-20';
export const rahmen = 'rechner not-prose overflow-hidden rounded-xl border border-navy-200 bg-white';
export const raster = 'p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-start lg:gap-6';

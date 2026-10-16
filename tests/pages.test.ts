/**
 * Contrôle des fichiers de `src/content/` (un guide = un fichier) avant même le build.
 * Eine einzelne Seite: PAGE_FILES=netto-3000 npx vitest run tests/pages.test.ts
 */
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { P } from '../src/lib/engine/params';
import { MINIS } from '../src/lib/mini-specs';
import type { PageDef, Helpers, Lang } from '../src/lib/guide-types';

const dirs = ['guides', 'rechner', 'staedte'];
const only = process.env.PAGE_FILES?.split(',').map((s) => s.trim().replace(/\.ts$/, ''));
const all: PageDef[] = [];
for (const d of dirs) {
  for (const f of readdirSync(new URL(`../src/content/${d}/`, import.meta.url))) {
    if (!f.endsWith('.ts')) continue;
    const mod = await import(`../src/content/${d}/${f}`);
    all.push(mod.default as PageDef);
  }
}
const CORE = ['home', 'method', 'about', 'widget', 'contact', 'editorial', 'privacy', 'terms', 'cookies'];
import planned from './planned-ids.json';
const ids = new Set([...CORE, ...all.map((p) => p.id), ...(planned as Array<{ id: string }>).map((p) => p.id)]);
const pages = only ? all.filter((p) => only.includes(p.id)) : all;
/** Les ébauches réservées (titre vide) ne comptent pas dans les contrôles d'unicité. */
const written = all.filter((p) => p.de.title !== '');
const words = (s: string) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

/** Helpers factices : enregistrent les liens internes et les sources citées. */
function spy(lang: Lang) {
  const links: string[] = [], srcs: string[] = [];
  const h: Helpers = {
    lang, P,
    a: (id, text) => { links.push(id); return `<a href="#${id}">${text}</a>`; },
    eur: (n) => `${n} €`, num: (n) => String(n), pct: (x) => `${x * 100} %`, ct: (x) => `${x} ct/kWh`, date: (d) => d,
    table: (hd, rows) => `<table>${hd.join('')}${rows.flat().join('')}</table>`,
    src: (k, t) => { srcs.push(k); return t ?? P.sources[k].label[lang]; },
  };
  return { h, links, srcs };
}

describe('registre des pages', () => {
  it('identifiants et slugs uniques, sans année ni nombre de trois chiffres', () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    for (const l of ['de', 'en'] as const) {
      const slugs = all.map((p) => p[l].slug);
      // « einspeiseverguetung-2027 » : la réforme EEG 2027 est le sujet de la page, pas un millésime à mettre à jour.
      const ohneBetrag = all.filter((p) => p.group !== 'stadt' && p.id !== 'einspeiseverguetung-2027').map((p) => p[l].slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
      for (const s of ohneBetrag) expect(s, s).not.toMatch(/20[2-3]\d|\d{3}(?!-watt)/); // « 800-watt » est la requête, pas un montant
      for (const s of slugs) if (!/2027$/.test(s)) expect(s, s).not.toMatch(/20[2-3]\d(?!\d)/);
    }
  });
  it('aucune question de FAQ partagée entre deux pages', () => {
    const seen = new Map<string, string>();
    for (const p of written) for (const l of ['de', 'en'] as const) for (const f of p[l].faqs) {
      const k = f.q.toLowerCase().replace(/[\s?¿!.]+$/, '');
      expect(seen.get(k), `« ${f.q} » déjà sur ${seen.get(k)}`).toBeUndefined();
      seen.set(k, p.id);
    }
  });
  it('titres et descriptions uniques', () => {
    const t = written.flatMap((p) => [p.de.title, p.en.title]); expect(new Set(t).size).toBe(t.length);
    const d = written.flatMap((p) => [p.de.description, p.en.description]); expect(new Set(d).size).toBe(d.length);
  });
});

for (const p of pages) {
  describe(p.id, () => {
    it('mini-simulateur ou outil, liens et sources existants', () => {
      if (!p.tool) { expect(p.mini, 'mini manquant').toBeTruthy(); expect(MINIS[p.mini!], `src/lib/minis/${p.mini}.ts absent`).toBeTruthy(); }
      if (p.miniHref) expect(ids.has(p.miniHref)).toBe(true);
      expect(p.related.length).toBeGreaterThanOrEqual(3);
      for (const r of p.related) expect(ids.has(r), `related inconnu : ${r}`).toBe(true);
      expect(p.sources.length).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(P.sources[s], `source inconnue : ${s}`).toBeTruthy();
    });
    for (const l of ['de', 'en'] as const) {
      it(`${l} : titre 50-60, description 150-160, sans tiret cadratin`, () => {
        const x = p[l];
        expect(x.title.length, x.title).toBeGreaterThanOrEqual(50); expect(x.title.length, x.title).toBeLessThanOrEqual(60);
        expect(x.description.length, x.description).toBeGreaterThanOrEqual(150); expect(x.description.length, x.description).toBeLessThanOrEqual(160);
        expect(x.title).toMatch(/2026/); expect(x.description).toMatch(/2026/);
        for (const s of [x.title, x.description, x.h1, x.intro, x.resume]) expect(s).not.toMatch(/—/);
      });
      it(`${l} : bloc citable ≥ 120 mots, FAQ 4 à 8 questions de 40 à 90 mots`, () => {
        const x = p[l];
        expect(words(x.resume)).toBeGreaterThanOrEqual(120);
        expect(x.faqs.length).toBeGreaterThanOrEqual(p.tool || p.group === 'stadt' ? 3 : 4); expect(x.faqs.length).toBeLessThanOrEqual(8);
        for (const f of x.faqs) { const n = words(f.a); expect(n, `${n} mots : ${f.q}`).toBeGreaterThanOrEqual(40); expect(n, `${n} mots : ${f.q}`).toBeLessThanOrEqual(90); }
      });
      it(`${l} : corps, liens internes valides, aucun tiret cadratin`, () => {
        const { h, links, srcs } = spy(l);
        const body = p[l].body(h);
        for (const id of links) expect(ids.has(id), `lien vers une page inconnue : ${id}`).toBe(true);
        for (const s of srcs) expect(P.sources[s as keyof typeof P.sources]).toBeTruthy();
        expect(body).not.toMatch(/—|&mdash;/);
        for (const m of body.matchAll(/<!--mini:([A-Za-z0-9_]+)-->/g)) expect(MINIS[m[1]], `mini ${m[1]} absent`).toBeTruthy();
        const total = words(body) + words(p[l].resume) + p[l].faqs.reduce((s, f) => s + words(f.q) + words(f.a), 0);
        expect(total, 'Länge').toBeGreaterThanOrEqual(p.group === 'stadt' ? 650 : p.tool ? 450 : 1100);
      });
    }
  });
}

describe('mini-simulateurs', () => {
  for (const [k, f] of Object.entries(MINIS)) {
    it(`${k} : résultat calculé dans les deux langues, sans NaN`, () => {
      for (const l of ['de', 'en'] as const) {
        const s = f(l);
        const v = Object.fromEntries(s.inputs.map((i) => [i.id, i.def]));
        const o = s.run(v);
        expect(o.head[1]).not.toMatch(/NaN|undefined|Infinity/);
        for (const [, x] of o.rows) expect(x).not.toMatch(/NaN|undefined|Infinity/);
      }
    });
  }
});

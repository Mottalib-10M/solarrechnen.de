#!/usr/bin/env python3
"""Erzeugt public/llms.txt aus dem Build (RECETTE §21). Aufruf: npm run build && python3 scripts/build-llms.py && npm run build"""
import glob, html, os, re
SITE = re.search(r'SITE_URL = "([^"]+)"', open('src/data/site-config.ts').read()).group(1)
rows = {'de': [], 'en': []}
for f in sorted(glob.glob('dist/*/**/index.html', recursive=True)):
    d = open(f, encoding='utf-8').read()
    if 'noindex' in d[:3000] or '/embed/' in f: continue
    path = '/' + os.path.relpath(os.path.dirname(f), 'dist').replace(os.sep, '/') + '/'
    lang = path.split('/')[1]
    if lang not in rows: continue
    t = html.unescape(re.search(r'<title>(.*?)</title>', d, re.S).group(1))
    m = re.search(r'name="description" content="(.*?)"', d, re.S)
    rows[lang].append((path, t, html.unescape(m.group(1)) if m else ''))
out = ['# Solarrechnen', '',
       '> Unabhängige Seite von Radif Partners auf Deutsch und Englisch zu Balkonkraftwerken (Steckersolargeräten) und Photovoltaik in Deutschland 2026: Ertrag für jede Postleitzahl aus PVGIS 5.3 der EU-Kommission (alle rund 10 800 PLZ einzeln abgefragt, Ausrichtungsmatrix für 28 Regionen), Eigenverbrauch aus einer Viertelstunden-Simulation mit 74 gemessenen Haushalten (HTW Berlin), Einspeisevergütung nach den Tabellen der Bundesnetzagentur je Inbetriebnahme-Zeitraum, 60-Prozent-Grenze und negative Preise nach dem Solarspitzengesetz, Registerzahlen aus dem Marktstammdatenregister. Der Regierungsentwurf zum EEG 2027 (BT-Drucksache 21/7867) wird beschrieben, aber nicht als geltendes Recht gerechnet.', '',
       'Alle Berechnungen laufen im Browser; keine Datenerhebung, keine Telefonnummer, keine Vermittlung von Angeboten. Ergebnisse sind Schätzungen.', '']
for lang, titel in (('de', '## Seiten auf Deutsch'), ('en', '## Pages in English')):
    out.append(titel); out.append('')
    for p, t, d in rows[lang]: out.append(f'- [{t}]({SITE}{p}): {d}')
    out.append('')
open('public/llms.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('llms.txt:', sum(len(v) for v in rows.values()), 'Seiten')

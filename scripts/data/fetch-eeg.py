#!/usr/bin/env python3
"""Einspeisevergütung für Solaranlagen bis 100 kW nach Inbetriebnahmezeitraum, aus der Excel-Tabelle
der Bundesnetzagentur (Fördersätze, Teil- und Volleinspeisung, Gebäude bis 10, 40 und 100 kW).
Die Tabelle des jüngsten Zeitraums enthält alle Zeiträume seit 2023. Die Werte werden wie im
Gesetz auf zwei Nachkommastellen gerundet (§ 49 EEG 2023). Ergebnis : src/data/eeg-saetze.json.
Rejouable, auch durch die GitHub Action : python3 scripts/data/fetch-eeg.py [Dateiname]
"""
import json, os, re, sys, urllib.request, datetime
import openpyxl
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/Archiv_VergSaetze/_DL/"
PAGE = "https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/Archiv_VergSaetze/start.html"
UA = {"User-Agent": "Mozilla/5.0 (solarrechnen.de data script)"}
name = sys.argv[1] if len(sys.argv) > 1 else None
if not name:  # jüngste Datei auf der Archivseite
    html = urllib.request.urlopen(urllib.request.Request(PAGE, headers=UA), timeout=60).read().decode("utf-8", "ignore")
    files = sorted(set(re.findall(r"_DL/(VergSaetze[A-Za-z0-9_]+)\.xlsx", html)))
    MON = {"jan": 1, "feb": 2, "mrz": 3, "apr": 4, "mai": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dez": 12}
    def key(f):  # Ende des Zeitraums : letzter Monat und letztes Jahr im Dateinamen
        ms = re.findall(r"(jan|feb|mrz|apr|mai|jun|jul|aug|sep|okt|nov|dez)[a-z]*_?(\d{2,4})", f.lower())
        if not ms: return (0, 0)
        m, y = ms[-1]; return (int(y) % 100, MON[m])
    name = max(files, key=key)
raw = os.path.join(ROOT, "research", "bnetza", f"{name}.xlsx")
os.makedirs(os.path.dirname(raw), exist_ok=True)
if not os.path.exists(raw):
    open(raw, "wb").write(urllib.request.urlopen(urllib.request.Request(BASE + name + ".xlsx?__blob=publicationFile", headers=UA), timeout=60).read())
ws = openpyxl.load_workbook(raw, data_only=True)["Solar"]
rows = [[x for x in r if x is not None] for r in ws.iter_rows(values_only=True)]
perioden = []; cur = None
for r in rows:
    if r and isinstance(r[0], str) and r[0].startswith("Anzulegende Werte"): break  # nur feste Einspeisevergütung
    if r and isinstance(r[0], str) and r[0].startswith("ab "):
        m = re.findall(r"(\d{2})\.(\d{2})\.(\d{4})", r[0])
        cur = {"von": "%s-%s-%s" % m[0][::-1], "bis": "%s-%s-%s" % m[1][::-1]}
        perioden.append(cur)
    elif cur is not None and r and isinstance(r[0], str) and r[0].startswith("Teileinspeisung"):
        cur["teil"] = [round(x + 1e-9, 2) for x in r[1:4]]; cur["sonstige"] = round(r[4] + 1e-9, 2)
    elif cur is not None and r and isinstance(r[0], str) and r[0].startswith("Volleinspeisung"):
        cur["voll"] = [round(x + 1e-9, 2) for x in r[1:4]]
assert perioden and all("teil" in p and "voll" in p for p in perioden), perioden
json.dump({"source": BASE + name + ".xlsx", "page": PAGE, "file": name, "retrieved_at": datetime.date.today().isoformat(),
           "grenzen_kw": [10, 40, 100], "einheit": "ct/kWh", "perioden": perioden},
          open(os.path.join(ROOT, "src", "data", "eeg-saetze.json"), "w"), ensure_ascii=False, indent=1)
for p in perioden: print(p["von"], p["bis"], p["teil"], p["voll"])

#!/usr/bin/env python3
"""PVGIS 5.3 direkt für jede Postleitzahl (Mittelpunkt der Orte laut GeoNames), 1 kWp, 35° Süd, 14 % Verluste,
Horizont aus dem Geländemodell. Ersetzt den Rasterwert dort, wo Berge oder Küsten ihn verzerren (Alpen).
Zwischenspeicher research/pvgis-cache/. Ergebnis : research/pvgis-plz.json. Rejouable."""
import json, os, concurrent.futures as cf, datetime, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location("fp", os.path.join(ROOT, "scripts", "data", "fetch-pvgis.py"))
src = open(spec.origin).read().split("# Postleitzahlen")[0]
ns = {"__file__": spec.origin}; exec(src, ns); call = ns["call"]
pts = {}
for line in open(os.path.join(ROOT, "research", "geonames-DE.txt"), encoding="utf-8"):
    f = line.rstrip("\n").split("\t")
    if len(f) > 10 and f[9]: pts.setdefault(f[1], []).append((float(f[9]), float(f[10])))
jobs = {p: (round(sum(a for a, _ in v) / len(v), 3), round(sum(b for _, b in v) / len(v), 3)) for p, v in pts.items()}
res = {}
with cf.ThreadPoolExecutor(8) as ex:
    fut = {ex.submit(call, la, lo, 35, 0): p for p, (la, lo) in jobs.items()}
    for i, f in enumerate(cf.as_completed(fut)):
        d = f.result(); p = fut[f]
        if "E_y" in d: res[p] = round(d["E_y"], 1)
        if i % 1000 == 0: print(i, flush=True)
json.dump({"retrieved_at": datetime.date.today().isoformat(), "ey": res}, open(os.path.join(ROOT, "research", "pvgis-plz.json"), "w"))
print(len(res), "PLZ")

#!/usr/bin/env python3
"""Stundenwerte PVGIS 5.3 (seriescalc) für einen Bezugsort in der Mitte Deutschlands (Kassel),
Jahre 2019 bis 2023 und 2010, 1 kWp, 14 % Verluste, je Ausrichtungsform (Himmelsrichtung x Neigung).
Sie dienen nur der Form des Tagesgangs (Eigenverbrauch, Abregelung am Wechselrichter, 60-%-Grenze):
die Jahressumme jedes Standorts kommt aus dem Raster (fetch-pvgis.py).
Rejouable : python3 scripts/data/fetch-stunden.py
"""
import json, os, urllib.request, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "research", "pvgis-stunden"); os.makedirs(OUT, exist_ok=True)
LAT, LON = 51.32, 9.49
SHAPES = [(t, a) for t in (15, 35, 60, 90) for a in (-90, -45, 0, 45, 90)]
# 2019-2023 : Jahresgang ; 2010 : gleiches Wetterjahr wie die HTW-Lastprofile (Eigenverbrauch).
for (y0, y1), suf in (((2019, 2023), ""), ((2010, 2010), "_2010")):
  for t, a in SHAPES:
    p = os.path.join(OUT, f"t{t}_a{a}{suf}.json")
    if os.path.exists(p): continue
    url = (f"https://re.jrc.ec.europa.eu/api/v5_3/seriescalc?lat={LAT}&lon={LON}&pvcalculation=1&peakpower=1&loss=14"
           f"&angle={t}&aspect={a}&startyear={y0}&endyear={y1}&outputformat=json")
    for k in range(5):
        try:
            d = json.load(urllib.request.urlopen(url, timeout=120)); break
        except Exception as e:
            print("retry", e); time.sleep(5)
    rows = d["outputs"]["hourly"]
    json.dump({"url": url, "time": [r["time"] for r in rows], "P": [round(r["P"], 1) for r in rows]}, open(p, "w"))
    print(y0, t, a, len(rows), sum(r["P"] for r in rows) / (y1 - y0 + 1) / 1000, "kWh/kWp/a")

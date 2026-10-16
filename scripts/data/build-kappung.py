#!/usr/bin/env python3
"""Anteil des Jahresertrags oberhalb einer Leistungsgrenze (Volleinspeisung ohne Eigenverbrauch), je
Ausrichtungsform, aus den PVGIS-Stundenwerten 2019-2023 (Kassel). Stundenmittel unterschätzen kurze Spitzen ;
die Werte sind daher eine Untergrenze. Ausgabe : src/data/kappung.json.
"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = {"source": "PVGIS 5.3 seriescalc 2019-2023, Kassel", "grenzen": [0.5, 0.6, 0.7], "formen": {}}
for t in (15, 35, 60, 90):
    for a in (-90, -45, 0, 45, 90):
        P = [p / 1000 for p in json.load(open(os.path.join(ROOT, "research", "pvgis-stunden", f"t{t}_a{a}.json")))["P"]]
        tot = sum(P)
        out["formen"][f"{t}_{a}"] = [round(sum(max(0.0, p - c) for p in P) / tot, 4) for c in out["grenzen"]]
json.dump(out, open(os.path.join(ROOT, "src", "data", "kappung.json"), "w"), indent=1)
print(out["formen"]["35_0"], out["formen"]["35_-90"])

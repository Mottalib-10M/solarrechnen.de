#!/usr/bin/env python3
"""Referenzfälle für die Tests: PVGIS direkt an den exakten Koordinaten einiger Postleitzahlen (35° Süd und
drei weitere Ausrichtungen), verglichen mit dem Rasterwert. Ergebnis : tests/referenz.json."""
import json, os, urllib.request, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = json.load(open(os.path.join(ROOT, "src", "data", "standort.json")))
pts = {}
for line in open(os.path.join(ROOT, "research", "geonames-DE.txt"), encoding="utf-8"):
    f = line.split("\t")
    if len(f) > 10 and f[9]: pts.setdefault(f[1], []).append((float(f[9]), float(f[10])))
PLZ = ["10115", "20095", "80331", "50667", "60311", "70173", "01067", "04109", "30159", "90402", "79098", "24103", "18055", "66111", "87561", "26721"]
def node(p):
    n = int(p); k = 0
    for i, (a, _) in enumerate(S["runs"]):
        if a <= n: k = i
    return S["runs"][k][1]
def q(lat, lon, t, a):
    u = f"https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat={lat:.4f}&lon={lon:.4f}&peakpower=1&loss=14&angle={t}&aspect={a}&outputformat=json"
    for k in range(5):
        try: return json.load(urllib.request.urlopen(u, timeout=60))["outputs"]["totals"]["fixed"]["E_y"]
        except Exception: time.sleep(3)
out = {"pvgis": [], "ausrichtung": []}
for p in PLZ:
    v = pts[p]; la = sum(a for a, _ in v) / len(v); lo = sum(b for _, b in v) / len(v)
    ex = q(la, lo, 35, 0); i = node(p)
    out["pvgis"].append({"plz": p, "exakt": ex, "raster": S["ey"][i]})
    if p in ("10115", "80331", "20095"):
        for t, a in ((90, 0), (35, -90), (90, 90), (10, 0)):
            out["ausrichtung"].append({"plz": p, "neigung": t, "azimut": a, "exakt": q(S["lat"][i], S["lon"][i], t, a)})
out["pvgis_max_abw"] = max(abs(x["raster"] / x["exakt"] - 1) for x in out["pvgis"])
json.dump(out, open(os.path.join(ROOT, "tests", "referenz.json"), "w"), indent=1)
print(out["pvgis_max_abw"], [(x["plz"], x["exakt"], x["raster"]) for x in out["pvgis"]])

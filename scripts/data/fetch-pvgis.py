#!/usr/bin/env python3
"""Ertragsdaten der EU-Kommission (PVGIS 5.3, Gemeinsame Forschungsstelle JRC) für ganz Deutschland.

1. Raster: ein Knoten alle 0,2° Breite x 0,3° Länge (rund 22 x 20 km), behalten werden nur Knoten
   mit mindestens einer Postleitzahl (GeoNames) im Umkreis. Je Knoten ein Aufruf PVcalc mit 1 kWp,
   14 % Systemverluste, 35° Neigung, Südausrichtung, Horizont aus dem Geländemodell.
2. Ausrichtungsmatrix: je Großregion (1,5° x 2°) ein Bezugspunkt, Neigung 0 bis 90° x 8 Himmelsrichtungen.
3. Monatswerte (E_m) werden für jeden Knoten mitgeschrieben.
Alle Antworten liegen im Zwischenspeicher research/pvgis-cache/ ; ein zweiter Lauf fragt nichts erneut ab.
Rejouable : python3 scripts/data/fetch-pvgis.py
"""
import json, os, math, time, urllib.request, concurrent.futures as cf, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, "research", "pvgis-cache"); os.makedirs(CACHE, exist_ok=True)
API = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc"

def call(lat, lon, angle, aspect):
    key = f"{lat:.3f}_{lon:.3f}_{angle}_{aspect}.json"
    p = os.path.join(CACHE, key)
    if os.path.exists(p):
        return json.load(open(p))
    url = f"{API}?lat={lat:.4f}&lon={lon:.4f}&peakpower=1&loss=14&angle={angle}&aspect={aspect}&outputformat=json"
    for attempt in range(6):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                d = json.load(r)
            slim = {"E_y": d["outputs"]["totals"]["fixed"]["E_y"], "H_y": d["outputs"]["totals"]["fixed"]["H(i)_y"],
                    "E_m": [m["E_m"] for m in d["outputs"]["monthly"]["fixed"]], "elev": d["inputs"]["location"]["elevation"],
                    "db": d["inputs"]["meteo_data"]["radiation_db"], "years": [d["inputs"]["meteo_data"]["year_min"], d["inputs"]["meteo_data"]["year_max"]]}
            json.dump(slim, open(p, "w"))
            return slim
        except Exception as e:
            msg = str(e)
            if "400" in msg:  # Punkt im Meer o. ä.
                json.dump({"error": msg}, open(p, "w")); return {"error": msg}
            time.sleep(2 + attempt * 3)
    raise RuntimeError(url)

# Postleitzahlen (GeoNames, CC BY 4.0)
plz = {}
for line in open(os.path.join(ROOT, "research", "geonames-DE.txt"), encoding="utf-8"):
    f = line.rstrip("\n").split("\t")
    if len(f) < 11 or not f[9]: continue
    plz.setdefault(f[1], []).append((float(f[9]), float(f[10]), f[2]))
pts = {k: (sum(a for a, _, _ in v) / len(v), sum(b for _, b, _ in v) / len(v)) for k, v in plz.items()}

DLAT, DLON = 0.2, 0.3
def node(lat, lon):
    return (round(round((lat - 47.2) / DLAT) * DLAT + 47.2, 3), round(round((lon - 5.8) / DLON) * DLON + 5.8, 3))
nodes = sorted({node(a, b) for a, b in pts.values()})
print(len(pts), "PLZ ->", len(nodes), "Rasterknoten")

def region(lat, lon):
    return (min(int((lat - 47.0) // 1.5), 5), min(int((lon - 5.5) // 2.0), 4))
regs = {}
for a, b in nodes: regs.setdefault(region(a, b), []).append((a, b))
refs = {}
for r, lst in regs.items():  # Bezugspunkt = Knoten nächst dem Schwerpunkt der Region
    ca = sum(a for a, _ in lst) / len(lst); cb = sum(b for _, b in lst) / len(lst)
    refs[r] = min(lst, key=lambda x: (x[0] - ca) ** 2 + (x[1] - cb) ** 2)
TILTS = [0, 10, 20, 30, 35, 40, 50, 60, 70, 80, 90]
ASPECTS = [-180, -135, -90, -45, 0, 45, 90, 135]
jobs = [(a, b, 35, 0) for a, b in nodes]
for r, (a, b) in refs.items():
    for t in TILTS:
        for az in (ASPECTS if t else [0]):
            jobs.append((a, b, t, az))
jobs = sorted(set(jobs))
print(len(jobs), "Aufrufe (davon im Zwischenspeicher:", sum(os.path.exists(os.path.join(CACHE, f"{a:.3f}_{b:.3f}_{t}_{z}.json")) for a, b, t, z in jobs), ")")
res = {}
with cf.ThreadPoolExecutor(8) as ex:
    futs = {ex.submit(call, *j): j for j in jobs}
    for i, f in enumerate(cf.as_completed(futs)):
        res[futs[f]] = f.result()
        if i % 200 == 0: print(i, flush=True)

grid = []
for a, b in nodes:
    d = res[(a, b, 35, 0)]
    if "error" in d: continue
    grid.append({"lat": a, "lon": b, "ey": round(d["E_y"], 1), "em": [round(x, 1) for x in d["E_m"]], "elev": d["elev"], "reg": "%d_%d" % region(a, b)})
mat = {}
for r, (a, b) in refs.items():
    base = res[(a, b, 35, 0)]["E_y"]
    m = {}
    for t in TILTS:
        for az in (ASPECTS if t else [0]):
            m[f"{t}_{az}"] = round(res[(a, b, t, az)]["E_y"] / base, 4)
    mat["%d_%d" % r] = {"lat": a, "lon": b, "f": m}
meta = next(v for v in res.values() if "db" in v)
json.dump({"source": "PVGIS 5.3, European Commission Joint Research Centre", "api": "PVcalc, re.jrc.ec.europa.eu/api/v5_3", "radiation_db": meta["db"], "years": meta["years"],
           "retrieved_at": datetime.date.today().isoformat(), "params": {"peakpower_kwp": 1, "loss_pct": 14, "angle": 35, "aspect": 0, "horizon": "DEM-calculated"},
           "dlat": DLAT, "dlon": DLON, "grid": grid, "matrix": mat, "tilts": TILTS, "aspects": ASPECTS},
          open(os.path.join(ROOT, "research", "pvgis-grid.json"), "w"))
print("Raster:", len(grid), "Knoten ; Regionen:", len(mat))

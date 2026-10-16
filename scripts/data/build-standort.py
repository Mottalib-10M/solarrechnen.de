#!/usr/bin/env python3
"""Fasst die Standortdaten für den Rechner zusammen (src/data/standort.json, src/data/staedte.json):
- PVGIS-Raster (research/pvgis-grid.json) : Ertrag je kWp bei 35° Süd für 838 Knoten, Monatsanteile und
  Ausrichtungsmatrix je Großregion ;
- Postleitzahl -> Rasterknoten (GeoNames DE, CC BY 4.0, Mittelpunkt aller Orte einer PLZ ; eine PLZ ohne
  Eintrag nimmt den Knoten der nächstkleineren bekannten PLZ) ;
- Ortsname je Knoten : einwohnerstärkste Gemeinde in der Rasterzelle (Destatis, Gemeindeverzeichnis) ;
- Länderdurchschnitt nach Einwohnern ; Großstädte mit Marktstammdatenregister (research/mastr.json).
Rejouable : python3 scripts/data/build-standort.py
"""
import json, os, math
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda *p: os.path.join(ROOT, *p)
g = json.load(open(R("research", "pvgis-grid.json")))
gem = json.load(open(R("research", "gemeinden.json")))
mastr = json.load(open(R("research", "mastr.json")))
nodes = g["grid"]
DLAT, DLON = g["dlat"], g["dlon"]
key = lambda la, lo: (round(round((la - 47.2) / DLAT) * DLAT + 47.2, 3), round(round((lo - 5.8) / DLON) * DLON + 5.8, 3))
nidx = {(n["lat"], n["lon"]): i for i, n in enumerate(nodes)}
def nearest(la, lo):
    k = key(la, lo)
    if k in nidx: return nidx[k]
    return min(range(len(nodes)), key=lambda i: (nodes[i]["lat"] - la) ** 2 + ((nodes[i]["lon"] - lo) * math.cos(math.radians(la))) ** 2)
# PLZ
plz = {}
for line in open(R("research", "geonames-DE.txt"), encoding="utf-8"):
    f = line.rstrip("\n").split("\t")
    if len(f) < 11 or not f[9]: continue
    plz.setdefault(int(f[1]), []).append((float(f[9]), float(f[10])))
runs = []
direkt = json.load(open(R("research", "pvgis-plz.json")))["ey"]  # PVGIS je PLZ (fetch-pvgis-plz.py)
plzliste, plzey = [], []
for p in sorted(plz):
    v = plz[p]; i = nearest(sum(a for a, _ in v) / len(v), sum(b for _, b in v) / len(v))
    if not runs or runs[-1][1] != i: runs.append([p, i])
    e = direkt.get(f"{p:05d}")
    if e: plzliste.append(p); plzey.append(int(round(e)))
# kompakt: PLZ als Differenzen, Ertrag als ganze kWh, beides in Basis 36
b36 = lambda n, w: "".join("0123456789abcdefghijklmnopqrstuvwxyz"[(n // 36 ** k) % 36] for k in reversed(range(w)))
pk = "".join(b36(d, 3) for d in [plzliste[0]] + [b - a for a, b in zip(plzliste, plzliste[1:])])
ek = "".join(b36(e, 2) for e in plzey)
# Ortsname je Knoten
best = {}
for x in gem["gemeinden"]:
    i = nearest(x["lat"], x["lon"])
    if i not in best or x["ew"] > best[i]["ew"]: best[i] = x
names = [best[i]["name"].split(",")[0] if i in best else "" for i in range(len(nodes))]
# Länder
LAND = {"01": "SH", "02": "HH", "03": "NI", "04": "HB", "05": "NW", "06": "HE", "07": "RP", "08": "BW", "09": "BY", "10": "SL", "11": "BE", "12": "BB", "13": "MV", "14": "SN", "15": "ST", "16": "TH"}
acc = {}
for x in gem["gemeinden"]:
    i = nearest(x["lat"], x["lon"]); a = acc.setdefault(LAND[x["land"]], [0.0, 0])
    a[0] += nodes[i]["ey"] * x["ew"]; a[1] += x["ew"]
laender = {k: round(v[0] / v[1], 1) for k, v in sorted(acc.items())}
ew_all = sum(x["ew"] for x in gem["gemeinden"])
bund = round(sum(nodes[nearest(x["lat"], x["lon"])]["ey"] * x["ew"] for x in gem["gemeinden"]) / ew_all, 1)
# Regionen : Matrix und Monatsanteile
regs = sorted(g["matrix"])
TILTS, ASPECTS = g["tilts"], g["aspects"]
mat = []
for r in regs:
    f = g["matrix"][r]["f"]
    mat.append([[f["0_0"]] * len(ASPECTS) if t == 0 else [f[f"{t}_{a}"] for a in ASPECTS] for t in TILTS])
mon = []
for r in regs:
    ms = [sum(n["em"][m] for n in nodes if n["reg"] == r) for m in range(12)]
    s = sum(ms); mon.append([round(x / s, 4) for x in ms])
out = {"source": {"pvgis": g["source"], "radiation_db": g["radiation_db"], "years": g["years"], "retrieved_at": g["retrieved_at"],
                  "plz": "GeoNames postal codes DE (CC BY 4.0)", "orte": gem["title"] + " (Destatis)"},
       "params": g["params"], "tilts": TILTS, "aspects": ASPECTS,
       "lat": [n["lat"] for n in nodes], "lon": [n["lon"] for n in nodes], "ey": [n["ey"] for n in nodes],
       "reg": [regs.index(n["reg"]) for n in nodes], "elev": [n["elev"] for n in nodes], "name": names,
       "runs": runs, "pk": pk, "ek": ek, "matrix": mat, "monate": mon, "laender": laender, "bund": bund,
       "min": min(n["ey"] for n in nodes), "max": max(n["ey"] for n in nodes)}
json.dump(out, open(R("src", "data", "standort.json"), "w"), ensure_ascii=False, separators=(",", ":"))
# Großstädte
CITY_NAMES = {"berlin": "Berlin", "hamburg": "Hamburg", "muenchen": "München", "koeln": "Köln", "frankfurt": "Frankfurt am Main",
              "stuttgart": "Stuttgart", "duesseldorf": "Düsseldorf", "leipzig": "Leipzig", "dresden": "Dresden", "hannover": "Hannover",
              "nuernberg": "Nürnberg", "freiburg": "Freiburg im Breisgau", "bremen": "Bremen", "dortmund": "Dortmund", "essen": "Essen"}
by_ags = {x["ars"][:5] + x["ars"][9:12]: x for x in gem["gemeinden"]}
st = {}
for slug, m in mastr["staedte"].items():
    x = by_ags[m["ags"]]; i = nearest(x["lat"], x["lon"])
    ey_plz = direkt.get(x["plz"])
    st[slug] = {"name": CITY_NAMES[slug], "ags": m["ags"], "plz": x["plz"], "lat": x["lat"], "lon": x["lon"], "ew": x["ew"], "node": i,
                "ey": round(ey_plz, 1) if ey_plz else nodes[i]["ey"], "em": nodes[i]["em"], "elev": nodes[i]["elev"], "reg": regs.index(nodes[i]["reg"]),
                **{k: m[k] for k in ("balkon", "gebaeude", "speicher", "voll", "ausrichtung")}}
json.dump({"source": {"mastr": mastr["source"], "mastr_url": mastr["url"], "mastr_retrieved_at": mastr["retrieved_at"],
                      "einwohner": gem["title"] + " (Destatis)"}, "bund": mastr["bund"], "ew_bund": ew_all, "staedte": st},
          open(R("src", "data", "staedte.json"), "w"), ensure_ascii=False, indent=1)
print(len(runs), "PLZ-Läufe ;", len(nodes), "Knoten ; Bund", bund, "; Länder", laender)
for s, v in st.items(): print(s, v["ey"], v["balkon"], round(v["balkon"] / v["ew"] * 1000, 1), "je 1000 EW")
print(os.path.getsize(R("src", "data", "standort.json")))

#!/usr/bin/env python3
"""Großhandelspreise (Day-Ahead, Gebotszone DE-LU, Filter 4169) und Erzeugung Photovoltaik (Filter 4068)
in Stundenauflösung von SMARD, der Strommarktdaten-Plattform der Bundesnetzagentur (CC BY 4.0).
Ergebnis : research/smard.json (Stunden mit negativem Preis je Jahr und Monat, Anteil des Solarstroms
in diesen Stunden, mittlerer Marktwert Solar). Rejouable, auch durch die GitHub Action.
"""
import json, os, urllib.request, datetime, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "https://www.smard.de/app/chart_data"
def get(u):
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "solarrechnen.de"}), timeout=60))
        except Exception as e: time.sleep(3)
    raise RuntimeError(u)
def series(f, y0):
    idx = get(f"{BASE}/{f}/DE/index_hour.json")["timestamps"]
    t0 = datetime.datetime(y0, 1, 1).timestamp() * 1000 - 8 * 86400000
    out = {}
    for ts in idx:
        if ts < t0: continue
        for t, v in get(f"{BASE}/{f}/DE/{f}_DE_hour_{ts}.json")["series"]:
            if v is not None: out[t] = v
    return out
price = series(4169, 2024); pv = series(4068, 2024)
res = {}
for t in sorted(price):
    d = datetime.datetime.fromtimestamp(t / 1000, datetime.timezone(datetime.timedelta(hours=1)))
    y, m = d.year, d.month
    if y < 2024: continue
    r = res.setdefault(y, {"hours": 0, "neg_hours": 0, "pv_mwh": 0.0, "pv_neg_mwh": 0.0, "pv_value_eur": 0.0, "months": {}})
    mm = r["months"].setdefault(m, {"neg_hours": 0, "pv_mwh": 0.0, "pv_neg_mwh": 0.0})
    p = price[t]; g = pv.get(t, 0.0) or 0.0
    r["hours"] += 1; r["pv_mwh"] += g; r["pv_value_eur"] += g * p; mm["pv_mwh"] += g
    if p < 0:
        r["neg_hours"] += 1; r["pv_neg_mwh"] += g; mm["neg_hours"] += 1; mm["pv_neg_mwh"] += g
for y, r in res.items():
    r["pv_neg_share"] = round(r["pv_neg_mwh"] / r["pv_mwh"], 4) if r["pv_mwh"] else 0
    r["pv_marktwert_ct"] = round(r["pv_value_eur"] / r["pv_mwh"] / 10, 2) if r["pv_mwh"] else 0
    for k in ("pv_mwh", "pv_neg_mwh", "pv_value_eur"): r[k] = round(r[k])
    for m in r["months"].values():
        m["pv_neg_share"] = round(m["pv_neg_mwh"] / m["pv_mwh"], 4) if m["pv_mwh"] else 0
        m["pv_mwh"] = round(m["pv_mwh"]); m["pv_neg_mwh"] = round(m["pv_neg_mwh"])
json.dump({"source": "SMARD.de, Bundesnetzagentur (CC BY 4.0)", "filters": {"price": 4169, "pv": 4068},
           "retrieved_at": datetime.date.today().isoformat(), "years": res}, open(os.path.join(ROOT, "research", "smard.json"), "w"), indent=1)
for y, r in res.items(): print(y, r["hours"], "h,", r["neg_hours"], "negative h, Solaranteil", r["pv_neg_share"], "Marktwert", r["pv_marktwert_ct"])

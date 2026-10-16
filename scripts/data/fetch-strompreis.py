#!/usr/bin/env python3
"""Durchschnittlicher Strompreis privater Haushalte in Deutschland, Verbrauchsband DC (2 500 bis 4 999 kWh),
alle Steuern und Abgaben enthalten, Halbjahreswerte von Eurostat (Tabelle nrg_pc_204, Lieferung der
Mitgliedstaaten, für Deutschland von Destatis). Ergebnis : src/data/strompreis.json. Rejouable (GitHub Action).
"""
import json, os, urllib.request, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_204?format=JSON&geo=DE"
       "&nrg_cons=KWH2500-4999&unit=KWH&tax=I_TAX&currency=EUR&lang=EN")
d = json.load(urllib.request.urlopen(URL, timeout=60))
idx = d["dimension"]["time"]["category"]["index"]; inv = {i: k for k, i in idx.items()}
serie = {inv[int(k)]: v for k, v in d["value"].items()}
last = max(serie)
json.dump({"source": "Eurostat nrg_pc_204, Germany, band DC 2 500-4 999 kWh, all taxes and levies included", "url": URL,
           "eurostat_updated": d.get("updated"), "retrieved_at": datetime.date.today().isoformat(),
           "letztes_halbjahr": last, "eur_kwh": serie[last], "reihe": {k: serie[k] for k in sorted(serie) if k >= "2019"}},
          open(os.path.join(ROOT, "src", "data", "strompreis.json"), "w"), indent=1)
print(last, serie[last])

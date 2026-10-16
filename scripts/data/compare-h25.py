#!/usr/bin/env python3
"""Vergleich der HTW-Lastprofile (2010) mit dem BDEW-Standardlastprofil H25 (2025).

Frage : Liegt der Tagesverlauf der 74 Haushalte von 2010 noch richtig? Maß : Anteil des Tagesverbrauchs
zwischen 10 und 16 Uhr (MEZ) an Werktagen im Januar und im Juni, Mittel der 74 Haushalte gegen H25.
H25 : BDEW, „Repräsentative Profile H25 … Veröffentlichung“ (bdew.de/energie/standardlastprofile-strom/),
aus Bilanzierungsdaten von 62 Verteilnetzbetreibern 2018/2019, mit leichtem PV-Eigenverbrauch (BDEW-Hinweise
vom 17.03.2025) ; gesetzliche Zeit, im Sommer daher um eine Stunde auf MEZ zurückgeschoben.
H25 ist ein Summenprofil ohne Einzelspitzen : es taugt zum Prüfen des Tagesverlaufs, nicht zum Ersetzen der
Einzelhaushalte, an denen der Eigenverbrauch hängt. Ausgabe : src/data/h25-vergleich.json.
Rejouable : python3 scripts/data/compare-h25.py
"""
import datetime, json, os, urllib.request
import numpy as np, openpyxl
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda *p: os.path.join(ROOT, *p)
URL = "https://www.bdew.de/media/documents/Kopie_von_Repr%C3%A4sentative_Profile_BDEW_H25_G25_L25_P25_S25_Ver%C3%B6ffentlichung.xlsx"
X = R("research", "bdew", "BDEW_SLP_2025.xlsx")
if not os.path.exists(X):
    os.makedirs(os.path.dirname(X), exist_ok=True)
    urllib.request.urlretrieve(URL, X)
LD = np.load(R("research", "htw", "last15.npy")).astype(float)  # build-eigenverbrauch.py erzeugt den Cache
mean = LD.mean(axis=1)
rows = list(openpyxl.load_workbook(X, read_only=True, data_only=True)["H25"].iter_rows(values_only=True))
months, kinds = rows[2], rows[3]
data = [r for r in rows[4:] if isinstance(r[1], str) and "-" in r[1]][:96]
WIN = slice(40, 64)  # 10:00-16:00
out = {"source": URL, "retrieved_at": datetime.date.today().isoformat(), "fenster": "10-16 Uhr MEZ, Werktage", "monate": {}}
for mon in range(1, 13):
    days = [d for d in range(365) if (datetime.date(2010, 1, 1) + datetime.timedelta(d)).month == mon and (datetime.date(2010, 1, 1) + datetime.timedelta(d)).weekday() < 5]
    htw = np.mean([mean[d * 96:(d + 1) * 96] for d in days], axis=0); htw /= htw.sum()
    j = next(i for i, (a, b) in enumerate(zip(months, kinds)) if hasattr(a, "month") and a.month == mon and b == "WT")
    h25 = np.array([float(r[j]) for r in data]); h25 /= h25.sum()
    if 4 <= mon <= 10: h25 = np.roll(h25, -4)  # Sommerzeit (April bis Oktober überwiegend) -> MEZ
    out["monate"][mon] = {"htw": round(float(htw[WIN].sum()), 4), "h25": round(float(h25[WIN].sum()), 4)}
json.dump(out, open(R("src", "data", "h25-vergleich.json"), "w"), indent=1)
for m, v in out["monate"].items(): print(m, f"HTW {v['htw']*100:.1f} %  H25 {v['h25']*100:.1f} %")

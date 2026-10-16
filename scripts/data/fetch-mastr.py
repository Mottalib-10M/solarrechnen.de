#!/usr/bin/env python3
"""Zählungen aus dem Marktstammdatenregister der Bundesnetzagentur (öffentliche Einheitenübersicht,
Datenlizenz Deutschland – Namensnennung – Version 2.0): Balkonkraftwerke (Art der Solaranlage
„Steckerfertige Solaranlage“) und Gebäudesolaranlagen in Betrieb, je Großstadt und bundesweit,
Hauptausrichtung der Dachanlagen, Stromspeicher, Volleinspeisung.
Ergebnis : research/mastr.json. Rejouable, auch durch die GitHub Action (Stand ändert sich täglich).
"""
import json, os, urllib.request, urllib.parse, datetime, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = "https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetErweiterteOeffentlicheEinheitStromerzeugung"
def total(flt):
    url = f"{B}?sort=&page=1&pageSize=1&group=&filter={urllib.parse.quote(flt)}"
    for k in range(5):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "solarrechnen.de data script"}), timeout=60))
            return int(d["Total"])
        except Exception:
            time.sleep(3 + 3 * k)
    raise RuntimeError(flt)
CITIES = {"berlin": "11000000", "hamburg": "02000000", "muenchen": "09162000", "koeln": "05315000", "frankfurt": "06412000",
          "stuttgart": "08111000", "duesseldorf": "05111000", "leipzig": "14713000", "dresden": "14612000", "hannover": "03241001",
          "nuernberg": "09564000", "freiburg": "08311000", "bremen": "04011000", "dortmund": "05913000", "essen": "05113000"}
ORIENT = {"695": "N", "696": "NO", "697": "O", "698": "SO", "699": "S", "700": "SW", "701": "W", "702": "NW", "703": "nachgefuehrt", "704": "OW"}
BAL, GEB, AKTIV = "Art der Solaranlage~eq~'2961'", "Art der Solaranlage~eq~'853'", "Betriebs-Status~eq~'35'"
def block(pre):
    j = (pre + "~and~") if pre else ""
    r = {"balkon": total(f"{j}{BAL}~and~{AKTIV}"), "gebaeude": total(f"{j}{GEB}~and~{AKTIV}"),
         "speicher": total(f"{j}Energieträger~eq~'2496'~and~{AKTIV}"),
         "voll": total(f"{j}{GEB}~and~{AKTIV}~and~Volleinspeisung oder Teileinspeisung~eq~'688'"), "ausrichtung": {}}
    for k, v in ORIENT.items():
        r["ausrichtung"][v] = total(f"{j}{GEB}~and~{AKTIV}~and~Hauptausrichtung der Solar-Module~eq~'{k}'")
    return r
out = {"source": "Marktstammdatenregister der Bundesnetzagentur, öffentliche Einheitenübersicht (dl-de/by-2-0)", "url": "https://www.marktstammdatenregister.de/MaStR/Einheit/Einheiten/ErweiterteOeffentlicheEinheitenuebersicht",
       "retrieved_at": datetime.date.today().isoformat(), "bund": block(""), "staedte": {}}
for slug, ags in CITIES.items():
    out["staedte"][slug] = {"ags": ags, **block(f"Gemeindeschlüssel~eq~'{ags}'")}
    print(slug, out["staedte"][slug]["balkon"], out["staedte"][slug]["gebaeude"], flush=True)
json.dump(out, open(os.path.join(ROOT, "research", "mastr.json"), "w"), ensure_ascii=False, indent=1)
print("bund", out["bund"])

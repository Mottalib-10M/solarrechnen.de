#!/usr/bin/env python3
"""Eigenverbrauch, Abregelung und Einspeisung aus einer Viertelstunden-Simulation, als Tabellen für den Rechner.

Last : 74 reale Haushalte, HTW Berlin „Repräsentative elektrische Lastprofile für Wohngebäude in Deutschland“
(Messung IZES, Jahr 2010, 1-Minuten-Werte je Phase), hier zu Viertelstunden gemittelt und je Haushalt auf den
gewählten Jahresverbrauch skaliert. Das Ergebnis ist der Mittelwert über die 74 Haushalte: ein einzelner Haushalt
liegt darüber oder darunter, je nachdem, wann er Strom braucht.
Erzeugung : PVGIS 5.3, Stundenwerte des Wetterjahres 2010 am Bezugsort Kassel je Ausrichtungsform
(fetch-stunden.py), auf Viertelstunden verteilt; die Lastdaten sind in MEZ ohne Sommerzeit, PVGIS in UTC.
Speicher : Wirkungsgrad je Richtung 0,949 (rund 90 % hin und zurück), Leistung max(0,8 kW ; 0,5 x Kapazität).
Balkonkraftwerk : Wechselrichter 800 VA ; der Speicher sitzt auf der Gleichstromseite (lädt auch, was der
Wechselrichter abregeln müsste) und speist bis zur Wechselrichtergrenze ins Hausnetz zurück.
Dachanlage : Wirkleistungsbegrenzung am Netzanschluss auf 60 % oder 50 % der Nennleistung oder keine.
Ausgabe : src/data/eigenverbrauch.json. Rejouable : python3 scripts/data/build-eigenverbrauch.py
"""
import json, os, datetime
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda *p: os.path.join(ROOT, *p)

# --- Last ----------------------------------------------------------------------------------
cache = R("research", "htw", "last15.npy")
if os.path.exists(cache):
    LD = np.load(cache)
else:
    P = sum(np.loadtxt(R("research", "htw", f"PL{i}.csv"), delimiter=",", dtype=np.float32) for i in (1, 2, 3))  # W, 525600 x 74
    LD = P.reshape(-1, 15, P.shape[1]).mean(axis=1)  # W je Viertelstunde, 35040 x 74
    np.save(cache, LD)
LD = LD / (LD.sum(axis=0) * 0.25)  # je Haushalt auf 1 kWh/Jahr normiert: kW je kWh Jahresverbrauch
T, H = LD.shape
print("Last", T, "Viertelstunden x", H, "Haushalte")

# --- Erzeugung (UTC -> MEZ = UTC+1) -----------------------------------------------------------
TILTS = [15, 35, 60, 90]; ASPECTS = [-90, -45, 0, 45, 90]
shapes = [(t, a) for t in TILTS for a in ASPECTS]
PV = np.zeros((T, len(shapes)), dtype=np.float64)
spec = {}
for k, (t, a) in enumerate(shapes):
    d = json.load(open(R("research", "pvgis-stunden", f"t{t}_a{a}_2010.json")))
    p = np.array(d["P"], dtype=np.float64) / 1000  # kW je kWp, Stunde UTC
    p = np.roll(p, 1)  # Stunde UTC h -> MEZ h+1
    PV[:, k] = np.repeat(p, 4)[:T]
    spec[f"{t}_{a}"] = round(float(PV[:, k].sum() * 0.25), 1)
ETA = 0.949; DT = 0.25

def simulate(s_idx, h_idx, kwp, L, bat, ac=None, cap=None):
    """Vektoren gleicher Länge (eine Zeile je Konfiguration und Haushalt). Rückgabe: Anteile selbst genutzt, verloren."""
    n = len(s_idx); soc = np.zeros(n); pmax = np.maximum(0.8, 0.5 * bat) * DT
    selfu = np.zeros(n); lost = np.zeros(n); tot = np.zeros(n)
    has_bat = bat > 0
    for t in range(T):
        pv = PV[t, s_idx] * kwp * DT; ld = LD[t, h_idx] * L * DT
        tot += pv
        if ac is not None:
            acl = ac * DT
            direct = np.minimum(np.minimum(pv, ld), acl)
            surplus = pv - direct
            charge = np.where(has_bat, np.minimum(np.minimum(surplus * ETA, bat - soc), pmax * ETA), 0.0)
            soc += charge; surplus -= charge / ETA
            out = np.minimum(surplus, acl - direct)
            lost += surplus - out
            need = np.maximum(ld - direct, 0)
            dis = np.where(has_bat, np.minimum(np.minimum(need, soc * ETA), np.minimum(acl - direct, pmax)), 0.0)
            soc -= dis / ETA
            selfu += direct + dis
        else:
            direct = np.minimum(pv, ld)
            surplus = pv - direct
            charge = np.where(has_bat, np.minimum(np.minimum(surplus * ETA, bat - soc), pmax * ETA), 0.0)
            soc += charge; surplus -= charge / ETA
            need = ld - direct
            dis = np.where(has_bat, np.minimum(np.minimum(need, soc * ETA), pmax), 0.0)
            soc -= dis / ETA
            out = surplus if cap is None else np.minimum(surplus, cap * DT)
            lost += surplus - out
            selfu += direct + dis
    return selfu / tot, lost / tot

def table(configs, **kw):
    """configs: Liste (shape_index, kwp, L, bat[, cap]) -> Mittel über die Haushalte."""
    C = len(configs)
    s = np.repeat([c[0] for c in configs], H); kwp = np.repeat([c[1] for c in configs], H)
    L = np.repeat([c[2] for c in configs], H); b = np.repeat([float(c[3]) for c in configs], H)
    h = np.tile(np.arange(H), C)
    extra = {}
    if "cap" in kw and kw["cap"] == "per":
        extra["cap"] = np.repeat([c[4] for c in configs], H)
    else:
        extra = {k: v for k, v in kw.items()}
    sf, lf = simulate(s, h, kwp, L, b, **extra)
    return sf.reshape(C, H).mean(axis=1), lf.reshape(C, H).mean(axis=1)

out = {"source": {"last": "HTW Berlin, Repräsentative elektrische Lastprofile für Wohngebäude in Deutschland (74 Haushalte, 2010, IZES)", "pv": "PVGIS 5.3 seriescalc, Wetterjahr 2010, Kassel 51,32 N 9,49 O"},
       "generated": datetime.date.today().isoformat(), "resolution_min": 15, "households": H, "tilts": TILTS, "aspects": ASPECTS, "eta": ETA, "spec": spec}

# Balkonkraftwerk
E = [150, 300, 450, 600, 800, 1000, 1300, 1600, 2000, 2500]
L = [1000, 1500, 2000, 2500, 3000, 3500, 4500, 6000]
B = [0, 1, 1.5, 2, 3, 4]
cfg = [(k, e / spec[f"{t}_{a}"], l, b) for k, (t, a) in enumerate(shapes) for e in E for l in L for b in B]
res_s = np.zeros(len(cfg)); res_l = np.zeros(len(cfg))
BATCH = 1200
for i in range(0, len(cfg), BATCH):
    s_, l_ = table(cfg[i:i + BATCH], ac=0.8)
    res_s[i:i + BATCH] = s_; res_l[i:i + BATCH] = l_
    print("balkon", i + BATCH, "/", len(cfg), flush=True)
bk = {}
n = len(E) * len(L) * len(B)
for k, (t, a) in enumerate(shapes):
    bk[f"{t}_{a}"] = {"self": [int(round(x * 1000)) for x in res_s[k * n:(k + 1) * n]], "lost": [int(round(x * 1000)) for x in res_l[k * n:(k + 1) * n]]}
out["balkon"] = {"E": E, "L": L, "B": B, "ac_kw": 0.8, "tables": bk}

# Dachanlage
RR = [0.1, 0.2, 0.35, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0]
BB = [0, 1, 2, 3, 4, 6, 8]
CAPS = {"none": None, "60": 0.6, "50": 0.5}
LREF = 4000
roof = [(k, (t, a)) for k, (t, a) in enumerate(shapes) if t != 90]
cfg = []
for k, (t, a) in roof:
    for ck, cv in CAPS.items():
        for r in RR:
            kwp = r * LREF / spec[f"{t}_{a}"]
            for b in BB:
                cfg.append((k, kwp, LREF, b * LREF / 1000, (cv * kwp) if cv else 1e9))
res_s = np.zeros(len(cfg)); res_l = np.zeros(len(cfg))
for i in range(0, len(cfg), BATCH):
    s_, l_ = table(cfg[i:i + BATCH], cap="per")
    res_s[i:i + BATCH] = s_; res_l[i:i + BATCH] = l_
    print("dach", i + BATCH, "/", len(cfg), flush=True)
dach = {}; n = len(RR) * len(BB); j = 0
for k, (t, a) in roof:
    for ck in CAPS:
        dach[f"{t}_{a}_{ck}"] = {"self": [int(round(x * 1000)) for x in res_s[j:j + n]], "lost": [int(round(x * 1000)) for x in res_l[j:j + n]]}
        j += n
out["dach"] = {"R": RR, "B": BB, "L_ref": LREF, "caps": list(CAPS), "tables": dach}
json.dump(out, open(R("src", "data", "eigenverbrauch.json"), "w"), separators=(",", ":"))
print("ok", os.path.getsize(R("src", "data", "eigenverbrauch.json")))

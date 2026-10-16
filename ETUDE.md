# Étude SERP : Balkonkraftwerk et photovoltaïque (DE-PV), 2026-10-15

Idée DE-PV de `reports/etude-niches-2026-10-15-B.md`, validée par l'éditeur le 2026-10-15.
Volume Keyword Planner (Objet Tech, Allemagne, allemand) : environ 760 000 recherches/mois sur la liste fermée
(`balkonkraftwerk` et `balkonkraftwerk mit speicher` 100 k – 1 M, `balkonkraftwerk anmelden` et `einspeisevergütung`
10 k – 100 k ; relevé consigné dans `reports/volumes-2026-10-15/de-pv.txt`, 695 701 sur les seules fourchettes notées).
Enchère haute 1,4 à 4,8 €.

SERP relevés le 2026-10-15 par recherche web (pas de géolocalisation Chrome, interdite dans ce chantier : à refaire
dans le Chrome de l'éditeur avant « tu valides » selon le §2.0.1 si l'éditeur le souhaite).

## Requête tête « balkonkraftwerk rechner »

| # | Site | Type | Ce qu'il fait | Défaut constaté | Ce qu'on fait mieux |
|---|---|---|---|---|---|
| 1 | ankersolix.com (blog) | DÉFENDU, vendeur | Article-guide avec bannières produit | Page de vente, chiffres non sourcés | Aucun produit, chaque chiffre sourcé |
| 2 | homeandsmart.de (×8 URL quasi identiques) | CLONE, affiliation | Calculateur DWD par région, méthodes en 5 facteurs | Huit URL qui se répètent (« -0016- », « -0005- »…), liens « Zum Shop », hypothèse fixe de 50 % / 85 % d'autoconsommation, filtres de kits jusqu'à 4 000 W sans rappeler la limite de 2 000 Wp | Autoconsommation simulée sur 74 foyers réels (HTW Berlin) au quart d'heure, limite 2 000 Wp / 800 VA appliquée par le moteur |
| 3 | solakon.de | DÉFENDU, vendeur | Ertragsrechner de la marque | Conçu pour vendre ses kits | Neutre, aucun kit |
| 4 | nextpit.de | PRENABLE, média tech | Article, renvoie au simulateur HTW | Pas d'outil propre | Outil complet au premier écran |
| 5 | ergo.de | BLOQUÉ, assureur | Calculateur simple + rappel MaStR | Rayonnement générique, pas de code postal | Rendement PVGIS au code postal |
| 6 | co2online.de | BLOQUÉ, association financée par l'État | Calculateur sans pub ni données perso | Aucune source de rayonnement ni méthode d'autoconsommation affichée, rien sur le Solarspitzengesetz ni sur 2 000 Wp, pas de date | Méthode publiée, sources datées, règles 2026 et projet EEG 2027 |

## « photovoltaik rechner » / « solarrechner »

| Site | Type | Défaut constaté | Ce qu'on fait mieux |
|---|---|---|---|
| enter.de/blog/solarrechner | DÉFENDU, installateur à leads | 7 étapes, puis « Jetzt PV-Angebot anfragen » ; rendement « 950 à 1 100 kWh/kWp » par Land | Résultat sans rien demander, rendement au code postal (838 nœuds PVGIS) |
| steuerschroeder.de (2 pages) | CLONE | Formule générale, rayonnement saisi à la main, pas de Solarspitzengesetz | Ertrag lu dans PVGIS, règle des 60 % et des prix négatifs appliquée |
| deutschland-rechner.de | CLONE | Barème à jour mais rayonnement par grande région (« Südwesten 1100 kWh/m² »), Solarspitzengesetz absent | Code postal, 60 % sans compteur intelligent, § 51 EEG |
| reduco.ai, clean-invoice.com | CLONE | clean-invoice démarre à 20 ct/kWh d'Einspeisevergütung (valeur fausse en 2026 : 7,70 ct) | Taux BNetzA du semestre de mise en service, téléchargés et testés |
| whk-controlling.de | PRENABLE | Fichier Excel à télécharger | Calcul en direct dans la page |
| elektronik-zeit.de | PRENABLE | Explique PVGIS sans l'intégrer | PVGIS intégré, sans aller sur le site de la JRC |

## « einspeisevergütung 2026 » / « balkonkraftwerk anmelden »

ADAC, t-online, Stuttgarter Zeitung (BLOQUÉ, médias) ; enpal.de, 1komma5.com, yello.de (DÉFENDU, vendeurs) ;
lexware.de, reduco.ai (articles). Défauts relevés : Enpal affiche 7,77 ct au lieu de 7,70 ct pour la Teileinspeisung
≤ 10 kWp ; plusieurs pages annoncent la période « 1er août 2026 au 31 janvier 2027 » alors que la BNetzA publie
« ab 1. August 2026 bis 31. Dezember 2026 » (l'EEG 2023 n'est applicable que jusqu'au 31 décembre 2026) ; aucun ne
calcule la rémunération selon la date de mise en service et la taille (taux mixtes au-delà de 10 kWp) ; l'ADAC cite
« jusqu'à 50 000 € d'amende » pour l'oubli du MaStR sans rappeler la sanction EEG chiffrée (§ 52 : 10 €/kW et mois,
ramenés à 2 € après régularisation).

## Verdict (§2.1, §2.4)

Volume > 300 000 avec CLONE et PRENABLE nombreux et au moins quatre indépendants dans le top 10 (homeandsmart,
steuerschroeder, deutschland-rechner, elektronik-zeit, reduco) : **GO, SERP non imprenable**. Les leads
(installateurs) tiennent le haut de « photovoltaik rechner » ; « balkonkraftwerk » est surtout informationnel et
commercial (kits), sans leads chers.

**La phrase de valeur ajoutée (§6.6)** : ce site fait mieux que le premier résultat parce qu'il donne la production
pour le code postal saisi (PVGIS de la Commission européenne, 838 points de grille, horizon compris), une
autoconsommation simulée au quart d'heure sur 74 foyers mesurés au lieu d'un pourcentage forfaitaire, les taux de la
BNetzA du semestre de mise en service, les règles 2026 (800 VA / 2 000 Wp, 60 % sans compteur intelligent, prix
négatifs) et le projet EEG 2027 séparément, sans jamais demander un e-mail, un téléphone ou une demande de devis.

**Défaut principal corrigé (§2.4)** : « Leads sans résultat » (enter.de, finanz.de) et « Faux ou périmé » (taux
erronés ou période fausse chez Enpal, clean-invoice ; rayonnement par région chez les clones).

**Actif de données (§2.2)** : grille PVGIS 838 nœuds × matrice d'orientation 28 régions × 81 couples
inclinaison/orientation ; 74 profils de charge réels × 20 formes de production simulés au quart d'heure ;
taux EEG par semestre ; comptages du Marktstammdatenregister par grande ville (Balkonkraftwerke, toits, orientation
des toits, stockage) ; heures de prix négatifs SMARD 2024-2026.

## Passe qualité du 2026-10-16 (brief BRIEF-QUALITE-2026-10-16)

- Relu à la source : § 8 Abs. 5a EEG (2 kW / 800 VA), § 52 EEG (10 €/kW et mois, 2 € après régularisation), § 5 Abs. 5 MaStRV (un mois), § 3 Nr. 72 EStG (30 kWp, 100 kWp), § 12 Abs. 3 UStG (30 kWp), BT-Drucksache 21/7867 du 07.09.2026 (transitions 50/25/7 kW, 36 mois, plafonnement 50 %, bonus 1,5 ct sur 48 mois, compteur intelligent dès 2 kW) : tout concorde.
- **Profils de charge** : aucun jeu officiel plus récent de foyers individuels ; le nouveau profil standard BDEW H25 (2025, données 2018/2019 de 62 gestionnaires) est un profil agrégé qui contient déjà de l'autoconsommation PV, donc impropre à simuler un foyer. Il sert désormais de contrôle : part 10 h - 16 h des jours ouvrés, HTW 2010 contre H25, écart ≤ 0,8 point d'avril à août (juin : 25,3 % contre 25,6 %), `scripts/data/compare-h25.py`, affiché sur la page méthode. Limite restante : pompes à chaleur et voitures électriques absentes des profils de 2010.
- Simulateur testé dans Playwright contre PVGIS appelé à la main : 900 Wp vertical Berlin 688 kWh (PVGIS 689), 2 000 Wp 35° Munich 2 274 kWh (PVGIS 2 274), 10 kWp Cologne 10 292 kWh (PVGIS 10 337 au point voisin) ; économies, vergütung (7,70 ct), amortissements recalculés à la main, au centime.
- Téléphone : listes « Neigung » et « Ausrichtung » sur toute la largeur sous 480 px (« 90° senkrecht » était tronqué), « Speicher : keiner ». Titres alignés sur « pv rechner » et « einspeisevergütung tabelle ».
- Contrôles et indexnow.sh repris de la trame corrigée (7147b55), contournement local check-nombres retiré ; `scripts/api-racines.txt` écarte les points d'appel PVGIS/Eurostat que check-sources lisait dans les réponses brutes de research/ (défaut de trame signalé).

# Seiten von Solarrechnen (solarrechnen.de) schreiben

Notice pour les agents qui écrivent des pages (Balkonkraftwerk, PV, Speicher, Recht, Städte ; de + en).
À lire avec `~/Documents/GitHub/RECETTE-SITE.md` (§0, §6, §7, §9, §9.3, §11, §17.4, §21, §26).

## Principe : une page = un fichier

- `src/content/rechner/<id>.ts` : page outil (champ `tool`), modèle `src/content/rechner/photovoltaik-rechner.ts` ;
- `src/content/guides/<id>.ts` : guide (champ `mini` = mini-simulateur placé sous le titre), même structure, `mini` au lieu de `tool` ;
- `src/content/staedte/balkonkraftwerk-<stadt>.ts` : page ville (`tool: 'balkon'`, `toolPreset: { plz: '<plz>' }`).
Liste fermée des pages (id, dossier, slug de/en, outil ou mini, requête KP) : `tests/planned-ids.json`. Utiliser EXACTEMENT ces id, slugs, mini/tool.
Type : `src/lib/guide-types.ts`. Copier la **structure** du modèle, jamais ses phrases.

**Ne modifier aucun fichier du cœur** (`src/components`, `src/layouts`, `src/i18n`, `src/lib`, `src/pages`, `src/data`, `tests/pages.test.ts`, `scripts`). Si un mini-simulateur ou une donnée manque, le signaler dans le compte rendu au lieu de l'écrire.

## Données (jamais de chiffre en dur pour une valeur réglementaire ou mesurée)

- `P` (`src/data/params-2026.json` via `lib/fmt`) : règles (P.balkon.max_wp, P.mastr.frist_monate, P.solarspitzen…, P.steuer…, P.eeg2027…), et `P.sources` (clés de sources pour `sources: [...]` et `h.src('clé', 'texte')`).
- `EEG` (taux BNetzA par période), `AKTUELL`, `mischsatz(periode, kwp, 'teil'|'voll')`, `mastrZahlung` : `lib/engine/eeg.ts`.
- `STROMPREIS_CT`, `STROM`, `SMARD`, `SMARD_JAHR` : `lib/fmt` ou `lib/engine/params`.
- Moteur : `rechneBalkon({ ort, modulWp, wechselrichterVa, neigung, azimut, verschattung, speicherKwh, verbrauchKwh, preisCt, kostenEur })` (`lib/engine/balkon.ts`), `rechnePv({ ort, kwp, neigung, azimut, ostWest?, verbrauchKwh, speicherKwh, modus, smartMeter, inbetrieb?, preisCt, kostenEur, preisSteigerung? })` (`lib/engine/pv.ts`), `ortVonPlz('10115')` (`lib/engine/standort.ts`), `vergleich2027` (`lib/engine/eeg2027.ts`). `ort: null` = moyenne nationale.
- Villes : `src/data/staedte.json` (`staedte.<slug>` : name, plz, ew, ey [kWh/kWp 35° Süd PVGIS pour la PLZ], em [12 valeurs mensuelles du nœud], elev, balkon, gebaeude, speicher, voll, ausrichtung{N,NO,O,SO,S,SW,W,NW,OW,nachgefuehrt} ; `bund` = mêmes compteurs nationaux ; `source.mastr_retrieved_at`).
- Les exemples chiffrés se calculent en tête de fichier avec le moteur (voir le modèle), puis s'écrivent avec `DE.eur/num/pct/ct`, `EN.…` (resume, faqs, title) ou `h.eur/num/pct/ct/date/table/src/a` (body).
- Recherché et vérifié sur les textes : EEG 2023 complet `research/recht/eeg-2023-stand-2025-12-18.txt` ; projet EEG 2027 `research/recht/bt-drs-21-7867-eeg-2027-entwurf.txt` (Regierungsentwurf du 07.09.2026, PAS en vigueur : à présenter comme projet, jamais comme acquis). Toute règle énoncée doit être lue dans ces textes ou sur gesetze-im-internet.de. Un point incertain ne se publie pas.

Règles vérifiées utiles : Steckersolargerät ≤ 2 000 Wp et ≤ 800 VA (§ 8 Abs. 5a EEG), aucune notification au gestionnaire de réseau exigible ; enregistrement MaStR dans le mois (§ 5 Abs. 5 MaStRV) ; ancien compteur toléré jusqu'au remplacement, présomption d'exactitude (§ 10a Abs. 3 EEG) ; locataire : droit à l'autorisation (§ 554 BGB), copropriété § 20 Abs. 2 Nr. 5 WEG ; 60 % pour les installations < 100 kW en Einspeisevergütung sans Smart Meter mises en service à partir du 25.02.2025 (§ 9 Abs. 2 Nr. 2 b et 3, § 100 Abs. 3b), sauf Steckersolargeräte ; prix négatifs : § 51, exception < 100 kW jusqu'à la fin de l'année de pose du Smart Meter (§ 51 Abs. 2 Nr. 1), prolongation § 51a (facteur 0,5) ; Volleinspeisung : notification avant mise en service, puis avant le 1er décembre de l'année précédente (§ 48 Abs. 2a) ; § 52 : 10 €/kW/mois, 2 € après régularisation pour MaStR (Abs. 1 Nr. 11, Abs. 2, 3) ; § 3 Nr. 72 EStG : 30 kWp par unité, 100 kWp au total ; § 12 Abs. 3 UStG : 0 % jusqu'à 30 kWp (présomption) y compris stockage et installation. EEG 2023 applicable jusqu'au 31.12.2026 ; le projet EEG 2027 : suppression de la rémunération fixe pour nouvelles installations, Übergangszahlung = anzulegender Wert − 1 ct pendant 36 mois pour < 50 kW mis en service avant 2028, < 25 kW avant 2029, < 7 kW avant 2031 ; plafond 50 % permanent pour toitures < 100 kW ; Steckersolargeräte exclus de ces règles ; bonus de vente directe 1,5 ct pendant 48 mois.

## Règles d'écriture (contrôlées)

- **Snippets** : `title` 50 à 60 caractères, `description` 150 à 160, l'année 2026 dans les deux, terme-clé de la page en tête (jamais pays, « Rechner/Calculator », rubrique ou question en tête), uniques sur tout le site. Pas de tiret cadratin (—) ni de tiret demi-cadratin entouré d'espaces pour une incise.
- **intro** : une à deux phrases avec le chiffre clé (calculé). **resume** : UN paragraphe ≥ 120 mots, citable, avec les chiffres.
- **FAQ** : 4 à 8 questions (3 minimum sur page outil ou ville), réponses de 40 à 90 mots, complètes, chiffre + condition + source ; formulées comme on les pose ; une question ne doit exister qu'une fois sur tout le site : rendez-les spécifiques à la page (ville, cas, montant).
- **Longueur** (`resume` + FAQ + corps) : guide ≥ 1 100 mots (viser 1 300), outil ≥ 450 (viser 600), ville ≥ 650 (viser 800). Par langue.
- **Unicité** (§6, contrôle ≤ 30 % de similarité, chiffres neutralisés) : chaque page a son angle et son vocabulaire. Pages villes : angle propre (rang du rendement, part hiver, densité de Balkonkraftwerke par 1 000 habitants, orientation des toits du registre, particularité locale vérifiable : horizon, altitude, climat), structures de H2 différentes d'une ville à l'autre, jamais un gabarit à trous.
- `related` : ≥ 3 id de `planned-ids.json` ou `home`/`method`. `sources` : ≥ 2 clés de `P.sources` (ajout de source interdit : le signaler).
- Allemand correct avec umlauts, pas de numéros pointés, pas de style « gabarit IA » (§9 : pas de « Es ist wichtig zu beachten », pas d'enfilades de listes). Anglais : pour un expatrié vivant en Allemagne ; terme allemand entre parenthèses à la première occurrence ; montants en euros.
- **Aucun lead, aucun produit, aucune marque de kit, aucun lien vers un autre site du portefeuille.** Liens externes uniquement via `h.src`.
- Corps HTML : `<h2>`, `<h3>`, `<p>`, `<ul>`, tables via `h.table`. Un deuxième mini-simulateur peut être inséré avec `<!--mini:<kind>-->` (kinds existants : `ls src/lib/minis`).

## Contrôle de chaque fichier (obligatoire avant de rendre)

```bash
cd ~/Documents/GitHub/a-publier/Mottalib-10M/balkonkraftwerk-rechner
PAGE_FILES=<id1>,<id2> npx vitest run tests/pages.test.ts
```
Ne lancez PAS `npm run build` ni `astro build` (le chef de chantier construit ; plusieurs agents travaillent en parallèle). Ne lancez aucun serveur.

# Concept A · Compte à rebours 2046

*Prototype jetable, étape 4 (Concepts), expérience 002, cadre 1.2.0. Combinaison proposée par l'équipe rouge : la structure de la piste 5 (compte à rebours vers 2046) avec la grille des éditions de la piste 4, réduite aux éditions sourcées.*

## Idée

Le mur part de l'avenir que le Réseau a lui-même écrit, rembobine le temps jusqu'en avril 1976 en posant chaque édition sourcée au moment où la tête de lecture la franchit, puis rouvre les 20 années à venir et les remet au public. Le visiteur n'est pas seulement spectateur d'une frise : il écrit l'époque que les sources laissent vide, de 2027 à 2046.

## Lancer

Depuis `prototypes/` : `npx vite --port 5191 --strictPort`, puis :

- le mur : `http://localhost:5191/concept-a/` (`?scene=2` pour commencer à la scène 2) ;
- le formulaire : `http://localhost:5191/concept-a/?vue=formulaire`, ou le bouton « Ouvrir le formulaire » du mur, qui l'ouvre dans une fenêtre de la taille d'un téléphone.

Le formulaire et le mur se parlent par `BroadcastChannel`, sur le même portable, sans réseau (D-051). Commandes de démo (en bas à droite) : pause (aussi la barre d'espace), choix de scène, recadrage sur une moitié du mur (le 32:9 ne fait qu'environ 384 px de haut sur un portable), ouverture du formulaire et effacement des contributions de démo.

## Scènes (boucle d'environ 65 s)

| Scène | Plan | Ce qu'on voit | Faits |
| --- | --- | --- | --- |
| 1 · Compte à rebours | L'horizon déclaré (8 s) | Le compteur affiche 2046. Sur l'axe, les 50 années passées sont tassées à gauche et les 20 années à venir sont déployées. Quatre déclarations du Réseau sur son avenir, avec leur date d'écriture, la conférence de Vint Cerf rattachée à 2035, et la case 2046 marquée « Hypothèse · aucun fait » | F-078, F-079, F-081, F-080, F-031 |
| | Rembobiner (10 s) | L'axe se recalcule en échelle linéaire pendant que la tête de lecture recule de 2046 à 1976. Le compteur décompte les années. Chaque édition sourcée jaillit (ressort) quand la tête passe son année, reliée à son aplomb par un trait qui se dessine. 2019 est placée sans numéro, et 2020 apparaît comme une absence | F-031, F-057, F-028, F-054, F-026, F-025, F-024, F-022, F-001 |
| | Ce qui a changé (16 s) | Trois arcs tracés entre deux dates, un à la fois, avec leurs deux énoncés. Les cellules concernées s'allument | F-003 → F-016 ; F-001 → F-024 ; F-009 → F-027 |
| 2 · Les 20 ans qui restent | (30 s) | L'axe se redéploie. Chaque cellule d'édition se replie en un point posé sur son année. Les souhaits tombent dans les colonnes 2027-2046, avec un total et un décompte par catégorie. Un souhait à la fois grossit depuis son point, se lit, puis rentre dans sa colonne. Repère pour la relève, avec l'appel « un message à toi-même en 2046 » | F-067, F-031 (2035 sur l'axe) |

En-tête permanent : F-030 (la phrase seulement, sans le chiffre de 16 000). QR code toujours visible (maquette).

**Arrivée en direct.** Quand le formulaire envoie une contribution et qu'on simule l'approbation, le mur passe à la scène 2. La contribution part du QR code et décrit un arc jusqu'à sa place, marquée « Démo · saisi sur ce portable, effacé après la démo », puis rejoint sa colonne. Le total et le décompte par catégorie se mettent à jour. « Retirer ma contribution » l'enlève du mur.

## Faits utilisés

F-001, F-003, F-009, F-016, F-022, F-024, F-025, F-026, F-027, F-028, F-030, F-031, F-054, F-057, F-067, F-078, F-079, F-080, F-081. Les énoncés sont copiés par un script depuis `etape-3/faits-par-epoque.md` v0.2 (fichier `faits.js`), tels quels. Chaque élément qui affiche un fait porte `data-fait="F-xxx"` et montre son identifiant et sa date.

Respect des décisions :

- **D-055 :** aucun effectif (membres, contacts, bénévoles). La scène 4 de la piste 5 (« de 120 à 2 000 membres ») est remplacée par l'écart F-009 → F-027 (du premier courriel à l'Université Laval au virage numérique).
- **Numérotation :** seules les éditions dont le numéro est écrit dans une source sont numérotées : 1re, 40e, 42e à 45e, 47e. 2019 (F-024) est marquée « Numéro non écrit dans les sources », et 2020 (F-025) « Aucune édition cette année-là ».
- **F-076 :** n'est pas utilisé, puisqu'il est réservé à la démo.

## Capacité de bibliothèque au-delà du CSS (anime.js 4.5.0)

**Une timeline pilotée par les données, avec une reprojection d'échelle image par image.**

- **Temps calculé à partir des années.** Le rembobinage est une timeline anime.js qui interpole deux variables d'état : l'année de la tête de lecture, sur une courbe `inOutSine`, et le mélange `m` entre deux échelles de temps. L'échelle 1 est linéaire de 1976 à 2046. L'échelle 2 tasse le passé et déploie l'avenir. À chaque image, `onUpdate` recalcule la position de l'axe, des graduations et de la tête. Le moment où chaque cellule apparaît est calculé en inversant la courbe d'accélération pour l'année de l'édition (`acos(1 - 2p) / π`). Changer une date dans `donnees.js` déplace donc la cellule et son instant d'apparition. Le CSS ne sait ni interpoler entre deux échelles non linéaires ni caler des événements sur une courbe.
- **Ressorts physiques** (`spring()`) pour l'arrivée des cellules, la chute des souhaits et la vedette. Ils sont interruptibles, et la durée vient de la physique, pas d'une valeur fixe.
- **Morphing de mise en page :** une cellule de 700 × 470 px devient un point de 30 px posé sur son année dans l'autre échelle. Une vedette naît d'un point de 92 px et y retourne. L'arrivée en direct suit une trajectoire courbe, obtenue avec deux courbes différentes sur x et sur y.
- **Tracés SVG** (`svg.createDrawable`) : les traits de rappel et les arcs des écarts se dessinent.
- **Un seul moteur :** `engine.pause()` fige d'un coup les timelines, les vedettes et les compteurs. C'est ce qui rend la pause WCAG 2.2.2 fiable.

Motion 14.0.0 n'est pas utilisé dans ce concept.

## Accessibilité

- Bouton pause toujours visible, et barre d'espace (WCAG 2.2.2). Le script de capture vérifie que deux captures prises à 1,2 s d'écart sont identiques pendant la pause.
- `prefers-reduced-motion` : toutes les durées passent à 0, ressorts compris (`ressort()` renvoie `{ ease: 'linear', duration: 0 }`, voir itération 2). Le rembobinage est remplacé par l'état final (1976, toutes les cellules visibles, « de 2046 à 1976 »). Les scènes changent sans mouvement et restent pausables (capture `mur-10-mouvement-reduit`).
- Pas de flash : fond sombre constant et fondus d'au moins 250 ms. Les chiffres qui changent (compteur, tête de lecture) changent au plus 2 fois par seconde, et le compteur de la vedette passe par un fondu (voir itération 2). Pas de son.
- Contraste AA : texte secondaire #bcc3d8 sur #0a0f1f (environ 11:1), et #4a5068 sur #f7f5f0 dans le formulaire (environ 7:1). Les catégories se distinguent aussi par leur forme (rond, losange, carré, triangle), pas seulement par leur couleur.
- Formulaire :
  - champs étiquetés, avec un `fieldset` et une `legend` pour le choix fermé ;
  - erreurs listées dans une zone `role="alert"`, champs en `aria-invalid` et focus sur le premier champ fautif ;
  - cibles d'au moins 44 px ;
  - version anglaise par un bouton de langue ;
  - consentement case par case : affichage (obligatoire), 14 ans ou plus (obligatoire, Loi 25), capsule (facultative et sans effet au palier 1).

## Ce qui est simulé

- **22 souhaits « exemple »** (`EXEMPLES` dans `donnees.js`) : des souhaits génériques pour l'avenir. Aucun souvenir, aucun événement réel, aucune personne nommée. Sur le mur, ils sont dessinés en forme évidée, et leur vedette, au contour pointillé, porte l'étiquette « Exemple simulé ».
- **La modération :** un bouton « Simuler l'approbation du modérateur (démo) » dans le formulaire.
- **Le QR code :** un motif dessiné, qui n'encode rien.
- **La capsule de 2046 :** une case « Hypothèse · aucun fait ». La case « capsule » du formulaire ne conserve rien.
- **Les contributions saisies en démo :** gardées en mémoire dans la page du mur seulement, sans stockage. Elles disparaissent au rechargement ou avec « Effacer la démo ».

## Limites

- Les catégories du choix fermé (relève, rayonnement, régions, Internet de demain) sont une proposition de rédaction. Elles ne sont pas des faits et restent à valider.
- Les éditions récentes (2018-2026) sont serrées sur l'axe linéaire. Leurs cellules s'étalent vers la gauche avec des traits de rappel, et la lecture de ces traits reste à tester à distance (attente P3).
- Sur un portable, le mur entier fait environ 384 px de haut. Les textes de cellules sont petits, d'où le bouton « Recadrer ». Une capture à taille réelle (7680 × 2160) reste à faire.
- Le compteur respecte la règle des 3 changements par seconde (mesuré), mais n'a pas été analysé avec PEAT ou un équivalent.
- Le formulaire et le mur doivent être ouverts dans le même navigateur (BroadcastChannel). Aucun vrai téléphone n'est relié, conformément à D-051.
- Les commandes de démo recouvrent un coin du mur quand la fenêtre est exactement en 32:9. Elles s'estompent, sauf le bouton pause.
- Aucun visiteur n'a testé ce prototype (D-036).

## Corrections de l'itération 2

Constats de `etape-4/boucles/equipe-rouge-1.md` (v1.0). Preuves : sortie de `node concept-a/capture.cjs` le 2026-10-21 (serveur `npx vite --port 5191 --strictPort`, Chromium local), console sans erreur ni avertissement, aucune requête hors `localhost:5191`.

| Constat | Correctif | Preuve |
| --- | --- | --- |
| A-1 · une contribution retirée réapparaît en vedette | `montrerVedette` ne montre plus une contribution absente de `etat.contribs` ; `cacherVedette` ne la range plus ; `retirer` efface aussitôt la vedette en cours (`etat.vedette`) (`mur.js`) | Deux essais ajoutés à `capture.cjs` : retrait 1 s après l'approbation (le cas de l'équipe rouge) et retrait pendant la vedette, puis relevé du texte du mur toutes les 250 ms pendant 24 s : phrase revue 0 fois dans les deux cas. Capture `concept-a-mur-11-retrait-pendant-vedette.png` |
| A-2 · mouvement réduit incomplet (durée par défaut de 1 000 ms) | `ressort()` renvoie `{ ease, duration }` et s'étale dans les paramètres (`...ressort()`) ; en mouvement réduit, `duration: 0` | Essai ajouté (`reducedMotion: 'reduce'`) : positions relevées à deux instants, aux moments cités par l'équipe rouge. `.carte-horizon` (0,62 → 1,54 s), `#cerf`, `#releve`, premier `.point` (3,05 → 4,08 s) et `#vedette` : immobiles |
| A-3 · compteur à environ 7 changements par seconde (WCAG 2.3.1) | Rembobinage : l'année affichée (compteur et tête de lecture) est celle de la tête à des instants espacés de 600 ms du temps de l'animation (`anneeAffichee`, 15 changements en 9 s ; figé en pause). Vedette : fondu (250 ms puis 350 ms) vers l'année du souhait, au lieu du décompte 2026 → année. Total du bilan : affiché d'emblée, sans décompte | Essai ajouté : `MutationObserver` sur `#compteur-annee`, `#tete-annee` et `#total` pendant 36 s (rembobinage complet et trois vedettes) : au plus 2 changements dans toute fenêtre de 1 s (avant : environ 7). Pas d'analyse PEAT |
| A-4 · identité | « Proposition non officielle · prototype » dans le bandeau du mur (pastille pointillée à côté du nom) et sous l'en-tête du formulaire (en anglais : « Unofficial proposal · prototype ») | Captures `concept-a-mur-1-horizon.png`, `concept-a-formulaire-1-vide.png`, `concept-a-formulaire-6-anglais.png` |
| A-5 · lisibilité des F-xxx | `.fait-id` passe à `max(.8em, 32px)` (21 → 34 px dans les cellules, 25 → 32 px ailleurs) ; les dates des cellules étaient déjà à 34 px. Le bouton « Recadrer » reste l'outil de la démo | Capture `concept-a-mur-3-editions.png`. Le test P3 à distance réelle reste à faire |
| T-1 · information du consentement incomplète | Court avis avant les cases : qui recueille (le Réseau ACTION TI, hypothèse à confirmer, D-046), pourquoi, combien de temps (durée à confirmer), comment retirer. Après l'envoi, un code de retrait (`R-XXXX`) s'affiche, marqué simulé ; il reste sur le téléphone et n'est pas transmis au mur | Captures `concept-a-formulaire-3-rempli.png` (avis), `concept-a-formulaire-4-en-attente.png` et `-5-affichee.png` (code) |

Non corrigé à cette itération : la saisie du code de retrait après fermeture de la page (rien ne la reçoit au palier 1 : le code est seulement montré).

## Fichiers

`index.html`, `main.js` (aiguillage mur ou formulaire), `mur.js`, `formulaire.js`, `canal.js`, `donnees.js`, `faits.js` (généré), `style.css`, `capture.cjs` (captures et vidéo, `node concept-a/capture.cjs` depuis `prototypes/`). Les captures sont dans `/mnt/project-files/exp-002/etape-4/captures/concept-a-*`.

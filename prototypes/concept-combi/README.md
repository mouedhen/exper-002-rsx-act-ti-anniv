# Combinaison · Cinquante ans d'interfaces, à l'année du visiteur (prototype jetable)

*Expérience 002, étape 4 (Concepts), cadre 1.2.0. 4e prototype : la combinaison recommandée dans [concepts.md](/mnt/project-files/exp-002/etape-4/concepts.md) 0.1 et la combinaison n° 1 de [retour-simule-1.md](/mnt/project-files/exp-002/etape-4/boucles/retour-simule-1.md). Il répond aussi à l'évaluateur ([notes-evaluateur.md](/mnt/project-files/exp-002/etape-4/boucles/notes-evaluateur.md), C9 à 3 sur 5 : « terminal rétro, puis Web des débuts », « la recommandation n'a pas de prototype »). Les concepts A, B et C ne sont pas modifiés.*

## Idée

La base est C : chaque époque s'affiche dans un décor de l'informatique de son temps, stylisé et générique, et le fil « Aujourd'hui · 2026 » reçoit les mots du public. Ce que la combinaison change : **le visiteur choisit l'année de sa phrase** (repris de B), et c'est cette année qui décide du décor, pas le hasard de ce qui est affiché. Un vrai souvenir de 1985 s'imprime dans l'écran à caractères. Un souvenir de 2001 s'inscrit au livre d'or de la page web. Un souhait pour 2040 rejoint l'interface du futur. Un souvenir de 2009 à 2025 n'a pas de décor dans le prototype : il reste dans le fil « Aujourd'hui », marqué de son année (itération 2, M-4).

Il y a **trois décors, pas plus** :

| Décor | Années reçues | Faits |
| --- | --- | --- |
| 1 · l'écran à caractères (de C) | souvenirs de 1976 à 1990 | 1976-1985 |
| 2 · la page web (de C) | souvenirs de 1991 à 2008 | 1991-2008 |
| aucun · fil « Aujourd'hui » | souvenirs de 2009 à 2025, marqués de leur année | (pas de décor) |
| 3 · **l'interface du futur (nouveau)** | souhaits de 2027 à 2046 | le « futur d'hier » écrit par le Réseau en 2024-2025, et l'horizon 2035 |

**Pourquoi le futur comme 3e décor.** Le retour simulé demandait qu'un souhait pour 2040 aille « dans une interface du futur », et les 20 années à venir sont la moitié du récit du brief (2027-2046). Les époques de la messagerie (1987-1999) ou de la visioconférence (2021) auraient refait la même chose que les deux premiers décors : du texte d'époque qui s'imprime. Ce décor est le seul où le mouvement dit quelque chose que le texte ne dit pas. La phrase du visiteur se défait en lettres. Chaque lettre suit sa propre trajectoire jusqu'à l'horizon, puis la phrase se recompose et devient **un point posé à son année**, parmi les autres. Ce que l'on lit : « votre phrase rejoint les vingt années que le public est en train d'écrire ». Une tête de lecture balaie ensuite 2027 à 2046 et allume les points qu'elle franchit.

Le décor du futur reste générique : un fond de nuit, des lignes fines et une graduation. Il n'a ni verre dépoli, ni fenêtre, ni dock, ni code visuel d'un système d'exploitation ou d'une marque, et il est annoncé comme « Décor stylisé du futur : aucune interface réelle imitée ».

Le formulaire vient de A (FR/EN, choix fermé d'abord, phrase facultative, consentement case par case, case 14 ans, avis « Qui recueillerait », retrait par code avec réponse du mur). L'écran « Ce que ça demande au Réseau » vient de B. « Proposition non officielle · prototype » est visible dans toutes les vues.

## Lancer

Depuis `prototypes/` : `npx vite --port 5197 --strictPort` (jamais `--host`), puis :

- le mur : `http://localhost:5197/concept-combi/` (32:9, conçu pour 7680 × 2160, mis à l'échelle). Sous 1700 px de large, il s'ouvre **recadré sur les décors** ;
- le formulaire : `http://localhost:5197/concept-combi/?vue=formulaire` (360 px), ou le bouton « Formulaire (téléphone) » du mur, **dans le même navigateur** : la phrase passe par un `BroadcastChannel` local (D-051).

Paramètres et commandes (barre en bas à gauche, hors du mur) :

- **Pause** et barre d'espace ;
- décors **1976-1990 / 1991-2008 / 2027-2046** (`?scene=2`, `?scene=3`) ;
- **Vue** : mur entier, décors recadrés ou aujourd'hui recadré (`?recadre=mur|epoques|aujourdhui`) ;
- **Contenu** : 2 exemples (par défaut), **matin vide** (`?contenu=vide`), **80 simulées** (`?contenu=charge`) ;
- **Ce que ça demande au Réseau** (Échap ferme).

## Scènes

| Scène | Ce qui bouge | Faits (`data-fait`) |
| --- | --- | --- |
| 1 · 1976-1990 · écran à caractères | Les faits s'impriment au caractère (40 car./s). Un souvenir de cette période arrive en carte (ressort), puis se **réimprime au caractère** en ambre, avec « témoignage, pas un fait ». | F-001, F-002, F-003, F-033, F-007 |
| 2 · 1991-2008 · page web | La page se charge par blocs et le nom change sous les yeux (« Fédération de l'informatique du Québec » → « Réseau ACTION TI »). Un souvenir de 1991 à 2008 arrive au **livre d'or**. | F-034, F-010, F-012, F-014, F-016 |
| 3 · 2027-2046 · interface du futur | L'horizon se trace et les trois textes du « futur d'hier » montent. La tête de lecture balaie les 20 années, à 600 ms par année. Un souhait **vole lettre par lettre** jusqu'à la zone en vedette, puis un point naît à son année (ressort) et un trait le relie à la phrase. Avec plusieurs souhaits, la vedette change toutes les 6 s. | F-078, F-079, F-081 ; repère « Horizon 2035 » : F-031 |
| Toujours visible · Aujourd'hui · 2026 | Le fil du public (cartes FLIP à ressort). Chaque carte dit vers quel décor elle part (« Souvenir de 1985 → décor : l'écran à caractères »). Un souvenir de 2009 à 2025 y reste, avec son année en pastille (« 2019 Souvenir de 2019 → reste au fil : pas de décor pour 2009-2025 dans le prototype »). | F-031, F-030 |

Les décors tournent en boucle (1 → 2 → 3 → 1…) toutes les 24 s, futur compris et sans contribution, par un fondu de 1,6 s (0,6 s en mouvement réduit). À l'arrivée d'une phrase, le mur **va au décor de son année** : il l'affiche déjà complet, sans repasser par son introduction, puis y reste 14 s. Un changement de décor attend la fin du fondu en cours, puis 1 s de décor stable. Les arrivées passent une à la fois, dans l'ordre.

**État vide du matin (`?contenu=vide`).** Le mur n'a aucune contribution et aucun exemple, comme le 18 novembre à 8 h. Le fil dit : « Personne n'a encore écrit aujourd'hui. Votre phrase sera la première du mur ». Chaque décor montre sa propre invitation : « en attente d'un vrai souvenir de 1976 à 1990 », « Le livre d'or attend un vrai souvenir de 1991 à 2008 », « 20 années à écrire. Le premier souhait de la journée s'inscrira ici, à son année ». L'horizon vide est lui-même l'appel.

**Mur chargé (`?contenu=charge`).** 80 souhaits simulés, tous marqués, posés en 80 points sur l'horizon et empilés par année. Le fil ne garde que les cartes qui tiennent entières, suivies de « et 78 autres phrases au mur (exemples simulés) ». La vedette tourne toutes les 6 s. Le terminal et la page web restent en attente : aucun souvenir n'est simulé (voir « Ce qui est simulé »).

## Faits utilisés

15 faits, tous de `etape-3/faits-par-epoque.md` 0.2. **La date, l'énoncé et les sources sont recopiés par script** : `node concept-combi/extraire-faits.cjs` réécrit `faits-ref.js`, qu'on ne modifie pas à la main (même méthode que `concept-c/extraire-faits.cjs`). Chacun s'affiche avec sa source (`F-xxx · S-xxx`) :

- décor 1 : F-001, F-002, F-003, F-033, F-007 ;
- décor 2 : F-034, F-010, F-012, F-014, F-016 ;
- décor 3 : F-078 (2024), F-079 (2025), F-081 (2025), affichés « Écrit en 2024 » ou « Écrit en 2025 » (règle de rangement 1 du fichier : les déclarations sur l'avenir vont au futur, avec leur date d'écriture). F-031 sert aussi de repère « Horizon 2035 », le seul horizon daté du mur ;
- fil d'aujourd'hui : F-031, F-030.

F-001 et F-007 restent au niveau de preuve B* (l'écran le dit). F-014 est affiché sans mention, comme le demande le fichier.

Exclus : **tout effectif** (membres, contacts, bénévoles ; D-055), dont F-005, F-006, F-017 et F-041. F-009 est exclu aussi : l'adresse courriel de l'Université Laval n'est pas celle du Réseau. F-075 et F-076 ne sont pas utilisés. F-080 n'est pas affiché, pour garder trois cartes lisibles.

## Capacité de bibliothèque au-delà du CSS

1. **anime.js 4.5.0 : le vol lettre par lettre (décor 3).** À l'arrivée, le script mesure chaque caractère de la carte d'origine et chaque caractère de la phrase cible (`Range.getBoundingClientRect`), dans deux mises en page qui ne se connaissent qu'à l'exécution : la police, la taille et les retours à la ligne diffèrent. Il calcule pour chaque lettre une trajectoire en deux temps : une montée dont la hauteur dépend de sa place dans la phrase, puis une descente vers sa cible, avec un changement d'échelle de 58 à 104 px. Il décale ensuite les départs avec `stagger`. Le CSS ne peut ni mesurer des glyphes à l'exécution ni donner à 50 éléments 50 trajectoires calculées.
2. **anime.js : un fil de temps par décor.** L'impression au caractère, le chargement par blocs, l'horizon qui se trace et la tête de lecture qui balaie les années sont pilotés par un état et rejouables. Chaque décor peut aussi être **achevé d'un coup** (`seek` à la fin) quand une arrivée l'exige. `svg.createDrawable` trace le trait qui relie la phrase à son point.
3. **Motion 14.0.0 : ressorts interruptibles.** Le fil d'aujourd'hui se réordonne en FLIP à ressort. La carte d'un souvenir voyage, en ressort, entre deux parents dont les positions ne se connaissent qu'à l'exécution, jusqu'au décor de son année. Le point naît à son année avec un rebond.
4. **Un registre unique** garde toutes les animations en cours, anime.js et Motion, et chaque arrivée garde les siennes par identifiant. La pause les fige toutes, et un retrait arrête exactement celles de la phrase retirée, quel que soit le moment.

## Accessibilité

- **Pause (WCAG 2.2.2).** Le bouton et la barre d'espace figent les fils de temps, les voyages, le vol des lettres, la rotation et le changement de décor. Une phrase approuvée pendant la pause attend la reprise : le mur ne change pas, et le formulaire dit « Le mur est en pause : elle s'affichera à la reprise ». Un retrait s'applique tout de suite, même en pause.
- **`prefers-reduced-motion`.** Les décors s'affichent d'un bloc, avec tous leurs faits et leurs sources, sans impression ni balayage, même sans aucune arrivée (état final posé sans fil de temps). Une arrivée ne fait ni voyage ni vol de lettres : la phrase apparaît sur place par un fondu de 600 ms, et le point aussi. Le changement de décor reste un fondu d'opacité de 600 ms, jamais une coupe franche (constat C-8).
- **Compteurs (WCAG 2.3.1).** Le seul compteur animé est l'année de la tête de lecture : un pas toutes les 600 ms, soit 2 changements par seconde au plus. Si une arrivée achève le décor en plein balayage, le compteur s'efface, l'année finale est posée pendant qu'il est invisible, puis il revient. La ligne « et N autres phrases » ne change qu'à une arrivée ou à un retrait. Le curseur clignote à moins de 1 Hz. Il n'y a ni balayage ni scintillement d'écran ancien.
- **Pas de son.** Le contraste est AA. Le formulaire a des étiquettes, des légendes de groupe, des erreurs groupées et reliées aux champs (`aria-invalid`), et des états annoncés (`aria-live`). Ses cibles font 44 px. Il est en français et en anglais.
- **Hors ligne.** Polices système seulement, aucune image, police ni script venus d'Internet, `BroadcastChannel` seulement. `package.json` est inchangé ; seule l'entrée `combi` a été ajoutée à `vite.config.js`.
- **Lisible à 1366 px.** Le mur s'ouvre recadré sur les décors (échelle 0,267). Les énoncés y font de 17,6 à 27,7 px, les sources et légendes de 11,2 à 12,3 px.

## Ce qui est simulé

- **Les exemples** : 2 souhaits par défaut, 80 en mode chargé. Ce sont des souhaits génériques, marqués « Exemple simulé » sur chaque carte, « exemple simulé » dans chaque zone, et dessinés en point évidé (la légende le dit). **Aucun souvenir n'est simulé** : un faux témoignage daté passerait pour vrai. Le terminal et la page web n'affichent donc que des invitations, ou les phrases saisies pendant la démo.
- **La phrase saisie pendant la démo** est marquée « Contribution de démo, simulée · effacée après la démo » et dessinée en point plein. Elle est signée « un visiteur » et gardée en mémoire de page seulement.
- **La modération** : l'approbation est un bouton « Simuler l'approbation du modérateur (démo) ».
- **L'avis** (« Qui recueillerait : l'organisateur (à confirmer, par exemple le Réseau ACTION TI) ») et le **code de retrait** (`R-XXXX`) sont simulés. Le code vaut tant que le mur reste ouvert.
- **Le QR** est un motif de maquette ; il ne se scanne pas. Les **décors** sont stylisés.

## Limites

- **Trois décors seulement.** Les souvenirs de 2009 à 2025 n'ont pas de décor : ils restent dans le fil « Aujourd'hui », marqués de leur année, et le formulaire le dit avant l'envoi. C'est le choix par défaut de l'itération 2 (M-4, option 1 de l'équipe rouge) ; un 4e décor demanderait une décision, la recommandation en exclut un. Dans le fil, ces souvenirs sont poussés hors de vue par les arrivées suivantes, comme les autres cartes.
- **Le volume réel n'est vu que pour les souhaits.** Avec des dizaines de souvenirs, le terminal et le livre d'or ne montrent que le plus récent : il faudra une rotation comme celle du futur. Au-delà d'environ 12 souhaits pour une même année, la pile de points monterait jusqu'à la phrase en vedette (les 80 souhaits simulés en donnent 10 au plus pour une même année).
- **La file d'arrivées est séquentielle**, environ 6 à 8 s par phrase et 14 s de tenue. Dix phrases approuvées d'un coup mettraient deux minutes à toutes passer : il faudra regrouper au palier 2.
- **Le vol des lettres**, quand la carte d'origine est hors cadre (vue recadrée sur les décors, portable), part du bord visible du cadre, décalé d'un bloc : on ne voit pas la carte d'origine se défaire.
- **Le passage du terminal sombre à la page beige** reste un grand saut de luminance sur 4,9 m, même en fondu (limite héritée de C). Depuis l'itération 2, deux changements sont séparés d'au moins un fondu plus 1 s ; les fonds n'ont pas été rapprochés. Aucune analyse PEAT n'a été faite : à faire avant le mur.
- **Tailles au mur calculées**, pas mesurées à 4 m (P3). Testé dans Chromium seulement (Playwright), à 1920 × 540, 1366 × 768 et 360 × 780.
- `BroadcastChannel` ne relie que les onglets d'un même navigateur. Il n'y a ni page de modération, ni parcours d'accord parental (sous 14 ans, le formulaire renvoie à l'équipe du stand), ni capsule.
- Relu une fois par l'équipe rouge ([equipe-rouge-combi-1.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-combi-1.md)) ; les correctifs de l'itération 2 ne sont vérifiés que par les tests de leur auteur et attendent une relecture séparée.

## Vérification

`capture.cjs` (Playwright, Chromium local, serveur sur le port 5199 ; `PORT=` pour en changer) produit dans `/mnt/project-files/exp-002/etape-4/captures/` :

- les captures `concept-combi-*.png` : décors, souvenir 1985, souhait 2040 en vol puis posé, souvenir 2001, souvenir 2019 au fil, matin vide, 80 simulées, 1366 px (dont le vol depuis le bord), mouvement réduit (dont les trois décors sans arrivée), fin de chaque introduction en rotation, pause, retrait (dont le trait effacé), clôture, formulaire (vide, erreurs, envoyé, anglais, souvenir 2019, retrait par code), parcours ;
- la vidéo du mur `concept-combi-mur.webm` ;
- la vidéo `concept-combi-formulaire.webm`, où un cadre téléphone et le mur sont côte à côte : erreurs, saisie, approbation, arrivée sur l'horizon, retrait.

Il sort en erreur si un cas échoue. Depuis l'itération 2, les faits sont lus dans le **texte visible** (`.saisie`, `.morph`, éléments opaques, opacité de chaque source), jamais dans le texte caché `.sr`. Résultat du 2026-10-22 (itération 2) : **42 cas sur 42 OK** ; itération 3 : **45 cas sur 45 OK** (serveur sur le port 5201).

| Règle | Cas de test |
| --- | --- |
| Année → décor | souvenir 1985 → terminal ; souhait 2040 envoyé pendant le décor 2 → décor 3, point à 2040 ; souvenir 2001 → livre d'or |
| Faits par script, avec source | texte visible de chaque fait comparé au tableau relu par `lireReference` : date, énoncé entier, source visible ; les 15 présents (mouvement réduit, et fin de chaque introduction en mouvement normal) |
| D-055 | aucun « membre », « contact », « bénévole », « adhérent » ni effectif connu à l'écran (3 contenus, formulaire FR/EN, clôture) ni dans les sources |
| Hors ligne | aucune requête hors de localhost ; aucune URL externe ; 0 `@font-face` ; `package.json` inchangé |
| Simulés marqués | badges des cartes et méta des zones ; 80 sur 80 en mode chargé |
| Mention non officielle | visible (dans la fenêtre, non couverte) en mur entier, décors et aujourd'hui, à 1366 et 1920 px, au formulaire FR et EN, et dans la clôture |
| Pause 2.2.2 | espace et bouton ; captures identiques à 2,5 s, arrivée en file puis affichée à la reprise ; lettres figées en plein vol |
| Mouvement réduit | fondu de décor d'environ 500 ms (valeurs intermédiaires) ; arrivée sans lettre ni voyageur, par fondu |
| Compteurs 2.3.1 | `MutationObserver` sur `[data-compteur]` pendant 16 s : au plus 2 changements par fenêtre de 1 s |
| Pas de son | aucun `audio` ou `video`, aucun `AudioContext` |
| Retrait | en plein vol des lettres, pendant l'impression au terminal, en file de pause, par code depuis une page neuve (et code inconnu) ; rien ne réapparaît, aucune lettre ne reste |
| Recadré à 1366 px | vue par défaut sur les décors ; énoncés ≥ 16 px, sources ≥ 10 px dans les 3 décors |
| Formulaire de A | choix fermés avant la phrase, 2 cases distinctes, envoi bloqué sans l'âge, avis « Qui recueillerait », phrase facultative, anglais |
| Vide et chargé | 0 contribution et invitations ; 80 points, fil sans débordement, vedette qui tourne |
| Clôture de B | ouverte, 5 besoins, mention visible, Échap ferme |
| Console | aucune erreur ni avertissement |

## Corrections de l'itération 2

Constats de [equipe-rouge-combi-1.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-combi-1.md) (preuves dans `equipe-rouge-combi-1-preuves/`). Corrections au plus près de la correction proposée. Les concepts A, B et C et `package.json` ne sont pas modifiés. Les preuves sont les cas de `capture.cjs` (relancé le 2026-10-22, serveur sur le port 5199) et les captures `concept-combi-*` de `/mnt/project-files/exp-002/etape-4/captures/`, toutes refaites, vidéos comprises.

| Constat | Correctif | Preuve |
| --- | --- | --- |
| **M-1** · les décors ne tournaient qu'une fois ; le futur ne s'affichait jamais seul | `planifier` se replanifie dans son `onComplete` : `allerScene(...)` puis `planifier(DUREE_SCENE)`. Les trois décors tournent en boucle, sans contribution. | Cas « M-1 » : 80 s sans arrivée, en mouvement normal et réduit, « 24 s → 2 ; 48 s → 3 ; 72 s → 1 ». Captures `rotation-decor-3-faits-complets.png`, `mouvement-reduit-decor-3-sans-arrivee.png` |
| **M-2** · F-007 tronqué (« … visite la JI »), source « F-007 · S-004 » jamais visible, nom de F-016 tronqué, invite finale absente | `onUpdate` ne voit pas la dernière image : chaque fil de temps a un `onComplete` qui pose explicitement l'état final (`achever` : tous les caractères, toute la page, le nom entier, horizon et cartes) puis rend le décor. L'achèvement forcé par une arrivée passe par la même fonction. | Cas « M-2 » : texte **visible** relu juste avant la fin de chaque visite. Les 14 faits sont entiers, dont F-007 jusqu'au « Q » final, avec leurs 14 sources visibles, dont « F-007 · S-004 », et le nom « Réseau ACTION TI » entier. Capture `rotation-decor-1-faits-complets.png` |
| **M-3** · en mouvement réduit, les décors étaient vides sans arrivée | En mouvement réduit, il n'y a plus de fil de temps : `demarrerIntro` pose l'état final et rend le décor d'un bloc. | Cas « M-3 » : 2 s après chaque changement, sans arrivée, tous les faits, leurs sources et le nouveau nom sont visibles. Captures `mouvement-reduit-decor-1-sans-arrivee.png`, `-2-`, `-3-` |
| **M-4** · un souvenir de 2009-2025 s'inscrivait sur une page des années 1990 | **Choix par défaut** (option 1 de l'équipe rouge, sans 4e décor) : la page web ne reçoit que les souvenirs de **1991 à 2008**, avec le titre, le bouton et le livre d'or « 1991-2008 ». Un souvenir de 2009 à 2025 reste dans le fil « Aujourd'hui », marqué de son année en pastille : « 2019 Souvenir de 2019 → reste au fil : pas de décor pour 2009-2025 dans le prototype ». Le mur ne change pas de décor. Le formulaire le dit avant l'envoi (« Pas de décor pour 2009-2025 dans le prototype… ») et après (« elle s'affiche dans le fil « Aujourd'hui », marquée 2019 »), en français et en anglais. | Cas « M-4 » (2019 → fil, décor inchangé, aucun décor ne la montre) et « M-4 · borne 2008 → page web ». Captures `mur-11-souvenir-2019-fil-aujourdhui.png`, `formulaire-5-souvenir-2019.png` |
| **m-1** · le trait du point restait environ 4 s après le retrait | Le ressort du point et la timeline du trait sont gardés par identifiant (`trait`). Au retrait, ils sont arrêtés et `#lien-point` repasse à l'opacité 0. | Cas « m-1 » : retrait 0,7 s après la naissance du point, opacité du trait 1, puis 0 à 0,4 s, puis 0 à 1,9 s. Capture `retrait-trait-efface.png` |
| **m-2** · 3 changements du compteur en 1 s lors d'une arrivée en plein balayage | En achèvement forcé, la tête s'efface (0,3 s). L'année finale est posée pendant qu'elle est invisible, puis elle revient (0,7 s). | Cas « m-2 » : arrivée quand la tête était à 2031, au plus 2 changements **visibles** par fenêtre de 1 s, compteur final 2046 à l'opacité 1 |
| **m-3** · la pastille « Matin vide » restait après les arrivées | La pastille est retirée à la première arrivée. | Cas « m-3 » : présente avant, absente après la première arrivée |
| **m-4** · saut de luminance en environ 1 s en mouvement réduit | Une arrivée attend la fin du fondu en cours, puis 1 s de décor stable, avant de changer de décor. Les fonds n'ont pas été rapprochés et l'analyse PEAT reste à faire (voir Limites). | Cas « m-4 » : rotation vers la page claire et arrivée vers le terminal dans la même milliseconde : retour au sombre 1 587 ms plus tard (environ 400 ms avant le correctif) |
| **m-5** · à 1366 px, les lettres entraient par le bord de l'écran | Si la carte d'origine est hors cadre, les lettres partent du bord visible du cadre, décalées d'un bloc. | Cas « m-5 » : départ le plus à droite avant le bord visible. Capture `1366-vol-depuis-le-bord.png` |
| **m-6** · les tests lisaient le texte caché et laissaient passer M-1 à M-3 | `capture.cjs` lit le texte **visible** (`.saisie`, `.morph`, éléments opaques, opacité de chaque `.src`). Il ajoute un cas par constat : rotation sur 80 s, fin de chaque introduction, mouvement réduit sans arrivée, et les cas m-1 à m-5. | 42 cas sur 42 OK. Une relecture par un agent séparé reste à faire. |

Reste hors correctif : la vidéo et les captures sont faites dans Chromium seulement ; il n'y a pas d'analyse PEAT ; vite 8.3.2 n'a pas changé (N-7).

## Corrections de l'itération 3

Constats de [equipe-rouge-combi-2.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-combi-2.md). Correction minimale, dans `mur.js` seulement ; les concepts A, B et C et `package.json` ne sont pas modifiés. Un cas par constat dans `capture.cjs` (étape 12), sur le texte **visible** et la **position à l'écran**. `capture.cjs` relancé le 2026-10-22 (`PORT=5201`, Chromium local) : **45 cas sur 45 OK**. Toutes les captures `concept-combi-*` sont refaites, dont deux nouvelles.

| Constat | Correction | Preuve |
| --- | --- | --- |
| **N-1** (majeur) · à 1366 px, un souvenir de 2009-2025 n'apparaissait nulle part à l'écran | Dans `arriver`, cas sans décor (`k === 0`) : si la vue est recadrée sur les décors, le cadre passe à la vue « aujourd'hui » **avant** que la carte n'entre dans le fil. Il revient à la vue des décors 8 s après (`TENUE_FIL`, compté depuis le dernier souvenir de 2009-2025), ou tout de suite si une arrivée part vers un décor. Les deux coupes passent par la garde de luminance (`attendreFondu`, puis 1 s de stabilité) et la réarment. Si l'opérateur change de vue pendant ce temps, son choix prime : pas de retour automatique. La pause fige l'attente. | Cas « N-1 » : 1366 × 768, vue par défaut, souvenir de 2019 envoyé par le vrai formulaire, en mouvement normal et réduit. La vue passe de `epoques` à `aujourdhui`. Le texte visible de la carte, « 2019 Souvenir de 2019 → reste au fil… », est à x = 288-1081, y = 310-330 dans une fenêtre de 1366 × 768, et l'élément est au premier plan (`elementFromPoint`). Retour à `epoques` environ 7 s après la pose. Capture `1366-souvenir-2019-au-fil.png` (nouvelle) |
| **N-2** · le titre du fil contredisait l'exception ; un souvenir de 2009-2025 sorti du fil était compté « au mur » | Titre : « Vos mots arrivent ici, puis partent vers leur année (2009-2025 : ils restent ici) ». Le compteur sépare les deux cas : « et 2 autres phrases au mur (exemples simulés) ; 2 souvenirs de 2009-2025 déjà passés au fil ». Sans souvenir de 2009-2025 hors du fil, le texte est inchangé. | Cas « N-2 » : 1920 px, 4 souvenirs de 2009-2025 à la suite. Le titre et le compteur sont visibles et dans la fenêtre. Le compteur est égal au texte attendu, recalculé depuis l'état du mur. Capture `mur-12-fil-titre-et-compteur.png` (nouvelle) |
| **N-3** · les boutons de décor contournaient la garde du m-4 | Un clic attend `attendreFondu()` (fin du fondu, puis 1 s de décor stable). Les clics reçus pendant l'attente sont regroupés : seul le dernier décor demandé est affiché. | Cas « N-3 » : 12 clics en 3 s sur « 1991-2008 » et « 1976-1990 », en mouvement réduit. L'opacité du décor 2 passe 0,5 à 558 et 2 291 ms seulement, soit au plus 1 changement brusque par fenêtre de 1 s (6 passages en 1,6 s avant le correctif) |

Reste hors correctif : Chromium seulement, pas d'analyse PEAT, vite 8.3.2 inchangé. La coupe de cadre de N-1 est franche, sans travelling. Elle compte comme un changement brusque dans la garde de luminance.

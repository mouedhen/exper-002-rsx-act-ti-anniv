# Concept C · Cinquante ans d'interfaces (prototype jetable)

*Expérience 002, étape 4 (Concepts), cadre 1.2.0. Concept ambitieux exigé par le cadre, tiré de la piste 6 (etape-3/pistes-recit.md 0.3), classée 5e par l'auteur et par l'équipe rouge, surtout pour sa faisabilité. Le prototype doit montrer qu'une ou deux scènes tiennent ; il ne montre pas les cinq.*

## Idée

Chaque époque du Réseau s'affiche dans l'interface de l'informatique de son temps : l'écran à caractères pour 1976-1986, le Web des débuts pour 1991-2008. Une association des TI raconte son histoire avec les outils de son métier : la forme est l'argument. À droite du mur, en permanence, l'interface d'aujourd'hui (2026) reçoit les mots du public. Chaque mot validé quitte ensuite le fil d'aujourd'hui et va se reformater dans le décor de l'époque affichée. Le visiteur voit sa phrase de 2026 « vieillir » dans un terminal ou dans une page web de l'an 2000.

Les décors sont **stylisés et annoncés comme tels** (« Décor stylisé : aucun écran d'époque reproduit »). Aucun en-tête, expéditeur, logo ni écran n'est attribué à une institution ou à un fabricant réel. Seuls des codes visuels génériques sont utilisés : texte ambre à chasse fixe, fenêtre beige en relief à barre de titre unie, liens bleus soulignés, bandeau « en construction ». Le mur et le formulaire portent « Proposition non officielle · prototype ».

## Lancer

Depuis `prototypes/` : `npx vite --port 5193 --strictPort`, puis :

- le mur : `http://localhost:5193/concept-c/` (32:9, conçu pour 7680 × 2160, mis à l'échelle dans la fenêtre) ;
- le formulaire : `http://localhost:5193/concept-c/?vue=formulaire` (conçu pour 360 px), ou le bouton « Formulaire (téléphone) » du mur. On l'ouvre **sur le même portable**, dans le même navigateur. La phrase passe par un `BroadcastChannel` local, sans réseau (D-051).

Commandes de démo (en bas à gauche, hors du mur) : **Pause** (et barre d'espace), sélecteur **Scène 1 / Scène 2**, **Vue** (mur entier, époques recadrées, aujourd'hui recadré ; aussi `?recadre=epoques` ou `?recadre=aujourdhui`), lien vers le formulaire.

## Scènes

| Scène | Interface | Ce qui bouge | Faits (attribut `data-fait`) |
| --- | --- | --- | --- |
| 1 · 1976-1986 | Écran à caractères ambre | Les faits s'impriment au caractère près (40 car./s), un curseur attend en fin de liste ; la source s'affiche quand la ligne est complète | F-001, F-002, F-003, F-033, F-007 |
| 2 · 1991-2008 | Navigateur des débuts, page beige | La page se charge par blocs, la barre d'état progresse, puis le nom change sous les yeux : « Fédération de l'informatique du Québec » s'efface et « Réseau ACTION TI » s'écrit | F-034, F-010, F-012, F-014, F-016 |
| Toujours visible · 2026 | Interface actuelle (cartes, mode sombre) | Le fil du public, modéré avant affichage ; appel à contribuer avec un QR de maquette | F-031, F-030 |

Boucle de 49,6 s : scène 1 (24 s), fondu de 1,6 s (0,6 s en mouvement réduit), scène 2 (24 s), fondu de retour.

## Faits utilisés

Tous viennent de `etape-3/faits-par-epoque.md` (0.2) : **date, énoncé et sources recopiés par script** (`node concept-c/extraire-faits.cjs` réécrit `faits-ref.js` ; ne pas le modifier à la main), affichés (`F-xxx · S-xxx`) : F-001, F-002, F-003, F-033, F-007 ; F-034, F-010, F-012, F-014, F-016 ; F-031, F-030 (« 2026 (page non datée) » garde sa date). F-001 et F-007 sont au niveau de preuve B* : l'écran le dit. F-014 est affiché sans mention, comme le demande le fichier.

Exclus volontairement :
- **tout effectif** (membres, contacts, bénévoles), dont F-005, F-006 et F-017 (D-055) ;
- **F-009** : l'adresse courriel de 1988 est celle de l'Université Laval, pas celle du Réseau. Elle aurait invité un faux « courriel d'époque » ; elle n'apparaît pas.

## Capacité de bibliothèque au-delà du CSS

1. **anime.js 4.5.0 : un seul fil de temps (`createTimeline`) pilote toute la boucle.** Il gère l'impression des faits au caractère près, le chargement de la page par blocs, l'effacement puis la réécriture du nom et le fondu entre interfaces. Le fil se met en **pause**, **reprend** et **saute à une scène** (`seek` sur des étiquettes `scene1` et `scene2`), et tout l'état se recalcule à l'instant visé. Le CSS ne sait ni écrire un texte variable caractère par caractère, ni enchaîner des séquences dépendantes puis les mettre en pause ou y sauter de façon cohérente.
2. **Motion 14.0.0 : la phrase du public voyage d'une interface à l'autre.** Les cartes du fil d'aujourd'hui glissent de leur ancienne place à la nouvelle (FLIP à ressort) quand une contribution arrive en tête. La phrase quitte ensuite sa carte et rejoint, en ressort, la zone « message du public » du décor affiché. Pendant le voyage, sa largeur change et le texte se recompose ; à l'arrivée, elle prend la typographie de l'époque. Le CSS ne peut pas animer un élément entre deux parents dont les positions ne se connaissent qu'à l'exécution, ni produire un ressort interruptible. Les animations Motion en cours se mettent aussi en pause avec le bouton.

## Accessibilité

- **Pause** visible et barre d'espace (WCAG 2.2.2) : elle arrête le fil de temps, les voyages Motion et le curseur clignotant. Une contribution approuvée pendant la pause attend la reprise (le statut le dit) ; un retrait, lui, s'applique tout de suite.
- **`prefers-reduced-motion`** : les mêmes scènes s'affichent d'un bloc, en états fixes, sans impression, sans voyage ni clignotement. Le passage d'une scène à l'autre, toutes les 24 s, reste un fondu d'opacité de 0,6 s (aucun déplacement), pour éviter une coupe franche du sombre au clair.
- **Aucun flash** : pas de balayage ni de scintillement d'écran ancien ; les lignes de balayage sont fixes et très faibles. Le curseur clignote à moins de 1 Hz. Le passage du terminal sombre à la page beige se fait par un fondu de 1,6 s (0,6 s en mouvement réduit), jamais par un saut.
- **Pas de son.** **Contraste AA** sur le mur et le formulaire. Le formulaire a des étiquettes, une légende de groupe, des erreurs liées au champ (`aria-invalid`, `aria-errormessage`), un compteur et un état annoncés (`aria-live`) et des cibles de 44 px au moins. Les lignes imprimées ont leur texte complet en `.sr` pour les lecteurs d'écran.
- **Hors ligne** : polices système seulement, aucune image, police ni script venus d'Internet. Le script de capture le vérifie.

## Ce qui est simulé

- **Deux exemples** de souhaits et d'idées, génériques, marqués « Exemple simulé ». Ce ne sont jamais des souvenirs d'un événement réel.
- La **phrase saisie pendant la démo** est marquée « Contribution de démo, simulée · effacée après la démo ». Elle n'est enregistrée nulle part (mémoire de la page seulement). Chaque phrase envoyée a son bouton de retrait et un **code de retrait** (`C-XXXX`), utilisable depuis une page de formulaire neuve. Elle est signée « un visiteur », sauf si la personne coche « Afficher mon prénom ».
- L'**avis** du formulaire (qui recueille, pourquoi, combien de temps, comment retirer) est simulé ; le responsable « Réseau ACTION TI » est une hypothèse à confirmer (D-046).
- La **modération** : la phrase passe « en attente de validation », puis elle est approuvée automatiquement après 1,5 s. Au palier 2, une personne du Réseau validerait chaque phrase.
- Le **QR** est un motif de maquette : il ne se scanne pas.
- Les **décors** sont stylisés : la « barre d'adresse » dit « décor stylisé », aucune page ni aucun écran d'époque n'est reproduit.

## Limites

- **Deux époques sur cinq.** La piste prévoit aussi la messagerie (1987-1999), la visioconférence (2021) et la conversation (2026). Chacune est un système visuel de plus à réussir et à tester par Chams seul : le risque de faisabilité reste entier pour les trois autres.
- **Le passage du sombre au clair** (terminal, puis page beige) change beaucoup la luminance sur 4,9 m, même en 1,6 s. Sur le mur réel, il faudra le mesurer ou garder des fonds proches.
- **Lisibilité sur portable** : le mur entier réduit à 1366 px de large fait environ 384 px de haut ; les sources (`F-xxx · S-xxx`) y font 5,7 px. Les vues recadrées les portent à 10,7 px (époques) et 11,4 px (aujourd'hui) : lisibles de près, pas confortables. Au mur réel, rien ne change (test P3 à faire).
- **Le voyage de la phrase** vise toujours la scène affichée ; si une scène change pendant le voyage, la phrase atterrit dans un décor qui s'efface.
- Aucun **anglais** (la contribution bilingue du brief n'est pas faite). Aucun écran « ce que ça demande au Réseau ». Aucune page de modération.
- `BroadcastChannel` ne relie que des onglets du **même navigateur** ; le formulaire ouvert dans un autre navigateur n'atteint pas le mur.
- Testé seulement dans Chromium (Playwright), à 1920 × 540, 1366 × 768 et 360 × 780.
- Le **code de retrait** ne fonctionne que tant que le mur reste ouvert (mémoire de la page) ; au palier 2, il faudrait un registre côté modération.
- Il n'y a pas de parcours d'**accord parental** : sous 14 ans, le formulaire renvoie vers l'équipe du stand.

## Vérification

`capture.cjs` (Playwright, Chromium local, serveur sur le port 5193) produit, dans `/mnt/project-files/exp-002/etape-4/captures/` : `concept-c-mur-scene1-impression.png`, `concept-c-mur-scene1-contribution.png`, `concept-c-mur-scene1.png`, `concept-c-mur-scene2-web.png`, `concept-c-mur-mouvement-reduit.png`, `concept-c-mur-retrait-pendant-voyage.png`, `concept-c-mur-1366-recadre-epoques.png`, `concept-c-mur-1366-recadre-aujourdhui.png`, `concept-c-formulaire.png`, `concept-c-formulaire-erreurs.png`, `concept-c-formulaire-envoye.png`, `concept-c-formulaire-retraits.png` et la vidéo `concept-c-mur.webm`. Il exécute aussi un cas de test par constat (ci-dessous), vérifie la pause à la barre d'espace, l'absence d'erreur et d'avertissement dans la console et l'absence de toute requête hors de `localhost:5193`, et sort en erreur si un cas échoue.

## Corrections de l'itération 2

Constats de l'[équipe rouge 1](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-1.md). Preuves : sortie de `capture.cjs` du 2026-10-21 (13 cas sur 13 « OK ») et captures nommées.

| Constat | Correctif | Preuve |
| --- | --- | --- |
| C-1 · retrait pendant le voyage | `mur.js` garde chaque voyage par identifiant (`voyages`) ; `retirer` arrête les animations Motion, retire le voyageur, remet la zone d'arrivée et n'écrit jamais le texte final (`voyage.annule`). | Retrait 0,3 s après la validation ; 5 s plus tard : phrase visible non, prénom visible non, voyageurs restants 0. `concept-c-mur-retrait-pendant-voyage.png` |
| C-2 · consentement groupé | Trois cases distinctes : affichage (obligatoire), « J'ai 14 ans ou plus » (obligatoire, avec une aide pour les moins de 14 ans), « Afficher mon prénom » (facultative). Le retrait est une information de l'avis, plus une case. | Sans l'âge : envoi bloqué, erreur affichée ; sans l'affichage : idem ; aucune case ne parle du retrait. `concept-c-formulaire-erreurs.png` |
| C-3 · prénom sans accord | Le champ prénom n'apparaît qu'avec la case « Afficher mon prénom » ; sans elle, rien n'est envoyé et le mur signe « un visiteur » (au lieu de « Anonyme »). | Sans la case : signature envoyée vide, affichée « un visiteur » ; avec la case : « Zoé ». |
| C-4 · sources incomplètes | `extraire-faits.cjs` recopie date, énoncé et sources des 12 faits depuis `faits-par-epoque.md` dans `faits-ref.js` ; `faits.js` ne contient plus aucun texte de fait. | Le test relit le tableau de référence : 12 faits, date, énoncé et sources identiques ; F-003 « S-001, S-006, S-011, S-018 », F-016 « S-001, S-005, S-006, S-018 ». |
| C-5 · décor proche de Windows 9x | Barre de titre unie brun foncé (plus de dégradé #000080), fenêtre beige (#e4dccb) aux reliefs adoucis, fond de scène brun-gris (#34302b, plus de sarcelle), trois boutons de fenêtre retirés, barre de progression pleine (plus de blocs bleus), nom en brun-rouge. | 0 élément en #000080, fond rgb(52, 48, 43), 0 bouton de fenêtre, aucun dégradé de titre. `concept-c-mur-scene2-web.png` |
| C-6 · arrivée pendant la pause | Une contribution reçue en pause va dans une file ; le statut dit « 1 contribution approuvée attend la reprise » ; la file se vide à la reprise. Un retrait s'applique tout de suite, même en pause (et retire une phrase encore en file). | Captures du mur (barre de commandes masquée) avant et après l'arrivée identiques ; 1 en file ; affichée après la reprise. |
| C-7 · lisibilité sur portable | Bouton « Vue » et paramètre `?recadre=` : mur entier, époques (× 1,5) ou aujourd'hui (× 2). | À 1366 × 768, plus petit texte de source : 5,7 px (mur entier), 10,7 px (époques), 11,4 px (aujourd'hui). `concept-c-mur-1366-recadre-epoques.png`, `concept-c-mur-1366-recadre-aujourdhui.png` |
| C-8 · coupe franche en mouvement réduit | En mouvement réduit, le passage entre scènes est un fondu d'opacité de 600 ms (au lieu de 1 ms), sans déplacement. | Opacité de la page mesurée de 0 à 1 en 583 ms. `concept-c-mur-mouvement-reduit.png` |
| C-9 · retrait après une deuxième phrase | Le formulaire garde la liste des phrases envoyées, chacune avec son code et son bouton « Retirer cette phrase du mur ». | Deux phrases envoyées ; la première retirée, la deuxième toujours au mur. `concept-c-formulaire-retraits.png` |
| T-1 · information incomplète | Avis court et marqué simulé : qui recueille (« le Réseau ACTION TI (hypothèse, à confirmer) »), pourquoi, combien de temps, comment retirer. Code de retrait affiché après l'envoi, utilisable depuis une page neuve (« Retirer une phrase avec son code »). « Proposition non officielle · prototype » au formulaire et au mur. | Avis complet, mention présente aux deux endroits, code affiché ; retrait par ce code depuis une page de formulaire neuve : oui. `concept-c-formulaire.png` |

Reste ouvert : l'accord parental (pas de parcours sous 14 ans), la durée réelle d'affichage et le responsable, à fixer avec le Réseau (D-046) ; un code de retrait qui survive à la fermeture du mur demande un registre (palier 2).

## Corrections de l'itération 3

*2026-10-21, d'après [equipe-rouge-2.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-2.md). Preuves : sortie de `PORT=5195 node concept-c/capture.cjs` (serveur `npx vite --port 5195 --strictPort` ; sans `PORT`, le script garde le port 5193 documenté), 18 cas sur 18 « OK » (13 de l’itération 2, 5 nouveaux), console sans erreur ni avertissement, aucune requête hors de localhost. `package.json` et les dépendances sont inchangés (N-7 laissé à la décision de Chams).*

| Constat | Correctif | Preuve |
| --- | --- | --- |
| N-2 · fausse confirmation de retrait | Le mur répond à chaque message `retrait` : `retiree` (la phrase était au mur, en voyage ou en file de pause) ou `inconnu`. Le formulaire n'écrit « retirée » qu'à la réponse `retiree` (« Retrait confirmé par le mur (C-XXXX). ») ; sur `inconnu` : « Aucune phrase ne porte le code C-XXXX sur le mur. » ; sans réponse en 3 s : « Le mur n'a pas répondu ». | `mur.js`, `retirer()` ; `formulaire.js`, `surReponse()`. Essais : C-ZZZZ → « Aucune phrase ne porte le code C-ZZZZ sur le mur. », aucun « retirée » ; code réel saisi sur une page neuve → réponse `retiree`, « Retrait confirmé par le mur », phrase retirée. |
| N-3 · promesse trop large du code | « … même après avoir fermé cette page (démo : tant que le mur reste ouvert). » | Texte lu après l'envoi. `concept-c-formulaire-retraits.png` |
| N-5 · l'avis nomme le Réseau | « Qui recueillerait : l'organisateur (à confirmer, par exemple le Réseau ACTION TI). Ici, personne : c'est une démo hors ligne. » | Avis lu à l'exécution. `concept-c-formulaire.png` |
| N-6 · mention hors cadre en vue « époques » | « Proposition non officielle · prototype » ajoutée à la barre de commandes (hors du mur, toujours dans la fenêtre). | À 1366 × 768, mention dans la fenêtre en mur entier, époques et aujourd'hui. `concept-c-mur-1366-recadre-epoques.png` |


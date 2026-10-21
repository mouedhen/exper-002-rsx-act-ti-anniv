# Concept C · Cinquante ans d'interfaces (prototype jetable)

*Expérience 002, étape 4 (Concepts), cadre 1.2.0. Concept ambitieux exigé par le cadre, tiré de la piste 6 (etape-3/pistes-recit.md 0.3), classée 5e par l'auteur et par l'équipe rouge, surtout pour sa faisabilité. Le prototype doit montrer qu'une ou deux scènes tiennent ; il ne montre pas les cinq.*

## Idée

Chaque époque du Réseau s'affiche dans l'interface de l'informatique de son temps : l'écran à caractères pour 1976-1986, le Web des débuts pour 1991-2008. Une association des TI raconte son histoire avec les outils de son métier : la forme est l'argument. À droite du mur, en permanence, l'interface d'aujourd'hui (2026) reçoit les mots du public. Chaque mot validé quitte ensuite le fil d'aujourd'hui et va se reformater dans le décor de l'époque affichée. Le visiteur voit sa phrase de 2026 « vieillir » dans un terminal ou dans une page web de l'an 2000.

Les décors sont **stylisés et annoncés comme tels** (« Décor stylisé : aucun écran d'époque reproduit »). Aucun en-tête, expéditeur, logo ni écran n'est attribué à une institution ou à un fabricant réel. Seuls des codes visuels génériques sont utilisés : texte ambre à chasse fixe, fenêtre grise en relief, liens bleus soulignés, bandeau « en construction ».

## Lancer

Depuis `prototypes/` : `npx vite --port 5176 --strictPort`, puis :

- le mur : `http://localhost:5176/concept-c/` (32:9, conçu pour 7680 × 2160, mis à l'échelle dans la fenêtre) ;
- le formulaire : `http://localhost:5176/concept-c/?vue=formulaire` (conçu pour 360 px), ou le bouton « Formulaire (téléphone) » du mur. On l'ouvre **sur le même portable**, dans le même navigateur. La phrase passe par un `BroadcastChannel` local, sans réseau (D-051).

Commandes de démo (en bas à gauche, hors du mur) : **Pause** (et barre d'espace), sélecteur **Scène 1 / Scène 2**, lien vers le formulaire.

## Scènes

| Scène | Interface | Ce qui bouge | Faits (attribut `data-fait`) |
| --- | --- | --- | --- |
| 1 · 1976-1986 | Écran à caractères ambre | Les faits s'impriment au caractère près (40 car./s), un curseur attend en fin de liste ; la source s'affiche quand la ligne est complète | F-001, F-002, F-003, F-033, F-007 |
| 2 · 1991-2008 | Navigateur des débuts, page grise | La page se charge par blocs, la barre d'état progresse, puis le nom change sous les yeux : « Fédération de l'informatique du Québec » s'efface et « Réseau ACTION TI » s'écrit | F-034, F-010, F-012, F-014, F-016 |
| Toujours visible · 2026 | Interface actuelle (cartes, mode sombre) | Le fil du public, modéré avant affichage ; appel à contribuer avec un QR de maquette | F-031, F-030 |

Boucle de 49,6 s : scène 1 (24 s), fondu de 1,6 s, scène 2 (24 s), fondu de retour.

## Faits utilisés

Tous viennent de `etape-3/faits-par-epoque.md` (0.2), **énoncé repris tel quel**, avec date et sources affichées (`F-xxx · S-xxx`) : F-001, F-002, F-003, F-033, F-007 ; F-034, F-010, F-012, F-014, F-016 ; F-031, F-030 (« 2026 (page non datée) » garde sa date). F-001 et F-007 sont au niveau de preuve B* : l'écran le dit. F-014 est affiché sans mention, comme le demande le fichier.

Exclus volontairement :
- **tout effectif** (membres, contacts, bénévoles), dont F-005, F-006 et F-017 (D-055) ;
- **F-009** : l'adresse courriel de 1988 est celle de l'Université Laval, pas celle du Réseau. Elle aurait invité un faux « courriel d'époque » ; elle n'apparaît pas.

## Capacité de bibliothèque au-delà du CSS

1. **anime.js 4.5.0 : un seul fil de temps (`createTimeline`) pilote toute la boucle.** Il gère l'impression des faits au caractère près, le chargement de la page par blocs, l'effacement puis la réécriture du nom et le fondu entre interfaces. Le fil se met en **pause**, **reprend** et **saute à une scène** (`seek` sur des étiquettes `scene1` et `scene2`), et tout l'état se recalcule à l'instant visé. Le CSS ne sait ni écrire un texte variable caractère par caractère, ni enchaîner des séquences dépendantes puis les mettre en pause ou y sauter de façon cohérente.
2. **Motion 14.0.0 : la phrase du public voyage d'une interface à l'autre.** Les cartes du fil d'aujourd'hui glissent de leur ancienne place à la nouvelle (FLIP à ressort) quand une contribution arrive en tête. La phrase quitte ensuite sa carte et rejoint, en ressort, la zone « message du public » du décor affiché. Pendant le voyage, sa largeur change et le texte se recompose ; à l'arrivée, elle prend la typographie de l'époque. Le CSS ne peut pas animer un élément entre deux parents dont les positions ne se connaissent qu'à l'exécution, ni produire un ressort interruptible. Les animations Motion en cours se mettent aussi en pause avec le bouton.

## Accessibilité

- **Pause** visible et barre d'espace (WCAG 2.2.2) : elle arrête le fil de temps, les voyages Motion et le curseur clignotant.
- **`prefers-reduced-motion`** : les mêmes scènes s'affichent d'un bloc, en états fixes, sans impression, sans fondu, sans voyage ni clignotement. Les coupes entre scènes restent, toutes les 24 s.
- **Aucun flash** : pas de balayage ni de scintillement d'écran ancien ; les lignes de balayage sont fixes et très faibles. Le curseur clignote à moins de 1 Hz. Le passage du terminal sombre à la page grise se fait par un fondu de 1,6 s, jamais par un saut.
- **Pas de son.** **Contraste AA** sur le mur et le formulaire. Le formulaire a des étiquettes, une légende de groupe, des erreurs liées au champ (`aria-invalid`, `aria-errormessage`), un compteur et un état annoncés (`aria-live`) et des cibles de 44 px au moins. Les lignes imprimées ont leur texte complet en `.sr` pour les lecteurs d'écran.
- **Hors ligne** : polices système seulement, aucune image, police ni script venus d'Internet. Le script de capture le vérifie.

## Ce qui est simulé

- **Deux exemples** de souhaits et d'idées, génériques, marqués « Exemple simulé ». Ce ne sont jamais des souvenirs d'un événement réel.
- La **phrase saisie pendant la démo** est marquée « Contribution de démo, simulée · effacée après la démo ». Elle n'est enregistrée nulle part (mémoire de la page seulement) et elle peut être retirée depuis le formulaire.
- La **modération** : la phrase passe « en attente de validation », puis elle est approuvée automatiquement après 1,5 s. Au palier 2, une personne du Réseau validerait chaque phrase.
- Le **QR** est un motif de maquette : il ne se scanne pas.
- Les **décors** sont stylisés : la « barre d'adresse » dit « décor stylisé », aucune page ni aucun écran d'époque n'est reproduit.

## Limites

- **Deux époques sur cinq.** La piste prévoit aussi la messagerie (1987-1999), la visioconférence (2021) et la conversation (2026). Chacune est un système visuel de plus à réussir et à tester par Chams seul : le risque de faisabilité reste entier pour les trois autres.
- **Le passage du sombre au clair** (terminal, puis page grise) change beaucoup la luminance sur 4,9 m, même en 1,6 s. Sur le mur réel, il faudra le mesurer ou garder des fonds proches.
- **Lisibilité sur portable** : le mur réduit à 1366 px de large fait environ 384 px de haut ; les sources (`F-xxx · S-xxx`) y deviennent minuscules. Il manque un mode démo qui recadre une moitié du mur.
- **Le voyage de la phrase** vise toujours la scène affichée ; si une scène change pendant le voyage, la phrase atterrit dans un décor qui s'efface.
- Aucun **anglais** (la contribution bilingue du brief n'est pas faite). Aucun écran « ce que ça demande au Réseau ». Aucune page de modération.
- `BroadcastChannel` ne relie que des onglets du **même navigateur** ; le formulaire ouvert dans un autre navigateur n'atteint pas le mur.
- Testé seulement dans Chromium (Playwright), à 1920 × 540 et 360 × 780.

## Vérification

`capture.cjs` (Playwright, Chromium local) produit, dans `/mnt/project-files/exp-002/etape-4/captures/` : `concept-c-mur-scene1-impression.png`, `concept-c-mur-scene1-contribution.png`, `concept-c-mur-scene1.png`, `concept-c-mur-scene2-web.png`, `concept-c-mur-mouvement-reduit.png`, `concept-c-formulaire.png`, `concept-c-formulaire-erreurs.png`, `concept-c-formulaire-envoye.png` et la vidéo `concept-c-mur.webm`. Le script vérifie aussi la pause à la barre d'espace, l'absence d'erreur et d'avertissement dans la console et l'absence de toute requête hors de `localhost`.

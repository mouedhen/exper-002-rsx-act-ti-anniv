# Concept B · Contrôle de mission

*Prototype jetable, étape 4 (Concepts), expérience 002, cadre 1.2.0. 2026-10-21. Combinaison proposée par l'auteur des pistes : la console de la piste 1 comme moteur, la grille des éditions de la piste 4 comme matière.*

## Idée

Le mur ne rejoue pas 1976 jusqu'à aujourd'hui. Il montre **les 71 années d'un coup** (1976 à 2046) et les interroge **depuis aujourd'hui**. C'est la réponse au reproche de l'équipe rouge, « une frise accélérée » :

- **Le temps est un espace, pas une lecture.** Les 50 années sourcées et les 20 années à écrire restent toutes à l'écran. Le 32:9 sert à tout montrer en même temps, pas à faire défiler.
- **On lit en travers, pas dans l'ordre.** Chaque rang est un canal, un fil qui traverse les époques (JIQ, Internet, Relève, Régions, OCTAS, Nom, Rayonnement ; les « fils entre époques » de faits-par-epoque.md). La console sonde un canal à la fois.
- **La sonde part de 2026 et remonte.** Elle ouvre les faits du plus récent au plus ancien, revient au présent, puis file vers 2046 dans la zone que le public écrit. Chaque canal finit sur un vide nommé : « Après 2035, aucune source : à écrire ».
- **Le présent est piloté par le public.** En scène 2, les transmissions arrivent de l'antenne (le QR) et passent par « en attente de validation ». Elles se posent ensuite dans la case de l'année choisie par le visiteur : aujourd'hui, un souhait pour 2027 à 2046, ou un vrai souvenir d'une année passée.
- **La grille des éditions (piste 4) reste toujours visible.** Le rang 01 compte en années. Seuls les 7 numéros écrits dans une source s'affichent (1re, 40e, 42e à 45e, 47e). 1985, 2015 et 2019 apparaissent sans numéro. 2020 est marquée comme reportée. Les autres années sont hachurées, « à écrire » (test de résistance, C-c). Comme la grille est en années, F-007 (1985) trouve sa place sans numéro d'édition.

## Scènes

| Scène | Durée | Ce qu'on voit |
| --- | --- | --- |
| 1 · Requête depuis aujourd'hui | 7 canaux de 11 s | Le rang du canal s'ouvre et les autres se resserrent. La sonde part de la ligne « 2026 » et remonte le fil en arcs. Chaque énoncé s'ouvre au moment exact où elle touche son point. Elle revient ensuite au présent et file vers 2046 ; pour Internet, elle s'arrête d'abord sur l'horizon 2035 (F-031). |
| 2 · Canal entrant | 42 s | Titre : F-080 (« Ensemble, faisons-le briller… »). Un exemple simulé arrive toutes les 7 s. Une transmission tapée dans le formulaire interrompt la scène 1 et arrive aussitôt. Elle suit la courbe de l'antenne à « aujourd'hui », passe 1,6 s par la validation (simulée), puis rejoint la case de son année. La case rebondit et les cartes déjà affichées glissent pour lui faire place. |

Commandes de la démo, sous le mur : pause, scène 1, scène 2, téléphone (le formulaire dans un cadre au format téléphone, sur le même portable), mouvement réduit, recadrer (portable), « Ce que ça demande au Réseau » (écran de clôture, E6) et effacer la démo. Le QR simulé du mur ouvre aussi le téléphone.

Paramètres d'adresse : `?canal=internet|jiq|releve|regions|octas|nom|rayonnement`, `?scene=2`, `?reduit=1`, `?kiosque=1`, `?recadre=1|0`. Le formulaire seul : `?vue=formulaire`.

## Faits utilisés

Ils viennent tous de faits-par-epoque.md 0.2. L'énoncé est repris tel quel et porte son identifiant dans `data-fait` (cartes, points, cases).

- **JIQ** : F-001, F-002, F-007, F-020, F-022, F-024, F-025, F-026, F-054, F-028, F-057, F-031.
- **Internet** : F-009 (l'Université Laval, pas le Réseau), F-027, F-031.
- **Relève** : F-012, F-065, F-055, F-067.
- **Régions** : F-033, F-034, F-018, F-068, F-078.
- **OCTAS** : F-008, F-010, F-014, F-015, F-062.
- **Nom** : F-003, F-004, F-011, F-016, F-082.
- **Rayonnement** : F-070, F-052, F-072, F-079.
- **Bandeau et scène 2** : F-030 (la phrase, sans le chiffre de 16 000), F-080.

**Aucun effectif** (membres, contacts, bénévoles), conformément à D-055. Les seuls nombres de personnes sont ceux de participants ou d'invités des événements (F-008, F-020, F-022, F-028, F-057, F-062) et les 150 laissez-passer (F-055). Les données sont dans `donnees.js`.

## Ce que fait la bibliothèque, au-delà du CSS (anime.js 4.5.0)

**Une chorégraphie calculée à l'exécution, sur une seule horloge qu'on peut mettre en pause.**

1. **Trajectoires calculées** (`svg.createMotionPath` + `svg.createDrawable`). Le chemin de la sonde passe par des points dont la position dépend du canal et de la mise en page du moment. Le trait se dessine pendant que la sonde le suit. Pour une transmission, la courbe dépend de l'année choisie par le visiteur, que le CSS ne connaît pas d'avance.
2. **Timing tiré de la géométrie** (`createTimeline`). Le prototype mesure la longueur du chemin jusqu'à chaque point (`getTotalLength`) et en déduit la seconde où chaque carte s'ouvre. Les cartes s'ouvrent quand la sonde arrive, pas selon un délai fixé à la main.
3. **Disposition qui change avec les données.** Les rangs s'ouvrent et se resserrent. Les cartes du public sont replacées à chaque arrivée par un algorithme de couloirs sans chevauchement, et les anciennes glissent vers leur nouvelle place.
4. **Une pause unique** (`engine.pause()` / `engine.resume()`). Animations, minuteries de scène et horloge du jour passent toutes par le moteur d'anime.js (`createTimer`). La pause gèle donc tout d'un coup, y compris l'horloge (WCAG 2.2.2) ; le script de capture le vérifie. Une transmission reçue pendant la pause attend la reprise.

Motion (14.0.0) n'est pas utilisé : anime.js couvre les trajectoires SVG et l'horloge commune.

## Ce qui est simulé

- **Les contributions.** Les exemples sont génériques (attentes, souhaits) et marqués « exemple simulé » sur le mur et dans le journal. Aucun souvenir simulé : un souvenir ne peut venir que du formulaire, tapé par une vraie personne, et il est marqué « Témoignage, pas un fait sourcé ».
- **Ce qui est tapé dans le formulaire** est marqué « saisie en démo ». Ça reste en mémoire de la page du mur seulement : rien n'est écrit dans le navigateur, et un rechargement ou le bouton « Effacer la démo » l'efface.
- **L'avis de collecte et le code de retrait** : le responsable (« Réseau ACTION TI, hypothèse, à confirmer ») et la durée sont des hypothèses ; le code ne vaut que pour le mur ouvert sur ce portable.
- **La modération** : approbation automatique après 1,6 s, affichée « modération simulée ».
- **Le QR code** : un motif décoratif, marqué « QR simulé ».
- **La liaison** entre le téléphone et le mur passe par `BroadcastChannel` sur le même portable : aucun réseau, aucun serveur (D-051). Le formulaire s'ouvre dans un cadre (« Téléphone ») ou dans un autre onglet.

## Accessibilité

- **Pause.** Un bouton visible sur le mur, un autre dans la barre, et la barre d'espace.
- **Mouvement réduit.** `prefers-reduced-motion` est respecté, et un bouton permet de le forcer. Plus de sonde ni de particules : les traits et les cartes s'affichent fixes.
- **Lumière et son.** Aucun flash, aucun grand saut de luminosité, aucun son.
- **Contraste.** Texte crème sur bleu nuit, AA ; les rangs atténués restent au-dessus de 4,5:1.
- **Mode recadré (portable).** Actif par défaut sous 1700 px de large : le mur remplit la hauteur (échelle 0,330 au lieu de 0,178 à 1366 px) et une caméra suit la sonde ; en scène 2, elle se place sur le présent et l'avenir. La caméra passe par l'horloge d'anime.js, donc la pause la fige ; en mouvement réduit, elle saute (le passé, puis l'avenir) au lieu de glisser.
- **Formulaire.** Champs étiquetés, aide reliée par `aria-describedby`, erreurs en `role="alert"`, états en `aria-live`, cibles de 48 px, conçu pour 360 px.
- **Hors ligne.** Polices système seulement.

## Captures

Dans `/mnt/project-files/exp-002/etape-4/captures/` :

- `concept-b-mur-scene1-jiq.png`, `-scene1-internet.png`, `-reduit.png`, `-scene2.png` : le mur à 1920 × 540.
- `concept-b-portable-demo.png` : 1366 × 768, mode recadré, téléphone ouvert.
- `concept-b-mur-pause.png` : le mur en pause, 2,5 s après une transmission reçue (identique au pixel près à l'image d'avant).
- `concept-b-formulaire.png`, `-formulaire-envoye.png` : 360 × 780.
- `concept-b-mur.webm` : environ 16 s, un passage du canal Internet, puis une transmission tapée qui arrive.

Script : `capture.cjs`, avec le serveur lancé depuis `prototypes/` (`npx vite --port 5192 --strictPort`). Il rejoue aussi les cas de test des constats B-1 à B-8 et T-1. Résultat : console sans erreur, aucune requête hors de localhost, horloge gelée en pause, 17 vérifications sur 17 réussies.

## Limites

- **Lisibilité sur portable.** Le mode recadré montre environ 54 % de la largeur du mur ; le nom du canal (colonne de gauche) sort du cadre quand la caméra est à droite, et le cadre du téléphone couvre le tiers droit. Les identifiants F-xxx restent petits (9 px rendus).
- **Le reproche de la frise n'est pas éteint.** Un canal reste une suite de faits datés le long d'un fil ; ce qui change, c'est le sens de lecture (depuis aujourd'hui) et la simultanéité. À éprouver devant quelqu'un d'autre que l'auteur : c'est le test de la conviction.
- **Le 3 novembre.** La scène 2 ne montre que des exemples, sauf si la personne du Réseau tape la première transmission ; c'est là que tient la démo.
- **Pas encore fait.** Pas d'anglais, pas de page de modération réelle, pas de capsule. La lisibilité à distance du 32:9 n'est pas testée (P3).
- **Placement des cartes.** Les couloirs évitent les chevauchements, mais une carte peut s'éloigner de son point quand les faits se serrent (F-066 est donc laissé hors du canal Relève).

## Corrections de l'itération 2

*2026-10-21, d'après [equipe-rouge-1.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-1.md). Preuves : sortie de `node capture.cjs` (port 5192), 17 vérifications réussies, console sans erreur, aucune requête hors de localhost ; captures dans `etape-4/captures/`.*

| Constat | Correctif | Preuve |
| --- | --- | --- |
| B-1 · aucun retrait | Après l'envoi, le formulaire liste chaque phrase transmise avec son code et un bouton « Retirer ma phrase » ; « Retirer une phrase avec un code » marche depuis une nouvelle page. Le mur traite le message `retrait` : il annule l'arrivée en cours, retire la phrase de la file de pause, du journal, de la case, du compteur et des cartes, puis confirme (`retiree`). | `formulaire.js` (liste des envois, formulaire du code) ; `mur.js`, `retirer()`. `capture.cjs` : phrase visible puis absente après le bouton (case 2041 vide) ; retrait 0,5 s après l'envoi, rien sur le mur 6 s plus tard ; code saisi sur une nouvelle page, « Retrait confirmé par le mur ». `concept-b-formulaire-envoye.png`. |
| B-2 · pas de case d'âge | Case distincte et obligatoire « J'ai 14 ans ou plus », avec l'aide « Avant 14 ans, l'accord d'un parent est nécessaire (Loi 25) », même règle que A. | Sans la case : « Confirmez votre âge, ou demandez l'accord d'un parent. » et rien n'arrive au mur. `concept-b-formulaire.png`. |
| B-3 · F-002 dans « Au-delà du Québec » | F-002 passe dans le canal JIQ, à côté de F-001 (la première JIQ). Le canal Rayonnement garde F-070, F-052, F-072 et F-079. | `donnees.js`. Vérification : canal Rayonnement = F-070, F-052, F-072, F-079 ; F-002 en carte dans JIQ. `concept-b-mur-scene1-jiq.png`. |
| B-4 · date de F-070 tronquée | Date reprise telle quelle : « depuis 1998 (écrit en 2019-2020) ». | `donnees.js:22` ; texte lu sur la carte F-070 à l'exécution. |
| B-5 · la pause ne retient pas une arrivée | Pendant la pause, une transmission va dans une file (`etat.enAttente`) ; le mur ne bouge pas et le formulaire dit « Le mur est en pause : elle s'affichera à la reprise ». À la reprise, la file se vide. Seul un retrait agit pendant la pause (il enlève, n'ajoute rien). | Deux captures du mur en pause, avant et 2,5 s après une transmission : identiques au pixel près ; la phrase arrive après la reprise. `concept-b-mur-pause.png`. |
| B-6 · la saisie survit au rechargement | Plus rien n'est écrit dans `localStorage` : les transmissions vivent en mémoire de la page du mur. La clé de l'ancienne version est purgée au chargement. | `canal.js`, `mur.js` (montage). `localStorage.length` = 0 après une transmission, 0 après rechargement ; journal vide. |
| B-7 · illisible sur le portable | Mode recadré, actif par défaut sous 1700 px (bouton « Recadrer (portable) », `?recadre=1|0`) : le mur remplit la hauteur et la caméra suit la sonde. Au mur, énoncés à 56 px (46 avant) et dates à 38 px ; cartes de 1120 × 300 px et rang actif de 820 px pour que rien ne déborde. | À 1366 × 768 : échelle 0,330 (0,178 avant), énoncés rendus à 18,5 px (8,2 avant), dates à 12,5 px, aucune carte qui déborde. Au mur : 56 px, soit 36 mm de corps (0,638 mm par pixel). `concept-b-portable-demo.png`. |
| B-8 · souvenir libre et tiers | Aides : « Seulement ce que vous avez vécu. Ne nommez personne. » et « Une phrase, 120 caractères au plus. Ne nommez personne. » Au palier 2, un modérateur vérifie ce point. | Texte du formulaire lu à l'exécution ; l'ancienne formule a disparu. |
| T-1 · information du consentement | Court avis avant les cases : qui recueille (« le Réseau ACTION TI (hypothèse, à confirmer) »), pourquoi, combien de temps, comment retirer (bouton ou code affiché après l'envoi), « Démo : cet avis et le code de retrait sont simulés ». Le nom du Réseau y paraît, donc « Proposition non officielle · prototype » est ajouté à l'en-tête du formulaire et à la légende du mur. | Les huit mentions sont lues à l'exécution ; code de la forme `B-XXXX` affiché après l'envoi. `concept-b-formulaire.png`, `concept-b-formulaire-envoye.png`. |

## Corrections de l'itération 3

*2026-10-21, d'après [equipe-rouge-2.md](/mnt/project-files/exp-002/etape-4/boucles/equipe-rouge-2.md). Preuves : sortie de `PORT=5195 node concept-b/capture.cjs` (serveur `npx vite --port 5195 --strictPort` ; sans `PORT`, le script garde le port 5192 documenté), 21 vérifications sur 21 réussies (17 de l’itération 2, 4 nouvelles), console sans erreur, aucune requête hors de localhost. `package.json` et les dépendances sont inchangés (N-7 laissé à la décision de Chams).*

| Constat | Correctif | Preuve |
| --- | --- | --- |
| N-1 · canal actif invisible en recadré | Cartouche fixe en haut à gauche du cadre, hors de la scène transformée (donc immobile quand la caméra glisse), affiché seulement en mode recadré : « Canal 04 / 07 · Régions », puis « Scène 2 · canal entrant · Vous écrivez la suite ». | `mur.js`, `majCartouche()`. À 1366 × 768 : cartouche dans la fenêtre et égal au canal de l'en-tête ; masqué en mur entier. `concept-b-portable-cartouche.png` |
| N-3 · portée du code (à l'écran) | « (démo : tant que le mur reste ouvert) » dans l'avis (« Comment retirer »), à côté de chaque code affiché après l'envoi et dans l'aide du formulaire « Retirer une phrase avec un code ». | Les trois textes lus à l'exécution. `concept-b-formulaire-envoye.png` |
| N-5 · l'avis nomme le Réseau | « Qui recueillerait : l'organisateur (à confirmer, par exemple le Réseau ACTION TI). » | Avis lu à l'exécution. `concept-b-formulaire.png` |

La limite « le nom du canal sort du cadre » (section Limites) est levée par N-1 pour le canal actif ; les noms des autres rangs restent hors cadre quand la caméra est à droite.


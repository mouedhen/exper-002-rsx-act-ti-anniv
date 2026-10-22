# Combinaison · Cinquante ans d'interfaces, à l'année du visiteur (prototype jetable)

*Expérience 002, étape 4 (Concepts), cadre 1.2.0. 4e prototype : la combinaison recommandée dans [concepts.md](/mnt/project-files/exp-002/etape-4/concepts.md) 0.1 et la combinaison n° 1 de [retour-simule-1.md](/mnt/project-files/exp-002/etape-4/boucles/retour-simule-1.md). Il répond aussi à l'évaluateur ([notes-evaluateur.md](/mnt/project-files/exp-002/etape-4/boucles/notes-evaluateur.md), C9 à 3 sur 5 : « terminal rétro, puis Web des débuts », « la recommandation n'a pas de prototype »). Les concepts A, B et C ne sont pas modifiés.*

## Idée

La base est C : chaque époque s'affiche dans un décor de l'informatique de son temps, stylisé et générique, et le fil « Aujourd'hui · 2026 » reçoit les mots du public. Ce que la combinaison change : **le visiteur choisit l'année de sa phrase** (repris de B), et c'est cette année qui décide du décor, pas le hasard de ce qui est affiché. Un vrai souvenir de 1985 s'imprime dans l'écran à caractères. Un souvenir de 2001 s'inscrit au livre d'or de la page web. Un souhait pour 2040 rejoint l'interface du futur.

Il y a **trois décors, pas plus** :

| Décor | Années reçues | Faits |
| --- | --- | --- |
| 1 · l'écran à caractères (de C) | souvenirs de 1976 à 1990 | 1976-1985 |
| 2 · la page web (de C) | souvenirs de 1991 à 2025 | 1991-2008 |
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
- décors **1976-1990 / 1991-2026 / 2027-2046** (`?scene=2`, `?scene=3`) ;
- **Vue** : mur entier, décors recadrés ou aujourd'hui recadré (`?recadre=mur|epoques|aujourdhui`) ;
- **Contenu** : 2 exemples (par défaut), **matin vide** (`?contenu=vide`), **80 simulées** (`?contenu=charge`) ;
- **Ce que ça demande au Réseau** (Échap ferme).

## Scènes

| Scène | Ce qui bouge | Faits (`data-fait`) |
| --- | --- | --- |
| 1 · 1976-1990 · écran à caractères | Les faits s'impriment au caractère (40 car./s). Un souvenir de cette période arrive en carte (ressort), puis se **réimprime au caractère** en ambre, avec « témoignage, pas un fait ». | F-001, F-002, F-003, F-033, F-007 |
| 2 · 1991-2026 · page web | La page se charge par blocs et le nom change sous les yeux (« Fédération de l'informatique du Québec » → « Réseau ACTION TI »). Un souvenir de 1991 à 2025 arrive au **livre d'or**. | F-034, F-010, F-012, F-014, F-016 |
| 3 · 2027-2046 · interface du futur | L'horizon se trace et les trois textes du « futur d'hier » montent. La tête de lecture balaie les 20 années, à 600 ms par année. Un souhait **vole lettre par lettre** jusqu'à la zone en vedette, puis un point naît à son année (ressort) et un trait le relie à la phrase. Avec plusieurs souhaits, la vedette change toutes les 6 s. | F-078, F-079, F-081 ; repère « Horizon 2035 » : F-031 |
| Toujours visible · Aujourd'hui · 2026 | Le fil du public (cartes FLIP à ressort). Chaque carte dit vers quel décor elle part (« Souvenir de 1985 → décor : l'écran à caractères »). | F-031, F-030 |

Les décors tournent toutes les 24 s, par un fondu de 1,6 s (0,6 s en mouvement réduit). À l'arrivée d'une phrase, le mur **va au décor de son année** : il l'affiche déjà complet, sans repasser par son introduction, puis y reste 14 s. Les arrivées passent une à la fois, dans l'ordre.

**État vide du matin (`?contenu=vide`).** Le mur n'a aucune contribution et aucun exemple, comme le 18 novembre à 8 h. Le fil dit : « Personne n'a encore écrit aujourd'hui. Votre phrase sera la première du mur ». Chaque décor montre sa propre invitation : « en attente d'un vrai souvenir de 1976 à 1990 », « Le livre d'or attend un vrai souvenir de 1991 à 2025 », « 20 années à écrire. Le premier souhait de la journée s'inscrira ici, à son année ». L'horizon vide est lui-même l'appel.

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
- **`prefers-reduced-motion`.** Les décors s'affichent d'un bloc, sans impression ni balayage. Une arrivée ne fait ni voyage ni vol de lettres : la phrase apparaît sur place par un fondu de 600 ms, et le point aussi. Le changement de décor reste un fondu d'opacité de 600 ms, jamais une coupe franche (constat C-8).
- **Compteurs (WCAG 2.3.1).** Le seul compteur animé est l'année de la tête de lecture : un pas toutes les 600 ms, soit 2 changements par seconde au plus. La ligne « et N autres phrases » ne change qu'à une arrivée ou à un retrait. Le curseur clignote à moins de 1 Hz. Il n'y a ni balayage ni scintillement d'écran ancien.
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

- **Trois décors seulement.** Les souvenirs de 2009 à 2025 vont au décor « page web », dont les faits s'arrêtent en 2008 ; le titre dit « 1991-2026 ». Un 4e décor (messagerie, visioconférence) est exclu par la recommandation.
- **Le volume réel n'est vu que pour les souhaits.** Avec des dizaines de souvenirs, le terminal et le livre d'or ne montrent que le plus récent : il faudra une rotation comme celle du futur. Au-delà d'environ 12 souhaits pour une même année, la pile de points monterait jusqu'à la phrase en vedette (les 80 souhaits simulés en donnent 10 au plus pour une même année).
- **La file d'arrivées est séquentielle**, environ 6 à 8 s par phrase et 14 s de tenue. Dix phrases approuvées d'un coup mettraient deux minutes à toutes passer : il faudra regrouper au palier 2.
- **Le vol des lettres** mesure la carte d'origine même quand elle est hors cadre (vue recadrée sur les décors) : sur le portable, les lettres entrent par la droite de l'écran.
- **Le passage du terminal sombre à la page beige** reste un grand saut de luminance sur 4,9 m, même en fondu (limite héritée de C). Aucune analyse PEAT n'a été faite.
- **Tailles au mur calculées**, pas mesurées à 4 m (P3). Testé dans Chromium seulement (Playwright), à 1920 × 540, 1366 × 768 et 360 × 780.
- `BroadcastChannel` ne relie que les onglets d'un même navigateur. Il n'y a ni page de modération, ni parcours d'accord parental (sous 14 ans, le formulaire renvoie à l'équipe du stand), ni capsule.
- Aucune équipe rouge n'a encore relu ce prototype : les tests sont ceux de son auteur.

## Vérification

`capture.cjs` (Playwright, Chromium local, serveur sur le port 5197 ; `PORT=` pour en changer) produit dans `/mnt/project-files/exp-002/etape-4/captures/` :

- les captures `concept-combi-*.png` : décors, souvenir 1985, souhait 2040 en vol puis posé, souvenir 2001, matin vide, 80 simulées, 1366 px, mouvement réduit, pause, retrait, clôture, formulaire (vide, erreurs, envoyé, anglais, retrait par code), parcours ;
- la vidéo du mur `concept-combi-mur.webm` ;
- la vidéo `concept-combi-formulaire.webm`, où un cadre téléphone et le mur sont côte à côte : erreurs, saisie, approbation, arrivée sur l'horizon, retrait.

Il sort en erreur si un cas échoue. Résultat du 2026-10-22 : **32 cas sur 32 OK**.

| Règle | Cas de test |
| --- | --- |
| Année → décor | souvenir 1985 → terminal ; souhait 2040 envoyé pendant le décor 2 → décor 3, point à 2040 ; souvenir 2001 → livre d'or |
| Faits par script, avec source | chaque `[data-fait]` affiché comparé au tableau relu par `lireReference` : date, énoncé, sources ; les 15 présents |
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

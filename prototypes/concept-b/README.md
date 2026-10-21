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

Commandes de la démo, sous le mur : pause, scène 1, scène 2, téléphone (le formulaire dans un cadre au format téléphone, sur le même portable), mouvement réduit, « Ce que ça demande au Réseau » (écran de clôture, E6) et effacer la démo. Le QR simulé du mur ouvre aussi le téléphone.

Paramètres d'adresse : `?canal=internet|jiq|releve|regions|octas|nom|rayonnement`, `?scene=2`, `?reduit=1`, `?kiosque=1`. Le formulaire seul : `?vue=formulaire`.

## Faits utilisés

Ils viennent tous de faits-par-epoque.md 0.2. L'énoncé est repris tel quel et porte son identifiant dans `data-fait` (cartes, points, cases).

- **JIQ** : F-001, F-007, F-020, F-022, F-024, F-025, F-026, F-054, F-028, F-057, F-031.
- **Internet** : F-009 (l'Université Laval, pas le Réseau), F-027, F-031.
- **Relève** : F-012, F-065, F-055, F-067.
- **Régions** : F-033, F-034, F-018, F-068, F-078.
- **OCTAS** : F-008, F-010, F-014, F-015, F-062.
- **Nom** : F-003, F-004, F-011, F-016, F-082.
- **Rayonnement** : F-002, F-070, F-052, F-072, F-079.
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
- **Ce qui est tapé dans le formulaire** est marqué « saisie en démo ». Ça reste dans le navigateur (`localStorage`) et le bouton « Effacer la démo » le supprime.
- **La modération** : approbation automatique après 1,6 s, affichée « modération simulée ».
- **Le QR code** : un motif décoratif, marqué « QR simulé ».
- **La liaison** entre le téléphone et le mur passe par `BroadcastChannel` sur le même portable : aucun réseau, aucun serveur (D-051). Le formulaire s'ouvre dans un cadre (« Téléphone ») ou dans un autre onglet.

## Accessibilité

- **Pause.** Un bouton visible sur le mur, un autre dans la barre, et la barre d'espace.
- **Mouvement réduit.** `prefers-reduced-motion` est respecté, et un bouton permet de le forcer. Plus de sonde ni de particules : les traits et les cartes s'affichent fixes.
- **Lumière et son.** Aucun flash, aucun grand saut de luminosité, aucun son.
- **Contraste.** Texte crème sur bleu nuit, AA ; les rangs atténués restent au-dessus de 4,5:1.
- **Formulaire.** Champs étiquetés, aide reliée par `aria-describedby`, erreurs en `role="alert"`, états en `aria-live`, cibles de 48 px, conçu pour 360 px.
- **Hors ligne.** Polices système seulement.

## Captures

Dans `/mnt/project-files/exp-002/etape-4/captures/` :

- `concept-b-mur-scene1-jiq.png`, `-scene1-internet.png`, `-pause.png`, `-reduit.png`, `-scene2.png` : le mur à 1920 × 540.
- `concept-b-portable-demo.png` : 1366 × 768, téléphone ouvert.
- `concept-b-formulaire.png`, `-formulaire-envoye.png` : 360 × 780.
- `concept-b-mur.webm` : environ 16 s, un passage du canal Internet, puis une transmission tapée qui arrive.

Script : `capture.cjs`, avec le serveur Vite lancé sur le port 5175. Résultat : console sans erreur, aucune requête hors de localhost, horloge gelée en pause.

## Limites

- **Lisibilité sur portable.** Sur un écran de 1366 px, le mur fait 384 px de haut et le texte y est petit. Le cadre du téléphone couvre le tiers droit. Le mode recadré sur une moitié du mur n'est pas fait.
- **Le reproche de la frise n'est pas éteint.** Un canal reste une suite de faits datés le long d'un fil ; ce qui change, c'est le sens de lecture (depuis aujourd'hui) et la simultanéité. À éprouver devant quelqu'un d'autre que l'auteur : c'est le test de la conviction.
- **Le 3 novembre.** La scène 2 ne montre que des exemples, sauf si la personne du Réseau tape la première transmission ; c'est là que tient la démo.
- **Pas encore fait.** Pas d'anglais, pas de page de modération réelle, pas de capsule. La lisibilité à distance du 32:9 n'est pas testée (P3).
- **Placement des cartes.** Les couloirs évitent les chevauchements, mais une carte peut s'éloigner de son point quand les faits se serrent (F-066 est donc laissé hors du canal Relève).

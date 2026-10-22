// Données de la combinaison. Faits : date, énoncé et sources recopiés par script
// (extraire-faits.cjs → faits-ref.js) depuis etape-3/faits-par-epoque.md (0.2). Rien de réécrit à la main ici.
// Aucun effectif (membres, contacts, bénévoles) : D-055. F-009, F-075 et F-076 ne sont pas utilisés.
import { REF } from './faits-ref.js'

const fait = (id) => ({ id, ...REF[id] })

// Trois décors au plus (recommandation de concepts.md). L'année choisie par le visiteur décide du décor.
export const DECORS = {
  1: { de: 1976, a: 1990, nom: "l'écran à caractères", nomEn: 'the character screen' },
  2: { de: 1991, a: 2026, nom: 'la page web', nomEn: 'the web page' },
  3: { de: 2027, a: 2046, nom: "l'interface du futur", nomEn: 'the interface of the future' },
}
export const decorDe = (an) => (an <= DECORS[1].a ? 1 : an <= DECORS[2].a ? 2 : 3)

export const SCENE_1 = {
  titre: "1976-1990 · l'écran à caractères",
  faits: ['F-001', 'F-002', 'F-003', 'F-033', 'F-007'].map(fait),
  note: 'F-001 et F-007 : niveau de preuve B* (DT-002), une source à recouper.',
}

export const SCENE_2 = {
  titre: '1991-2026 · la page web',
  faits: ['F-034', 'F-010', 'F-012', 'F-014', 'F-016'].map(fait),
}

export const SCENE_3 = {
  titre: "2027-2046 · l'interface du futur",
  faits: ['F-078', 'F-079', 'F-081'].map(fait),
  horizon: fait('F-031'), // repère « 2035 » : seul horizon daté du mur
}

export const AUJOURD_HUI = ['F-031', 'F-030'].map(fait)

// Choix fermé d'abord (repris de A).
export const CATEGORIES = {
  releve: { fr: 'La relève', en: 'The next generation' },
  rayonnement: { fr: 'Rayonner au Canada et à l’international', en: 'Reach across Canada and the world' },
  regions: { fr: 'Grandir dans les régions', en: 'Growth in the regions' },
  internet: { fr: 'L’Internet de demain', en: 'Tomorrow’s Internet' },
}

// Exemples SIMULÉS : seulement des souhaits génériques tournés vers l'avenir.
// Jamais de souvenir simulé : un faux témoignage passerait pour vrai.
export const EXEMPLES = [
  { id: 'ex-a', type: 'souhait', cat: 'regions', an: 2046, texte: 'Que la relève trouve sa place dans chaque région du Québec.', simule: 'exemple' },
  { id: 'ex-b', type: 'souhait', cat: 'releve', an: 2031, texte: 'Des stages partagés entre PME de régions différentes.', simule: 'exemple' },
]

// Mur chargé : 80 souhaits simulés, déterministes, pour voir le volume (manque relevé par le retour simulé).
const PHRASES = {
  releve: [
    'Que les étudiants d’aujourd’hui animent la JIQ de 2046.',
    'Un stage en TI offert dans chaque cégep.',
    'Plus de femmes dans les équipes techniques.',
    'Que la relève siège partout où l’on décide.',
    'Un mentor pour chaque personne qui débute.',
  ],
  rayonnement: [
    'Une JIQ suivie depuis plusieurs pays, en français.',
    'Des projets québécois primés à l’étranger.',
    'Des échanges d’étudiants entre provinces.',
    'Que nos logiciels libres voyagent loin.',
    'Un pont entre les TI du Québec et de la francophonie.',
  ],
  regions: [
    'Une JIQ itinérante, une région par année.',
    'La fibre dans chaque rang du Québec.',
    'Des entreprises de TI fortes hors des grands centres.',
    'Travailler en TI sans quitter sa région.',
    'Un laboratoire numérique dans chaque MRC.',
  ],
  internet: [
    'Un Internet plus sobre en énergie.',
    'Des données qui restent à ceux qui les produisent.',
    'Un Internet accessible à toutes les personnes âgées.',
    'Moins de pannes, plus de réparations.',
    'Que chacun comprenne les algorithmes qui le touchent.',
  ],
}

export function exemplesCharges(n = 80) {
  const cats = Object.keys(CATEGORIES)
  let graine = 11
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647)
  const sortie = []
  for (let i = 0; i < n; i++) {
    const cat = cats[i % cats.length]
    const an = 2027 + Math.floor(alea() * 20)
    const sansPhrase = alea() < 0.15 // phrase facultative : certaines n'ont que le choix fermé
    const p = PHRASES[cat]
    sortie.push({
      id: `ex-${String(i + 1).padStart(2, '0')}`,
      type: 'souhait',
      cat,
      an,
      texte: sansPhrase ? '' : p[Math.floor(alea() * p.length)],
      simule: 'exemple',
    })
  }
  return sortie
}

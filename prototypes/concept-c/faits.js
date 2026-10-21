// Faits affichés : date, énoncé et sources recopiés par script (extraire-faits.cjs → faits-ref.js)
// depuis etape-3/faits-par-epoque.md (0.2). Ne rien réécrire à la main ici (constat C-4).
// Aucun effectif (membres, contacts, bénévoles) : D-055.
// F-009 (adresse courriel de l'Université Laval, 1988) n'est pas utilisé : il ne concerne pas le Réseau.
import { REF } from './faits-ref.js'

const fait = (id) => ({ id, ...REF[id] })

export const SCENE_1 = {
  id: 'scene1',
  periode: '1976-1986',
  titre: "1976-1986 · l'écran à caractères",
  faits: [
    fait('F-001'),
    fait('F-002'),
    fait('F-003'),
    fait('F-033'),
    fait('F-007'),
  ],
  note: 'F-001 et F-007 : niveau de preuve B* (DT-002), une source à recouper.',
}

export const SCENE_2 = {
  id: 'scene2',
  periode: '1991-2008',
  titre: '1991-2008 · le Web des débuts',
  faits: [
    fait('F-034'),
    fait('F-010'),
    fait('F-012'),
    fait('F-014'),
    fait('F-016'),
  ],
}

export const AUJOURD_HUI = [
  fait('F-031'),
  fait('F-030'),
]

// Exemples simulés : souhaits et idées génériques, jamais le souvenir d'un événement réel.
export const EXEMPLES_SIMULES = [
  { id: 'ex-1', genre: 'Idée pour faire rayonner les TI', texte: 'Des stages partagés entre PME de régions différentes.', signature: 'Exemple simulé', simule: 'exemple' },
  { id: 'ex-2', genre: 'Souhait pour 2046', texte: 'Que la relève trouve sa place dans chaque région du Québec.', signature: 'Exemple simulé', simule: 'exemple' },
]

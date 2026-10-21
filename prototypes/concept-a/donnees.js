// Données du concept A. Les textes de faits viennent de faits.js (énoncés tels quels) ;
// ici, seulement la place de chaque fait dans le temps et son rôle dans la boucle.
import { FAITS } from './faits.js'

export { FAITS }

// Grille des éditions (piste 4), réduite aux éditions dont le numéro est écrit dans une source.
// « annee » sert au placement sur l'axe (fraction de l'année du mois connu).
export const EDITIONS = [
  { fait: 'F-001', annee: 1976.3, etiquette: '1re', type: 'edition' },
  { fait: 'F-022', annee: 2018.8, etiquette: '40e', type: 'edition' },
  { fait: 'F-024', annee: 2019.85, etiquette: '2019', type: 'hors-numero', note: 'Numéro non écrit dans les sources' },
  { fait: 'F-025', annee: 2020.8, etiquette: '2020', type: 'absence', note: 'Aucune édition cette année-là' },
  { fait: 'F-026', annee: 2021.83, etiquette: '42e', type: 'edition' },
  { fait: 'F-054', annee: 2022.8, etiquette: '43e', type: 'edition' },
  { fait: 'F-028', annee: 2023.8, etiquette: '44e', type: 'edition' },
  { fait: 'F-057', annee: 2024.86, etiquette: '45e', type: 'edition' },
  { fait: 'F-031', annee: 2026.88, etiquette: '47e', type: 'edition', aujourdhui: true },
]

// Plan 1 : l'horizon déclaré par le Réseau (déclarations sur l'avenir, avec leur date d'écriture).
export const HORIZON = ['F-078', 'F-079', 'F-081', 'F-080']

// Plan 3 : ce qui a changé. Trois écarts, chacun entre deux faits datés. Aucun effectif (D-055).
export const ECARTS = [
  { de: 'F-003', a: 'F-016', anDe: 1977.65, anA: 2008.8, titre: 'Le nom' },
  { de: 'F-001', a: 'F-024', anDe: 1976.3, anA: 2019.85, titre: 'La journée' },
  { de: 'F-009', a: 'F-027', anDe: 1988.5, anA: 2020.9, titre: 'Le réseau des réseaux' },
]

// Choix fermé du formulaire : ce que le visiteur attend des 20 prochaines années.
// Ce sont des catégories de réponse, pas des faits.
export const CATEGORIES = {
  releve: { fr: 'La relève', en: 'The next generation', forme: 'rond' },
  rayonnement: { fr: 'Rayonner au Canada et à l’international', en: 'Reach across Canada and the world', forme: 'losange' },
  regions: { fr: 'Grandir dans les régions', en: 'Growth in the regions', forme: 'carre' },
  internet: { fr: 'L’Internet de demain', en: 'Tomorrow’s Internet', forme: 'triangle' },
}

// Contributions SIMULÉES pour la démo : souhaits génériques tournés vers l'avenir,
// jamais un souvenir, jamais un événement réel, jamais attribués à une personne.
export const EXEMPLES = [
  { cat: 'releve', an: 2046, texte: 'Que les étudiants d’aujourd’hui animent la JIQ de 2046.' },
  { cat: 'releve', an: 2030, texte: 'Un stage en TI offert dans chaque cégep.' },
  { cat: 'releve', an: 2034, texte: 'Plus de femmes dans les équipes techniques.' },
  { cat: 'releve', an: 2041, texte: '' },
  { cat: 'releve', an: 2028, texte: '' },
  { cat: 'rayonnement', an: 2031, texte: 'Une JIQ suivie en français et en anglais, partout.' },
  { cat: 'rayonnement', an: 2036, texte: 'Des entreprises d’ici citées en exemple à l’étranger.' },
  { cat: 'rayonnement', an: 2040, texte: '' },
  { cat: 'rayonnement', an: 2029, texte: '' },
  { cat: 'rayonnement', an: 2044, texte: 'Un échange de talents avec d’autres pays francophones.' },
  { cat: 'regions', an: 2033, texte: 'Une communauté TI active dans chaque région.' },
  { cat: 'regions', an: 2027, texte: 'Travailler en TI depuis sa région, sans déménager.' },
  { cat: 'regions', an: 2038, texte: '' },
  { cat: 'regions', an: 2032, texte: '' },
  { cat: 'regions', an: 2045, texte: '' },
  { cat: 'internet', an: 2035, texte: 'Un Internet plus sobre en énergie.' },
  { cat: 'internet', an: 2029, texte: 'Moins de jargon, plus d’accessibilité numérique.' },
  { cat: 'internet', an: 2035, texte: '' },
  { cat: 'internet', an: 2039, texte: '' },
  { cat: 'internet', an: 2042, texte: 'Des données publiques ouvertes et faciles à comprendre.' },
  { cat: 'internet', an: 2037, texte: '' },
  { cat: 'releve', an: 2035, texte: '' },
].map((e, i) => ({ ...e, id: 'ex-' + i, simule: true }))

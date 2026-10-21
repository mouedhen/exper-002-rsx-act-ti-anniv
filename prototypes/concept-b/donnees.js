// Données du prototype jetable, concept B « Contrôle de mission ».
// Énoncés repris tels quels de etape-3/faits-par-epoque.md 0.2 (colonne « Énoncé pour le mur »).
// Aucun effectif (membres, contacts, bénévoles) : D-055.
// « an » : position sur l'axe (année, décimale pour un exercice de juillet à juin).

export const AN_DEBUT = 1976
export const AN_FIN = 2046
export const AN_AUJOURDHUI = 2026

export const FAITS = {
  'F-001': { date: 'avril 1976', enonce: 'Première Journée de l\'informatique du Québec, à Québec' },
  'F-002': { date: '1976', enonce: 'Présidée par Hervé Carpentier, organisée par l\'ACI et l\'ACFOR' },
  'F-003': { date: '26 août 1977', enonce: 'La Fédération de l\'informatique du Québec est fondée à Québec' },
  'F-004': { date: '3e trimestre 1977', enonce: 'Le bulletin de la Fédération entre au dépôt légal' },
  'F-033': { date: '12 octobre 1979', enonce: 'Premières sections régionales : Montréal et Québec' },
  'F-007': { date: '1985', enonce: 'En pleine campagne, le premier ministre Pierre-Marc Johnson visite la JIQ' },
  'F-008': { date: '1987', enonce: 'Premier gala de l\'excellence en informatique : plus de 400 personnes' },
  'F-009': { date: '1988', enonce: 'L\'Université Laval obtient une première adresse courriel' },
  'F-034': { date: '1991 à 2008', enonce: 'Sections en Estrie, Laval-Laurentides-Lanaudière, Saguenay–Lac-Saint-Jean, Mauricie, Outaouais' },
  'F-010': { date: '1993', enonce: 'Pitch Expert, du CRIM et de Paprican, reçoit l\'OCTAS de l\'innovation' },
  'F-011': { date: '1998', enonce: 'La FiQ se dote d\'un siège social permanent à Montréal' },
  'F-070': { date: 'depuis 1998', enonce: 'Collaboration avec CIPS pour la certification EATI–IPA' },
  'F-012': { date: 'avril 2000', enonce: 'Premières Soirées Reconnaissance de la relève étudiante en informatique' },
  'F-014': { date: '28 mai 2005', enonce: '19e concours des OCTAS, au Palais des congrès de Montréal' },
  'F-015': { date: '24 mai 2008', enonce: '22e OCTAS : 124 candidatures, gala au Centre des congrès de Québec' },
  'F-016': { date: 'septembre à novembre 2008', enonce: 'La FiQ devient le Réseau ACTION TI' },
  'F-018': { date: '2013-2014', enonce: 'Les régions fusionnent : Montréal, Laval-Laurentides-Lanaudière, Québec, Mauricie, Saguenay–Lac-Saint-Jean' },
  'F-020': { date: '2015', enonce: 'La JIQ attire près de 1 700 participants par année' },
  'F-065': { date: 'depuis 2017', enonce: 'Tendances TI, Zone Relève TI et MÉRITIC, en marge de la JIQ' },
  'F-022': { date: '2018', enonce: '40e JIQ : quelque 1 600 participants' },
  'F-068': { date: '2018-2019', enonce: 'Cinq régions, deux bureaux : Montréal et Québec' },
  'F-024': { date: '2019', enonce: 'Première JIQ d\'une semaine, et record d\'affluence' },
  'F-052': { date: '2019', enonce: 'Une délégation de plusieurs pays d\'Afrique assiste à la JIQ' },
  'F-025': { date: '2020', enonce: 'La JIQ et les OCTAS sont reportés à l\'an prochain' },
  'F-027': { date: '2020-2021', enonce: 'Virage numérique : événements 100 % virtuels ou hybrides' },
  'F-026': { date: '1er au 4 novembre 2021', enonce: '42e JIQ : un combiné de virtuel et de présentiel' },
  'F-054': { date: 'octobre 2022', enonce: '43e JIQ au Centre de foires ExpoCité, avec Jean Bélanger (Premier Tech)' },
  'F-055': { date: 'automne 2022', enonce: '150 laissez-passer offerts aux étudiants à la JIQ' },
  'F-028': { date: '17 octobre 2023', enonce: '44e JIQ au Centre de foires ExpoCité : plus de 1 300 participants' },
  'F-072': { date: '2023-2024', enonce: 'Plus de 2 000 personnes de « l\'est du pays » aux événements' },
  'F-057': { date: '12 novembre 2024', enonce: '45e JIQ à ExpoCité : près de 1 500 participants' },
  'F-082': { date: '2024', enonce: 'Chantal Dolbec, plus de 30 ans à la direction du Réseau' },
  'F-078': { date: '2024', enonce: 'Les prochaines années : croissance à travers les différentes régions du Québec' },
  'F-067': { date: '2024-2025', enonce: 'Un observateur de la relève siège au conseil d\'administration' },
  'F-062': { date: '22 mai 2025', enonce: '38e OCTAS : 67 projets, 20 trophées, 323 participants' },
  'F-079': { date: '2025', enonce: 'Faire rayonner l\'excellence des TI « à l\'échelle canadienne et internationale »' },
  'F-080': { date: '2025', enonce: '« […] un joyau. Ensemble, faisons-le briller encore plus fort ! »' },
  'F-030': { date: '2026 (page non datée)', enonce: '« 50 années à contribuer au développement du secteur des TI au Québec »' },
  'F-031': { date: '18 novembre 2026', enonce: 'Vint Cerf ouvre la 47e JIQ : « L\'évolution d\'Internet, des origines à 2035 »' },
}

// Les éditions dont le numéro est écrit dans une source (compter en années, test de résistance C-c).
export const EDITIONS = {
  1976: { libelle: '1re', fait: 'F-001' },
  2018: { libelle: '40e', fait: 'F-022' },
  2021: { libelle: '42e', fait: 'F-026' },
  2022: { libelle: '43e', fait: 'F-054' },
  2023: { libelle: '44e', fait: 'F-028' },
  2024: { libelle: '45e', fait: 'F-057' },
  2026: { libelle: '47e', fait: 'F-031' },
}
// JIQ connues par une source, sans numéro écrit.
export const JIQ_SANS_NUMERO = {
  1985: { libelle: 'JIQ', fait: 'F-007' },
  2015: { libelle: 'JIQ', fait: 'F-020' },
  2019: { libelle: '1 sem.', fait: 'F-024' },
}
export const JIQ_REPORTEE = { 2020: { libelle: 'reportée', fait: 'F-025' } }

// Les canaux : des fils qui traversent les époques (faits-par-epoque, « Fils entre époques »).
// cartes : les faits dont l'énoncé s'ouvre pendant le passage ; points : tous les faits du canal.
export const CANAUX = [
  {
    id: 'jiq', nom: 'JIQ · éditions', court: 'JIQ',
    question: 'Ce que les sources savent des éditions',
    points: [
      { f: 'F-001', an: 1976 }, { f: 'F-007', an: 1985 }, { f: 'F-020', an: 2015 }, { f: 'F-022', an: 2018 },
      { f: 'F-024', an: 2019 }, { f: 'F-025', an: 2020 }, { f: 'F-026', an: 2021 }, { f: 'F-054', an: 2022 },
      { f: 'F-028', an: 2023 }, { f: 'F-057', an: 2024 }, { f: 'F-031', an: 2026 },
    ],
    cartes: ['F-001', 'F-007', 'F-022', 'F-024', 'F-025', 'F-031'],
    fin: '7 numéros écrits dans les sources · les autres années restent à écrire',
  },
  {
    id: 'internet', nom: 'Internet', court: 'Internet',
    question: 'D\'une adresse courriel à l\'horizon 2035',
    points: [{ f: 'F-009', an: 1988 }, { f: 'F-027', an: 2020.5 }, { f: 'F-031', an: 2026 }],
    cartes: ['F-009', 'F-027', 'F-031'],
    horizon: { an: 2035, texte: '2035 · horizon de la conférence (F-031)' },
    fin: 'Après 2035, aucune source : à écrire',
  },
  {
    id: 'releve', nom: 'Relève', court: 'Relève',
    question: 'La relève, de la soirée au conseil',
    points: [{ f: 'F-012', an: 2000.3 }, { f: 'F-065', an: 2017 }, { f: 'F-055', an: 2022.8 }, { f: 'F-067', an: 2024.5 }],
    cartes: ['F-012', 'F-065', 'F-055', 'F-067'],
    fin: '« Un message à toi-même en 2046 » : à écrire',
  },
  {
    id: 'regions', nom: 'Régions', court: 'Régions',
    question: 'Le réseau dans les régions du Québec',
    points: [
      { f: 'F-033', an: 1979.8 }, { f: 'F-034', an: 1991 }, { f: 'F-034', an: 1993 }, { f: 'F-034', an: 1999 },
      { f: 'F-034', an: 2001 }, { f: 'F-034', an: 2008 }, { f: 'F-018', an: 2013.5 }, { f: 'F-068', an: 2018.5 },
      { f: 'F-078', an: 2024 },
    ],
    cartes: ['F-033', 'F-034', 'F-018', 'F-068', 'F-078'],
    fin: 'Les prochaines années : votre région, à écrire',
  },
  {
    id: 'octas', nom: 'Reconnaissance · OCTAS', court: 'OCTAS',
    question: 'Reconnaître l\'excellence, depuis 1987',
    points: [{ f: 'F-008', an: 1987 }, { f: 'F-010', an: 1993 }, { f: 'F-014', an: 2005.4 }, { f: 'F-015', an: 2008.4 }, { f: 'F-062', an: 2025.4 }],
    cartes: ['F-008', 'F-010', 'F-014', 'F-062'],
    fin: 'Les lauréats de demain : à écrire',
  },
  {
    id: 'nom', nom: 'Organisation · nom', court: 'Nom',
    question: 'De la Fédération au Réseau',
    points: [{ f: 'F-003', an: 1977.6 }, { f: 'F-004', an: 1977.8 }, { f: 'F-011', an: 1998 }, { f: 'F-016', an: 2008.7 }, { f: 'F-082', an: 2024 }],
    cartes: ['F-003', 'F-011', 'F-016', 'F-082'],
    fin: 'Le prochain nom ? À écrire',
  },
  {
    id: 'rayonnement', nom: 'Rayonnement', court: 'Rayonnement',
    question: 'Au-delà du Québec',
    points: [{ f: 'F-002', an: 1976 }, { f: 'F-070', an: 1998 }, { f: 'F-052', an: 2019 }, { f: 'F-072', an: 2023.5 }, { f: 'F-079', an: 2025 }],
    cartes: ['F-002', 'F-070', 'F-052', 'F-079'],
    fin: 'Votre idée pour faire rayonner les TI : à écrire',
  },
]

export const CANAL_PUBLIC = { id: 'public', nom: 'Vous · transmissions', court: 'Vous' }

// Contributions simulées : génériques (attentes, souhaits), jamais un souvenir d'un événement réel.
export const EXEMPLES = [
  { type: 'attente', an: 2026, texte: 'Comprendre ce que l\'IA change pour une PME comme la mienne.' },
  { type: 'souhait', an: 2031, texte: 'Une JIQ où chaque région du Québec envoie sa délégation.' },
  { type: 'attente', an: 2026, texte: 'Rencontrer des gens qui recrutent en cybersécurité.' },
  { type: 'souhait', an: 2046, texte: 'Que mes enfants viennent y présenter leur propre projet.' },
  { type: 'souhait', an: 2036, texte: 'Que la relève prenne la parole sur la grande scène.' },
  { type: 'souhait', an: 2040, texte: 'Que le français reste une langue des TI, ici et ailleurs.' },
  { type: 'attente', an: 2026, texte: 'Repartir avec une idée à essayer lundi matin.' },
  { type: 'souhait', an: 2035, texte: 'Comparer en 2035 l\'Internet annoncé et celui qu\'on aura.' },
]

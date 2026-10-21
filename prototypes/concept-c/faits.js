// Faits affichés : énoncés repris tels quels de etape-3/faits-par-epoque.md (0.2).
// Aucun effectif (membres, contacts, bénévoles) : D-055.
// F-009 (adresse courriel de l'Université Laval, 1988) n'est pas utilisé : il ne concerne pas le Réseau.

export const SCENE_1 = {
  id: 'scene1',
  periode: '1976-1986',
  titre: "1976-1986 · l'écran à caractères",
  faits: [
    { id: 'F-001', date: 'avril 1976', enonce: "Première Journée de l'informatique du Québec, à Québec", sources: 'S-001, S-004' },
    { id: 'F-002', date: '1976', enonce: "Présidée par Hervé Carpentier, organisée par l'ACI et l'ACFOR", sources: 'S-001' },
    { id: 'F-003', date: '26 août 1977', enonce: "La Fédération de l'informatique du Québec est fondée à Québec", sources: 'S-001, S-018' },
    { id: 'F-033', date: '12 octobre 1979', enonce: 'Premières sections régionales : Montréal et Québec', sources: 'S-018' },
    { id: 'F-007', date: '1985', enonce: 'En pleine campagne, le premier ministre Pierre-Marc Johnson visite la JIQ', sources: 'S-004' },
  ],
  note: 'F-001 et F-007 : niveau de preuve B* (DT-002), une source à recouper.',
}

export const SCENE_2 = {
  id: 'scene2',
  periode: '1991-2008',
  titre: '1991-2008 · le Web des débuts',
  faits: [
    { id: 'F-034', date: '1991 à 2008', enonce: 'Sections en Estrie, Laval-Laurentides-Lanaudière, Saguenay–Lac-Saint-Jean, Mauricie, Outaouais', sources: 'S-018' },
    { id: 'F-010', date: '1993', enonce: "Pitch Expert, du CRIM et de Paprican, reçoit l'OCTAS de l'innovation", sources: 'S-014' },
    { id: 'F-012', date: 'avril 2000', enonce: 'Premières Soirées Reconnaissance de la relève étudiante en informatique', sources: 'S-001' },
    { id: 'F-014', date: '28 mai 2005', enonce: '19e concours des OCTAS, au Palais des congrès de Montréal', sources: 'S-012' },
    { id: 'F-016', date: 'septembre à novembre 2008', enonce: 'La FiQ devient le Réseau ACTION TI', sources: 'S-001, S-005' },
  ],
}

export const AUJOURD_HUI = [
  { id: 'F-031', date: '18 novembre 2026', enonce: "Vint Cerf ouvre la 47e JIQ : « L'évolution d'Internet, des origines à 2035 »", sources: 'S-003' },
  { id: 'F-030', date: '2026 (page non datée)', enonce: '« 50 années à contribuer au développement du secteur des TI au Québec »', sources: 'S-002' },
]

// Exemples simulés : souhaits et idées génériques, jamais le souvenir d'un événement réel.
export const EXEMPLES_SIMULES = [
  { id: 'ex-1', genre: 'Idée pour faire rayonner les TI', texte: 'Des stages partagés entre PME de régions différentes.', signature: 'Exemple simulé', simule: 'exemple' },
  { id: 'ex-2', genre: 'Souhait pour 2046', texte: 'Que la relève trouve sa place dans chaque région du Québec.', signature: 'Exemple simulé', simule: 'exemple' },
]

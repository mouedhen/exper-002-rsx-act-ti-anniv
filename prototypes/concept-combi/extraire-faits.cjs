// Recopie date, énoncé et sources des faits de la combinaison depuis etape-3/faits-par-epoque.md.
// Usage, depuis prototypes/ : node concept-combi/extraire-faits.cjs  →  réécrit concept-combi/faits-ref.js
// Ne pas modifier faits-ref.js à la main. Même méthode que concept-c/extraire-faits.cjs (constat C-4).
const fs = require('fs')
const path = require('path')

const REFERENCE = '/mnt/project-files/exp-002/etape-3/faits-par-epoque.md'
const IDS = [
  // Décor 1 · l'écran à caractères (repris de C)
  'F-001', 'F-002', 'F-003', 'F-033', 'F-007',
  // Décor 2 · la page web (repris de C)
  'F-034', 'F-010', 'F-012', 'F-014', 'F-016',
  // Décor 3 · l'interface du futur : le « futur d'hier » écrit par le Réseau, et l'horizon de 2035
  'F-078', 'F-079', 'F-081',
  // Fil « Aujourd'hui · 2026 » (F-031 sert aussi de repère 2035 dans le décor 3)
  'F-031', 'F-030',
]

function lireReference(fichier = REFERENCE) {
  const faits = {}
  for (const ligne of fs.readFileSync(fichier, 'utf8').split('\n')) {
    if (!/^\| F-\d{3} \|/.test(ligne)) continue
    const cases = ligne.split('|').slice(1, -1).map((c) => c.trim())
    const [id, date, enonce, sources] = cases
    if (!faits[id]) faits[id] = { date, enonce, sources }
  }
  return faits
}

if (require.main === module) {
  const ref = lireReference()
  const sortie = {}
  for (const id of IDS) {
    if (!ref[id]) throw new Error(`${id} absent de la référence`)
    sortie[id] = ref[id]
  }
  const js = `// Généré par extraire-faits.cjs depuis etape-3/faits-par-epoque.md (v0.2). Ne pas modifier à la main.\nexport const REF = ${JSON.stringify(sortie, null, 2)}\n`
  fs.writeFileSync(path.join(__dirname, 'faits-ref.js'), js)
  console.log(`${IDS.length} faits recopiés dans faits-ref.js`)
}

module.exports = { lireReference, IDS, REFERENCE }

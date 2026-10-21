// Recopie date, énoncé et sources des faits du concept C depuis etape-3/faits-par-epoque.md (constat C-4).
// Usage, depuis prototypes/ : node concept-c/extraire-faits.cjs  →  réécrit concept-c/faits-ref.js
// Ne pas modifier faits-ref.js à la main.
const fs = require('fs')
const path = require('path')

const REFERENCE = '/mnt/project-files/exp-002/etape-3/faits-par-epoque.md'
const IDS = ['F-001', 'F-002', 'F-003', 'F-033', 'F-007', 'F-034', 'F-010', 'F-012', 'F-014', 'F-016', 'F-031', 'F-030']

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

// Liaison locale entre le formulaire et le mur, sur le même portable, sans réseau (D-051).
// BroadcastChannel relie les onglets et l'iframe de la même origine ; rien ne quitte l'appareil.
const NOM = 'concept-b-transmissions'
const CLE = 'concept-b-transmissions-demo'

let bc = null
try { bc = new BroadcastChannel(NOM) } catch { bc = null }

export function envoyer(message) {
  if (bc) bc.postMessage(message)
}

export function ecouter(fn) {
  if (bc) bc.addEventListener('message', (e) => fn(e.data))
}

// Mémoire de la démo : le navigateur seulement, effaçable d'un bouton (« effacée après la démo »).
export function lireMemoire() {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]') } catch { return [] }
}
export function ecrireMemoire(liste) {
  try { localStorage.setItem(CLE, JSON.stringify(liste.slice(-60))) } catch { /* stockage indisponible */ }
}
export function effacerMemoire() {
  try { localStorage.removeItem(CLE) } catch { /* rien */ }
}

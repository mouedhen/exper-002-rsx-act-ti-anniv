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

// Mémoire de la démo : la page du mur seulement (B-6). Rien n'est écrit dans le navigateur ;
// un rechargement efface tout. On purge aussi la clé laissée par la version précédente.
export function purgerAncienneMemoire() {
  try { localStorage.removeItem(CLE) } catch { /* stockage indisponible */ }
}

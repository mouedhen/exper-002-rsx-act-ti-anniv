// Canal entre le formulaire et le mur, sur le même portable, sans réseau (D-051).
// BroadcastChannel relie deux onglets ou fenêtres de la même origine ; rien ne sort de la machine.
const NOM = 'concept-a-2046'

export function ouvrirCanal(surMessage) {
  const canal = new BroadcastChannel(NOM)
  if (surMessage) canal.onmessage = (e) => surMessage(e.data)
  return {
    envoyer: (msg) => canal.postMessage(msg),
    fermer: () => canal.close(),
  }
}

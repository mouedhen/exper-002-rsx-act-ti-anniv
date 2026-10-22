// Canal local entre le formulaire et le mur, sur le même portable, sans réseau (D-051).
// BroadcastChannel ne quitte pas le navigateur ; rien n'est enregistré : tout s'efface à la fermeture.
const NOM = 'concept-combi-contributions'

export function ouvrirCanal(surMessage) {
  const canal = new BroadcastChannel(NOM)
  if (surMessage) canal.addEventListener('message', (e) => surMessage(e.data))
  return canal
}

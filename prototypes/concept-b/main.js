// Aiguillage des deux vues : le mur (par défaut) et le formulaire au format téléphone (?vue=formulaire).
const params = new URLSearchParams(location.search)

if (params.get('vue') === 'formulaire') {
  document.body.classList.add('vue-formulaire')
  import('./formulaire.js').then((m) => m.monterFormulaire(document.getElementById('app'), params))
} else {
  document.body.classList.add('vue-mur')
  import('./mur.js').then((m) => m.monterMur(document.getElementById('app'), params))
}

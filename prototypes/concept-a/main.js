// Aiguillage des deux vues, sur la même page pour que le build Vite (concept-a/index.html) les contienne.
const vue = new URLSearchParams(location.search).get('vue')

if (vue === 'formulaire') {
  document.body.classList.add('vue-formulaire')
  document.title = 'Écrire 2046 · formulaire'
  import('./formulaire.js').then((m) => m.demarrerFormulaire(document.getElementById('app')))
} else {
  document.body.classList.add('vue-mur')
  import('./mur.js').then((m) => m.demarrerMur(document.getElementById('app')))
}

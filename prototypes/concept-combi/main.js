// Deux vues dans la même page : le mur (par défaut) et le formulaire (?vue=formulaire).
import { monterMur } from './mur.js'
import { monterFormulaire } from './formulaire.js'

const vue = new URLSearchParams(location.search).get('vue')
const app = document.getElementById('app')

if (vue === 'formulaire') {
  document.body.classList.add('vue-formulaire')
  document.title = 'Formulaire · Combinaison'
  monterFormulaire(app)
} else {
  document.body.classList.add('vue-mur')
  monterMur(app)
}

// Formulaire de contribution, format téléphone (conçu pour 360 px).
// Ouvert sur le même portable que le mur ; la phrase passe par un canal local (D-051), rien n'est enregistré.
import { ouvrirCanal } from './canal.js'

const MAX = 140

export function monterFormulaire(app) {
  app.innerHTML = `
<main class="tel">
  <header>
    <p class="surtitre">50 ans du Réseau ACTION TI · démo</p>
    <h1>Votre mot pour le mur</h1>
    <p class="avis"><strong>Démo hors ligne.</strong> Votre phrase reste sur ce portable, s'affiche marquée « simulée » et s'efface à la fin de la démo.</p>
  </header>
  <form id="form" novalidate>
    <fieldset>
      <legend>Votre mot est…</legend>
      <label class="choix"><input type="radio" name="genre" value="Souhait pour 2046" checked> Un souhait pour 2046</label>
      <label class="choix"><input type="radio" name="genre" value="Idée pour faire rayonner les TI"> Une idée pour faire rayonner les TI</label>
      <label class="choix"><input type="radio" name="genre" value="Témoignage"> Un témoignage</label>
    </fieldset>
    <div class="champ">
      <label for="texte">Votre phrase <span class="oblig">(obligatoire)</span></label>
      <textarea id="texte" name="texte" rows="3" maxlength="${MAX}" aria-describedby="aide-texte compteur" required></textarea>
      <p id="aide-texte" class="aide">Elle arrive dans l'interface d'aujourd'hui, puis vieillit dans le décor d'une autre époque.</p>
      <p id="compteur" class="aide" aria-live="polite">0 sur ${MAX} caractères</p>
      <p id="err-texte" class="erreur" hidden></p>
    </div>
    <div class="champ">
      <label for="signature">Prénom ou initiales <span class="oblig">(facultatif)</span></label>
      <input id="signature" name="signature" type="text" maxlength="30" autocomplete="off">
    </div>
    <div class="consent">
      <input type="checkbox" id="consent" name="consent" aria-describedby="err-consent">
      <label for="consent">J'accepte que ma phrase s'affiche sur le mur pendant cette démo. J'ai 14 ans ou plus, ou un parent est d'accord. Je peux la retirer à tout moment.</label>
    </div>
    <p id="err-consent" class="erreur" hidden></p>
    <button type="submit" class="envoyer">Envoyer au mur</button>
  </form>
  <section id="etat" class="etat" aria-live="polite" hidden>
    <p id="etat-texte"></p>
    <button type="button" id="retirer" class="secondaire" hidden>Retirer ma phrase du mur</button>
    <button type="button" id="encore" class="secondaire" hidden>Écrire une autre phrase</button>
  </section>
  <p class="pied">Au palier 2, une personne du Réseau validerait chaque phrase avant l'affichage. Ici, la validation est simulée.</p>
</main>`

  const canal = ouvrirCanal()
  const form = document.getElementById('form')
  const texte = document.getElementById('texte')
  const signature = document.getElementById('signature')
  const consent = document.getElementById('consent')
  const compteur = document.getElementById('compteur')
  const errTexte = document.getElementById('err-texte')
  const errConsent = document.getElementById('err-consent')
  const etat = document.getElementById('etat')
  const etatTexte = document.getElementById('etat-texte')
  const btnRetirer = document.getElementById('retirer')
  const btnEncore = document.getElementById('encore')
  let dernierId = null

  texte.addEventListener('input', () => { compteur.textContent = `${texte.value.length} sur ${MAX} caractères` })

  function erreur(champ, el, msg) {
    el.textContent = msg
    el.hidden = !msg
    champ.setAttribute('aria-invalid', msg ? 'true' : 'false')
    if (msg) champ.setAttribute('aria-errormessage', el.id)
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const t = texte.value.trim()
    erreur(texte, errTexte, t ? '' : 'Écrivez une phrase avant d\'envoyer.')
    erreur(consent, errConsent, consent.checked ? '' : 'Cochez l\'accord pour que la phrase puisse s\'afficher.')
    if (!t) { texte.focus(); return }
    if (!consent.checked) { consent.focus(); return }

    const genre = form.querySelector('input[name="genre"]:checked').value
    dernierId = `demo-${Date.now()}`
    const contribution = { type: 'ajout', id: dernierId, genre, texte: t.slice(0, MAX), signature: signature.value.trim().slice(0, 30) }
    form.hidden = true
    etat.hidden = false
    btnRetirer.hidden = true
    btnEncore.hidden = true
    etatTexte.textContent = 'Merci. Votre phrase est en attente de validation.'
    // Modération simulée : approbation automatique après un court délai.
    setTimeout(() => {
      canal.postMessage(contribution)
      etatTexte.textContent = 'Validée (modération simulée) : votre phrase est sur le mur, marquée « simulée ».'
      btnRetirer.hidden = false
      btnEncore.hidden = false
      btnRetirer.focus()
    }, 1500)
  })

  btnRetirer.addEventListener('click', () => {
    if (dernierId) canal.postMessage({ type: 'retrait', id: dernierId })
    etatTexte.textContent = 'Votre phrase a été retirée du mur.'
    btnRetirer.hidden = true
    btnEncore.focus()
  })

  btnEncore.addEventListener('click', () => {
    form.reset()
    compteur.textContent = `0 sur ${MAX} caractères`
    etat.hidden = true
    form.hidden = false
    texte.focus()
  })
}

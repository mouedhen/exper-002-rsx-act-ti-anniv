// Formulaire de contribution, format téléphone (conçu pour 360 px).
// Ouvert sur le même portable que le mur ; la phrase passe par un canal local (D-051), rien n'est enregistré.
// Itération 2 : cases de consentement distinctes (C-2), prénom affiché seulement sur demande (C-3),
// avis court et code de retrait (T-1), retrait possible pour chaque phrase envoyée (C-9).
import { ouvrirCanal } from './canal.js'

const MAX = 140
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Code de retrait court, lisible à voix haute (sans 0, O, 1, I). Il sert aussi d'identifiant de la phrase.
function nouveauCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = 'C-'
  for (let i = 0; i < 4; i++) c += a[Math.floor(Math.random() * a.length)]
  return c
}

export function monterFormulaire(app) {
  app.innerHTML = `
<main class="tel">
  <header>
    <p class="surtitre">50 ans du Réseau ACTION TI · démo</p>
    <p class="non-officiel">Proposition non officielle · prototype</p>
    <h1>Votre mot pour le mur</h1>
    <section class="avis" aria-labelledby="avis-titre">
      <h2 id="avis-titre">Avant d'écrire (avis simulé)</h2>
      <ul>
        <li><strong>Qui recueillerait :</strong> l'organisateur (à confirmer, par exemple le Réseau ACTION TI). Ici, personne : c'est une démo hors ligne.</li>
        <li><strong>Pourquoi :</strong> afficher votre phrase sur le mur des 50 ans, rien d'autre.</li>
        <li><strong>Combien de temps :</strong> pendant la démo seulement ; la phrase reste sur ce portable et s'efface à la fin. Au palier 2 : pendant l'événement, puis effacée.</li>
        <li><strong>Comment retirer :</strong> avec le bouton « Retirer » après l'envoi, ou plus tard avec le code de retrait affiché après l'envoi (en bas de cette page, ou auprès de l'équipe du stand).</li>
      </ul>
    </section>
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
      <p id="aide-texte" class="aide">Elle arrive dans l'interface d'aujourd'hui, puis vieillit dans le décor d'une autre époque. Ne nommez personne.</p>
      <p id="compteur" class="aide" aria-live="polite">0 sur ${MAX} caractères</p>
      <p id="err-texte" class="erreur" hidden></p>
    </div>
    <div class="consent">
      <input type="checkbox" id="consent-affichage" name="consent-affichage" aria-describedby="err-affichage">
      <label for="consent-affichage">J'accepte que ma phrase s'affiche sur le mur pendant cette démo. <span class="oblig">(obligatoire)</span></label>
    </div>
    <p id="err-affichage" class="erreur" hidden></p>
    <div class="consent">
      <input type="checkbox" id="consent-age" name="consent-age" aria-describedby="aide-age err-age">
      <label for="consent-age">J'ai 14 ans ou plus. <span class="oblig">(obligatoire)</span></label>
    </div>
    <p id="aide-age" class="aide">Moins de 14 ans : un parent doit donner son accord ; demandez à l'équipe du stand. Ce prototype ne recueille pas la phrase.</p>
    <p id="err-age" class="erreur" hidden></p>
    <div class="consent">
      <input type="checkbox" id="consent-prenom" name="consent-prenom" aria-controls="champ-prenom">
      <label for="consent-prenom">Afficher mon prénom ou mes initiales avec ma phrase. <span class="oblig">(facultatif ; sinon : « un visiteur »)</span></label>
    </div>
    <div class="champ" id="champ-prenom" hidden>
      <label for="signature">Prénom ou initiales</label>
      <input id="signature" name="signature" type="text" maxlength="30" autocomplete="off">
    </div>
    <button type="submit" class="envoyer">Envoyer au mur</button>
  </form>
  <section id="etat" class="etat" aria-live="polite" hidden>
    <p id="etat-texte"></p>
    <p id="code-texte" class="code" hidden></p>
    <button type="button" id="encore" class="secondaire" hidden>Écrire une autre phrase</button>
  </section>
  <section id="envoyees" class="envoyees" aria-labelledby="envoyees-titre" hidden>
    <h2 id="envoyees-titre">Vos phrases sur le mur</h2>
    <ul id="liste-envoyees"></ul>
  </section>
  <section class="retrait-code" aria-labelledby="retrait-titre">
    <h2 id="retrait-titre">Retirer une phrase avec son code</h2>
    <label for="code">Code de retrait (par exemple C-7KQ2)</label>
    <div class="ligne-code">
      <input id="code" type="text" maxlength="6" autocomplete="off" autocapitalize="characters" aria-describedby="code-etat">
      <button type="button" id="retirer-code" class="secondaire">Retirer</button>
    </div>
    <p id="code-etat" class="aide" aria-live="polite"></p>
  </section>
  <p class="pied">Au palier 2, une personne validerait chaque phrase avant l'affichage. Ici, la validation est simulée.</p>
</main>`

  const canal = ouvrirCanal((m) => surReponse(m))
  const $ = (id) => document.getElementById(id)
  const form = $('form')
  const texte = $('texte')
  const signature = $('signature')
  const cAffichage = $('consent-affichage')
  const cAge = $('consent-age')
  const cPrenom = $('consent-prenom')
  const champPrenom = $('champ-prenom')
  const compteur = $('compteur')
  const etat = $('etat')
  const etatTexte = $('etat-texte')
  const codeTexte = $('code-texte')
  const btnEncore = $('encore')
  const envoyees = $('envoyees')
  const listeEnvoyees = $('liste-envoyees')

  texte.addEventListener('input', () => { compteur.textContent = `${texte.value.length} sur ${MAX} caractères` })
  cPrenom.addEventListener('change', () => {
    champPrenom.hidden = !cPrenom.checked
    if (!cPrenom.checked) signature.value = ''
  })

  function erreur(champ, el, msg) {
    el.textContent = msg
    el.hidden = !msg
    champ.setAttribute('aria-invalid', msg ? 'true' : 'false')
    if (msg) champ.setAttribute('aria-errormessage', el.id)
    else champ.removeAttribute('aria-errormessage')
  }

  // Une entrée par phrase envoyée, chacune avec son propre bouton de retrait (C-9).
  function ajouterEnvoyee(id, t) {
    const li = document.createElement('li')
    li.dataset.id = id
    li.innerHTML = `<p class="extrait">« ${esc(t.length > 60 ? t.slice(0, 59) + '…' : t)} »</p><p class="aide">Code de retrait : <strong>${esc(id)}</strong></p><button type="button" class="secondaire retirer-phrase">Retirer cette phrase du mur</button>`
    li.querySelector('button').addEventListener('click', () => retirer(id))
    listeEnvoyees.prepend(li)
    envoyees.hidden = false
  }

  // N-2 (itération 3) : « retirée » n'est affiché qu'à la réponse du mur (retiree ou inconnu), comme en B.
  const delais = new Map()
  function retirer(id) {
    canal.postMessage({ type: 'retrait', id })
    clearTimeout(delais.get(id))
    delais.set(id, setTimeout(() => {
      delais.delete(id)
      $('code-etat').textContent = `Le mur n'a pas répondu pour ${id} : ouvrez-le sur ce portable.`
    }, 3000))
  }
  function surReponse(msg) {
    if (!msg || (msg.type !== 'retiree' && msg.type !== 'inconnu')) return
    const id = String(msg.id)
    if (!delais.has(id)) return // réponse à une autre page
    clearTimeout(delais.get(id)); delais.delete(id)
    if (msg.type === 'inconnu') {
      $('code-etat').textContent = `Aucune phrase ne porte le code ${id} sur le mur.`
      return
    }
    const li = listeEnvoyees.querySelector(`[data-id="${CSS.escape(id)}"]`)
    if (li && !li.classList.contains('retiree')) {
      li.classList.add('retiree')
      li.querySelector('button')?.remove()
      li.insertAdjacentHTML('beforeend', '<p class="aide"><strong>Retirée du mur.</strong></p>')
    }
    etatTexte.textContent = `La phrase ${id} a été retirée du mur.`
    $('code-etat').textContent = `Retrait confirmé par le mur (${id}).`
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const t = texte.value.trim()
    erreur(texte, $('err-texte'), t ? '' : 'Écrivez une phrase avant d\'envoyer.')
    erreur(cAffichage, $('err-affichage'), cAffichage.checked ? '' : 'Cochez l\'accord d\'affichage pour que la phrase puisse s\'afficher.')
    erreur(cAge, $('err-age'), cAge.checked ? '' : 'Cette démo recueille seulement les phrases des personnes de 14 ans ou plus.')
    if (!t) { texte.focus(); return }
    if (!cAffichage.checked) { cAffichage.focus(); return }
    if (!cAge.checked) { cAge.focus(); return }

    const genre = form.querySelector('input[name="genre"]:checked').value
    const id = nouveauCode()
    // Sans la case « Afficher mon prénom », le prénom n'est pas envoyé du tout (C-3).
    const sign = cPrenom.checked ? signature.value.trim().slice(0, 30) : ''
    const contribution = { type: 'ajout', id, genre, texte: t.slice(0, MAX), signature: sign }
    form.hidden = true
    etat.hidden = false
    btnEncore.hidden = true
    codeTexte.hidden = true
    etatTexte.textContent = 'Merci. Votre phrase est en attente de validation.'
    // Modération simulée : approbation automatique après un court délai.
    setTimeout(() => {
      canal.postMessage(contribution)
      etatTexte.textContent = 'Validée (modération simulée) : votre phrase est sur le mur, marquée « simulée ».'
      codeTexte.innerHTML = `Votre code de retrait : <strong>${esc(id)}</strong>. Notez-le : il permet de retirer la phrase même après avoir fermé cette page (démo : tant que le mur reste ouvert).`
      codeTexte.hidden = false
      ajouterEnvoyee(id, contribution.texte)
      btnEncore.hidden = false
      listeEnvoyees.querySelector('button')?.focus()
    }, 1500)
  })

  btnEncore.addEventListener('click', () => {
    form.reset()
    champPrenom.hidden = true
    compteur.textContent = `0 sur ${MAX} caractères`
    etat.hidden = true
    form.hidden = false
    texte.focus()
  })

  $('retirer-code').addEventListener('click', () => {
    const code = $('code').value.trim().toUpperCase()
    const ok = /^C-[A-Z2-9]{4}$/.test(code)
    $('code-etat').textContent = ok ? `Demande de retrait envoyée au mur pour ${code}.` : 'Code attendu : C- suivi de quatre caractères.'
    $('code').setAttribute('aria-invalid', ok ? 'false' : 'true')
    if (ok) retirer(code)
  })
}

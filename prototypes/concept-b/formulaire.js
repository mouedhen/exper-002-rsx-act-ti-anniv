// Formulaire de contribution, conçu pour 360 px de large.
// Il transmet au mur ouvert sur le même portable (BroadcastChannel), sans réseau (D-051).
import { envoyer, ecouter } from './canal.js'

const LIBELLES = {
  attente: 'Une attente pour aujourd\'hui',
  souhait: 'Un souhait pour une année à venir',
  souvenir: 'Un vrai souvenir d\'une JIQ passée',
}

export function monterFormulaire(racine, params) {
  if (params.get('integre') === '1') document.body.classList.add('integre')
  const optionsAvenir = Array.from({ length: 20 }, (_, i) => 2027 + i)
    .map((a) => `<option value="${a}"${a === 2046 ? ' selected' : ''}>${a}</option>`).join('')
  const optionsPasse = Array.from({ length: 50 }, (_, i) => 2025 - i)
    .map((a) => `<option value="${a}">${a}</option>`).join('')

  racine.innerHTML = `
  <main class="tel">
    <header class="tel-entete">
      <p class="tel-marque">JIQ 2026 · 50 années</p>
      <h1>Écrivez la suite du mur</h1>
      <p class="tel-demo" role="note"><strong>Démonstration.</strong> Aucune donnée ne quitte ce portable. Votre phrase est marquée « saisie en démo » et s'efface d'un bouton.</p>
    </header>
    <form id="form" novalidate>
      <fieldset>
        <legend>1. Vous transmettez…</legend>
        ${Object.entries(LIBELLES).map(([v, l], i) => `
          <label class="choix"><input type="radio" name="type" value="${v}"${i === 0 ? ' checked' : ''}> <span>${l}</span></label>`).join('')}
      </fieldset>

      <div class="champ" id="bloc-avenir" hidden>
        <label for="an-avenir">Vers quelle année ?</label>
        <select id="an-avenir" name="anAvenir">${optionsAvenir}</select>
        <p class="aide" id="aide-avenir">Votre souhait se dépose dans la case de cette année, sur le mur.</p>
      </div>

      <div class="champ" id="bloc-passe" hidden>
        <label for="an-passe">En quelle année ?</label>
        <select id="an-passe" name="anPasse" aria-describedby="aide-passe">${optionsPasse}</select>
        <p class="aide" id="aide-passe">Seulement ce que vous avez vécu. Nommez le moins de personnes possible. Le mur l'affiche comme un témoignage, pas comme un fait.</p>
      </div>

      <div class="champ">
        <label for="phrase">2. Votre phrase</label>
        <textarea id="phrase" name="phrase" rows="3" maxlength="120" required aria-describedby="compte aide-phrase"></textarea>
        <p class="aide"><span id="aide-phrase">Une phrase, 120 caractères au plus.</span> <span id="compte" aria-live="polite">0 / 120</span></p>
      </div>

      <div class="champ consent">
        <input type="checkbox" id="accord" name="accord" required aria-describedby="aide-accord">
        <label for="accord">3. J'accepte que ma phrase s'affiche sur le mur, signée « un visiteur ».</label>
        <p class="aide" id="aide-accord">Au palier 2, ce consentement serait limité dans le temps, avec un retrait simple (Loi 25).</p>
      </div>

      <p class="erreur" id="erreur" role="alert"></p>
      <button type="submit" class="envoyer">Transmettre au mur</button>
    </form>
    <section class="etat" aria-live="polite" id="etat"></section>
    <footer class="tel-pied">Prototype jetable, concept B · modération simulée</footer>
  </main>`

  const form = racine.querySelector('#form')
  const phrase = racine.querySelector('#phrase')
  const compte = racine.querySelector('#compte')
  const etat = racine.querySelector('#etat')
  const erreur = racine.querySelector('#erreur')
  const blocAvenir = racine.querySelector('#bloc-avenir')
  const blocPasse = racine.querySelector('#bloc-passe')
  let attendu = null
  let delaiSansMur = null

  const majType = () => {
    const t = form.type.value
    blocAvenir.hidden = t !== 'souhait'
    blocPasse.hidden = t !== 'souvenir'
  }
  form.addEventListener('change', majType)
  majType()
  phrase.addEventListener('input', () => { compte.textContent = `${phrase.value.length} / 120` })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    erreur.textContent = ''
    phrase.removeAttribute('aria-invalid')
    if (!phrase.value.trim()) {
      erreur.textContent = 'Écrivez une phrase avant de transmettre.'
      phrase.setAttribute('aria-invalid', 'true')
      phrase.focus()
      return
    }
    if (!form.accord.checked) {
      erreur.textContent = 'Cochez l\'accord pour que la phrase s\'affiche.'
      form.accord.focus()
      return
    }
    const type = form.type.value
    const an = type === 'attente' ? 2026 : Number(type === 'souhait' ? form.anAvenir.value : form.anPasse.value)
    const id = `t-${Date.now().toString(36)}`
    attendu = id
    envoyer({ genre: 'transmission', id, type, an, texte: phrase.value.trim().slice(0, 120), origine: 'demo' })
    etat.innerHTML = `<p class="etat-ligne"><span class="pastille attente" aria-hidden="true"></span> Transmise. <strong>En attente de validation</strong>.</p>`
    form.reset()
    majType()
    compte.textContent = '0 / 120'
    clearTimeout(delaiSansMur)
    delaiSansMur = setTimeout(() => {
      if (attendu === id) etat.innerHTML += '<p class="etat-ligne">Le mur n\'a pas répondu : ouvrez-le sur ce portable.</p>'
    }, 4000)
  })

  ecouter((m) => {
    if (!m || m.id !== attendu) return
    if (m.genre === 'recu') {
      clearTimeout(delaiSansMur)
    } else if (m.genre === 'approuvee') {
      clearTimeout(delaiSansMur)
      etat.innerHTML = `<p class="etat-ligne"><span class="pastille ok" aria-hidden="true"></span> <strong>Approuvée</strong> (modération simulée). Regardez le mur : elle rejoint la case ${m.an}.</p>`
      attendu = null
    }
  })
}

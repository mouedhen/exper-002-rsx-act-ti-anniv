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
      <p class="tel-mention">Proposition non officielle · prototype</p>
      <h1>Écrivez la suite du mur</h1>
      <p class="tel-demo" role="note"><strong>Démonstration.</strong> Aucune donnée ne quitte ce portable. Votre phrase est marquée « saisie en démo » ; elle disparaît quand le mur est rechargé.</p>
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
        <p class="aide" id="aide-passe">Seulement ce que vous avez vécu. Ne nommez personne. Le mur l'affiche comme un témoignage, pas comme un fait.</p>
      </div>

      <div class="champ">
        <label for="phrase">2. Votre phrase</label>
        <textarea id="phrase" name="phrase" rows="3" maxlength="120" required aria-describedby="compte aide-phrase"></textarea>
        <p class="aide"><span id="aide-phrase">Une phrase, 120 caractères au plus. Ne nommez personne.</span> <span id="compte" aria-live="polite">0 / 120</span></p>
      </div>

      <section class="avis" id="avis" aria-labelledby="avis-t">
        <h2 id="avis-t">3. Avant de transmettre : vos renseignements</h2>
        <ul>
          <li><b>Qui recueillerait :</b> l'organisateur (à confirmer, par exemple le Réseau ACTION TI).</li>
          <li><b>Pourquoi :</b> afficher votre phrase sur le mur de la JIQ, rien d'autre. Ni nom ni courriel ne sont demandés.</li>
          <li><b>Combien de temps :</b> pendant l'événement seulement (durée à confirmer). En démo, la phrase disparaît au rechargement du mur.</li>
          <li><b>Comment retirer :</b> le bouton « Retirer ma phrase » après l'envoi, ou plus tard avec le code de retrait affiché après l'envoi (démo : tant que le mur reste ouvert).</li>
        </ul>
        <p class="avis-simule">Démo : cet avis et le code de retrait sont simulés.</p>
      </section>

      <div class="champ consent">
        <input type="checkbox" id="accord" name="accord" required>
        <label for="accord">J'accepte que ma phrase s'affiche sur le mur, signée « un visiteur ».</label>
      </div>
      <div class="champ consent">
        <input type="checkbox" id="age" name="age" required aria-describedby="aide-age">
        <label for="age">J'ai 14 ans ou plus.</label>
        <p class="aide" id="aide-age">Avant 14 ans, l'accord d'un parent est nécessaire (Loi 25).</p>
      </div>

      <p class="erreur" id="erreur" role="alert"></p>
      <button type="submit" class="envoyer">Transmettre au mur</button>
    </form>
    <section class="etat" aria-live="polite" id="etat"></section>
    <section class="envois" id="envois" hidden aria-labelledby="envois-t">
      <h2 id="envois-t">Vos phrases transmises</h2>
      <ul id="liste-envois"></ul>
    </section>
    <details class="par-code">
      <summary>Retirer une phrase avec un code</summary>
      <form id="form-code" novalidate>
        <label for="code">Code de retrait</label>
        <input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="aide-code">
        <p class="aide" id="aide-code">Le code affiché après l'envoi, par exemple B-7K3Q (démo : tant que le mur reste ouvert).</p>
        <button type="submit" class="retirer">Retirer cette phrase</button>
        <p class="etat-code" id="etat-code" aria-live="polite"></p>
      </form>
    </details>
    <footer class="tel-pied">Prototype jetable, concept B · modération simulée</footer>
  </main>`

  const form = racine.querySelector('#form')
  const phrase = racine.querySelector('#phrase')
  const compte = racine.querySelector('#compte')
  const etat = racine.querySelector('#etat')
  const erreur = racine.querySelector('#erreur')
  const blocAvenir = racine.querySelector('#bloc-avenir')
  const blocPasse = racine.querySelector('#bloc-passe')
  const listeEnvois = racine.querySelector('#liste-envois')
  const blocEnvois = racine.querySelector('#envois')
  const etatCode = racine.querySelector('#etat-code')
  let attendu = null
  let delaiSansMur = null
  const envois = new Map() // code de retrait → { texte, statut }

  // Code de retrait (simulé) : il sert aussi d'identifiant de la transmission sur le mur.
  const nouveauCode = () => {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const v = crypto.getRandomValues(new Uint8Array(4))
    return 'B-' + Array.from(v, (n) => A[n % A.length]).join('')
  }
  const echapper = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const majEnvois = () => {
    blocEnvois.hidden = envois.size === 0
    listeEnvois.innerHTML = [...envois].map(([code, e]) => `
      <li class="envoi" data-code="${code}">
        <p class="envoi-texte">« ${echapper(e.texte)} »</p>
        <p class="envoi-code">Code de retrait : <strong class="code">${code}</strong> (démo : tant que le mur reste ouvert)</p>
        ${e.statut === 'retiree'
          ? '<p class="envoi-statut">Retirée : elle n\'est plus sur le mur.</p>'
          : `<button type="button" class="retirer" data-code="${code}">Retirer ma phrase</button>`}
      </li>`).join('')
  }
  listeEnvois.addEventListener('click', (e) => {
    const b = e.target.closest('button.retirer')
    if (!b) return
    envoyer({ genre: 'retrait', id: b.dataset.code })
    const env = envois.get(b.dataset.code)
    if (env) env.statut = 'retiree'
    if (attendu === b.dataset.code) attendu = null
    majEnvois()
    etat.innerHTML = '<p class="etat-ligne">Phrase retirée du mur.</p>'
  })
  racine.querySelector('#form-code').addEventListener('submit', (e) => {
    e.preventDefault()
    const code = racine.querySelector('#code').value.trim().toUpperCase()
    if (!/^B-[A-Z0-9]{4}$/.test(code)) { etatCode.textContent = 'Ce code n\'a pas la bonne forme (B- suivi de 4 caractères).'; return }
    envoyer({ genre: 'retrait', id: code })
    etatCode.textContent = 'Demande de retrait envoyée au mur.'
  })

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
    if (!form.age.checked) {
      erreur.textContent = 'Confirmez votre âge, ou demandez l\'accord d\'un parent.'
      form.age.focus()
      return
    }
    const type = form.type.value
    const an = type === 'attente' ? 2026 : Number(type === 'souhait' ? form.anAvenir.value : form.anPasse.value)
    const id = nouveauCode()
    attendu = id
    envois.set(id, { texte: phrase.value.trim().slice(0, 120), statut: 'transmise' })
    majEnvois()
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
    if (m?.genre === 'retiree') {
      if (envois.has(m.id)) { envois.get(m.id).statut = 'retiree'; majEnvois() }
      etatCode.textContent = etatCode.textContent && `Retrait confirmé par le mur (${m.id}).`
      return
    }
    if (m?.genre === 'inconnu') { etatCode.textContent = `Aucune phrase ne porte le code ${m.id} sur le mur.`; return }
    if (!m || m.id !== attendu) return
    if (m.genre === 'recu') {
      clearTimeout(delaiSansMur)
      if (m.enPause) etat.innerHTML += '<p class="etat-ligne">Le mur est en pause : elle s\'affichera à la reprise.</p>'
    } else if (m.genre === 'approuvee') {
      clearTimeout(delaiSansMur)
      etat.innerHTML = `<p class="etat-ligne"><span class="pastille ok" aria-hidden="true"></span> <strong>Approuvée</strong> (modération simulée). Regardez le mur : elle rejoint la case ${m.an}.</p>`
      attendu = null
    }
  })
}

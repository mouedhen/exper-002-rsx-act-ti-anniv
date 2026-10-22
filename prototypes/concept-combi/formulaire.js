// Formulaire de contribution, format téléphone (conçu pour 360 px), repris du concept A :
// français et anglais, choix fermé d'abord, phrase facultative, consentement case par case, case 14 ans,
// avis « Qui recueillerait », retrait par bouton ou par code, avec réponse du mur.
// Ajout de B : le type (souhait ou vrai souvenir) et l'année choisie, qui décide du décor où la phrase s'imprime.
// Rien ne quitte le portable : la phrase passe au mur par BroadcastChannel (D-051) ; rien n'est enregistré.
import { CATEGORIES, DECORS, decorDe } from './donnees.js'
import { ouvrirCanal } from './canal.js'

const MAX = 120
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const T = {
  fr: {
    langue: 'English', langueNom: 'Switch to English',
    marque: '50 ans du Réseau ACTION TI · démo',
    mention: 'Proposition non officielle · prototype',
    titre: 'Votre phrase, dans le décor de son année',
    intro: 'Un vrai souvenir s’imprime dans l’écran de son époque ; un souhait se pose sur l’horizon 2027-2046. 30 secondes.',
    demo: 'Démo hors ligne : rien ne quitte ce portable. Ce que vous saisissez est effacé après la démo.',
    q1: 'Vous écrivez…',
    souhait: 'Un souhait pour une année à venir (2027-2046)',
    souvenir: 'Un vrai souvenir, vécu par vous (1976-2025)',
    q2: 'Votre phrase touche surtout',
    q3: 'Quelle année ?',
    choisirAn: '— choisir l’année —',
    decor: (k) => `Décor : ${DECORS[k].nom} (${DECORS[k].de}-${k === 2 ? 2025 : DECORS[k].a}).`,
    q4: 'Votre phrase',
    facultatif: '(facultatif)',
    aideSouhait: 'Un souhait, une idée. Ne nommez personne. Sans phrase, le mur affiche votre choix et votre année.',
    aideSouvenir: 'Seulement ce que vous avez vécu. Ne nommez personne. Le mur l’affiche comme un témoignage, pas comme un fait.',
    caracteres: 'caractères',
    avisTitre: 'Avant d’envoyer : vos renseignements',
    avisQui: '<b>Qui recueillerait :</b> l’organisateur (à confirmer, par exemple le Réseau ACTION TI). Ici, personne : c’est une démo hors ligne.',
    avisPourquoi: '<b>Pourquoi :</b> afficher votre phrase sur le mur des 50 ans, rien d’autre. Ni nom ni courriel ne sont demandés ; le mur signe « un visiteur ».',
    avisDuree: '<b>Combien de temps :</b> pendant l’événement seulement (durée à confirmer). En démo, tout est effacé à la fin.',
    avisRetrait: '<b>Comment retirer :</b> le bouton « Retirer » après l’envoi, ou plus tard avec le code de retrait, dans « Retirer avec un code » (démo : tant que le mur reste ouvert).',
    avisSimule: 'Démo : cet avis et le code de retrait sont simulés.',
    consent: 'Consentement, case par case',
    c1: 'J’accepte que ma phrase s’affiche sur le mur après validation par un modérateur.',
    c2: 'J’ai 14 ans ou plus.',
    c2aide: 'Avant 14 ans, l’accord d’un parent est nécessaire (Loi 25) : demandez à l’équipe du stand. Ce prototype ne recueille pas la phrase.',
    obligatoire: 'obligatoire',
    envoyer: 'Envoyer au mur',
    erreursTitre: 'À corriger :',
    errQ2: 'Choisissez ce que votre phrase touche surtout.',
    errAn: 'Choisissez l’année de votre souvenir.',
    errC1: 'Cochez l’affichage sur le mur pour envoyer.',
    errC2: 'Confirmez votre âge, ou demandez l’accord d’un parent.',
    attente: 'En attente de validation',
    attenteTexte: 'Un modérateur relit chaque phrase avant l’affichage.',
    approuver: 'Simuler l’approbation du modérateur (démo)',
    affichee: 'Envoyée au mur',
    afficheeTexte: (k, an) => `Regardez le mur : elle part vers ${an}, dans le décor « ${DECORS[k].nom} ».`,
    enPause: 'Le mur est en pause : elle s’affichera à la reprise.',
    murMuet: 'Le mur n’a pas répondu : ouvrez-le sur ce portable.',
    codeTitre: 'Votre code de retrait :',
    codeAide: 'Notez-le : il permet de retirer la phrase même après avoir fermé cette page (démo : tant que le mur reste ouvert).',
    retirer: 'Retirer cette phrase du mur',
    retraitDemande: 'Retrait demandé au mur…',
    retiree: 'Retirée du mur. Rien n’est conservé.',
    recommencer: 'Écrire une autre phrase',
    envoyees: 'Vos phrases envoyées',
    parCode: 'Retirer avec un code',
    codeLabel: 'Code de retrait',
    codeExemple: 'Le code affiché après l’envoi, par exemple R-7K3Q (démo : tant que le mur reste ouvert).',
    codeBouton: 'Retirer',
    codeForme: 'Ce code n’a pas la bonne forme (R- suivi de 4 caractères).',
    codeEnvoye: 'Demande de retrait envoyée au mur.',
    codeConfirme: (c) => `Retrait confirmé par le mur (${c}).`,
    codeInconnu: (c) => `Aucune phrase ne porte le code ${c} sur le mur.`,
    pour: 'pour', souvenirDe: 'souvenir de',
  },
  en: {
    langue: 'Français', langueNom: 'Passer en français',
    marque: 'Réseau ACTION TI turns 50 · demo',
    mention: 'Unofficial proposal · prototype',
    titre: 'Your sentence, in the setting of its year',
    intro: 'A real memory is printed on the screen of its time; a wish lands on the 2027-2046 horizon. 30 seconds.',
    demo: 'Offline demo: nothing leaves this laptop. What you type is erased after the demo.',
    q1: 'You are writing…',
    souhait: 'A wish for a year to come (2027-2046)',
    souvenir: 'A real memory, one you lived (1976-2025)',
    q2: 'Your sentence is mostly about',
    q3: 'Which year?',
    choisirAn: '— choose the year —',
    decor: (k) => `Setting: ${DECORS[k].nomEn} (${DECORS[k].de}-${k === 2 ? 2025 : DECORS[k].a}).`,
    q4: 'Your sentence',
    facultatif: '(optional)',
    aideSouhait: 'A wish, an idea. No names. Without a sentence, the wall shows your choice and your year.',
    aideSouvenir: 'Only what you lived yourself. No names. The wall shows it as a testimony, not as a fact.',
    caracteres: 'characters',
    avisTitre: 'Before you send: your information',
    avisQui: '<b>Who would collect it:</b> the organizer (to be confirmed, for example Réseau ACTION TI). Here, nobody: this is an offline demo.',
    avisPourquoi: '<b>Why:</b> to show your sentence on the 50th anniversary wall, nothing else. No name or email is asked for; the wall signs “a visitor”.',
    avisDuree: '<b>How long:</b> during the event only (length to be confirmed). In the demo, everything is erased at the end.',
    avisRetrait: '<b>How to withdraw:</b> the “Withdraw” button after sending, or later with the withdrawal code, under “Withdraw with a code” (demo: while the wall stays open).',
    avisSimule: 'Demo: this notice and the withdrawal code are simulated.',
    consent: 'Consent, one box at a time',
    c1: 'I agree that my sentence is shown on the wall once a moderator approves it.',
    c2: 'I am 14 or older.',
    c2aide: 'Under 14, a parent must agree (Quebec Law 25): ask the booth team. This prototype does not collect the sentence.',
    obligatoire: 'required',
    envoyer: 'Send to the wall',
    erreursTitre: 'Please fix:',
    errQ2: 'Choose what your sentence is mostly about.',
    errAn: 'Choose the year of your memory.',
    errC1: 'Tick the wall display box to send.',
    errC2: 'Confirm your age, or ask a parent to agree.',
    attente: 'Awaiting approval',
    attenteTexte: 'A moderator reads every sentence before it is shown.',
    approuver: 'Simulate the moderator’s approval (demo)',
    affichee: 'Sent to the wall',
    afficheeTexte: (k, an) => `Look at the wall: it travels to ${an}, into “${DECORS[k].nomEn}”.`,
    enPause: 'The wall is paused: it will appear when it resumes.',
    murMuet: 'The wall did not answer: open it on this laptop.',
    codeTitre: 'Your withdrawal code:',
    codeAide: 'Write it down: it lets you withdraw the sentence even after closing this page (demo: while the wall stays open).',
    retirer: 'Withdraw this sentence from the wall',
    retraitDemande: 'Withdrawal requested…',
    retiree: 'Withdrawn from the wall. Nothing is kept.',
    recommencer: 'Write another sentence',
    envoyees: 'Your sentences',
    parCode: 'Withdraw with a code',
    codeLabel: 'Withdrawal code',
    codeExemple: 'The code shown after sending, for example R-7K3Q (demo: while the wall stays open).',
    codeBouton: 'Withdraw',
    codeForme: 'This code is not in the right form (R- followed by 4 characters).',
    codeEnvoye: 'Withdrawal request sent to the wall.',
    codeConfirme: (c) => `Withdrawal confirmed by the wall (${c}).`,
    codeInconnu: (c) => `No sentence on the wall has the code ${c}.`,
    pour: 'for', souvenirDe: 'memory of',
  },
}

// Code de retrait court, lisible à voix haute (sans 0, O, 1, I). Il sert aussi d'identifiant de la phrase.
function nouveauCode() {
  const a = 'ACDEFHJKMNPRTUVWXY34679'
  return 'R-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), (o) => a[o % a.length]).join('')
}

let langue = 'fr'
let brouillon = null // phrase validée par le formulaire, en attente de l'approbation simulée
const envoyees = [] // { id, resume, an, decor, etat: 'envoyee' | 'retrait' | 'retiree' }
const attentes = new Map() // id → minuteur « le mur n'a pas répondu »
let racineApp = null

const canal = ouvrirCanal((m) => {
  if (!m || typeof m !== 'object' || !m.id) return
  const t = T[langue]
  const id = String(m.id)
  clearTimeout(attentes.get(id)); attentes.delete(id)
  const e = envoyees.find((x) => x.id === id)
  if (m.type === 'recue') {
    const s = document.getElementById('statut-texte')
    if (s && brouillon?.id === id) s.textContent = m.enFile ? t.enPause : t.afficheeTexte(m.decor, brouillon.an)
  } else if (m.type === 'retiree') {
    if (e) e.etat = 'retiree'
    if (codeDemande === id) { ecrireEtatCode(t.codeConfirme(id)); codeDemande = null }
    rendreEnvoyees()
  } else if (m.type === 'inconnu') {
    if (codeDemande === id) { ecrireEtatCode(t.codeInconnu(id)); codeDemande = null }
    if (e && e.etat === 'retrait') { e.etat = 'envoyee'; rendreEnvoyees() }
  }
})
let codeDemande = null
const ecrireEtatCode = (txt) => { const el = document.getElementById('etat-code'); if (el) el.textContent = txt }

function attendreMur(id, surSilence) {
  clearTimeout(attentes.get(id))
  attentes.set(id, setTimeout(() => { attentes.delete(id); surSilence() }, 3000))
}

function gabarit(t) {
  return `
<main class="tel" lang="${langue}">
  <div class="tel-haut">
    <div><p class="surtitre">${t.marque}</p><p class="non-officiel">${t.mention}</p></div>
    <button type="button" class="tel-langue" id="b-langue" lang="${langue === 'fr' ? 'en' : 'fr'}" aria-label="${t.langueNom}">${t.langue}</button>
  </div>
  <h1>${t.titre}</h1>
  <p class="tel-intro">${t.intro}</p>
  <p class="tel-demo">${t.demo}</p>

  <form id="form" novalidate>
    <div class="erreurs" id="erreurs" role="alert" tabindex="-1"></div>
    <fieldset>
      <legend>1. ${t.q1}</legend>
      <label class="choix"><input type="radio" name="type" value="souhait" checked> <span>${t.souhait}</span></label>
      <label class="choix"><input type="radio" name="type" value="souvenir"> <span>${t.souvenir}</span></label>
    </fieldset>
    <fieldset id="f-cat">
      <legend>2. ${t.q2} <span class="oblig">(${t.obligatoire})</span></legend>
      ${Object.entries(CATEGORIES).map(([k, c]) => `<label class="choix"><input type="radio" name="cat" value="${k}"> <span>${c[langue]}</span></label>`).join('')}
    </fieldset>
    <div class="champ">
      <label for="an">3. ${t.q3}</label>
      <select id="an" name="an" aria-describedby="aide-an"></select>
      <p class="aide decor-an" id="aide-an" aria-live="polite"></p>
    </div>
    <div class="champ">
      <label for="texte">4. ${t.q4} <span class="oblig">${t.facultatif}</span></label>
      <textarea id="texte" name="texte" rows="3" maxlength="${MAX}" aria-describedby="aide-texte compteur"></textarea>
      <p id="aide-texte" class="aide"></p>
      <p id="compteur" class="aide" aria-live="polite">0 / ${MAX} ${t.caracteres}</p>
    </div>
    <section class="avis" aria-labelledby="avis-titre">
      <h2 id="avis-titre">${t.avisTitre}</h2>
      <ul><li>${t.avisQui}</li><li>${t.avisPourquoi}</li><li>${t.avisDuree}</li><li>${t.avisRetrait}</li></ul>
      <p><small>${t.avisSimule}</small></p>
    </section>
    <fieldset aria-describedby="avis-titre">
      <legend>5. ${t.consent}</legend>
      <label class="consent"><input type="checkbox" id="c1" name="c1"> <span>${t.c1} <span class="oblig">(${t.obligatoire})</span></span></label>
      <label class="consent"><input type="checkbox" id="c2" name="c2" aria-describedby="c2-aide"> <span>${t.c2} <span class="oblig">(${t.obligatoire})</span></span></label>
      <p class="aide" id="c2-aide">${t.c2aide}</p>
    </fieldset>
    <button type="submit" class="envoyer">${t.envoyer}</button>
  </form>

  <section class="statut" id="statut" hidden aria-live="polite">
    <h2 id="statut-titre" tabindex="-1"></h2>
    <p class="statut-citation" id="statut-citation"></p>
    <p id="statut-texte"></p>
    <div id="statut-code" hidden><p>${t.codeTitre} <b id="code-retrait" class="code"></b></p><p class="aide">${t.codeAide}</p></div>
    <button type="button" class="envoyer" id="b-approuver">${t.approuver}</button>
    <button type="button" class="secondaire" id="b-autre" hidden>${t.recommencer}</button>
  </section>

  <section class="envoyees" id="envoyees" hidden aria-labelledby="envoyees-t">
    <h2 id="envoyees-t">${t.envoyees}</h2>
    <ul id="liste-envoyees"></ul>
  </section>

  <details class="retrait-code" id="par-code">
    <summary>${t.parCode}</summary>
    <form id="form-code" novalidate>
      <label for="code">${t.codeLabel}</label>
      <div class="ligne-code">
        <input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="aide-code">
        <button type="submit" class="secondaire">${t.codeBouton}</button>
      </div>
      <p class="aide" id="aide-code">${t.codeExemple}</p>
      <p class="etat-code" id="etat-code" aria-live="polite"></p>
    </form>
  </details>
</main>`
}

function resume(c) {
  const t = T[langue]
  if (c.texte) return `« ${c.texte} » · ${c.an}`
  return `${CATEGORIES[c.cat][langue]} · ${c.type === 'souvenir' ? t.souvenirDe : t.pour} ${c.an}`
}

function rendreEnvoyees() {
  const t = T[langue]
  const sec = document.getElementById('envoyees')
  if (!sec) return
  sec.hidden = !envoyees.length
  const ul = document.getElementById('liste-envoyees')
  ul.innerHTML = envoyees.map((e) => `<li data-id="${e.id}" class="${e.etat === 'retiree' ? 'retiree' : ''}">
    <p class="extrait">${esc(e.resume)}</p>
    <p class="aide">${t.codeTitre} <b class="code">${e.id}</b></p>
    ${e.etat === 'retiree' ? `<p class="aide">${t.retiree}</p>` : e.etat === 'retrait' ? `<p class="aide">${t.retraitDemande}</p>` : `<button type="button" class="secondaire retirer-phrase" data-id="${e.id}">${t.retirer}</button>`}
  </li>`).join('')
  ul.querySelectorAll('.retirer-phrase').forEach((b) => b.addEventListener('click', () => {
    const e = envoyees.find((x) => x.id === b.dataset.id)
    e.etat = 'retrait'
    canal.postMessage({ type: 'retrait', id: e.id })
    attendreMur(e.id, () => { if (e.etat === 'retrait') { e.etat = 'envoyee'; rendreEnvoyees(); const s = document.getElementById('statut-texte'); if (s) s.textContent = T[langue].murMuet } })
    rendreEnvoyees()
  }))
}

function rendre(racine) {
  const t = T[langue]
  document.documentElement.lang = langue
  racine.innerHTML = gabarit(t)
  const form = racine.querySelector('#form')
  const texte = racine.querySelector('#texte')
  const an = racine.querySelector('#an')
  const aideAn = racine.querySelector('#aide-an')
  const aideTexte = racine.querySelector('#aide-texte')

  const majAnnees = () => {
    const type = form.type.value
    const avant = an.value
    let opts = ''
    if (type === 'souvenir') {
      opts = `<option value="">${t.choisirAn}</option>`
      for (let y = 2025; y >= 1976; y--) opts += `<option value="${y}">${y}</option>`
    } else {
      for (let y = 2027; y <= 2046; y++) opts += `<option value="${y}"${y === 2046 ? ' selected' : ''}>${y}</option>`
    }
    an.innerHTML = opts
    if ([...an.options].some((o) => o.value === avant && avant)) an.value = avant
    aideTexte.textContent = type === 'souvenir' ? t.aideSouvenir : t.aideSouhait
    majDecor()
  }
  const majDecor = () => { aideAn.textContent = an.value ? t.decor(decorDe(Number(an.value))) : '' }
  form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', majAnnees))
  an.addEventListener('change', majDecor)
  majAnnees()
  texte.addEventListener('input', () => (racine.querySelector('#compteur').textContent = `${texte.value.length} / ${MAX} ${t.caracteres}`))
  racine.querySelector('#b-langue').addEventListener('click', () => {
    langue = langue === 'fr' ? 'en' : 'fr'
    rendre(racine)
    racine.querySelector('#b-langue').focus()
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const erreurs = []
    const cat = form.querySelector('input[name="cat"]:checked')
    if (!cat) erreurs.push([t.errQ2, form.querySelector('input[name="cat"]')])
    if (!an.value) erreurs.push([t.errAn, an])
    if (!form.c1.checked) erreurs.push([t.errC1, form.c1])
    if (!form.c2.checked) erreurs.push([t.errC2, form.c2])
    form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'))
    const zone = racine.querySelector('#erreurs')
    if (erreurs.length) {
      zone.innerHTML = `<p>${t.erreursTitre}</p><ul>${erreurs.map(([m]) => `<li>${m}</li>`).join('')}</ul>`
      for (const [, champ] of erreurs) champ.setAttribute('aria-invalid', 'true')
      erreurs[0][1].focus()
      return
    }
    zone.innerHTML = ''
    brouillon = { id: nouveauCode(), typeContribution: form.type.value, type: form.type.value, cat: cat.value, an: Number(an.value), texte: texte.value.trim().slice(0, MAX) }
    form.hidden = true
    montrerStatut(racine, 'attente')
  })

  racine.querySelector('#b-approuver').addEventListener('click', () => {
    const b = brouillon
    canal.postMessage({ type: 'ajout', id: b.id, typeContribution: b.typeContribution, cat: b.cat, an: b.an, texte: b.texte })
    envoyees.unshift({ id: b.id, resume: resume(b), an: b.an, etat: 'envoyee' })
    attendreMur(b.id, () => { const s = document.getElementById('statut-texte'); if (s) s.textContent = T[langue].murMuet })
    montrerStatut(racine, 'envoyee')
    rendreEnvoyees()
  })
  racine.querySelector('#b-autre').addEventListener('click', () => {
    brouillon = null
    rendre(racine)
  })
  racine.querySelector('#form-code').addEventListener('submit', (e) => {
    e.preventDefault()
    const code = racine.querySelector('#code').value.trim().toUpperCase()
    if (!/^R-[A-Z0-9]{4}$/.test(code)) { ecrireEtatCode(t.codeForme); return }
    codeDemande = code
    canal.postMessage({ type: 'retrait', id: code })
    ecrireEtatCode(t.codeEnvoye)
    attendreMur(code, () => { if (codeDemande === code) { ecrireEtatCode(T[langue].murMuet); codeDemande = null } })
  })
  if (brouillon) { form.hidden = true; montrerStatut(racine, envoyees.some((x) => x.id === brouillon.id) ? 'envoyee' : 'attente') }
  rendreEnvoyees()
}

function montrerStatut(racine, etape) {
  const t = T[langue]
  const s = racine.querySelector('#statut')
  s.hidden = false
  racine.querySelector('#statut-citation').textContent = brouillon ? resume(brouillon) : ''
  racine.querySelector('#b-approuver').hidden = etape !== 'attente'
  racine.querySelector('#b-autre').hidden = etape === 'attente'
  racine.querySelector('#statut-code').hidden = etape === 'attente'
  racine.querySelector('#code-retrait').textContent = brouillon?.id ?? ''
  racine.querySelector('#statut-titre').textContent = etape === 'attente' ? t.attente : t.affichee
  racine.querySelector('#statut-texte').textContent = etape === 'attente' ? t.attenteTexte : t.afficheeTexte(decorDe(brouillon.an), brouillon.an)
  racine.querySelector('#statut-titre').focus()
}

export function monterFormulaire(app) {
  racineApp = app
  rendre(racineApp)
}

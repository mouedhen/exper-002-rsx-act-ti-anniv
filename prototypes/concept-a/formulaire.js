// Formulaire de contribution, format téléphone (conçu pour 360 px), ouvert sur le portable de démo.
// Rien ne quitte la machine : la contribution passe au mur par BroadcastChannel (D-051).
import { animate, spring } from 'animejs'
import { CATEGORIES } from './donnees.js'
import { ouvrirCanal } from './canal.js'

const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches

const T = {
  fr: {
    langue: 'English',
    langueNom: 'Switch to English',
    marque: 'Réseau ACTION TI · 50 années',
    mention: 'Proposition non officielle · prototype',
    avisTitre: 'Avant d’envoyer : vos renseignements',
    avisQui: '<b>Qui recueille :</b> le Réseau ACTION TI (hypothèse, à confirmer).',
    avisPourquoi: '<b>Pourquoi :</b> afficher votre souhait sur le mur du 50<sup>e</sup>, rien d’autre. Ni nom ni courriel ne sont demandés.',
    avisDuree: '<b>Combien de temps :</b> pendant l’événement seulement (durée à confirmer), ou jusqu’en 2046 si vous cochez la capsule. En démo, tout est effacé à la fin.',
    avisRetrait: '<b>Comment retirer :</b> le bouton « Retirer ma contribution » après l’envoi, ou plus tard avec le code de retrait affiché après l’envoi.',
    avisSimule: 'Démo : cet avis et le code de retrait sont simulés.',
    codeTitre: 'Votre code de retrait :',
    codeAide: 'Notez-le : il servirait à retirer votre souhait après avoir fermé cette page. Simulé : en démo, ce code n’est relié à aucun service.',
    titre: '2046 : écrivez la suite',
    intro: 'Le mur affiche, de 2027 à 2046, les souhaits approuvés par un modérateur. 30 secondes.',
    demo: 'Démo hors ligne : rien ne quitte ce portable. Ce que vous saisissez est effacé après la démo.',
    q1: 'Pour les 20 prochaines années, j’attends surtout',
    q2: 'Pour quelle année ?',
    q3: 'Un mot pour 2046',
    facultatif: '(facultatif)',
    aide3: 'Un souhait, une idée. Pas de nom, pas de souvenir sur une autre personne.',
    releve: 'Je suis de la relève : c’est un message à moi-même en 2046',
    consent: 'Consentement, case par case',
    c1: 'J’accepte que ma réponse s’affiche sur le mur après validation par un modérateur.',
    c2: 'J’ai 14 ans ou plus.',
    c2aide: 'Avant 14 ans, l’accord d’un parent est nécessaire (Loi 25).',
    c3: 'Garder ma phrase dans la capsule jusqu’en 2046.',
    c3aide: 'Maquette : au palier 1, rien n’est conservé.',
    envoyer: 'Envoyer au mur',
    obligatoire: 'obligatoire',
    errQ1: 'Choisissez ce que vous attendez surtout.',
    errC1: 'Cochez l’affichage sur le mur pour envoyer.',
    errC2: 'Confirmez votre âge, ou demandez l’accord d’un parent.',
    erreursTitre: 'À corriger :',
    attente: 'En attente de validation',
    attenteTexte: 'Un modérateur relit chaque réponse avant l’affichage.',
    approuver: 'Simuler l’approbation du modérateur (démo)',
    affichee: 'Affichée sur le mur',
    afficheeTexte: 'Regardez le mur : votre souhait arrive depuis le QR code.',
    retirer: 'Retirer ma contribution',
    retiree: 'Contribution retirée. Rien n’est conservé.',
    recommencer: 'Écrire un autre souhait',
    caracteres: 'caractères',
    pour: 'pour',
  },
  en: {
    langue: 'Français',
    langueNom: 'Passer en français',
    marque: 'Réseau ACTION TI · 50 years',
    mention: 'Unofficial proposal · prototype',
    avisTitre: 'Before you send: your information',
    avisQui: '<b>Who collects it:</b> Réseau ACTION TI (assumption, to be confirmed).',
    avisPourquoi: '<b>Why:</b> to show your wish on the 50th anniversary wall, nothing else. No name or email is asked for.',
    avisDuree: '<b>How long:</b> during the event only (length to be confirmed), or until 2046 if you tick the time capsule. In the demo, everything is erased at the end.',
    avisRetrait: '<b>How to withdraw:</b> the “Withdraw my contribution” button after sending, or later with the withdrawal code shown after sending.',
    avisSimule: 'Demo: this notice and the withdrawal code are simulated.',
    codeTitre: 'Your withdrawal code:',
    codeAide: 'Write it down: it would let you withdraw your wish after closing this page. Simulated: in the demo, this code is not linked to any service.',
    titre: '2046: write what comes next',
    intro: 'From 2027 to 2046, the wall shows the wishes a moderator has approved. 30 seconds.',
    demo: 'Offline demo: nothing leaves this laptop. What you type is erased after the demo.',
    q1: 'For the next 20 years, I mostly expect',
    q2: 'For which year?',
    q3: 'A word for 2046',
    facultatif: '(optional)',
    aide3: 'A wish, an idea. No names, no memories about other people.',
    releve: 'I am a student: this is a message to myself in 2046',
    consent: 'Consent, one box at a time',
    c1: 'I agree that my answer is shown on the wall once a moderator approves it.',
    c2: 'I am 14 or older.',
    c2aide: 'Under 14, a parent must agree (Quebec Law 25).',
    c3: 'Keep my sentence in the time capsule until 2046.',
    c3aide: 'Mock-up: nothing is kept at stage 1.',
    envoyer: 'Send to the wall',
    obligatoire: 'required',
    errQ1: 'Choose what you mostly expect.',
    errC1: 'Tick the wall display box to send.',
    errC2: 'Confirm your age, or ask a parent to agree.',
    erreursTitre: 'Please fix:',
    attente: 'Awaiting approval',
    attenteTexte: 'A moderator reads every answer before it is shown.',
    approuver: 'Simulate the moderator’s approval (demo)',
    affichee: 'Shown on the wall',
    afficheeTexte: 'Look at the wall: your wish arrives from the QR code.',
    retirer: 'Withdraw my contribution',
    retiree: 'Contribution withdrawn. Nothing is kept.',
    recommencer: 'Write another wish',
    caracteres: 'characters',
    pour: 'for',
  },
}

let langue = 'fr'
let derniere = null
const canal = ouvrirCanal()

function gabarit(t) {
  const annees = []
  for (let y = 2027; y <= 2046; y++) annees.push(`<option value="${y}" ${y === 2046 ? 'selected' : ''}>${y}</option>`)
  return `
  <main class="tel" lang="${langue}">
    <div class="tel-haut">
      <div><p class="tel-marque">${t.marque}</p><p class="tel-mention">${t.mention}</p></div>
      <button type="button" class="tel-langue" id="b-langue" lang="${langue === 'fr' ? 'en' : 'fr'}" aria-label="${t.langueNom}">${t.langue}</button>
    </div>
    <h1>${t.titre}</h1>
    <p class="tel-intro">${t.intro}</p>
    <p class="tel-demo">${t.demo}</p>

    <form id="form" novalidate>
      <div class="erreurs" id="erreurs" role="alert" tabindex="-1"></div>
      <fieldset id="f-q1" aria-describedby="erreurs">
        <legend>1. ${t.q1} <span class="obl" aria-hidden="true">*</span><span class="visually-hidden"> (${t.obligatoire})</span></legend>
        <div class="choix">
          ${Object.entries(CATEGORIES)
            .map(([k, c]) => `<label><input type="radio" name="cat" value="${k}" required><span class="forme forme-${c.forme} cat-${k}" aria-hidden="true"></span>${c[langue]}</label>`)
            .join('')}
        </div>
      </fieldset>

      <div class="champ">
        <label class="etiquette" for="an">2. ${t.q2}</label>
        <select id="an" name="an">${annees.join('')}</select>
      </div>

      <div class="champ">
        <label class="etiquette" for="texte">3. ${t.q3} <span style="font-weight:400">${t.facultatif}</span></label>
        <textarea id="texte" name="texte" maxlength="120" aria-describedby="aide-texte compte"></textarea>
        <p class="aide"><span id="aide-texte">${t.aide3}</span><span id="compte" aria-live="polite">0/120</span></p>
        <label class="case"><input type="checkbox" name="releve" id="releve"><span>${t.releve}</span></label>
      </div>

      <section class="tel-avis" aria-labelledby="avis-titre">
        <h2 id="avis-titre">${t.avisTitre}</h2>
        <ul><li>${t.avisQui}</li><li>${t.avisPourquoi}</li><li>${t.avisDuree}</li><li>${t.avisRetrait}</li></ul>
        <p><small>${t.avisSimule}</small></p>
      </section>

      <fieldset aria-describedby="avis-titre">
        <legend>4. ${t.consent}</legend>
        <label class="case"><input type="checkbox" id="c1" name="c1" required><span>${t.c1} <span class="obl">*</span></span></label>
        <label class="case"><input type="checkbox" id="c2" name="c2" required aria-describedby="c2-aide"><span>${t.c2} <span class="obl">*</span><small id="c2-aide">${t.c2aide}</small></span></label>
        <label class="case"><input type="checkbox" id="c3" name="c3" aria-describedby="c3-aide"><span>${t.c3}<small id="c3-aide">${t.c3aide}</small></span></label>
      </fieldset>

      <button type="submit" class="bouton bouton-principal">${t.envoyer}</button>
    </form>

    <section class="statut" id="statut" hidden aria-live="polite">
      <p class="statut-etat" id="statut-etat"></p>
      <h2 id="statut-titre" tabindex="-1"></h2>
      <p class="statut-citation" id="statut-citation"></p>
      <p id="statut-texte"></p>
      <div class="statut-code" id="statut-code" hidden><p>${t.codeTitre} <b id="code-retrait"></b></p><p><small>${t.codeAide}</small></p></div>
      <button type="button" class="bouton bouton-principal" id="b-approuver">${t.approuver}</button>
      <button type="button" class="bouton bouton-second" id="b-retirer">${t.retirer}</button>
      <button type="button" class="bouton bouton-second" id="b-autre" hidden>${t.recommencer}</button>
    </section>
  </main>`
}

function rendre(racine) {
  const t = T[langue]
  document.documentElement.lang = langue
  racine.innerHTML = gabarit(t)
  const form = racine.querySelector('#form')
  const texte = racine.querySelector('#texte')
  texte.addEventListener('input', () => (racine.querySelector('#compte').textContent = `${texte.value.length}/120`))
  racine.querySelector('#b-langue').addEventListener('click', () => {
    langue = langue === 'fr' ? 'en' : 'fr'
    rendre(racine)
    racine.querySelector('#b-langue').focus()
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const erreurs = []
    const cat = form.querySelector('input[name="cat"]:checked')
    if (!cat) erreurs.push([t.errQ1, form.querySelector('input[name="cat"]')])
    if (!form.c1.checked) erreurs.push([t.errC1, form.c1])
    if (!form.c2.checked) erreurs.push([t.errC2, form.c2])
    for (const i of form.querySelectorAll('input')) i.removeAttribute('aria-invalid')
    const zone = racine.querySelector('#erreurs')
    if (erreurs.length) {
      zone.innerHTML = `${t.erreursTitre}<ul>${erreurs.map(([m]) => `<li>${m}</li>`).join('')}</ul>`
      for (const [, champ] of erreurs) champ.setAttribute('aria-invalid', 'true')
      erreurs[0][1].focus()
      return
    }
    zone.innerHTML = ''
    derniere = {
      id: 'demo-' + Date.now().toString(36),
      cat: cat.value,
      an: Number(form.an.value),
      texte: texte.value.trim(),
      releve: form.releve.checked,
      capsule: false, // palier 1 : rien n'est conservé, même si la case est cochée
    }
    // Code de retrait simulé (constat T-1) : affiché après l'envoi, relié à aucun service.
    derniere.code = 'R-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), (o) => 'ACDEFHJKMNPRTUVWXY34679'[o % 23]).join('')
    form.hidden = true
    montrerStatut(racine, 'attente')
  })

  racine.querySelector('#b-approuver').addEventListener('click', () => {
    canal.envoyer({ type: 'approuvee', contribution: { ...derniere, code: undefined } }) // le code reste sur le téléphone
    montrerStatut(racine, 'affichee')
  })
  racine.querySelector('#b-retirer').addEventListener('click', () => {
    if (derniere) canal.envoyer({ type: 'retrait', id: derniere.id })
    montrerStatut(racine, 'retiree')
  })
  racine.querySelector('#b-autre').addEventListener('click', () => {
    derniere = null
    rendre(racine)
  })
}

function montrerStatut(racine, etape) {
  const t = T[langue]
  const s = racine.querySelector('#statut')
  s.hidden = false
  const etat = racine.querySelector('#statut-etat')
  const cat = derniere ? CATEGORIES[derniere.cat][langue] : ''
  racine.querySelector('#statut-citation').textContent = derniere
    ? derniere.texte ? `« ${derniere.texte} » · ${derniere.an}` : `${cat} · ${t.pour} ${derniere.an}`
    : ''
  racine.querySelector('#b-approuver').hidden = etape !== 'attente'
  racine.querySelector('#b-retirer').hidden = etape === 'retiree'
  racine.querySelector('#b-autre').hidden = etape !== 'retiree'
  racine.querySelector('#statut-code').hidden = etape === 'retiree' || !derniere
  racine.querySelector('#code-retrait').textContent = derniere?.code ?? ''
  if (etape === 'attente') {
    etat.textContent = t.attente
    etat.className = 'statut-etat'
    racine.querySelector('#statut-titre').textContent = t.attente
    racine.querySelector('#statut-texte').textContent = t.attenteTexte
  } else if (etape === 'affichee') {
    etat.textContent = t.affichee
    etat.className = 'statut-etat ok'
    racine.querySelector('#statut-titre').textContent = t.affichee
    racine.querySelector('#statut-texte').textContent = t.afficheeTexte
  } else {
    etat.textContent = ''
    racine.querySelector('#statut-titre').textContent = t.retiree
    racine.querySelector('#statut-texte').textContent = ''
    racine.querySelector('#statut-citation').textContent = ''
  }
  racine.querySelector('#statut-titre').focus()
  if (!REDUIT) animate(s, { scale: [0.94, 1], opacity: [0, 1], ease: spring({ bounce: 0.35, duration: 500 }) })
}

export function demarrerFormulaire(racine) {
  rendre(racine)
}

// Captures et cas de test du concept C : mur (1920 × 540 et 1366 × 768), formulaire (360 × 780), vidéo du mur (~15 s).
// Itération 2 : un cas de test par constat de l'équipe rouge 1 (C-1 à C-9, T-1), plus D-051 et la console.
// Prérequis : `npx vite --port 5193 --strictPort` lancé depuis prototypes/.
const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const fs = require('fs')
const path = require('path')
const { lireReference, IDS } = require('./extraire-faits.cjs')

const ORIGINE = 'http://localhost:5193'
const URL = ORIGINE + '/concept-c/'
const SORTIE = '/mnt/project-files/exp-002/etape-4/captures'
const VIDEO_TMP = path.join(__dirname, '.video-tmp')
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))

const verifs = []
const verifier = (constat, ok, detail) => verifs.push({ constat, ok: !!ok, detail })

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-background-networking'] })
  const erreurs = []
  const horsLigne = []
  const surveiller = (page, nom) => {
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`${nom} [${m.type()}] ${m.text()}`) })
    page.on('pageerror', (e) => erreurs.push(`${nom} [pageerror] ${e.message}`))
    page.on('requestfailed', (r) => erreurs.push(`${nom} [requête] ${r.url()}`))
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGINE) && !u.startsWith('data:')) horsLigne.push(`${nom} ${u}`) })
  }
  const ouvrir = async (ctx, nom, url, taille) => {
    const p = await ctx.newPage()
    surveiller(p, nom)
    if (taille) await p.setViewportSize(taille)
    await p.goto(url)
    return p
  }
  const TEL = { width: 360, height: 780 }
  // Remplit et envoie le formulaire ; renvoie le code de retrait affiché après la validation simulée.
  const envoyer = async (tel, texte, { prenom } = {}) => {
    if (await tel.isVisible('#encore')) await tel.click('#encore')
    await tel.fill('#texte', texte)
    await tel.check('#consent-affichage')
    await tel.check('#consent-age')
    if (prenom) { await tel.check('#consent-prenom'); await tel.fill('#signature', prenom) }
    await tel.evaluate(() => document.querySelector('button.envoyer').click())
    await tel.waitForSelector('#code-texte:not([hidden])', { timeout: 5000 })
    return (await tel.textContent('#code-texte')).match(/C-[A-Z2-9]{4}/)?.[0]
  }
  const attendreSurMur = (mur, id) => mur.waitForFunction((i) => window.__murC.contributions().includes(i), id, { timeout: 5000 })
  const texteMur = (mur) => mur.evaluate(() => document.getElementById('scene-mur').innerText + [...document.querySelectorAll('.voyageur')].map((v) => v.textContent).join(' '))

  console.log('étape 1')
  // 1. Vidéo du mur, avec une contribution envoyée depuis le formulaire (même contexte = même portable).
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 540 } } })
  const tel = await ouvrir(ctx, 'formulaire', URL + '?vue=formulaire', TEL)
  await tel.fill('#texte', 'Que le Québec numérique reste ouvert à toutes les régions.')
  await tel.check('#consent-affichage')
  await tel.check('#consent-age')
  const mur = await ouvrir(ctx, 'mur', URL)
  await mur.bringToFront()
  await attendre(3500)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1-impression.png') })
  await tel.evaluate(() => document.querySelector('button.envoyer').click())
  await attendre(7500)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1-contribution.png') })
  await attendre(1000)
  await mur.keyboard.press('Space')
  await attendre(1200)
  const enPause = await mur.evaluate(() => window.__murC.tl.paused)
  verifier('WCAG 2.2.2', enPause, 'barre d\'espace : fil de temps en pause')
  await mur.keyboard.press('Space')
  await attendre(300)
  const video = await mur.video().path()
  await mur.close()
  await tel.bringToFront()
  await tel.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire-envoye.png'), fullPage: true })
  await ctx.close()
  fs.copyFileSync(video, path.join(SORTIE, 'concept-c-mur.webm'))
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })

  console.log('étape 2')
  // 2. Scène 2, faits et sources (C-4), décor générique (C-5).
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const p2 = await ouvrir(ctx2, 'mur-scene2', URL)
  await attendre(500)
  // C-4 : date, énoncé et sources affichés = tableau de faits-par-epoque.md, relu ici indépendamment.
  const ref = lireReference()
  const affiches = await p2.evaluate(() => [...document.querySelectorAll('[data-fait]')].map((el) => ({
    id: el.dataset.fait,
    texte: el.textContent.replace(/\s+/g, ' '),
    src: (el.querySelector('.src, .lien')?.textContent || '').replace(/[[\]]/g, '').trim(),
  })).filter((f) => f.src))
  const ecarts = []
  for (const f of affiches) {
    const r = ref[f.id]
    if (!r) { ecarts.push(`${f.id} absent de la référence`); continue }
    if (f.src !== `${f.id} · ${r.sources}`) ecarts.push(`${f.id} sources « ${f.src} » ≠ « ${r.sources} »`)
    if (!f.texte.includes(r.enonce)) ecarts.push(`${f.id} énoncé différent`)
    if (!f.texte.includes(r.date)) ecarts.push(`${f.id} date différente`)
  }
  const vus = new Set(affiches.map((f) => f.id))
  verifier('C-4', !ecarts.length && IDS.every((i) => vus.has(i)), ecarts.length ? ecarts.join(' ; ') : `${vus.size} faits affichés, date, énoncé et sources identiques à la référence (F-003 : ${ref['F-003'].sources} ; F-016 : ${ref['F-016'].sources})`)
  await p2.click('[data-aller="scene2"]')
  await attendre(15500)
  const decor = await p2.evaluate(() => {
    const tous = [document.getElementById('scene2'), ...document.querySelectorAll('#scene2 *')]
    const marine = tous.filter((el) => /rgb\(0, 0, 128\)/.test(getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor)).length
    return {
      marine,
      fond: getComputedStyle(document.getElementById('scene2')).backgroundColor,
      boutons: document.querySelectorAll('#scene2 .cases, #scene2 .barre-titre i').length,
      titre: getComputedStyle(document.querySelector('.barre-titre')).backgroundImage,
    }
  })
  verifier('C-5', decor.marine === 0 && decor.fond !== 'rgb(35, 71, 74)' && decor.boutons === 0 && decor.titre === 'none',
    `éléments en #000080 : ${decor.marine} ; fond de scène ${decor.fond} (sarcelle avant : rgb(35, 71, 74)) ; boutons de fenêtre : ${decor.boutons} ; dégradé de barre de titre : ${decor.titre}`)
  await p2.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene2-web.png') })
  await p2.click('[data-aller="scene1"]')
  await attendre(17000)
  await p2.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1.png') })
  await ctx2.close()

  console.log('étape 3')
  // 3. C-1 : retrait 0,3 s après la validation, pendant le voyage de la phrase.
  const ctx3 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const tel3 = await ouvrir(ctx3, 'formulaire-c1', URL + '?vue=formulaire', TEL)
  const mur3 = await ouvrir(ctx3, 'mur-c1', URL)
  await mur3.bringToFront()
  await attendre(1500)
  await tel3.fill('#texte', 'PHRASE-RETIREE-C')
  await tel3.check('#consent-affichage')
  await tel3.check('#consent-age')
  await tel3.check('#consent-prenom')
  await tel3.fill('#signature', 'Prénom')
  await tel3.evaluate(() => document.querySelector('button.envoyer').click())
  await mur3.waitForFunction(() => window.__murC.contributions().some((i) => i.startsWith('C-')), null, { timeout: 5000 })
  await attendre(300)
  await tel3.evaluate(() => document.querySelector('.retirer-phrase').click())
  await attendre(5000)
  const apresC1 = await texteMur(mur3)
  const voyageurs = await mur3.evaluate(() => document.querySelectorAll('.voyageur').length)
  verifier('C-1', !apresC1.includes('PHRASE-RETIREE-C') && !apresC1.includes('Prénom') && voyageurs === 0,
    `5 s après un retrait à t + 0,3 s : phrase visible ${apresC1.includes('PHRASE-RETIREE-C') ? 'OUI' : 'non'}, prénom visible ${apresC1.includes('Prénom') ? 'OUI' : 'non'}, voyageurs restants ${voyageurs}`)
  await mur3.screenshot({ path: path.join(SORTIE, 'concept-c-mur-retrait-pendant-voyage.png') })
  await ctx3.close()

  console.log('étape 4')
  // 4. C-6 : une arrivée pendant la pause attend la reprise.
  const ctx4 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const tel4 = await ouvrir(ctx4, 'formulaire-c6', URL + '?vue=formulaire', TEL)
  const mur4 = await ouvrir(ctx4, 'mur-c6', URL)
  await mur4.bringToFront()
  await attendre(3000)
  await mur4.keyboard.press('Space')
  await attendre(400)
  const masque = { style: '.commandes { visibility: hidden }' } // la barre de commandes, hors du mur, annonce la file
  const avant = await mur4.screenshot(masque)
  const code6 = await envoyer(tel4, 'PHRASE-PAUSE-C')
  await attendre(1500)
  const apres = await mur4.screenshot(masque)
  const enFile = await mur4.evaluate(() => window.__murC.file())
  const indic6 = await mur4.textContent('#indic')
  await mur4.keyboard.press('Space')
  await attendreSurMur(mur4, code6)
  verifier('C-6', avant.equals(apres) && enFile === 1 && /attend la reprise/.test(indic6),
    `captures du mur avant et après l'arrivée identiques : ${avant.equals(apres) ? 'oui' : 'NON'} ; en file : ${enFile} ; statut « ${indic6.trim()} » ; affichée après reprise : oui`)
  await ctx4.close()

  console.log('étape 5')
  // 5. C-2, C-3, C-9, T-1 : formulaire et mur dans le même contexte.
  const ctx5 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur5 = await ouvrir(ctx5, 'mur-form', URL)
  await mur5.evaluate(() => { window.__msgs = []; new BroadcastChannel('concept-c-contributions').onmessage = (e) => window.__msgs.push(e.data) })
  const f = await ouvrir(ctx5, 'formulaire-form', URL + '?vue=formulaire', TEL)
  // C-2 : trois cases distinctes ; chacune des deux obligatoires bloque l'envoi seule ; aucune case ne porte le retrait.
  const cases = await f.evaluate(() => [...document.querySelectorAll('#form input[type=checkbox]')].map((c) => ({ id: c.id, label: document.querySelector(`label[for="${c.id}"]`).textContent })))
  await f.fill('#texte', 'Essai C-2')
  await f.check('#consent-affichage')
  await f.click('button.envoyer')
  const errAge = await f.isVisible('#err-age')
  const bloque1 = await f.isHidden('#etat')
  await f.uncheck('#consent-affichage')
  await f.check('#consent-age')
  await f.click('button.envoyer')
  const errAff = await f.isVisible('#err-affichage')
  const bloque2 = await f.isHidden('#etat')
  await f.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire-erreurs.png'), fullPage: true })
  await f.uncheck('#consent-age')
  verifier('C-2', cases.length === 3 && errAge && errAff && bloque1 && bloque2 && !cases.some((c) => /retir/i.test(c.label)),
    `cases : ${cases.map((c) => c.id).join(', ')} ; sans l'âge : bloqué (${errAge ? 'erreur affichée' : 'pas d\'erreur'}) ; sans l'affichage : bloqué (${errAff ? 'erreur affichée' : 'pas d\'erreur'}) ; le retrait n'est dans aucune case`)
  // C-3 : sans la case, le prénom n'est ni envoyé ni affiché ; avec la case, il l'est.
  const codeA = await envoyer(f, 'PHRASE-A-C9')
  await attendreSurMur(mur5, codeA)
  const msgA = await mur5.evaluate((c) => window.__msgs.find((m) => m.id === c), codeA)
  const signA = await mur5.textContent(`.carte-contrib[data-id="${codeA}"] .sign`)
  const codeB = await envoyer(f, 'PHRASE-B-C9', { prenom: 'Zoé' })
  await attendreSurMur(mur5, codeB)
  const signB = await mur5.textContent(`.carte-contrib[data-id="${codeB}"] .sign`)
  verifier('C-3', msgA.signature === '' && signA === 'un visiteur' && signB === 'Zoé',
    `sans la case : signature envoyée « ${msgA.signature} », affichée « ${signA} » ; avec la case : « ${signB} »`)
  // C-9 : après une deuxième phrase, la première reste retirable.
  await f.click(`#liste-envoyees li[data-id="${codeA}"] .retirer-phrase`)
  await mur5.waitForFunction((c) => !window.__murC.contributions().includes(c), codeA, { timeout: 3000 }).catch(() => {})
  const restantes = await mur5.evaluate(() => window.__murC.contributions())
  verifier('C-9', !restantes.includes(codeA) && restantes.includes(codeB),
    `deux phrases envoyées, deux boutons de retrait ; première retirée : ${!restantes.includes(codeA) ? 'oui' : 'NON'} ; deuxième toujours affichée : ${restantes.includes(codeB) ? 'oui' : 'NON'}`)
  await f.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire-retraits.png'), fullPage: true })
  // T-1 : avis complet, mention non officielle, code de retrait utilisable depuis une page neuve.
  const avis = await f.textContent('.avis')
  const entete = await f.textContent('header')
  const codeT = (await f.textContent('#code-texte')).match(/C-[A-Z2-9]{4}/)?.[0]
  await f.close()
  const f2 = await ouvrir(ctx5, 'formulaire-code', URL + '?vue=formulaire', TEL)
  await f2.fill('#code', codeB)
  await f2.click('#retirer-code')
  await mur5.waitForFunction((c) => !window.__murC.contributions().includes(c), codeB, { timeout: 3000 }).catch(() => {})
  const parCode = !(await mur5.evaluate(() => window.__murC.contributions())).includes(codeB)
  const mentionMur = await mur5.textContent('.non-officiel-mur')
  const elements = ['Réseau ACTION TI (hypothèse, à confirmer)', 'Pourquoi', 'Combien de temps', 'Comment retirer', 'code de retrait', 'simulé']
  const manquants = elements.filter((e) => !avis.includes(e))
  verifier('T-1', !manquants.length && entete.includes('Proposition non officielle · prototype') && mentionMur.includes('Proposition non officielle') && codeT === codeB && parCode,
    `avis : ${manquants.length ? 'manque ' + manquants.join(', ') : 'qui, pourquoi, combien de temps, comment retirer'} ; mention non officielle au formulaire et au mur ; code affiché après l'envoi (${codeT}) ; retrait par ce code depuis une page neuve : ${parCode ? 'oui' : 'NON'}`)
  await ctx5.close()

  console.log('étape 6')
  // 6. Mouvement réduit : états fixes (capture) et fondu d'au moins 500 ms (C-8).
  const ctx6 = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const p6 = await ouvrir(ctx6, 'mur-reduit', URL)
  await attendre(1000)
  await p6.screenshot({ path: path.join(SORTIE, 'concept-c-mur-mouvement-reduit.png') })
  const fondu = await p6.evaluate(async () => {
    const s2 = document.getElementById('scene2')
    window.__murC.tl.seek(23700)
    const t0 = performance.now()
    let debut = null, fin = null
    while (performance.now() - t0 < 2500 && fin === null) {
      await new Promise((r) => requestAnimationFrame(r))
      const o = parseFloat(s2.style.opacity)
      if (debut === null && o > 0.001) debut = performance.now()
      if (debut !== null && o >= 0.999) fin = performance.now()
    }
    return debut !== null && fin !== null ? Math.round(fin - debut) : -1
  })
  verifier('C-8', fondu >= 500, `mouvement réduit : opacité de la page de 0 à 1 en ${fondu} ms mesurés (nominal 600 ms ; avant : 1 ms)`)
  await ctx6.close()

  console.log('étape 7')
  // 7. C-7 : portable de démo 1366 × 768, mur entier puis vues recadrées.
  const ctx7 = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const p7 = await ouvrir(ctx7, 'mur-1366', URL)
  await attendre(500)
  await p7.evaluate(() => { window.__murC.tl.seek(20000) })
  const mesurer = (sel) => p7.evaluate((s) => {
    const e = document.getElementById('scene-mur').getBoundingClientRect().width / 7680
    const t = [...document.querySelectorAll(s)].filter((el) => el.offsetParent !== null || el.getClientRects().length)
    return { echelle: e, min: Math.min(...t.map((el) => parseFloat(getComputedStyle(el).fontSize) * e)) }
  }, sel)
  const SEL_EPOQUES = '#scene1 .src, #scene1 .public-meta, #scene1 .filet, #scene1 .note-preuve'
  const SEL_AUJ = '.carte-fait .src, .carte-contrib .meta, .fil .mod, .appel-note'
  const entierE = await mesurer(SEL_EPOQUES)
  const entierA = await mesurer(SEL_AUJ)
  await p7.click('#btn-vue')
  await attendre(200)
  const recE = await mesurer(SEL_EPOQUES)
  await p7.screenshot({ path: path.join(SORTIE, 'concept-c-mur-1366-recadre-epoques.png') })
  await p7.click('#btn-vue')
  await attendre(200)
  const recA = await mesurer(SEL_AUJ)
  await p7.screenshot({ path: path.join(SORTIE, 'concept-c-mur-1366-recadre-aujourdhui.png') })
  const f1 = (n) => n.toFixed(1).replace('.', ',')
  verifier('C-7', recE.min >= 10.5 && recA.min >= 10.5,
    `1366 × 768, plus petit texte des sources : mur entier ${f1(Math.min(entierE.min, entierA.min))} px ; vue « époques » ${f1(recE.min)} px (× ${f1(recE.echelle / entierE.echelle)}) ; vue « aujourd'hui » ${f1(recA.min)} px (× ${f1(recA.echelle / entierA.echelle)})`)
  await ctx7.close()

  console.log('étape 8')
  // 8. Formulaire vide (pleine page, avec l'avis).
  const ctx8 = await browser.newContext({ viewport: TEL })
  const f8 = await ouvrir(ctx8, 'formulaire-vide', URL + '?vue=formulaire')
  await attendre(300)
  await f8.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire.png'), fullPage: true })
  await ctx8.close()

  await browser.close()
  verifier('D-051', !horsLigne.length, horsLigne.length ? horsLigne.join(' ; ') : `aucune requête hors de ${ORIGINE}`)
  verifier('Console', !erreurs.length, erreurs.length ? erreurs.join(' ; ') : 'aucune erreur ni avertissement')
  for (const v of verifs) console.log(`${v.ok ? 'OK   ' : 'ÉCHEC'} ${v.constat.padEnd(10)} ${v.detail}`)
  process.exit(verifs.every((v) => v.ok) ? 0 : 1)
})()

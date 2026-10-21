// Captures du concept A : mur (1920 × 540), formulaire (360 × 780), vidéo de 15 s du mur.
// Prérequis : `npx vite --port 5191 --strictPort` lancé depuis prototypes/.
// Usage : node concept-a/capture.cjs
// Itération 3 : autre port possible par variable d'environnement, par exemple PORT=5195 node concept-a/capture.cjs.
const fs = require('fs')
const path = require('path')
const { chromium } = require('/opt/node22/lib/node_modules/playwright')

const ORIGINE = `http://localhost:${process.env.PORT || '5191'}/`
const URL = ORIGINE + 'concept-a/'
const SORTIE = '/mnt/project-files/exp-002/etape-4/captures'
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const erreurs = []

function surveiller(page, nom) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`[${nom}] ${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => erreurs.push(`[${nom}] pageerror: ${e.message}`))
  page.on('requestfailed', (r) => erreurs.push(`[${nom}] requête échouée: ${r.url()}`))
  page.on('request', (r) => {
    if (!r.url().startsWith(ORIGINE)) erreurs.push(`[${nom}] requête externe: ${r.url()}`)
  })
}

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const cap = (page, nom) => page.screenshot({ path: path.join(SORTIE, `concept-a-${nom}.png`) })

  // 1. Vidéo du mur, depuis le début de la boucle (horizon puis rembobinage).
  fs.mkdirSync('/tmp/claude-0', { recursive: true })
  const dossierVideo = fs.mkdtempSync('/tmp/claude-0/concept-a-video-')
  const ctxV = await navigateur.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: dossierVideo, size: { width: 1920, height: 540 } } })
  const pv = await ctxV.newPage()
  surveiller(pv, 'video')
  await pv.goto(URL)
  await pause(15500)
  const video = pv.video()
  await ctxV.close()
  fs.copyFileSync(await video.path(), path.join(SORTIE, 'concept-a-mur.webm'))

  // 2. Captures du mur au fil de la scène 1.
  const ctx = await navigateur.newContext({ viewport: { width: 1920, height: 540 } })
  const mur = await ctx.newPage()
  surveiller(mur, 'mur')
  await mur.goto(URL)
  await pause(4500)
  await cap(mur, 'mur-1-horizon')
  await pause(9000) // milieu du rembobinage
  await cap(mur, 'mur-2-rembobiner')
  await pause(5500)
  await cap(mur, 'mur-3-editions')
  await pause(4500)
  await cap(mur, 'mur-4-ce-qui-a-change')

  // Pause : deux captures à une seconde d'écart doivent être identiques.
  await mur.keyboard.press('Space')
  await pause(1000)
  const a = await mur.screenshot()
  await pause(1200)
  const b = await mur.screenshot()
  console.log('Pause (barre d’espace) fige le mur :', a.equals(b))
  await cap(mur, 'mur-5-en-pause')
  await mur.keyboard.press('Space')

  // Scène 2 par le sélecteur de scène.
  await mur.getByRole('button', { name: /Scène 2/ }).click()
  await pause(4500)
  await cap(mur, 'mur-6-vingt-ans')
  await pause(2500)
  await cap(mur, 'mur-7-vedette-exemple')

  // 3. Formulaire (360 × 780) dans le même contexte : la contribution arrive au mur sans réseau.
  const tel = await ctx.newPage()
  await tel.setViewportSize({ width: 360, height: 780 })
  surveiller(tel, 'formulaire')
  await tel.goto(URL + '?vue=formulaire')
  await pause(500)
  await cap(tel, 'formulaire-1-vide')
  await tel.getByRole('button', { name: 'Envoyer au mur' }).click()
  await pause(300)
  await tel.screenshot({ path: path.join(SORTIE, 'concept-a-formulaire-2-erreurs.png') })
  await tel.getByLabel('Rayonner au Canada').check()
  await tel.getByLabel('Pour quelle année ?').selectOption('2040')
  await tel.getByLabel(/Un mot pour 2046/).fill('Une JIQ où chaque région présente son projet.')
  await tel.getByLabel(/J’accepte/).check()
  await tel.getByLabel(/14 ans ou plus/).check()
  await cap(tel, 'formulaire-3-rempli')
  await tel.getByRole('button', { name: 'Envoyer au mur' }).click()
  await pause(800)
  await cap(tel, 'formulaire-4-en-attente')
  await tel.getByRole('button', { name: /Simuler l’approbation/ }).click()
  await pause(800)
  await cap(tel, 'formulaire-5-affichee')
  await mur.bringToFront()
  await pause(7400)
  await cap(mur, 'mur-8-contribution-demo')
  await pause(5000)
  await cap(mur, 'mur-9-contribution-rangee')

  // Retrait (constat A-1) : une phrase retirée ne doit plus jamais revenir en vedette.
  const essaiRetrait = async (phrase, attenteAvantRetrait, nomCapture) => {
    await tel.getByRole('button', { name: 'Écrire un autre souhait' }).click().catch(() => {})
    if (!(await tel.getByLabel('Rayonner au Canada').isVisible())) await tel.goto(URL + '?vue=formulaire')
    await tel.getByLabel('Rayonner au Canada').check()
    await tel.getByLabel(/Un mot pour 2046/).fill(phrase)
    await tel.getByLabel(/J’accepte/).check()
    await tel.getByLabel(/14 ans ou plus/).check()
    await tel.getByRole('button', { name: 'Envoyer au mur' }).click()
    await tel.getByRole('button', { name: /Simuler l’approbation/ }).click()
    await pause(attenteAvantRetrait)
    const avant = await mur.locator('#vedette').innerText()
    await tel.getByRole('button', { name: 'Retirer ma contribution' }).click()
    await pause(300)
    if (nomCapture) await cap(mur, nomCapture)
    // Pendant 24 s (plus que les quatre vedettes de la scène), la phrase ne doit apparaître nulle part.
    let vue = 0
    for (let i = 0; i < 96; i++) {
      if ((await mur.locator('#stage').innerText()).includes(phrase)) vue++
      await pause(250)
    }
    console.log(`Retrait à ${attenteAvantRetrait / 1000} s (vedette ${avant.includes(phrase) ? 'affichée' : 'pas encore affichée'} au retrait) : phrase revue ${vue} fois en 24 s → ${vue === 0 ? 'OK' : 'ÉCHEC'}`)
  }
  await essaiRetrait('PHRASE-RETIREE-A', 1000) // le cas de l'équipe rouge : retrait 1 s après l'approbation
  await essaiRetrait('PHRASE-RETIREE-B', 6500, 'mur-11-retrait-pendant-vedette') // retrait pendant la vedette

  // Itération 3 · N-5 : l'avis ne nomme plus le Réseau comme responsable de la collecte.
  await tel.goto(URL + '?vue=formulaire')
  const avisA = await tel.locator('.tel-avis').innerText()
  const n5 = avisA.includes('Qui recueillerait : l’organisateur (à confirmer, par exemple le Réseau ACTION TI)') && !avisA.includes('Qui recueille :')
  console.log(`N-5 · avis : « ${avisA.match(/Qui recueill[^.]*\./)?.[0]} » → ${n5 ? 'OK' : 'ÉCHEC'}`)

  // Itération 3 · N-4 : retrait avec le code, depuis une page neuve ; le mur répond (retiré / inconnu).
  const telN4 = await ctx.newPage()
  await telN4.setViewportSize({ width: 360, height: 780 })
  surveiller(telN4, 'formulaire-n4')
  await telN4.goto(URL + '?vue=formulaire')
  await telN4.getByLabel('Rayonner au Canada').check()
  await telN4.getByLabel(/Un mot pour 2046/).fill('PHRASE-CODE-A')
  await telN4.getByLabel(/J’accepte/).check()
  await telN4.getByLabel(/14 ans ou plus/).check()
  await telN4.getByRole('button', { name: 'Envoyer au mur' }).click()
  await telN4.getByRole('button', { name: /Simuler l’approbation/ }).click()
  const codeN4 = await telN4.locator('#code-retrait').innerText()
  const aideCode = await telN4.locator('#statut-code').innerText()
  await telN4.close()
  await pause(1500)
  const telN4b = await ctx.newPage()
  await telN4b.setViewportSize({ width: 360, height: 780 })
  surveiller(telN4b, 'formulaire-n4-code')
  await telN4b.goto(URL + '?vue=formulaire')
  await telN4b.click('#par-code summary')
  await telN4b.getByLabel('Code de retrait').fill('R-ZZZZ')
  await telN4b.getByRole('button', { name: 'Retirer ce souhait' }).click()
  await telN4b.waitForFunction(() => /Aucun souhait|n’a pas répondu/.test(document.getElementById('etat-code').textContent), null, { timeout: 5000 }).catch(() => {})
  const etatInconnu = await telN4b.locator('#etat-code').innerText()
  console.log(`N-4 · code inconnu R-ZZZZ : « ${etatInconnu} » → ${/Aucun souhait ne porte le code R-ZZZZ/.test(etatInconnu) ? 'OK' : 'ÉCHEC'}`)
  await telN4b.getByLabel('Code de retrait').fill(codeN4.toLowerCase())
  await telN4b.getByRole('button', { name: 'Retirer ce souhait' }).click()
  await telN4b.waitForFunction(() => /confirmé|n’a pas répondu/.test(document.getElementById('etat-code').textContent), null, { timeout: 5000 }).catch(() => {})
  const etatConnu = await telN4b.locator('#etat-code').innerText()
  await cap(telN4b, 'formulaire-7-retrait-code')
  let revue = 0
  for (let i = 0; i < 40; i++) { if ((await mur.locator('#stage').innerText()).includes('PHRASE-CODE-A')) revue++; await pause(250) }
  console.log(`N-4 · code ${codeN4} saisi sur une page neuve : « ${etatConnu} », phrase revue ${revue} fois en 10 s → ${/Retrait confirmé par le mur/.test(etatConnu) && revue === 0 ? 'OK' : 'ÉCHEC'}`)
  console.log(`N-4 · aide du code : « ${aideCode.replace(/\s+/g, ' ')} » → ${aideCode.includes('tant que le mur reste ouvert') ? 'OK' : 'ÉCHEC'}`)
  await ctx.close()

  // Itération 3 · N-6 : « Proposition non officielle · prototype » visible dans les trois recadrages (1366 × 768).
  const ctxM = await navigateur.newContext({ viewport: { width: 1366, height: 768 } })
  const pm = await ctxM.newPage()
  surveiller(pm, 'recadrages')
  await pm.goto(URL)
  await pause(1500)
  const vues = []
  for (let i = 0; i < 3; i++) {
    const nom = (await pm.locator('#b-recadrer').innerText()).replace('Recadrer : ', '')
    const visible = await pm.evaluate(() => [...document.querySelectorAll('.mention-commandes, .marque-mention')].some((n) => {
      const r = n.getBoundingClientRect()
      return /Proposition non officielle/.test(n.textContent) && r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && parseFloat(getComputedStyle(n).opacity) >= 0.9
    }))
    vues.push(`${nom} ${visible ? 'oui' : 'NON'}`)
    if (nom.includes('droite')) await cap(pm, 'mur-12-recadre-droite-1366')
    await pm.locator('#b-recadrer').click()
    await pause(300)
  }
  console.log(`N-6 · mention dans la fenêtre : ${vues.join(', ')} → ${vues.every((v) => v.endsWith('oui')) ? 'OK' : 'ÉCHEC'}`)
  await ctxM.close()

  // Compteurs (constat A-3, WCAG 2.3.1) : au plus 3 changements de chiffres par seconde, rembobinage et vedettes.
  const ctxC = await navigateur.newContext({ viewport: { width: 1920, height: 540 } })
  const pc = await ctxC.newPage()
  surveiller(pc, 'compteurs')
  await pc.goto(URL)
  await pc.waitForSelector('#total')
  await pc.evaluate(() => {
    window.__changements = {}
    for (const id of ['compteur-annee', 'tete-annee', 'total']) {
      const n = document.getElementById(id)
      window.__changements[id] = []
      new MutationObserver(() => window.__changements[id].push(performance.now())).observe(n, { childList: true, characterData: true, subtree: true })
    }
  })
  await pause(19000) // horizon et rembobinage complet
  await pc.getByRole('button', { name: /Scène 2/ }).click()
  await pause(17000) // trois vedettes
  const ch = await pc.evaluate(() => window.__changements)
  for (const [id, ts] of Object.entries(ch)) {
    let max = 0
    for (let i = 0; i < ts.length; i++) max = Math.max(max, ts.filter((t) => t >= ts[i] && t < ts[i] + 1000).length)
    console.log(`#${id} : ${ts.length} changements en 36 s, au plus ${max} dans une fenêtre de 1 s → ${max <= 3 ? 'OK' : 'ÉCHEC'}`)
  }
  await ctxC.close()

  // 4. Mouvement réduit : états fixes.
  const ctxR = await navigateur.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const pr = await ctxR.newPage()
  surveiller(pr, 'reduit')
  // Positions (constat A-2) : en mouvement réduit, rien ne doit se déplacer entre deux relevés.
  const boite = (sel) => pr.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 2) / 2).join(',') }, sel)
  const immobile = async (sel, t1, t2, depart) => {
    await pause(t1 - (Date.now() - depart))
    const a = await boite(sel)
    await pause(t2 - (Date.now() - depart))
    const b = await boite(sel)
    console.log(`Mouvement réduit, ${sel} entre ${t1 / 1000} et ${t2 / 1000} s : ${a === b ? 'immobile → OK' : `déplacé (${a} → ${b}) → ÉCHEC`}`)
  }
  let depart = Date.now()
  await pr.goto(URL)
  await immobile('.carte-horizon', 620, 1540, depart)
  await immobile('#cerf', 1800, 2600, depart)
  await pause(10000 - (Date.now() - depart))
  await cap(pr, 'mur-10-mouvement-reduit')
  depart = Date.now()
  await pr.goto(URL + '?scene=2')
  await immobile('#releve', 1850, 2500, depart)
  await immobile('.point', 3050, 4080, depart)
  // La vedette : relevés 0,1 s puis 0,9 s après son apparition (elle reste 4,7 s).
  await pr.waitForFunction(() => getComputedStyle(document.getElementById('vedette')).opacity === '1', null, { timeout: 15000 })
  await immobile('#vedette', 100, 900, Date.now())
  await ctxR.close()

  // 5. Formulaire en anglais.
  const ctxE = await navigateur.newContext({ viewport: { width: 360, height: 780 } })
  const pe = await ctxE.newPage()
  surveiller(pe, 'anglais')
  await pe.goto(URL + '?vue=formulaire')
  await pe.getByRole('button', { name: 'Switch to English' }).click()
  await pause(300)
  await cap(pe, 'formulaire-6-anglais')
  await ctxE.close()

  await navigateur.close()
  console.log(erreurs.length ? 'Console :\n' + erreurs.join('\n') : 'Console : aucune erreur ni avertissement')
})()

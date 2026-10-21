// Captures et vérifications du concept B : node capture.cjs
// (serveur lancé depuis prototypes/ : npx vite --port 5192 --strictPort).
// Itération 2 : cas de test des constats B-1 à B-8 et T-1 (equipe-rouge-1.md).
// Itération 3 : cas N-1, N-3, N-5 (equipe-rouge-2.md) ; autre port possible : PORT=5195 node concept-b/capture.cjs.
const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')

const ORIGINE = `http://localhost:${process.env.PORT || '5192'}`
const BASE = ORIGINE + '/concept-b/'
const SORTIE = '/mnt/project-files/exp-002/etape-4/captures'
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const erreurs = []
  const suivre = (page, nom) => {
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`${nom} [${m.type()}] ${m.text()}`) })
    page.on('pageerror', (e) => erreurs.push(`${nom} [pageerror] ${e.message}`))
    page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) erreurs.push(`${nom} [requête] ${r.url()} ${r.failure()?.errorText}`) })
    page.on('request', (r) => { if (!r.url().startsWith(ORIGINE)) erreurs.push(`${nom} [hors ligne violé] ${r.url()}`) })
  }

  const verifs = []
  const ok = (code, cond, detail) => verifs.push(`${cond ? 'OK   ' : 'ÉCHEC'} ${code} · ${detail}`)
  const journal = (p) => p.$eval('#journal', (n) => n.textContent)
  const surMur = (p, txt) => p.evaluate((t) => document.querySelector('.scene').textContent.includes(t), txt)
  const ouvrirTel = async (ctx, nom) => {
    const t = await ctx.newPage(); suivre(t, nom)
    await t.setViewportSize({ width: 360, height: 780 })
    await t.goto(`${BASE}?vue=formulaire`)
    return t
  }
  const transmettre = async (t, texte) => {
    await t.fill('#phrase', texte); await t.check('#accord'); await t.check('#age')
    await t.click('#form button[type="submit"]')
    return t.$eval('#liste-envois li:last-child .code', (n) => n.textContent)
  }

  // 1. Mur, scène 1 (canal Internet, puis canal JIQ), 1920 × 540.
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur = await ctx.newPage(); suivre(mur, 'mur')
  await mur.goto(`${BASE}?canal=internet`); await mur.evaluate(() => localStorage.clear())
  await mur.goto(`${BASE}?canal=internet`)
  await attendre(7500)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-scene1-internet.png') })
  await mur.goto(`${BASE}?canal=jiq`)
  await attendre(8000)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-scene1-jiq.png') })
  // Vérifications : faits affichés avec data-fait, pause effective.
  const faits = await mur.$$eval('.carte[data-fait]', (n) => n.map((x) => x.dataset.fait))
  await mur.keyboard.press('Space')
  const p1 = await mur.$eval('#horloge', (n) => n.textContent); await attendre(2200)
  const p2 = await mur.$eval('#horloge', (n) => n.textContent)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-pause.png') })
  await mur.keyboard.press('Space')

  // B-3 et B-4 : F-002 hors du canal « Au-delà du Québec », date de F-070 exacte.
  await mur.goto(`${BASE}?canal=rayonnement`); await attendre(8000)
  const ray = await mur.$$eval('.rang[data-canal="rayonnement"] [data-fait], .carte[data-fait]', (n) => n.map((x) => x.dataset.fait))
  const d070 = await mur.$eval('.carte[data-fait="F-070"] .carte-date', (n) => n.textContent)
  ok('B-3', !ray.includes('F-002') && ray.includes('F-070'), `canal Rayonnement : ${[...new Set(ray)].join(', ')}`)
  ok('B-4', d070.startsWith('depuis 1998 (écrit en 2019-2020)'), `date affichée de F-070 : « ${d070.replace(/ F-070$/, '')} »`)
  ok('B-3', faits.includes('F-002'), 'F-002 est maintenant dans le canal JIQ (première JIQ)')

  // B-5 : une transmission reçue pendant la pause attend la reprise ; le mur ne bouge pas.
  await mur.goto(`${BASE}?canal=jiq`); await attendre(3000)
  await mur.keyboard.press('Space'); await attendre(300)
  const avant = await mur.screenshot()
  const entAvant = await mur.$eval('#entete-canal', (n) => n.textContent)
  const telP = await ouvrirTel(ctx, 'formulaire-pause')
  await transmettre(telP, 'PHRASE-PAUSE-B')
  await attendre(2500)
  await mur.bringToFront()
  const apres = await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-pause.png') })
  const entApres = await mur.$eval('#entete-canal', (n) => n.textContent)
  const msgPause = await telP.$eval('#etat', (n) => n.textContent)
  ok('B-5', Buffer.compare(avant, apres) === 0 && entAvant === entApres, 'mur identique au pixel près 2,5 s après une transmission reçue en pause')
  ok('B-5', /en pause/.test(msgPause), `le formulaire prévient : « ${msgPause.match(/Le mur est en pause[^.]*/)?.[0]} »`)
  await mur.keyboard.press('Space'); await attendre(4500)
  ok('B-5', (await journal(mur)).includes('PHRASE-PAUSE-B'), 'à la reprise, la transmission arrive et s\'affiche')
  await telP.close()

  // B-6 : rien dans localStorage, rien après rechargement.
  const ls1 = await mur.evaluate(() => localStorage.length)
  await mur.reload(); await attendre(1000)
  const ls2 = await mur.evaluate(() => localStorage.length)
  const j2 = await journal(mur)
  ok('B-6', ls1 === 0 && ls2 === 0 && !j2.includes('PHRASE-PAUSE-B'), `localStorage : ${ls1} clé avant et ${ls2} après rechargement ; journal vidé`)

  // 2. Scène 2 : une contribution saisie dans le formulaire (2e page, même portable).
  await mur.goto(`${BASE}?scene=2`)
  const tel = await ctx.newPage(); suivre(tel, 'formulaire')
  await tel.setViewportSize({ width: 360, height: 780 })
  await tel.goto(`${BASE}?vue=formulaire`)
  await tel.check('input[value="souhait"]')
  await tel.selectOption('#an-avenir', '2041')
  await tel.fill('#phrase', 'Que la JIQ de 2041 se vive aussi en région, en direct.')
  await tel.check('#accord')
  // B-2 : sans la case d'âge, rien n'est transmis.
  await tel.click('#form button[type="submit"]')
  const errAge = await tel.$eval('#erreur', (n) => n.textContent)
  ok('B-2', /âge/.test(errAge) && !(await journal(mur)).includes('2041'), `case distincte « J'ai 14 ans ou plus » obligatoire : « ${errAge} »`)
  await tel.check('#age')
  const texteTel = await tel.$eval('main', (n) => n.textContent)
  ok('B-8', texteTel.includes('Ne nommez personne') && !texteTel.includes('le moins de personnes'), 'aide : « Ne nommez personne »')
  ok('T-1', ['Qui recueille', 'Qui recueillerait', 'organisateur (à confirmer, par exemple le Réseau ACTION TI)', 'Pourquoi', 'Combien de temps', 'Comment retirer', 'code de retrait', 'simulés', 'Proposition non officielle · prototype'].every((m) => texteTel.includes(m)), 'avis : qui, pourquoi, combien de temps, comment retirer, simulé, mention non officielle')
  ok('N-5', texteTel.includes("Qui recueillerait : l'organisateur (à confirmer, par exemple le Réseau ACTION TI).") && !texteTel.includes('Qui recueille :'), `avis : « ${texteTel.match(/Qui recueill[^.]*\./)?.[0]} »`)
  await tel.screenshot({ path: path.join(SORTIE, 'concept-b-formulaire.png'), fullPage: true })
  await tel.click('button[type="submit"]')
  await attendre(5500)
  await tel.screenshot({ path: path.join(SORTIE, 'concept-b-formulaire-envoye.png'), fullPage: true })
  await mur.bringToFront(); await attendre(4000)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-scene2.png') })
  const code1 = await tel.$eval('#liste-envois .code', (n) => n.textContent)
  const ligneCode = await tel.$eval('#liste-envois .envoi-code', (n) => n.textContent)
  const avisRetrait = await tel.$eval('#avis', (n) => n.textContent)
  const aideCode = await tel.$eval('#aide-code', (n) => n.textContent)
  ok('N-3', [ligneCode, avisRetrait, aideCode].every((t) => t.includes('(démo : tant que le mur reste ouvert)')), `à l'écran : « ${ligneCode.trim()} » ; avis et aide du code portent la même précision`)
  ok('T-1', /^B-[A-Z0-9]{4}$/.test(code1), `code de retrait affiché après l'envoi : ${code1}`)
  ok('T-1', await surMur(mur, 'Proposition non officielle · prototype'), 'mur : « Proposition non officielle · prototype » dans la légende')

  // B-1 : « Retirer ma phrase » retire tout (carte, journal, case, compteur).
  const phrase1 = 'Que la JIQ de 2041 se vive aussi en région, en direct.'
  const avantRetrait = await surMur(mur, phrase1)
  await tel.click('#liste-envois button.retirer'); await attendre(1200)
  const cases2041 = await mur.$eval('.cp[data-an="2041"]', (n) => n.textContent.trim())
  ok('B-1', avantRetrait && !(await surMur(mur, phrase1)) && cases2041 === '', `bouton : phrase visible avant, absente après (carte, journal ; case 2041 « ${cases2041} »)`)
  // Retrait pendant l'arrivée (0,5 s après l'envoi) : la phrase ne doit jamais se poser.
  const telR = await ouvrirTel(ctx, 'formulaire-course')
  await transmettre(telR, 'PHRASE-RETIREE-B')
  await attendre(500); await telR.click('#liste-envois button.retirer'); await attendre(6000)
  ok('B-1', !(await surMur(mur, 'PHRASE-RETIREE-B')), 'retrait 0,5 s après l\'envoi : rien sur le mur 6 s plus tard')
  await telR.close()
  // Retrait plus tard avec le code, depuis une nouvelle page (le téléphone a été fermé).
  const telC = await ouvrirTel(ctx, 'formulaire-code-1')
  const code2 = await transmettre(telC, 'PHRASE-CODE-B')
  await telC.close(); await attendre(5000)
  const visibleAvant = await surMur(mur, 'PHRASE-CODE-B')
  const telD = await ouvrirTel(ctx, 'formulaire-code-2')
  await telD.click('.par-code summary'); await telD.fill('#code', code2.toLowerCase())
  await telD.click('#form-code button[type="submit"]'); await attendre(1000)
  const confD = await telD.$eval('#etat-code', (n) => n.textContent)
  ok('B-1', visibleAvant && !(await surMur(mur, 'PHRASE-CODE-B')) && /confirmé/.test(confD), `code ${code2} saisi sur une nouvelle page : phrase retirée, « ${confD} »`)
  await telD.close()
  await ctx.close()

  // 3. Mouvement réduit (prefers-reduced-motion).
  const ctxR = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const r = await ctxR.newPage(); suivre(r, 'réduit')
  await r.goto(`${BASE}?canal=releve`); await attendre(1500)
  await r.screenshot({ path: path.join(SORTIE, 'concept-b-mur-reduit.png') })
  await ctxR.close()

  // 4. Démo sur portable 1366 × 768 avec le téléphone ouvert.
  const ctxL = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const l = await ctxL.newPage(); suivre(l, 'portable')
  await l.goto(`${BASE}?canal=regions`); await attendre(500)
  await l.click('#btn-tel'); await attendre(7000)
  await l.screenshot({ path: path.join(SORTIE, 'concept-b-portable-demo.png') })
  // B-7 : mode recadré par défaut sur le portable, tailles rendues ; 56 px au mur.
  const lis = await l.evaluate(() => {
    const s = parseFloat(document.querySelector('.scene').style.transform.match(/scale\(([\d.]+)/)[1])
    const px = (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).fontSize)
    const deborde = [...document.querySelectorAll('.carte')].filter((n) => n.scrollHeight > n.clientHeight + 1).length
    return { s, recadre: document.getElementById('btn-recadre').getAttribute('aria-pressed'), texte: px('.carte-texte'), date: px('.carte-date'), deborde }
  })
  ok('B-7', lis.recadre === 'true' && lis.texte >= 56, `énoncés à ${lis.texte} px au mur ; mode recadré actif à 1366 px (échelle ${lis.s.toFixed(3)} au lieu de 0,178)`)
  ok('B-7', lis.texte * lis.s >= 18, `rendu à 1366 px : énoncés ${(lis.texte * lis.s).toFixed(1)} px, dates ${(lis.date * lis.s).toFixed(1)} px ; ${lis.deborde} carte qui déborde`)
  // N-1 (itération 3) : en recadré, un cartouche fixe nomme le canal actif, même quand la caméra a quitté la gauche.
  await l.click('#btn-tel') // referme le téléphone
  await attendre(2500)
  const n1 = await l.evaluate(() => {
    const c = document.getElementById('cartouche-canal'), r = c.getBoundingClientRect()
    const nom = document.querySelector('#entete-canal .canal-nom')?.textContent || ''
    const enTete = document.getElementById('entete-canal').getBoundingClientRect()
    return { texte: c.textContent, visible: !c.hidden && r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, nom, enteteHors: enTete.left < 0 || enTete.right > innerWidth }
  })
  await l.screenshot({ path: path.join(SORTIE, 'concept-b-portable-cartouche.png') })
  ok('N-1', n1.visible && n1.nom && n1.texte.includes(n1.nom), `1366 × 768 recadré : cartouche « ${n1.texte} » dans la fenêtre ; en-tête du canal ${n1.enteteHors ? 'hors cadre (en partie au moins)' : 'dans le cadre'}`)
  await l.click('#btn-s2'); await attendre(1500)
  const n1s2 = await l.$eval('#cartouche-canal', (c) => (c.hidden ? '' : c.textContent))
  await l.click('#btn-recadre'); await attendre(300)
  const n1off = await l.$eval('#cartouche-canal', (c) => c.hidden)
  ok('N-1', /Vous écrivez la suite/.test(n1s2) && n1off, `scène 2 : « ${n1s2} » ; mur entier (recadrage coupé) : cartouche ${n1off ? 'masqué' : 'VISIBLE'}`)
  await ctxL.close()

  // 5. Vidéo d'environ 15 s : un passage de canal, puis une transmission saisie qui arrive.
  const ctxV = await browser.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: SORTIE + '/tmp-video', size: { width: 1920, height: 540 } } })
  const v = await ctxV.newPage(); suivre(v, 'vidéo')
  await v.goto(`${BASE}?canal=internet`)
  await attendre(8500)
  const t2 = await ctxV.newPage(); suivre(t2, 'vidéo-formulaire')
  await t2.goto(`${BASE}?vue=formulaire`)
  await t2.fill('#phrase', 'Repartir avec une idée pour ma région.')
  await t2.check('#accord'); await t2.check('#age')
  await t2.click('button[type="submit"]')
  await t2.close()
  await attendre(6500)
  const video = v.video()
  await ctxV.close()
  const src = await video.path()
  fs.copyFileSync(src, path.join(SORTIE, 'concept-b-mur.webm'))
  fs.rmSync(SORTIE + '/tmp-video', { recursive: true, force: true })

  await browser.close()
  console.log('Faits en carte (canal JIQ) :', faits.join(', '))
  console.log('Pause : horloge', p1, '→', p2, p1 === p2 ? '(gelée, OK)' : '(ÉCHEC : elle tourne)')
  console.log('Vérifications des constats :\n' + verifs.join('\n'))
  console.log(erreurs.length ? 'Erreurs console :\n' + erreurs.join('\n') : 'Console : aucune erreur.')
})()

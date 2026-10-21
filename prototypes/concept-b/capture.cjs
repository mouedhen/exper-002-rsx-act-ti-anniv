// Captures du concept B : node capture.cjs (serveur Vite lancé sur le port 5175).
const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')

const BASE = 'http://localhost:5175/concept-b/'
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
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost:5175')) erreurs.push(`${nom} [hors ligne violé] ${r.url()}`) })
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

  // 2. Scène 2 : une contribution saisie dans le formulaire (2e page, même portable).
  await mur.goto(`${BASE}?scene=2`)
  const tel = await ctx.newPage(); suivre(tel, 'formulaire')
  await tel.setViewportSize({ width: 360, height: 780 })
  await tel.goto(`${BASE}?vue=formulaire`)
  await tel.check('input[value="souhait"]')
  await tel.selectOption('#an-avenir', '2041')
  await tel.fill('#phrase', 'Que la JIQ de 2041 se vive aussi en région, en direct.')
  await tel.check('#accord')
  await tel.screenshot({ path: path.join(SORTIE, 'concept-b-formulaire.png'), fullPage: true })
  await tel.click('button[type="submit"]')
  await attendre(5500)
  await tel.screenshot({ path: path.join(SORTIE, 'concept-b-formulaire-envoye.png'), fullPage: true })
  await mur.bringToFront(); await attendre(4000)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-b-mur-scene2.png') })
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
  await ctxL.close()

  // 5. Vidéo d'environ 15 s : un passage de canal, puis une transmission saisie qui arrive.
  const ctxV = await browser.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: SORTIE + '/tmp-video', size: { width: 1920, height: 540 } } })
  const v = await ctxV.newPage(); suivre(v, 'vidéo')
  await v.goto(`${BASE}?canal=internet`)
  await attendre(8500)
  const t2 = await ctxV.newPage(); suivre(t2, 'vidéo-formulaire')
  await t2.goto(`${BASE}?vue=formulaire`)
  await t2.fill('#phrase', 'Repartir avec une idée pour ma région.')
  await t2.check('#accord')
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
  console.log(erreurs.length ? 'Erreurs console :\n' + erreurs.join('\n') : 'Console : aucune erreur.')
})()

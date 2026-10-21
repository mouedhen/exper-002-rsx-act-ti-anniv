// Captures du concept A : mur (1920 × 540), formulaire (360 × 780), vidéo de 15 s du mur.
// Prérequis : `npx vite --port 5174 --strictPort` lancé depuis prototypes/.
// Usage : node concept-a/capture.cjs
const fs = require('fs')
const path = require('path')
const { chromium } = require('/opt/node22/lib/node_modules/playwright')

const URL = 'http://localhost:5174/concept-a/'
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
    if (!r.url().startsWith('http://localhost:5174/')) erreurs.push(`[${nom}] requête externe: ${r.url()}`)
  })
}

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const cap = (page, nom) => page.screenshot({ path: path.join(SORTIE, `concept-a-${nom}.png`) })

  // 1. Vidéo du mur, depuis le début de la boucle (horizon puis rembobinage).
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
  await ctx.close()

  // 4. Mouvement réduit : états fixes.
  const ctxR = await navigateur.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const pr = await ctxR.newPage()
  surveiller(pr, 'reduit')
  await pr.goto(URL)
  await pause(10000)
  await cap(pr, 'mur-10-mouvement-reduit')
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

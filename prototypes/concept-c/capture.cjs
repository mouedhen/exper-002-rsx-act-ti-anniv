// Captures du concept C : mur (1920 × 540), formulaire (360 × 780), vidéo du mur (~15 s).
// Prérequis : `npx vite --port 5176 --strictPort` lancé depuis prototypes/.
const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const fs = require('fs')
const path = require('path')

const URL = 'http://localhost:5176/concept-c/'
const SORTIE = '/mnt/project-files/exp-002/etape-4/captures'
const VIDEO_TMP = path.join(__dirname, '.video-tmp')
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const erreurs = []
  const surveiller = (page, nom) => {
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`${nom} [${m.type()}] ${m.text()}`) })
    page.on('pageerror', (e) => erreurs.push(`${nom} [pageerror] ${e.message}`))
    page.on('requestfailed', (r) => erreurs.push(`${nom} [requête] ${r.url()}`))
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost:5176')) erreurs.push(`${nom} [hors ligne violé] ${r.url()}`) })
  }

  // 1. Vidéo du mur, avec une contribution envoyée depuis le formulaire (même contexte = même portable).
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 540 } } })
  // Le formulaire est ouvert d'abord, en arrière-plan ; le mur reste au premier plan pendant l'enregistrement.
  const tel = await ctx.newPage()
  surveiller(tel, 'formulaire')
  await tel.setViewportSize({ width: 360, height: 780 })
  await tel.goto(URL + '?vue=formulaire')
  await tel.fill('#texte', 'Que le Québec numérique reste ouvert à toutes les régions.')
  await tel.fill('#signature', 'Démo C.')
  await tel.check('#consent')
  const mur = await ctx.newPage()
  surveiller(mur, 'mur')
  await mur.goto(URL)
  await mur.bringToFront()
  await attendre(3500)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1-impression.png') })
  await tel.evaluate(() => document.querySelector('button.envoyer').click())
  await attendre(7500)
  await mur.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1-contribution.png') })
  await attendre(1000)
  // Pause (barre d'espace) puis reprise
  await mur.keyboard.press('Space')
  await attendre(1200)
  const enPause = await mur.evaluate(() => window.__murC.tl.paused)
  await mur.keyboard.press('Space')
  await attendre(300)
  const video = await mur.video().path()
  await mur.close()
  await tel.bringToFront()
  await tel.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire-envoye.png') })
  await ctx.close()
  fs.copyFileSync(video, path.join(SORTIE, 'concept-c-mur.webm'))
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })

  // 2. Scène 2 (sélecteur de scène), état imprimé.
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const p2 = await ctx2.newPage()
  surveiller(p2, 'mur-scene2')
  await p2.goto(URL)
  await attendre(500)
  await p2.click('[data-aller="scene2"]')
  await attendre(15500)
  await p2.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene2-web.png') })
  await p2.click('[data-aller="scene1"]')
  await attendre(17000)
  await p2.screenshot({ path: path.join(SORTIE, 'concept-c-mur-scene1.png') })
  await ctx2.close()

  // 3. Mouvement réduit : états fixes.
  const ctx3 = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const p3 = await ctx3.newPage()
  surveiller(p3, 'mur-reduit')
  await p3.goto(URL)
  await attendre(1000)
  await p3.screenshot({ path: path.join(SORTIE, 'concept-c-mur-mouvement-reduit.png') })
  await ctx3.close()

  // 4. Formulaire vide et formulaire avec erreurs.
  const ctx4 = await browser.newContext({ viewport: { width: 360, height: 780 } })
  const f = await ctx4.newPage()
  surveiller(f, 'formulaire-vide')
  await f.goto(URL + '?vue=formulaire')
  await attendre(300)
  await f.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire.png') })
  await f.click('button.envoyer')
  await f.screenshot({ path: path.join(SORTIE, 'concept-c-formulaire-erreurs.png'), fullPage: true })
  await ctx4.close()

  await browser.close()
  console.log('Pause par la barre d\'espace :', enPause ? 'oui' : 'NON')
  console.log(erreurs.length ? 'Erreurs console :\n' + erreurs.join('\n') : 'Console : aucune erreur ni avertissement.')
  process.exit(erreurs.length ? 1 : 0)
})()

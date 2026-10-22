// Captures et cas de test de la combinaison : un cas (au moins) par règle non négociable.
// Prérequis : `npx vite --port 5199 --strictPort` lancé depuis prototypes/ (autre port : PORT=5197 node concept-combi/capture.cjs).
// Itération 2 : les faits sont vérifiés sur le texte VISIBLE (.saisie, .morph, opacité de chaque source), jamais
// sur le texte caché (.sr) ; un cas par constat de l'équipe rouge combi 1 (M-1 à M-4, m-1 à m-5).
// Itération 3 : un cas par constat de l'équipe rouge combi 2 (N-1, N-2, N-3), sur le texte visible et la position à l'écran.
// Sorties dans /mnt/project-files/exp-002/etape-4/captures/ : concept-combi-*.png, concept-combi-mur.webm,
// concept-combi-formulaire.webm (parcours téléphone → mur). Sort en erreur si un cas échoue.
const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const fs = require('fs')
const path = require('path')
const { lireReference, IDS } = require('./extraire-faits.cjs')

const ORIGINE = `http://localhost:${process.env.PORT || '5199'}`
const URL = ORIGINE + '/concept-combi/'
const SORTIE = '/mnt/project-files/exp-002/etape-4/captures'
const VIDEO_TMP = path.join(__dirname, '.video-tmp')
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))
const PNG = (nom) => path.join(SORTIE, `concept-combi-${nom}.png`)
const MENTIONS = ['Proposition non officielle · prototype', 'Unofficial proposal · prototype']

// Faits tels qu'on les VOIT : texte tapé (.saisie), nom en cours (.morph), éléments visibles et opaques ;
// le texte caché pour les lecteurs d'écran (.sr) n'est jamais lu. Une source n'est comptée que si elle est visible.
const FAITS_VISIBLES = () => {
  const vis = (el) => !!el && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && Number(getComputedStyle(el).opacity) > 0.99
  return [...document.querySelectorAll('[data-fait]')].map((el) => {
    const scene = el.closest('[data-scene]')?.dataset.scene || 'auj'
    if (el.matches('.ligne.fait')) {
      const s = el.querySelector('.src')
      return { id: el.dataset.fait, scene, genre: 'ligne', texte: vis(el) ? el.querySelector('.saisie').textContent : '', src: vis(s) ? s.textContent.trim() : '' }
    }
    if (el.matches('.nom')) return { id: el.dataset.fait, scene, genre: 'nom', texte: vis(el) ? el.querySelector('.morph').textContent : '', src: null }
    const s = el.querySelector('.src, .lien')
    return { id: el.dataset.fait, scene, genre: 'bloc', texte: vis(el) ? el.textContent : '', src: vis(el) && vis(s) ? s.textContent.replace(/[[\]]/g, '').trim() : '' }
  })
}
const ATTENDUS = { 1: ['F-001', 'F-002', 'F-003', 'F-033', 'F-007'], 2: ['F-034', 'F-010', 'F-012', 'F-014', 'F-016'], 3: ['F-078', 'F-079', 'F-081', 'F-031'], auj: ['F-031', 'F-030'] }
const norm = (t) => String(t).replace(/\s+/g, ' ').trim()
// Compare les faits visibles d'une scène à la référence : énoncé et date entiers, source visible et identique.
function ecartsVisibles(affiches, scene, ref) {
  const ecarts = []
  const ici = affiches.filter((f) => String(f.scene) === String(scene))
  for (const id of ATTENDUS[scene]) {
    const f = ici.find((x) => x.id === id && x.genre !== 'nom')
    const r = ref[id]
    if (!f) { ecarts.push(`${id} absent`); continue }
    if (!norm(f.texte).includes(norm(r.enonce))) ecarts.push(`${id} énoncé tronqué ou absent : « …${norm(f.texte).slice(-30)} »`)
    if (!norm(f.texte).includes(norm(r.date))) ecarts.push(`${id} date absente`)
    if (f.src !== `${id} · ${r.sources}`) ecarts.push(`${id} source visible « ${f.src} »`)
  }
  if (String(scene) === '2') {
    const nom = ici.find((x) => x.genre === 'nom')
    if (!nom || nom.texte !== 'Réseau ACTION TI') ecarts.push(`nom F-016 visible « ${nom?.texte} »`)
  }
  return ecarts
}

const verifs = []
const verifier = (regle, ok, detail) => { verifs.push({ regle, ok: !!ok, detail }); console.log(`${ok ? 'OK   ' : 'ÉCHEC'} ${regle} : ${detail}`) }

;(async () => {
  fs.mkdirSync(SORTIE, { recursive: true })
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-background-networking'] })
  const erreurs = []
  const horsLigne = []
  let requetes = 0
  const surveiller = (page, nom) => {
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(`${nom} [${m.type()}] ${m.text()}`) })
    page.on('pageerror', (e) => erreurs.push(`${nom} [pageerror] ${e.message}`))
    page.on('requestfailed', (r) => erreurs.push(`${nom} [requête] ${r.url()}`))
    page.on('request', (r) => { requetes++; const u = r.url(); if (!u.startsWith(ORIGINE) && !u.startsWith('data:') && u !== 'about:blank') horsLigne.push(`${nom} ${u}`) })
  }
  const ouvrir = async (ctx, nom, url, taille) => {
    const p = await ctx.newPage()
    surveiller(p, nom)
    if (taille) await p.setViewportSize(taille)
    await p.goto(url)
    return p
  }
  const TEL = { width: 360, height: 780 }
  // Remplit, envoie et fait approuver une phrase ; renvoie son code de retrait. `tel` : une page ou un cadre.
  const envoyer = async (tel, { type = 'souhait', cat = 'internet', an, texte = '' }, { lent = 0 } = {}) => {
    if (await tel.isVisible('#b-autre')) await tel.click('#b-autre')
    await tel.check(`input[name="type"][value="${type}"]`); await attendre(lent)
    await tel.check(`input[name="cat"][value="${cat}"]`); await attendre(lent)
    await tel.selectOption('#an', String(an)); await attendre(lent)
    if (texte) { if (lent) await tel.type('#texte', texte, { delay: 25 }); else await tel.fill('#texte', texte) }
    await attendre(lent)
    await tel.check('#c1'); await tel.check('#c2'); await attendre(lent)
    await tel.click('#form button[type="submit"]'); await attendre(lent)
    await tel.click('#b-approuver')
    return (await tel.textContent('#code-retrait')).trim()
  }
  const etat = (mur) => mur.evaluate(() => ({ scene: window.__murCombi.sceneActive(), contributions: window.__murCombi.contributions(), voyages: window.__murCombi.voyages(), file: window.__murCombi.file() }))
  const posee = (mur, id) => mur.waitForFunction((i) => window.__murCombi.contributions().some((c) => c.id === i && c.posee), id, { timeout: 20000 })
  const texteMur = (mur) => mur.evaluate(() => document.getElementById('scene-mur').innerText + ' ' + [...document.querySelectorAll('.voyageur, .vol')].map((v) => v.textContent).join(' '))
  const texteZone = (mur, k) => mur.evaluate((n) => document.querySelector(`#public-${n} .public-texte`).textContent, k)
  const mentionVisible = (page) => page.evaluate((mentions) => [...document.querySelectorAll('body *')].some((el) => {
    if (!mentions.includes(el.textContent.trim())) return false
    const r = el.getBoundingClientRect()
    const st = getComputedStyle(el)
    if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0 || !r.width) return false
    if (!(r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight)) return false
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2))
    const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))
    const dessus = document.elementFromPoint(x, y)
    return dessus === el || el.contains(dessus) || dessus?.contains(el)
  }), MENTIONS)

  // =====================================================================================
  console.log('étape 1 · vidéo du mur, l\'année choisit le décor')
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 540 }, recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 540 } } })
  const tel = await ouvrir(ctx, 'formulaire', URL + '?vue=formulaire', TEL)
  const mur = await ouvrir(ctx, 'mur', URL)
  await mur.bringToFront()
  await attendre(4000)
  await mur.screenshot({ path: PNG('mur-1-ecran-a-caracteres') })
  const id1985 = await envoyer(tel, { type: 'souvenir', cat: 'regions', an: 1985, texte: 'Phrase d’essai : un souvenir daté de 1985 (démo).' })
  await mur.bringToFront()
  await attendre(2600)
  await mur.screenshot({ path: PNG('mur-2-souvenir-1985-voyage') })
  await posee(mur, id1985)
  await attendre(600)
  const e1985 = await etat(mur)
  const z1 = await texteZone(mur, 1)
  verifier('Année → décor (souvenir 1985)', e1985.scene === 1 && z1.includes('souvenir daté de 1985'), `décor affiché à l'atterrissage : ${e1985.scene} ; zone du terminal : « ${z1.slice(0, 60)} »`)
  await mur.screenshot({ path: PNG('mur-3-souvenir-1985-imprime') })
  await mur.evaluate(() => window.__murCombi.allerScene(2))
  await attendre(5000)
  const id2040 = await envoyer(tel, { type: 'souhait', cat: 'internet', an: 2040, texte: 'Un Internet plus sobre en énergie, pour 2040.' })
  await mur.bringToFront()
  await mur.waitForSelector('.vol .lettre', { timeout: 8000 })
  await attendre(700)
  await mur.screenshot({ path: PNG('mur-4-souhait-2040-vol-des-lettres') })
  await posee(mur, id2040)
  await attendre(1200)
  const e2040 = await etat(mur)
  const z3 = await texteZone(mur, 3)
  const p2040 = await mur.evaluate((i) => document.querySelector(`.point[data-id="${i}"]`)?.dataset.an, id2040)
  verifier('Année → décor (souhait 2040)', e2040.scene === 3 && z3.includes('sobre en énergie') && p2040 === '2040', `décor à l'atterrissage : ${e2040.scene} (le mur était sur le décor 2) ; zone du futur : « ${z3.slice(0, 50)} » ; point posé à ${p2040}`)
  await mur.screenshot({ path: PNG('mur-5-souhait-2040-pose') })
  const id2001 = await envoyer(tel, { type: 'souvenir', cat: 'releve', an: 2001, texte: 'Phrase d’essai : un souvenir daté de 2001 (démo).' })
  await mur.bringToFront()
  await posee(mur, id2001)
  await attendre(800)
  const e2001 = await etat(mur)
  const z2 = await texteZone(mur, 2)
  verifier('Année → décor (souvenir 2001)', e2001.scene === 2 && z2.includes('2001'), `décor à l'atterrissage : ${e2001.scene} ; livre d'or : « ${z2.slice(0, 50)} »`)
  await mur.screenshot({ path: PNG('mur-6-souvenir-2001-livre-or') })
  await mur.keyboard.press('Space')
  await attendre(400)
  const pauseEspace = await mur.evaluate(() => window.__murCombi.enPause())
  await mur.keyboard.press('Space')
  await attendre(300)
  const pauseBouton1 = await (async () => { await mur.click('#btn-pause'); await attendre(200); return mur.evaluate(() => window.__murCombi.enPause()) })()
  await mur.click('#btn-pause')
  verifier('Pause (2.2.2) · espace et bouton', pauseEspace && pauseBouton1, `barre d'espace : ${pauseEspace ? 'en pause' : 'NON'} ; bouton : ${pauseBouton1 ? 'en pause' : 'NON'}`)
  await mur.evaluate(() => window.__murCombi.allerScene(3))
  await attendre(4000)
  const video = await mur.video().path()
  await mur.close(); await tel.close()
  await ctx.close()
  fs.copyFileSync(video, path.join(SORTIE, 'concept-combi-mur.webm'))
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })

  // =====================================================================================
  console.log('étape 2 · vidéo du parcours téléphone → mur')
  const ctxF = await browser.newContext({ viewport: { width: 1920, height: 820 }, recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 820 } } })
  const demo = await ctxF.newPage()
  surveiller(demo, 'demo')
  await demo.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#111;display:flex;gap:16px;padding:16px;font:14px system-ui;color:#eee">
    <div><p style="margin:0 0 6px">Téléphone (360 × 760)</p><iframe name="tel" src="${URL}?vue=formulaire" style="width:360px;height:760px;border:2px solid #555;border-radius:18px;background:#fff"></iframe></div>
    <div style="flex:1"><p style="margin:0 0 6px">Mur (même portable, BroadcastChannel)</p><iframe name="mur" src="${URL}?recadre=mur" style="width:1490px;height:420px;border:0"></iframe></div></body>`)
  await attendre(2500)
  const fTel = demo.frame({ name: 'tel' })
  const fMur = demo.frame({ name: 'mur' })
  await fTel.click('#form button[type="submit"]') // d'abord les erreurs
  await attendre(1500)
  const idF = await envoyer(fTel, { type: 'souhait', cat: 'releve', an: 2038, texte: 'Que la relève anime la JIQ de 2038.' }, { lent: 500 })
  await attendre(1500)
  await fMur.waitForFunction((i) => window.__murCombi.contributions().some((c) => c.id === i && c.posee), idF, { timeout: 20000 })
  await attendre(2500)
  await demo.screenshot({ path: PNG('parcours-telephone-mur') })
  await fTel.click(`.retirer-phrase[data-id="${idF}"]`)
  await attendre(2000)
  const apresRetraitF = await fMur.evaluate(() => document.getElementById('scene-mur').innerText)
  verifier('Parcours téléphone → mur (vidéo)', !apresRetraitF.includes('JIQ de 2038'), `phrase envoyée depuis le cadre téléphone, posée sur l'horizon, puis retirée : présente après retrait ${apresRetraitF.includes('JIQ de 2038') ? 'OUI' : 'non'}`)
  const videoF = await demo.video().path()
  await demo.close()
  await ctxF.close()
  fs.copyFileSync(videoF, path.join(SORTIE, 'concept-combi-formulaire.webm'))
  fs.rmSync(VIDEO_TMP, { recursive: true, force: true })

  // =====================================================================================
  console.log('étape 3 · faits, D-055, son, hors ligne (sources)')
  // Texte visible, scène par scène (en mouvement réduit, chaque décor s'affiche d'un bloc ; le mouvement normal
  // est vérifié à la fin de chaque introduction par l'étape 11).
  const ctx3r = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const p3r = await ouvrir(ctx3r, 'mur-faits-visibles', URL)
  await attendre(800)
  const ref = lireReference()
  const ecarts = []
  const vus = new Set()
  for (const k of [1, 2, 3]) {
    await p3r.evaluate((n) => window.__murCombi.allerScene(n), k)
    await attendre(1500)
    const aff = await p3r.evaluate(FAITS_VISIBLES)
    ecarts.push(...ecartsVisibles(aff, k, ref).map((e) => `décor ${k} : ${e}`))
    if (k === 1) ecarts.push(...ecartsVisibles(aff, 'auj', ref).map((e) => `aujourd'hui : ${e}`))
    aff.filter((f) => f.texte && (f.src || f.genre === 'nom') && (String(f.scene) === String(k) || f.scene === 'auj')).forEach((f) => vus.add(f.id))
  }
  await ctx3r.close()
  const horsListe = [...vus].filter((i) => !IDS.includes(i))
  verifier('Faits recopiés par script, avec source (texte VISIBLE)', !ecarts.length && IDS.every((i) => vus.has(i)) && !horsListe.length,
    ecarts.length ? ecarts.join(' ; ') : `${vus.size} faits distincts lus dans le texte visible (.saisie, .morph, éléments opaques), sources visibles : date, énoncé et sources identiques à faits-par-epoque.md (${IDS.join(', ')})`)
  const ctx3 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const p3 = await ouvrir(ctx3, 'mur-faits', URL)
  await attendre(800)
  // D-055 : aucun effectif, ni à l'écran (trois contenus, formulaire FR/EN, clôture) ni dans les sources hors commentaires.
  const EFFECTIF = /membre|contact|bénévol|adhérent|member|volunteer|\b1[46] ?000\b|\b2 ?[25]00\b|\b8 ?000\b/i
  const textes = []
  for (const c of ['exemples', 'vide', 'charge']) {
    const p = await ouvrir(ctx3, `mur-${c}`, `${URL}?contenu=${c}`)
    await attendre(300)
    textes.push(await p.evaluate(() => document.body.textContent))
    await p.close()
  }
  const pf = await ouvrir(ctx3, 'form-d055', URL + '?vue=formulaire', TEL)
  textes.push(await pf.evaluate(() => document.body.textContent))
  await pf.click('#b-langue')
  textes.push(await pf.evaluate(() => document.body.textContent))
  await pf.close()
  const sourcesJs = ['mur.js', 'formulaire.js', 'donnees.js', 'faits-ref.js', 'canal.js', 'main.js', 'index.html', 'style.css']
    .map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n'))
  // Les mots sont cherchés à l'écran et dans les sources ; les nombres, à l'écran seulement (le code a des durées en ms).
  const MOTS = /membre|contact|bénévol|adhérent|member|volunteer/gi
  const trouves = [...textes.flatMap((t) => t.match(new RegExp(EFFECTIF.source, 'gi')) || []), ...sourcesJs.flatMap((t) => t.match(MOTS) || [])]
  verifier('D-055 · aucun effectif', !trouves.length, trouves.length ? `trouvé : ${trouves.join(', ')}` : 'aucun « membre », « contact », « bénévole », « adhérent » ni effectif connu (14 000, 16 000, 2 500, 2 200, 8 000) à l\'écran (3 contenus, formulaire FR/EN, clôture) ni dans les sources hors commentaires')
  const sourcesBrutes = sourcesJs.join('\n')
  const son = /AudioContext|<audio|<video|new Audio|speechSynthesis/.test(sourcesBrutes)
  const sonDom = await p3.evaluate(() => document.querySelectorAll('audio, video').length)
  verifier('Pas de son (1.4.2)', !son && sonDom === 0, `audio ou vidéo dans le DOM : ${sonDom} ; AudioContext, <audio>, speechSynthesis dans les sources : ${son ? 'OUI' : 'non'}`)
  const urls = (sourcesBrutes.match(/https?:\/\/[^\s'"`)]+/g) || []).filter((u) => !u.startsWith('http://www.w3.org/'))
  const polices = await p3.evaluate(() => ({ faces: document.fonts.size, liens: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).filter((h) => !h.startsWith(location.origin)) }))
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  const depsOk = JSON.stringify(pkg.dependencies) === JSON.stringify({ motion: '14.0.0', animejs: '4.5.0' }) && JSON.stringify(pkg.devDependencies) === JSON.stringify({ vite: '8.3.2' })
  verifier('Hors ligne · sources et polices', !urls.length && polices.faces === 0 && !polices.liens.length && depsOk, `URL externes dans les sources : ${urls.length} ; @font-face : ${polices.faces} ; feuilles externes : ${polices.liens.length} ; package.json inchangé (motion 14.0.0, animejs 4.5.0, vite 8.3.2) : ${depsOk ? 'oui' : 'NON'}`)
  // Clôture de B
  await p3.click('#btn-cloture')
  await attendre(300)
  const clot = await p3.evaluate(() => ({ visible: !document.getElementById('cloture').hidden, titre: document.getElementById('cloture-t').textContent, lignes: document.querySelectorAll('#cloture tbody tr').length }))
  const mentionClot = await mentionVisible(p3)
  await p3.screenshot({ path: PNG('cloture-ce-que-ca-demande') })
  await p3.keyboard.press('Escape')
  await attendre(200)
  const fermee = await p3.evaluate(() => document.getElementById('cloture').hidden)
  verifier('Écran de clôture (B)', clot.visible && clot.titre === 'Ce que ça demande au Réseau' && clot.lignes === 5 && mentionClot && fermee, `ouvert : ${clot.visible} ; « ${clot.titre} » ; ${clot.lignes} besoins ; mention visible : ${mentionClot} ; Échap ferme : ${fermee}`)
  await ctx3.close()

  // =====================================================================================
  console.log('étape 4 · pause qui retient les arrivées et fige le vol des lettres')
  const ctx4 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const tel4 = await ouvrir(ctx4, 'form-pause', URL + '?vue=formulaire', TEL)
  const mur4 = await ouvrir(ctx4, 'mur-pause', URL)
  await mur4.bringToFront()
  await attendre(2000)
  await mur4.addStyleTag({ content: '.commandes { visibility: hidden !important; }' })
  await mur4.keyboard.press('Space')
  await attendre(300)
  const img1 = await mur4.screenshot()
  const html1 = await mur4.evaluate(() => document.getElementById('scene-mur').innerHTML)
  const idP = await envoyer(tel4, { type: 'souvenir', cat: 'releve', an: 1980, texte: 'ARRIVEE-PENDANT-PAUSE' })
  await attendre(2500)
  const img2 = await mur4.screenshot()
  const html2 = await mur4.evaluate(() => document.getElementById('scene-mur').innerHTML)
  const e4 = await etat(mur4)
  const msgForm = await tel4.textContent('#statut-texte')
  verifier('Pause (2.2.2) · arrivée retenue', img1.equals(img2) && html1 === html2 && e4.file === 1 && /pause/.test(msgForm), `captures identiques à 2,5 s : ${img1.equals(img2)} ; DOM du mur identique : ${html1 === html2} ; en file : ${e4.file} ; formulaire : « ${msgForm} »`)
  await mur4.keyboard.press('Space')
  await posee(mur4, idP)
  verifier('Pause (2.2.2) · reprise', true, 'la phrase retenue s\'affiche après la reprise, dans le décor de 1980')
  // Pause pendant le vol des lettres : les lettres ne bougent plus.
  await envoyer(tel4, { type: 'souhait', cat: 'regions', an: 2033, texte: 'Une JIQ itinérante, une région par année.' })
  await mur4.waitForSelector('.vol .lettre', { timeout: 8000 })
  await attendre(400)
  await mur4.keyboard.press('Space')
  await attendre(100)
  const pos1 = await mur4.evaluate(() => [...document.querySelectorAll('.vol .lettre')].map((l) => l.style.transform).join('|'))
  await attendre(1500)
  const pos2 = await mur4.evaluate(() => [...document.querySelectorAll('.vol .lettre')].map((l) => l.style.transform).join('|'))
  await mur4.screenshot({ path: PNG('pause-pendant-le-vol') })
  verifier('Pause (2.2.2) · animation en cours figée', pos1 === pos2 && pos1.length > 0, `transformations des lettres identiques à 1,5 s d'écart : ${pos1 === pos2}`)
  await mur4.keyboard.press('Space')
  await ctx4.close()

  // =====================================================================================
  console.log('étape 5 · retrait qui annule toute animation en cours')
  const ctx5 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const tel5 = await ouvrir(ctx5, 'form-retrait', URL + '?vue=formulaire', TEL)
  const mur5 = await ouvrir(ctx5, 'mur-retrait', URL)
  await mur5.bringToFront()
  await attendre(1000)
  // a) pendant le vol des lettres vers 2044
  const idA = await envoyer(tel5, { type: 'souhait', cat: 'rayonnement', an: 2044, texte: 'PHRASE-RETIREE-EN-VOL' })
  await mur5.waitForSelector('.vol .lettre', { timeout: 8000 })
  await attendre(300)
  await tel5.click(`.retirer-phrase[data-id="${idA}"]`)
  await attendre(5000)
  const tA = await texteMur(mur5)
  const rA = await mur5.evaluate((i) => ({ vol: document.querySelectorAll('.vol, .voyageur').length, point: !!document.querySelector(`.point[data-id="${i}"]`), voyages: window.__murCombi.voyages() }), idA)
  const formA = await tel5.textContent(`#liste-envoyees li[data-id="${idA}"]`)
  verifier('Retrait pendant le vol des lettres', !tA.includes('PHRASE-RETIREE-EN-VOL') && !rA.vol && !rA.point && !rA.voyages && /Retirée/.test(formA),
    `5 s après : phrase visible ${tA.includes('PHRASE-RETIREE-EN-VOL') ? 'OUI' : 'non'} ; lettres ou voyageurs restants ${rA.vol} ; point ${rA.point ? 'OUI' : 'non'} ; formulaire « ${formA.replace(/\s+/g, ' ').trim().slice(-40)} »`)
  await mur5.screenshot({ path: PNG('retrait-pendant-le-vol') })
  // b) pendant l'impression au caractère dans le terminal
  const idB = await envoyer(tel5, { type: 'souvenir', cat: 'regions', an: 1983, texte: 'PHRASE-RETIREE-PENDANT-IMPRESSION avec assez de caractères pour durer.' })
  await mur5.waitForFunction(() => document.querySelector('#public-1 .public-texte.frappe'), null, { timeout: 12000 })
  await attendre(300)
  await tel5.click(`.retirer-phrase[data-id="${idB}"]`)
  await attendre(4000)
  const tB = await texteMur(mur5)
  const rB = await mur5.evaluate(() => ({ frappe: !!document.querySelector('.frappe'), voyages: window.__murCombi.voyages() }))
  verifier('Retrait pendant l\'impression (terminal)', !tB.includes('PHRASE-RETIREE') && !rB.frappe && !rB.voyages, `4 s après : phrase visible ${tB.includes('PHRASE-RETIREE') ? 'OUI' : 'non'} ; impression en cours ${rB.frappe ? 'OUI' : 'non'}`)
  // c) en file pendant la pause
  await mur5.keyboard.press('Space')
  const idC = await envoyer(tel5, { type: 'souhait', cat: 'releve', an: 2030, texte: 'PHRASE-RETIREE-EN-PAUSE' })
  await attendre(500)
  await tel5.click(`.retirer-phrase[data-id="${idC}"]`)
  await attendre(500)
  await mur5.keyboard.press('Space')
  await attendre(6000)
  const tC = await texteMur(mur5)
  verifier('Retrait pendant la pause', !tC.includes('PHRASE-RETIREE-EN-PAUSE'), `6 s après la reprise : phrase visible ${tC.includes('PHRASE-RETIREE-EN-PAUSE') ? 'OUI' : 'non'}`)
  // d) par code, depuis une page neuve, avec réponse du mur ; et code inconnu
  const idD = await envoyer(tel5, { type: 'souvenir', cat: 'internet', an: 1999, texte: 'PHRASE-RETIREE-PAR-CODE' })
  await posee(mur5, idD)
  const neuve = await ouvrir(ctx5, 'form-neuf', URL + '?vue=formulaire', TEL)
  await neuve.click('#par-code summary')
  await neuve.fill('#code', 'R-ZZZZ')
  await neuve.click('#form-code button')
  await attendre(800)
  const inconnu = await neuve.textContent('#etat-code')
  await neuve.fill('#code', idD.toLowerCase())
  await neuve.click('#form-code button')
  await attendre(800)
  const confirme = await neuve.textContent('#etat-code')
  await neuve.screenshot({ path: PNG('formulaire-6-retrait-par-code'), fullPage: true })
  const tD = await texteMur(mur5)
  verifier('Retrait par code, réponse du mur', /Aucune phrase ne porte le code R-ZZZZ/.test(inconnu) && /Retrait confirmé par le mur/.test(confirme) && !tD.includes('PHRASE-RETIREE-PAR-CODE'),
    `code inconnu : « ${inconnu} » ; code réel sur une page neuve : « ${confirme} » ; phrase visible ensuite ${tD.includes('PHRASE-RETIREE-PAR-CODE') ? 'OUI' : 'non'}`)
  // e) m-1 : retrait 0,7 s après la naissance du point ; le trait jaune disparaît avec la phrase
  await mur5.bringToFront()
  await mur5.evaluate(() => window.__murCombi.allerScene(3))
  await attendre(2500)
  const idE = await envoyer(tel5, { type: 'souhait', cat: 'regions', an: 2043, texte: 'PHRASE-RETIREE-APRES-POSE' })
  await posee(mur5, idE)
  await attendre(700)
  const lienOpac = () => mur5.evaluate(() => Number(getComputedStyle(document.getElementById('lien-point')).opacity))
  const traitAvant = await lienOpac()
  await tel5.click(`.retirer-phrase[data-id="${idE}"]`)
  await attendre(400)
  const traitApres = await lienOpac()
  const tE = await texteMur(mur5)
  await mur5.screenshot({ path: PNG('retrait-trait-efface') })
  await attendre(1500)
  const traitPlusTard = await lienOpac()
  verifier('m-1 · le trait du point disparaît avec la phrase retirée', traitAvant > 0.9 && traitApres === 0 && traitPlusTard === 0 && !tE.includes('PHRASE-RETIREE-APRES-POSE'),
    `opacité du trait 0,7 s après la naissance du point : ${traitAvant} ; 0,4 s après le retrait : ${traitApres} ; 1,9 s après : ${traitPlusTard} ; phrase visible ${tE.includes('PHRASE-RETIREE-APRES-POSE') ? 'OUI' : 'non'}`)
  await ctx5.close()

  // =====================================================================================
  console.log('étape 6 · mouvement réduit')
  const ctx6 = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: 'reduce' })
  const tel6 = await ouvrir(ctx6, 'form-reduit', URL + '?vue=formulaire', TEL)
  const mur6 = await ouvrir(ctx6, 'mur-reduit', URL)
  await mur6.bringToFront()
  await attendre(800)
  const echantillons = await mur6.evaluate(async () => {
    window.__murCombi.allerScene(3)
    const s = []
    const t0 = performance.now()
    while (performance.now() - t0 < 1200) { s.push([Math.round(performance.now() - t0), Number(getComputedStyle(document.getElementById('scene3')).opacity)]); await new Promise((r) => setTimeout(r, 40)) }
    return s
  })
  const inter = echantillons.filter(([, o]) => o > 0.02 && o < 0.98)
  const debut = echantillons.find(([, o]) => o > 0.02)?.[0] ?? 0
  const fin = echantillons.find(([, o]) => o >= 0.98)?.[0] ?? 0
  verifier('Mouvement réduit · pas de saut brutal', inter.length >= 5 && fin - debut >= 400, `changement de décor en fondu : ${inter.length} valeurs intermédiaires, de ${debut} à ${fin} ms`)
  let lettresVues = 0
  await mur6.exposeFunction('__vu', () => { lettresVues++ })
  await mur6.evaluate(() => new MutationObserver(() => { if (document.querySelector('.vol, .lettre, .voyageur')) window.__vu() }).observe(document.getElementById('scene-mur'), { childList: true, subtree: true }))
  const idR = await envoyer(tel6, { type: 'souhait', cat: 'regions', an: 2036, texte: 'Phrase d’essai en mouvement réduit.' })
  const opac = await mur6.evaluate(async () => {
    const s = []
    const t0 = performance.now()
    while (performance.now() - t0 < 3500) { s.push(Number(getComputedStyle(document.querySelector('#public-3 .public-texte')).opacity)); await new Promise((r) => setTimeout(r, 40)) }
    return s
  })
  await posee(mur6, idR)
  await attendre(400)
  const tetes = await mur6.evaluate(() => document.getElementById('tete-annee').textContent)
  verifier('Mouvement réduit · arrivée sans déplacement', lettresVues === 0 && opac.some((o) => o > 0.05 && o < 0.95), `lettres, voyageurs créés : ${lettresVues} ; la phrase apparaît par un fondu (${opac.filter((o) => o > 0.05 && o < 0.95).length} valeurs intermédiaires) ; tête de lecture d'emblée à ${tetes}`)
  await mur6.screenshot({ path: PNG('mouvement-reduit') })
  // m-4 : pire cas de luminance (rotation vers la page claire, puis arrivée vers le terminal sombre) ;
  // le second changement attend la fin du fondu, puis 1 s de décor stable.
  await attendre(1500)
  // L'arrivée est postée sur le canal local dans la même milliseconde que la rotation (pire cas exact).
  const idL = 'R-LUMI'
  await mur6.evaluate((id) => {
    window.__sc = []
    new MutationObserver(() => window.__sc.push([performance.now(), document.body.dataset.scene])).observe(document.body, { attributes: true, attributeFilter: ['data-scene'] })
    window.__murCombi.allerScene(2)
    new BroadcastChannel('concept-combi-contributions').postMessage({ type: 'ajout', id, typeContribution: 'souvenir', cat: 'regions', an: 1980, texte: 'Phrase d’essai : retour au terminal.' })
  }, idL)
  await posee(mur6, idL)
  const sc6 = await mur6.evaluate(() => window.__sc)
  const tP = sc6.find(([, n]) => n === '2')?.[0]
  const tT = sc6.find(([t, n]) => n === '1' && t > tP)?.[0]
  verifier('m-4 · aucun changement de décor pendant un fondu (mouvement réduit)', tP != null && tT != null && tT - tP >= 1550,
    `rotation vers la page claire et arrivée d'un souvenir de 1980 dans la même milliseconde : page claire à 0 ms, retour au terminal sombre à ${Math.round(tT - tP)} ms (fondu de 600 ms, puis au moins 1 s de décor stable ; avant le correctif : environ 400 ms)`)
  await ctx6.close()

  // =====================================================================================
  console.log('étape 7 · compteurs : 2 changements par seconde au plus (2.3.1)')
  const ctx7 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur7 = await ouvrir(ctx7, 'mur-compteur', URL + '?contenu=charge')
  await attendre(500)
  const releve = await mur7.evaluate(async () => {
    const t = {}
    const obs = new MutationObserver((ms) => { for (const m of ms) { const el = (m.target.nodeType === 3 ? m.target.parentElement : m.target).closest('[data-compteur]'); if (el) (t[el.dataset.compteur] ||= []).push(performance.now()) } })
    document.querySelectorAll('[data-compteur]').forEach((el) => obs.observe(el, { childList: true, characterData: true, subtree: true }))
    window.__murCombi.allerScene(3)
    await new Promise((r) => setTimeout(r, 16000))
    obs.disconnect()
    const max = {}
    for (const [k, v] of Object.entries(t)) max[k] = Math.max(...v.map((a) => v.filter((b) => b >= a && b < a + 1000).length))
    return { n: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.length])), max }
  })
  const maxi = Math.max(0, ...Object.values(releve.max))
  verifier('Compteurs ≤ 2 changements par seconde (2.3.1)', maxi <= 2 && (releve.n.tete || 0) >= 15, `changements sur 16 s : ${JSON.stringify(releve.n)} ; au plus ${maxi} dans une fenêtre de 1 s`)
  await mur7.screenshot({ path: PNG('mur-7-charge-80-simulees') })
  // Mur chargé : 80 contributions simulées, toutes marquées, rien ne déborde.
  const charge = await mur7.evaluate(() => {
    const l = document.getElementById('liste-contrib')
    const pts = [...document.querySelectorAll('.point')]
    const zone = document.querySelector('#public-3').getBoundingClientRect()
    return {
      n: window.__murCombi.contributions().length,
      exemples: window.__murCombi.contributions().filter((c) => c.simule === 'exemple').length,
      points: pts.length,
      pointsMarques: pts.filter((p) => ['exemple', 'demo'].includes(p.dataset.simule)).length,
      cartes: [...document.querySelectorAll('.carte-contrib')].map((c) => c.querySelector('.badge')?.textContent || ''),
      deborde: l.scrollHeight > l.clientHeight + 1,
      plus: document.getElementById('plus').textContent,
      pastille: document.querySelector('.pastille-contenu')?.textContent,
      chevauche: pts.filter((p) => p.getBoundingClientRect().top < zone.bottom).length,
      vedette: document.querySelector('#public-3 .public-meta').textContent,
    }
  })
  verifier('Mur chargé (80 simulées)', charge.n === 80 && charge.exemples === 80 && charge.points === 80 && charge.pointsMarques === 80 && charge.cartes.every((b) => /simulé/i.test(b)) && !charge.deborde && /exemples simulés/.test(charge.plus) && !charge.chevauche,
    `${charge.n} contributions, ${charge.exemples} marquées « exemple », ${charge.points} points ; badges des cartes : ${charge.cartes.join(' / ')} ; « ${charge.plus} » ; fil déborde : ${charge.deborde} ; points sous la phrase en vedette : ${charge.chevauche}`)
  const v1 = await mur7.evaluate(() => document.querySelector('#public-3 .public-texte').textContent)
  await attendre(6500)
  const v2 = await mur7.evaluate(() => document.querySelector('#public-3 .public-texte').textContent)
  verifier('Mur chargé · rotation lisible', v1 !== v2, `la phrase en vedette change toutes les 6 s (« ${v1.slice(0, 30)} » → « ${v2.slice(0, 30)} »)`)
  await ctx7.close()

  // m-2 : une arrivée en plein balayage ; on compte les changements VISIBLES du compteur de la tête.
  const ctx7b = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const tel7 = await ouvrir(ctx7b, 'form-compteur', URL + '?vue=formulaire', TEL)
  const mur7b = await ouvrir(ctx7b, 'mur-compteur-arrivee', URL)
  await mur7b.bringToFront()
  await attendre(500)
  await mur7b.evaluate(() => {
    window.__vis = []; window.__tous = 0
    const el = document.getElementById('tete-annee')
    new MutationObserver(() => { window.__tous++; if (Number(getComputedStyle(el).opacity) > 0.05) window.__vis.push([performance.now(), el.textContent]) })
      .observe(el, { childList: true, characterData: true, subtree: true })
    window.__murCombi.allerScene(3)
  })
  await attendre(5000)
  const avantArrivee = await mur7b.evaluate(() => document.getElementById('tete-annee').textContent)
  const idT = await envoyer(tel7, { type: 'souhait', cat: 'releve', an: 2041, texte: 'Arrivée en plein balayage.' })
  await posee(mur7b, idT)
  await attendre(1500)
  const rt = await mur7b.evaluate(() => {
    const v = window.__vis.map(([t]) => t)
    const el = document.getElementById('tete-annee')
    return { tous: window.__tous, visibles: v.length, max: Math.max(0, ...v.map((a) => v.filter((b) => b >= a && b < a + 1000).length)), fin: el.textContent, opac: Number(getComputedStyle(el).opacity) }
  })
  verifier('m-2 · compteur ≤ 2 changements visibles par seconde, arrivée en plein balayage', rt.max <= 2 && rt.fin === '2046' && rt.opac > 0.99 && avantArrivee !== '2046',
    `arrivée quand la tête était à ${avantArrivee} ; ${rt.tous} changements, dont ${rt.visibles} visibles ; au plus ${rt.max} visibles dans une fenêtre de 1 s ; compteur final ${rt.fin}, opacité ${rt.opac}`)
  await ctx7b.close()

  // =====================================================================================
  console.log('étape 8 · état vide du matin, contributions marquées')
  const ctx8 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur8 = await ouvrir(ctx8, 'mur-vide', URL + '?contenu=vide')
  await attendre(4000)
  await mur8.screenshot({ path: PNG('mur-8-vide-matin-ecran') })
  await mur8.evaluate(() => window.__murCombi.allerScene(3))
  await attendre(14000)
  await mur8.screenshot({ path: PNG('mur-9-vide-matin-futur') })
  const vide = await mur8.evaluate(() => ({
    n: window.__murCombi.contributions().length,
    cartes: document.querySelectorAll('.carte-contrib').length,
    points: document.querySelectorAll('.point').length,
    invitation: document.querySelector('.fil-vide')?.textContent || '',
    zones: [...document.querySelectorAll('.zone-public')].map((z) => z.classList.contains('attente')),
    exemple: /Exemple simulé/.test(document.getElementById('scene-mur').innerText),
  }))
  verifier('État vide du matin', vide.n === 0 && !vide.cartes && !vide.points && /Personne n’a encore écrit/.test(vide.invitation) && vide.zones.every(Boolean) && !vide.exemple,
    `${vide.n} contribution, ${vide.points} point ; fil : « ${vide.invitation.slice(0, 40)}… » ; 3 décors en attente : ${vide.zones.every(Boolean)} ; aucun exemple simulé affiché : ${!vide.exemple}`)
  // M-4 : un souvenir de 2009 à 2025 reste au fil « Aujourd'hui », marqué de son année ; m-3 : la pastille du matin vide disparaît.
  const tel8 = await ouvrir(ctx8, 'form-2019', URL + '?vue=formulaire', TEL)
  await tel8.check('input[name="type"][value="souvenir"]')
  await tel8.selectOption('#an', '2009')
  const aide2009 = await tel8.textContent('#aide-an')
  await tel8.selectOption('#an', '2008')
  const aide2008 = await tel8.textContent('#aide-an')
  await mur8.bringToFront()
  await mur8.evaluate(() => window.__murCombi.allerScene(3))
  await attendre(2000)
  const pastilleAvant = await mur8.evaluate(() => !!document.querySelector('.pastille-contenu'))
  const id2019 = await envoyer(tel8, { type: 'souvenir', cat: 'internet', an: 2019, texte: 'Phrase d’essai : un souvenir daté de 2019 (démo).' })
  await attendre(400)
  const statut2019 = await tel8.textContent('#statut-texte')
  await posee(mur8, id2019)
  await attendre(600)
  const r2019 = await mur8.evaluate((i) => {
    const li = document.querySelector(`.carte-contrib[data-id="${i}"]`)
    return {
      scene: window.__murCombi.sceneActive(),
      genre: li?.querySelector('.genre').textContent || '',
      visible: !!li && li.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      zones: [1, 2, 3].map((k) => document.querySelector(`#public-${k} .public-texte`).textContent).join(' | '),
      pastille: !!document.querySelector('.pastille-contenu'),
      titre2: document.querySelector('#scene2 .bandeau h2').textContent,
      bouton2: document.querySelector('.btn-scene[data-aller="2"]').textContent,
    }
  }, id2019)
  await mur8.screenshot({ path: PNG('mur-11-souvenir-2019-fil-aujourdhui') })
  await tel8.screenshot({ path: PNG('formulaire-5-souvenir-2019'), fullPage: true })
  verifier('M-4 · souvenir 2009-2025 → fil « Aujourd’hui », marqué de son année', r2019.scene === 3 && r2019.visible && /^2019Souvenir de 2019 → reste au fil : pas de décor/.test(r2019.genre) && !r2019.zones.includes('2019') && /1991-2008/.test(r2019.titre2) && r2019.bouton2 === '1991-2008' && /Pas de décor pour 2009-2025/.test(aide2009) && /la page web \(1991-2008\)/.test(aide2008) && /fil « Aujourd’hui », marquée 2019/.test(statut2019),
    `décor inchangé (${r2019.scene}) ; carte du fil : « ${r2019.genre} » ; aucun décor ne la montre : ${!r2019.zones.includes('2019')} ; décor 2 titré « ${r2019.titre2} » ; formulaire, 2009 : « ${aide2009.slice(0, 60)}… », 2008 : « ${aide2008} » ; après l'envoi : « ${statut2019.slice(0, 75)}… »`)
  verifier('m-3 · la pastille « matin vide » disparaît à la première arrivée', pastilleAvant && !r2019.pastille, `pastille avant : ${pastilleAvant} ; après la première arrivée : ${r2019.pastille}`)
  const id2008 = await envoyer(tel8, { type: 'souvenir', cat: 'releve', an: 2008, texte: 'Phrase d’essai : un souvenir daté de 2008 (démo).' })
  await mur8.bringToFront()
  await posee(mur8, id2008)
  await attendre(800)
  const e2008 = await etat(mur8)
  const z2008 = await texteZone(mur8, 2)
  verifier('M-4 · borne 2008 → page web', e2008.scene === 2 && z2008.includes('2008'), `décor à l'atterrissage : ${e2008.scene} ; livre d'or : « ${z2008.slice(0, 50)} »`)
  await ctx8.close()
  const ctx8b = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur8b = await ouvrir(ctx8b, 'mur-exemples', URL)
  await attendre(500)
  const marques = await mur8b.evaluate(() => [...document.querySelectorAll('.carte-contrib')].map((c) => [c.dataset.simule, c.querySelector('.badge').textContent]).concat([...document.querySelectorAll('.zone-public')].filter((z) => z.dataset.contribution).map((z) => ['zone', z.querySelector('.public-meta').textContent])))
  verifier('Contributions simulées marquées', marques.length >= 3 && marques.every(([, t]) => /simulé/i.test(t)), marques.map(([k, t]) => `${k} : « ${t.replace(/.*· (exemple simulé|contribution de démo, simulée).*/, '$1')} »`).join(' ; '))
  await ctx8b.close()

  // =====================================================================================
  console.log('étape 9 · mode recadré à 1366 px, mention dans toutes les vues')
  const ctx9 = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const mur9 = await ouvrir(ctx9, 'mur-1366', URL + '?contenu=charge')
  await attendre(800)
  const vueDefaut = await mur9.evaluate(() => document.body.dataset.vue)
  const tailles = []
  for (const n of [1, 2, 3]) {
    await mur9.evaluate((k) => window.__murCombi.allerScene(k), n)
    await attendre(n === 1 ? 14000 : n === 2 ? 15000 : 15000)
    await mur9.screenshot({ path: PNG(`1366-recadre-decor-${n}`) })
    tailles.push(await mur9.evaluate((k) => {
      const s = document.getElementById('scene-mur').getBoundingClientRect().width / 7680
      const px = (sel) => Math.min(...[...document.querySelectorAll(`#scene${k} ${sel}`)].map((e) => parseFloat(getComputedStyle(e).fontSize) * s))
      const sels = { 1: ['.ligne.fait', '.ligne .src', '.public-texte', '.public-meta'], 2: ['.liste-faits', '.lien', '.public-texte', '.public-meta'], 3: ['.carte-futur .enonce', '.carte-futur .src', '.public-texte', '.public-meta', '.an-grad'] }[k]
      return Object.fromEntries(sels.map((q) => [q, Math.round(px(q) * 10) / 10]))
    }, n))
  }
  // m-5 : dans la vue recadrée par défaut, les lettres partent du cadre visible, pas de hors champ.
  const tel9 = await ouvrir(ctx9, 'form-1366', URL + '?vue=formulaire', TEL)
  await mur9.bringToFront()
  const id1366 = await envoyer(tel9, { type: 'souhait', cat: 'regions', an: 2039, texte: 'Une JIQ itinérante, une région par année.' })
  await mur9.waitForSelector('.vol .lettre', { timeout: 10000 })
  const bord = await mur9.evaluate(() => {
    const m = document.getElementById('scene-mur').getBoundingClientRect()
    const s = m.width / 7680
    const lefts = [...document.querySelectorAll('.vol .lettre')].map((l) => parseFloat(l.style.left))
    return { max: Math.round(Math.max(...lefts)), bord: Math.round((innerWidth - m.left) / s), vue: document.body.dataset.vue, n: lefts.length }
  })
  await attendre(400)
  await mur9.screenshot({ path: PNG('1366-vol-depuis-le-bord') })
  await posee(mur9, id1366)
  verifier('m-5 · à 1366 px, les lettres partent du cadre visible', bord.vue === 'epoques' && bord.n > 0 && bord.max < bord.bord,
    `vue ${bord.vue} ; ${bord.n} lettres ; départ le plus à droite x = ${bord.max} (repère du mur) pour un bord visible à ${bord.bord}`)
  await tel9.close()
  const mentions = { [vueDefaut]: await mentionVisible(mur9) }
  for (let i = 0; i < 2; i++) {
    await mur9.click('#btn-vue')
    await attendre(300)
    mentions[await mur9.evaluate(() => document.body.dataset.vue)] = await mentionVisible(mur9)
  }
  await mur9.screenshot({ path: PNG('1366-recadre-aujourdhui') })
  const toutes = tailles.flatMap((t) => Object.entries(t))
  const enonces = toutes.filter(([q]) => /fait|liste|enonce|public-texte/.test(q))
  const petites = toutes.filter(([q]) => !/fait|liste|enonce|public-texte/.test(q))
  verifier('Recadré lisible à 1366 px', vueDefaut === 'epoques' && enonces.every(([, v]) => v >= 16) && petites.every(([, v]) => v >= 10),
    `vue par défaut : ${vueDefaut} ; énoncés et phrases ≥ 16 px (${enonces.map(([q, v]) => `${q} ${v}`).join(', ')}) ; sources et légendes ≥ 10 px (${petites.map(([q, v]) => `${q} ${v}`).join(', ')})`)
  await ctx9.close()
  // Mention dans toutes les vues : mur (3 vues à 1920 px), formulaire FR/EN, clôture (vérifiée à l'étape 3).
  const ctx9b = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  for (const r of ['mur', 'epoques', 'aujourdhui']) {
    const p = await ouvrir(ctx9b, `mur-${r}`, `${URL}?recadre=${r}`)
    await attendre(300)
    mentions[`${r} 1920`] = await mentionVisible(p)
    await p.close()
  }
  const f9 = await ouvrir(ctx9b, 'form-mention', URL + '?vue=formulaire', TEL)
  mentions['formulaire FR'] = await mentionVisible(f9)
  await f9.click('#b-langue')
  mentions['formulaire EN'] = await mentionVisible(f9)
  await ctx9b.close()
  verifier('« Proposition non officielle · prototype » visible dans toutes les vues', Object.values(mentions).every(Boolean) && mentionClot, `${Object.entries(mentions).map(([k, v]) => `${k} : ${v ? 'oui' : 'NON'}`).join(' ; ')} ; clôture : ${mentionClot ? 'oui' : 'NON'}`)

  // =====================================================================================
  console.log('étape 10 · formulaire (repris de A)')
  const ctx10 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const mur10 = await ouvrir(ctx10, 'mur-form', URL)
  const f = await ouvrir(ctx10, 'form', URL + '?vue=formulaire', TEL)
  await f.screenshot({ path: PNG('formulaire-1-vide'), fullPage: true })
  const ordre = await f.evaluate(() => [...document.querySelectorAll('#form input, #form select, #form textarea')].map((e) => e.type || e.tagName))
  const premierTexte = ordre.indexOf('textarea')
  const fermesAvant = ordre.slice(0, premierTexte).filter((t) => t === 'radio').length
  const avis = await f.textContent('.avis')
  const cases = await f.evaluate(() => [...document.querySelectorAll('#form input[type="checkbox"]')].map((c) => c.closest('label').textContent.replace(/\s+/g, ' ').trim()))
  await f.check('input[name="type"][value="souvenir"]')
  await f.click('#form button[type="submit"]')
  await attendre(300)
  const errs = await f.textContent('#erreurs')
  await f.screenshot({ path: PNG('formulaire-2-erreurs'), fullPage: true })
  // Sans la case 14 ans : rien n'arrive au mur.
  await f.check('input[name="cat"][value="regions"]')
  await f.selectOption('#an', '1984')
  await f.check('#c1')
  await f.click('#form button[type="submit"]')
  await attendre(800)
  const errAge = await f.textContent('#erreurs')
  const nAvant = (await etat(mur10)).contributions.length
  verifier('Formulaire · choix fermé d\'abord, cases distinctes, 14 ans', ordre[0] === 'radio' && fermesAvant >= 6 && cases.length === 2 && /14 ans/.test(cases[1]) && /Choisissez ce que votre phrase/.test(errs) && /année de votre souvenir/.test(errs) && /Confirmez votre âge/.test(errAge) && !/affichage/.test(errAge) && nAvant === 2,
    `${fermesAvant} choix fermés avant la phrase ; ${cases.length} cases : « ${cases.map((c) => c.slice(0, 32)).join(' » / « ')} » ; sans âge : envoi bloqué, contributions au mur ${nAvant} (2 exemples)`)
  verifier('Formulaire · avis « Qui recueillerait »', /Qui recueillerait : l’organisateur \(à confirmer/.test(avis) && /Comment retirer/.test(avis), `« ${avis.replace(/\s+/g, ' ').trim().slice(0, 110)}… »`)
  // Phrase facultative : un souhait sans phrase arrive avec son choix et son année.
  await f.reload()
  const idSans = await envoyer(f, { type: 'souhait', cat: 'internet', an: 2033 })
  await f.screenshot({ path: PNG('formulaire-3-envoye'), fullPage: true })
  await posee(mur10, idSans)
  await attendre(800)
  const zSans = await texteZone(mur10, 3)
  verifier('Formulaire · phrase facultative', /L’Internet de demain · pour 2033/.test(zSans), `sans phrase, le mur affiche « ${zSans} »`)
  await mur10.screenshot({ path: PNG('mur-10-souhait-sans-phrase') })
  await f.reload()
  await f.click('#b-langue')
  const en = await f.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, avis: document.querySelector('.avis').textContent, bouton: document.querySelector('#form button[type="submit"]').textContent }))
  await f.screenshot({ path: PNG('formulaire-4-anglais'), fullPage: true })
  verifier('Formulaire · anglais', en.lang === 'en' && /Your sentence/.test(en.h1) && /Who would collect it: the organizer/.test(en.avis) && en.bouton === 'Send to the wall', `lang=${en.lang} ; « ${en.h1} » ; « ${en.bouton} »`)
  await f.click('#b-langue')
  await ctx10.close()

  // =====================================================================================
  console.log('étape 11 · rotation en boucle (M-1), faits entiers à l\'écran (M-2), mouvement réduit sans arrivée (M-3)')
  // Deux murs côte à côte pendant 80 s, sans aucune arrivée : mouvement normal et mouvement réduit.
  const tournerEtLire = async (mouvement) => {
    const c = await browser.newContext({ viewport: { width: 1920, height: 540 }, reducedMotion: mouvement })
    const p = await ouvrir(c, `mur-rotation-${mouvement}`, URL)
    await p.evaluate(() => {
      window.__changements = []
      const t0 = performance.now()
      new MutationObserver(() => window.__changements.push([Math.round((performance.now() - t0) / 100) / 10, document.body.dataset.scene])).observe(document.body, { attributes: true, attributeFilter: ['data-scene'] })
    })
    const t0 = Date.now()
    const lectures = []
    let visite = { scene: 1, debut: 0, lu: false }
    const delai = mouvement === 'reduce' ? 2000 : 20000 // en mouvement normal, juste avant la fin de la visite (24 s)
    while (Date.now() - t0 < 80000) {
      await attendre(500)
      const sc = await p.evaluate(() => window.__murCombi.sceneActive())
      const t = Date.now() - t0
      if (sc !== visite.scene) visite = { scene: sc, debut: t, lu: false }
      if (!visite.lu && t - visite.debut >= delai) {
        visite.lu = true
        const aff = await p.evaluate(FAITS_VISIBLES)
        lectures.push({ scene: sc, t: Math.round(t / 100) / 10, ecarts: ecartsVisibles(aff, sc, ref) })
        if (lectures.filter((l) => l.scene === sc).length === 1) await p.screenshot({ path: PNG(mouvement === 'reduce' ? `mouvement-reduit-decor-${sc}-sans-arrivee` : `rotation-decor-${sc}-faits-complets`) })
      }
    }
    const changements = await p.evaluate(() => window.__changements)
    await c.close()
    return { changements, lectures }
  }
  const [rotN, rotR] = await Promise.all([tournerEtLire('no-preference'), tournerEtLire('reduce')])
  const sequence = (r) => r.changements.map(([t, n]) => `${t} s → ${n}`).join(' ; ')
  const tourne = (r) => r.changements.length >= 3 && r.changements.some(([, n]) => n === '3') && r.changements.some(([, n]) => n === '1')
  verifier('M-1 · les décors tournent en boucle, futur compris (sans arrivée)', tourne(rotN) && tourne(rotR),
    `80 s sans contribution · mouvement normal : 0 s → 1 ; ${sequence(rotN)} · mouvement réduit : 0 s → 1 ; ${sequence(rotR)}`)
  const lus = (r) => [1, 2, 3].every((k) => r.lectures.some((l) => l.scene === k))
  const ecartsDe = (r) => r.lectures.flatMap((l) => l.ecarts.map((e) => `décor ${l.scene} à ${l.t} s : ${e}`))
  verifier('M-2 · aucun fait tronqué à l\'écran, sources visibles (fin de chaque introduction)', lus(rotN) && !ecartsDe(rotN).length,
    ecartsDe(rotN).length ? ecartsDe(rotN).join(' ; ') : `texte visible relu à ${rotN.lectures.map((l) => `${l.t} s (décor ${l.scene})`).join(', ')} : 14 faits entiers (dont F-007 jusqu'au « Q » final), 14 sources visibles (dont « F-007 · S-004 »), nom F-016 « Réseau ACTION TI » entier`)
  verifier('M-3 · mouvement réduit sans arrivée : décors pleins, d\'un bloc', lus(rotR) && !ecartsDe(rotR).length,
    ecartsDe(rotR).length ? ecartsDe(rotR).join(' ; ') : `texte visible relu 2 s après chaque changement (${rotR.lectures.map((l) => `${l.t} s, décor ${l.scene}`).join(' ; ')}) : tous les faits, leurs sources et le nouveau nom sont affichés`)

  // =====================================================================================
  console.log('étape 12 · itération 3 : N-1 (souvenir 2009-2025 visible à 1366 px), N-2 (titre et compteur du fil), N-3 (boutons de décor gardés)')
  // N-1 : à 1366 px, vue par défaut, souvenir de 2019 envoyé par le vrai formulaire ; on lit le texte VISIBLE de la carte
  // et sa position dans la fenêtre (rectangle dans l'écran, élément au premier plan au centre), en mouvement normal et réduit.
  const lireCarteEcran = (mur, id) => mur.evaluate((i) => {
    const li = document.querySelector(`.carte-contrib[data-id="${i}"]`)
    if (!li) return { existe: false, vue: document.body.dataset.vue }
    const g = li.querySelector('.genre')
    const r = g.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dessus = cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight ? document.elementFromPoint(cx, cy) : null
    return {
      existe: true,
      vue: document.body.dataset.vue,
      texte: li.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && Number(getComputedStyle(li).opacity) > 0.95 ? g.innerText : '',
      x: Math.round(r.left), droite: Math.round(r.right), y: Math.round(r.top), bas: Math.round(r.bottom), largeur: innerWidth, hauteur: innerHeight,
      dansFenetre: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
      auPremierPlan: !!dessus && li.contains(dessus),
    }
  }, id)
  const n1 = {}
  for (const mouvement of ['no-preference', 'reduce']) {
    const c = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: mouvement })
    const m = await ouvrir(c, `mur-1366-n1-${mouvement}`, URL)
    const t = await ouvrir(c, `form-1366-n1-${mouvement}`, URL + '?vue=formulaire', TEL)
    await attendre(1500)
    await m.bringToFront()
    const vueAvant = await m.evaluate(() => document.body.dataset.vue)
    const id = await envoyer(t, { type: 'souvenir', cat: 'internet', an: 2019, texte: 'Phrase d’essai : un souvenir daté de 2019 (démo).' })
    await m.bringToFront()
    await posee(m, id)
    await attendre(600)
    const pendant = await lireCarteEcran(m, id)
    if (mouvement === 'no-preference') await m.screenshot({ path: PNG('1366-souvenir-2019-au-fil') })
    const t0 = Date.now()
    await m.waitForFunction(() => document.body.dataset.vue === 'epoques', null, { timeout: 20000 }).catch(() => {})
    const retour = { vue: await m.evaluate(() => document.body.dataset.vue), s: Math.round((Date.now() - t0) / 100) / 10 }
    n1[mouvement] = { vueAvant, pendant, retour }
    await c.close()
  }
  const okN1 = (r) => r.vueAvant === 'epoques' && r.pendant.vue === 'aujourdhui' && /^2019\s*Souvenir de 2019/.test(r.pendant.texte) && r.pendant.dansFenetre && r.pendant.auPremierPlan && r.retour.vue === 'epoques'
  verifier('N-1 · à 1366 px (vue par défaut), un souvenir de 2019 est visible à l\'écran, puis le cadre revient', okN1(n1['no-preference']) && okN1(n1.reduce),
    Object.entries(n1).map(([k, r]) => `${k === 'reduce' ? 'réduit' : 'normal'} : vue ${r.vueAvant} → ${r.pendant.vue} ; texte visible « ${(r.pendant.texte || '').replace(/\s+/g, ' ').slice(0, 40)}… » à x = ${r.pendant.x}-${r.pendant.droite}, y = ${r.pendant.y}-${r.pendant.bas} (fenêtre ${r.pendant.largeur} × ${r.pendant.hauteur}), au premier plan : ${r.pendant.auPremierPlan} ; retour à ${r.retour.vue} ${r.retour.s} s après`).join(' ; '))

  // N-2 : titre du fil et compteur cohérents avec l'exception 2009-2025 (texte visible, dans la fenêtre, à 1920 px).
  const c12 = await browser.newContext({ viewport: { width: 1920, height: 540 } })
  const m12 = await ouvrir(c12, 'mur-n2', URL)
  await attendre(800)
  for (const [i, an] of [2019, 2010, 2012, 2015].entries()) {
    const id = `R-N2-${i}`
    await m12.evaluate(([idm, a]) => new BroadcastChannel('concept-combi-contributions').postMessage({ type: 'ajout', id: idm, typeContribution: 'souvenir', cat: 'internet', an: a, texte: `Phrase d’essai : souvenir de ${a}.` }), [id, an])
    await posee(m12, id)
  }
  await attendre(800)
  const n2 = await m12.evaluate(() => {
    const vis = (el) => !!el && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && Number(getComputedStyle(el).opacity) > 0.95
    const dedans = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }
    const h2 = document.querySelector('.colonne-auj h2, aside h2')
    const plus = document.getElementById('plus')
    return {
      titre: vis(h2) && dedans(h2) ? h2.innerText : '',
      plus: vis(plus) && dedans(plus) ? plus.innerText : '',
      cartes: [...document.querySelectorAll('.carte-contrib')].map((li) => li.dataset.id),
      contributions: window.__murCombi.contributions(),
    }
  })
  await m12.screenshot({ path: PNG('mur-12-fil-titre-et-compteur') })
  await c12.close()
  // Attendu, recalculé depuis l'état du mur : les souvenirs de 2009-2025 hors du fil sont comptés « au fil », les autres « au mur ».
  const horsFil = n2.contributions.filter((c) => !n2.cartes.includes(c.id))
  const nFil = horsFil.filter((c) => c.an >= 2009 && c.an <= 2025).length
  const nMur = horsFil.length - nFil
  const attenduN2 = `et ${nMur} autre${nMur > 1 ? 's' : ''} phrase${nMur > 1 ? 's' : ''} au mur (exemple${nMur > 1 ? 's' : ''} simulé${nMur > 1 ? 's' : ''}) ; ${nFil} souvenir${nFil > 1 ? 's' : ''} de 2009-2025 déjà passé${nFil > 1 ? 's' : ''} au fil`
  verifier('N-2 · le titre et le compteur du fil disent l\'exception 2009-2025', /partent vers leur année \(2009-2025 : ils restent ici\)/.test(n2.titre) && !n2.cartes.includes('R-N2-0') && nFil >= 1 && nMur >= 1 && n2.plus === attenduN2,
    `titre visible : « ${n2.titre} » ; souvenir de 2019 sorti du fil : ${!n2.cartes.includes('R-N2-0')} ; compteur visible : « ${n2.plus} » (attendu : « ${attenduN2} »)`)

  // N-3 : 4 clics par seconde sur « 1976-1990 » / « 1991-2008 » pendant 3 s, en mouvement réduit ; on relève l'opacité
  // du décor 2 à chaque image et on compte ses passages au-delà de 0,5 (un changement brusque sombre ↔ clair).
  const c13 = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
  const m13 = await ouvrir(c13, 'mur-n3', URL)
  await attendre(2500)
  const n3 = await m13.evaluate(() => new Promise((fin) => {
    const t0 = performance.now()
    const passages = []
    let haut = Number(getComputedStyle(document.getElementById('scene2')).opacity) > 0.5
    const lire = () => {
      const h = Number(getComputedStyle(document.getElementById('scene2')).opacity) > 0.5
      if (h !== haut) { passages.push(Math.round(performance.now() - t0)); haut = h }
      if (performance.now() - t0 < 7000) requestAnimationFrame(lire)
      else fin({ passages, scene: window.__murCombi.sceneActive() })
    }
    requestAnimationFrame(lire)
    let n = 0
    const iv = setInterval(() => {
      document.querySelector(`.btn-scene[data-aller="${n % 2 === 0 ? 2 : 1}"]`).click()
      if (++n >= 12) clearInterval(iv)
    }, 250)
  }))
  await c13.close()
  const parSeconde = Math.max(0, ...n3.passages.map((t) => n3.passages.filter((u) => u >= t && u < t + 1000).length))
  verifier('N-3 · boutons de décor : au plus 1 changement brusque par seconde', parSeconde <= 1 && n3.passages.length >= 1,
    `12 clics en 3 s (mouvement réduit) : passages de l'opacité du décor 2 au-delà de 0,5 à ${n3.passages.join(', ')} ms ; au plus ${parSeconde} par fenêtre de 1 s (avant le correctif : 6 passages en 1,6 s) ; décor final ${n3.scene}`)

  // =====================================================================================
  await browser.close()
  verifier('Hors ligne · requêtes', !horsLigne.length && requetes > 0, horsLigne.length ? horsLigne.slice(0, 5).join(' ; ') : `${requetes} requêtes, toutes vers ${ORIGINE}`)
  verifier('Console sans erreur ni avertissement', !erreurs.length, erreurs.length ? erreurs.slice(0, 5).join(' ; ') : 'aucune')
  const echecs = verifs.filter((v) => !v.ok)
  console.log(`\n${verifs.length - echecs.length} cas sur ${verifs.length} OK`)
  if (echecs.length) process.exit(1)
})().catch((e) => { console.error(e); process.exit(1) })

// Le mur 32:9 du concept A, conçu en 7680 × 2160 et mis à l'échelle dans la fenêtre.
// Deux scènes en boucle :
//   1 · Compte à rebours : l'horizon déclaré (plan 1), le rembobinage 2046 → 1976 (plan 2),
//       ce qui a changé (plan 3) ;
//   2 · Les 20 ans qui restent : l'axe se redéploie et les souhaits du public remplissent 2027-2046.
// Tout le mouvement passe par anime.js : un seul moteur, donc une seule pause (WCAG 2.2.2).
import { animate, createTimeline, engine, spring, stagger, svg, utils } from 'animejs'
import { FAITS, EDITIONS, HORIZON, ECARTS, CATEGORIES, EXEMPLES } from './donnees.js'
import { ouvrirCanal } from './canal.js'

// ---------- Géométrie ----------
const W = 7680
const H = 2160
const AXE_Y = 1420
const X0 = 400
const X1 = 7400
const CELL_W = 700
const CELL_H = 470
const CELL_Y = 1590
const POINT = 92
const VED_W = 1560
const VED_H = 500
const VED_Y = 650

// Échelle 1 : linéaire, 1976 → 2046 sur toute la largeur (le temps « vrai »).
const xS1 = (y) => X0 + ((y - 1976) / 70) * (X1 - X0)
// Échelle 2 : les 50 années passées tassées à gauche, les 20 années à venir déployées (275 px par an).
const xS2 = (y) => (y <= 2026 ? X0 + ((y - 1976) / 50) * 1500 : 1900 + ((y - 2026) / 20) * 5500)
const lerp = (a, b, t) => a + (b - a) * t

// ---------- Mouvement réduit ----------
const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches
const D = (ms) => (REDUIT ? 0 : ms)
// À étaler dans les paramètres (« ...ressort() ») : en mouvement réduit, la durée est forcée à 0,
// sinon anime.js appliquerait sa durée par défaut de 1 000 ms (constat A-2 de l'équipe rouge 1).
const ressort = (bounce = 0.35, duration = 600) => (REDUIT ? { ease: 'linear', duration: 0 } : { ease: spring({ bounce, duration }) })

// ---------- Chiffres qui changent (WCAG 2.3.1, constat A-3) ----------
// Le compteur et la tête de lecture ne changent pas plus de 3 fois par seconde : pendant le rembobinage,
// l'année affichée est celle de la tête à des instants espacés de PAS ms (temps de l'animation, donc figé en pause).
const R_REMBOBINAGE = 9000
const PAS = 600 // 15 changements en 9 s : jamais plus de 2 dans une même seconde
function anneeAffichee(annee) {
  const p = Math.min(1, Math.max(0, (2046 - annee) / (2046 - 1976.3)))
  const t = (Math.acos(1 - 2 * p) / Math.PI) * R_REMBOBINAGE // inverse de la courbe inOutSine
  const tq = Math.floor(t / PAS + 1e-6) * PAS
  return Math.floor(2046 - (2046 - 1976.3) * (1 - Math.cos((Math.PI * tq) / R_REMBOBINAGE)) / 2)
}

// ---------- État ----------
const etat = {
  m: 0, // 0 = échelle 2 (avenir déployé), 1 = échelle 1 (linéaire)
  annee: 2046,
  tete: false,
  scene: 0,
  plan: '',
  enPause: false,
  recadrage: 'entier',
  contribs: [...EXEMPLES],
  enAttente: null, // contribution arrivée pendant la pause
  vedetteIndex: 0,
  vedette: null, // contribution montrée en vedette
}
const xm = (y) => lerp(xS2(y), xS1(y), etat.m)

let tlCourante = null
const libres = new Set() // animations hors timeline (vedettes), pour les arrêter au changement de scène
function anim(cibles, params) {
  const a = animate(cibles, params)
  libres.add(a)
  a.then(() => libres.delete(a))
  return a
}

// ---------- Construction ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function carteFait(id, { classe = '', avant = '', apres = '' } = {}) {
  const f = FAITS[id]
  return `<article class="fait ${classe}" data-fait="${id}">
    ${avant}<p class="fait-texte">${esc(f.texte)}</p>
    <p class="fait-pied"><span class="fait-date">${esc(f.date)}</span><span class="fait-id">${id}</span></p>${apres}
  </article>`
}

function qrMaquette() {
  // Motif de QR code dessiné à la main : une maquette, pas un vrai code.
  let cases = ''
  let g = 7
  for (let r = 0; r < 25; r++)
    for (let c = 0; c < 25; c++) {
      const coin = (r < 8 && c < 8) || (r < 8 && c > 16) || (r > 16 && c < 8)
      if (coin) continue
      g = (g * 1103515245 + 12345) & 0x7fffffff
      if (g % 100 < 48) cases += `<rect x="${c}" y="${r}" width="1" height="1"/>`
    }
  const repere = (x, y) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`
  return `<svg viewBox="-2 -2 29 29" aria-hidden="true"><rect x="-2" y="-2" width="29" height="29" fill="#fff"/><g fill="#0b1020">${cases}${repere(0, 0)}${repere(18, 0)}${repere(0, 18)}</g></svg>`
}

function construire(racine) {
  const graduations = [1976, 1986, 1996, 2006, 2016, 2026]
  for (let y = 2027; y <= 2046; y++) graduations.push(y)

  racine.innerHTML = `
  <div id="viewport">
    <div id="stage" role="img" aria-label="Mur 32:9 du concept A, Compte à rebours 2046">
      <div class="fond"></div>
      <header class="bandeau">
        <div class="marque">
          <p class="marque-nom">Réseau ACTION TI <span class="marque-mention">Proposition non officielle · prototype</span></p>
          <p class="marque-citation" data-fait="F-030">${esc(FAITS['F-030'].texte)} <span class="fait-id">F-030</span></p>
        </div>
      </header>
      <div id="compteur"><span id="compteur-annee">2046</span><span id="compteur-sous">dans 20 ans</span></div>
      <div id="titre-plan"><p id="titre-scene"></p><h2 id="titre"></h2><p id="sous-titre"></p></div>

      <div id="qr">
        ${qrMaquette()}
        <p class="qr-appel">Écrivez 2046</p>
        <p class="qr-note">Maquette de QR code · en démo, le formulaire s'ouvre sur ce portable</p>
      </div>

      <svg id="traits" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
        <g id="liens"></g><g id="arcs"></g><path id="lien-cerf" class="lien lien-cerf" d=""/>
      </svg>

      <div class="axe axe-passe"></div>
      <div class="axe axe-futur"></div>
      <div id="graduations">${graduations
        .map((y) => `<div class="grad ${y > 2026 ? 'grad-an' : 'grad-decennie'} ${y === 2035 ? 'grad-2035' : ''} ${y === 2046 ? 'grad-2046' : ''}" data-annee="${y}"><span>${y}</span></div>`)
        .join('')}</div>
      <div id="tete"><span id="tete-annee">2046</span></div>

      <div id="horizon">
        <p class="horizon-titre">Ce que le Réseau écrit de son avenir</p>
        ${HORIZON.map((id) => carteFait(id, { classe: 'carte-horizon', avant: '<p class="fait-surtitre">Écrit en ' + FAITS[id].date + '</p>' })).join('')}
      </div>
      <div id="cerf">${carteFait('F-031', { classe: 'carte-cerf', avant: '<p class="fait-surtitre">Horizon daté : 2035</p>' })}</div>
      <div id="hypothese" class="hypothese">
        <p class="hyp-etiquette">Hypothèse · aucun fait</p>
        <p class="hyp-annee">2046</p>
        <p class="hyp-texte">Dans 20 ans, la capsule s'ouvre. Ce qu'elle contiendra, c'est vous qui l'écrivez.</p>
      </div>

      <div id="cellules">${EDITIONS.map(
        (e) => `<div class="cellule cellule-${e.type} ${e.aujourdhui ? 'cellule-aujourdhui' : ''}" data-fait="${e.fait}" data-annee="${e.annee}">
          <div class="cellule-contenu">
            <p class="cellule-etiquette">${esc(e.etiquette)}${e.aujourdhui ? ' <span class="cellule-badge">ce mois-ci</span>' : ''}</p>
            <p class="fait-texte">${esc(FAITS[e.fait].texte)}</p>
            <p class="fait-pied"><span class="fait-date">${esc(FAITS[e.fait].date)}</span><span class="fait-id">${e.fait}</span></p>
            ${e.note ? `<p class="cellule-note">${esc(e.note)}</p>` : ''}
          </div></div>`
      ).join('')}</div>

      <div id="ecart" aria-live="off"></div>

      <div id="releve">${carteFait('F-067', { classe: 'carte-releve', avant: '<p class="fait-surtitre">Relève</p>', apres: '<p class="releve-appel">Étudiant, étudiante : un message à toi-même en 2046.</p>' })}</div>
      <div id="points"></div>
      <div id="vedette" aria-live="polite"><div class="vedette-contenu"></div></div>
      <div id="bilan">
        <p class="bilan-total"><span id="total">0</span> souhaits pour 2027-2046</p>
        <p class="bilan-detail" id="detail-total"></p>
        <ul class="legende-cat">${Object.entries(CATEGORIES)
          .map(([k, c]) => `<li><span class="forme forme-${c.forme} cat-${k}"></span>${esc(c.fr)} <b data-compte="${k}">0</b></li>`)
          .join('')}</ul>
      </div>

      <footer class="legende-marquage">
        <span><i class="marque-fait"></i>Fait sourcé, avec son identifiant F-xxx</span>
        <span><i class="marque-exemple"></i>Exemple simulé pour la démo</span>
        <span><i class="marque-demo"></i>Saisi sur ce portable, effacé après la démo</span>
        <span><i class="marque-hyp"></i>Hypothèse</span>
      </footer>
    </div>
  </div>

  <div id="commandes" role="toolbar" aria-label="Commandes de la démo">
    <button id="b-pause" type="button" aria-pressed="false">Pause <kbd>espace</kbd></button>
    <button type="button" data-aller="1">Scène 1 · Compte à rebours</button>
    <button type="button" data-aller="2">Scène 2 · Les 20 ans</button>
    <button id="b-recadrer" type="button">Recadrer : mur entier</button>
    <button id="b-formulaire" type="button">Ouvrir le formulaire</button>
    <button id="b-effacer" type="button">Effacer la démo</button>
    <span id="etat-commandes" role="status"></span>
    <span class="mention-commandes">Proposition non officielle · prototype</span>
  </div>`
}

// ---------- Mise à l'échelle ----------
function ajuster() {
  const stage = document.getElementById('stage')
  const vw = innerWidth
  const vh = innerHeight
  const larg = etat.recadrage === 'entier' ? W : W / 2
  const s = Math.min(vw / larg, vh / H)
  const decalX = etat.recadrage === 'droite' ? -W / 2 : 0
  const ox = (vw - larg * s) / 2
  const oy = (vh - H * s) / 2
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s}) translateX(${decalX}px)`
}

// ---------- Rendu de l'axe, image par image (piloté par l'état) ----------
let el = {}
function rendreAxe() {
  const a0 = xm(1976)
  const a1 = xm(2026)
  const a2 = xm(2046)
  el.axePasse.style.transform = `translateX(${a0}px)`
  el.axePasse.style.width = `${a1 - a0}px`
  el.axeFutur.style.transform = `translateX(${a1}px)`
  el.axeFutur.style.width = `${a2 - a1}px`
  for (const g of el.grads) {
    const y = g._annee
    // En échelle 1 : décennies, 2035 et 2046. En échelle 2 : 1976, 2026 et chaque année à venir.
    const visS1 = g._decennie || y === 2035 || y === 2046 ? 1 : 0
    const visS2 = g._decennie ? (y === 1976 || y === 2026 ? 1 : 0) : 1
    g.style.transform = `translateX(${xm(y)}px)`
    g.style.opacity = lerp(visS2, visS1, etat.m)
  }
  el.tete.style.transform = `translateX(${xm(etat.annee)}px)`
  el.tete.style.opacity = etat.tete ? 1 : 0
  const a = String(anneeAffichee(etat.annee))
  if (el.teteAnnee.textContent !== a) el.teteAnnee.textContent = a
  if (etat.plan === 'rembobiner' && el.compteur.textContent !== a) el.compteur.textContent = a
}

// Placement des cellules d'édition sous l'axe (échelle 1) : chaque cellule vise l'aplomb de son année,
// puis on repousse vers la gauche celles qui se chevauchent. Les années récentes, serrées, s'étalent.
function placerCellules() {
  const gap = 34
  const items = el.cellules.map((c) => ({ c, ideal: xS1(Number(c.dataset.annee)) - CELL_W / 2 }))
  items.sort((a, b) => a.ideal - b.ideal)
  for (let i = items.length - 1; i >= 0; i--) {
    const borne = i === items.length - 1 ? X1 + 40 - CELL_W : items[i + 1].x - CELL_W - gap
    items[i].x = Math.min(items[i].ideal, borne)
  }
  for (let i = 0; i < items.length; i++) {
    const borne = i === 0 ? X0 - 120 : items[i - 1].x + CELL_W + gap
    items[i].x = Math.max(items[i].x, borne)
  }
  el.liens.innerHTML = ''
  for (const it of items) {
    it.c._x = it.x
    const ax = xS1(Number(it.c.dataset.annee))
    const cx = it.x + CELL_W / 2
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', `M ${ax} ${AXE_Y + 18} C ${ax} ${AXE_Y + 110}, ${cx} ${CELL_Y - 110}, ${cx} ${CELL_Y}`)
    p.setAttribute('class', 'lien')
    el.liens.appendChild(p)
    it.c._lien = svg.createDrawable(p)[0]
  }
}

function arcsEcarts() {
  el.arcs.innerHTML = ''
  el.arcsD = ECARTS.map((e, i) => {
    const a = xS1(e.anDe)
    const b = xS1(e.anA)
    const h = 360 + i * 170
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', `M ${a} ${AXE_Y} C ${a} ${AXE_Y - h}, ${b} ${AXE_Y - h}, ${b} ${AXE_Y}`)
    p.setAttribute('class', 'arc')
    el.arcs.appendChild(p)
    return svg.createDrawable(p)[0]
  })
}

// ---------- Points (contributions) ----------
function positionPoint(c, rang) {
  const cx = xS2(c.an - 0.5) + ((rang % 2) - 0.5) * 108
  const cy = AXE_Y - 104 - Math.floor(rang / 2) * 108
  return { x: cx - POINT / 2, y: cy - POINT / 2 }
}

function rangerPoints() {
  const parAn = {}
  for (const c of etat.contribs) {
    const r = (parAn[c.an] = (parAn[c.an] ?? -1) + 1)
    c._pos = positionPoint(c, r)
    if (!c._el) {
      const d = document.createElement('div')
      d.className = `point forme-${CATEGORIES[c.cat].forme} cat-${c.cat} ${c.simule ? 'point-exemple' : 'point-demo'}`
      d.dataset.id = c.id
      el.points.appendChild(d)
      c._el = d
    }
    c._el.dataset.x = c._pos.x
    c._el.dataset.y = c._pos.y
  }
}

function majBilan(n) {
  const total = etat.contribs.length
  const ex = etat.contribs.filter((c) => c.simule).length
  el.total.textContent = Math.round(n ?? total)
  el.detail.textContent = `dont ${ex} exemples simulés${total - ex ? ` et ${total - ex} saisi${total - ex > 1 ? 's' : ''} en démo` : ''}`
  for (const k of Object.keys(CATEGORIES)) {
    document.querySelector(`[data-compte="${k}"]`).textContent = etat.contribs.filter((c) => c.cat === k).length
  }
}

// ---------- Titres ----------
function titre(scene, t, sous) {
  el.titreScene.textContent = scene
  el.titre.textContent = t
  el.sousTitre.textContent = sous
  if (!REDUIT) anim('#titre-plan', { opacity: [0, 1], translateY: [40, 0], duration: 700, ease: 'outCubic' })
}

// ---------- Réinitialisations ----------
function arreterTout() {
  if (tlCourante) tlCourante.pause()
  tlCourante = null
  for (const a of libres) a.pause()
  libres.clear()
}

function etatCellulesS1(visible) {
  for (const c of el.cellules) {
    utils.set(c, { translateX: c._x, translateY: CELL_Y, width: CELL_W, height: CELL_H, borderRadius: 18, opacity: visible ? 1 : 0, scale: 1 })
    utils.set(c.querySelector('.cellule-contenu'), { opacity: 1 })
    utils.set(c._lien, { draw: visible ? '0 1' : '0 0' })
    c.classList.remove('estompe', 'eclaire')
  }
}

// ---------- Scène 1 : compte à rebours ----------
function scene1() {
  arreterTout()
  etat.scene = 1
  document.body.dataset.scene = '1'
  etat.m = 0
  etat.annee = 2046
  etat.tete = false
  etat.plan = 'horizon'
  rendreAxe()
  etatCellulesS1(false)
  for (const a of el.arcsD) utils.set(a, { draw: '0 0' })
  utils.set(el.arcs.children, { opacity: 1 })
  utils.set('#ecart', { opacity: 0 })
  utils.set('#releve, #bilan, #vedette', { opacity: 0 })
  utils.set('.point', { opacity: 0 })
  utils.set('.carte-horizon, #cerf, #hypothese, .horizon-titre', { opacity: 0, translateY: 0 })
  utils.set(el.lienCerf, { draw: '0 0' })
  el.compteur.textContent = '2046'
  el.compteurSous.textContent = 'dans 20 ans'
  utils.set('#compteur', { opacity: 1 })
  utils.set(el.compteur, { opacity: 1 }) // au cas où un fondu de vedette a été interrompu

  const R = R_REMBOBINAGE // durée du rembobinage 2046 → 1976
  const P2 = 8500
  const P3 = P2 + R + 1500

  const tl = createTimeline({ autoplay: true, onComplete: () => scene2() })
  tlCourante = tl

  // Plan 1 · L'horizon déclaré
  tl.call(() => titre('Scène 1 · Compte à rebours', 'L’horizon déclaré', 'Le Réseau écrit déjà ses prochaines années'), 0)
  tl.add('.horizon-titre', { opacity: [0, 1], duration: D(600) }, 200)
  tl.add('.carte-horizon', { opacity: [0, 1], translateY: [120, 0], scale: [0.92, 1], ...ressort(0.3, 700), delay: stagger(D(260)) }, 400)
  tl.add('#cerf', { opacity: [0, 1], translateY: [80, 0], ...ressort(0.3, 700) }, 1700)
  tl.add(el.lienCerf, { draw: ['0 0', '0 1'], duration: D(900), ease: 'inOutQuad' }, 1900)
  tl.add('#hypothese', { opacity: [0, 1], duration: D(900) }, 2600)

  // Plan 2 · Rembobiner : l'axe passe de l'échelle 2 à l'échelle 1 pendant que la tête de lecture recule.
  tl.call(() => {
    etat.plan = 'rembobiner'
    etat.tete = true
    el.compteurSous.textContent = 'rembobinage'
    titre('Scène 1 · Compte à rebours', 'Rembobiner', 'De 2046 à avril 1976 : les éditions dont le numéro est écrit dans une source')
  }, P2 - 200)
  tl.add('.carte-horizon, .horizon-titre, #cerf, #hypothese', { opacity: 0, translateY: -60, duration: D(700), ease: 'inQuad' }, P2 - 300)
  tl.add(el.lienCerf, { draw: '1 1', duration: D(500) }, P2 - 300)
  if (REDUIT) {
    tl.call(() => {
      etat.m = 1
      etat.annee = 1976
      etat.tete = false
      rendreAxe()
      el.compteur.textContent = '1976'
      el.compteurSous.textContent = 'de 2046 à 1976'
      etatCellulesS1(true)
    }, P2)
  } else {
    tl.add(
      etat,
      {
        m: { to: 1, duration: 2400, ease: 'inOutCubic' },
        annee: { to: 1976.3, duration: R, ease: 'inOutSine' },
        onUpdate: rendreAxe,
      },
      P2
    )
    // Chaque édition apparaît quand la tête de lecture franchit son année (temps calculé selon la courbe inOutSine).
    const inv = (y) => {
      const p = (2046 - y) / (2046 - 1976.3) // part du chemin parcouru
      return P2 + (Math.acos(1 - 2 * Math.min(1, Math.max(0, p))) / Math.PI) * R
    }
    for (const c of el.cellules) {
      const t = inv(Number(c.dataset.annee))
      tl.add(c._lien, { draw: ['0 0', '0 1'], duration: 500, ease: 'outQuad' }, t)
      tl.add(c, { opacity: [0, 1], translateY: [CELL_Y + 140, CELL_Y], scale: [0.7, 1], ease: spring({ bounce: 0.42, duration: 650 }) }, t + 120)
    }
    tl.call(() => {
      etat.tete = false
      rendreAxe()
      el.compteurSous.textContent = 'avril 1976'
    }, P2 + R + 300)
  }

  // Plan 3 · Ce qui a changé : trois écarts, chacun tracé entre ses deux dates.
  tl.call(() => {
    etat.plan = 'ecarts'
    titre('Scène 1 · Compte à rebours', 'Ce qui a changé', 'Trois écarts, chacun à sa date')
    for (const c of el.cellules) c.classList.add('estompe')
  }, P3)
  tl.add('#compteur', { opacity: 0, duration: D(500) }, P3)
  ECARTS.forEach((e, i) => {
    const t0 = P3 + 300 + i * 5200
    tl.call(() => montrerEcart(e, i), t0)
    tl.add(el.arcsD[i], { draw: ['0 0', '0 1'], duration: D(1400), ease: 'inOutQuad' }, t0)
    tl.add('#ecart', { opacity: [0, 1], translateY: [70, 0], ...ressort(0.25, 650) }, t0 + 300)
    tl.add('#ecart', { opacity: 0, duration: D(450) }, t0 + 4700)
    tl.add(el.arcs.children[i], { opacity: 0.35, duration: D(450) }, t0 + 4700)
  })
  tl.call(() => {}, P3 + 300 + 3 * 5200 + 200)
}

function montrerEcart(e, i) {
  const de = FAITS[e.de]
  const a = FAITS[e.a]
  for (const c of el.cellules) c.classList.toggle('eclaire', c.dataset.fait === e.de || c.dataset.fait === e.a)
  for (const [j, p] of [...el.arcs.children].entries()) p.classList.toggle('arc-actif', j === i)
  document.getElementById('ecart').innerHTML = `
    <p class="ecart-annees">${Math.floor(e.anDe)} <span aria-hidden="true">→</span> ${Math.floor(e.anA)}</p>
    <div class="ecart-paire">
      <div class="fait" data-fait="${e.de}"><p class="fait-texte">${esc(de.texte)}</p><p class="fait-pied"><span class="fait-date">${esc(de.date)}</span><span class="fait-id">${e.de}</span></p></div>
      <div class="ecart-fleche" aria-hidden="true">→</div>
      <div class="fait" data-fait="${e.a}"><p class="fait-texte">${esc(a.texte)}</p><p class="fait-pied"><span class="fait-date">${esc(a.date)}</span><span class="fait-id">${e.a}</span></p></div>
    </div>`
}

// ---------- Scène 2 : les 20 ans qui restent ----------
function scene2(arrivee = null) {
  const depuisM = etat.m
  const dejaLa = etat.scene === 2
  arreterTout()
  etat.scene = 2
  document.body.dataset.scene = '2'
  etat.plan = 'vingt-ans'
  etat.tete = false
  utils.set('.carte-horizon, .horizon-titre, #cerf', { opacity: 0 })
  utils.set('#ecart', { opacity: 0 })
  utils.set(el.lienCerf, { draw: '0 0' })
  for (const p of el.arcs.children) p.classList.remove('arc-actif')
  el.compteur.textContent = '2026'
  el.compteurSous.textContent = '→ 2046'
  utils.set('#compteur', { opacity: 1 })
  utils.set(el.compteur, { opacity: 1 }) // au cas où un fondu de vedette a été interrompu
  if (dejaLa) {
    // Déjà en scène 2 (souhait arrivé en direct) : on garde l'axe déployé et les points d'édition.
    etat.m = 0
    for (const c of el.cellules) {
      utils.set(c, { translateX: xS2(Number(c.dataset.annee)) - 15, translateY: AXE_Y - 15, width: 30, height: 30, borderRadius: 15, opacity: 1 })
      utils.set(c.querySelector('.cellule-contenu'), { opacity: 0 })
    }
  } else if (depuisM < 1) {
    // Arrivée directe (sélecteur de scène) : on part de l'échelle 1, cellules visibles.
    etat.m = 1
    etatCellulesS1(true)
  }
  rendreAxe()
  rangerPoints()
  for (const c of etat.contribs) utils.set(c._el, { translateX: c._pos.x, translateY: c._pos.y - 500, opacity: 0 })
  majBilan() // total affiché d'emblée, sans décompte rapide (WCAG 2.3.1)

  const tl = createTimeline({ onComplete: () => scene1() })
  tlCourante = tl
  tl.call(() => titre('Scène 2 · Les 20 ans qui restent', '2027 → 2046 : à vous d’écrire', 'Scannez, écrivez un souhait : il s’affiche ici après validation'), 0)
  // Redéploiement de l'axe : les 50 ans passés se tassent, les 20 ans à venir s'ouvrent.
  tl.add(etat, { m: { to: 0, duration: D(2600), ease: 'inOutCubic' }, onUpdate: rendreAxe }, 0)
  if (REDUIT) tl.call(rendreAxe, 0)
  // Chaque cellule d'édition se replie en un point posé sur son année : morphing taille, forme et position.
  for (const c of el.cellules) {
    const x = xS2(Number(c.dataset.annee)) - 15
    tl.add(c.querySelector('.cellule-contenu'), { opacity: 0, duration: D(400) }, 0)
    tl.add(c, { translateX: x, translateY: AXE_Y - 15, width: 30, height: 30, borderRadius: 15, duration: D(2400), ease: 'inOutCubic' }, 150)
    tl.add(c._lien, { draw: '1 1', duration: D(500) }, 0)
    c.classList.remove('estompe', 'eclaire')
  }
  tl.add(el.arcs.children, { opacity: 0, duration: D(600) }, 0)
  tl.add('#hypothese', { opacity: 1, translateY: 0, duration: D(800) }, 1500)
  tl.add('#releve', { opacity: [0, 1], translateY: [60, 0], ...ressort(0.3, 700) }, 1800)
  tl.add('#bilan', { opacity: [0, 1], duration: D(700) }, 2200)
  // Les souhaits tombent dans leurs colonnes, un ressort par point.
  tl.add(
    etat.contribs.map((c) => c._el),
    { opacity: [0, 1], translateY: (t) => [Number(t.dataset.y) - 500, Number(t.dataset.y)], ...ressort(0.5, 700), delay: stagger(D(70)) },
    2600
  )

  // Vedettes : un souhait grossit depuis son point, se lit, puis rentre dans sa colonne.
  const choix = []
  if (arrivee) choix.push(arrivee)
  const avecTexte = etat.contribs.filter((c) => c.texte && c !== arrivee)
  while (choix.length < 4 && avecTexte.length) {
    choix.push(avecTexte[etat.vedetteIndex++ % avecTexte.length])
  }
  choix.forEach((c, i) => {
    const t = 5200 + i * 5600
    tl.call(() => montrerVedette(c, c === arrivee), t)
    tl.call(() => cacherVedette(c), t + 4700)
  })
  tl.call(() => {}, 5200 + choix.length * 5600 + 400)
}

function contenuVedette(c, direct) {
  const cat = CATEGORIES[c.cat]
  const marque = c.simule
    ? '<p class="vedette-marque marque-ex">Exemple simulé</p>'
    : '<p class="vedette-marque marque-direct">Démo · saisi sur ce portable, effacé après la démo</p>'
  const texte = c.texte ? `« ${esc(c.texte)} »` : `J’attends surtout : ${esc(cat.fr)}`
  return `${marque}
    <p class="vedette-texte">${texte}</p>
    <p class="vedette-pied"><span class="forme forme-${cat.forme} cat-${c.cat}"></span>${esc(cat.fr)} · pour ${c.an}${c.releve ? ' · message de la relève à elle-même' : ''} · un visiteur${direct ? ' · à l’instant' : ''}</p>`
}

function montrerVedette(c, direct) {
  // Une contribution retirée entre-temps n'est plus montrée (constat A-1).
  if (!etat.contribs.includes(c)) return
  etat.vedette = c
  const v = el.vedette
  const cont = v.querySelector('.vedette-contenu')
  cont.innerHTML = contenuVedette(c, direct)
  v.className = c.simule ? 'vedette-exemple' : 'vedette-demo'
  const cx = xS2(c.an - 0.5)
  const x = Math.min(X1 - VED_W, Math.max(1950, cx - VED_W / 2))
  const p = c._pos
  // Départ : depuis le point (souhait déjà là) ou depuis le QR code (souhait qui arrive en direct).
  const depart = direct ? { x: 7370 - POINT / 2, y: 300 } : { x: p.x, y: p.y }
  utils.set(v, { translateX: depart.x, translateY: depart.y, width: POINT, height: POINT, borderRadius: POINT / 2, opacity: 1 })
  utils.set(cont, { opacity: 0 })
  if (direct) utils.set(c._el, { opacity: 0 })
  // Trajet courbe : x et y n'ont pas la même courbe, d'où un arc sans tracé à dessiner.
  anim(v, {
    translateX: { to: x, ease: REDUIT ? 'linear' : direct ? 'outCubic' : spring({ bounce: 0.28, duration: 700 }), duration: D(1100) },
    translateY: { to: VED_Y, ease: REDUIT ? 'linear' : direct ? 'inOutQuad' : spring({ bounce: 0.28, duration: 700 }), duration: D(1100) },
    width: { to: VED_W, ...ressort(0.3, 700), delay: D(direct ? 500 : 0) },
    height: { to: VED_H, ...ressort(0.3, 700), delay: D(direct ? 500 : 0) },
    borderRadius: { to: 22, duration: D(600) },
  })
  anim(cont, { opacity: [0, 1], duration: D(500), delay: D(direct ? 1100 : 450) })
  // Compteur : fondu vers l'année du souhait, un seul changement (WCAG 2.3.1, constat A-3).
  if (REDUIT) el.compteur.textContent = c.an
  else
    anim(el.compteur, {
      opacity: [1, 0],
      duration: 250,
      ease: 'inQuad',
      onComplete: () => {
        el.compteur.textContent = c.an
        anim(el.compteur, { opacity: [0, 1], duration: 350, ease: 'outQuad' })
      },
    })
}

function cacherVedette(c) {
  const v = el.vedette
  if (etat.vedette === c) etat.vedette = null
  if (!etat.contribs.includes(c)) return // déjà effacée par retirer()
  const cont = v.querySelector('.vedette-contenu')
  anim(cont, { opacity: 0, duration: D(250) })
  anim(v, {
    translateX: c._pos.x,
    translateY: c._pos.y,
    width: POINT,
    height: POINT,
    borderRadius: POINT / 2,
    ...ressort(0.2, 700),
    delay: D(200),
    onComplete: () => {
      utils.set(v, { opacity: 0 })
      utils.set(c._el, { opacity: 1 })
      if (!REDUIT) anim(c._el, { scale: [1.6, 1], ease: spring({ bounce: 0.6, duration: 500 }) })
    },
  })
}

// ---------- Contributions venues du formulaire ----------
function recevoir(msg) {
  if (msg?.type === 'approuvee') {
    const c = { ...msg.contribution, simule: false }
    if (etat.contribs.some((x) => x.id === c.id)) return
    etat.contribs.push(c)
    if (etat.enPause) {
      etat.enAttente = c
      signaler('Un souhait approuvé attend la reprise')
      return
    }
    scene2(c)
  } else if (msg?.type === 'retrait') {
    retirer(msg.id)
  } else if (msg?.type === 'retrait-code' && typeof msg.code === 'string') {
    // N-4 (itération 3) : retrait par code depuis n'importe quelle page du formulaire ; le mur répond.
    const c = etat.contribs.find((x) => !x.simule && x.code === msg.code)
    if (c) retirer(c.id)
    canalMur.envoyer({ type: c ? 'retiree' : 'inconnu', code: msg.code })
  }
}
let canalMur = null

function retirer(id) {
  const i = etat.contribs.findIndex((c) => c.id === id)
  if (i < 0) return
  const [c] = etat.contribs.splice(i, 1)
  c._el?.remove()
  if (etat.enAttente === c) etat.enAttente = null
  if (etat.vedette === c) {
    // Retrait pendant la vedette : on l'efface tout de suite (constat A-1).
    etat.vedette = null
    el.vedette.querySelector('.vedette-contenu').innerHTML = ''
    utils.set(el.vedette, { opacity: 0 })
    utils.set(el.compteur, { opacity: 1 })
    el.compteur.textContent = '2026'
  }
  rangerPoints()
  for (const x of etat.contribs) if (etat.scene === 2) utils.set(x._el, { translateX: x._pos.x, translateY: x._pos.y })
  majBilan()
  signaler('Contribution retirée du mur')
}

function signaler(t) {
  document.getElementById('etat-commandes').textContent = t
}

// ---------- Commandes : pause, scènes, recadrage ----------
function basculerPause() {
  etat.enPause = !etat.enPause
  const b = document.getElementById('b-pause')
  if (etat.enPause) {
    engine.pause()
    b.innerHTML = 'Reprendre <kbd>espace</kbd>'
    signaler('Mouvement en pause')
  } else {
    engine.resume()
    b.innerHTML = 'Pause <kbd>espace</kbd>'
    signaler('')
    if (etat.enAttente) {
      const c = etat.enAttente
      etat.enAttente = null
      scene2(c)
    }
  }
  b.setAttribute('aria-pressed', String(etat.enPause))
  document.body.classList.toggle('en-pause', etat.enPause)
}

function brancherCommandes() {
  document.getElementById('b-pause').addEventListener('click', basculerPause)
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.closest('button, input, textarea, select')) {
      e.preventDefault()
      basculerPause()
    }
  })
  for (const b of document.querySelectorAll('[data-aller]')) {
    b.addEventListener('click', () => {
      const n = b.dataset.aller
      if (etat.enPause) basculerPause()
      n === '1' ? scene1() : scene2()
    })
  }
  const ordres = ['entier', 'gauche', 'droite']
  const noms = { entier: 'mur entier', gauche: 'moitié gauche', droite: 'moitié droite' }
  document.getElementById('b-recadrer').addEventListener('click', (e) => {
    etat.recadrage = ordres[(ordres.indexOf(etat.recadrage) + 1) % 3]
    e.currentTarget.textContent = `Recadrer : ${noms[etat.recadrage]}`
    ajuster()
  })
  document.getElementById('b-formulaire').addEventListener('click', () => {
    window.open('./?vue=formulaire', 'formulaire-2046', 'width=400,height=820')
  })
  document.getElementById('b-effacer').addEventListener('click', () => {
    for (const c of etat.contribs.filter((x) => !x.simule)) retirer(c.id)
    signaler('Contributions de démo effacées')
  })
}

// ---------- Démarrage ----------
export function demarrerMur(racine) {
  construire(racine)
  el = {
    axePasse: document.querySelector('.axe-passe'),
    axeFutur: document.querySelector('.axe-futur'),
    grads: [...document.querySelectorAll('.grad')],
    tete: document.getElementById('tete'),
    teteAnnee: document.getElementById('tete-annee'),
    compteur: document.getElementById('compteur-annee'),
    compteurSous: document.getElementById('compteur-sous'),
    titreScene: document.getElementById('titre-scene'),
    titre: document.getElementById('titre'),
    sousTitre: document.getElementById('sous-titre'),
    cellules: [...document.querySelectorAll('.cellule')],
    liens: document.getElementById('liens'),
    arcs: document.getElementById('arcs'),
    lienCerfEl: document.getElementById('lien-cerf'),
    points: document.getElementById('points'),
    vedette: document.getElementById('vedette'),
    total: document.getElementById('total'),
    detail: document.getElementById('detail-total'),
  }
  for (const g of el.grads) {
    g._annee = Number(g.dataset.annee)
    g._decennie = g.classList.contains('grad-decennie')
  }
  // Lien de la carte de Vint Cerf vers 2035 (en échelle 2).
  const x35 = xS2(2035)
  el.lienCerfEl.setAttribute('d', `M ${x35} ${AXE_Y + 18} L ${x35} ${CELL_Y}`)
  el.lienCerf = svg.createDrawable(el.lienCerfEl)[0]
  Object.assign(document.getElementById('cerf').style, { left: `${x35 - 760}px`, top: `${CELL_Y}px` })
  placerCellules()
  arcsEcarts()
  rangerPoints()
  ajuster()
  addEventListener('resize', ajuster)
  brancherCommandes()
  canalMur = ouvrirCanal(recevoir)
  const depart = new URLSearchParams(location.search).get('scene')
  depart === '2' ? scene2() : scene1()
}

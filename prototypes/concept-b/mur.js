// Le mur 32:9 (7680 × 2160), concept B « Contrôle de mission ».
// Moteur : une console qui interroge le temps depuis aujourd'hui, canal par canal.
// Matière : la grille des années et des éditions (piste 4), visible tout entière, en permanence.
import { animate, createTimeline, createTimer, createDrawable, createMotionPath, engine, utils, stagger } from 'animejs'
import {
  AN_DEBUT, AN_FIN, AN_AUJOURDHUI, FAITS, EDITIONS, JIQ_SANS_NUMERO, JIQ_REPORTEE,
  CANAUX, CANAL_PUBLIC, EXEMPLES,
} from './donnees.js'
import { envoyer, ecouter, purgerAncienneMemoire } from './canal.js'

// ---------- Géométrie de la scène ----------
const L = 7680, H = 2160
const X0 = 840, X1 = 7600
const NB_ANS = AN_FIN - AN_DEBUT + 1
const PAS = (X1 - X0) / NB_ANS
const RANGS_HAUT = 300, RANGS_H = 1590
const H_ACTIF = 820
const CARTE_L = 1120, CARTE_H = 300, ECART = 28 // énoncés à 56 px au mur (B-7)
const xAn = (an) => X0 + (an - AN_DEBUT + 0.5) * PAS
const X_MAINTENANT = xAn(AN_AUJOURDHUI)
const ANTENNE = { x: 7395, y: 2030 }
const DUREE_CANAL = 11000
const DUREE_SCENE_2 = 42000
const SVGNS = 'http://www.w3.org/2000/svg'

const IDS = [...CANAUX.map((c) => c.id), CANAL_PUBLIC.id]

function disposition(actif) {
  const hAutre = actif ? (RANGS_H - H_ACTIF) / (IDS.length - 1) : RANGS_H / IDS.length
  let y = RANGS_HAUT
  const r = {}
  for (const id of IDS) {
    const h = id === actif ? H_ACTIF : hAutre
    r[id] = { top: y, h, centre: y + h / 2 }
    y += h
  }
  return r
}

// ---------- État ----------
const etat = {
  scene: 1,
  canal: 0,
  pause: false,
  reduit: false,
  transmissions: [], // { id, type, an, texte, origine, heure, statut }
  exemple: 0,
  tl: null,
  minuteries: [],
  file: Promise.resolve(),
  enAttente: [], // transmissions reçues pendant la pause (B-5)
  vols: new Map(), // id → arrivée en cours, annulable au retrait (B-1)
  recadre: false, // mode recadré du portable (B-7)
  echelle: 1,
  largeurVue: L,
  camX: 0,
  camCible: 0,
  sonde: null,
}

let el = {}
let dispoCourante = disposition(null)

// ---------- Montage ----------
export function monterMur(racine, params) {
  engine.pauseOnDocumentHidden = false
  const mq = matchMedia('(prefers-reduced-motion: reduce)')
  etat.reduit = mq.matches || params.get('reduit') === '1'
  // Recadrage : par défaut sur un écran de portable (moins de 1700 px), sauf en kiosque ou avec ?recadre=0.
  etat.recadre = params.get('recadre') === '1' || (params.get('recadre') !== '0' && params.get('kiosque') !== '1' && innerWidth < 1700)
  mq.addEventListener('change', (e) => { etat.reduit = e.matches; relancer() })

  racine.innerHTML = gabarit()
  el = {
    cadre: racine.querySelector('.cadre'),
    scene: racine.querySelector('.scene'),
    rangs: Object.fromEntries(IDS.map((id) => [id, racine.querySelector(`.rang[data-canal="${id}"]`)])),
    traces: racine.querySelector('#traces'),
    cartes: racine.querySelector('#cartes'),
    entete: racine.querySelector('#entete-canal'),
    horloge: racine.querySelector('#horloge'),
    compteur: racine.querySelector('#compteur'),
    journal: racine.querySelector('#journal'),
    pauseScene: racine.querySelector('#pause-scene'),
    badgePause: racine.querySelector('#badge-pause'),
    barre: racine.querySelector('.barre'),
    btnPause: racine.querySelector('#btn-pause'),
    btnReduit: racine.querySelector('#btn-reduit'),
    tel: racine.querySelector('#panneau-tel'),
    cloture: racine.querySelector('#cloture'),
    annonce: racine.querySelector('#annonce'),
    cartouche: racine.querySelector('#cartouche-canal'),
  }
  if (params.get('kiosque') === '1') document.body.classList.add('kiosque')

  // Mémoire de la démo : en mémoire de page seulement, rien ne survit au rechargement (B-6).
  purgerAncienneMemoire()
  etat.transmissions = []
  majCases()
  majCompteur()
  majJournal()

  mettreALEchelle()
  addEventListener('resize', mettreALEchelle)

  // Horloge du jour : une minuterie anime.js, donc gelée par la pause comme tout le reste.
  majHorloge()
  createTimer({ duration: 1000, loop: true, onLoop: majHorloge })
  // Caméra du mode recadré : une minuterie anime.js aussi, donc gelée par la pause.
  createTimer({ duration: 1000, loop: true, onUpdate: majCamera })

  // Commandes.
  racine.querySelector('#btn-pause').addEventListener('click', basculerPause)
  el.pauseScene.addEventListener('click', basculerPause)
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName || '')) {
      e.preventDefault(); basculerPause()
    } else if (e.key === 'Escape') { fermerTel(); el.cloture.hidden = true }
  })
  racine.querySelector('#btn-s1').addEventListener('click', () => allerScene(1))
  racine.querySelector('#btn-s2').addEventListener('click', () => allerScene(2))
  racine.querySelector('#btn-tel').addEventListener('click', basculerTel)
  racine.querySelector('#qr').addEventListener('click', basculerTel)
  racine.querySelector('#btn-reduit').addEventListener('click', () => { etat.reduit = !etat.reduit; relancer() })
  racine.querySelector('#btn-recadre').addEventListener('click', () => { etat.recadre = !etat.recadre; majBoutons(); mettreALEchelle() })
  racine.querySelector('#btn-cloture').addEventListener('click', () => { el.cloture.hidden = false; el.cloture.querySelector('button').focus() })
  racine.querySelector('#fermer-cloture').addEventListener('click', () => { el.cloture.hidden = true })
  racine.querySelector('#btn-effacer').addEventListener('click', () => {
    etat.vols.forEach((v) => v.annuler()); etat.vols.clear(); etat.enAttente = []
    etat.transmissions = []; majCases(); majCompteur(); majJournal(); relancer()
  })

  // Transmissions venues du formulaire (même portable).
  ecouter((m) => {
    if (m?.genre === 'retrait') { retirer(m.id); return }
    if (m?.genre !== 'transmission') return
    envoyer({ genre: 'recu', id: m.id, enPause: etat.pause })
    if (etat.pause) {
      // B-5 : le mur reste figé ; la transmission attend la reprise.
      etat.enAttente.push(m)
      el.annonce.textContent = 'Une transmission attend la reprise.'
      return
    }
    arriver(m)
  })

  const canalDepart = CANAUX.findIndex((c) => c.id === params.get('canal'))
  if (canalDepart >= 0) etat.canal = canalDepart
  if (params.get('scene') === '2') allerScene(2); else allerScene(1)
  majBoutons()
}

function arriver(m) {
  if (etat.scene !== 2) allerScene(2)
  recevoir({ ...m, origine: 'demo' })
}

// B-1 : le retrait enlève tout (journal, case, compteur, carte, arrivée en cours, file de la pause).
function retirer(id) {
  const i = etat.enAttente.findIndex((m) => m.id === id)
  if (i >= 0) etat.enAttente.splice(i, 1)
  const t = etat.transmissions.find((x) => x.id === id && x.origine === 'demo')
  if (!t && i < 0) { envoyer({ genre: 'inconnu', id }); return }
  if (t) {
    t.statut = 'retiree'
    etat.transmissions = etat.transmissions.filter((x) => x !== t)
  }
  const v = etat.vols.get(id)
  if (v) { v.annuler(); etat.vols.delete(id) }
  el.cartes.querySelector(`.carte-public[data-id="${id}"]`)?.remove()
  majJournal(); majCompteur(); majCases()
  majCartesPublic(false)
  el.annonce.textContent = 'Une transmission a été retirée par son auteur.'
  envoyer({ genre: 'retiree', id })
}

function gabarit() {
  const axe = []
  for (let a = AN_DEBUT; a <= AN_FIN; a++) {
    const fort = a === AN_DEBUT || a === AN_FIN || a === AN_AUJOURDHUI || a === 2035 || (a % 10 === 0)
    axe.push(`<span class="tic${fort ? ' fort' : ''}" style="left:${xAn(a)}px"></span>`)
    if (fort) axe.push(`<span class="an${a === AN_AUJOURDHUI ? ' maintenant' : ''}" style="left:${xAn(a)}px">${a}</span>`)
  }
  const rangs = [...CANAUX, CANAL_PUBLIC].map((c, i) => `
    <div class="rang" data-canal="${c.id}" style="top:${dispoCourante[c.id].top}px;height:${dispoCourante[c.id].h}px">
      <div class="rang-nom"><span class="rang-num">${c.id === 'public' ? '◆' : String(i + 1).padStart(2, '0')}</span>${c.nom}</div>
      <div class="rang-ligne"></div>
      ${c.id === 'jiq' ? casesJiq() : ''}
      ${c.id === 'public' ? casesPublic() : ''}
      ${(c.points || []).filter(() => c.id !== 'jiq').map((p) => `<span class="point" data-fait="${p.f}" style="left:${xAn(p.an)}px" title="${p.f}"></span>`).join('')}
    </div>`).join('')

  return `
  <div class="cadre">
    <div class="scene" role="img" aria-label="Mur 32:9 du concept B, contrôle de mission">
      <header class="bandeau">
        <div class="titre">
          <p class="titre-1">Contrôle de mission</p>
          <p class="titre-2" data-fait="F-030">« 50 années à contribuer au développement du secteur des TI au Québec » <span class="fid">F-030</span></p>
        </div>
        <div id="entete-canal" class="entete-canal" aria-live="off"></div>
        <div class="tableau">
          <p class="horloge-l">Aujourd'hui · heure locale</p>
          <p id="horloge" class="horloge">--:--:--</p>
          <p id="compteur" class="compteur"></p>
        </div>
      </header>

      <div class="axe">
        <span class="zone zone-passe" style="left:${X0}px">1976 → 2026 · ce que les sources savent</span>
        <span class="zone zone-futur" style="left:${xAn(2027) - PAS / 2}px">2027 → 2046 · ce que vous écrirez</span>
        ${axe.join('')}
      </div>
      <div class="futur-fond" style="left:${xAn(2027) - PAS / 2}px;width:${X1 - xAn(2027) + PAS / 2}px"></div>
      ${rangs}
      <div class="maintenant-ligne" style="left:${X_MAINTENANT}px"></div>
      <svg id="traces" class="traces" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" aria-hidden="true"></svg>
      <div id="cartes" class="cartes"></div>

      <footer class="pied">
        <button id="pause-scene" class="pause-scene" type="button" aria-pressed="false">❚❚ Pause · espace</button>
        <div class="journal-bloc">
          <p class="journal-titre">Journal des transmissions · <span class="simule">démo : contributions simulées ou saisies sur ce portable</span></p>
          <ol id="journal" class="journal"></ol>
        </div>
        <div class="legende">
          <p><span class="lg lg-num">40e</span> édition numérotée dans une source <span class="lg lg-vide"></span> année sans source : à écrire</p>
          <p><span class="lg lg-point"></span> fait sourcé (F-xxx) <span class="lg lg-pub"></span> transmission du public</p>
          <p class="non-officiel">Proposition non officielle · prototype</p>
        </div>
        <button id="qr" class="qr" type="button" aria-label="Ouvrir le formulaire de contribution (QR simulé)">
          <span class="qr-motif">${motifQr()}</span>
          <span class="qr-l">QR simulé<br>écrivez la suite</span>
        </button>
      </footer>
      <p id="badge-pause" class="badge-pause" hidden>En pause</p>
    </div>
    <p id="cartouche-canal" class="cartouche-canal" hidden></p>
  </div>

  <nav class="barre" aria-label="Commandes de la démo">
    <button id="btn-pause" type="button" aria-pressed="false">Pause (espace)</button>
    <button id="btn-s1" type="button">Scène 1 · Canaux</button>
    <button id="btn-s2" type="button">Scène 2 · Canal entrant</button>
    <button id="btn-tel" type="button" aria-expanded="false" aria-controls="panneau-tel">Téléphone (démo)</button>
    <button id="btn-reduit" type="button" aria-pressed="false">Mouvement réduit</button>
    <button id="btn-recadre" type="button" aria-pressed="false">Recadrer (portable)</button>
    <button id="btn-cloture" type="button">Ce que ça demande au Réseau</button>
    <button id="btn-effacer" type="button">Effacer la démo</button>
  </nav>

  <aside id="panneau-tel" class="panneau-tel" hidden aria-label="Formulaire au format téléphone">
    <button type="button" class="fermer-tel" id="fermer-tel">Fermer le téléphone</button>
  </aside>

  <div id="cloture" class="cloture" role="dialog" aria-modal="true" aria-labelledby="cloture-t" hidden>
    <div class="cloture-boite">
      <h2 id="cloture-t">Ce que ça demande au Réseau</h2>
      <p>Après la boucle, jamais pendant. Repris du brief 0.3.4.</p>
      <table>
        <thead><tr><th scope="col">Besoin (paliers 2 et 3)</th><th scope="col">Ordre de grandeur connu</th></tr></thead>
        <tbody>
          <tr><td>Espace de stand, 5 à 6 m de façade</td><td>Inconnu</td></tr>
          <tr><td>Location d'un mur</td><td>Seul prix lu : 1 500 à 3 500 $ US par jour ; devis local à obtenir</td></tr>
          <tr><td>Ligne filaire, électricité</td><td>À commander au lieu</td></tr>
          <tr><td>Modérateurs pendant la JIQ</td><td>Inconnu</td></tr>
          <tr><td>Gardien des capsules, convention, avis juridique</td><td>Inconnu</td></tr>
        </tbody>
      </table>
      <button type="button" id="fermer-cloture">Fermer</button>
    </div>
  </div>
  <p id="annonce" class="visuellement-cache" aria-live="polite"></p>`
}

function casesJiq() {
  const out = []
  for (let a = AN_DEBUT; a <= AN_FIN; a++) {
    let cls = 'case', txt = '', fait = ''
    if (EDITIONS[a]) { cls += ' case-num'; txt = EDITIONS[a].libelle; fait = EDITIONS[a].fait }
    else if (JIQ_SANS_NUMERO[a]) { cls += ' case-sans'; txt = JIQ_SANS_NUMERO[a].libelle; fait = JIQ_SANS_NUMERO[a].fait }
    else if (JIQ_REPORTEE[a]) { cls += ' case-reportee'; txt = '—'; fait = JIQ_REPORTEE[a].fait }
    else if (a > AN_AUJOURDHUI) cls += ' case-futur'
    else cls += ' case-vide'
    if (a === AN_AUJOURDHUI) cls += ' case-maintenant'
    out.push(`<div class="${cls}" data-an="${a}"${fait ? ` data-fait="${fait}"` : ''} style="left:${xAn(a) - PAS / 2 + 5}px;width:${PAS - 10}px"><span>${txt}</span></div>`)
  }
  return out.join('')
}

function casesPublic() {
  const out = []
  for (let a = AN_DEBUT; a <= AN_FIN; a++) {
    const cls = a < AN_AUJOURDHUI ? 'cp cp-passe' : a === AN_AUJOURDHUI ? 'cp cp-maintenant' : 'cp cp-futur'
    out.push(`<div class="${cls}" data-an="${a}" style="left:${xAn(a) - PAS / 2 + 5}px;width:${PAS - 10}px"><span class="cp-n"></span></div>`)
  }
  return out.join('')
}

function motifQr() {
  // Motif décoratif déterministe : ce n'est pas un vrai code QR (marqué « QR simulé »).
  let s = 7, cells = ''
  for (let i = 0; i < 21 * 21; i++) {
    const x = i % 21, y = Math.floor(i / 21)
    const coin = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
    let on
    if (coin) {
      const cx = x > 13 ? x - 14 : x, cy = y > 13 ? y - 14 : y
      on = cx === 0 || cy === 0 || cx === 6 || cy === 6 || (cx > 1 && cx < 5 && cy > 1 && cy < 5)
    } else { s = (s * 9301 + 49297) % 233280; on = s / 233280 > 0.52 }
    cells += `<i class="${on ? 'on' : ''}"></i>`
  }
  return cells
}

// ---------- Échelle ----------
function mettreALEchelle() {
  const vw = innerWidth, vh = innerHeight
  const barreH = 56
  let s = vw / L
  const kiosque = document.body.classList.contains('kiosque')
  let barre = !kiosque && vh - H * s >= barreH
  if (H * s > vh) { s = vh / H; barre = false }
  // B-7 : en mode recadré, le mur remplit la hauteur et la caméra suit la sonde (environ la moitié du mur visible).
  if (etat.recadre) {
    const sr = (vh - (kiosque ? 0 : barreH)) / H
    if (sr > s) { s = sr; barre = !kiosque }
  }
  etat.echelle = s
  etat.largeurVue = Math.min(L, vw / s)
  el.cadre.style.width = `${Math.min(L * s, vw)}px`
  el.cadre.style.height = `${H * s}px`
  el.barre.hidden = !barre
  majCamera(true)
}

// Caméra du mode recadré : suit la sonde en scène 1, se place sur le présent et l'avenir en scène 2.
function majCamera(immediat = false) {
  if (!el.scene) return
  const W = etat.largeurVue, max = Math.max(0, L - W)
  let cible = 0
  if (etat.recadre && max > 0) {
    if (etat.scene === 2) cible = max
    else if (!etat.reduit && etat.sonde?.isConnected) cible = parseFloat(utils.get(etat.sonde, 'translateX')) - W * 0.5
    else cible = etat.camCible
    cible = Math.min(Math.max(cible, 0), max)
  }
  if (immediat === true || etat.reduit || !etat.recadre) etat.camX = cible
  else etat.camX += (cible - etat.camX) * 0.06
  el.scene.style.transform = `scale(${etat.echelle}) translateX(${-etat.camX.toFixed(1)}px)`
}

// ---------- Pause (WCAG 2.2.2) ----------
function basculerPause() {
  etat.pause = !etat.pause
  if (etat.pause) engine.pause(); else engine.resume()
  majBoutons()
  if (!etat.pause && etat.enAttente.length) etat.enAttente.splice(0).forEach(arriver)
  el.annonce.textContent = etat.pause ? 'Mouvement en pause.' : 'Mouvement repris.'
}

// N-1 (itération 3) : en mode recadré, l'en-tête et les noms de rangs sortent du cadre ;
// un cartouche fixe, hors de la scène transformée, répète le canal actif.
function majCartouche(texte) {
  if (!el.cartouche) return
  el.cartouche.textContent = texte
  el.cartouche.hidden = !etat.recadre
}

function majBoutons() {
  el.btnPause.textContent = etat.pause ? 'Reprendre (espace)' : 'Pause (espace)'
  el.btnPause.setAttribute('aria-pressed', String(etat.pause))
  el.pauseScene.textContent = etat.pause ? '▶ Reprendre · espace' : '❚❚ Pause · espace'
  el.pauseScene.setAttribute('aria-pressed', String(etat.pause))
  el.badgePause.hidden = !etat.pause
  el.btnReduit.setAttribute('aria-pressed', String(etat.reduit))
  document.getElementById('btn-recadre')?.setAttribute('aria-pressed', String(etat.recadre))
  if (el.cartouche) el.cartouche.hidden = !etat.recadre
  document.body.classList.toggle('reduit', etat.reduit)
}

// ---------- Téléphone (iframe, même origine, sans réseau) ----------
function basculerTel() {
  if (el.tel.hidden) {
    if (!el.tel.querySelector('iframe')) {
      const f = document.createElement('iframe')
      f.src = '?vue=formulaire&integre=1'
      f.title = 'Formulaire de contribution, format téléphone'
      el.tel.appendChild(f)
      el.tel.querySelector('#fermer-tel').addEventListener('click', fermerTel)
    }
    el.tel.hidden = false
  } else fermerTel()
  document.getElementById('btn-tel').setAttribute('aria-expanded', String(!el.tel.hidden))
}
function fermerTel() {
  el.tel.hidden = true
  document.getElementById('btn-tel').setAttribute('aria-expanded', 'false')
}

// ---------- Horloge et compteurs ----------
function majHorloge() {
  el.horloge.textContent = heure()
}
function heure() {
  const d = new Date(), z = (n) => String(n).padStart(2, '0')
  return `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
}
function majCompteur() {
  const ok = etat.transmissions.filter((t) => t.statut === 'approuvee')
  const sim = ok.filter((t) => t.origine === 'exemple').length
  el.compteur.innerHTML = `Transmissions approuvées : <strong>${ok.length}</strong><br><span class="simule">${sim} exemples simulés · ${ok.length - sim} saisies en démo</span>`
}
function majCases() {
  const parAn = {}
  for (const t of etat.transmissions) if (t.statut === 'approuvee') parAn[t.an] = (parAn[t.an] || 0) + 1
  el.rangs.public.querySelectorAll('.cp').forEach((c) => {
    const n = parAn[c.dataset.an] || 0
    c.classList.toggle('pleine', n > 0)
    c.querySelector('.cp-n').textContent = n ? String(n) : ''
  })
}
function majJournal() {
  const d = etat.transmissions.slice(-3).reverse()
  el.journal.innerHTML = d.length ? d.map((t) => `
    <li><span class="j-h">${t.heure || '--:--:--'}</span> ${libelleType(t)} · « ${echapper(t.texte)} » · <span class="simule">${t.origine === 'exemple' ? 'exemple simulé' : 'saisie en démo'}</span> · <span class="j-s ${t.statut}">${t.statut === 'approuvee' ? 'approuvée' : 'en attente de validation'}</span></li>`).join('')
    : '<li class="vide">Aucune transmission pour l\'instant. Le formulaire attend la première.</li>'
}
function libelleType(t) {
  if (t.type === 'attente') return 'Attente pour aujourd\'hui'
  if (t.type === 'souhait') return `Souhait pour ${t.an}`
  return `Souvenir de ${t.an}`
}
function echapper(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// ---------- Ordonnancement (minuteries anime.js : la pause les gèle) ----------
function planifier(ms, fn) {
  const t = createTimer({ duration: ms, onComplete: fn })
  etat.minuteries.push(t)
  return t
}
function arreterTout() {
  etat.minuteries.forEach((t) => t.cancel())
  etat.minuteries = []
  if (etat.tl) { etat.tl.cancel(); etat.tl = null }
  el.traces.replaceChildren()
  el.cartes.replaceChildren()
}
function relancer() {
  majBoutons()
  allerScene(etat.scene)
}

function allerScene(n) {
  arreterTout()
  etat.scene = n
  document.body.dataset.scene = String(n)
  if (n === 1) passerCanal(etat.canal)
  else sceneEntrante()
}

// ---------- Disposition des rangs ----------
function disposer(actif, duree = 800) {
  const d = disposition(actif)
  dispoCourante = d
  for (const id of IDS) {
    const r = el.rangs[id]
    r.classList.toggle('actif', id === actif)
    r.classList.toggle('attenue', !!actif && id !== actif)
    if (etat.reduit || duree === 0) utils.set(r, { top: d[id].top, height: d[id].h })
    else animate(r, { top: d[id].top, height: d[id].h, duration: duree, ease: 'outExpo' })
  }
  return d
}

// Placement des cartes en deux couloirs, sans chevauchement, au plus près de leur point.
function placerCartes(items, rang) {
  const couloirs = [
    { y: rang.top + 18, fin: -Infinity, liste: [] },
    { y: rang.centre + 96, fin: -Infinity, liste: [] },
  ]
  const tries = [...items].sort((a, b) => a.x - b.x)
  for (const it of tries) {
    const voulu = Math.min(Math.max(it.x - CARTE_L / 2, X0 - 760), X1 - CARTE_L)
    let meilleur = couloirs[0], cout = Infinity
    for (const c of couloirs) {
      const g = Math.max(voulu, c.fin + ECART)
      const k = g - voulu
      if (k < cout) { cout = k; meilleur = c }
    }
    it.left = Math.max(voulu, meilleur.fin + ECART)
    it.top = meilleur.y
    it.haut = meilleur === couloirs[0]
    meilleur.fin = it.left + CARTE_L
    meilleur.liste.push(it)
  }
  // Passe retour : rien ne déborde à droite.
  for (const c of couloirs) {
    let limite = X1
    for (let i = c.liste.length - 1; i >= 0; i--) {
      const it = c.liste[i]
      it.left = Math.min(it.left, limite - CARTE_L)
      limite = it.left - ECART
    }
  }
  return tries
}

function creerCarte(it, classe = '') {
  const a = document.createElement('article')
  a.className = `carte ${classe}`
  if (it.f) a.dataset.fait = it.f
  a.style.left = `${it.left}px`
  a.style.top = `${it.top}px`
  a.innerHTML = it.html
  el.cartes.appendChild(a)
  return a
}

function svg(tag, attrs, parent = el.traces) {
  const n = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v)
  parent.appendChild(n)
  return n
}

function lienCarte(it, yPoint) {
  const x = Math.min(Math.max(it.x, it.left + 30), it.left + CARTE_L - 30)
  const yCarte = it.haut ? it.top + CARTE_H : it.top
  return svg('path', { d: `M${it.x} ${yPoint} L${x} ${yCarte}`, class: 'lien' })
}

// Chemin en arcs à travers des points (alternance haut / bas).
function cheminArcs(pts, y) {
  let d = `M${pts[0]} ${y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const amp = Math.min(70, Math.abs(b - a) * 0.18) * (i % 2 ? -1 : 1)
    d += ` Q${(a + b) / 2} ${y + amp} ${b} ${y}`
  }
  return d
}

// ---------- Scène 1 : la console interroge un canal, depuis aujourd'hui ----------
function passerCanal(i) {
  etat.canal = i
  const c = CANAUX[i]
  const d = disposer(c.id)
  const rang = d[c.id]
  const y = rang.centre

  el.entete.innerHTML = `
    <p class="surtitre">Scène 1 · requête depuis aujourd'hui · canal ${String(i + 1).padStart(2, '0')} / ${String(CANAUX.length).padStart(2, '0')}</p>
    <p class="canal-nom">${c.nom}</p>
    <p class="canal-q">${c.question}</p>`
  majCartouche(`Canal ${String(i + 1).padStart(2, '0')} / ${String(CANAUX.length).padStart(2, '0')} · ${c.nom}`)

  // Points du canal, du plus récent au plus ancien : la sonde part de 2026 et remonte.
  const xs = [...new Set(c.points.map((p) => xAn(p.an)))].filter((x) => x <= X_MAINTENANT).sort((a, b) => b - a)
  const arriere = [X_MAINTENANT, ...xs.filter((x) => Math.abs(x - X_MAINTENANT) > 1)]
  const xHorizon = c.horizon ? xAn(c.horizon.an) : null

  const pArriere = svg('path', { d: cheminArcs(arriere, y), class: 'trace' })
  const pAvant = svg('path', { d: xHorizon ? `M${X_MAINTENANT} ${y} L${xHorizon} ${y}` : `M${X_MAINTENANT} ${y} L${X1 - 10} ${y}`, class: 'trace trace-avant' })
  const pReste = xHorizon ? svg('path', { d: `M${xHorizon} ${y} L${X1 - 10} ${y}`, class: 'trace trace-vide' }) : null
  const sonde = svg('g', { class: 'sonde' })
  svg('circle', { r: 30, class: 'sonde-halo' }, sonde)
  svg('circle', { r: 14, class: 'sonde-coeur' }, sonde)
  utils.set(sonde, { translateX: X_MAINTENANT, translateY: y })
  etat.sonde = sonde

  // Cartes : énoncés tels quels, F-xxx en data-fait.
  const items = c.cartes.map((f) => {
    const pts = c.points.filter((p) => p.f === f)
    const an = pts.length > 1 ? pts[Math.floor(pts.length / 2)].an : pts[0].an
    return { f, x: xAn(an), html: `<p class="carte-date">${FAITS[f].date} <span class="fid">${f}</span></p><p class="carte-texte">${FAITS[f].enonce}</p>` }
  })
  placerCartes(items, rang)
  const cartes = items.map((it) => ({ it, n: creerCarte(it), lien: lienCarte(it, y) }))
  const fin = document.createElement('p')
  fin.className = 'fin-canal'
  fin.style.left = `${xAn(2030)}px`
  fin.style.top = `${y + (c.horizon ? -150 : -120)}px`
  fin.innerHTML = `${c.horizon ? `<span class="horizon">${c.horizon.texte}</span><br>` : ''}${c.fin}`
  el.cartes.appendChild(fin)
  let horizonMarque = null
  if (xHorizon) horizonMarque = svg('path', { d: `M${xHorizon} ${y - 60} L${xHorizon} ${y + 60}`, class: 'horizon-trait' })

  // Moment où la sonde atteint chaque point : fraction de longueur mesurée sur le chemin réel.
  const longueurTotale = pArriere.getTotalLength()
  const temp = svg('path', { d: '' })
  const fraction = (x) => {
    const idx = arriere.findIndex((v) => Math.abs(v - x) < 1)
    if (idx <= 0) return 0
    temp.setAttribute('d', cheminArcs(arriere.slice(0, idx + 1), y))
    return temp.getTotalLength() / longueurTotale
  }
  const fractions = cartes.map(({ it }) => fraction(xs.reduce((m, v) => (Math.abs(v - it.x) < Math.abs(m - it.x) ? v : m), xs[0] ?? X_MAINTENANT)))
  temp.remove()

  const points = el.rangs[c.id].querySelectorAll(c.id === 'jiq' ? '.case[data-fait]' : '.point')

  if (etat.reduit) {
    // États fixes : rien ne file, rien ne s'imprime.
    cartes.forEach(({ n }) => n.classList.add('visible'))
    sonde.remove()
    fin.classList.add('visible')
    // Mode recadré sans mouvement : le passé d'abord, puis un saut vers le présent et l'avenir.
    etat.camCible = 0
    planifier(DUREE_CANAL / 2, () => { etat.camCible = L })
  } else {
    utils.set(cartes.map((k) => k.n), { opacity: 0, translateY: 30 })
    utils.set(cartes.map((k) => k.lien), { opacity: 0 })
    utils.set(fin, { opacity: 0 })
    utils.set([pAvant, pReste].filter(Boolean), { opacity: 0 })
    const dArr = Math.max(1800, longueurTotale * 0.62)
    const t0 = 850
    const tl = createTimeline({ autoplay: true })
    tl.add([...el.entete.children], { opacity: [0, 1], translateY: [24, 0], duration: 600, delay: stagger(90), ease: 'outQuad' }, 0)
      .add(points, { scale: [0.4, 1], opacity: [0.3, 1], duration: 700, delay: stagger(45, { reversed: true }), ease: 'outElastic(1, .6)' }, 500)
      .add(createDrawable(pArriere), { draw: ['0 0', '0 1'], duration: dArr, ease: 'linear' }, t0)
      .add(sonde, { ...createMotionPath(pArriere), duration: dArr, ease: 'linear' }, t0)
    cartes.forEach(({ n, lien }, k) => {
      const t = t0 + fractions[k] * dArr
      tl.add(lien, { opacity: [0, 1], duration: 300 }, t)
        .add(n, { opacity: [0, 1], translateY: [30, 0], duration: 650, ease: 'outBack(1.4)' }, t)
    })
    // Retour au présent, puis vers 2046 : la partie que le public écrit.
    const tRetour = t0 + dArr + 200
    tl.add(sonde, { translateX: X_MAINTENANT, translateY: y, duration: 700, ease: 'inOutQuad' }, tRetour)
      .add(pAvant, { opacity: [0, 1], duration: 10 }, tRetour + 700)
      .add(createDrawable(pAvant), { draw: ['0 0', '0 1'], duration: 1100, ease: 'inOutSine' }, tRetour + 700)
      .add(sonde, { ...createMotionPath(pAvant), duration: 1100, ease: 'inOutSine' }, tRetour + 700)
    if (pReste) tl.add(pReste, { opacity: [0, 1], duration: 600 }, tRetour + 1800)
    if (horizonMarque) tl.add(horizonMarque, { opacity: [0, 1], scaleY: [0, 1], duration: 500 }, tRetour + 1700)
    tl.add(fin, { opacity: [0, 1], translateX: [-40, 0], duration: 700, ease: 'outQuad' }, tRetour + 1500)
      .add(sonde, { opacity: [1, 0.35], duration: 600 }, tRetour + 2000)
    etat.tl = tl
  }

  planifier(DUREE_CANAL, () => {
    const suivant = i + 1
    if (suivant >= CANAUX.length) { etat.canal = 0; allerScene(2) } else { arreterTout(); passerCanal(suivant) }
  })
}

// ---------- Scène 2 : canal entrant ----------
function sceneEntrante() {
  disposer('public')
  el.entete.innerHTML = `
    <p class="surtitre">Scène 2 · canal entrant · 47e JIQ, aujourd'hui</p>
    <p class="canal-nom">Vous écrivez la suite</p>
    <p class="canal-q" data-fait="F-080">${FAITS['F-080'].enonce} <span class="fid">F-080 · 2025</span></p>`
  majCartouche('Scène 2 · canal entrant · Vous écrivez la suite')
  if (!etat.reduit) animate([...el.entete.children], { opacity: [0, 1], translateY: [24, 0], duration: 600, delay: stagger(90) })
  majCartesPublic(false)

  // Exemples simulés, génériques, à intervalle régulier.
  const cycle = () => {
    const ex = EXEMPLES[etat.exemple++ % EXEMPLES.length]
    recevoir({ ...ex, id: `ex-${Date.now().toString(36)}`, origine: 'exemple' })
    planifier(7000, cycle)
  }
  planifier(1600, cycle)
  planifier(DUREE_SCENE_2, () => { arreterTout(); etat.canal = 0; allerScene(1) })
}

function cartesPublicItems() {
  const rang = dispoCourante.public
  const derniers = etat.transmissions.filter((t) => t.statut === 'approuvee').slice(-6)
  const items = derniers.map((t) => ({
    id: t.id,
    x: xAn(t.an),
    html: `<p class="carte-date">${libelleType(t)} · <span class="simule">${t.origine === 'exemple' ? 'exemple simulé' : 'saisie en démo'}</span></p><p class="carte-texte">« ${echapper(t.texte)} »</p><p class="carte-sig">${t.type === 'souvenir' ? 'Témoignage, pas un fait sourcé · ' : ''}un visiteur · ${t.heure}</p>`,
  }))
  placerCartes(items, rang)
  return { items, y: rang.centre }
}

// Réarrangement des cartes : les anciennes glissent vers leur nouvelle place (positions calculées à l'exécution).
function majCartesPublic(anime = true, nouveau = null) {
  if (etat.scene !== 2) return
  const { items, y } = cartesPublicItems()
  el.traces.querySelectorAll('.lien').forEach((n) => n.remove())
  const existantes = new Map([...el.cartes.querySelectorAll('.carte-public')].map((n) => [n.dataset.id, n]))
  for (const it of items) {
    let n = existantes.get(it.id)
    if (n) {
      existantes.delete(it.id)
      if (anime && !etat.reduit) animate(n, { left: it.left, top: it.top, duration: 700, ease: 'inOutQuart' })
      else utils.set(n, { left: it.left, top: it.top })
    } else {
      n = creerCarte(it, 'carte-public visible')
      n.dataset.id = it.id
      if (it.id === nouveau && !etat.reduit) animate(n, { opacity: [0, 1], scale: [0.85, 1], duration: 700, ease: 'outBack(1.6)' })
    }
    const lien = lienCarte(it, y)
    lien.classList.add('lien-public')
    if (anime && !etat.reduit) animate(lien, { opacity: [0, 1], duration: 500, delay: 500 })
  }
  existantes.forEach((n) => (etat.reduit ? n.remove() : animate(n, { opacity: 0, duration: 400, onComplete: () => n.remove() })))
}

// Une transmission arrive : antenne → aujourd'hui → validation (simulée) → case de son année.
function recevoir(m) {
  const t = { id: m.id, type: m.type, an: m.an, texte: m.texte, origine: m.origine, heure: heure(), statut: 'attente' }
  etat.transmissions.push(t)
  majJournal()
  el.annonce.textContent = `Transmission reçue : ${libelleType(t)}. En attente de validation.`
  const y = () => dispoCourante.public.centre

  const approuver = () => {
    if (t.statut === 'retiree') return
    t.statut = 'approuvee'
    envoyer({ genre: 'approuvee', id: t.id, an: t.an })
    majJournal(); majCompteur(); majCases()
    const caseAn = el.rangs.public.querySelector(`.cp[data-an="${t.an}"]`)
    if (caseAn && !etat.reduit) animate(caseAn, { scale: [1, 1.45, 1], duration: 900, ease: 'outElastic(1, .5)' })
    majCartesPublic(true, t.id)
    el.annonce.textContent = `Approuvée : ${libelleType(t)}.`
  }

  if (etat.reduit) {
    const tm = createTimer({ duration: 1600, onComplete: () => { etat.vols.delete(t.id); approuver() } })
    etat.vols.set(t.id, { annuler: () => tm.cancel() })
    return
  }

  const yc = y()
  const arrivee = svg('path', { d: `M${ANTENNE.x} ${ANTENNE.y} C${ANTENNE.x - 700} ${ANTENNE.y - 520}, ${X_MAINTENANT + 420} ${yc - 420}, ${X_MAINTENANT} ${yc}`, class: 'trace trace-pub' })
  const xc = xAn(t.an)
  const depot = svg('path', { d: `M${X_MAINTENANT} ${yc} Q${(X_MAINTENANT + xc) / 2} ${yc - 160} ${xc} ${yc}`, class: 'trace trace-pub' })
  utils.set(depot, { opacity: 0 })
  const g = svg('g', { class: 'particule' })
  svg('circle', { r: 26, class: 'part-halo' }, g)
  svg('rect', { x: -14, y: -14, width: 28, height: 28, transform: 'rotate(45)', class: 'part-coeur' }, g)
  utils.set(g, { translateX: ANTENNE.x, translateY: ANTENNE.y })
  const anneau = svg('circle', { cx: X_MAINTENANT, cy: yc, r: 46, class: 'anneau' })
  const attente = svg('text', { x: X_MAINTENANT + 70, y: yc - 60, class: 'attente-txt' })
  attente.textContent = 'en attente de validation · modération simulée'
  utils.set([anneau, attente], { opacity: 0 })

  const noeuds = [arrivee, depot, g, anneau, attente]
  const tl = createTimeline({
    onComplete: () => { noeuds.forEach((n) => n.remove()); etat.vols.delete(t.id) },
  })
  etat.vols.set(t.id, { annuler: () => { tl.cancel(); noeuds.forEach((n) => n.remove()) } })
  tl.add(createDrawable(arrivee), { draw: ['0 0', '0 1'], duration: 1400, ease: 'inOutQuad' }, 0)
    .add(g, { ...createMotionPath(arrivee), duration: 1400, ease: 'inOutQuad' }, 0)
    .add(arrivee, { opacity: [1, 0], duration: 500 }, 1500)
    .add([anneau, attente], { opacity: [0, 1], duration: 300 }, 1400)
    .add(anneau, { r: [46, 70], opacity: [1, 0.25], duration: 1600, ease: 'inOutSine' }, 1400)
    .call(approuver, 3000)
    .add(attente, { opacity: 0, duration: 300 }, 3000)
    .add(depot, { opacity: [0, 1], duration: 10 }, 3000)
    .add(createDrawable(depot), { draw: ['0 0', '0 1'], duration: 900, ease: 'inOutCubic' }, 3000)
    .add(g, { ...createMotionPath(depot), duration: 900, ease: 'inOutCubic' }, 3000)
    .add([g, depot, anneau], { opacity: 0, duration: 500 }, 3950)
}

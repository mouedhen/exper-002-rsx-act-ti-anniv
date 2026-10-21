// Le mur 32:9 (conçu pour 7680 × 2160), mis à l'échelle dans la fenêtre.
// anime.js : un seul fil de temps (timeline) qui imprime les faits au caractère près, change d'interface,
//   se met en pause, reprend et saute à une scène (seek).
// Motion : la contribution du public arrive dans l'interface d'aujourd'hui (FLIP à ressort du fil),
//   puis voyage, en se reformatant, jusque dans le décor de l'époque affichée.
import { createTimeline } from 'animejs'
import { animate } from 'motion'
import { SCENE_1, SCENE_2, AUJOURD_HUI, EXEMPLES_SIMULES } from './faits.js'
import { ouvrirCanal } from './canal.js'

const LARGEUR = 7680
const HAUTEUR = 2160
const CPS = 0.04 // caractères par milliseconde (40 par seconde)
const DEBUT_SCENE_2 = 24000
const FIN_BOUCLE = 48000
const ANCIEN_NOM = "Fédération de l'informatique du Québec"
const NOUVEAU_NOM = 'Réseau ACTION TI'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// ---------- Gabarit ----------
function ligneTerminal(f) {
  return `${f.date.padEnd(17, ' ')}${f.enonce}`
}

function gabarit() {
  const lignes1 = [
    { invite: true, texte: 'RÉSEAU> afficher --époque 1976-1986' },
    ...SCENE_1.faits.map((f) => ({ fait: f, texte: ligneTerminal(f) })),
  ]
  const html1 = lignes1.map((l, i) => l.invite
    ? `<p class="ligne invite" data-i="${i}"><span class="saisie" aria-hidden="true"></span><span class="sr">${esc(l.texte)}</span></p>`
    : `<p class="ligne fait" data-i="${i}" data-fait="${l.fait.id}"><span class="saisie" aria-hidden="true"></span><span class="sr">${esc(l.fait.date)} : ${esc(l.fait.enonce)}</span><span class="src">${l.fait.id} · ${esc(l.fait.sources)}</span></p>`).join('')

  const html2 = SCENE_2.faits.map((f, k) =>
    `<li data-fait="${f.id}" data-k="${k + 1}"><b>${esc(f.date)}</b> — ${esc(f.enonce)} <span class="lien">[${f.id} · ${esc(f.sources)}]</span></li>`).join('')

  const cartes = AUJOURD_HUI.map((f) =>
    `<article class="carte-fait" data-fait="${f.id}"><p class="date">${esc(f.date)}</p><p class="enonce">${esc(f.enonce)}</p><p class="src">${f.id} · ${esc(f.sources)}</p></article>`).join('')

  return {
    lignes1,
    html: `
<div class="cadre">
  <div class="scene-mur" id="scene-mur" aria-label="Mur 32:9, maquette réduite">
    <section class="epoques">
      <div class="epoque epoque-terminal" id="scene1" data-scene="1">
        <header class="bandeau"><h2>${esc(SCENE_1.titre)}</h2><p>Décor stylisé : aucun écran d'époque reproduit. Les faits, eux, sont sourcés.</p></header>
        <div class="ecran-terminal">
          <div class="lignes">${html1}</div>
          <div class="zone-public" id="public-1">
            <p class="filet">── message du public · écrit en 2026, affiché dans le décor de 1976-1986 ──</p>
            <p class="public-texte"></p>
            <p class="public-meta"></p>
          </div>
          <p class="ligne invite fin"><span>RÉSEAU&gt; </span><span class="curseur" aria-hidden="true"></span></p>
          <p class="note-preuve">${esc(SCENE_1.note)}</p>
        </div>
      </div>
      <div class="epoque epoque-web" id="scene2" data-scene="2">
        <header class="bandeau"><h2>${esc(SCENE_2.titre)}</h2><p>Décor stylisé : aucune page d'époque reproduite. Les faits, eux, sont sourcés.</p></header>
        <div class="fenetre">
          <div class="barre-titre"><span>Chronologie 1991-2008 · navigateur</span></div>
          <div class="barre-outils" aria-hidden="true"><span class="relief">Précédent</span><span class="relief">Suivant</span><span class="relief">Recharger</span><span class="adresse">Adresse : décor stylisé</span></div>
          <div class="page">
            <h3 class="nom" data-fait="F-016">Le nom, en 2008 : <span class="morph"></span><span class="curseur-web" aria-hidden="true"></span></h3>
            <p class="chantier"><span>Page en construction</span></p>
            <ul class="liste-faits">${html2}</ul>
            <hr>
            <div class="livre-or" id="public-2">
              <h4>Livre d'or · message du public</h4>
              <p class="public-texte"></p>
              <p class="public-meta"></p>
            </div>
          </div>
          <div class="barre-etat"><span class="etat-texte">Chargement de la page…</span><span class="progression"><span class="remplissage"></span></span></div>
        </div>
      </div>
    </section>
    <aside class="aujourdhui">
      <header><p class="surtitre">Aujourd'hui · 2026 <span class="non-officiel-mur">Proposition non officielle · prototype</span></p><h2>Vos mots arrivent ici</h2></header>
      <div class="cartes-faits">${cartes}</div>
      <div class="fil">
        <h3>Le fil du public <span class="mod">modéré avant affichage</span></h3>
        <ol class="liste-contrib" id="liste-contrib"></ol>
      </div>
      <div class="appel">
        <svg class="qr" viewBox="0 0 29 29" aria-hidden="true" id="qr"></svg>
        <div><p class="appel-titre">Écrivez au mur en 30 secondes</p><p class="appel-note">Maquette de QR (palier 2) : il ne se scanne pas.</p></div>
      </div>
    </aside>
  </div>
</div>
<div class="commandes" role="toolbar" aria-label="Commandes de la démo">
  <button type="button" id="btn-pause" aria-pressed="false">Pause <kbd>espace</kbd></button>
  <button type="button" class="btn-scene" data-aller="scene1" aria-pressed="true">Scène 1 · 1976-1986</button>
  <button type="button" class="btn-scene" data-aller="scene2" aria-pressed="false">Scène 2 · 1991-2008</button>
  <button type="button" id="btn-vue" aria-live="polite">Vue : mur entier</button>
  <a href="?vue=formulaire" target="_blank" rel="noopener" id="lien-form">Formulaire (téléphone)</a>
  <span class="indic" id="indic" role="status"></span>
</div>`,
  }
}

// QR factice, déterministe (ce n'est pas un vrai code).
function dessinerQR(svg) {
  let graine = 7
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647)
  let r = ''
  const oeil = (x, y) => { r += `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" class="b"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>` }
  r += '<rect x="0" y="0" width="29" height="29" class="b"/>'
  for (let y = 2; y < 27; y++) for (let x = 2; x < 27; x++) {
    const dansOeil = (x < 10 && y < 10) || (x > 18 && y < 10) || (x < 10 && y > 18)
    if (!dansOeil && alea() > 0.55) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`
  }
  oeil(2, 2); oeil(20, 2); oeil(2, 20)
  svg.innerHTML = r
}

// ---------- Montage ----------
export function monterMur(app) {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches
  const { lignes1, html } = gabarit()
  app.innerHTML = html
  if (reduit) document.body.classList.add('reduit')

  const mur = document.getElementById('scene-mur')
  const s1 = document.getElementById('scene1')
  const s2 = document.getElementById('scene2')
  const elLignes = [...s1.querySelectorAll('.lignes .ligne')]
  const finInvite = s1.querySelector('.ligne.fin')
  const lis = [...s2.querySelectorAll('.liste-faits li')]
  const morph = s2.querySelector('.morph')
  const remplissage = s2.querySelector('.remplissage')
  const etatTexte = s2.querySelector('.etat-texte')
  const btnPause = document.getElementById('btn-pause')
  const btnsScene = [...document.querySelectorAll('.btn-scene')]
  const indic = document.getElementById('indic')
  dessinerQR(document.getElementById('qr'))

  // Mise à l'échelle du 7680 × 2160 dans la fenêtre.
  // Itération 2 (C-7) : deux vues recadrées pour le portable de démo (1366 px) : les époques (0-5120 px)
  // ou l'interface d'aujourd'hui (5120-7680 px), agrandies 1,5 et 2 fois par rapport au mur entier.
  const VUES = [
    { nom: 'mur', libelle: 'Vue : mur entier', x0: 0, w: LARGEUR },
    { nom: 'epoques', libelle: 'Vue : époques (recadrée)', x0: 0, w: 5120 },
    { nom: 'aujourdhui', libelle: "Vue : aujourd'hui (recadrée)", x0: 5120, w: 2560 },
  ]
  const btnVue = document.getElementById('btn-vue')
  let vue = Math.max(0, VUES.findIndex((v) => v.nom === new URLSearchParams(location.search).get('recadre')))
  let echelle = 1
  const ajuster = () => {
    const v = VUES[vue]
    echelle = Math.min(innerWidth / v.w, innerHeight / HAUTEUR)
    const dx = (LARGEUR / 2 - (v.x0 + v.w / 2)) * echelle
    mur.style.transform = `translate(-50%, -50%) translateX(${dx}px) scale(${echelle})`
    btnVue.textContent = v.libelle
    document.body.dataset.vue = v.nom
  }
  addEventListener('resize', ajuster)
  btnVue.addEventListener('click', () => { vue = (vue + 1) % VUES.length; ajuster() })
  ajuster()

  // ---------- État piloté par le fil de temps ----------
  const longueurs = lignes1.map((l) => l.texte.length)
  const decalages = longueurs.reduce((acc, n, i) => { acc.push(i ? acc[i - 1] + longueurs[i - 1] : 0); return acc }, [])
  const total1 = longueurs.reduce((a, b) => a + b, 0)
  const totalMorph = ANCIEN_NOM.length + NOUVEAU_NOM.length
  const etat = { o1: 1, o2: 0, s1: 0, s2: 0, charge: 0, morph: 0 }

  let sceneCourante = 1
  function rendu() {
    s1.style.opacity = etat.o1
    s2.style.opacity = etat.o2
    s1.style.visibility = etat.o1 < 0.01 ? 'hidden' : 'visible'
    s2.style.visibility = etat.o2 < 0.01 ? 'hidden' : 'visible'
    // Scène 1 : impression au caractère près.
    elLignes.forEach((el, i) => {
      const n = Math.max(0, Math.min(longueurs[i], Math.floor(etat.s1 - decalages[i])))
      const saisie = el.firstElementChild
      const txt = lignes1[i].texte.slice(0, n)
      if (saisie.textContent !== txt) saisie.textContent = txt
      el.classList.toggle('tapee', n >= longueurs[i])
      el.classList.toggle('active', n > 0 && n < longueurs[i])
    })
    finInvite.classList.toggle('visible', etat.s1 >= total1)
    // Scène 2 : la page se charge par blocs, puis le nom change sous les yeux.
    lis.forEach((li, k) => li.classList.toggle('visible', etat.s2 >= k + 1))
    remplissage.style.width = `${Math.round(etat.charge * 100)}%`
    etatTexte.textContent = etat.charge >= 1 ? 'Terminé' : 'Chargement de la page…'
    const m = Math.floor(etat.morph)
    const nom = m <= ANCIEN_NOM.length ? ANCIEN_NOM.slice(0, ANCIEN_NOM.length - m) : NOUVEAU_NOM.slice(0, m - ANCIEN_NOM.length)
    if (morph.textContent !== nom) morph.textContent = nom
    const sc = etat.o2 > 0.5 ? 2 : 1
    if (sc !== sceneCourante) {
      sceneCourante = sc
      btnsScene.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === sc)))
    }
  }

  // ---------- Le fil de temps (anime.js) ----------
  const d = (ms) => (reduit ? 1 : ms)
  // Itération 2 (C-8) : en mouvement réduit, le passage terminal → page reste un fondu de 600 ms,
  // pas une coupe franche (pas de déplacement : seule l'opacité change).
  const FONDU = reduit ? 600 : 1600
  const tl = createTimeline({ loop: true, autoplay: false, onUpdate: rendu })
  tl.label('scene1', 0)
  tl.add(etat, { o1: [1, 1], o2: [0, 0], s1: [0, 0], s2: [0, 0], charge: [0, 0], morph: [0, 0], duration: 1 }, 0)
  let t = reduit ? 2 : 600
  lignes1.forEach((l, i) => {
    const dur = d(Math.round(longueurs[i] / CPS))
    tl.add(etat, { s1: [decalages[i], decalages[i] + longueurs[i]], duration: dur, ease: 'linear' }, t)
    t += dur + (reduit ? 1 : 700)
  })
  tl.label('scene2', DEBUT_SCENE_2)
  // Remise à zéro explicite de la page web juste avant son apparition (la boucle ne la garantit pas).
  tl.add(etat, { s2: [0, 0], charge: [0, 0], morph: [0, 0], duration: 1 }, DEBUT_SCENE_2 - 20)
  tl.add(etat, { o1: [1, 0], o2: [0, 1], duration: FONDU, ease: 'inOutSine' }, DEBUT_SCENE_2)
  tl.add(etat, { s1: [total1, 0], duration: 1 }, DEBUT_SCENE_2 + FONDU + 2)
  tl.add(etat, { charge: [0, 1], duration: d(2800), ease: 'linear' }, DEBUT_SCENE_2 + (reduit ? FONDU + 3 : 1600))
  lis.forEach((_, k) => {
    tl.add(etat, { s2: [k, k + 1], duration: 1 }, DEBUT_SCENE_2 + (reduit ? FONDU + 4 + k : 2000 + k * 1800))
  })
  tl.add(etat, { morph: [0, totalMorph], duration: d(Math.round(totalMorph / CPS * 1.4)), ease: 'linear' }, DEBUT_SCENE_2 + (reduit ? FONDU + 12 : 12500))
  tl.add(etat, { o1: [0, 1], o2: [1, 0], duration: FONDU, ease: 'inOutSine' }, FIN_BOUCLE)
  tl.add(etat, { s2: [lis.length, 0], charge: [1, 0], morph: [totalMorph, 0], duration: 1 }, FIN_BOUCLE + FONDU + 2)

  // ---------- Pause (WCAG 2.2.2) ----------
  let enPause = false
  const actives = new Set()
  let file = [] // contributions approuvées reçues pendant la pause (C-6)
  function majPause() {
    btnPause.innerHTML = enPause ? 'Reprendre <kbd>espace</kbd>' : 'Pause <kbd>espace</kbd>'
    btnPause.setAttribute('aria-pressed', String(enPause))
    document.body.classList.toggle('en-pause', enPause)
    const n = file.length
    indic.textContent = (enPause ? 'En pause. ' : '') + (enPause && n ? `${n} contribution${n > 1 ? 's' : ''} approuvée${n > 1 ? 's' : ''} attend${n > 1 ? 'ent' : ''} la reprise. ` : '') + (reduit ? 'Mouvement réduit : textes affichés d\'un bloc.' : '')
  }
  function basculer() {
    enPause = !enPause
    if (enPause) { tl.pause(); actives.forEach((a) => a.pause()) } else { tl.resume(); actives.forEach((a) => a.play()) }
    majPause()
    if (!enPause) viderFile()
  }
  btnPause.addEventListener('click', basculer)
  addEventListener('keydown', (e) => {
    if (e.code !== 'Space' && e.key !== ' ') return
    const cible = e.target
    if (cible.closest && cible.closest('button, a, input, textarea, select')) return
    e.preventDefault()
    basculer()
  })
  btnsScene.forEach((b) => b.addEventListener('click', () => {
    tl.seek(tl.labels[b.dataset.aller] + (b.dataset.aller === 'scene2' ? FONDU : 0))
    rendu()
  }))
  majPause()

  // ---------- Contributions (Motion) ----------
  const liste = document.getElementById('liste-contrib')
  const contributions = []
  // Itération 2 (C-1) : chaque voyage en cours est gardé par identifiant pour pouvoir l'annuler au retrait.
  const voyages = new Map()

  function carte(c) {
    const li = document.createElement('li')
    li.className = 'carte-contrib'
    li.dataset.id = c.id
    li.dataset.simule = c.simule
    const badge = c.simule === 'exemple' ? 'Exemple simulé' : 'Contribution de démo, simulée · effacée après la démo'
    li.innerHTML = `<p class="genre">${esc(c.genre)}</p><p class="texte">« ${esc(c.texte)} »</p><p class="meta"><span class="sign">${esc(c.signature || 'un visiteur')}</span><span class="badge">${badge}</span></p>`
    return li
  }

  function remplirCreneaux(c) {
    for (const [id, decor] of [['public-1', '1976-1986'], ['public-2', 'du Web des débuts']]) {
      const z = document.getElementById(id)
      z.querySelector('.public-texte').textContent = c ? `« ${c.texte} »` : 'à écrire'
      z.querySelector('.public-meta').textContent = c
        ? `— ${c.signature || 'un visiteur'} · ${c.genre} · ${c.simule === 'exemple' ? 'exemple simulé' : 'contribution de démo, simulée'} · écrit en 2026, décor ${decor}`
        : ''
      z.dataset.contribution = c ? c.id : ''
    }
  }

  function suivre(anim) {
    actives.add(anim)
    if (enPause) anim.pause()
    anim.finished.then(() => actives.delete(anim), () => actives.delete(anim))
    return anim
  }

  // Coordonnées dans le repère du mur (7680 × 2160), quelle que soit l'échelle.
  function rectMur(el) {
    const m = mur.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return { x: (r.left - m.left) / echelle, y: (r.top - m.top) / echelle, w: r.width / echelle, h: r.height / echelle }
  }

  function ajouter(c, { anime = true } = {}) {
    contributions.unshift(c)
    const nouvelles = carte(c)
    const avant = new Map([...liste.children].map((el) => [el, rectMur(el)]))
    liste.prepend(nouvelles)
    while (liste.children.length > 4) liste.lastElementChild.remove()
    if (!anime || reduit) { remplirCreneaux(c); return }

    // 1. FLIP à ressort : les cartes existantes glissent depuis leur ancienne place.
    for (const [el, r0] of avant) {
      if (!el.isConnected) continue
      const dy = r0.y - rectMur(el).y
      suivre(animate(el, { y: [dy, 0] }, { type: 'spring', stiffness: 120, damping: 18 }))
    }
    suivre(animate(nouvelles, { opacity: [0, 1], y: [-80, 0], scale: [0.96, 1] }, { type: 'spring', stiffness: 140, damping: 16 }))

    // 2. La phrase quitte l'interface d'aujourd'hui et se reformate dans le décor de l'époque affichée.
    const zone = document.getElementById(sceneCourante === 2 ? 'public-2' : 'public-1')
    const cible = zone.querySelector('.public-texte')
    const source = nouvelles.querySelector('.texte')
    const meta = zone.querySelector('.public-meta')
    const ancienTexte = cible.textContent
    const ancienneMeta = meta.textContent
    remplirCreneaux(c)
    // On garde l'ancien contenu visible dans la zone d'arrivée jusqu'à l'atterrissage.
    const nouveauTexte = cible.textContent
    const nouvelleMeta = meta.textContent
    cible.textContent = ancienTexte
    meta.textContent = ancienneMeta

    const r0 = rectMur(source)
    const voyageur = document.createElement('div')
    voyageur.className = 'voyageur'
    voyageur.setAttribute('aria-hidden', 'true')
    voyageur.textContent = source.textContent
    voyageur.style.width = `${r0.w}px`
    mur.appendChild(voyageur)
    const r1 = rectMur(cible)
    const voyage = { annule: false, voyageur, cible, anims: [] }
    voyages.set(c.id, voyage)
    const seq = suivre(animate([
      [voyageur, { x: [r0.x, r0.x], y: [r0.y, r0.y], opacity: [0, 1] }, { duration: 0.3, at: 1.4 }],
      [voyageur, { x: [r0.x, r1.x], y: [r0.y, r1.y], width: [r0.w, Math.min(r1.w, 4200)] }, { type: 'spring', stiffness: 40, damping: 14, at: 2.0 }],
      [cible, { opacity: [1, 0] }, { duration: 0.4, at: '<' }],
    ]))
    voyage.anims.push(seq)
    seq.finished.then(() => {
      if (voyage.annule) return
      cible.textContent = nouveauTexte
      meta.textContent = nouvelleMeta
      zone.classList.add('recue')
      const fin = suivre(animate([
        [voyageur, { opacity: [1, 0] }, { duration: 0.6 }],
        [cible, { opacity: [0, 1] }, { duration: 0.6, at: '<' }],
      ]))
      voyage.anims.push(fin)
      fin.finished.then(() => { voyageur.remove(); voyages.delete(c.id) })
    })
  }

  function retirer(id) {
    // Une phrase encore en file d'attente (pause) est simplement oubliée (C-6).
    const j = file.findIndex((m) => String(m.id) === id)
    if (j >= 0) { file.splice(j, 1); majPause() }
    // Un voyage en cours est arrêté, sans écrire la phrase dans le décor (C-1).
    const v = voyages.get(id)
    if (v) {
      v.annule = true
      v.anims.forEach((a) => { a.stop(); actives.delete(a) })
      v.voyageur.remove()
      v.cible.style.opacity = 1
      voyages.delete(id)
    }
    const i = contributions.findIndex((c) => c.id === id)
    if (i < 0) return
    contributions.splice(i, 1)
    liste.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove()
    // Afficher la plus récente qui reste dans les décors.
    remplirCreneaux(contributions[0])
    document.querySelectorAll('.zone-public, .livre-or').forEach((z) => z.querySelector('.public-texte').style.opacity = 1)
  }

  ;[...EXEMPLES_SIMULES].reverse().forEach((c) => ajouter(c, { anime: false }))

  // Itération 2 (C-6) : une contribution reçue pendant la pause attend la reprise ; le mur reste figé.
  // Un retrait, lui, s'applique tout de suite, même en pause : retirer prime sur figer.
  function recevoirAjout(msg) {
    ajouter({ id: String(msg.id), genre: String(msg.genre).slice(0, 60), texte: msg.texte.slice(0, 140), signature: String(msg.signature || '').slice(0, 30), simule: 'demo' })
  }
  function viderFile() {
    const a = file
    file = []
    majPause()
    a.forEach(recevoirAjout)
  }

  ouvrirCanal((msg) => {
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'ajout' && typeof msg.texte === 'string') {
      if (enPause) { file.push(msg); majPause(); return }
      recevoirAjout(msg)
    } else if (msg.type === 'retrait') {
      retirer(String(msg.id))
    }
  })

  rendu()
  tl.play()
  if (reduit) indic.textContent = 'Mouvement réduit : textes affichés d\'un bloc.'
  window.__murC = { tl, etat, file: () => file.length, contributions: () => contributions.map((c) => c.id) } // pour les captures
}

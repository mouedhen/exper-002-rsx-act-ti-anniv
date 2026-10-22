// Le mur 32:9 (conçu pour 7680 × 2160), mis à l'échelle dans la fenêtre.
// Combinaison : les décors d'époque de C (écran à caractères, page web) + un 3e décor, l'interface du futur ;
// l'année choisie par le visiteur (B) décide du décor où sa phrase s'imprime ; formulaire de A ; clôture de B.
//
// anime.js 4.5.0 : un fil de temps par décor (impression au caractère, chargement de page, horizon qui se trace,
//   tête de lecture qui balaie 2027-2046) ; le vol lettre par lettre de la phrase vers son année (trajectoires
//   calculées à l'exécution pour chaque caractère, décalées par stagger) ; le trait tiré vers le point (createDrawable).
// Motion 14.0.0 : la carte du fil d'aujourd'hui (FLIP à ressort), le voyage d'une carte vers un décor du passé,
//   la naissance du point sur l'horizon (ressort interruptible).
import { createTimeline, createTimer, animate as animeA, stagger, svg } from 'animejs'
import { animate as animeM } from 'motion'
import { SCENE_1, SCENE_2, SCENE_3, AUJOURD_HUI, CATEGORIES, DECORS, decorDe, EXEMPLES, exemplesCharges } from './donnees.js'
import { ouvrirCanal } from './canal.js'

const LARGEUR = 7680
const HAUTEUR = 2160
const CPS = 0.04 // caractères par milliseconde (40 par seconde)
const DUREE_SCENE = 24000
const TENUE_ARRIVEE = 14000
const TENUE_FIL = 8000 // N-1 (itération 3) : durée du passage au fil « Aujourd'hui » pour un souvenir de 2009-2025
const ANCIEN_NOM = "Fédération de l'informatique du Québec"
const NOUVEAU_NOM = 'Réseau ACTION TI'
// Décor 3 : géométrie de l'horizon, dans le repère de la zone .futur (5120 × 1910).
const H_X0 = 1880
const H_X1 = 4860
const H_Y = 1430
const xAn = (an) => H_X0 + ((an - 2027) * (H_X1 - H_X0)) / 19
const PAS_PILE = 58

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const params = new URLSearchParams(location.search)

// ---------- Libellés d'une contribution ----------
export function libelle(c) {
  if (c.texte) return `« ${c.texte} »`
  return `${CATEGORIES[c.cat]?.fr || ''} · ${c.type === 'souvenir' ? `souvenir de ${c.an}` : `pour ${c.an}`}`
}
const badge = (c) => (c.simule === 'exemple' ? 'exemple simulé' : 'contribution de démo, simulée')
function metaDe(c) {
  const quoi = c.type === 'souvenir' ? `Souvenir de ${c.an} · témoignage, pas un fait` : `Souhait pour ${c.an}`
  return `— un visiteur · ${quoi} · ${CATEGORIES[c.cat]?.fr || ''} · ${badge(c)} · écrit en 2026`
}

// ---------- Gabarit ----------
const ligneTerminal = (f) => `${f.date.padEnd(17, ' ')}${f.enonce}`

function gabarit(contenu) {
  const lignes1 = [
    { invite: true, texte: 'RÉSEAU> afficher --époque 1976-1990' },
    ...SCENE_1.faits.map((f) => ({ fait: f, texte: ligneTerminal(f) })),
  ]
  const html1 = lignes1.map((l, i) => l.invite
    ? `<p class="ligne invite" data-i="${i}"><span class="saisie" aria-hidden="true"></span><span class="sr">${esc(l.texte)}</span></p>`
    : `<p class="ligne fait" data-i="${i}" data-fait="${l.fait.id}"><span class="saisie" aria-hidden="true"></span><span class="sr">${esc(l.fait.date)} : ${esc(l.fait.enonce)}</span><span class="src">${l.fait.id} · ${esc(l.fait.sources)}</span></p>`).join('')

  const html2 = SCENE_2.faits.map((f, k) =>
    `<li data-fait="${f.id}" data-k="${k + 1}"><b>${esc(f.date)}</b> — ${esc(f.enonce)} <span class="lien">[${f.id} · ${esc(f.sources)}]</span></li>`).join('')

  const html3 = SCENE_3.faits.map((f, k) =>
    `<article class="carte-futur" data-fait="${f.id}" data-k="${k}"><p class="date">Écrit en ${esc(f.date)}</p><p class="enonce">${esc(f.enonce)}</p><p class="src">${f.id} · ${esc(f.sources)}</p></article>`).join('')

  let graduations = ''
  for (let an = 2027; an <= 2046; an++) {
    const x = xAn(an)
    graduations += `<line class="grad" x1="${x}" y1="${H_Y - 18}" x2="${x}" y2="${H_Y + 18}"/><text class="an-grad" data-an="${an}" x="${x}" y="${H_Y + 92}" text-anchor="middle">${an}</text>`
  }
  const h = SCENE_3.horizon

  const cartes = AUJOURD_HUI.map((f) =>
    `<article class="carte-fait" data-fait="${f.id}"><p class="date">${esc(f.date)}</p><p class="enonce">${esc(f.enonce)}</p><p class="src">${f.id} · ${esc(f.sources)}</p></article>`).join('')

  const pastille = contenu === 'charge'
    ? '<span class="pastille-contenu">Mur chargé : 80 souhaits, exemple simulé</span>'
    : contenu === 'vide' ? '<span class="pastille-contenu">Matin du 18 novembre : aucune contribution</span>' : ''

  return {
    lignes1,
    html: `
<div class="cadre">
  <div class="scene-mur" id="scene-mur" data-contenu="${contenu}" aria-label="Mur 32:9, maquette réduite">
    <section class="epoques">
      <div class="epoque epoque-terminal" id="scene1" data-scene="1">
        <header class="bandeau"><h2>${esc(SCENE_1.titre)}</h2><p>Décor stylisé : aucun écran d'époque reproduit. Les faits, eux, sont sourcés.</p></header>
        <div class="ecran-terminal">
          <div class="lignes">${html1}</div>
          <div class="zone-public" id="public-1" data-decor="1">
            <p class="filet">── message du public · écrit en 2026, imprimé dans le décor de son année ──</p>
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
            <div class="livre-or zone-public" id="public-2" data-decor="2">
              <h4>Livre d'or · souvenirs du public</h4>
              <p class="public-texte"></p>
              <p class="public-meta"></p>
            </div>
          </div>
          <div class="barre-etat"><span class="etat-texte">Chargement de la page…</span><span class="progression"><span class="remplissage"></span></span></div>
        </div>
      </div>
      <div class="epoque epoque-futur" id="scene3" data-scene="3">
        <header class="bandeau"><h2>${esc(SCENE_3.titre)}</h2><p>Décor stylisé du futur : aucune interface réelle imitée. Les faits, eux, sont sourcés.</p></header>
        <div class="futur" id="futur">
          <section class="futur-hier" aria-labelledby="futur-hier-t">
            <h3 id="futur-hier-t">Ce que le Réseau a écrit pour la suite</h3>
            ${html3}
          </section>
          <div class="zone-public public-futur" id="public-3" data-decor="3">
            <p class="filet">Souhait du public · écrit en 2026, posé à son année</p>
            <p class="public-texte"></p>
            <p class="public-meta"></p>
          </div>
          <svg class="horizon" viewBox="0 0 5120 1910" width="5120" height="1910" aria-hidden="true">
            <line id="horizon-ligne" class="horizon-ligne" x1="${H_X0 - 60}" y1="${H_Y}" x2="${H_X1 + 60}" y2="${H_Y}"/>
            <g class="graduations">${graduations}</g>
            <line id="tete" class="tete" x1="${H_X0}" y1="700" x2="${H_X0}" y2="${H_Y}"/>
            <line id="repere-2035-trait" class="repere-trait" x1="${xAn(2035)}" y1="${H_Y + 120}" x2="${xAn(2035)}" y2="${H_Y + 190}"/>
            <path id="lien-point" class="lien-point" d="M0 0"/>
          </svg>
          <p class="tete-annee" id="tete-annee" data-compteur="tete">2027</p>
          <div class="points" id="points"></div>
          <p class="repere-2035" data-fait="${h.id}" style="left:${xAn(2035) - 1500}px"><b>Horizon 2035</b> · ${esc(h.date)} : ${esc(h.enonce)} <span class="src">${h.id} · ${esc(h.sources)}</span></p>
          <p class="legende"><span class="rond-vide"></span> exemple simulé <span class="rond-plein"></span> contribution de démo, simulée · un point par souhait, posé à son année</p>
        </div>
      </div>
    </section>
    <aside class="aujourdhui">
      <header><p class="surtitre">Aujourd'hui · 2026 <span class="non-officiel-mur">Proposition non officielle · prototype</span></p><h2>Vos mots arrivent ici, puis partent vers leur année (2009-2025 : ils restent ici)</h2>${pastille}</header>
      <div class="cartes-faits">${cartes}</div>
      <div class="fil">
        <h3>Le fil du public <span class="mod">modéré avant affichage</span></h3>
        <ol class="liste-contrib" id="liste-contrib"></ol>
        <p class="plus" id="plus" data-compteur="plus" hidden></p>
      </div>
      <div class="appel">
        <svg class="qr" viewBox="0 0 29 29" aria-hidden="true" id="qr"></svg>
        <div><p class="appel-titre">Un souvenir de 1985 ? Un souhait pour 2040 ? Écrivez-le.</p><p class="appel-note">Votre année choisit le décor. Maquette de QR : il ne se scanne pas.</p></div>
      </div>
    </aside>
  </div>
</div>
<div class="commandes" role="toolbar" aria-label="Commandes de la démo">
  <button type="button" id="btn-pause" aria-pressed="false">Pause <kbd>espace</kbd></button>
  <button type="button" class="btn-scene" data-aller="1" aria-pressed="true">1976-1990</button>
  <button type="button" class="btn-scene" data-aller="2" aria-pressed="false">1991-2008</button>
  <button type="button" class="btn-scene" data-aller="3" aria-pressed="false">2027-2046</button>
  <button type="button" id="btn-vue">Vue : mur entier</button>
  <span class="groupe-contenu">Contenu :
    <a href="?contenu=exemples" data-contenu="exemples">2 exemples</a>
    <a href="?contenu=vide" data-contenu="vide">matin vide</a>
    <a href="?contenu=charge" data-contenu="charge">80 simulées</a>
  </span>
  <a href="?vue=formulaire" target="_blank" rel="noopener" id="lien-form">Formulaire (téléphone)</a>
  <button type="button" id="btn-cloture">Ce que ça demande au Réseau</button>
  <span class="indic" id="indic" role="status"></span>
  <span class="mention-commandes">Proposition non officielle · prototype</span>
</div>
<div id="cloture" class="cloture" role="dialog" aria-modal="true" aria-labelledby="cloture-t" hidden>
  <div class="cloture-boite">
    <p class="mention-cloture">Proposition non officielle · prototype</p>
    <h2 id="cloture-t">Ce que ça demande au Réseau</h2>
    <p>Après la boucle, jamais pendant. Repris du concept B et du brief 0.3.4.</p>
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
    <p class="cloture-note">Propre à cette combinaison : trois décors à concevoir et à tester, dont un décor du futur ; une page de modération qui voit l'année et le décor de chaque phrase.</p>
    <button type="button" id="fermer-cloture">Fermer</button>
  </div>
</div>`,
  }
}

// QR factice, déterministe (ce n'est pas un vrai code).
function dessinerQR(el) {
  let graine = 7
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647)
  let r = '<rect x="0" y="0" width="29" height="29" class="b"/>'
  const oeil = (x, y) => { r += `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" class="b"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>` }
  for (let y = 2; y < 27; y++) for (let x = 2; x < 27; x++) {
    const dansOeil = (x < 10 && y < 10) || (x > 18 && y < 10) || (x < 10 && y > 18)
    if (!dansOeil && alea() > 0.55) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`
  }
  oeil(2, 2); oeil(20, 2); oeil(2, 20)
  el.innerHTML = r
}

// ---------- Montage ----------
export function monterMur(app) {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches
  const contenu = ['vide', 'charge'].includes(params.get('contenu')) ? params.get('contenu') : 'exemples'
  const { lignes1, html } = gabarit(contenu)
  app.innerHTML = html
  if (reduit) document.body.classList.add('reduit')
  document.querySelectorAll('.groupe-contenu a').forEach((a) => a.setAttribute('aria-current', String(a.dataset.contenu === contenu)))

  const mur = document.getElementById('scene-mur')
  const scenes = { 1: document.getElementById('scene1'), 2: document.getElementById('scene2'), 3: document.getElementById('scene3') }
  const zones = { 1: document.getElementById('public-1'), 2: document.getElementById('public-2'), 3: document.getElementById('public-3') }
  const btnPause = document.getElementById('btn-pause')
  const btnsScene = [...document.querySelectorAll('.btn-scene')]
  const indic = document.getElementById('indic')
  const liste = document.getElementById('liste-contrib')
  const plus = document.getElementById('plus')
  const pointsEl = document.getElementById('points')
  dessinerQR(document.getElementById('qr'))

  // ---------- Mise à l'échelle et vues recadrées (portable de démo, 1366 px) ----------
  const VUES = [
    { nom: 'mur', libelle: 'Vue : mur entier', x0: 0, w: LARGEUR },
    { nom: 'epoques', libelle: 'Vue : décors (recadrée)', x0: 0, w: 5120 },
    { nom: 'aujourdhui', libelle: "Vue : aujourd'hui (recadrée)", x0: 5120, w: 2560 },
  ]
  const btnVue = document.getElementById('btn-vue')
  const demandee = VUES.findIndex((v) => v.nom === params.get('recadre'))
  // Sans paramètre, un écran étroit (portable de démo) s'ouvre recadré sur les décors.
  let vue = demandee >= 0 ? demandee : innerWidth < 1700 ? 1 : 0
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
  // N-1 (itération 3) : vue choisie avant un passage automatique au fil « Aujourd'hui » (null : aucun passage en cours).
  let vueAvantFil = null
  btnVue.addEventListener('click', () => { vueAvantFil = null; vue = (vue + 1) % VUES.length; ajuster() })
  ajuster()

  // ---------- Registre des animations : la pause arrête tout (WCAG 2.2.2) ----------
  let enPause = false
  const actives = new Map()
  function suivreA(a) {
    actives.set(a, { pause: () => a.pause(), reprendre: () => a.resume() })
    if (enPause) a.pause()
    a.then(() => actives.delete(a))
    return a
  }
  function suivreM(a) {
    actives.set(a, { pause: () => a.pause(), reprendre: () => a.play() })
    if (enPause) a.pause()
    a.finished.then(() => actives.delete(a), () => actives.delete(a))
    return a
  }
  function arreter(a) {
    if (!a) return
    actives.delete(a)
    try { if (a.finished) a.stop(); else a.cancel() } catch { /* déjà fini */ }
  }
  const fini = (a) => (a.finished ? a.finished.catch(() => {}) : new Promise((r) => a.then(() => r())))
  const attendre = (ms) => new Promise((r) => suivreA(createTimer({ duration: ms, onComplete: () => r() })))

  // ---------- Décor 1 : l'écran à caractères (rendu piloté par un état) ----------
  const s1 = scenes[1]
  const elLignes = [...s1.querySelectorAll('.lignes .ligne')]
  const finInvite = s1.querySelector('.ligne.fin')
  const longueurs = lignes1.map((l) => l.texte.length)
  const decalages = longueurs.reduce((acc, n, i) => { acc.push(i ? acc[i - 1] + longueurs[i - 1] : 0); return acc }, [])
  const total1 = longueurs.reduce((a, b) => a + b, 0)
  const e1 = { s1: 0 }
  function rendu1() {
    elLignes.forEach((el, i) => {
      const n = Math.max(0, Math.min(longueurs[i], Math.floor(e1.s1 - decalages[i])))
      const saisie = el.firstElementChild
      const txt = lignes1[i].texte.slice(0, n)
      if (saisie.textContent !== txt) saisie.textContent = txt
      el.classList.toggle('tapee', n >= longueurs[i])
      el.classList.toggle('active', n > 0 && n < longueurs[i])
    })
    finInvite.classList.toggle('visible', e1.s1 >= total1)
  }

  // ---------- Décor 2 : la page web ----------
  const s2 = scenes[2]
  const lis = [...s2.querySelectorAll('.liste-faits li')]
  const morph = s2.querySelector('.morph')
  const remplissage = s2.querySelector('.remplissage')
  const etatTexte = s2.querySelector('.etat-texte')
  const totalMorph = ANCIEN_NOM.length + NOUVEAU_NOM.length
  const e2 = { s2: 0, charge: 0, morph: 0 }
  function rendu2() {
    lis.forEach((li, k) => li.classList.toggle('visible', e2.s2 >= k + 1))
    remplissage.style.width = `${Math.round(e2.charge * 100)}%`
    etatTexte.textContent = e2.charge >= 1 ? 'Terminé' : 'Chargement de la page…'
    const m = Math.floor(e2.morph)
    const nom = m <= ANCIEN_NOM.length ? ANCIEN_NOM.slice(0, ANCIEN_NOM.length - m) : NOUVEAU_NOM.slice(0, m - ANCIEN_NOM.length)
    if (morph.textContent !== nom) morph.textContent = nom
  }

  // ---------- Décor 3 : l'interface du futur ----------
  const ligneHorizon = document.getElementById('horizon-ligne')
  const longueurHorizon = H_X1 - H_X0 + 120
  ligneHorizon.style.strokeDasharray = `${longueurHorizon}`
  const cartesFutur = [...scenes[3].querySelectorAll('.carte-futur')]
  const grads = [...scenes[3].querySelectorAll('.an-grad')]
  const tete = document.getElementById('tete')
  const teteAnnee = document.getElementById('tete-annee')
  const e3 = { trace: 0, cartes: 0, p: 0 }
  let anTete = -1
  let teteGelee = false // m-2 : pendant un achèvement forcé, le compteur est masqué puis posé une seule fois
  function rendu3() {
    ligneHorizon.style.strokeDashoffset = `${longueurHorizon * (1 - e3.trace)}`
    cartesFutur.forEach((c, k) => {
      const o = Math.max(0, Math.min(1, e3.cartes - k))
      c.style.opacity = o
      c.style.transform = reduit ? '' : `translateY(${(1 - o) * 60}px)`
    })
    const x = xAn(2027 + e3.p)
    tete.setAttribute('x1', x); tete.setAttribute('x2', x)
    teteAnnee.style.left = `${x - 150}px`
    // Compteur de la tête de lecture : un pas toutes les 600 ms au plus (WCAG 2.3.1 : 2 changements par seconde au plus).
    const an = 2027 + Math.round(e3.p)
    if (an !== anTete && !teteGelee) {
      anTete = an
      teteAnnee.textContent = String(an)
      grads.forEach((g) => g.classList.toggle('passe', Number(g.dataset.an) <= an))
      pointsEl.querySelectorAll('.point').forEach((p) => p.classList.toggle('eclaire', Number(p.dataset.an) <= an))
    }
  }

  // ---------- Fils de temps des décors (anime.js) ----------
  // M-2 et M-3 (itération 2) : onUpdate ne voit pas la dernière image d'un fil de temps. L'état final de chaque
  // décor est donc posé explicitement (achever), à la fin du fil (onComplete), lors d'un achèvement forcé par une
  // arrivée, et d'emblée en mouvement réduit, sans fil de temps.
  const RENDUS = { 1: rendu1, 2: rendu2, 3: rendu3 }
  const FINAUX = {
    1: () => { e1.s1 = total1 },
    2: () => { e2.s2 = lis.length; e2.charge = 1; e2.morph = totalMorph },
    3: () => { e3.trace = 1; e3.cartes = cartesFutur.length; e3.p = 19 },
  }
  function achever(n) { FINAUX[n](); RENDUS[n]() }
  const FONDU = reduit ? 600 : 1600 // en mouvement réduit, un fondu court plutôt qu'une coupe franche
  function intro(n) {
    if (n === 1) {
      const tl = createTimeline({ autoplay: false, onUpdate: rendu1, onComplete: () => achever(1) })
      tl.add(e1, { s1: [0, 0], duration: 1 }, 0)
      let t = 600
      lignes1.forEach((l, i) => {
        const dur = Math.round(longueurs[i] / CPS)
        tl.add(e1, { s1: [decalages[i], decalages[i] + longueurs[i]], duration: dur, ease: 'linear' }, t)
        t += dur + 700
      })
      return tl
    }
    if (n === 2) {
      const tl = createTimeline({ autoplay: false, onUpdate: rendu2, onComplete: () => achever(2) })
      tl.add(e2, { s2: [0, 0], charge: [0, 0], morph: [0, 0], duration: 1 }, 0)
      tl.add(e2, { charge: [0, 1], duration: 2800, ease: 'linear' }, 300)
      lis.forEach((_, k) => tl.add(e2, { s2: [k, k + 1], duration: 1 }, 700 + k * 1800))
      tl.add(e2, { morph: [0, totalMorph], duration: Math.round((totalMorph / CPS) * 1.4), ease: 'linear' }, 10500)
      return tl
    }
    const tl = createTimeline({ autoplay: false, onUpdate: rendu3, onComplete: () => achever(3) })
    tl.add(e3, { trace: [0, 0], cartes: [0, 0], p: [0, 0], duration: 1 }, 0)
    tl.add(e3, { trace: [0, 1], duration: 1800, ease: 'inOutSine' }, 200)
    tl.add(e3, { cartes: [0, 3], duration: 2400, ease: 'linear' }, 900)
    // La tête de lecture balaie les 20 années à venir, à 600 ms par année.
    tl.add(e3, { p: [0, 19], duration: 19 * 600, ease: 'linear' }, 2400)
    return tl
  }

  // ---------- Le réalisateur : quel décor est affiché, et quand il change ----------
  const opac = { o1: 1, o2: 0, o3: 0 }
  function renduOpac() {
    for (const k of [1, 2, 3]) {
      scenes[k].style.opacity = opac['o' + k]
      scenes[k].style.visibility = opac['o' + k] < 0.01 ? 'hidden' : 'visible'
    }
  }
  let sceneActive = 1
  const intros = {}
  let minuteur = null
  let fondu = null
  let finFondu = -Infinity
  let fonduEnCours = false
  // M-1 (itération 2) : la rotation se replanifie à chaque changement ; les trois décors tournent en boucle.
  function planifier(ms) {
    arreter(minuteur)
    minuteur = suivreA(createTimer({ duration: ms, onComplete: () => { allerScene((sceneActive % 3) + 1); planifier(DUREE_SCENE) } }))
  }
  // m-4 (itération 2) : un changement de décor attend la fin du fondu en cours, puis 1 s de décor stable.
  async function attendreFondu() {
    while (fonduEnCours) await attendre(50)
    const reste = 1000 - (performance.now() - finFondu)
    if (reste > 0) await attendre(reste)
  }
  // N-1 (itération 3) : une coupe de cadre est un changement brusque ; elle attend la garde et la réarme.
  async function couperVue(n) {
    await attendreFondu()
    if (vueAvantFil === null) vueAvantFil = vue
    vue = n
    ajuster()
    finFondu = performance.now()
  }
  let jetonFil = 0 // le dernier souvenir de 2009-2025 arrivé décide du retour
  async function revenirVue() {
    if (vueAvantFil === null) return
    const retour = vueAvantFil
    await attendreFondu()
    if (vueAvantFil === null) return // l'opérateur a changé de vue entre-temps
    vueAvantFil = null
    vue = retour
    ajuster()
    finFondu = performance.now()
  }
  // m-2 (itération 2) : quand une arrivée achève le décor 3 en plein balayage, le compteur de la tête s'efface,
  // l'année finale est posée pendant qu'il est invisible, puis il revient.
  function masquerTete() {
    teteGelee = true
    teteAnnee.classList.add('masquee')
    suivreA(createTimer({ duration: 700, onComplete: () => { teteGelee = false; rendu3(); teteAnnee.classList.remove('masquee') } }))
  }
  function demarrerIntro(n, finir) {
    const enCours = intros[n]
    arreter(intros[n])
    intros[n] = null
    if (finir || reduit) {
      if (n === 3 && finir && enCours && !reduit) masquerTete()
      achever(n)
      return
    }
    const tl = intro(n)
    intros[n] = tl
    if (!enPause) tl.play()
    suivreA(tl)
  }
  // finir : pour une arrivée, le décor s'affiche déjà complet (le visiteur attend sa phrase, pas l'introduction).
  function allerScene(n, { finir = false } = {}) {
    if (n === sceneActive && opac['o' + n] > 0.99) {
      if (finir && (intros[n] || reduit)) demarrerIntro(n, true)
      return Promise.resolve()
    }
    const ancienne = sceneActive
    sceneActive = n
    document.body.dataset.scene = String(n)
    btnsScene.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.aller) === n)))
    demarrerIntro(n, finir)
    arreter(fondu)
    fonduEnCours = true
    fondu = suivreA(animeA(opac, {
      o1: n === 1 ? 1 : 0, o2: n === 2 ? 1 : 0, o3: n === 3 ? 1 : 0,
      duration: FONDU, ease: 'inOutSine', onUpdate: renduOpac,
      onComplete: () => { fonduEnCours = false; finFondu = performance.now(); if (ancienne !== n) arreter(intros[ancienne]) },
    }))
    return fini(fondu)
  }

  // ---------- Contributions ----------
  const contributions = [] // la plus récente en tête
  const voyages = new Map() // arrivées en cours, par identifiant
  let vedette3 = null

  function contribPour(k) {
    const posees = contributions.filter((c) => c.posee && decorDe(c.an) === k)
    if (k === 3 && vedette3) { const v = posees.find((c) => c.id === vedette3); if (v) return v }
    return posees[0]
  }
  const ATTENTE = {
    1: ['en attente d’un vrai souvenir de 1976 à 1990', 'Le premier souvenir de ces années s’imprimera ici, dans le décor de son année.'],
    2: ['Le livre d’or attend un vrai souvenir de 1991 à 2008.', 'Un souvenir vécu par vous, signé « un visiteur ».'],
    3: ['20 années à écrire. Le premier souhait de la journée s’inscrira ici, à son année.', 'Choisissez une année entre 2027 et 2046 : votre phrase y devient un point.'],
  }
  function rendreZone(k) {
    if ([...voyages.values()].some((v) => v.k === k && v.zoneVerrouillee)) return
    const z = zones[k]
    const c = contribPour(k)
    z.dataset.contribution = c ? c.id : ''
    z.classList.toggle('attente', !c)
    const t = z.querySelector('.public-texte')
    t.textContent = c ? libelle(c) : ATTENTE[k][0]
    t.style.opacity = ''
    t.style.visibility = ''
    t.classList.remove('frappe')
    const m = z.querySelector('.public-meta')
    m.textContent = c ? metaDe(c) : ATTENTE[k][1]
    m.style.opacity = ''
  }
  const rendreZones = () => [1, 2, 3].forEach(rendreZone)

  function rendrePoints() {
    const parAn = {}
    pointsEl.innerHTML = ''
    const futurs = contributions.filter((c) => c.posee && decorDe(c.an) === 3).slice().reverse()
    const vedette = contribPour(3)
    for (const c of futurs) {
      const i = (parAn[c.an] = (parAn[c.an] ?? -1) + 1)
      const p = document.createElement('span')
      p.className = 'point'
      p.dataset.id = c.id
      p.dataset.an = c.an
      p.dataset.simule = c.simule
      p.title = `${libelle(c)} · ${badge(c)}`
      p.style.left = `${xAn(c.an) - 22}px`
      p.style.top = `${H_Y - 70 - i * PAS_PILE}px`
      if (vedette && vedette.id === c.id) p.classList.add('vedette')
      if (c.an <= anTete) p.classList.add('eclaire')
      pointsEl.appendChild(p)
    }
  }

  function carte(c) {
    const li = document.createElement('li')
    li.className = 'carte-contrib'
    li.dataset.id = c.id
    li.dataset.simule = c.simule
    const k = decorDe(c.an)
    const vers = c.type === 'souvenir' ? `Souvenir de ${c.an}` : `Souhait pour ${c.an}`
    if (k === 0) li.classList.add('sans-decor')
    const dest = k === 0 ? 'reste au fil : pas de décor pour 2009-2025 dans le prototype' : `décor : ${DECORS[k].nom}`
    li.innerHTML = `<p class="genre">${k === 0 ? `<span class="an-carte">${c.an}</span>` : ''}${vers} → ${dest}</p><p class="texte"></p><p class="meta"><span class="cat">${esc(CATEGORIES[c.cat]?.fr || '')}</span><span class="badge">${c.simule === 'exemple' ? 'Exemple simulé' : 'Contribution de démo, simulée · effacée après la démo'}</span></p>`
    li.querySelector('.texte').textContent = libelle(c) // un seul nœud texte : le vol lettre par lettre le mesure
    return li
  }
  function rendreFil() {
    liste.innerHTML = ''
    if (!contributions.length) {
      const li = document.createElement('li')
      li.className = 'fil-vide'
      li.innerHTML = '<p class="fil-vide-titre">Personne n’a encore écrit aujourd’hui.</p><p>Votre phrase sera la première du mur : un souvenir s’imprime dans son époque, un souhait se pose sur l’horizon 2027-2046.</p>'
      liste.appendChild(li)
    }
    contributions.slice(0, 3).forEach((c) => liste.appendChild(carte(c)))
    tailler()
    majPlus()
  }
  // Le fil ne garde que les cartes qui tiennent entières (mur chargé : textes longs).
  function tailler() {
    while (liste.querySelectorAll('.carte-contrib').length > 1 && liste.scrollHeight > liste.clientHeight + 1) liste.lastElementChild.remove()
  }
  function majPlus() {
    const affichees = liste.querySelectorAll('.carte-contrib').length
    const restes = contributions.slice(affichees)
    const n = restes.length
    plus.hidden = n <= 0
    // N-2 (itération 3) : un souvenir de 2009-2025 sorti du fil n'est sur aucun décor ; il est compté à part, « au fil ».
    const auMurL = restes.filter((c) => decorDe(c.an) !== 0)
    const auMur = auMurL.length
    const auFil = n - auMur
    const tous = auMurL.every((c) => c.simule === 'exemple')
    const genre = tous ? (auMur > 1 ? 'exemples simulés' : 'exemple simulé') : 'dont des exemples simulés'
    const s = (k) => (k > 1 ? 's' : '')
    const txtMur = auMur > 0 ? `et ${auMur} autre${s(auMur)} phrase${s(auMur)} au mur (${auMurL.some((c) => c.simule === 'exemple') ? genre : 'contributions de démo, simulées'})` : ''
    const txtFil = auFil > 0 ? `${auMur > 0 ? ' ; ' : 'et '}${auFil} souvenir${s(auFil)} de 2009-2025 déjà passé${s(auFil)} au fil` : ''
    const txt = txtMur + txtFil
    if (plus.textContent !== txt) plus.textContent = txt
  }


  function ajouterCarte(c) {
    const vide = liste.querySelector('.fil-vide')
    if (vide) vide.remove()
    // m-3 (itération 2) : la pastille « Matin du 18 novembre : aucune contribution » disparaît à la première arrivée.
    if (contenu === 'vide') document.querySelector('.pastille-contenu')?.remove()
    const avant = new Map([...liste.children].map((el) => [el, rectMur(el)]))
    const li = carte(c)
    liste.prepend(li)
    while (liste.children.length > 3) liste.lastElementChild.remove()
    tailler()
    majPlus()
    if (reduit) { suivreA(animeA(li, { opacity: [0, 1], duration: 600 })); return li }
    for (const [el, r0] of avant) {
      if (!el.isConnected) continue
      const dy = r0.y - rectMur(el).y
      suivreM(animeM(el, { y: [dy, 0] }, { type: 'spring', stiffness: 120, damping: 18 }))
    }
    suivreM(animeM(li, { opacity: [0, 1], y: [-80, 0], scale: [0.96, 1] }, { type: 'spring', stiffness: 140, damping: 16 }))
    return li
  }

  // Coordonnées dans le repère du mur (7680 × 2160), quelle que soit l'échelle.
  function rectMur(el) {
    const m = mur.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return { x: (r.left - m.left) / echelle, y: (r.top - m.top) / echelle, w: r.width / echelle, h: r.height / echelle }
  }
  // Rectangle de chaque caractère d'un élément à un seul nœud texte, dans le repère du mur.
  function rectsCaracteres(el) {
    const noeud = el.firstChild
    const m = mur.getBoundingClientRect()
    const range = document.createRange()
    const sortie = []
    for (let i = 0; i < noeud.length; i++) {
      range.setStart(noeud, i); range.setEnd(noeud, i + 1)
      const r = range.getBoundingClientRect()
      sortie.push({ ch: noeud.data[i], x: (r.left - m.left) / echelle, y: (r.top - m.top) / echelle, h: r.height / echelle })
    }
    return sortie
  }

  // ---------- Arrivée d'une contribution : elle va dans le décor de SON année ----------
  function nouveauVoyage(c) {
    let annuler
    const v = { id: c.id, k: decorDe(c.an), annule: false, zoneVerrouillee: false, anims: [], noeuds: [], annulation: new Promise((r) => (annuler = r)) }
    v.annuler = annuler
    voyages.set(c.id, v)
    return v
  }
  const garde = (v, p) => Promise.race([p, v.annulation])
  const A = (v, a) => { v.anims.push(a); return suivreA(a) }
  const M = (v, a) => { v.anims.push(a); return suivreM(a) }

  async function arriver(c) {
    const v = nouveauVoyage(c)
    const k = v.k
    // N-1 (itération 3) : un souvenir de 2009 à 2025, en vue recadrée sur les décors (portable), fait passer le cadre
    // au fil « Aujourd'hui » avant que sa carte n'y entre ; le cadre revient après TENUE_FIL. Chaque coupe passe
    // par la garde de luminance (attendreFondu).
    if (k === 0 && vue === 1) {
      await couperVue(2)
      if (v.annule) { voyages.delete(c.id); revenirVue(); return }
    }
    contributions.unshift(c)
    const li = ajouterCarte(c)
    if (k === 0) {
      // M-4 (itération 2) : un souvenir de 2009 à 2025 n'a pas de décor ; il reste au fil, marqué de son année.
      await garde(v, attendre(reduit ? 600 : 1200))
      if (v.annule) { revenirVue(); return }
      c.posee = true
      voyages.delete(c.id)
      li.classList.add('recue')
      if (vueAvantFil !== null) { const j = ++jetonFil; attendre(TENUE_FIL).then(() => { if (j === jetonFil) revenirVue() }) }
      return
    }
    await revenirVue() // une arrivée vers un décor se voit dans la vue des décors
    arreter(minuteur) // le décor ne change plus pendant l'arrivée
    await garde(v, attendre(reduit ? 400 : 1000))
    if (v.annule) return
    await garde(v, attendreFondu())
    if (v.annule) return
    await garde(v, allerScene(k, { finir: true }))
    if (v.annule) return
    v.zoneVerrouillee = true
    const z = zones[k]
    const cible = z.querySelector('.public-texte')
    const meta = z.querySelector('.public-meta')
    if (reduit) {
      // Mouvement réduit : la phrase apparaît sur place, par un fondu, sans déplacement.
      cible.textContent = libelle(c); meta.textContent = metaDe(c)
      await garde(v, fini(A(v, animeA([cible, meta], { opacity: [0, 1], duration: 600, ease: 'linear' }))))
    } else if (k === 3) {
      await volLettres(c, v, li, cible, meta)
    } else {
      await voyageCarte(c, v, li, cible, meta, k)
    }
    if (v.annule) return
    c.posee = true
    if (k === 3) { vedette3 = c.id; sautsVedette = 2 } // la phrase qui vient d'arriver reste en vedette au moins 12 s
    v.zoneVerrouillee = false
    voyages.delete(c.id)
    rendreZone(k)
    zones[k].classList.add('recue')
    if (k === 3) { rendrePoints(); naissancePoint(c) }
    planifier(TENUE_ARRIVEE)
  }

  // Décors du passé : la carte glisse (ressort Motion) jusqu'au décor, puis la phrase s'y imprime à la manière de l'époque.
  async function voyageCarte(c, v, li, cible, meta, k) {
    const source = li.querySelector('.texte')
    const r0 = rectMur(source)
    const voyageur = document.createElement('div')
    voyageur.className = 'voyageur'
    voyageur.setAttribute('aria-hidden', 'true')
    voyageur.textContent = source.textContent
    voyageur.style.width = `${r0.w}px`
    mur.appendChild(voyageur)
    v.noeuds.push(voyageur)
    const r1 = rectMur(cible)
    const seq = M(v, animeM([
      [voyageur, { x: [r0.x, r0.x], y: [r0.y, r0.y], opacity: [0, 1] }, { duration: 0.3 }],
      [voyageur, { x: [r0.x, r1.x], y: [r0.y, r1.y], width: [r0.w, Math.min(r1.w, 3600)] }, { type: 'spring', stiffness: 40, damping: 14, at: 0.4 }],
      [[cible, meta], { opacity: [1, 0] }, { duration: 0.4, at: '<' }],
    ]))
    await garde(v, fini(seq))
    if (v.annule) return
    const texte = libelle(c)
    meta.textContent = metaDe(c)
    cible.style.opacity = 1
    const fondre = M(v, animeM(voyageur, { opacity: [1, 0] }, { duration: 0.5 }))
    if (k === 1) {
      // L'écran à caractères réimprime la phrase au caractère près, en ambre.
      const o = { n: 0 }
      cible.textContent = ''
      cible.classList.add('frappe')
      const frappe = A(v, animeA(o, {
        n: texte.length, duration: Math.round(texte.length / CPS), ease: 'linear',
        onUpdate: () => { const s = texte.slice(0, Math.floor(o.n)); if (cible.textContent !== s) cible.textContent = s },
      }))
      await garde(v, fini(frappe))
      if (v.annule) return
      cible.textContent = texte
      cible.classList.remove('frappe')
      await garde(v, fini(A(v, animeA(meta, { opacity: [0, 1], duration: 500 }))))
    } else {
      // La page web : la phrase s'inscrit au livre d'or.
      cible.textContent = texte
      await garde(v, fini(A(v, animeA([cible, meta], { opacity: [0, 1], duration: 700, ease: 'outQuad' }))))
    }
    await garde(v, fini(fondre))
    voyageur.remove()
  }

  // Décor du futur : la phrase se défait en lettres qui volent chacune sur sa trajectoire jusqu'à l'horizon,
  // puis se recomposent ; un point naît à son année. Trajectoires calculées à l'exécution, décalées par stagger.
  async function volLettres(c, v, li, cible, meta) {
    const source = li.querySelector('.texte')
    const texte = libelle(c)
    await garde(v, fini(A(v, animeA([cible, meta], { opacity: 0, duration: 400 }))))
    if (v.annule) return
    cible.textContent = texte
    meta.textContent = metaDe(c)
    cible.style.visibility = 'hidden'
    cible.style.opacity = 1
    const srcs = rectsCaracteres(source)
    const tgts = rectsCaracteres(cible)
    const tailleSrc = parseFloat(getComputedStyle(source).fontSize)
    const tailleTgt = parseFloat(getComputedStyle(cible).fontSize)
    const vol = document.createElement('div')
    vol.className = 'vol'
    vol.setAttribute('aria-hidden', 'true')
    mur.appendChild(vol)
    v.noeuds.push(vol)
    const lettres = []
    const deltas = []
    // m-5 (itération 2) : si la carte d'origine est hors cadre (vue recadrée sur les décors), les lettres partent
    // du bord visible du cadre, décalées d'un bloc, au lieu d'entrer par le bord de l'écran.
    const m0 = mur.getBoundingClientRect()
    const bordVisible = (innerWidth - m0.left) / echelle - 80
    const droite = Math.max(...srcs.map((s, i) => s.x + (srcs[i + 1] && srcs[i + 1].y === s.y ? srcs[i + 1].x - s.x : s.h * 0.6)))
    const decalX = Math.min(0, bordVisible - droite)
    srcs.forEach((s) => { s.x += decalX })
    srcs.forEach((s, i) => {
      if (!s.ch.trim() || !tgts[i]) return
      const sp = document.createElement('span')
      sp.className = 'lettre'
      sp.textContent = s.ch
      sp.style.left = `${s.x}px`
      sp.style.top = `${s.y}px`
      sp.style.fontSize = `${tailleSrc}px`
      vol.appendChild(sp)
      lettres.push(sp)
      const dx = tgts[i].x - s.x
      const dy = tgts[i].y - s.y
      // Point haut de la courbe : chaque lettre monte plus ou moins, selon sa place dans la phrase.
      deltas.push({ dx, dy, mx: dx * 0.45, my: Math.min(0, dy) * 0.5 - 220 - (i % 9) * 34 })
    })
    source.style.opacity = 0.25
    const s = tailleTgt / tailleSrc
    const anim = A(v, animeA(lettres, {
      translateX: [{ to: (_, i) => deltas[i].mx, ease: 'outSine' }, { to: (_, i) => deltas[i].dx, ease: 'inOutSine' }],
      translateY: [{ to: (_, i) => deltas[i].my, ease: 'outQuad' }, { to: (_, i) => deltas[i].dy, ease: 'inQuad' }],
      scale: [{ to: (1 + s) / 2 }, { to: s }],
      duration: 1500,
      delay: stagger(22, { from: 'first' }),
    }))
    await garde(v, fini(anim))
    if (v.annule) return
    cible.style.visibility = 'visible'
    source.style.opacity = 1
    vol.remove()
    await garde(v, fini(A(v, animeA(meta, { opacity: [0, 1], duration: 500 }))))
  }

  function naissancePoint(c) {
    const p = pointsEl.querySelector(`[data-id="${CSS.escape(c.id)}"]`)
    if (!p) return
    if (reduit) { suivreA(animeA(p, { opacity: [0, 1], duration: 600 })); return }
    effacerTrait()
    const ressort = suivreM(animeM(p, { scale: [0, 1] }, { type: 'spring', stiffness: 260, damping: 11 }))
    // Le trait qui relie la phrase à son année se trace (createDrawable), puis s'efface.
    const lien = document.getElementById('lien-point')
    const futur = document.getElementById('futur')
    const rf = rectMur(futur)
    const rz = rectMur(zones[3].querySelector('.public-texte'))
    const rp = rectMur(p)
    const x0 = rz.x - rf.x + 200
    const y0 = rz.y - rf.y + rz.h + 30
    const x1 = rp.x - rf.x + rp.w / 2
    const y1 = rp.y - rf.y
    lien.setAttribute('d', `M${x0} ${y0} C ${x0} ${(y0 + y1) / 2}, ${x1} ${(y0 + y1) / 2}, ${x1} ${y1}`)
    lien.style.opacity = 1
    const [dessin] = svg.createDrawable(lien)
    const tl = createTimeline({ autoplay: !enPause })
    tl.add(dessin, { draw: ['0 0', '0 1'], duration: 900, ease: 'inOutSine' })
      .add(lien, { opacity: [1, 0], duration: 800 }, '+=3500')
    suivreA(tl)
    trait = { id: c.id, anims: [ressort, tl] }
  }
  // m-1 (itération 2) : le trait et le ressort du point sont rattachés à l'identifiant ; un retrait les efface.
  let trait = null
  function effacerTrait(id) {
    if (!trait || (id && trait.id !== id)) return
    trait.anims.forEach(arreter)
    trait = null
    document.getElementById('lien-point').style.opacity = 0
  }

  // ---------- Retrait : retirer prime sur tout, même en pause, même en plein vol ----------
  let canalMur = null
  let file = [] // arrivées approuvées pendant la pause
  let aTraiter = [] // arrivées en attente de leur tour
  function retirer(id) {
    let trouve = false
    const j = file.findIndex((m) => String(m.id) === id)
    if (j >= 0) { file.splice(j, 1); trouve = true; majPause() }
    const q = aTraiter.findIndex((c) => c.id === id)
    if (q >= 0) { aTraiter.splice(q, 1); trouve = true }
    const v = voyages.get(id)
    if (v) {
      trouve = true
      v.annule = true
      v.anims.forEach(arreter)
      v.noeuds.forEach((n) => n.remove())
      voyages.delete(id)
      v.annuler()
      for (const z of Object.values(zones)) z.querySelectorAll('.public-texte, .public-meta').forEach((e) => { e.style.opacity = ''; e.style.visibility = '' })
      planifier(8000)
    }
    const i = contributions.findIndex((c) => c.id === id)
    if (i >= 0) { contributions.splice(i, 1); trouve = true }
    if (vedette3 === id) vedette3 = null
    effacerTrait(id)
    canalMur.postMessage({ type: trouve ? 'retiree' : 'inconnu', id })
    if (!trouve) return
    rendreFil()
    rendreZones()
    rendrePoints()
  }

  // ---------- File d'arrivées ----------
  let enCours = false
  function traiterSuivante() {
    if (enCours || enPause || !aTraiter.length) return
    enCours = true
    const c = aTraiter.shift()
    arriver(c).finally(() => { enCours = false; traiterSuivante() })
  }
  function recevoirAjout(msg) {
    const an = Math.max(1976, Math.min(2046, Math.round(Number(msg.an)) || 2046))
    const c = {
      id: String(msg.id).slice(0, 12),
      type: msg.typeContribution === 'souvenir' ? 'souvenir' : 'souhait',
      cat: CATEGORIES[msg.cat] ? msg.cat : 'releve',
      an,
      texte: String(msg.texte || '').slice(0, 120),
      simule: 'demo',
      posee: false,
    }
    aTraiter.push(c)
    traiterSuivante()
  }

  // ---------- Pause (WCAG 2.2.2) ----------
  function majPause() {
    btnPause.innerHTML = enPause ? 'Reprendre <kbd>espace</kbd>' : 'Pause <kbd>espace</kbd>'
    btnPause.setAttribute('aria-pressed', String(enPause))
    document.body.classList.toggle('en-pause', enPause)
    const n = file.length
    indic.textContent = (enPause ? 'En pause. ' : '')
      + (enPause && n ? `${n} contribution${n > 1 ? 's' : ''} approuvée${n > 1 ? 's' : ''} attend${n > 1 ? 'ent' : ''} la reprise. ` : '')
      + (reduit ? 'Mouvement réduit : fondus seulement.' : '')
  }
  function basculer() {
    enPause = !enPause
    if (enPause) actives.forEach((w) => w.pause())
    else actives.forEach((w) => w.reprendre())
    majPause()
    if (!enPause) {
      const a = file
      file = []
      majPause()
      a.forEach(recevoirAjout)
      traiterSuivante()
    }
  }
  btnPause.addEventListener('click', basculer)
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { document.getElementById('cloture').hidden = true; return }
    if (e.code !== 'Space' && e.key !== ' ') return
    const cible = e.target
    if (cible.closest && cible.closest('button, a, input, textarea, select')) return
    e.preventDefault()
    basculer()
  })
  // N-3 (itération 3) : les boutons de décor passent par la garde de luminance (fin du fondu, puis 1 s de décor
  // stable) ; des clics rapides se regroupent en un seul changement, vers le dernier décor demandé.
  let cibleBouton = null
  btnsScene.forEach((b) => b.addEventListener('click', async () => {
    if (enCours) return // une arrivée choisit son décor
    const attente = cibleBouton !== null
    cibleBouton = Number(b.dataset.aller)
    if (attente) return
    await attendreFondu()
    const n = cibleBouton
    cibleBouton = null
    if (enCours) return
    allerScene(n)
    planifier(DUREE_SCENE)
  }))
  const cloture = document.getElementById('cloture')
  document.getElementById('btn-cloture').addEventListener('click', () => { cloture.hidden = false; cloture.querySelector('button').focus() })
  document.getElementById('fermer-cloture').addEventListener('click', () => { cloture.hidden = true })

  // ---------- Rotation des souhaits du futur (une vedette toutes les 6 s, jamais plus vite) ----------
  let idxVedette = 0
  let sautsVedette = 0
  suivreA(createTimer({
    duration: 6000, loop: true,
    onLoop: async () => {
      if (sautsVedette > 0) { sautsVedette--; return }
      if (sceneActive !== 3 || enCours || [...voyages.values()].some((v) => v.k === 3)) return
      const posees = contributions.filter((c) => c.posee && decorDe(c.an) === 3)
      if (posees.length < 2) return
      idxVedette = (idxVedette + 1) % posees.length
      const t = zones[3].querySelector('.public-texte')
      const m = zones[3].querySelector('.public-meta')
      await fini(suivreA(animeA([t, m], { opacity: [1, 0], duration: 400 })))
      vedette3 = posees[idxVedette].id
      rendreZone(3)
      pointsEl.querySelectorAll('.point').forEach((p) => p.classList.toggle('vedette', p.dataset.id === vedette3))
      t.style.opacity = 0; m.style.opacity = 0
      await fini(suivreA(animeA([t, m], { opacity: [0, 1], duration: 400 })))
    },
  }))

  // ---------- Contenu de départ ----------
  const depart = contenu === 'vide' ? [] : contenu === 'charge' ? exemplesCharges(80) : EXEMPLES
  depart.slice().reverse().forEach((c) => contributions.unshift({ ...c, posee: true }))
  rendreFil()
  rendreZones()
  rendrePoints()

  canalMur = ouvrirCanal((msg) => {
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'ajout' && msg.id) {
      const k = decorDe(Number(msg.an))
      canalMur.postMessage({ type: 'recue', id: String(msg.id), enFile: enPause, decor: k })
      if (enPause) { file.push(msg); majPause(); return }
      recevoirAjout(msg)
    } else if (msg.type === 'retrait' && msg.id) {
      retirer(String(msg.id).trim().toUpperCase())
    }
  })

  renduOpac()
  rendu1(); rendu2(); rendu3()
  const depScene = Number(params.get('scene'))
  if ([2, 3].includes(depScene)) allerScene(depScene)
  else demarrerIntro(1, false)
  planifier(DUREE_SCENE)
  majPause()

  // Pour les captures et les tests.
  window.__murCombi = {
    sceneActive: () => sceneActive,
    enPause: () => enPause,
    file: () => file.length,
    contributions: () => contributions.map((c) => ({ id: c.id, an: c.an, type: c.type, posee: !!c.posee, simule: c.simule })),
    voyages: () => voyages.size,
    allerScene: (n) => { allerScene(n); planifier(DUREE_SCENE) },
    contenu,
  }
}

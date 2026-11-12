// utils/socialVisual.js
// Génération du visuel "réseaux sociaux" (TikTok / Reels / Stories) d'un cocktail.
//
// Rendu 100 % canvas 2D, sans dépendance : on dessine directement la DA
// validée (src/DA/validated_da/full_da_occ_luxe_brun.html) :
//   - bloc marque Gloock + sous-titre Josefin justifié sur la largeur du titre
//   - nom du cocktail en Kalnia
//   - fiche recette avec points de conduite (--recipe-leader)
// Les couleurs / polices / rayons ne sont PAS codés en dur : ils sont lus
// dans les variables CSS du skin actif (cf. readTheme), donc le visuel suit
// automatiquement le skin du bar (luxe, emerald, bordeaux, classic, minimal…).
//
// ⚠️ Fichier volontairement sans accès DOM hors readTheme/loadImage, pour
//    pouvoir tester le rendu avec un canvas Node (@napi-rs/canvas).

import {
  getCocktailStyleLabel,
  getDetailledIceLabel,
  getDetailledMethodLabel,
  getGlassLabel,
  getIngredientLabel,
  getRecipeLineLabel,
} from '../constants/typeLabels.js'
import { formatOz } from './formatters.js'

export const VISUAL_WIDTH = 1080
export const VISUAL_HEIGHT = 1920 // 9:16 (TikTok / Reels / Stories)

// Sous-titre du bloc marque (cf. DA : "COCKTAIL CLUB" justifié sous le nom)
export const BRAND_SUBTITLE = 'COCKTAIL CLUB'

// Les labels peuvent contenir des emojis (FAMILY_LABELS…) : on les retire,
// ils casseraient la DA (police de secours emoji dans un rendu typographique).
const EMOJI_RE = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu
const clean = (s) => String(s ?? '').replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim()

// ─────────────────────────────────────────────────────────────────────────────
// Thème : lecture des variables CSS du skin actif
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lit les design tokens du skin actif.
 * @param {HTMLElement} el   élément DANS `.menu-app` (hérite des variables du skin)
 * @param {{ dark?: boolean }} [opts] force clair/sombre indépendamment du thème de l'app
 */
export function readTheme(el, { dark } = {}) {
  const root = document.documentElement
  const wasDark = root.classList.contains('dark')
  const forceMode = typeof dark === 'boolean' && dark !== wasDark

  // Bascule synchrone de la classe `dark` le temps de la lecture : aucun
  // frame n'est peint entre les deux, donc pas de flash visible.
  if (forceMode) root.classList.toggle('dark', dark)
  try {
    const cs = getComputedStyle(el)
    const v = (name, fallback = '') => cs.getPropertyValue(name).trim() || fallback
    const px = (name, fallback) => {
      const n = parseFloat(v(name))
      return Number.isFinite(n) ? n : fallback
    }
    const fontBody = v('--font-body', 'sans-serif')
    const fontDisplay = v('--font-display', 'serif')
    const gold = v('--gold', '#937253')

    return {
      isDark: root.classList.contains('dark'),
      bg: v('--bg', '#f8f2da'),
      bgCard: v('--bg-card', '#e3dccc'),
      bgRaised: v('--bg-raised', '#e1d2b5'),
      gold,
      goldDim: v('--gold-dim', gold),
      amber: v('--amber', gold),
      recipeLeader: v('--recipe-leader', gold),
      text: v('--text', '#260101'),
      textMuted: v('--text-muted', '#260101'),
      textDim: v('--text-dim', '#260101'),
      border: v('--border', gold),
      borderMid: v('--border-mid', gold),
      radiusPanel: px('--radius-panel', 6),
      radiusLg: px('--radius-lg', 8),
      radiusDialog: px('--radius-dialog', 8),
      fontBody,
      fontDisplay,
      // Certains skins ne définissent pas ces deux-là → repli sur body / display
      fontSubtitle: v('--font-subtitle', fontBody),
      fontCocktail: v('--font-cocktail', fontDisplay),
    }
  } finally {
    if (forceMode) root.classList.toggle('dark', wasDark)
  }
}

/** Charge une image pour le canvas (CORS anonyme). Résout `null` si indisponible. */
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // CORS refusé / 404 → visuel sans photo
    img.src = src
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Contenu
// ─────────────────────────────────────────────────────────────────────────────

function formatQty(ing, unit) {
  const dashes = ing.Dashes ? `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}` : ''
  const oz = ing.Oz ? `${formatOz(ing.Oz)} oz` : ''
  const ml = ing.Ml ? `${ing.Ml} ml` : ''
  // Unité préférée d'abord, l'autre en repli (la modale de détail n'en a pas)
  return (unit === 'ml' ? ml || oz : oz || ml) || dashes
}

export function buildContent(cocktail, { locale = 'fr', unit = 'oz', ingredientsByIngredient = null } = {}) {
  const fr = locale === 'fr'
  const na = fr ? 'Indisponible' : 'Unavailable'
  const known = (s) => s && s !== 'Unknown' && s !== na

  const meta = [
    cocktail.base_spirit && getIngredientLabel(cocktail.base_spirit, locale, ingredientsByIngredient),
    known(cocktail.cocktail_style) && getCocktailStyleLabel(cocktail.cocktail_style, locale),
    cocktail.abv && `${cocktail.abv}°`,
  ].map(clean).filter(Boolean)

  const prep = [
    { label: fr ? 'Méthode' : 'Method', value: cocktail.method && getDetailledMethodLabel(cocktail.method, locale) },
    { label: fr ? 'Verre' : 'Glass', value: cocktail.glass && getGlassLabel(cocktail.glass, locale) },
    { label: fr ? 'Glaçon' : 'Ice', value: cocktail.ice && getDetailledIceLabel(cocktail.ice, locale) },
  ]
    .map(p => ({ label: p.label, value: clean(p.value) }))
    .filter(p => p.value && p.value !== na)

  const recipe = (cocktail.recipe || []).map(ing => ({
    label: clean(getRecipeLineLabel(ing, locale, ingredientsByIngredient)),
    reference: clean(ing.Reference),
    qty: formatQty(ing, unit),
  })).filter(l => l.label)

  const description = clean(fr ? cocktail.description_fr : cocktail.description_en)

  return { name: clean(cocktail.name), meta, prep, recipe, description }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers canvas
// ─────────────────────────────────────────────────────────────────────────────

// Couleur CSS quelconque → rgba(), via la normalisation de fillStyle
function withAlpha(ctx, color, alpha) {
  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillStyle = color
  const out = String(ctx.fillStyle)
  ctx.restore()
  let r = 0, g = 0, b = 0, a = 1
  if (out.startsWith('#')) {
    const h = out.length === 4 ? [...out.slice(1)].map(c => c + c).join('') : out.slice(1, 7)
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16)
  } else {
    const m = out.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/)
    if (m) { r = +m[1]; g = +m[2]; b = +m[3]; a = m[4] !== undefined ? +m[4] : 1 }
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a * alpha).toFixed(3)})`
}

// roundRect maison (compat Safari < 16)
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function ellipsize(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

function wrapLines(ctx, text, maxW, maxLines = Infinity) {
  const lines = []
  let cur = ''
  for (const word of text.split(' ')) {
    const test = cur ? `${cur} ${word}` : word
    if (!cur || ctx.measureText(test).width <= maxW) cur = test
    else { lines.push(cur); cur = word }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = ellipsize(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxW)
    return kept
  }
  return lines
}

// Texte avec interlettrage (letterSpacing canvas pas dispo partout)
function spacedWidth(ctx, text, sp) {
  let w = 0
  for (const ch of text) w += ctx.measureText(ch).width + sp
  return Math.max(0, w - sp)
}

function drawSpaced(ctx, text, x, y, sp, align = 'center') {
  const w = spacedWidth(ctx, text, sp)
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  ctx.textAlign = 'left'
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + sp
  }
}

function drawCover(ctx, img, x, y, w, h, posY = 0.4) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  const s = Math.max(w / iw, h / ih)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) * posY, sw, sh, x, y, w, h)
}

function drawOrnament(ctx, t, cx, y, halfW) {
  ctx.save()
  ctx.strokeStyle = t.gold
  ctx.fillStyle = t.gold
  ctx.lineWidth = 2
  const gap = 22
  ctx.beginPath()
  ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - gap, y)
  ctx.moveTo(cx + gap, y); ctx.lineTo(cx + halfW, y)
  ctx.stroke()
  ctx.translate(cx, y)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-6, -6, 12, 12)
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendu
// ─────────────────────────────────────────────────────────────────────────────

const W = VISUAL_WIDTH
const H = VISUAL_HEIGHT
const FRAME = 36        // marge du cadre extérieur
const PAD = 84          // marge du contenu
const CW = W - PAD * 2  // largeur de contenu
const SAFE_TOP = 128    // zones réservées à l'UI Stories/TikTok
const SAFE_BOTTOM = 190
const MIN_PHOTO = Math.round(CW * 0.42)
const MAX_PHOTO = Math.round(CW * 0.95)

/**
 * Dessine le visuel dans `canvas` (redimensionné à 1080×1920).
 * @param {HTMLCanvasElement} canvas
 * @param {object} o
 * @param {object} o.cocktail
 * @param {object} o.theme                résultat de readTheme()
 * @param {string} [o.barName]
 * @param {string} [o.locale]
 * @param {string} [o.unit]               'oz' | 'ml'
 * @param {object} [o.ingredientsByIngredient]
 * @param {CanvasImageSource|null} [o.image]  image déjà chargée (cf. loadImage)
 * @param {boolean} [o.includeDescription]
 */
export function renderCocktailVisual(canvas, {
  cocktail,
  theme: t,
  barName = '',
  locale = 'fr',
  unit = 'oz',
  ingredientsByIngredient = null,
  image = null,
  includeDescription = true,
}) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const c = buildContent(cocktail, { locale, unit, ingredientsByIngredient })
  const fr = locale === 'fr'
  const R = (r) => r * 2 // les rayons des skins sont pensés pour ~400px de large

  const font = (weight, size, family) => { ctx.font = `${weight} ${Math.round(size)}px ${family}` }
  ctx.textBaseline = 'alphabetic'

  // ── Fond : couleur du skin + halos (équivalent des radial-gradient du skin luxe) ──
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)
  const glow = (cx, cy, rx, ry, color, alpha) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1, ry / rx)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    g.addColorStop(0, withAlpha(ctx, color, alpha))
    g.addColorStop(1, withAlpha(ctx, color, 0))
    ctx.fillStyle = g
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
    ctx.restore()
  }
  const a = t.isDark ? 0.2 : 0.2
  glow(0, 0, W * 0.9, H * 0.42, t.gold, a)
  glow(W, H * 0.08, W * 0.8, H * 0.38, t.goldDim, a * 0.75)
  glow(W * 0.48, H, W * 0.95, H * 0.34, t.bgRaised, 0.7)

  // ── Cadre double filet ──
  ctx.lineWidth = 2
  ctx.strokeStyle = t.border
  roundRectPath(ctx, FRAME, FRAME, W - FRAME * 2, H - FRAME * 2, R(t.radiusDialog))
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.strokeStyle = withAlpha(ctx, t.border, 0.55)
  roundRectPath(ctx, FRAME + 12, FRAME + 12, W - (FRAME + 12) * 2, H - (FRAME + 12) * 2, Math.max(0, R(t.radiusDialog) - 8))
  ctx.stroke()

  // ── Mesures communes ──
  // Bloc marque
  const brand = clean(barName || 'Martini Please').toUpperCase()
  let brandSize = 100
  font(400, brandSize, t.fontDisplay)
  while (brandSize > 48 && ctx.measureText(brand).width > 760) {
    brandSize -= 4
    font(400, brandSize, t.fontDisplay)
  }
  const brandW = ctx.measureText(brand).width
  const subSize = Math.max(20, Math.round(brandSize * 0.25))
  const brandH = Math.round(brandSize * 0.78 + 20 + subSize * 0.74)

  // Nom : 1 à 2 lignes, taille ajustée
  let nameSize = 104
  let nameLines
  for (; nameSize >= 56; nameSize -= 4) {
    font(400, nameSize, t.fontCocktail)
    nameLines = wrapLines(ctx, c.name, CW)
    if (nameLines.length <= 2 && nameLines.every(l => ctx.measureText(l).width <= CW)) break
  }
  const nameLH = Math.round(nameSize * 1.08)
  const nameH = nameLines.length * nameLH

  // Description (3 lignes max)
  font(400, 30, t.fontBody)
  const descLines = includeDescription && c.description ? wrapLines(ctx, c.description, CW - 60, 3) : []
  const DESC_LH = 44

  // Choix du gabarit : on réduit la fiche recette avant de sacrifier un bloc,
  // puis on retire description, puis bandeau méthode/verre/glaçon.
  const buildMetrics = (scale, withDesc, withPrep) => {
    const lh = Math.round(58 * scale)
    const recipeH = c.recipe.length ? Math.round(34 * scale) + 70 + c.recipe.length * lh + 34 : 0
    const prepH = withPrep && c.prep.length ? 98 : 0
    const descH = withDesc && descLines.length ? descLines.length * DESC_LH : 0
    const metaH = c.meta.length ? 30 : 0
    const gaps = {
      afterBrand: 52,
      afterPhoto: 52,
      afterName: metaH ? 22 : 0,
      afterMeta: 28,
      afterOrnament: 30,
      afterPrep: prepH ? 34 : 0,
      afterRecipe: descH ? 34 : 0,
    }
    const fixed = brandH + gaps.afterBrand + (image ? gaps.afterPhoto : 0) + nameH + gaps.afterName + metaH
      + gaps.afterMeta + 12 + gaps.afterOrnament + prepH + gaps.afterPrep + recipeH + gaps.afterRecipe + descH
    return { scale, lh, recipeH, prepH, descH, metaH, gaps, fixed, withDesc, withPrep }
  }

  const avail = H - SAFE_TOP - SAFE_BOTTOM
  const candidates = []
  for (const withDesc of descLines.length ? [true, false] : [false]) {
    for (const withPrep of [true, false]) {
      for (const scale of [1, 0.92, 0.85, 0.78, 0.7]) candidates.push(buildMetrics(scale, withDesc, withPrep))
    }
  }
  const fits = (m) => (image ? avail - m.fixed >= MIN_PHOTO : m.fixed <= avail)
  const M = candidates.find(fits) ?? candidates[candidates.length - 1]
  const photoH = image ? Math.max(0, Math.min(MAX_PHOTO, avail - M.fixed)) : 0
  // Sans photo, on centre verticalement le contenu dans la zone sûre
  let y = SAFE_TOP + (image ? 0 : Math.max(0, (avail - M.fixed) / 2))

  // ── Bloc marque ──
  const cx = W / 2
  ctx.fillStyle = t.text
  font(400, brandSize, t.fontDisplay)
  ctx.textAlign = 'center'
  const brandBase = y + brandSize * 0.78
  ctx.fillText(brand, cx, brandBase)
  // Sous-titre justifié sur la largeur du titre (space-between, cf. DA)
  font(600, subSize, t.fontSubtitle)
  const letters = [...BRAND_SUBTITLE]
  const widths = letters.map(l => ctx.measureText(l).width)
  const gap = (brandW - widths.reduce((s, w) => s + w, 0)) / Math.max(1, letters.length - 1)
  let lx = cx - brandW / 2
  const subBase = brandBase + 20 + subSize * 0.74
  ctx.textAlign = 'left'
  letters.forEach((l, i) => { ctx.fillText(l, lx, subBase); lx += widths[i] + gap })
  y += brandH + M.gaps.afterBrand

  // ── Photo ──
  if (image && photoH > 0) {
    ctx.save()
    roundRectPath(ctx, PAD, y, CW, photoH, R(t.radiusLg))
    ctx.clip()
    drawCover(ctx, image, PAD, y, CW, photoH)
    ctx.restore()
    ctx.lineWidth = 2
    ctx.strokeStyle = t.border
    roundRectPath(ctx, PAD, y, CW, photoH, R(t.radiusLg))
    ctx.stroke()
    y += photoH + M.gaps.afterPhoto
  }

  // ── Nom ──
  ctx.fillStyle = t.text
  font(400, nameSize, t.fontCocktail)
  ctx.textAlign = 'center'
  nameLines.forEach((l, i) => ctx.fillText(l, cx, y + nameSize * 0.82 + i * nameLH))
  y += nameH + M.gaps.afterName

  // ── Méta (spiritueux · style · degré) ──
  if (c.meta.length) {
    ctx.fillStyle = t.gold
    font(600, 26, t.fontSubtitle)
    drawSpaced(ctx, c.meta.join('  ·  ').toUpperCase(), cx, y + 24, 4)
    y += M.metaH
  }
  y += M.gaps.afterMeta

  drawOrnament(ctx, t, cx, y + 6, 190)
  y += 12 + M.gaps.afterOrnament

  // ── Bandeau préparation (cf. .cv-prep-block) ──
  if (M.prepH) {
    ctx.fillStyle = t.bgRaised
    roundRectPath(ctx, PAD, y, CW, M.prepH, R(t.radiusPanel))
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = t.border
    ctx.stroke()
    const colW = CW / c.prep.length
    c.prep.forEach((p, i) => {
      const ccx = PAD + colW * i + colW / 2
      ctx.fillStyle = t.textDim
      font(600, 18, t.fontSubtitle)
      drawSpaced(ctx, p.label.toUpperCase(), ccx, y + 36, 3)
      ctx.fillStyle = t.text
      font(400, 31, t.fontBody)
      ctx.textAlign = 'center'
      ctx.fillText(ellipsize(ctx, p.value, colW - 24), ccx, y + 74)
      if (i > 0) {
        ctx.strokeStyle = withAlpha(ctx, t.border, 0.6)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(PAD + colW * i, y + 22)
        ctx.lineTo(PAD + colW * i, y + M.prepH - 22)
        ctx.stroke()
      }
    })
    y += M.prepH + M.gaps.afterPrep
  }

  // ── Fiche recette ──
  if (M.recipeH) {
    ctx.fillStyle = t.bgCard
    roundRectPath(ctx, PAD, y, CW, M.recipeH, R(t.radiusPanel))
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = t.border
    ctx.stroke()

    const inner = 48
    const x0 = PAD + inner
    const x1 = PAD + CW - inner
    let ry = y + Math.round(34 * M.scale)

    ctx.fillStyle = t.gold
    font(600, 24, t.fontSubtitle)
    drawSpaced(ctx, (fr ? 'Recette' : 'Recipe').toUpperCase(), cx, ry + 24, 6)
    ry += 70

    const nameFont = Math.round(34 * M.scale + 2)
    c.recipe.forEach(line => {
      const base = ry + Math.round(M.lh * 0.62)
      // quantité à droite
      let qtyW = 0
      if (line.qty) {
        font(600, Math.round(30 * M.scale + 2), t.fontSubtitle)
        qtyW = ctx.measureText(line.qty).width
        ctx.fillStyle = t.amber
        ctx.textAlign = 'right'
        ctx.fillText(line.qty, x1, base)
      }
      // nom (+ référence en sourdine)
      const maxLeft = x1 - x0 - qtyW - (line.qty ? 40 : 0)
      font(400, nameFont, t.fontBody)
      const label = ellipsize(ctx, line.label, maxLeft)
      const labelW = ctx.measureText(label).width
      ctx.fillStyle = t.text
      ctx.textAlign = 'left'
      ctx.fillText(label, x0, base)
      let leftEnd = x0 + labelW
      if (line.reference && maxLeft - labelW > 90) {
        font(400, Math.round(nameFont * 0.78), t.fontBody)
        const ref = ellipsize(ctx, line.reference, maxLeft - labelW - 24)
        ctx.fillStyle = t.textDim
        ctx.fillText(ref, x0 + labelW + 16, base)
        leftEnd += 16 + ctx.measureText(ref).width
      }
      // points de conduite (cf. --recipe-leader)
      if (line.qty) {
        const from = leftEnd + 18
        const to = x1 - qtyW - 18
        if (to - from > 24) {
          ctx.save()
          ctx.strokeStyle = t.recipeLeader
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.setLineDash([0.1, 11])
          ctx.beginPath()
          ctx.moveTo(from, base - 7)
          ctx.lineTo(to, base - 7)
          ctx.stroke()
          ctx.restore()
        }
      }
      ry += M.lh
    })
    y += M.recipeH + M.gaps.afterRecipe
  }

  // ── Description ──
  if (M.descH) {
    ctx.fillStyle = t.textMuted
    font(400, 30, t.fontBody)
    ctx.textAlign = 'center'
    descLines.forEach((l, i) => ctx.fillText(l, cx, y + 32 + i * DESC_LH))
  }

  return canvas
}
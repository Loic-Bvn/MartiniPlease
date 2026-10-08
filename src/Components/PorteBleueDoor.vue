<template>
  <!--
    Porte Bleue — porte d'immeuble en pierre, vantail laqué bleu, ferrures laiton,
    imposte en éventail, judas de speakeasy et appliques murales.

    États pilotés par CSS (styles_porte_bleue.css) :
      • repos            : lueur qui respire, reflet qui balaie la laque, flammes d'appliques
      • survol / focus   : la porte s'entrouvre, le judas s'ouvre, la lumière s'étale au sol
      • .pb-door--opening: le vantail pivote, le salon s'illumine, léger "pas en avant"

    Les ids de dégradés sont uniques par instance (useId) → plusieurs portes possibles.
  -->
  <svg
    class="pb-door"
    viewBox="0 0 160 184"
    :class="{ 'pb-door--interactive': interactive, 'pb-door--opening': opening }"
    :style="{ width: size + 'px' }"
    :role="interactive ? 'button' : 'img'"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="label"
    @click="activate"
    @keydown.enter.prevent="activate"
    @keydown.space.prevent="activate"
  >
    <defs>
      <linearGradient :id="g('lacquer')" x1="0" y1="0" x2="0" y2="1">
        <stop class="pb-s-lac-1" offset="0" />
        <stop class="pb-s-lac-2" offset="0.55" />
        <stop class="pb-s-lac-3" offset="1" />
      </linearGradient>
      <linearGradient :id="g('edge')" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.28" />
        <stop offset="0.12" stop-color="#000" stop-opacity="0" />
        <stop offset="0.88" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity="0.22" />
      </linearGradient>
      <linearGradient :id="g('brass')" x1="0" y1="0" x2="1" y2="1">
        <stop class="pb-s-brass-1" offset="0" />
        <stop class="pb-s-brass-2" offset="0.5" />
        <stop class="pb-s-brass-3" offset="1" />
      </linearGradient>
      <linearGradient :id="g('stone')" x1="0" y1="0" x2="1" y2="1">
        <stop class="pb-s-stone-1" offset="0" />
        <stop class="pb-s-stone-2" offset="1" />
      </linearGradient>
      <linearGradient :id="g('glass')" x1="0" y1="0" x2="0" y2="1">
        <stop class="pb-s-glass-1" offset="0" />
        <stop class="pb-s-glass-2" offset="1" />
      </linearGradient>
      <radialGradient :id="g('room')" cx="0.5" cy="0.72" r="0.75">
        <stop offset="0" stop-color="#ffe3a0" />
        <stop offset="0.3" stop-color="#f0a948" />
        <stop offset="0.68" stop-color="#8a4118" />
        <stop offset="1" stop-color="#1b0e08" />
      </radialGradient>
      <radialGradient :id="g('spill')" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffd98a" stop-opacity="0.95" />
        <stop offset="1" stop-color="#ffb14a" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="g('flame')" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#fff1c2" stop-opacity="1" />
        <stop offset="1" stop-color="#ffb14a" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="g('sheen')" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0" />
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.28" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <clipPath :id="g('leaf-clip')">
        <path d="M38 160V62A42 42 0 0 1 122 62V160Z" />
      </clipPath>
    </defs>

    <!-- ombre portée au sol -->
    <ellipse class="pb-ground-shadow" cx="80" cy="177" rx="66" ry="4" />

    <!-- marches -->
    <rect x="10" y="168" width="140" height="8" rx="1" :fill="`url(#${g('stone')})`" />
    <rect x="18" y="160" width="124" height="8" rx="1" :fill="`url(#${g('stone')})`" />
    <rect class="pb-step-line" x="18" y="160" width="124" height="1" />

    <!-- intérieur : le salon, visible quand le vantail s'ouvre -->
    <g class="pb-interior">
      <path d="M38 160V62A42 42 0 0 1 122 62V160Z" :fill="`url(#${g('room')})`" />
      <!-- étagère + bouteilles en silhouette -->
      <g class="pb-bottles">
        <rect x="44" y="122" width="72" height="1.6" />
        <rect v-for="b in bottles" :key="b.x" :x="b.x" :y="122 - b.h" :width="b.w" :height="b.h" rx="1" />
        <rect v-for="b in bottles" :key="'n' + b.x" :x="b.x + b.w / 2 - 1" :y="122 - b.h - 5" width="2" height="5.5" rx="0.6" />
      </g>
    </g>

    <!-- lueur de la lumière qui filtre -->
    <ellipse class="pb-spill" cx="80" cy="165" rx="52" ry="9" :fill="`url(#${g('spill')})`" />

    <!-- encadrement en pierre (arche) -->
    <path
      class="pb-frame"
      fill-rule="evenodd"
      :fill="`url(#${g('stone')})`"
      d="M28 168V62A52 52 0 0 1 132 62V168Z M38 160V62A42 42 0 0 1 122 62V160Z"
    />
    <path class="pb-frame-line" d="M38 160V62A42 42 0 0 1 122 62V160" />
    <!-- clé de voûte -->
    <path class="pb-keystone" d="M71 10H89L86 24H74Z" :fill="`url(#${g('stone')})`" />
    <path class="pb-keystone-line" d="M71 10H89L86 24H74Z" />

    <!-- appliques murales -->
    <g class="pb-sconce" transform="translate(12 74)">
      <circle class="pb-flame-glow" cx="0" cy="0" r="11" :fill="`url(#${g('flame')})`" />
      <rect x="-1" y="6" width="2" height="12" :fill="`url(#${g('brass')})`" />
      <path d="M-4 6H4L3 0H-3Z" :fill="`url(#${g('brass')})`" />
      <ellipse class="pb-flame" cx="0" cy="-2" rx="1.8" ry="3.2" />
    </g>
    <g class="pb-sconce" transform="translate(148 74)">
      <circle class="pb-flame-glow" cx="0" cy="0" r="11" :fill="`url(#${g('flame')})`" />
      <rect x="-1" y="6" width="2" height="12" :fill="`url(#${g('brass')})`" />
      <path d="M-4 6H4L3 0H-3Z" :fill="`url(#${g('brass')})`" />
      <ellipse class="pb-flame" cx="0" cy="-2" rx="1.8" ry="3.2" />
    </g>

    <!-- vantail (charnière à gauche) -->
    <g class="pb-door-leaf">
      <path d="M38 160V62A42 42 0 0 1 122 62V160Z" :fill="`url(#${g('lacquer')})`" />
      <path d="M38 160V62A42 42 0 0 1 122 62V160Z" :fill="`url(#${g('edge')})`" />

      <!-- imposte en éventail -->
      <path class="pb-fan-glass" d="M50 60A30 30 0 0 1 110 60Z" :fill="`url(#${g('glass')})`" />
      <path class="pb-fan-glow" d="M50 60A30 30 0 0 1 110 60Z" />
      <g class="pb-fan-bars">
        <path d="M80 60L80 30M80 60L58.8 38.8M80 60L101.2 38.8M80 60L68.5 32.3M80 60L91.5 32.3M80 60L52.3 48.5M80 60L107.7 48.5" />
        <path d="M65 60A15 15 0 0 1 95 60" />
      </g>
      <path class="pb-fan-frame" d="M50 60A30 30 0 0 1 110 60Z" :stroke="`url(#${g('brass')})`" />

      <!-- traverse -->
      <rect class="pb-rail" x="38" y="62" width="84" height="6" />
      <rect class="pb-rail-line" x="38" y="62.6" width="84" height="0.9" :fill="`url(#${g('brass')})`" />

      <!-- panneaux moulurés -->
      <g class="pb-panels">
        <g v-for="p in panels" :key="p.x + '-' + p.y">
          <rect class="pb-panel" :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="1.2" />
          <path class="pb-bevel-hi" :d="`M${p.x} ${p.y + p.h}V${p.y}H${p.x + p.w}`" />
          <path class="pb-bevel-lo" :d="`M${p.x + p.w} ${p.y}V${p.y + p.h}H${p.x}`" />
          <rect class="pb-panel-inner" :x="p.x + 3.5" :y="p.y + 3.5" :width="p.w - 7" :height="p.h - 7" rx="0.8" />
        </g>
      </g>

      <!-- judas de speakeasy -->
      <g class="pb-peephole">
        <circle cx="80" cy="96" r="5.4" :fill="`url(#${g('brass')})`" />
        <circle class="pb-peep-light" cx="80" cy="96" r="3.9" />
        <g class="pb-peep-grille"><path d="M76.6 94.4H83.4M76.3 96H83.7M76.6 97.6H83.4" /></g>
        <circle class="pb-peep-shutter" cx="80" cy="96" r="3.9" />
      </g>

      <!-- plaque -->
      <g class="pb-plaque">
        <rect x="74.5" y="127" width="11" height="14" rx="5.5" :fill="`url(#${g('brass')})`" />
        <text x="80" y="136.2" text-anchor="middle">PB</text>
      </g>

      <!-- plaque de propreté -->
      <rect x="38" y="150" width="84" height="10" :fill="`url(#${g('brass')})`" />
      <rect class="pb-kick-line" x="38" y="150" width="84" height="0.8" />
      <circle class="pb-screw" cx="43" cy="155" r="1" />
      <circle class="pb-screw" cx="117" cy="155" r="1" />

      <!-- charnières -->
      <rect v-for="y in [40, 98, 142]" :key="y" x="38.6" :y="y" width="2.6" height="9" rx="0.8" :fill="`url(#${g('brass')})`" />

      <!-- poignée tirant + serrure -->
      <g class="pb-handle">
        <rect x="115.4" y="90" width="4" height="28" rx="2" :fill="`url(#${g('brass')})`" />
        <circle cx="117.4" cy="93.6" r="2.3" :fill="`url(#${g('brass')})`" />
        <circle cx="117.4" cy="114.4" r="2.3" :fill="`url(#${g('brass')})`" />
        <rect class="pb-handle-shine" x="116.4" y="94" width="1" height="20" rx="0.5" />
      </g>
      <g class="pb-lock">
        <circle cx="117.4" cy="130" r="4" :fill="`url(#${g('brass')})`" />
        <circle class="pb-keyhole" cx="117.4" cy="129.2" r="1" />
        <path class="pb-keyhole" d="M116.7 129.8H118.1L118.5 133H116.3Z" />
      </g>

      <!-- reflet qui balaie la laque -->
      <g :clip-path="`url(#${g('leaf-clip')})`">
        <rect class="pb-sheen" x="-30" y="10" width="26" height="160" :fill="`url(#${g('sheen')})`" />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { useId } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Porte Bleue' },
  size: { type: Number, default: 96 },
  interactive: { type: Boolean, default: false },
  opening: { type: Boolean, default: false },
})

const emit = defineEmits(['activate'])

// ids de dégradés uniques par instance (caractères sûrs pour url(#…))
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const g = (name) => `pbd-${uid}-${name}`

const bottles = [
  { x: 47, w: 5, h: 17 }, { x: 54, w: 6, h: 22 }, { x: 62, w: 5, h: 15 },
  { x: 69, w: 6, h: 24 }, { x: 77, w: 5, h: 18 }, { x: 84, w: 6, h: 21 },
  { x: 92, w: 5, h: 16 }, { x: 99, w: 6, h: 23 }, { x: 107, w: 5, h: 18 },
]

const panels = [
  { x: 48, y: 76, w: 26, h: 40 }, { x: 86, y: 76, w: 26, h: 40 },
  { x: 48, y: 122, w: 26, h: 24 }, { x: 86, y: 122, w: 26, h: 24 },
]

function activate(event) {
  if (props.interactive && !props.opening) emit('activate', event)
}
</script>

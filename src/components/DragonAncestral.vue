<template>
  <svg class="dragon-art" viewBox="0 0 320 230" role="img" aria-labelledby="titulo-dragon">
    <title id="titulo-dragon">Dragón Ancestral</title>
    <defs>
      <linearGradient id="dragon-escama" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6fa59b" />
        <stop offset="0.46" stop-color="#285b5c" />
        <stop offset="1" stop-color="#142b38" />
      </linearGradient>
      <linearGradient id="dragon-ala" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#507a73" />
        <stop offset="1" stop-color="#162832" />
      </linearGradient>
      <radialGradient id="dragon-brasa">
        <stop stop-color="#fff0a6" />
        <stop offset="0.35" stop-color="#ffb349" />
        <stop offset="1" stop-color="#d44e27" stop-opacity="0" />
      </radialGradient>
      <filter id="dragon-resplandor" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="suave" />
        <feMerge><feMergeNode in="suave" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <ellipse class="dragon-sombra" cx="163" cy="207" rx="94" ry="12" />
    <g class="dragon-cola">
      <path d="M117 151C91 166 75 184 43 179c18 21 37 21 53 12-7 14-21 21-37 22 39 9 66-13 84-42z" fill="url(#dragon-escama)" stroke="#9c8652" stroke-width="2" />
      <path d="M54 186c18 7 34 2 49-8" fill="none" stroke="#b6a16b" stroke-width="2" opacity=".7" />
    </g>

    <g class="dragon-ala dragon-ala-trasera">
      <path d="M158 127C143 77 118 44 83 24c9 25 7 40-7 48 20 0 30 9 31 25-18-10-31-11-45-5 23 10 37 27 40 52z" fill="url(#dragon-ala)" stroke="#b49c5e" stroke-width="3" stroke-linejoin="round" />
      <path d="M151 119 83 24M107 97l-31-25m49 48-39-43" fill="none" stroke="#b49c5e" stroke-width="2" opacity=".75" />
    </g>

    <g class="dragon-cuerpo">
      <path d="M113 139c8-28 34-43 66-39 28 4 45 25 47 50-1 23-21 39-50 42l-46-5c-23-6-33-25-17-48z" fill="url(#dragon-escama)" stroke="#bd9e59" stroke-width="3" />
      <path d="M146 151c18 7 38 7 62 0M144 163c17 7 34 8 51 5" fill="none" stroke="#d2b66c" stroke-width="2" opacity=".68" />
      <path d="M139 184c-7 12-13 18-25 22 17 8 34 1 43-14m33-3c7 12 18 18 33 17-8-13-12-24-12-35" fill="url(#dragon-escama)" stroke="#a78e58" stroke-width="2.5" stroke-linejoin="round" />
      <path d="m114 205 15 2m62-4 15 3" stroke="#d6bd79" stroke-width="2" />
    </g>

    <g class="dragon-ala dragon-ala-delantera">
      <path d="M173 126c8-41 33-69 70-87-10 28-5 42 12 49-21 1-31 10-30 25 18-11 34-12 48-5-24 11-40 30-48 57z" fill="url(#dragon-ala)" stroke="#d0b36a" stroke-width="3" stroke-linejoin="round" />
      <path d="m181 127 62-88m-19 60 31-11m-47 29 42-31" fill="none" stroke="#c6a95f" stroke-width="2" opacity=".8" />
    </g>

    <g class="dragon-cuello">
      <path d="M195 135c11-24 26-36 45-43l24 12c-20 6-32 18-39 41z" fill="url(#dragon-escama)" stroke="#bd9e59" stroke-width="2.5" />
      <path d="m217 103 8-20 10 15 13-22 6 23" fill="#bd9e59" stroke="#ead28d" stroke-width="2" stroke-linejoin="round" />
    </g>

    <g class="dragon-cabeza">
      <path d="M224 98c11-20 32-31 55-26 19 4 30 18 28 34l-8 17-29 9-35-9-15-12z" fill="url(#dragon-escama)" stroke="#d1b66e" stroke-width="3" />
      <path d="m240 79-1-26 17 17m22 4 15-25 2 31" fill="#315b58" stroke="#c5a95f" stroke-width="3" stroke-linejoin="round" />
      <path d="M274 99c10-3 18-1 24 4l-8 7-18-2z" fill="#172a32" stroke="#b28f54" stroke-width="2" />
      <path d="M278 89h8" stroke="#ffcf69" stroke-width="5" stroke-linecap="round" filter="url(#dragon-resplandor)" />
      <circle cx="282" cy="89" r="2" fill="#fff3c2" />
      <path d="m302 106 10 4-11 5" fill="none" stroke="#ddb65d" stroke-width="2" />
      <path d="M244 111c13 9 28 13 45 10" fill="none" stroke="#e2c477" stroke-width="2" opacity=".7" />
    </g>

    <g class="dragon-brasa" filter="url(#dragon-resplandor)">
      <circle cx="314" cy="114" r="16" fill="url(#dragon-brasa)" />
      <path d="M306 114c-5-5-4-9-1-12 1 5 5 5 6 8 1-6 5-8 9-10-3 7-1 10 4 12-5 5-11 6-18 2z" fill="#ffbf4f" opacity=".85" />
    </g>
  </svg>
</template>

<style scoped>
.dragon-art {
  display: block;
  overflow: visible;
  transform-origin: 52% 84%;
  animation: dragon-respirar 4.8s ease-in-out infinite;
}

.dragon-sombra { fill: rgba(0, 0, 0, .42); filter: blur(5px); animation: dragon-sombra 4.8s ease-in-out infinite; }
.dragon-cola { transform-origin: 130px 154px; animation: dragon-cola 5.5s ease-in-out infinite; }
.dragon-ala { transform-box: fill-box; }
.dragon-ala-trasera { transform-origin: 92% 92%; animation: dragon-ala-atras 5s ease-in-out infinite; }
.dragon-ala-delantera { transform-origin: 8% 90%; animation: dragon-ala-adelante 5s ease-in-out infinite; }
.dragon-cabeza { transform-origin: 235px 140px; animation: dragon-mirar 7s ease-in-out infinite; }
.dragon-brasa { animation: dragon-brasa 2.4s ease-in-out infinite; }

@keyframes dragon-respirar {
  0%, 100% { transform: translateY(2px) scaleY(.99); }
  50% { transform: translateY(-3px) scaleY(1.015); }
}
@keyframes dragon-sombra {
  0%, 100% { opacity: .52; transform: scaleX(1); }
  50% { opacity: .34; transform: scaleX(.92); }
}
@keyframes dragon-cola {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(2.5deg); }
}
@keyframes dragon-ala-atras {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(3deg); }
}
@keyframes dragon-ala-adelante {
  0%, 100% { transform: rotate(1deg); }
  50% { transform: rotate(-3deg); }
}
@keyframes dragon-mirar {
  0%, 77%, 83%, 100% { transform: translateY(0); }
  80% { transform: translateY(3px); }
}
@keyframes dragon-brasa {
  0%, 100% { opacity: .5; transform: scale(.88); }
  50% { opacity: 1; transform: scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .dragon-art,
  .dragon-sombra,
  .dragon-cola,
  .dragon-ala,
  .dragon-cabeza,
  .dragon-brasa { animation: none; }
}
</style>

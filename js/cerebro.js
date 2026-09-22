/* Fundo animado: cérebro de neurônios que reage a cada slide (foco, luz, layout)
   e se transforma em coração na virada para o final.

   API pública usada por paginas.js e final.js:
     definirFoco(chave)     - qual região do cérebro brilha (ver FOCOS abaixo)
     definirLuz(v)          - 0..1, quantos nós já estão "acesos"
     definirMorph(v)        - 0..1, transição pra forma de coração
     definirLayout(tipo)    - 'intro' | 'texto' | 'foto' | 'final', reposiciona o cérebro na tela
     apagarFundo()          - zera a opacidade (usado ao entrar no grand finale)
     definirEmFinal(bool)   - pausa os coraçõezinhos flutuantes enquanto o final roda
     onda(r, a)             - dispara uma onda avulsa (ex.: o "transbordando" do medidor)
     pulsoDeEntrada()       - onda + rajada de pulsos disparada a cada troca de slide
*/
import { reduz, sprite, viewport } from './compartilhado.js';

const cv = document.getElementById('ceu'), ctx = cv.getContext('2d');
let W = 0, H = 0;

function dentro(x, y) {
  const a = Math.atan2(y + .05, x), r = Math.hypot(x, (y + .05) / .7), bord = 1 + .045 * Math.sin(a * 9) + .03 * Math.sin(a * 14 + 1);
  const cortex = r < bord && y < .36 - .12 * Math.max(0, -x);
  const cereb = ((x - .55) / .34) ** 2 + ((y - .42) / .2) ** 2 < 1;
  const tronco = x > .12 && x < .36 && y > .25 && y < .9 && Math.abs((x - .24) - (y - .3) * .12) < .1;
  return cortex || cereb || tronco;
}
const NUC = { x: .02, y: .12 };
const FOCOS = { none: null, memoria: { x: .05, y: .1 }, recompensa: NUC, olfato: { x: -.78, y: .22 }, toque: { x: .05, y: -.58 }, tudo: { x: 0, y: 0 }, final: null };
const nos = [], arestas = [];
let tent = 0;
while (nos.length < 340 && tent < 50000) {
  tent++;
  const x = Math.random() * 2.2 - 1.1, y = Math.random() * 2 - 1;
  if (!dentro(x, y) || nos.some(n => (n.x - x) ** 2 + (n.y - y) ** 2 < .0048)) continue;
  nos.push({ x, y, ordem: Math.min(1, Math.hypot(x - NUC.x, y - NUC.y) / 1.15 + Math.random() * .12), luz: 0, br: 0, viz: [], f: Math.random() * 6.28, px: x, py: y });
}
nos.forEach((n, i) => {
  nos.map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 })).filter(o => o.j !== i && o.d < .028).sort((a, b) => a.d - b.d).slice(0, 3)
    .forEach(o => { if (!n.viz.includes(o.j)) { n.viz.push(o.j); nos[o.j].viz.push(i); arestas.push([i, o.j]) } });
});
/* pontos do coração para a transformação final */
(function () {
  const pts = []; let k = 0;
  while (pts.length < nos.length && k < 200000) {
    k++;
    const x = Math.random() * 2.6 - 1.3, y = Math.random() * 2.6 - 1.2;
    if ((x * x + y * y - 1) ** 3 - x * x * y ** 3 < 0 && !pts.some(p => (p.x - x) ** 2 + (p.y - y) ** 2 < .006)) pts.push({ x, y });
  }
  while (pts.length < nos.length) pts.push(pts[(Math.random() * pts.length) | 0]);
  const bx = [Math.min(...nos.map(n => n.x)), Math.max(...nos.map(n => n.x))], by = [Math.min(...nos.map(n => n.y)), Math.max(...nos.map(n => n.y))];
  const usados = new Set();
  nos.forEach(n => {
    const u = (n.x - bx[0]) / (bx[1] - bx[0]) * 2.3 - 1.15, v = -((n.y - by[0]) / (by[1] - by[0]) * 2.3 - 1.05);
    let best = -1, bd = 1e9; pts.forEach((p, i) => { if (usados.has(i)) return; const d = (p.x - u) ** 2 + (p.y - v) ** 2; if (d < bd) { bd = d; best = i } });
    usados.add(best); n.hx = pts[best].x * .78; n.hy = -pts[best].y * .78 + .12;
  });
})();

let luzAlvo = .04, foco = null, pulsos = [], ondas = [], coracoes = [], morph = 0, morphAlvo = 0, emFinalFundo = false;
const poeira = Array.from({ length: 45 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + .3, v: Math.random() * .00008 + .00003, f: Math.random() * 6.28 }));
const lay = { x: .5, y: .3, s: 1, a: .9 }, layAlvo = { ...lay };

const LAYOUTS_MOVEL = { intro: { x: .5, y: .3, s: 1, a: .9 }, texto: { x: .5, y: .27, s: .95, a: .85 }, foto: { x: .5, y: .1, s: .38, a: .5 }, final: { x: .5, y: .25, s: 1.05, a: 1 } };
const LAYOUTS_DESKTOP = { intro: { x: .5, y: .26, s: .95, a: .9 }, texto: { x: .5, y: .24, s: .9, a: .85 }, foto: { x: .5, y: .5, s: 1.9, a: .18 }, final: { x: .5, y: .2, s: .75, a: 1 } };
let tipoAtual = 'intro';
function aplicarLayout() {
  const L = (W < 761 ? LAYOUTS_MOVEL : LAYOUTS_DESKTOP)[tipoAtual];
  if (L) Object.assign(layAlvo, L);
}

function redim() {
  const d = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  viewport.W = W; viewport.H = H;
  cv.width = W * d; cv.height = H * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', () => { redim(); aplicarLayout(); });
redim();

const mix = t => `${(255 - 11 * t) | 0},${(123 + 76 * t) | 0},${(176 - 70 * t) | 0}`;
function desenhaCoracao(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * .3); ctx.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3); ctx.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s); ctx.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3); ctx.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); ctx.fill() }

let t0 = performance.now();
function quadro(agora) {
  const dt = Math.min(50, agora - t0); t0 = agora; const tt = agora / 1000;
  for (const k in lay) lay[k] += (layAlvo[k] - lay[k]) * .045;
  morph += (morphAlvo - morph) * .025; const m = morph < .5 ? 2 * morph * morph : 1 - (-2 * morph + 2) ** 2 / 2;
  ctx.clearRect(0, 0, W, H);

  poeira.forEach(p => { p.y -= p.v * dt; if (p.y < -.02) p.y = 1.02; ctx.fillStyle = `rgba(244,199,106,${.15 + .15 * Math.sin(tt + p.f)})`; ctx.beginPath(); ctx.arc(p.x * W + Math.sin(tt * .3 + p.f) * 8, p.y * H, p.r, 0, 6.28); ctx.fill() });

  const bat = m > .5 ? 1 + .06 * Math.max(0, Math.sin(tt * 5.2)) ** 8 : 1;
  const base = Math.min(W * .42, H * .28) * lay.s * (1 + .012 * Math.sin(tt * 1.2)) * bat;
  const cx = W * lay.x, cy = H * lay.y;
  nos.forEach(n => {
    n.px = cx + (n.x + (n.hx - n.x) * m) * base; n.py = cy + (n.y + (n.hy - n.y) * m) * base;
    n.luz += ((n.ordem < luzAlvo ? 1 : 0) - n.luz) * .02;
    let b = 0; if (foco) { const d = Math.hypot(n.x - foco.x, n.y - foco.y); b = Math.max(0, 1 - d / .42) * (.6 + .4 * Math.sin(tt * 2.4 + n.f)) }
    n.br += (b - n.br) * .05;
  });

  ondas = ondas.filter(o => {
    o.r += dt * .55; o.a -= dt * .0009; if (o.a <= 0) return false;
    ctx.strokeStyle = `rgba(244,199,106,${o.a})`; ctx.lineWidth = 1.5; ctx.beginPath(); if (o.r > 0) { ctx.arc(cx, cy, o.r, 0, 6.28); ctx.stroke() } return true
  });

  ctx.globalAlpha = lay.a; ctx.lineWidth = .8;
  arestas.forEach(([i, j]) => {
    const a = nos[i], b = nos[j], l = (a.luz + b.luz) / 2, e = (a.br + b.br) / 2;
    ctx.strokeStyle = `rgba(${mix(Math.max(l, m))},${(.07 + .28 * l + .3 * e) * (1 - .45 * m)})`; ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke()
  });
  nos.forEach(n => {
    const l = Math.min(1, n.luz + n.br * .8);
    ctx.fillStyle = `rgba(${mix(n.luz)},${.35 + .6 * l})`; ctx.beginPath(); ctx.arc(n.px, n.py, 1.1 + l * 1.6, 0, 6.28); ctx.fill();
    if (l > .05) { const s = (10 + l * 18) * (.85 + .15 * Math.sin(tt * 1.8 + n.f)); ctx.globalAlpha = lay.a * l * .55; ctx.drawImage(sprite, n.px - s / 2, n.py - s / 2, s, s); ctx.globalAlpha = lay.a }
  });

  const taxa = (reduz ? .02 : .08) + luzAlvo * (reduz ? .05 : .55);
  if (Math.random() < taxa * dt / 16) soltarPulso();
  pulsos = pulsos.filter(p => {
    p.p += dt / 240;
    if (p.p >= 1) { if (--p.s <= 0) return false; const nb = nos[p.b]; p.a = p.b; p.b = nb.viz[(Math.random() * nb.viz.length) | 0]; p.p = 0 }
    const a = nos[p.a], b = nos[p.b]; ctx.drawImage(sprite, a.px + (b.px - a.px) * p.p - 9, a.py + (b.py - a.py) * p.p - 9, 18, 18); return true
  });
  ctx.globalAlpha = 1;

  if (luzAlvo >= .9 && !emFinalFundo && !reduz && Math.random() < dt / (m > .5 ? 170 : 280)) coracoes.push({ x: Math.random() * W, y: H + 20, v: .03 + Math.random() * .05, s: 6 + Math.random() * 10, f: Math.random() * 6.28, a: .2 + Math.random() * .3 });
  coracoes = coracoes.filter(c => {
    c.y -= c.v * dt; const x = c.x + Math.sin(tt * 1.4 + c.f) * 14;
    ctx.fillStyle = `rgba(255,123,176,${c.a * Math.min(1, c.y / (H * .4))})`; desenhaCoracao(x, c.y, c.s); return c.y > -30
  });
  requestAnimationFrame(quadro);
}
function soltarPulso() {
  const c = nos.filter(n => n.luz > .5 || n.br > .3), o = c.length ? c[(Math.random() * c.length) | 0] : nos[(Math.random() * nos.length) | 0];
  if (o.viz.length) pulsos.push({ a: nos.indexOf(o), b: o.viz[(Math.random() * o.viz.length) | 0], p: 0, s: 3 + (Math.random() * 5 | 0) });
}
requestAnimationFrame(quadro);

export function definirFoco(chave) { foco = FOCOS[chave] || null; }
export function definirLuz(v) { luzAlvo = v; }
export function definirMorph(v) { morphAlvo = v; }
export function definirLayout(tipo) { tipoAtual = tipo; aplicarLayout(); }
export function apagarFundo() { layAlvo.a = 0; }
export function definirEmFinal(v) { emFinalFundo = v; }
export function onda(r = 10, a = .7) { ondas.push({ r, a }); }
export function pulsoDeEntrada() {
  onda(10, .7);
  if (!reduz) for (let k = 0; k < 22; k++) soltarPulso();
}

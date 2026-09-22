/* Grand finale: casal em silhueta -> partículas -> "M & D" -> coração -> brilho.

   Import circular intencional com paginas.js: paginas.js chama iniciarFinal()/estaNoFinal()
   daqui, e este arquivo chama ir() de lá (no clique de "Ver de novo"). Funciona porque as
   duas só são chamadas depois que os dois módulos terminaram de carregar (dentro de
   event handlers), nunca durante a avaliação inicial do módulo.
*/
import { reduz, sprite, viewport } from './compartilhado.js';
import { apagarFundo, definirEmFinal } from './cerebro.js';
import { pararSuave, reiniciarMusica } from './musica.js';
import { ir } from './paginas.js';
import { carregar as carregarCasal3D, estaPronto as casal3DPronto, desenharCasal3D, obterCanvas as obterCanvas3D } from './casal3d.js';

let emFinal = false;
const fim = document.getElementById('fim'), fx = fim.getContext('2d'), btnDeNovo = document.getElementById('denovo');
const sil = document.createElement('canvas'), sx = sil.getContext('2d');
let fD = 1, fT0 = 0, parts = [], fase = '', flash = 0, estrela = 0, batidasVibradas = 0, raf = null;
function redimFim() { fD = Math.min(2, devicePixelRatio || 1); fim.width = sil.width = viewport.W * fD; fim.height = sil.height = viewport.H * fD }
const ease = k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, cl = v => Math.max(0, Math.min(1, v));
function limb(c, x1, y1, x2, y2, w) { c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke() }

function homem(c, x, y, h, sw, emb, lean) {
  c.save(); c.translate(x, y); c.rotate(lean);
  c.beginPath(); c.arc(0, -.925 * h, .062 * h, 0, 6.283); c.fill();
  limb(c, 0, -.88 * h, 0, -.8 * h, .05 * h);
  c.beginPath(); c.moveTo(-.13 * h, -.8 * h); c.quadraticCurveTo(0, -.83 * h, .13 * h, -.8 * h); c.lineTo(.1 * h, -.47 * h); c.lineTo(-.1 * h, -.47 * h); c.closePath(); c.fill(); c.lineWidth = .04 * h; c.stroke();
  [[-1, sw], [1, -sw]].forEach(([sd, a]) => limb(c, sd * .05 * h, -.48 * h, sd * .05 * h + Math.sin(a) * .46 * h, -.48 * h + Math.cos(a) * .46 * h, .075 * h));
  const l = .34 * h;
  let ax = -.13 * h + Math.sin(-sw * .8) * l, ay = -.79 * h + Math.cos(sw * .8) * l; // braço que abraça
  ax += (-.24 * h - ax) * emb; ay += (-.64 * h - ay) * emb;
  c.beginPath(); c.lineWidth = .048 * h; c.moveTo(-.13 * h, -.79 * h); c.quadraticCurveTo(-.15 * h + (-.1 * h) * emb, -.62 * h - .08 * h * emb, ax, ay); c.stroke();
  limb(c, .13 * h, -.79 * h, .13 * h + Math.sin(sw * .8) * l, -.79 * h + Math.cos(sw * .8) * l, .048 * h);
  c.restore();
}
function mulher(c, x, y, h, sw, emb, lean) {
  c.save(); c.translate(x, y); c.rotate(lean);
  c.beginPath(); c.moveTo(.03 * h, -.985 * h); c.bezierCurveTo(-.12 * h, -.98 * h, -.15 * h, -.72 * h, -.11 * h - .02 * h * Math.sin(sw * 2), -.5 * h); c.lineTo(-.02 * h, -.62 * h); c.lineTo(.06 * h, -.9 * h); c.closePath(); c.fill();
  c.beginPath(); c.arc(0, -.925 * h, .06 * h, 0, 6.283); c.fill();
  limb(c, 0, -.88 * h, 0, -.8 * h, .045 * h);
  c.beginPath(); c.moveTo(-.1 * h, -.8 * h); c.quadraticCurveTo(0, -.825 * h, .1 * h, -.8 * h); c.lineTo(.065 * h, -.58 * h); c.lineTo(-.065 * h, -.58 * h); c.closePath(); c.fill(); c.lineWidth = .035 * h; c.stroke();
  const bal = Math.sin(sw) * .035 * h;
  c.beginPath(); c.moveTo(-.065 * h, -.6 * h); c.quadraticCurveTo(-.12 * h, -.4 * h, -.19 * h + bal, -.2 * h); c.quadraticCurveTo(0, -.17 * h, .19 * h + bal, -.2 * h); c.quadraticCurveTo(.12 * h, -.4 * h, .065 * h, -.6 * h); c.closePath(); c.fill();
  [[-1, sw * .7], [1, -sw * .7]].forEach(([sd, a]) => limb(c, sd * .04 * h, -.22 * h, sd * .04 * h + Math.sin(a) * .21 * h, -.22 * h + Math.cos(a) * .21 * h, .045 * h));
  const l = .31 * h;
  limb(c, -.105 * h, -.79 * h, -.105 * h + Math.sin(sw * .8) * l, -.79 * h + Math.cos(sw * .8) * l, .042 * h);
  let ax = .105 * h + Math.sin(-sw * .8) * l, ay = -.79 * h + Math.cos(sw * .8) * l; // braço que abraça
  ax += (.26 * h - ax) * emb; ay += (-.8 * h - ay) * emb;
  c.beginPath(); c.lineWidth = .042 * h; c.moveTo(.105 * h, -.79 * h); c.quadraticCurveTo(.16 * h, -.7 * h + (-.06 * h) * emb, ax, ay); c.stroke();
  c.restore();
}

function desenharCasal(t) {
  const W = viewport.W, H = viewport.H;
  const h = Math.min(H * .4, W * .78, 360), chao = H * .66, cx = W / 2;
  const pa = ease(cl((t - 1) / 4.2)), amp = Math.min(1, (1 - pa) * 5) * .32, dist = pa * W * .5, sw = Math.sin(dist / (h * .11)) * amp;
  const bob = -Math.abs(Math.sin(dist / (h * .11))) * .012 * h * amp * 3;
  const emb = ease(cl((t - 5.2) / .9));
  const xM = -h * .35 + (cx - .075 * h + h * .35) * pa, xD = W + h * .35 + (cx + .085 * h - W - h * .35) * pa;
  sx.setTransform(fD, 0, 0, fD, 0, 0); sx.clearRect(0, 0, W, H);
  sx.fillStyle = sx.strokeStyle = '#12071a'; sx.lineCap = sx.lineJoin = 'round';
  mulher(sx, xM, chao + bob, h * .93, sw, emb, .07 * emb);
  homem(sx, xD, chao + bob, h, -sw, emb, -.05 * emb);
  return { h, chao, cx };
}
function amostrarSil(n) {
  const d = sx.getImageData(0, 0, sil.width, sil.height).data, pts = [], st = Math.max(1, Math.round(2 * fD));
  for (let y = 0; y < sil.height; y += st) for (let x = 0; x < sil.width; x += st) if (d[(y * sil.width + x) * 4 + 3] > 120) pts.push({ x: x / fD, y: y / fD });
  return escolher(pts, n);
}
function escolher(pts, n) { const r = []; for (let i = 0; i < n; i++) r.push(pts[(Math.random() * pts.length) | 0] || { x: viewport.W / 2, y: viewport.H / 2 }); return r }
function pontosTexto(n) {
  const W = viewport.W, H = viewport.H;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  let fs = 150; g.font = `${fs}px Parisienne, "Snell Roundhand", cursive`; const w = g.measureText('M & D').width;
  fs = Math.min(fs * (W * .82) / w, fs * 1.4); g.font = `${fs}px Parisienne, "Snell Roundhand", cursive`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('M & D', W / 2, H * .45);
  const d = g.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 130) pts.push({ x, y });
  return escolher(pts, n);
}
function pontosCoracao(n) {
  const W = viewport.W, H = viewport.H;
  const R = Math.min(W, H) * .3, pts = [];
  while (pts.length < n) {
    const x = Math.random() * 2.6 - 1.3, y = Math.random() * 2.6 - 1.2;
    if ((x * x + y * y - 1) ** 3 - x * x * y ** 3 < 0) pts.push({ x: W / 2 + x * R * .95, y: H * .44 - y * R * .95 + R * .1 })
  }
  return pts;
}
function morfar(alvos, dur) {
  const idx = alvos.map((_, i) => i).sort(() => Math.random() - .5), agora = performance.now() / 1000;
  parts.forEach((p, i) => { p.ox = p.x; p.oy = p.y; p.tx = alvos[idx[i]].x; p.ty = alvos[idx[i]].y; p.t0 = agora + Math.random() * .7; p.dur = dur; p.curva = (Math.random() - .5) * 160 });
}

export function estaNoFinal() { return emFinal; }

// Usa o casal 3D assim que estiver pronto (carregado por iniciarFinal); se não
// carregou a tempo (ou falhou), cai pro desenho 2D original sem quebrar nada.
function desenharCasalAtivo(t) {
  if (casal3DPronto()) {
    const W = viewport.W, H = viewport.H, r = desenharCasal3D(t, W, H, fD);
    sx.setTransform(fD, 0, 0, fD, 0, 0); sx.clearRect(0, 0, W, H);
    sx.drawImage(obterCanvas3D(), 0, 0, W, H);
    return r;
  }
  return desenharCasal(t);
}

export function iniciarFinal() {
  if (emFinal) return; emFinal = true;
  carregarCasal3D(); // dispara o carregamento do Three.js já de cara, pra estar pronto quando o casal aparecer
  apagarFundo(); definirEmFinal(true); document.body.classList.add('final-on');
  redimFim(); fim.classList.add('on');
  parts = []; fase = 'casal'; flash = 0; estrela = 0; batidasVibradas = 0;
  fT0 = performance.now() / 1000;
  document.fonts && document.fonts.load('150px Parisienne');
  cancelAnimationFrame(raf); raf = requestAnimationFrame(quadroFinal);
}

function quadroFinal(agoraMs) {
  if (!emFinal) return; // encerrado (ex.: "ver de novo") — não redesenha nem reexibe o botão
  const W = viewport.W, H = viewport.H;
  const agora = agoraMs / 1000, t = agora - fT0, cx = W / 2;
  fx.setTransform(fD, 0, 0, fD, 0, 0); fx.clearRect(0, 0, W, H);

  // luz de fundo (contraluz do casal)
  const luz = cl((t - .3) / 2) * (1 - cl((t - 16.6) / 1.5));
  if (luz > 0) {
    const r = Math.min(W, H) * (.55 + .1 * cl((t - 5) / 2)), g = fx.createRadialGradient(cx, H * .45, 0, cx, H * .45, r);
    g.addColorStop(0, `rgba(244,199,106,${.28 * luz})`); g.addColorStop(.5, `rgba(255,123,176,${.12 * luz})`); g.addColorStop(1, 'rgba(255,123,176,0)');
    fx.fillStyle = g; fx.fillRect(0, 0, W, H)
  }

  if (t < 7.4) {
    const { h, chao } = desenharCasalAtivo(t);
    const aSil = cl((t - .6) / 1) * (1 - cl((t - 6.9) / .5));
    fx.save(); fx.globalAlpha = aSil;
    const lg = fx.createLinearGradient(0, chao, W, chao); lg.addColorStop(0, 'rgba(244,199,106,0)'); lg.addColorStop(.5, `rgba(244,199,106,${.5})`); lg.addColorStop(1, 'rgba(244,199,106,0)');
    fx.fillStyle = lg; fx.fillRect(0, chao - 1, W, 1.5);
    fx.shadowColor = 'rgba(244,199,106,.85)'; fx.shadowBlur = 26 * fD; fx.drawImage(sil, 0, 0, W, H);
    fx.shadowColor = 'rgba(255,123,176,.6)'; fx.shadowBlur = 8 * fD; fx.drawImage(sil, 0, 0, W, H);
    fx.restore();
  }
  if (t >= 6.8 && fase === 'casal') {
    fase = 'po'; const pts = amostrarSil(reduz ? 600 : 1300);
    parts = pts.map(p => ({ x: p.x, y: p.y, ox: p.x, oy: p.y, tx: p.x, ty: p.y, t0: 0, dur: 1, curva: 0, f: Math.random() * 6.28, vx: 0, vy: 0, a: 1 }));
    flash = .35;
  }
  if (t >= 7.6 && fase === 'po') { fase = 'letras'; morfar(pontosTexto(parts.length), 2) }
  if (t >= 11.6 && fase === 'letras') { fase = 'coracao'; morfar(pontosCoracao(parts.length), 1.8) }
  if (t >= 17.2 && fase === 'coracao') {
    fase = 'brilho'; flash = 1; navigator.vibrate && navigator.vibrate(80);
    parts.forEach(p => { const dx = p.x - cx, dy = p.y - H * .45, d = Math.hypot(dx, dy) || 1, v = 2 + Math.random() * 7; p.vx = dx / d * v + (Math.random() - .5) * 2; p.vy = dy / d * v + (Math.random() - .5) * 2 });
    pararSuave(5500);
  }

  // batidas do coração (tum-tum) x3
  let esc = 1;
  if (fase === 'coracao' && t > 13.6) {
    const k = (t - 13.6) % 1.15, n = Math.floor((t - 13.6) / 1.15);
    if (n < 3) {
      esc = 1 + .13 * Math.exp(-((k - .08) ** 2) / .003) + .08 * Math.exp(-((k - .34) ** 2) / .003);
      if (n >= batidasVibradas) { batidasVibradas = n + 1; navigator.vibrate && navigator.vibrate([45, 160, 35]) }
    }
  }

  parts.forEach(p => {
    if (fase === 'brilho') { p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.vy += .012; p.a -= .0075 }
    else if (p.t0) {
      const k = ease(cl((agora - p.t0) / p.dur)), mx = p.ox + (p.tx - p.ox) * k, my = p.oy + (p.ty - p.oy) * k, ondula = Math.sin(k * Math.PI) * p.curva;
      const dx = p.tx - p.ox, dy = p.ty - p.oy, L = Math.hypot(dx, dy) || 1; p.x = mx - dy / L * ondula; p.y = my + dx / L * ondula
    }
    if (p.a <= 0) return;
    let x = p.x, y = p.y; if (esc !== 1) { x = cx + (x - cx) * esc; y = H * .45 + (y - H * .45) * esc }
    const tw = .65 + .35 * Math.sin(agora * 3 + p.f), s = 8 * tw * (fase === 'coracao' ? 1 + (esc - 1) * 3 : 1);
    fx.globalAlpha = Math.max(0, p.a) * .8; fx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
    fx.globalAlpha = Math.max(0, p.a); fx.fillStyle = '#fff3d6'; fx.fillRect(x - .6, y - .6, 1.2, 1.2);
  });
  fx.globalAlpha = 1;

  if (flash > 0) {
    const r = Math.min(W, H) * (1.25 - flash) * .9, g = fx.createRadialGradient(cx, H * .45, 0, cx, H * .45, Math.max(1, r));
    g.addColorStop(0, `rgba(255,248,230,${flash})`); g.addColorStop(1, 'rgba(255,248,230,0)'); fx.fillStyle = g; fx.fillRect(0, 0, W, H); flash = Math.max(0, flash - .012)
  }

  if (fase === 'brilho') { // estrelinha que fica
    estrela = cl((t - 18.2) / 1.2) * (1 - cl((t - 22) / 2.5));
    if (estrela > 0) { const s = 22 * (.8 + .2 * Math.sin(agora * 4)); fx.globalAlpha = estrela; fx.drawImage(sprite, cx - s / 2, H * .45 - s / 2, s, s); fx.globalAlpha = 1 }
    if (t > 20.5) btnDeNovo.classList.add('on');
  }
  raf = requestAnimationFrame(quadroFinal);
}
addEventListener('resize', () => { if (emFinal) redimFim() });
btnDeNovo.addEventListener('click', e => {
  e.stopPropagation();
  emFinal = false; cancelAnimationFrame(raf); // encerra o loop já, antes de qualquer outra coisa
  btnDeNovo.classList.remove('on'); fim.classList.remove('on');
  document.body.classList.remove('final-on');
  definirEmFinal(false);
  reiniciarMusica();
  ir(0);
});

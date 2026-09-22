/* Grand finale: casal em partículas -> iniciais -> coração pulsando -> "Te amo
   para sempre" -> brilho.

   O casal nunca é desenhado como corpo sólido (isso é o que ficava esquisito).
   homem()/mulher()/desenharCasal() continuam existindo e com a mesma coreografia
   de sempre (caminhada, balanço, abraço), mas agora servem só de molde invisível:
   a cada ~90ms redesenha o casal num canvas offscreen e amostra pontos da
   silhueta pra virarem partículas, que perseguem esse alvo com um lerp suave.
   Isso já é a mesma estética de poeira que o resto do final usa (iniciais,
   coração), então o casal "chegando andando em poeira" encaixa com tudo.

   Import circular intencional com paginas.js: paginas.js chama iniciarFinal()/estaNoFinal()
   daqui, e este arquivo chama ir() de lá (no clique de "Ver de novo"). Funciona porque as
   duas só são chamadas depois que os dois módulos terminaram de carregar (dentro de
   event handlers), nunca durante a avaliação inicial do módulo.
*/
import { reduz, sprite, viewport } from './compartilhado.js';
import { apagarFundo, definirEmFinal } from './cerebro.js';
import { pararSuave, reiniciarMusica } from './musica.js';
import { ir } from './paginas.js';

// fronteiras das fases, em segundos desde o início do final (ajustadas visualmente)
const T_INICIAIS = 6.8, T_CORACAO = 10.8, T_AMOR = 16.4, T_BRILHO = 20.5;

let emFinal = false;
const fim = document.getElementById('fim'), fx = fim.getContext('2d'), btnDeNovo = document.getElementById('denovo');
const sil = document.createElement('canvas'), sx = sil.getContext('2d');
let fD = 1, fT0 = 0, parts = [], fase = '', flash = 0, estrela = 0, batidasVibradas = 0, raf = null, proximaAmostra = 0;
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
// Separa os pixels opacos da silhueta em "borda" (tem vizinho transparente
// pertinho) e "interior". Sem isso, uma silhueta preenchida amostrada por
// igual vira uma mancha difusa — dar mais peso à borda deixa o contorno de
// duas pessoas reconhecível, mesmo em movimento numa tela pequena.
function amostrarSilhueta() {
  const d = sx.getImageData(0, 0, sil.width, sil.height).data, largura = sil.width, altura = sil.height;
  const st = Math.max(1, Math.round(2 * fD)), margem = Math.max(2, Math.round(4 * fD));
  const alfa = (x, y) => (x < 0 || y < 0 || x >= largura || y >= altura) ? 0 : d[(y * largura + x) * 4 + 3];
  const borda = [], interior = [];
  for (let y = 0; y < altura; y += st) {
    for (let x = 0; x < largura; x += st) {
      if (alfa(x, y) <= 120) continue;
      const ponto = { x: x / fD, y: y / fD };
      const ehBorda = alfa(x - margem, y) <= 120 || alfa(x + margem, y) <= 120 || alfa(x, y - margem) <= 120 || alfa(x, y + margem) <= 120;
      (ehBorda ? borda : interior).push(ponto);
    }
  }
  return { borda, interior };
}
function escolher(pts, n) { const r = []; for (let i = 0; i < n; i++) r.push(pts[(Math.random() * pts.length) | 0] || { x: viewport.W / 2, y: viewport.H / 2 }); return r }
// Sorteia n pontos priorizando a borda (fracaoBorda de chance por partícula),
// caindo pro interior (ou vice-versa) quando um dos dois está vazio.
function escolherComPeso(borda, interior, n, fracaoBorda) {
  const r = [];
  for (let i = 0; i < n; i++) {
    const usarBorda = Math.random() < fracaoBorda ? borda.length > 0 : !(interior.length > 0);
    const pool = usarBorda ? borda : interior;
    r.push(pool.length ? pool[(Math.random() * pool.length) | 0] : { x: viewport.W / 2, y: viewport.H / 2 });
  }
  return r;
}
// texto pode ser uma string (uma linha) ou um array de linhas — quebrar frases
// longas em 2 linhas deixa a fonte bem maior (o auto-fit é pela linha mais
// larga, não pela frase inteira), o que é o que mais ajuda a legibilidade.
function pontosTexto(n, texto) {
  const W = viewport.W, H = viewport.H, linhas = Array.isArray(texto) ? texto : [texto];
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  let fs = 150; g.font = `${fs}px Parisienne, "Snell Roundhand", cursive`;
  const maiorLargura = Math.max(...linhas.map(l => g.measureText(l).width));
  fs = Math.min(fs * (W * .82) / maiorLargura, fs * 1.4); g.font = `${fs}px Parisienne, "Snell Roundhand", cursive`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  const alturaLinha = fs * .92, topo = H * .45 - alturaLinha * (linhas.length - 1) / 2;
  linhas.forEach((l, i) => g.fillText(l, W / 2, topo + i * alturaLinha));
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

// Redesenha o casal (molde invisível) e reamostra a nuvem de partículas que o
// persegue. Chamado a cada ~90ms durante a fase 'casal', não a cada quadro —
// getImageData custa caro demais pra rodar a 60fps o tempo todo.
function atualizarCasalEmParticulas(t) {
  desenharCasal(t);
  const { borda, interior } = amostrarSilhueta();
  if (borda.length + interior.length < 40) return; // casal ainda todo fora da tela (começo da caminhada) — espera ter silhueta real
  const alvo = escolherComPeso(borda, interior, reduz ? 600 : 1300, .72);
  if (!parts.length) {
    parts = alvo.map(p => ({ x: p.x, y: p.y, tx: p.x, ty: p.y, ox: p.x, oy: p.y, t0: 0, dur: 1, curva: 0, f: Math.random() * 6.28, vx: 0, vy: 0, a: 1 }));
    return;
  }
  const idx = alvo.map((_, i) => i).sort(() => Math.random() - .5);
  parts.forEach((p, i) => { const a = alvo[idx[i]]; if (a) { p.tx = a.x; p.ty = a.y } });
}

export function iniciarFinal() {
  if (emFinal) return; emFinal = true;
  apagarFundo(); definirEmFinal(true); document.body.classList.add('final-on');
  redimFim(); fim.classList.add('on');
  parts = []; fase = 'casal'; flash = 0; estrela = 0; batidasVibradas = 0; proximaAmostra = 0;
  fT0 = performance.now() / 1000;
  document.fonts && document.fonts.load('150px Parisienne');
  cancelAnimationFrame(raf); raf = requestAnimationFrame(quadroFinal);
}

function quadroFinal(agoraMs) {
  if (!emFinal) return; // encerrado (ex.: "ver de novo") — não redesenha nem reexibe o botão
  const W = viewport.W, H = viewport.H;
  const agora = agoraMs / 1000, t = agora - fT0, cx = W / 2;
  fx.setTransform(fD, 0, 0, fD, 0, 0); fx.clearRect(0, 0, W, H);

  // luz de fundo (contraluz do casal), some pouco antes do estouro final
  const luz = cl((t - .3) / 2) * (1 - cl((t - (T_BRILHO - .6)) / 1.5));
  if (luz > 0) {
    const r = Math.min(W, H) * (.55 + .1 * cl((t - 5) / 2)), g = fx.createRadialGradient(cx, H * .45, 0, cx, H * .45, r);
    g.addColorStop(0, `rgba(244,199,106,${.28 * luz})`); g.addColorStop(.5, `rgba(255,123,176,${.12 * luz})`); g.addColorStop(1, 'rgba(255,123,176,0)');
    fx.fillStyle = g; fx.fillRect(0, 0, W, H)
  }

  if (fase === 'casal' && agora >= proximaAmostra) {
    proximaAmostra = agora + .09;
    atualizarCasalEmParticulas(t);
  }
  if (t >= T_INICIAIS && fase === 'casal') { fase = 'iniciais'; morfar(pontosTexto(parts.length, 'M & D'), 2); flash = .35 }
  if (t >= T_CORACAO && fase === 'iniciais') { fase = 'coracao'; morfar(pontosCoracao(parts.length), 1.8) }
  if (t >= T_AMOR && fase === 'coracao') { fase = 'amor'; morfar(pontosTexto(parts.length, ['Te amo', 'para sempre']), 1.8) }
  if (t >= T_BRILHO && fase === 'amor') {
    fase = 'brilho'; flash = 1; navigator.vibrate && navigator.vibrate(80);
    parts.forEach(p => { const dx = p.x - cx, dy = p.y - H * .45, d = Math.hypot(dx, dy) || 1, v = 2 + Math.random() * 7; p.vx = dx / d * v + (Math.random() - .5) * 2; p.vy = dy / d * v + (Math.random() - .5) * 2 });
    pararSuave(5500);
  }

  // batidas do coração (tum-tum) x3
  let esc = 1;
  if (fase === 'coracao' && t > T_CORACAO + 2) {
    const k = (t - (T_CORACAO + 2)) % 1.15, n = Math.floor((t - (T_CORACAO + 2)) / 1.15);
    if (n < 3) {
      esc = 1 + .13 * Math.exp(-((k - .08) ** 2) / .003) + .08 * Math.exp(-((k - .34) ** 2) / .003);
      if (n >= batidasVibradas) { batidasVibradas = n + 1; navigator.vibrate && navigator.vibrate([45, 160, 35]) }
    }
  }

  parts.forEach(p => {
    if (fase === 'casal') { p.x += (p.tx - p.x) * .15; p.y += (p.ty - p.y) * .15 }
    else if (fase === 'brilho') { p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.vy += .012; p.a -= .0075 }
    else if (p.t0) {
      const k = ease(cl((agora - p.t0) / p.dur)), mx = p.ox + (p.tx - p.ox) * k, my = p.oy + (p.ty - p.oy) * k, ondula = Math.sin(k * Math.PI) * p.curva;
      const dx = p.tx - p.ox, dy = p.ty - p.oy, L = Math.hypot(dx, dy) || 1; p.x = mx - dy / L * ondula; p.y = my + dx / L * ondula
    }
    if (p.a <= 0) return;
    let x = p.x, y = p.y; if (esc !== 1) { x = cx + (x - cx) * esc; y = H * .45 + (y - H * .45) * esc }
    const eTexto = fase === 'iniciais' || fase === 'amor';
    const base = eTexto ? 5.5 : fase === 'casal' ? 6 : 8;
    const tw = .65 + .35 * Math.sin(agora * 3 + p.f), s = base * tw * (fase === 'coracao' ? 1 + (esc - 1) * 3 : 1);
    const nucleo = eTexto || fase === 'casal' ? 1.6 : 1.2;
    fx.globalAlpha = Math.max(0, p.a) * .8; fx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
    fx.globalAlpha = Math.max(0, p.a); fx.fillStyle = '#fff3d6'; fx.fillRect(x - nucleo / 2, y - nucleo / 2, nucleo, nucleo);
  });
  fx.globalAlpha = 1;

  if (flash > 0) {
    const r = Math.min(W, H) * (1.25 - flash) * .9, g = fx.createRadialGradient(cx, H * .45, 0, cx, H * .45, Math.max(1, r));
    g.addColorStop(0, `rgba(255,248,230,${flash})`); g.addColorStop(1, 'rgba(255,248,230,0)'); fx.fillStyle = g; fx.fillRect(0, 0, W, H); flash = Math.max(0, flash - .012)
  }

  if (fase === 'brilho') { // estrelinha que fica
    estrela = cl((t - (T_BRILHO + 1)) / 1.2) * (1 - cl((t - (T_BRILHO + 4.8)) / 2.5));
    if (estrela > 0) { const s = 22 * (.8 + .2 * Math.sin(agora * 4)); fx.globalAlpha = estrela; fx.drawImage(sprite, cx - s / 2, H * .45 - s / 2, s, s); fx.globalAlpha = 1 }
    if (t > T_BRILHO + 3.3) btnDeNovo.classList.add('on');
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

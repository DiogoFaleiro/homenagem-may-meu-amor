/* Slides: renderiza as fotos, monta o efeito letra-por-letra, controla a navegação
   e o medidor de dopamina.

   Import circular intencional com final.js: chamamos iniciarFinal()/estaNoFinal() de lá,
   e final.js chama ir() daqui (no clique de "Ver de novo"). Funciona porque as duas só são
   chamadas dentro de event handlers, depois que os dois módulos já terminaram de carregar.
*/
import { FOTOS } from './dados-fotos.js';
import { viewport } from './compartilhado.js';
import { definirFoco, definirLuz, definirMorph, definirLayout, pulsoDeEntrada, onda } from './cerebro.js';
import { iniciarFinal, estaNoFinal } from './final.js';

const svgCor = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" stroke="#f4c76a" stroke-width="1.2"/></svg>';
document.querySelectorAll('[data-fotos]').forEach(b => {
  b.innerHTML = b.dataset.fotos.split(',').map(i => {
    const f = FOTOS[+i];
    return f.src ? `<div class="foto${f.formato === 'h' ? ' paisagem' : ''}"><img src="${f.src}" alt="${f.legenda}"></div>` : `<div class="foto vazia">${svgCor}<span>${f.legenda}</span></div>`
  }).join('');
});

/* ===== TEXTO LETRA POR LETRA ===== */
const slides = [...document.querySelectorAll('.slide')];
slides.forEach(s => {
  let t = .55;
  s.querySelectorAll('[data-r], .bloco').forEach(el => {
    if (el.classList.contains('bloco')) { el.style.setProperty('--d', t + 's'); el.dataset.t = t; t += .7; return; }
    const vel = parseFloat(el.dataset.vel || '.032');
    const palavras = el.textContent.trim().split(/\s+/); el.textContent = '';
    palavras.forEach((w, wi) => {
      const pw = document.createElement('span'); pw.className = 'palavra';
      [...w].forEach(c => { const l = document.createElement('span'); l.className = 'letra'; l.textContent = c; l.style.setProperty('--d', t.toFixed(3) + 's'); t += vel; pw.appendChild(l) });
      el.appendChild(pw); if (wi < palavras.length - 1) { el.appendChild(document.createTextNode(' ')); t += vel }
    });
    el.setAttribute('aria-label', palavras.join(' '));
    t += .35;
  });
  s.dataset.fim = t + .6;
});

/* ===== NAVEGAÇÃO ===== */
const pontos = document.getElementById('pontos'); slides.forEach(() => pontos.appendChild(document.createElement('span')));
let atual = 0, inicio = 0, timers = [];

export function ir(i) {
  if (i < 0 || i >= slides.length) return;
  timers.forEach(clearTimeout); timers = [];
  slides[atual].classList.remove('ativo', 'completo');
  atual = i; const s = slides[i]; s.classList.add('ativo'); inicio = performance.now();
  definirLuz(parseFloat(s.dataset.luz)); definirFoco(s.dataset.foco);
  const morph = s.dataset.foco === 'final' ? 1 : 0;
  definirMorph(morph);
  definirLayout(s.dataset.lay);
  pulsoDeEntrada();
  [...pontos.children].forEach((p, k) => p.classList.toggle('on', k === i));
  document.getElementById('voltar').disabled = i === 0; document.getElementById('avancar').disabled = false;
  if (s.hasAttribute('data-medidor')) medidor(s);
  if (morph) timers.push(setTimeout(() => navigator.vibrate && navigator.vibrate([30, 80, 30]), 1800));
}
function medidor(s) {
  const e = document.getElementById('enchimento'), pc = document.getElementById('percentual'), tr = document.getElementById('transborda');
  e.style.transition = 'none'; e.style.width = '0'; pc.textContent = '0%'; tr.textContent = '';
  const d = parseFloat(s.querySelector('[data-marca]').dataset.t) * 1000 + 500;
  timers.push(setTimeout(() => {
    e.style.transition = ''; e.style.width = '100%'; let v = 0;
    const iv = setInterval(() => {
      v += Math.max(.6, (100 - v) * .05);
      if (v >= 100) {
        v = 100; clearInterval(iv);
        escrever(tr, 'transbordando de você'); onda(10, .9); onda(-60, .9); navigator.vibrate && navigator.vibrate(40)
      }
      pc.textContent = Math.round(v) + '%'
    }, 45); timers.push(iv)
  }, d));
}
function escrever(el, txt) { el.innerHTML = ''; [...txt].forEach((c, k) => { const l = document.createElement('span'); l.className = 'letra'; l.textContent = c === ' ' ? ' ' : c; l.style.setProperty('--d', (k * .045) + 's'); el.appendChild(l) }) }

function avancar() {
  const s = slides[atual];
  if ((performance.now() - inicio) / 1000 < parseFloat(s.dataset.fim) && !s.classList.contains('completo')) { s.classList.add('completo'); return }
  if (atual === slides.length - 1) {
    timers.forEach(clearTimeout); timers = [];
    s.classList.remove('ativo', 'completo');
    iniciarFinal();
    return;
  }
  ir(atual + 1);
}
document.getElementById('palco').addEventListener('click', e => { if (estaNoFinal()) return; e.clientX < viewport.W * .25 ? ir(atual - 1) : avancar() });
document.getElementById('voltar').addEventListener('click', e => { e.stopPropagation(); ir(atual - 1) });
document.getElementById('avancar').addEventListener('click', e => { e.stopPropagation(); avancar() });
addEventListener('keydown', e => { if (estaNoFinal()) return; if (['ArrowRight', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); avancar() } if (e.key === 'ArrowLeft') ir(atual - 1) });

ir(0);

/* Música: fade suave, autoplay no primeiro gesto do usuário, botão de mudo.

   API pública usada por final.js:
     pararSuave(ms)      - fade até 0 e pausa (usado no clímax do grand finale)
     reiniciarMusica()   - volta ao início e toca de novo (usado em "Ver de novo")
*/
const musica = document.getElementById('musica'), btnSom = document.getElementById('som');
let tocando = false, iniciada = false;

let fadeId = 0;
function fade(alvo, ms, depois) {
  const id = ++fadeId, ini = musica.volume, t = performance.now();
  (function passo(agora) {
    if (id !== fadeId) return; // um fade mais novo assumiu o controle
    const k = Math.min(1, (agora - t) / ms); musica.volume = Math.max(0, Math.min(1, ini + (alvo - ini) * k));
    if (k < 1) requestAnimationFrame(passo); else depois && depois();
  })(t);
}

function iniciarMusica() {
  if (iniciada) return; iniciada = true;
  musica.volume = 0;
  musica.play().then(() => { tocando = true; fade(.85, 3500); btnSom.classList.add('visivel') }).catch(() => { iniciada = false });
}
btnSom.addEventListener('click', e => {
  e.stopPropagation();
  if (tocando) { fade(0, 600, () => musica.pause()); tocando = false; btnSom.classList.add('mudo'); btnSom.setAttribute('aria-label', 'Tocar música') }
  else { musica.play().catch(() => {}); fade(.85, 1200); tocando = true; btnSom.classList.remove('mudo'); btnSom.setAttribute('aria-label', 'Pausar música') }
});
['click', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, iniciarMusica, { passive: true }));
musica.addEventListener('ended', () => { tocando = false; btnSom.classList.add('mudo') });

export function pararSuave(ms) {
  if (!tocando) return;
  fade(0, ms, () => { musica.pause(); tocando = false });
}
export function reiniciarMusica() {
  musica.currentTime = 0; musica.volume = 0;
  musica.play().then(() => { tocando = true; fade(.85, 3000); btnSom.classList.remove('mudo') }).catch(() => {});
}

/* Estado e utilitários compartilhados entre o fundo animado (cerebro.js) e o final (final.js). */

export const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tamanho da tela em CSS px — cerebro.js mantém isso atualizado (ele já escuta 'resize'
// para redimensionar o próprio canvas), e final.js só lê daqui pra dimensionar o seu.
export const viewport = { W: 0, H: 0 };

// Sprite de brilho (partícula/glow) usado tanto pelos nós do cérebro quanto pelas partículas do final.
export const sprite = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,240,200,1)');
  gr.addColorStop(.25, 'rgba(244,199,106,.75)');
  gr.addColorStop(1, 'rgba(255,123,176,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
})();

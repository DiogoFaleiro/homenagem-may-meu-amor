/* Casal em 3D de verdade (Three.js) pro grand finale: dois bonecos estilizados
   (cápsulas + esferas, tipo boneco de madeira) que andam um em direção ao outro
   e se abraçam, com luz e volume reais em vez do silhueta 2D chapada.

   Carregado sob demanda (dynamic import) só quando o final começa, pra não pesar
   o carregamento inicial da página. Se falhar (offline, CDN bloqueado, sem WebGL),
   quem chama isso (final.js) cai de volta pro desenho 2D original — ver estaPronto().

   API pública:
     carregar()                    - dispara o carregamento (chamar assim que o final começa)
     estaPronto()                  - true quando já dá pra chamar desenharCasal3D
     desenharCasal3D(t, W, H, fD)  - anima e renderiza um quadro; retorna {h, chao} igual à versão 2D
     obterCanvas()                 - o canvas (offscreen) onde o quadro foi desenhado
*/

let THREE = null, pronto = false, falhou = false;
let renderer, scene, camera, canvas3d;
let mulherRig, homemRig;
let ultimoW = 0, ultimoH = 0, ultimoFD = 0;

const ease = k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
const cl = v => Math.max(0, Math.min(1, v));

export function carregar() {
  if (THREE || falhou) return;
  import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.min.js')
    .then(mod => {
      THREE = mod;
      try { construirCena(); pronto = true; }
      catch { falhou = true; }
    })
    .catch(() => { falhou = true; });
}
export function estaPronto() { return pronto; }

function construirCena() {
  canvas3d = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 10, 10000);

  scene.add(new THREE.AmbientLight(0x2c1335, 1.1));
  const luzOuro = new THREE.DirectionalLight(0xf4c76a, 2.4);
  luzOuro.position.set(-120, 260, 220);
  scene.add(luzOuro);
  const luzRosa = new THREE.DirectionalLight(0xff7bb0, 1.3);
  luzRosa.position.set(180, 120, 160);
  scene.add(luzRosa);

  mulherRig = criarFigura(true);
  homemRig = criarFigura(false);
  scene.add(mulherRig.root, homemRig.root);
}

function criarFigura(comSaia) {
  const matCorpo = new THREE.MeshStandardMaterial({ color: comSaia ? 0x241432 : 0x1c0f22, roughness: .45, metalness: .12 });
  const matAcento = new THREE.MeshStandardMaterial({ color: comSaia ? 0x33193f : 0x1c0f22, roughness: .5, metalness: .08 });

  const root = new THREE.Group();

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), matCorpo);
  cabeca.position.y = .90;
  root.add(cabeca);

  if (comSaia) {
    const cabelo = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .34, 4, 8), matAcento);
    cabelo.position.set(0, .78, -.11);
    cabelo.rotation.x = .18;
    root.add(cabelo);
  }

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.115, .24, 4, 8), matCorpo);
  torso.position.y = .655;
  root.add(torso);

  if (comSaia) {
    const saia = new THREE.Mesh(new THREE.CylinderGeometry(.15, .30, .26, 12, 1, true), matAcento);
    saia.position.y = .40;
    root.add(saia);
  }

  function criarMembro(comprimento, raio, mat) {
    const pivo = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(raio, comprimento * .72, 4, 8), mat);
    m.position.y = -comprimento / 2;
    pivo.add(m);
    return pivo;
  }

  const quadrilEsq = criarMembro(.5, .075, matCorpo); quadrilEsq.position.set(-.09, .5, 0);
  const quadrilDir = criarMembro(.5, .075, matCorpo); quadrilDir.position.set(.09, .5, 0);
  root.add(quadrilEsq, quadrilDir);

  const ombroEsq = criarMembro(.36, .06, matCorpo); ombroEsq.position.set(-.15, .79, 0);
  const ombroDir = criarMembro(.36, .06, matCorpo); ombroDir.position.set(.15, .79, 0);
  root.add(ombroEsq, ombroDir);

  return { root, quadrilEsq, quadrilDir, ombroEsq, ombroDir };
}

function posarFigura(rig, x, y, h, sw, emb, lean, viraDir) {
  rig.root.position.set(x, y, 0);
  rig.root.scale.setScalar(h);
  rig.root.rotation.z = lean;

  const rumo = viraDir ? 1 : -1; // pra que lado fica o parceiro (mulher olha pra +x, homem pra -x)
  rig.quadrilEsq.rotation.z = sw * rumo;
  rig.quadrilDir.rotation.z = -sw * rumo;

  // o braço "de dentro" (voltado pro parceiro) é quem abraça; o "de fora" só continua balançando
  const interno = viraDir ? rig.ombroDir : rig.ombroEsq;
  const externo = viraDir ? rig.ombroEsq : rig.ombroDir;
  externo.rotation.set(0, 0, -sw * .8 * rumo);

  const balanco = sw * .8 * rumo;
  const abraco = rumo * 1.4; // gira o braço de "caído" pra "esticado na direção do parceiro"
  interno.rotation.set(.35 * emb, 0, balanco + (abraco - balanco) * emb);
}

export function desenharCasal3D(t, W, H, fD) {
  if (W !== ultimoW || H !== ultimoH || fD !== ultimoFD) {
    ultimoW = W; ultimoH = H; ultimoFD = fD;
    canvas3d.width = W * fD; canvas3d.height = H * fD;
    renderer.setPixelRatio(1); // o canvas já está no tamanho final em px reais
    renderer.setSize(W * fD, H * fD, false);
    camera.aspect = W / H;
    const dist = (H / 2) / Math.tan(camera.fov * Math.PI / 360);
    camera.position.set(W / 2, H / 2, dist);
    camera.lookAt(W / 2, H / 2, 0);
    camera.updateProjectionMatrix();
  }

  const h = Math.min(H * .4, W * .78, 360), chao = H * .66;
  const pa = ease(cl((t - 1) / 4.2)), amp = Math.min(1, (1 - pa) * 5) * .32, dist2 = pa * W * .5, sw = Math.sin(dist2 / (h * .11)) * amp;
  const bob = -Math.abs(Math.sin(dist2 / (h * .11))) * .012 * h * amp * 3;
  const emb = ease(cl((t - 5.2) / .9));
  const cx = W / 2;
  const xM = -h * .35 + (cx - .075 * h + h * .35) * pa, xD = W + h * .35 + (cx + .085 * h - W - h * .35) * pa;

  const pesY = H - (chao + bob); // canvas cresce pra baixo, o mundo 3D cresce pra cima
  posarFigura(mulherRig, xM, pesY, h * .93, sw, emb, .07 * emb, true);
  posarFigura(homemRig, xD, pesY, h, -sw, emb, -.05 * emb, false);

  renderer.render(scene, camera);
  return { h, chao };
}

export function obterCanvas() { return canvas3d; }

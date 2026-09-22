/* Ponto de entrada da página — só amarra os módulos.
   A lógica de cada peça mora no arquivo com esse nome:
     compartilhado.js  - estado/utilitários usados por mais de um módulo
     cerebro.js        - fundo animado do cérebro de neurônios
     musica.js         - trilha sonora
     final.js          - grand finale (casal, coração, "Ver de novo")
     paginas.js        - fotos, texto letra-por-letra e navegação entre slides

   Módulos ES são avaliados só uma vez e antes de qualquer código deles rodar,
   então a ordem destas linhas não muda o comportamento — está assim só pra
   documentar a peça inteira num único lugar. */
import './compartilhado.js';
import './cerebro.js';
import './musica.js';
import './final.js';
import './paginas.js';

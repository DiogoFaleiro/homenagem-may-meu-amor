# Para Maynara

Uma homenagem em página única: fundo animado de um "cérebro de neurônios" que reage a
cada slide, fotos, uma trilha sonora e um grand finale animado em canvas.

## Estrutura

```
index.html
css/estilo.css      estilos
js/
  compartilhado.js  estado e utilitários usados por mais de um módulo
  cerebro.js        fundo animado do cérebro de neurônios
  dados-fotos.js     legendas e caminhos das fotos
  paginas.js          texto letra-por-letra e navegação entre slides
  musica.js            trilha sonora
  final.js               grand finale (casal, coração, "Ver de novo")
  principal.js             ponto de entrada
assets/              música e fotos
```

## Rodando localmente

O `index.html` usa módulos ES (`<script type="module">`), que os navegadores só
carregam via `http(s)://`, não abrindo o arquivo direto (`file://`). Para testar:

```
python -m http.server
```

e abrir `http://localhost:8000` no navegador.

## Publicando

Hospedado via GitHub Pages a partir da branch `main`.

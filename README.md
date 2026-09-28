# Sem Volta pra Casa — versão 27.09

Jogo em pixel art do Markin: 15 dias no Rio sem voltar pra casa. Roda direto no navegador, sem instalar nada.

## Como abrir

- **Jogar:** abra `sem-volta-pra-casa.html` no Chrome (dois cliques). É o jogo inteiro num arquivo só, igual ao publicado.
- **Editar:** abra a pasta `fonte/` num editor (VS Code, por exemplo) e abra `fonte/index.html` no navegador pra testar. Salvou, deu F5.

## Pastas

| Arquivo | O que é |
| --- | --- |
| `sem-volta-pra-casa.html` | O jogo pronto, num arquivo só (7,4 MB). É esse que vai pro Claude/artefato. |
| `fonte/index.html` | A página (HTML) do jogo. |
| `fonte/jogo.js` | Todo o código do jogo (~300 KB). É aqui que se mexe. |
| `fonte/estilo.css` | Visual das telas, botões e balões. |
| `fonte/assets.js` | Músicas e fotos embutidas (base64). Não abra no editor: é enorme. |
| `fonte/juntar.py` | Junta tudo de volta em `sem-volta-pra-casa.html`. |
| `fonte/trocar_asset.py` | Troca uma música ou foto embutida. |
| `mapa-completo.png` | Print do mapa inteiro com todos os personagens e lugares marcados. |
| `referencias/` | O documento de alterações 27.09 e as fotos de referência (roupa, bandeira, boto, Rio Branco, ônibus, sax). |

## Depois de editar

```
cd fonte
python3 juntar.py
```

Isso regera `sem-volta-pra-casa.html` com as suas mudanças. Pra trocar uma música:

```
python3 trocar_asset.py FINAL_AUDIO minha-musica.mp3
python3 juntar.py
```

Nomes: `INICIO_AUDIO` (menu e intro), `MARACA_AUDIO` (torcida), `FESTA_AUDIO` (Circo Voador), `FINAL_AUDIO` (depois do chefão), `FACE_SRC` (rosto do Markin), `BALL_SRC` (bola), `SONO_SRC` (foto da derrota).

## Onde fica cada coisa no `jogo.js`

| Parte | Linha |
| --- | --- |
| Mapa da cidade | 24 |
| Fundo: prédios, lojas, Cristo, Circo Voador, navio | 216 |
| Nomes e cores das lojas | 223 |
| Markin no mapa (roupa, andar, respiração) | 280 |
| NPCs de lado | 486 |
| Rosto do Markin | 566 |
| Músicas | 719 |
| Botões do celular | 958 |
| Balões de fala | 998 |
| Andar sem diagonal | 1109 |
| Intro | 1185 |
| Final (bandeira, boto, navio) | 1247 |
| Tela final | 1432 |
| Loop do mapa (velocidade, itens, interações) | 1465 |
| Itens | 1583 |
| Cochilo (+3h, 12h de espera) | 1620 |
| Mãe | 1640 |
| Chave | 1663 |
| Preso e tonto 10s | 1693 |
| Tarefas | 1713 |
| Amigos do bloco | 1728 |
| Jamal e a banda | 535 |
| Músicos (LED e glitter) | 522 |
| NPCs da cidade | 1848 |
| Estandartes e faixas | 1988 |
| Markin de corpo inteiro nos desafios | 2019 |
| Desafio: SURF (regras e pontos) | 2067 |
| Desafio: SURF (física da onda) | 2090 |
| Desafio: SURF (desenho) | 2156 |
| Desafio: ALTINHA | 2211 |
| Desafio: BLOCO SECRETO (Rio Branco) | 2496 |
| Ônibus do Rio | 420 |
| Desafio: BAR | 2565 |
| Desafio: BAMBINA | 2712 |
| IA do Tubarão | 2694 |
| Desafio: CIRCO VOADOR | 2890 |
| Desafio final: SAXOFONE | 3135 |
| Desafio: MARACANÃ | 3236 |
| HUD | 3359 |
| Desenho do mapa | 3389 |

Dica: no editor, use Ctrl+F (Cmd+F no Mac) com o nome da função. Números que dá pra ajustar fácil:

- Velocidade do Markin: `let sp=52.5` dentro de `play(` (correr multiplica por 1,275).
- Cochilo: `REST_GAP=720` (12h) e `REST_GAIN={chair:10,bus:20}`.
- Altinha: `mg.touches>=8`.
- Surf: `SF={...META:2500,ONDA:18}` (meta de pontos e segundos por onda), pontos de cada manobra nas chamadas `surfPts(`, velocidade da espuma `const curl=62`.
- Maracanã: `MC_CONE=48` (largura da área vermelha) e `mcGuards()` (posição dos seguranças).
- Bambina: `snWob` (balanço do taco) e `const spd=` (velocidade da barra de força); IA em `snAiPlan`.
- Bar: `drowsy=(...)*.75` e `alpha=1.8*...` (equilíbrio da cabeça).

## O que mudou na 27.09

1. Ninguém anda na diagonal (Markin, mãe, tias, NPCs, galera).
2. Markin respira quando está parado.
3. Intro: "RECUSE A LIGAÇÃO", sem botão OK; tocar na tela passa as falas.
4. Cadeira e ponto de ônibus: "cochilar" = +3h na hora; cadeira +10, ponto +20; cada um só 12h depois.
5. Mate do Robson: 2 a cada 12h.
6. Animação de andar pros 4 lados (Markin e todos os personagens).
7. Novo desafio de SURF (bônus), no estilo do Kelly Slater do PS2 só que bem mais simples: 3 ondas; dropa na hora certa e surfa a parede subindo e descendo (↑ ↓). Descer ganha velocidade, subir gasta; ← faz cutback (volta pra espuma), → bombeia a prancha. Manobras: cavada, batida na crista, rasgada, cutback, aéreo (sobe rápido até o lábio e aperta MANOBRA; no ar, MANOBRA gira; tem que pousar reto) e tubo (alto e colado na espuma). Variar as manobras aumenta o combo até x3; repetir a mesma zera. Longe da espuma a onda morre; engolido pela espuma ou pouso torto = vaca (fica com metade dos pontos da onda). Meta: 2500 pontos nas 3 ondas. O Lucas fica na água incentivando e zoando; placa "AULA DE SURF" e prancha fincada na areia, depois do navio. Vencer dá +20, +3h e o Lucas entra pro bloco.
8. Altinha mais pra direita e com 8 toques.
9. "bizz bizz" tremendo no lugar de "bzz bzz".
10. Perdeu um desafio: a tela de tentar de novo aparece em cima do próprio desafio.
11. Bar 25% mais fácil de equilibrar.
12. Biscoito Globo virou Rei do Matte; a placa do Pão de Açúcar ficou verde.
13. Maracanã: seguranças mais separados; só te veem na área vermelha (mesmo parado); antes de invadir só um botão CORRE, que vira PULA no alambrado quebrado; lá dentro, PULA e CHUTA; carrinho começa antes; gol 25% mais alto.
14. Bambina: Tubarão erra a bola dele só 10% e encaçapa só 25%; na hora de escolher a bola que cai dá pra tocar na bola; derrubar a tua bola batendo primeiro na dele é falta, e se for a última tu perde; branca junto com a última também perde; taco balança 50% menos e a barra de força é 50% mais lenta.
15. A festa foi pro Circo Voador (na Lapa) e se chama Circo Voador.
16. Markin 25% mais lento.
17. Pó mágico dá +20; o dobro de cerveja no Maracanã e na Lapa.
18. De óculos, não aparece outro óculos no mapa.
19. Se soltou da mãe ou da chave: elas ficam tontas 10 s (estrelinhas) em vez de sumir.
20. Bloco Secreto com estandarte de carnaval; faixa do Heterotop caprichada.
21. Corrida do Bloco Secreto na Avenida Rio Branco (prédios, árvores, faixa vermelha, Theatro Municipal) com ônibus brancos de faixa verde, letreiro de LED e "AR CONDICIONADO".
22. Desafio final com cara de saxofone (corpo dourado, chaves de madrepérola), todos os amigos torcendo no fundo, Jamal com trombone, trompete, caixa e foliões de LED e glitter (no mapa também). Foliões do Bloco Secreto com LED e glitter.
23. Estandarte do Bloco do Markin com a cara dele no meio.
24. Final: a galera embarca, sobe a bandeira PARTIU PAQUETAAAAA, um boto cor de rosa de chapéu pula no mar, o navio zarpa e o boto vai do lado. A tela final fala "Boto Cor de Rosa".
25. Roupa nova do Markin (camiseta oversized marrom, cordões, bolsa transversal, jeans largo, tênis branco), mais bem desenhado e com braços nos desafios.

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
| `fonte/mapa/` | O mapa da cidade pro Tiled (veja "Editar o mapa no Tiled"). |
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

## Editar o mapa no Tiled

O mapa da cidade agora é feito no [Tiled](https://www.mapeditor.org/) (programa grátis de mapas). Os arquivos ficam em `fonte/mapa/`:

| Arquivo | O que é |
| --- | --- |
| `mapa.tmj` | O mapa. É esse que você abre no Tiled. |
| `cidade.png` | As peças do chão (grama, rua, calçada, areia, água, prédio, árvore...). |
| `mapa.js` | Cópia do mapa que o jogo lê. Gerado pelo Tiled, não edite na mão. |

1. Abra `fonte/mapa/mapa.tmj` no Tiled.
2. **Chão:** na camada `chao`, escolha uma peça no painel de tiles e pinte (tecla **B**). Pra saber qual peça é qual, clique nela e veja a "Classe" no painel de propriedades.
3. **Estabelecimentos:** na camada `estabelecimentos` cada retângulo é um prédio. Selecione com a tecla **S** pra arrastar, redimensionar ou copiar (Ctrl+C / Ctrl+V). No painel de propriedades:
   - **Nome** = o que aparece no letreiro (só letras sem acento, maiúsculas).
   - **Classe** = `loja` (com letreiro), `predio` (sem letreiro), `bar` (Bar da Cachaça) ou `sinuca` (Bambina).
   - `cor_letreiro`, `cor_letra`, `cor_toldo`, `cor_telhado` = cores; `caixa_dagua` = caixa d'água azul no telhado.
   - Pra criar um novo: tecla **R**, desenhe o retângulo encaixado na grade e preencha nome, classe e cores.
4. Salve (**Ctrl+S**) e exporte (**Ctrl+E**). O Ctrl+E regrava `mapa.js`. Depois dê F5 no jogo.

Cuidados: não mude o tamanho do mapa (80 × 60) nem mexa nas ruas principais, porque os carros e o ônibus andam por elas. O Maracanã, o Cristo, o Circo Voador, os Arcos da Lapa, o Pão de Açúcar e o navio ainda são desenhados no código, sempre no mesmo lugar.

## Onde fica cada coisa no `jogo.js`

| Parte | Linha |
| --- | --- |
| Mapa da cidade | 25 |
| Fundo: prédios, lojas, Cristo, Circo Voador, navio | 171 |
| Nomes e cores das lojas | 223 |
| Markin no mapa (roupa, andar, respiração) | 226 |
| NPCs de lado | 432 |
| Rosto do Markin | 512 |
| Músicas | 665 |
| Botões do celular | 904 |
| Balões de fala | 944 |
| Andar sem diagonal | 1055 |
| Intro | 1131 |
| Final (bandeira, boto, navio) | 1193 |
| Tela final | 1378 |
| Loop do mapa (velocidade, itens, interações) | 1411 |
| Itens | 1529 |
| Cochilo (+3h, 12h de espera) | 1566 |
| Mãe | 1586 |
| Chave | 1609 |
| Preso e tonto 10s | 1639 |
| Tarefas | 1659 |
| Amigos do bloco | 1674 |
| Jamal e a banda | 481 |
| Músicos (LED e glitter) | 468 |
| NPCs da cidade | 1794 |
| Estandartes e faixas | 1934 |
| Markin de corpo inteiro nos desafios | 1965 |
| Desafio: SURF (regras e pontos) | 2013 |
| Desafio: SURF (física da onda) | 2036 |
| Desafio: SURF (desenho) | 2102 |
| Desafio: ALTINHA | 2157 |
| Desafio: BLOCO SECRETO (Rio Branco) | 2442 |
| Ônibus do Rio | 366 |
| Desafio: BAR | 2511 |
| Desafio: BAMBINA | 2658 |
| IA do Tubarão | 2640 |
| Desafio: CIRCO VOADOR | 2836 |
| Desafio final: SAXOFONE | 3081 |
| Desafio: MARACANÃ | 3182 |
| HUD | 3305 |
| Desenho do mapa | 3335 |

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

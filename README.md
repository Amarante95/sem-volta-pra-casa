# Sem Volta pra Casa

Jogo em pixel art do Markin: 15 dias no Rio sem voltar pra casa. O código atual está em **[fonte/](fonte/index.html)**. Este é o diretório raiz do repositório Git.

## Comece por aqui

| Quero… | Abrir |
| --- | --- |
| Encontrar onde mudar algo no jogo | [Mapa por assunto](docs/estrutura.md) |
| Ver todos os arquivos, datas e tamanhos | [Catálogo](docs/catalogo.md) |
| Encontrar uma função ou seção do código | [Índice do código](docs/indice-codigo.md) |
| Orientar Codex, Claude ou outro agente | [AGENTS.md](AGENTS.md) |
| Consumir o catálogo em uma ferramenta | [Catálogo JSON](docs/catalogo.json) |
| Consultar artes, documentos e versões vindos da pasta JOAO | [Acervo do João](docs/acervo-joao.md) |
| Consultar versões, saídas e ferramentas vindas do ChatGPT | [Acervo do ChatGPT](docs/acervo-chatgpt.md) |
| Entender o que foi organizado | [Relatório de 03/10/2026](docs/organizacao-2026-10-03.md) |
| Consultar as instruções e alterações antigas | [Documento histórico da versão 27.09](docs/historico/versao-27-09.md) |

## Abrir o jogo atual

Com Node.js disponível, execute nesta pasta:

```powershell
node ferramentas/servir.cjs
```

Abra **http://127.0.0.1:5174/fonte/**. Encerre com Ctrl+C. Para outra porta: `node ferramentas/servir.cjs 5175`.

Use o servidor local para que as músicas carregadas por `fetch` funcionem. Abrir o HTML diretamente com dois cliques pode restringir esses carregamentos. O servidor aponta para este projeto independentemente do diretório de execução; não requer instalar pacotes.

## Organização

```text
SemVoltaPraCasa/
├── README.md, AGENTS.md, CLAUDE.md  entradas para pessoas e agentes
├── .claude/launch.json             atalhos locais de execução
├── docs/                          guias e índices pesquisáveis
│   └── historico/                  documentação anterior preservada
├── ferramentas/                   servidor local e catalogador
├── fonte/                         jogo atual
│   ├── index.html, estilo.css      telas e aparência
│   ├── jogo.js                     lógica, personagens e desafios
│   ├── assets.js                   mídia embutida em base64
│   ├── mapa/                      Tiled: fonte, exportação e tileset
│   ├── musicas/                   oito faixas MP3 externas
│   └── capa.png, icone-*.png,
│       manifest.webmanifest       apresentação e ícones
├── referencias/                   documentos e imagens locais (fora do Git)
├── index.html                     entrada pública; leva para fonte/
├── mapa-completo.png              captura de referência
└── sem-volta-pra-casa.html         HTML gerado legado (fora do Git)
```

## Editar e manter o índice

Edite HTML/CSS/JavaScript dentro de `fonte/` e atualize o navegador. Para localizar a parte certa do arquivo principal, consulte o mapa por assunto e busque pelo nome da função; o número da linha pode mudar.

Após mudanças relevantes, atualize os índices:

```powershell
node ferramentas/catalogar.cjs
node --check fonte/jogo.js
node --check fonte/mapa/mapa.js
git diff --check
```

O catalogador lista inclusive referências locais e arquivos ignorados, mas não copia seu conteúdo para os índices. Ele calcula SHA-256 para detectar duplicatas exatas, lista os arquivos recentes e as chaves de mídia embutida, e gera um índice lexical de seções e funções. Exclui os internos de `.git/` e não segue links simbólicos. Consulte as exclusões no próprio catálogo.

## Mapa e mídia

Edite `fonte/mapa/mapa.tmj` no Tiled; salve e exporte para `fonte/mapa/mapa.js`. As dependências e cuidados estão no [mapa da estrutura](docs/estrutura.md).

As músicas externas ficam em `fonte/musicas/`. Para substituir mídia **embutida**:

```powershell
python fonte/trocar_asset.py FINAL_AUDIO caminho/para/trecho.mp3
```

Veja as chaves disponíveis no catálogo. `FINAL_AUDIO` é um fallback embutido; a faixa externa `fonte/musicas/final.mp3` é carregada separadamente. Não confunda os dois caminhos.

## HTML único legado

`python fonte/juntar.py` recria `sem-volta-pra-casa.html` a partir das fontes. O arquivo existente era anterior às alterações de outubro na auditoria de 03/10/2026 e foi preservado como estava.

O gerador atual incorpora CSS, JavaScript, mapa e mídia base64, mas **não embute os MP3 de `fonte/musicas/` nem resolve todos os recursos relativos da página**. Portanto, esse HTML não representa uma distribuição autossuficiente da versão atual. Para testar e distribuir a estrutura atual, preserve `index.html` e a pasta `fonte/` com seus recursos. Nenhuma publicação é feita pelos comandos de organização.

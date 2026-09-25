# Jogos Digitais Pedagógicos Acessíveis

Plataforma do Centro Tecnológico de Acessibilidade (CTA) do IFRS que reúne jogos digitais pedagógicos para uso em aulas e em sessões de treinamento com tecnologias assistivas.

## Jogos disponíveis

- **Jogo da Velha** — jogo da velha com opções de partida e dificuldade.
- **Jogo dos Saltos** — jogo de ação com seleção de dificuldade.
- **Jogo da Forca** — jogo de palavras com categorias e dificuldades.
- **A Baleia Faminta** — jogo de coleta com seleção de dificuldade.
- **Jogo da Colmeia** — atividade de reflexo com seleção de dificuldade.

Consulte as instruções e opções de cada atividade na página inicial da plataforma e nos menus dos jogos.

## Acessibilidade

A plataforma oferece recursos para apoiar diferentes formas de interação, incluindo:

- navegação por teclado;
- navegação por varredura automática, com ajuste de velocidade;
- modo de alto contraste;
- controles e instruções acessíveis nos jogos.

As preferências de acessibilidade e algumas configurações de conteúdo são armazenadas no navegador por meio do `localStorage`.

## Como executar

O projeto é um site estático e não requer instalação de dependências. Para abrir, inicie um servidor HTTP na pasta do projeto e acesse `index.html` pelo navegador. Por exemplo, com Python instalado:

```bash
python -m http.server 8000
```

Depois, visite <http://localhost:8000>.

Também é possível abrir `index.html` diretamente no navegador, mas o uso de um servidor local é recomendado para evitar limitações do navegador ao carregar arquivos e recursos dos jogos.

## Estrutura do projeto

```text
.
├── index.html             # Página inicial, catálogo e configurações da plataforma
├── css/                   # Estilos da plataforma e componentes compartilhados dos jogos
├── js/                    # Lógica da página inicial e recursos comuns dos jogos
├── imagens/               # Logotipos, imagens e recursos gráficos
└── jogos/
    ├── baleia/            # A Baleia Faminta
    ├── colmeia/           # Jogo da Colmeia
    ├── forca/              # Jogo da Forca
    ├── jump/               # Jogo dos Saltos
    └── tic-tac-toe/        # Jogo da Velha
```

Cada jogo reúne sua própria página HTML, folhas de estilo, scripts e, quando aplicável, imagens e sons.

## Tecnologias

- HTML, CSS e JavaScript;
- jQuery;
- Bootstrap e Bootstrap Icons;
- fontes Atkinson Hyperlegible e Nunito.

Bootstrap, Bootstrap Icons e fontes são carregados de serviços externos, portanto alguns recursos visuais podem depender de conexão com a internet.

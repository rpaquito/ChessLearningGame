import type { Dictionary } from './types';

// Cada valor é cópia byte-a-byte do texto já hardcoded no ficheiro
// indicado — é o que garante que os testes existentes continuam a passar
// sem alteração nesta fase (ver spec i18n, secção de testes).
export const pt: Dictionary = {
  common: {
    mainMenu: 'Menu inicial',
    close: 'Fechar',
    backToTutorial: 'Voltar ao tutorial',
    thinking: 'A pensar…',
    chessBoard: 'Tabuleiro de xadrez',
    cancel: 'Cancelar',
  },
  menu: {
    title: 'CHESS SENSEI',
    playVsComputer: 'Jogar contra o computador',
    twoPlayers: 'Dois jogadores',
    learnToPlay: 'Aprender a jogar',
    options: 'Opções',
  },
  opcoes: {
    title: 'OPÇÕES',
    defaultDifficultyLegend: 'Dificuldade por omissão',
    defaultColorLegend: 'Cor por omissão',
    boardTheme: 'Tema do tabuleiro',
    pieceStyle: 'Estilo das peças',
    backgroundImage: 'Imagem de fundo',
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English',
    toastDifficultyChanged: 'Dificuldade por omissão alterada.',
    toastColorChanged: 'Cor por omissão alterada.',
    toastBoardThemeChanged: 'Tema do tabuleiro alterado.',
    toastPieceStyleChanged: 'Estilo das peças alterado.',
    toastBackgroundChanged: 'Imagem de fundo alterada.',
    toastLanguageChanged: 'Idioma alterado.',
  },
  difficulty: { facil: 'facil', medio: 'medio', dificil: 'dificil' },
  color: { white: 'Brancas', black: 'Pretas', random: 'Aleatório' },
  pieceStyleLabel: { classico: 'Clássico', moderno: 'Moderno', anime: 'Anime' },
  configurar: { title: 'JOGAR CONTRA O COMPUTADOR' },
  gameSetup: { difficultyLegend: 'Dificuldade', colorLegend: 'As tuas peças', start: 'Começar' },
  jogar: {
    loading: 'A carregar…',
    status: {
      playing: 'Em andamento',
      check: 'Xeque',
      checkmate: 'Xeque-mate',
      stalemate: 'Afogamento (empate)',
      draw: 'Empate',
    },
    checkToast: 'Xeque!',
    engineUnavailable:
      'O motor de xadrez não pôde ser carregado. Tenta novamente mais tarde, ou joga no modo Dois jogadores.',
    restart: 'Reiniciar partida',
    rules: 'Regras',
    confirmRestartTitle: 'Reiniciar partida?',
    confirmRestartMessage: 'Vais perder o progresso desta partida. Tens a certeza?',
    confirmRestartButton: 'Reiniciar',
    confirmMenuTitle: 'Sair para o menu inicial?',
    confirmMenuMessage: 'Vais perder o progresso desta partida. Tens a certeza?',
    confirmMenuButton: 'Sair',
  },
  learningPanel: {
    toggleLabel: 'Modo de aprendizagem',
    description: 'Lances legais e peças ameaçadas aparecem destacados no tabuleiro.',
    suggestMove: 'Sugerir jogada',
    suggestionHint: 'Jogada sugerida destacada em verde no tabuleiro.',
    lastMoveLabel: 'O teu último lance: ',
    quality: { boa: 'Boa jogada', imprecisao: 'Imprecisão', erro: 'Erro' },
  },
  rulesModal: {
    title: 'Regras do xadrez',
    movementTitle: 'Como as peças se movem',
    pawn: { title: 'Peão', text: 'Anda uma casa em frente (duas no primeiro lance) e captura na diagonal.' },
    knight: { title: 'Cavalo', text: 'Move-se em "L". É a única peça que salta por cima de outras.' },
    bishop: { title: 'Bispo', text: 'Move-se livremente na diagonal, sempre na mesma cor de casa.' },
    rook: { title: 'Torre', text: 'Move-se livremente na horizontal ou na vertical.' },
    queen: { title: 'Dama', text: 'Combina o movimento da torre com o do bispo.' },
    king: {
      title: 'Rei',
      text: 'Move-se uma casa em qualquer direção. Nunca pode ir para uma casa atacada pelo adversário.',
    },
    specialTitle: 'Regras especiais',
    castling: {
      title: 'Roque',
      text:
        'O rei e uma torre movem-se em conjunto, uma única vez por partida — só é permitido se nenhuma das ' +
        'duas peças já se tiver mexido, não houver peças entre elas e o rei não estiver em xeque nem passar ' +
        'por uma casa atacada.',
    },
    enPassant: {
      title: 'En passant',
      text:
        'Se um peão adversário andar duas casas e ficar ao lado de um peão teu, podes capturá-lo como se ' +
        'tivesse andado só uma casa — mas apenas no lance seguinte.',
    },
    promotion: {
      title: 'Promoção',
      text: 'Quando um peão chega à última fileira, é promovido a qualquer peça (exceto rei) — normalmente a dama.',
    },
    endgameTitle: 'Fim de jogo',
    check: { title: 'Xeque', text: 'O rei está sob ataque direto. Tens de sair do xeque logo no lance seguinte.' },
    checkmate: {
      title: 'Xeque-mate',
      text: 'Um xeque sem escapatória — o jogo termina de imediato e quem dá o mate vence.',
    },
    stalemate: {
      title: 'Afogamento (empate)',
      text: 'Quando não estás em xeque, mas não tens nenhum lance legal disponível.',
    },
    otherDraws: {
      title: 'Outros empates',
      text:
        'Repetição tripla da mesma posição, regra dos 50 lances sem captura nem movimento de peão, ou ' +
        'material insuficiente no tabuleiro para dar mate.',
    },
    learningTitle: 'Modo de aprendizagem',
    centipawns: {
      title: 'Centipawns',
      text:
        'É a unidade que o motor de xadrez usa para avaliar uma posição — 100 centipawns valem cerca de ' +
        'um peão. Perder poucos é normal; perder uma centena ou mais costuma significar que havia uma ' +
        'jogada bastante melhor disponível.',
    },
  },
  gameEnd: {
    lostCheckmate: 'Perdeste. Xeque-mate.',
    wonCheckmate: 'Ganhaste! Xeque-mate.',
    checkmateBlackWins: 'Xeque-mate! Vencem as pretas.',
    checkmateWhiteWins: 'Xeque-mate! Vencem as brancas.',
    stalemateDraw: 'Empate por afogamento.',
    draw: 'Empate.',
    playAgain: 'Jogar de novo',
  },
  aprenderHub: {
    title: 'APRENDA A JOGAR XADREZ',
    backToHome: 'Voltar para o início',
    piecesTitle: 'Como as peças se movem',
    piecesDesc: 'O movimento de cada peça, do peão ao rei.',
    specialRulesTitle: 'Regras especiais',
    specialRulesDesc: 'Roque, en passant e promoção do peão.',
    endgameTitle: 'Fim de jogo',
    endgameDesc: 'Xeque, xeque-mate, afogamento e empates.',
    strategyTitle: 'Princípios de estratégia',
    strategyDesc: 'Ideias básicas para jogar melhor desde a abertura.',
    centipawnsTitle: 'Avaliação e centipawns',
    centipawnsDesc: 'O que são centipawns e como interpretar "Boa jogada", "Imprecisão" e "Erro".',
    openingsTitle: 'Aberturas',
    openingsDesc: (count: number) => `Estuda ${count} aberturas populares, lance a lance, com explicação em português.`,
  },
  pecas: {
    title: 'COMO AS PEÇAS SE MOVEM',
    pawn: { title: 'Peão', desc: 'Anda uma casa para frente (duas no primeiro lance) e captura na diagonal.' },
    knight: {
      title: 'Cavalo',
      desc: 'Move-se em "L": duas casas numa direção e uma casa perpendicular. É a única peça que salta por cima de outras.',
    },
    bishop: { title: 'Bispo', desc: 'Move-se livremente na diagonal, sempre pela mesma cor de casa.' },
    rook: { title: 'Torre', desc: 'Move-se livremente na horizontal ou na vertical.' },
    queen: { title: 'Dama', desc: 'Combina o movimento da torre e do bispo: livre em qualquer direção.' },
    king: {
      title: 'Rei',
      desc: 'Move-se uma casa em qualquer direção. Nunca se pode mover para uma casa atacada pelo adversário.',
    },
  },
  regrasEspeciais: {
    title: 'REGRAS ESPECIAIS',
    castling: {
      title: 'Roque',
      desc:
        'Um lance especial do rei com uma das torres, feito uma única vez por partida. O rei anda ' +
        'duas casas em direção à torre, e a torre salta para o outro lado do rei. Só é permitido se ' +
        'nem o rei nem a torre envolvida já se moveram, se não houver peças entre eles, e se o rei ' +
        'não estiver em xeque nem passar por uma casa atacada.',
    },
    enPassant: {
      title: 'En passant',
      desc:
        'Se um peão adversário andar duas casas de uma vez e ficar ao lado de um peão teu, podes ' +
        'capturá-lo como se ele tivesse andado apenas uma casa — mas só no lance imediatamente a ' +
        'seguir.',
    },
    promotion: {
      title: 'Promoção',
      desc:
        'Quando um peão chega à última fileira, é promovido a qualquer outra peça (menos rei) — na ' +
        'grande maioria dos casos, a dama, por ser a peça mais forte.',
    },
  },
  fimDeJogo: {
    title: 'FIM DE JOGO',
    check: {
      title: 'Xeque',
      desc:
        'O rei está sob ataque direto. Quem está em xeque precisa, no seu próximo lance, sair do ' +
        'xeque — movendo o rei, bloqueando o ataque ou capturando a peça que ataca.',
    },
    checkmate: {
      title: 'Xeque-mate',
      desc:
        'Um xeque do qual não há como escapar — o jogo termina imediatamente e quem deu o mate ' +
        'vence. Clica no rei: não há nenhuma casa livre, é mesmo o fim da partida.',
    },
    stalemate: {
      title: 'Afogamento (empate)',
      desc:
        'Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível, a ' +
        'partida termina empatada. Clica no rei: também aqui não há para onde ir, mas ninguém o está ' +
        'a atacar.',
    },
    otherDrawsTitle: 'Outros empates',
    otherDrawsText:
      'A partida também empata por repetição tripla da mesma posição, pela regra dos 50 lances ' +
      'sem captura ou movimento de peão, ou quando não há material suficiente no tabuleiro para ' +
      'dar mate.',
  },
  estrategia: {
    title: 'PRINCÍPIOS DE ESTRATÉGIA',
    principles: [
      {
        title: 'Controlar o centro',
        text: 'As casas centrais (d4, e4, d5, e5) dão às tuas peças mais mobilidade e influência sobre o tabuleiro. Ocupar ou controlar o centro logo nos primeiros lances.',
      },
      {
        title: 'Desenvolver as peças',
        text: 'Tirar cavalos e bispos das casas iniciais cedo, antes de mover a mesma peça várias vezes ou sair a caçar peões sem necessidade.',
      },
      {
        title: 'Proteger o rei',
        text: 'Fazer o roque cedo para colocar o rei a salvo atrás de uma fileira de peões, especialmente antes de abrir o jogo no centro.',
      },
      {
        title: 'Não perder material de graça',
        text: 'Antes de cada lance, confirmar que nenhuma peça tua ficou pendurada (atacada e sem defesa suficiente).',
      },
      {
        title: 'Pensar em ameaças antes de atacar',
        text: 'Perguntar-se o que o adversário quer fazer no próximo lance antes de decidir o teu — muitas peças perdem-se por ignorar a resposta do oponente.',
      },
    ],
  },
  centipawnsPage: {
    title: 'AVALIAÇÃO E CENTIPAWNS',
    concepts: [
      {
        title: 'O que é um centipawn',
        text: 'O motor (Stockfish) mede o quão boa é uma posição em centipawns — centésimos do valor de um peão. Uma vantagem de "+100" é, grosso modo, "vales um peão a mais"; "+300" ronda o valor de uma peça menor.',
      },
      {
        title: 'Perda de centipawns',
        text: 'A cada lance, o modo de aprendizagem compara a avaliação do melhor lance possível com a avaliação do lance que jogaste, ambas do teu ponto de vista. A diferença é a "perda" desse lance — nunca é negativa: jogar tão bem como (ou melhor que) a referência do motor conta como perda zero.',
      },
    ],
    levelsHeading: 'Os três níveis que vês durante uma partida',
    qualityTexts: {
      boa: 'Perda até 30 centipawns — praticamente ao nível do melhor lance disponível.',
      imprecisao: 'Perda entre 31 e 100 centipawns — um lance que cede uma pequena vantagem, sem ser grave.',
      erro: 'Perda acima de 100 centipawns — um lance que troca uma vantagem real, por exemplo perder material ou uma posição muito melhor.',
    },
  },
  openings: {
    hubTitle: 'ABERTURAS',
    backToOpenings: 'Voltar às aberturas',
    practiceThisOpening: 'Praticar esta abertura',
    practicePrefix: 'PRATICAR: ',
    backToStudy: 'Voltar ao estudo',
    linesTablistLabel: 'Linhas desta abertura',
    previous: 'Anterior',
    next: 'Seguinte',
    startPosition: 'Posição inicial — carrega em "Seguinte" para começar.',
    lineComplete: 'Linha completa!',
    practiceAgain: 'Praticar outra vez',
    wrongMove: (san: string) => `Não é esse — o lance da linha é ${san}. Tenta de novo.`,
    yourTurn: 'A tua vez: encontra o lance da linha.',
  },
  interactiveDemo: { reset: 'Reiniciar' },
};

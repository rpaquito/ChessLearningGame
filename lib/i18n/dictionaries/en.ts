import type { Dictionary } from './types';

export const en: Dictionary = {
  common: {
    mainMenu: 'Main menu',
    close: 'Close',
    backToTutorial: 'Back to tutorial',
    thinking: 'Thinking…',
    chessBoard: 'Chess board',
  },
  menu: {
    title: 'CHESS',
    playVsComputer: 'Play against the computer',
    twoPlayers: 'Two players',
    learnToPlay: 'Learn to play',
    options: 'Options',
  },
  opcoes: {
    title: 'OPTIONS',
    defaultDifficultyLegend: 'Default difficulty',
    defaultColorLegend: 'Default color',
    boardTheme: 'Board theme',
    pieceStyle: 'Piece style',
    backgroundImage: 'Background image',
    language: 'Language',
    portuguese: 'Português',
    english: 'English',
    toastDifficultyChanged: 'Default difficulty changed.',
    toastColorChanged: 'Default color changed.',
    toastBoardThemeChanged: 'Board theme changed.',
    toastPieceStyleChanged: 'Piece style changed.',
    toastBackgroundChanged: 'Background image changed.',
    toastLanguageChanged: 'Language changed.',
  },
  difficulty: { facil: 'easy', medio: 'medium', dificil: 'hard' },
  color: { white: 'White', black: 'Black', random: 'Random' },
  pieceStyleLabel: { classico: 'Classic', moderno: 'Modern', anime: 'Anime' },
  configurar: { title: 'PLAY AGAINST THE COMPUTER' },
  gameSetup: { difficultyLegend: 'Difficulty', colorLegend: 'Your pieces', start: 'Start' },
  jogar: {
    loading: 'Loading…',
    status: {
      playing: 'In progress',
      check: 'Check',
      checkmate: 'Checkmate',
      stalemate: 'Stalemate (draw)',
      draw: 'Draw',
    },
    checkToast: 'Check!',
    engineUnavailable:
      "The chess engine couldn't be loaded. Try again later, or play in Two Players mode.",
    restart: 'Restart game',
    rules: 'Rules',
  },
  learningPanel: {
    toggleLabel: 'Learning mode',
    description: 'Legal moves and threatened pieces are highlighted on the board.',
    suggestMove: 'Suggest a move',
    suggestionHint: 'Suggested move highlighted in green on the board.',
    lastMoveLabel: 'Your last move: ',
    quality: { boa: 'Good move', imprecisao: 'Inaccuracy', erro: 'Mistake' },
  },
  rulesModal: {
    title: 'Chess rules',
    movementTitle: 'How the pieces move',
    pawn: { title: 'Pawn', text: 'Moves one square forward (two on its first move) and captures diagonally.' },
    knight: { title: 'Knight', text: 'Moves in an "L" shape. It\'s the only piece that jumps over others.' },
    bishop: { title: 'Bishop', text: 'Moves freely along diagonals, always staying on the same square color.' },
    rook: { title: 'Rook', text: 'Moves freely horizontally or vertically.' },
    queen: { title: 'Queen', text: "Combines the rook's movement with the bishop's." },
    king: {
      title: 'King',
      text: 'Moves one square in any direction. It can never move to a square attacked by the opponent.',
    },
    specialTitle: 'Special rules',
    castling: {
      title: 'Castling',
      text:
        'The king and a rook move together, once per game — only allowed if neither piece has moved yet, ' +
        'there are no pieces between them, and the king is not in check nor passes through an attacked square.',
    },
    enPassant: {
      title: 'En passant',
      text:
        "If an opponent's pawn moves two squares and lands beside one of yours, you can capture it as if " +
        'it had moved only one square — but only on the very next move.',
    },
    promotion: {
      title: 'Promotion',
      text: 'When a pawn reaches the last rank, it is promoted to any piece except a king — usually a queen.',
    },
    endgameTitle: 'Endgame',
    check: {
      title: 'Check',
      text: 'The king is under direct attack. You must get out of check on your very next move.',
    },
    checkmate: {
      title: 'Checkmate',
      text: 'A check with no way out — the game ends immediately and whoever delivers mate wins.',
    },
    stalemate: {
      title: 'Stalemate (draw)',
      text: 'When you are not in check, but have no legal move available.',
    },
    otherDraws: {
      title: 'Other draws',
      text:
        'Threefold repetition of the same position, the 50-move rule (no capture or pawn move), or ' +
        'insufficient material on the board to deliver mate.',
    },
    learningTitle: 'Learning mode',
    centipawns: {
      title: 'Centipawns',
      text:
        'The unit the chess engine uses to evaluate a position — 100 centipawns is worth about one pawn. ' +
        'Losing a little is normal; losing a hundred or more usually means a much better move was available.',
    },
  },
  gameEnd: {
    lostCheckmate: 'You lost. Checkmate.',
    wonCheckmate: 'You won! Checkmate.',
    checkmateBlackWins: 'Checkmate! Black wins.',
    checkmateWhiteWins: 'Checkmate! White wins.',
    stalemateDraw: 'Draw by stalemate.',
    draw: 'Draw.',
    playAgain: 'Play again',
  },
  aprenderHub: {
    title: 'LEARN TO PLAY CHESS',
    backToHome: 'Back to home',
    piecesTitle: 'How the pieces move',
    piecesDesc: 'The movement of each piece, from pawn to king.',
    specialRulesTitle: 'Special rules',
    specialRulesDesc: 'Castling, en passant, and pawn promotion.',
    endgameTitle: 'Endgame',
    endgameDesc: 'Check, checkmate, stalemate, and draws.',
    strategyTitle: 'Strategy principles',
    strategyDesc: 'Basic ideas to play better from the opening onward.',
    centipawnsTitle: 'Evaluation and centipawns',
    centipawnsDesc: 'What centipawns are and how to interpret "Good move", "Inaccuracy" and "Mistake".',
    openingsTitle: 'Openings',
    openingsDesc: (count: number) => `Study ${count} popular openings, move by move.`,
  },
  pecas: {
    title: 'HOW THE PIECES MOVE',
    pawn: { title: 'Pawn', desc: 'Moves one square forward (two on its first move) and captures diagonally.' },
    knight: {
      title: 'Knight',
      desc:
        'Moves in an "L" shape: two squares in one direction and one square perpendicular. It\'s the only ' +
        'piece that jumps over others.',
    },
    bishop: { title: 'Bishop', desc: 'Moves freely along diagonals, always on the same square color.' },
    rook: { title: 'Rook', desc: 'Moves freely horizontally or vertically.' },
    queen: { title: 'Queen', desc: "Combines the rook's and bishop's movement: free in any direction." },
    king: {
      title: 'King',
      desc: 'Moves one square in any direction. It can never move to a square attacked by the opponent.',
    },
  },
  regrasEspeciais: {
    title: 'SPECIAL RULES',
    castling: {
      title: 'Castling',
      desc:
        'A special move of the king together with one of the rooks, done once per game. The king moves two ' +
        'squares toward the rook, and the rook jumps to the other side of the king. Only allowed if neither ' +
        'the king nor the rook involved has moved yet, there are no pieces between them, and the king is not ' +
        'in check nor passes through an attacked square.',
    },
    enPassant: {
      title: 'En passant',
      desc:
        "If an opponent's pawn moves two squares at once and lands beside one of yours, you can capture it " +
        'as if it had moved only one square — but only on the very next move.',
    },
    promotion: {
      title: 'Promotion',
      desc:
        'When a pawn reaches the last rank, it is promoted to any other piece (except a king) — in the vast ' +
        "majority of cases, a queen, since it's the strongest piece.",
    },
  },
  fimDeJogo: {
    title: 'ENDGAME',
    check: {
      title: 'Check',
      desc:
        'The king is under direct attack. Whoever is in check must, on their next move, get out of check — ' +
        'by moving the king, blocking the attack, or capturing the attacking piece.',
    },
    checkmate: {
      title: 'Checkmate',
      desc:
        "A check with no way to escape — the game ends immediately and whoever delivered mate wins. Click " +
        "the king: there's no free square, it really is the end of the game.",
    },
    stalemate: {
      title: 'Stalemate (draw)',
      desc:
        'When the player to move is not in check, but has no legal move available, the game ends in a draw. ' +
        "Click the king: there's nowhere to go here either, but nobody is attacking it.",
    },
    otherDrawsTitle: 'Other draws',
    otherDrawsText:
      'The game also ends in a draw by threefold repetition of the same position, the 50-move rule (no ' +
      "capture or pawn move), or when there isn't enough material on the board to deliver mate.",
  },
  estrategia: {
    title: 'STRATEGY PRINCIPLES',
    principles: [
      {
        title: 'Control the center',
        text:
          'The central squares (d4, e4, d5, e5) give your pieces more mobility and influence over the ' +
          'board. Occupy or control the center from the very first moves.',
      },
      {
        title: 'Develop your pieces',
        text:
          'Bring knights and bishops out from their starting squares early, before moving the same piece ' +
          'several times or chasing pawns without real need.',
      },
      {
        title: 'Protect your king',
        text:
          'Castle early to tuck your king safely behind a row of pawns, especially before opening up the ' +
          'center.',
      },
      {
        title: "Don't lose material for free",
        text: "Before every move, check that none of your pieces is hanging (attacked and insufficiently defended).",
      },
      {
        title: 'Think about threats before attacking',
        text:
          "Ask yourself what your opponent wants to do on their next move before deciding on yours — many " +
          "pieces are lost by ignoring the opponent's reply.",
      },
    ],
  },
  centipawnsPage: {
    title: 'EVALUATION AND CENTIPAWNS',
    concepts: [
      {
        title: 'What a centipawn is',
        text:
          'The engine (Stockfish) measures how good a position is in centipawns — hundredths of the value ' +
          'of a pawn. An advantage of "+100" roughly means "you\'re up a pawn"; "+300" is around the value ' +
          'of a minor piece.',
      },
      {
        title: 'Centipawn loss',
        text:
          'On every move, learning mode compares the evaluation of the best possible move with the ' +
          "evaluation of the move you played, both from your point of view. The difference is that move's " +
          '"loss" — never negative: playing as well as (or better than) the engine\'s reference counts as ' +
          'zero loss.',
      },
    ],
    levelsHeading: "The three levels you'll see during a game",
    qualityTexts: {
      boa: 'Loss of up to 30 centipawns — practically at the level of the best available move.',
      imprecisao: 'Loss between 31 and 100 centipawns — a move that gives up a small advantage, without being serious.',
      erro: 'Loss above 100 centipawns — a move that trades away a real advantage, for example losing material or a much better position.',
    },
  },
  openings: {
    hubTitle: 'OPENINGS',
    backToOpenings: 'Back to openings',
    practiceThisOpening: 'Practice this opening',
    practicePrefix: 'PRACTICE: ',
    backToStudy: 'Back to study',
    linesTablistLabel: 'Lines of this opening',
    previous: 'Previous',
    next: 'Next',
    startPosition: 'Starting position — press "Next" to begin.',
    lineComplete: 'Line complete!',
    practiceAgain: 'Practice again',
    wrongMove: (san: string) => `Not quite — the line continues with ${san}. Try again.`,
    yourTurn: "Your turn: find the line's move.",
  },
  interactiveDemo: { reset: 'Reset' },
};

export interface Dictionary {
  common: {
    mainMenu: string;
    close: string;
    backToTutorial: string;
    thinking: string;
  };
  menu: {
    title: string;
    playVsComputer: string;
    twoPlayers: string;
    learnToPlay: string;
    options: string;
  };
  opcoes: {
    title: string;
    defaultDifficultyLegend: string;
    defaultColorLegend: string;
    boardTheme: string;
    pieceStyle: string;
    backgroundImage: string;
    language: string;
    portuguese: string;
    english: string;
    toastDifficultyChanged: string;
    toastColorChanged: string;
    toastBoardThemeChanged: string;
    toastPieceStyleChanged: string;
    toastBackgroundChanged: string;
    toastLanguageChanged: string;
  };
  difficulty: { facil: string; medio: string; dificil: string };
  color: { white: string; black: string; random: string };
  pieceStyleLabel: { classico: string; moderno: string; anime: string };
  configurar: { title: string };
  gameSetup: { difficultyLegend: string; colorLegend: string; start: string };
  jogar: {
    loading: string;
    status: { playing: string; check: string; checkmate: string; stalemate: string; draw: string };
    checkToast: string;
    engineUnavailable: string;
    restart: string;
    rules: string;
  };
  learningPanel: {
    toggleLabel: string;
    description: string;
    suggestMove: string;
    suggestionHint: string;
    lastMoveLabel: string;
    quality: { boa: string; imprecisao: string; erro: string };
  };
  rulesModal: {
    title: string;
    movementTitle: string;
    pawn: { title: string; text: string };
    knight: { title: string; text: string };
    bishop: { title: string; text: string };
    rook: { title: string; text: string };
    queen: { title: string; text: string };
    king: { title: string; text: string };
    specialTitle: string;
    castling: { title: string; text: string };
    enPassant: { title: string; text: string };
    promotion: { title: string; text: string };
    endgameTitle: string;
    check: { title: string; text: string };
    checkmate: { title: string; text: string };
    stalemate: { title: string; text: string };
    otherDraws: { title: string; text: string };
    learningTitle: string;
    centipawns: { title: string; text: string };
  };
  gameEnd: {
    lostCheckmate: string;
    wonCheckmate: string;
    checkmateBlackWins: string;
    checkmateWhiteWins: string;
    stalemateDraw: string;
    draw: string;
    playAgain: string;
  };
  aprenderHub: {
    title: string;
    backToHome: string;
    piecesTitle: string;
    piecesDesc: string;
    specialRulesTitle: string;
    specialRulesDesc: string;
    endgameTitle: string;
    endgameDesc: string;
    strategyTitle: string;
    strategyDesc: string;
    centipawnsTitle: string;
    centipawnsDesc: string;
    openingsTitle: string;
    openingsDesc: (count: number) => string;
  };
  pecas: {
    title: string;
    pawn: { title: string; desc: string };
    knight: { title: string; desc: string };
    bishop: { title: string; desc: string };
    rook: { title: string; desc: string };
    queen: { title: string; desc: string };
    king: { title: string; desc: string };
  };
  regrasEspeciais: {
    title: string;
    castling: { title: string; desc: string };
    enPassant: { title: string; desc: string };
    promotion: { title: string; desc: string };
  };
  fimDeJogo: {
    title: string;
    check: { title: string; desc: string };
    checkmate: { title: string; desc: string };
    stalemate: { title: string; desc: string };
    otherDrawsTitle: string;
    otherDrawsText: string;
  };
  estrategia: {
    title: string;
    principles: { title: string; text: string }[];
  };
  centipawnsPage: {
    title: string;
    concepts: { title: string; text: string }[];
    levelsHeading: string;
  };
  openings: {
    hubTitle: string;
    backToOpenings: string;
    practiceThisOpening: string;
    practicePrefix: string;
    backToStudy: string;
    linesTablistLabel: string;
    previous: string;
    next: string;
    startPosition: string;
    lineComplete: string;
    practiceAgain: string;
    wrongMove: (san: string) => string;
    yourTurn: string;
  };
  interactiveDemo: { reset: string };
}

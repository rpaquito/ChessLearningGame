# Xadrez — aprenda jogando

Jogo de xadrez em Next.js, com modo contra o computador (Stockfish, três
níveis de dificuldade) e modo dois jogadores no mesmo dispositivo, além de
um modo aprendizado (lances legais, peças ameaçadas, sugestão de jogada e
avaliação rápida de cada lance) e um tutorial em `/aprender`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Testes

```bash
npm test
```

## Docker

```bash
docker build -t xadrez-aprendizado .
docker run --rm -p 3000:3000 xadrez-aprendizado
```

## Deploy no Vercel

Conecte o repositório no Vercel — não há variáveis de ambiente obrigatórias.

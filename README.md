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

## Deploy no Vercel

Vercel é o único alvo de deploy suportado (o self-host via Docker foi
descontinuado quando a autenticação foi introduzida — ver abaixo). Conecte
o repositório no Vercel e instale a integração Clerk (Vercel Marketplace),
que provisiona automaticamente as variáveis de ambiente necessárias
(`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`).

## Autenticação

Login usa o [Clerk](https://clerk.com/). Algumas funcionalidades do modo de
aprendizagem (as explicações de lances) são premium — ativado manualmente
por agora via `publicMetadata.premium` na Clerk Dashboard, sem pagamentos
ainda.

## PWA (instalável, funciona offline)

O app é um Progressive Web App: pode ser instalado pelo navegador (ícone na
tela inicial / barra de endereço) e, depois da primeira visita a cada
página, continua funcionando sem internet — incluindo jogar contra o
computador, já que o motor de xadrez também fica em cache. Detalhes técnicos
em `public/sw.js`.

## Motor de xadrez

O modo contra o computador e as dicas do modo aprendizado usam o
[Stockfish](https://stockfishchess.org/) (via [stockfish.js](https://github.com/nmrugg/stockfish.js)),
licenciado sob GPLv3. O binário WASM vendorizado em `public/stockfish/` não é
modificado; o código-fonte do motor está disponível no repositório oficial.

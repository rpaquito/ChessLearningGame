import { clerkMiddleware } from '@clerk/nextjs/server';

// Sem auth.protect() em lado nenhum — nenhuma rota desta app exige
// login. O único papel deste middleware é manter o token de sessão
// do Clerk sincronizado entre pedidos.
export default clerkMiddleware();

export const config = {
  // Só exclui assets estáticos com hash/ícones — este projeto não tem
  // rotas /api nem tRPC, por isso o matcher não precisa de as referir.
  matcher: ['/((?!_next|.*\\.(?:png|jpg|svg|ico|webmanifest|json)$).*)'],
};

/**
 * Forma mínima de um utilizador Clerk que este helper precisa — evita
 * importar o SDK inteiro do Clerk só para ler uma flag.
 */
export interface UserWithPublicMetadata {
  publicMetadata?: unknown;
}

/**
 * Lê a flag `premium` do publicMetadata do Clerk. Só é `true` quando o
 * valor é exatamente `true` — qualquer outra coisa (undefined, false,
 * uma string, um utilizador nulo) conta como conta gratuita. Só uma
 * chamada de backend com CLERK_SECRET_KEY ou a Clerk Dashboard podem
 * escrever este campo, nunca o próprio utilizador — por isso é seguro
 * lê-lo diretamente no cliente, sem precisar de nenhuma API route.
 */
export function isPremiumUser(user: UserWithPublicMetadata | null | undefined): boolean {
  if (!user || typeof user.publicMetadata !== 'object' || user.publicMetadata === null) {
    return false;
  }
  return (user.publicMetadata as Record<string, unknown>).premium === true;
}

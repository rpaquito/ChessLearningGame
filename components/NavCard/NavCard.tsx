import Link from 'next/link';

/**
 * Cartão-link "título + descrição [+ meta]" — markup que era duplicado
 * byte-a-byte entre a hub de /aprender e a lista de /aprender/aberturas
 * (ver backlog "opening trainer": item extraction candidate). `meta` é
 * a única diferença de conteúdo entre os dois consumidores (a lista de
 * nomes das linhas de cada abertura); opcional para a hub, que não tem
 * nada equivalente.
 */
export function NavCard({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border-2 border-purple/40 bg-ink-soft p-4 transition-colors hover:border-cyan"
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="text-sm text-lilac/80">{description}</p>
      {meta && <p className="text-xs text-lilac/60 mt-1">{meta}</p>}
    </Link>
  );
}

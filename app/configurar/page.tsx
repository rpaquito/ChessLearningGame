import Link from 'next/link';
import { GameSetup } from '@/components/GameSetup/GameSetup';

export default function ConfigurarPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-start gap-8 p-8">
      <h1 className="text-2xl font-bold">Jogar contra o computador</h1>
      <GameSetup />
      <Link href="/" className="underline text-stone-600 text-sm">
        Menu inicial
      </Link>
    </main>
  );
}

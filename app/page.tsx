import Link from 'next/link';
import { ModeSelector } from '@/components/ModeSelector/ModeSelector';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Xadrez</h1>
        <p className="text-stone-600 mt-2">
          Jogue e aprenda a jogar melhor.{' '}
          <Link href="/aprender" className="underline text-sky-700">
            Ver tutorial
          </Link>
        </p>
      </div>
      <ModeSelector />
    </main>
  );
}

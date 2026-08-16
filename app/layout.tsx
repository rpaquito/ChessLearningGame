import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xadrez — aprenda jogando',
  description:
    'Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}

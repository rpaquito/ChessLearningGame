import type { Metadata, Viewport } from 'next';
import { Bangers, Poppins } from 'next/font/google';
import './globals.css';
import { LanguageSync } from '@/components/LanguageSync/LanguageSync';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ToastProvider } from '@/components/Toast/ToastProvider';

// Identidade visual "anime" (redesenho 2026-08-25, ver CLAUDE.md) — Bangers
// só para títulos de impacto (`font-display`), Poppins para tudo o resto
// (é o `font-sans` por omissão, ver globals.css). `latin-ext` a par de
// `latin` porque o texto é todo em PT-PT — precisa dos acentos.
const bangers = Bangers({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bangers',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chess Sensei',
  description:
    'Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chess Sensei',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A0B33',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${bangers.variable} ${poppins.variable}`}>
      <body className="antialiased">
        <LanguageSync />
        <ServiceWorkerRegistration />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

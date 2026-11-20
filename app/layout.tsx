import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MusicChrome } from '@/components/music-chrome';

export const metadata: Metadata = {
  title: 'ABRAKADABRA MUSIC — Escucha. Descubre. Apoya.',
  description: 'Tienda editorial de música de Abrakadabra.',
  icons: { icon: '/Logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning><MusicChrome>{children}</MusicChrome></body>
    </html>
  );
}

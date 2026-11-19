'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CartDrawer, Footer, Header, MusicProvider, Notice, PlayerBar } from '@/components/music-app';

export function MusicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTrackPage = pathname.startsWith('/tracks/');
  return <MusicProvider><Header /><main>{children}</main><Footer /><CartDrawer />{!isTrackPage && <PlayerBar />}<Notice /></MusicProvider>;
}

import { RouteContent } from '@/components/music-app';

export default async function MusicPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const route = (await params).slug?.join('/') || '';
  return <RouteContent route={route} />;
}

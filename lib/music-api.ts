import { ARTISTS, RELEASES, TRACKS, Artist, Release, Track } from './catalog';

export type MusicCatalog = {
  artists: Artist[];
  releases: Release[];
  tracks: Track[];
};

type ApiArtist = {
  id: string;
  name: string;
  slug: string;
  biography?: string | null;
  location?: string | null;
  image_url?: string | null;
};

type ApiTrack = {
  id: string;
  title: string;
  slug: string;
  version?: string | null;
  duration_seconds?: number | null;
  price: number | string;
  currency: string;
  genre?: string | null;
  bpm?: number | null;
  preview_url?: string | null;
  releases?: Array<{ id: string; title: string; slug: string; type: string }>;
  artists?: ApiArtist[];
};

type ApiRelease = {
  id: string;
  title: string;
  slug: string;
  type: 'album' | 'ep' | 'single';
  release_date?: string | null;
  price: number | string;
  cover_url?: string | null;
  description?: string | null;
  artists?: ApiArtist[];
  tracks?: ApiTrack[];
};

export const MUSIC_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
export const MUSIC_TOKEN_KEY = 'abrakadabra_music_token';
const fallbackCover = '/images/music/vinyl-record.png';
const fallbackColors = ['#8f382d', '#d19b48', '#4e706b', '#c7622c'];

const toNumber = (value: number | string | null | undefined) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const toDuration = (seconds: number | null | undefined) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const releaseType = (type: ApiRelease['type']): Release['type'] =>
  type === 'album' ? 'Álbum' : type === 'ep' ? 'EP' : 'Sencillo';

const normalizeAsset = (value: string | null | undefined) => value || fallbackCover;

export const fallbackCatalog: MusicCatalog = { artists: ARTISTS, releases: RELEASES, tracks: TRACKS };

export async function fetchMusicCatalog(): Promise<MusicCatalog | null> {
  try {
    const [artistResponse, releaseResponse, trackResponse] = await Promise.all([
      fetch(`${MUSIC_API_URL}/music/artists`, { cache: 'no-store' }),
      fetch(`${MUSIC_API_URL}/music/releases`, { cache: 'no-store' }),
      fetch(`${MUSIC_API_URL}/music/tracks`, { cache: 'no-store' }),
    ]);

    if (!artistResponse.ok || !releaseResponse.ok || !trackResponse.ok) return null;

    const [artists, releases, tracks] = await Promise.all([
      artistResponse.json() as Promise<ApiArtist[]>,
      releaseResponse.json() as Promise<ApiRelease[]>,
      trackResponse.json() as Promise<ApiTrack[]>,
    ]);

    if (!artists.length && !releases.length && !tracks.length) return null;

    const artistModels = artists.map((artist, index) => ({
      id: artist.id,
      name: artist.name,
      location: artist.location || 'Abrakadabra Music',
      bio: artist.biography || 'Artista del catálogo Abrakadabra Music.',
      color: fallbackColors[index % fallbackColors.length],
      image: artist.image_url || undefined,
    }));
    const artistById = new Map(artistModels.map((artist) => [artist.id, artist]));

    const releaseModels = releases.map((release) => {
      const releaseTracks = release.tracks || [];
      const artistIds = (release.artists || []).map((artist) => artist.id).filter((id) => artistById.has(id));
      return {
        id: release.id,
        title: release.title,
        artistIds,
        type: releaseType(release.type),
        date: release.release_date || new Date().toISOString(),
        price: toNumber(release.price),
        cover: normalizeAsset(release.cover_url),
        description: release.description || 'Un lanzamiento del catálogo Abrakadabra Music.',
        trackIds: releaseTracks.map((track) => track.id),
      } satisfies Release;
    });
    const releaseById = new Map(releaseModels.map((release) => [release.id, release]));

    const trackModels = tracks.map((track) => {
      const release = track.releases?.[0] ? releaseById.get(track.releases[0].id) : undefined;
      const artistIds = (track.artists || []).map((artist) => artist.id).filter((id) => artistById.has(id));
      return {
        id: track.id,
        title: track.title,
        version: track.version || undefined,
        artistIds,
        releaseId: release?.id || track.releases?.[0]?.id || '',
        duration: toDuration(track.duration_seconds),
        previewSeconds: 4,
        previewUrl: track.preview_url || undefined,
        price: toNumber(track.price),
        bpm: track.bpm || undefined,
        genre: track.genre || undefined,
        cover: release?.cover || fallbackCover,
      } satisfies Track;
    });

    return { artists: artistModels, releases: releaseModels, tracks: trackModels };
  } catch {
    return null;
  }
}

export type MusicUser = {
  id: string;
  email: string;
  username: string;
  roles?: Array<{ slug?: string; name: string }>;
  permissions?: string[];
};

export type ArtistApplication = {
  id: string;
  user_id: string;
  artist_name: string;
  country: string;
  phone_country_code: string;
  phone_number: string;
  instagram_url: string;
  motivation: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
};

export type MusicOrderItem = {
  id: string;
  item_type: 'release' | 'track';
  item_id: string;
  title: string;
  artist_name?: string | null;
  unit_price: number | string;
  currency: string;
};

export type MusicOrder = {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'refunded';
  currency: string;
  subtotal: number | string;
  total: number | string;
  provider?: string | null;
  created_at: string;
  items: MusicOrderItem[];
  payment?: { status: string; provider?: string | null; paid_at?: string | null } | null;
};

export type MusicEntitlement = {
  id: string;
  release_id?: string | null;
  track_id?: string | null;
  release_title?: string | null;
  release_slug?: string | null;
  release_cover_url?: string | null;
  track_title?: string | null;
  track_slug?: string | null;
  track_preview_url?: string | null;
  created_at: string;
};

async function authenticatedRequest<T>(path: string, options: RequestInit = {}) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem(MUSIC_TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${MUSIC_API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la solicitud');
  return data as T;
}

export async function loginMusic(email: string, password: string) {
  const response = await fetch(`${MUSIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo iniciar sesión');
  localStorage.setItem(MUSIC_TOKEN_KEY, data.token);
  return data as { token: string; user: MusicUser };
}

export async function registerMusic(payload: { email: string; username: string; password: string }) {
  const response = await fetch(`${MUSIC_API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo crear la cuenta');
  localStorage.setItem(MUSIC_TOKEN_KEY, data.token);
  return data as { token: string; user: MusicUser };
}

export async function getMusicMe() {
  return authenticatedRequest<{ user: MusicUser }>('/auth/me');
}

export async function getArtistProfile() {
  return authenticatedRequest<Record<string, unknown>>('/music/artist/me');
}

export async function getMyArtistApplication() {
  return authenticatedRequest<ArtistApplication | null>('/music/artist-application/me');
}

export async function getMyArtistApplications() {
  return authenticatedRequest<ArtistApplication[]>('/music/artist-applications/me');
}

export async function createArtistApplication(payload: Omit<ArtistApplication, 'id' | 'user_id' | 'status' | 'created_at' | 'reviewed_at' | 'review_notes'>) {
  return authenticatedRequest<ArtistApplication>('/music/artist-applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createArtistProfile(payload: { name: string; biography?: string; location?: string }) {
  return authenticatedRequest<Record<string, unknown>>('/music/artist/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMusicRelease(payload: Record<string, unknown>) {
  return authenticatedRequest<Record<string, unknown>>('/music/artist/releases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMusicTrack(payload: Record<string, unknown>) {
  return authenticatedRequest<Record<string, unknown>>('/music/artist/tracks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadMusicFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return authenticatedRequest<{ url?: string; filename: string; private?: boolean }>(path, {
    method: 'POST',
    body: formData,
  });
}

export async function submitMusicRelease(id: string) {
  return authenticatedRequest(`/music/artist/releases/${id}/submit`, { method: 'PATCH' });
}

export async function createMusicOrder(items: Array<{ kind: 'release' | 'track'; id: string }>) {
  return authenticatedRequest<MusicOrder>('/store/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function simulateMusicPayment(id: string) {
  return authenticatedRequest<MusicOrder>(`/store/orders/${id}/simulate-payment`, { method: 'POST' });
}

export async function getMusicOrders() {
  return authenticatedRequest<MusicOrder[]>('/store/orders');
}

export async function getMusicLibrary() {
  return authenticatedRequest<MusicEntitlement[]>('/store/library');
}

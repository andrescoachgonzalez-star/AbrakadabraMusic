export type Artist = {
  id: string;
  name: string;
  location: string;
  bio: string;
  color: string;
  image?: string;
  imagePosition?: string;
  imagePositionMobile?: string;
  story?: string;
  gallery?: string[];
};

export type Track = {
  id: string;
  title: string;
  version?: string;
  artistIds: string[];
  releaseId: string;
  duration: string;
  previewSeconds: number;
  previewUrl?: string;
  price: number;
  bpm?: number;
  genre?: string;
  cover: string;
};

export type Release = {
  id: string;
  title: string;
  artistIds: string[];
  type: 'Álbum' | 'EP' | 'Sencillo';
  date: string;
  price: number;
  cover: string;
  description: string;
  trackIds: string[];
};

export type ProductOffer = {
  id: string;
  kind: 'release' | 'track';
  title: string;
  artist: string;
  price: number;
  cover: string;
  releaseId?: string;
  trackId?: string;
};

const portrait = (background: string, accent: string, initials: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 880"><rect width="700" height="880" fill="${background}"/><circle cx="510" cy="120" r="150" fill="${accent}" opacity=".5"/><path d="M0 720C80 545 178 490 350 490S620 545 700 720v160H0Z" fill="${accent}"/><circle cx="350" cy="300" r="144" fill="#191716"/><path d="M205 310c20-168 266-180 292 0-50-43-87-58-143-58s-106 20-149 58Z" fill="${accent}"/><circle cx="306" cy="330" r="9" fill="white"/><circle cx="394" cy="330" r="9" fill="white"/><path d="M300 405c36 26 66 26 100 0" fill="none" stroke="white" stroke-width="7" stroke-linecap="round"/><text x="44" y="810" fill="white" font-family="Arial,sans-serif" font-weight="700" font-size="26" letter-spacing="8">${initials}</text></svg>`)}`;

export const ARTISTS: Artist[] = [
  { id: 'lua-mar', name: 'Lua Mar', location: 'Medellín, CO', bio: 'Ritmos lentos, texturas de club y canciones para escuchar con la ciudad apagada.', color: '#8f382d', image: '/artists/lua-mar-editorial-v2.png', imagePosition: '60% 32%', imagePositionMobile: '58% 28%', story: 'Lua Mar trabaja el pulso como una habitación: deja espacio para que el bajo respire, para que una voz aparezca tarde y para que la noche también tenga memoria.', gallery: [] },
  { id: 'nomada-lumen', name: 'Nómada Lumen', location: 'Bogotá, CO', bio: 'Electrónica cálida y paisajes de sintetizador que encuentran luz en el ruido.', color: '#d19b48', image: '/artists/nomada-lumen-editorial-v1.png', imagePosition: '50% 44%', imagePositionMobile: '50% 38%' },
  { id: 'clara-humo', name: 'Clara y Humo', location: 'Cali, CO', bio: 'Voces cercanas, guitarras suspendidas y una forma íntima de contar la noche.', color: '#4e706b', image: '/artists/clara-humo-editorial-v1.png', imagePosition: '50% 42%', imagePositionMobile: '50% 36%' },
  { id: 'rito-verde', name: 'Rito Verde', location: 'Cartagena, CO', bio: 'Percusión tropical, bajos profundos y una pista que siempre vuelve al cuerpo.', color: '#c7622c', image: '/artists/rito-verde-editorial-v1.png', imagePosition: '50% 42%', imagePositionMobile: '50% 36%' },
];

export const RELEASES: Release[] = [
  { id: 'luz-de-sal', title: 'Luz de sal', artistIds: ['lua-mar'], type: 'EP', date: '2026-05-16', price: 18000, cover: '/releases/luz-de-sal-cover-v1.png', description: 'Un EP de cinco movimientos para entrar a la noche sin prisa.', trackIds: ['sal-01', 'sal-02', 'sal-03'] },
  { id: 'cartografia-noche', title: 'Cartografía de la noche', artistIds: ['nomada-lumen', 'clara-humo'], type: 'Álbum', date: '2026-04-18', price: 26000, cover: '/releases/cartografia-noche-cover-v1.png', description: 'Un mapa compartido entre sintetizadores de Bogotá y voces de Cali.', trackIds: ['mapa-01', 'mapa-02', 'mapa-03'] },
  { id: 'sudor-lento', title: 'Sudor lento', artistIds: ['rito-verde'], type: 'Sencillo', date: '2026-06-04', price: 9000, cover: '/releases/sudor-lento-cover-v1.png', description: 'Una sola frecuencia, tres minutos para volver al centro.', trackIds: ['sudor-01'] },
  { id: 'archivo-azul', title: 'Archivo azul', artistIds: ['lua-mar', 'clara-humo'], type: 'Álbum', date: '2026-02-09', price: 22000, cover: '/releases/archivo-azul-cover-v1.png', description: 'Canciones que quedaron encendidas después del último evento.', trackIds: ['azul-01', 'azul-02'] },
];

export const TRACKS: Track[] = [
  { id: 'sal-01', title: 'Fulgor de patio', version: 'Versión de álbum', artistIds: ['lua-mar'], releaseId: 'luz-de-sal', duration: '04:12', previewSeconds: 4, price: 6000, bpm: 112, genre: 'Electrónica', cover: RELEASES[0].cover },
  { id: 'sal-02', title: 'La marea interior', version: 'Edit', artistIds: ['lua-mar'], releaseId: 'luz-de-sal', duration: '05:08', previewSeconds: 4, price: 6000, bpm: 108, genre: 'Ambient house', cover: RELEASES[0].cover },
  { id: 'sal-03', title: 'Luz de sal', artistIds: ['lua-mar'], releaseId: 'luz-de-sal', duration: '03:42', previewSeconds: 4, price: 6000, genre: 'Downtempo', cover: RELEASES[0].cover },
  { id: 'mapa-01', title: 'Coordenadas', version: 'Club mix', artistIds: ['nomada-lumen', 'clara-humo'], releaseId: 'cartografia-noche', duration: '06:20', previewSeconds: 4, price: 7000, bpm: 124, genre: 'Electronica', cover: RELEASES[1].cover },
  { id: 'mapa-02', title: 'Una ventana encendida', artistIds: ['clara-humo', 'nomada-lumen'], releaseId: 'cartografia-noche', duration: '04:56', previewSeconds: 4, price: 7000, genre: 'Pop alternativo', cover: RELEASES[1].cover },
  { id: 'mapa-03', title: 'Norte magnético', artistIds: ['nomada-lumen'], releaseId: 'cartografia-noche', duration: '05:11', previewSeconds: 4, price: 7000, bpm: 118, genre: 'Electronica', cover: RELEASES[1].cover },
  { id: 'sudor-01', title: 'Sudor lento', version: 'Original', artistIds: ['rito-verde'], releaseId: 'sudor-lento', duration: '03:18', previewSeconds: 4, price: 9000, bpm: 119, genre: 'Afro house', cover: RELEASES[2].cover },
  { id: 'azul-01', title: 'El eco', artistIds: ['lua-mar', 'clara-humo'], releaseId: 'archivo-azul', duration: '04:04', previewSeconds: 4, price: 6500, genre: 'Ambient', cover: RELEASES[3].cover },
  { id: 'azul-02', title: 'Después del humo', artistIds: ['clara-humo'], releaseId: 'archivo-azul', duration: '03:49', previewSeconds: 4, price: 6500, genre: 'Indie', cover: RELEASES[3].cover },
];

export const artistName = (ids: string[], artists: Artist[] = ARTISTS) => ids.map((id) => artists.find((artist) => artist.id === id)?.name).filter(Boolean).join(' · ');
export const releaseById = (id: string) => RELEASES.find((release) => release.id === id);
export const trackById = (id: string) => TRACKS.find((track) => track.id === id);
export const artistById = (id: string) => ARTISTS.find((artist) => artist.id === id);
export const formatCOP = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
export const releaseOffer = (release: Release, artists: Artist[] = ARTISTS): ProductOffer => ({ id: `release:${release.id}`, kind: 'release', title: release.title, artist: artistName(release.artistIds, artists), price: release.price, cover: release.cover, releaseId: release.id });
export const trackOffer = (track: Track, artists: Artist[] = ARTISTS): ProductOffer => ({ id: `track:${track.id}`, kind: 'track', title: track.title, artist: artistName(track.artistIds, artists), price: track.price, cover: track.cover, releaseId: track.releaseId, trackId: track.id });

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
  links?: Array<{ label: string; url: string }>;
  genres?: string[];
  hireable?: boolean;
  highlights?: string[];
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
  demoOnly?: boolean;
};

export type Release = {
  id: string;
  title: string;
  artistIds: string[];
  type: 'Álbum' | 'EP' | 'Sencillo';
  date?: string;
  price: number;
  cover: string;
  description: string;
  trackIds: string[];
  demoOnly?: boolean;
  comingSoon?: boolean;
  trackCount?: number;
  packageDetails?: string[];
  licenseTerms?: string[];
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

export const ARTISTS: Artist[] = [
  {
    id: '8batzz', name: '8BATZZ', location: 'Pereira, Colombia',
    bio: 'DJ y productor colombiano de House, Tech House y Afro House. Combina grooves profundos, percusión orgánica y atmósferas hipnóticas para convertir la música en conexión.',
    color: '#cf4c38', image: '/artists/djs/8batzz.png', imagePosition: '50% 22%',
    imagePositionMobile: '50% 20%', gallery: [], genres: ['Afro House', 'Tech House', 'Afro Melodic'], hireable: true,
    story: 'Nacido en Pereira, 8BATZZ encontró en la música una herramienta de transformación personal. Su curiosidad por las vibraciones del sonido y el desarrollo personal dio forma a una identidad que conecta grooves profundos, percusión orgánica y atmósferas creadas para la pista. Como DJ ha llevado su propuesta a escenarios de Miami y Nueva York, incluidos MITA y La Escena. En SOLARIS comparte una selección junto a Esteban Arenas.',
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/8batzz/' },
      { label: 'Beatport', url: 'https://www.beatport.com/artist/8batzz/1256537' },
      { label: 'SoundCloud', url: 'https://soundcloud.com/user-628165542' },
    ],
  },
  {
    id: 'esteban-arenas', name: 'Esteban Arenas', location: 'Medellín, Colombia',
    bio: 'DJ y productor colombiano con una propuesta que cruza Afro House, Tech House y Groove House: grooves precisos, percusión orgánica y energía para la pista.',
    color: '#bb9a5e', image: '/artists/djs/esteban-arenas.png', imagePosition: '50% 22%',
    imagePositionMobile: '50% 20%', gallery: [], genres: ['Afro House', 'Tech House', 'Groove House'], hireable: true,
    story: 'Esteban Daniel Arenas Cardona nació el 23 de febrero de 2001 en Armenia, Quindío. Empezó como DJ autodidacta en 2017 y obtuvo el segundo lugar en DJ Contest Quindío a los 16 años. Se formó en la Escuela EP Circasia y en 2018 se trasladó a Medellín para estudiar producción musical en DJ Station, donde se graduó en 2020. En 2021 fue nominado en los premios CDA como Mejor DJ Academia. Entre sus influencias están Carl Cox, Marco Carola, The Martinez Brothers y Black Coffee. Ha firmado producciones con sellos nacionales e internacionales; “Ponce” fue publicado por Rituals. También ha lanzado “La Aldea”, “Rápido”, “Apocalipsis”, “Tírese Muchacho”, “Fogo” y “Elewy”. En SOLARIS comparte una colección con 8BATZZ.',
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/estebanarenas_dj/' },
      { label: 'YouTube', url: 'https://www.youtube.com/@djestebanarenas' },
      { label: 'Beatport', url: 'https://www.beatport.com/artist/esteban-arenas/1008127' },
      { label: 'SoundCloud', url: 'https://soundcloud.com/esteban-arenasdj' },
    ],
  },
  {
    id: 'mara', name: 'DJ Mara', location: 'Colombia',
    bio: 'DJ y productor colombiano con más de 30 años en la escena electrónica internacional. Su repertorio recorre techno, house, trance y ambient.',
    color: '#b84235', image: '/artists/djs/mara.png', genres: ['Techno', 'House', 'Trance', 'Ambient'], hireable: true, highlights: ['Más de 30 años de trayectoria', '50+ contrataciones'],
    story: 'Juan Carlos, conocido artísticamente como DJ Mara, inició su recorrido tocando en fiestas y eventos locales a comienzos de los años noventa. En 1995 se trasladó a Manizales, donde se integró a la escena electrónica y desarrolló una trayectoria de más de tres décadas en clubes y festivales. Su selección musical se mueve entre techno, house, trance y ambient.',
    links: [{ label: 'Beatport', url: 'https://www.beatport.com/artist/dj-mara/128294' }, { label: 'Traxsource', url: 'https://www.traxsource.com/artist/76692/dj-mara' }, { label: 'Instagram', url: 'https://www.instagram.com/djmaranew/' }],
  },
  {
    id: 'mulan', name: 'Mulan Vibes', location: 'Miami, Estados Unidos',
    bio: 'DJ y productora con sets de House, Tech House y Afro House, conocidos por su presencia escénica y conexión con el público.',
    color: '#7a4568', image: '/artists/djs/mulan.png', genres: ['House', 'Tech House', 'Afro House'], hireable: true, highlights: ['22+ contrataciones'],
    story: 'Mulan Vibes es una DJ y productora cuya propuesta combina House, Tech House y Afro House. Sus presentaciones y producciones buscan conectar con el público a través del ritmo, la energía y una selección dinámica.',
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/mulan.vibes/' }],
  },
  {
    id: 'joseph-ren', name: 'Joseph Ren', location: 'Colombia',
    bio: 'DJ y productor colombiano de música electrónica. Empezó sus estudios musicales a los 17 años y debutó como DJ en Miami con Ritmik Records.',
    color: '#52716a', image: '/artists/djs/joseph-ren.png', hireable: true, highlights: ['12+ contrataciones'],
    story: 'Juan José Rivera Rendón, conocido como Joseph Ren, se acercó a la música desde niño. A los 17 años comenzó sus estudios musicales con el ingeniero Maurizio Ruggiero. Un año después debutó como DJ para Ritmik Records en un club underground de Miami.',
    links: [{ label: 'Spotify', url: 'https://open.spotify.com/artist/0TG7p0ATDDBfhBjl9EBvIb' }, { label: 'Apple Music', url: 'https://music.apple.com/co/artist/joseph-ren/1550437606' }, { label: 'Beatport', url: 'https://www.beatport.com/artist/joseph-ren/1047896' }, { label: 'Instagram', url: 'https://www.instagram.com/josephren__/' }, { label: 'YouTube', url: 'https://www.youtube.com/channel/UCGs1EkjUr4bruqvE5F_-sVw' }, { label: 'Contacto', url: 'mailto:infojosephren@gmail.com' }],
  },
  {
    id: 'redbeard', name: 'Redbeard', location: 'Medellín, Colombia',
    bio: 'DJ y productor de Tech House y Minimal Deep Tech, con lanzamientos en Kubo Records, SexAppeal Music, Kore Music y Samba.',
    color: '#8b493b', image: '/artists/djs/redbeard.png', genres: ['Tech House', 'Minimal Deep Tech'], hireable: true,
    story: 'Víctor Duque, conocido como Redbeard, comenzó su carrera como DJ en 2020 y luego se enfocó en producción. Su sonido combina percusión, melodías frescas, bajos potentes y texturas underground. Ha publicado música en Kubo Records, SexAppeal Music, Kore Music y Samba. Entre sus tracks están “Taste”, “Sleet”, “Montana”, “Sonoma”, “Bisonte”, “Marbella”, “KTOMA” y “High Frequency”.',
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/redbearddj/' }],
  },
  {
    id: 'rizzo', name: 'Rizzo (Col)', location: 'Pereira, Colombia',
    bio: 'DJ y productor con presentaciones en clubes y festivales de Colombia y Ecuador.',
    color: '#c08a45', image: '/artists/djs/rizzo.png', genres: ['House', 'Tech House'], hireable: true, highlights: ['15+ contrataciones'],
    story: 'Santiago Rizzo, conocido como Rizzo (Col), ha tocado en espacios como Baum y Baum Park en Bogotá y Medellín, Radio Studio, Octava, Palmar, El Fabuloso, Vida y Open Santa Marta. También se ha presentado en House For All y Solarium Festival, y en eventos en Ecuador. Su recorrido abarca clubes y festivales en distintas ciudades de Colombia.',
    links: [{ label: 'Spotify', url: 'https://open.spotify.com/artist/6Ike4d8m5qsTPxm97gvEyx' }, { label: 'Instagram', url: 'https://www.instagram.com/rizzocol/' }],
  },
  { id: 'alankoll', name: 'Alankoll', location: '', bio: 'Colaborador de 8BATZZ y Esteban Arenas en “Arkana”.', color: '#4a665c' },
];

export const RELEASES: Release[] = [
  { id: 'lose-control', title: 'Lose Control', artistIds: ['8batzz'], type: 'Sencillo', price: 0, cover: '/artists/djs/8batzz.png', description: 'Original Mix de 8BATZZ.', trackIds: ['lose-control'], demoOnly: true },
  { id: 'arkana', title: 'Arkana', artistIds: ['8batzz', 'esteban-arenas', 'alankoll'], type: 'Sencillo', price: 0, cover: '/images/music/vinyl-record.png', description: 'Original Mix de 8BATZZ, Esteban Arenas y Alankoll.', trackIds: ['arkana'], demoOnly: true },
  { id: 'idxx', title: 'IDxx', artistIds: ['esteban-arenas', '8batzz'], type: 'Sencillo', price: 0, cover: '/images/music/vinyl-record.png', description: 'Original Mix de Esteban Arenas y 8BATZZ.', trackIds: ['idxx'], demoOnly: true },
  {
    id: 'solaris', title: 'SOLARIS', artistIds: ['8batzz', 'esteban-arenas'], type: 'Álbum',
    price: 0, cover: '/releases/solaris-cover.jpg', description: 'Una colección de 10 tracks de 8BATZZ y Esteban Arenas: Afro House, Tech House y Groove House para llevar otra energía a la cabina.',
    trackIds: [], comingSoon: true, trackCount: 10,
    packageDetails: ['10 canciones completas', 'Archivos WAV de 24 bits', 'Extended Mix para DJs', 'Portada oficial', 'Descarga digital'],
    licenseTerms: ['Permitido: tocar la música en eventos y discotecas, publicar sets en YouTube o SoundCloud y compartir fragmentos en Instagram y TikTok.', 'No permitido: revender, redistribuir ni registrar los tracks a nombre propio.'],
  },
];

export const TRACKS: Track[] = [
  { id: 'lose-control', title: 'Lose Control', version: 'Original Mix', artistIds: ['8batzz'], releaseId: 'lose-control', duration: '04:32', previewSeconds: 30, previewUrl: '/audio/previews/8batzz-lose-control-preview.wav', price: 0, cover: RELEASES[0].cover, demoOnly: true },
  { id: 'arkana', title: 'Arkana', version: 'Original Mix', artistIds: ['8batzz', 'esteban-arenas', 'alankoll'], releaseId: 'arkana', duration: '06:07', previewSeconds: 30, previewUrl: '/audio/previews/arkana-preview.wav', price: 0, cover: RELEASES[1].cover, demoOnly: true },
  { id: 'idxx', title: 'IDxx', version: 'Original Mix', artistIds: ['esteban-arenas', '8batzz'], releaseId: 'idxx', duration: '07:00', previewSeconds: 30, previewUrl: '/audio/previews/idxx-preview.wav', price: 0, cover: RELEASES[2].cover, demoOnly: true },
];

export const artistName = (ids: string[], artists: Artist[] = ARTISTS) => ids.map((id) => artists.find((artist) => artist.id === id)?.name).filter(Boolean).join(' · ');
export const releaseById = (id: string) => RELEASES.find((release) => release.id === id);
export const trackById = (id: string) => TRACKS.find((track) => track.id === id);
export const artistById = (id: string) => ARTISTS.find((artist) => artist.id === id);
export const formatCOP = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
export const releaseOffer = (release: Release, artists: Artist[] = ARTISTS): ProductOffer => ({ id: `release:${release.id}`, kind: 'release', title: release.title, artist: artistName(release.artistIds, artists), price: release.price, cover: release.cover, releaseId: release.id });
export const trackOffer = (track: Track, artists: Artist[] = ARTISTS): ProductOffer => ({ id: `track:${track.id}`, kind: 'track', title: track.title, artist: artistName(track.artistIds, artists), price: track.price, cover: track.cover, releaseId: track.releaseId, trackId: track.id });

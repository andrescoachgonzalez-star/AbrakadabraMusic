'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, Clock3, Disc3, Download,
  Heart, Library, Menu, Music2, Pause, Play, Plus, Search, ShoppingBag, ShoppingCart,
  SlidersHorizontal, Sparkles, UserRound, Volume2, X,
} from 'lucide-react';
import {
  ARTISTS, RELEASES, TRACKS, Artist, ProductOffer, Release, Track,
  artistById, artistName, formatCOP, releaseById, releaseOffer, trackById, trackOffer,
} from '@/lib/catalog';
import { ArtistApplication, createArtistApplication, createArtistProfile, createMusicOrder, createMusicRelease, createMusicTrack, fetchMusicBestsellers, fetchMusicCatalog, fallbackCatalog, getArtistProfile, getMusicLibrary, getMusicMe, getMusicOrders, getMyArtistApplications, loginMusic, MUSIC_API_URL, MUSIC_TOKEN_KEY, MusicCatalog, MusicEntitlement, MusicOrder, MusicUser, registerMusic, simulateMusicPayment, submitMusicRelease, uploadMusicFile } from '@/lib/music-api';
import TrackVisualizer from '@/components/track-visualizer';
import AlbumVinylArtwork from '@/components/album-vinyl-artwork';

type CartLine = ProductOffer;
type MusicContextValue = {
  catalog: MusicCatalog;
  catalogLoading: boolean;
  musicUser: MusicUser | null;
  authLoading: boolean;
  loginMusicUser: (email: string, password: string) => Promise<MusicUser>;
  registerMusicUser: (email: string, username: string, password: string) => Promise<MusicUser>;
  logoutMusicUser: () => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  audioError: string | null;
  audioAnalyser: AnalyserNode | null;
  playTrack: (track: Track) => void;
  seekTo: (time: number) => void;
  togglePlayback: () => void;
  dismissPlayer: () => void;
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (offer: ProductOffer) => void;
  removeFromCart: (id: string) => void;
  cartNotice: string | null;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  demoUser: boolean;
  setDemoUser: (value: boolean) => void;
};

const MusicContext = React.createContext<MusicContextValue | null>(null);

export function useMusic() {
  const context = React.useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used inside MusicProvider');
  return context;
}

const DEMO_AUDIO_URL = '/audio/nighttime-solitude-cc0.mp3';

function hasArtistRole(user: MusicUser | null) {
  return user?.roles?.some((role) => role.slug === 'artista') ?? false;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pendingPlay = useRef(false);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(4);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [demoUser, setDemoUser] = useState(false);
  const [catalog, setCatalog] = useState<MusicCatalog>(fallbackCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [musicUser, setMusicUser] = useState<MusicUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem('abrakadabra-music-cart');
      const savedFavorites = window.localStorage.getItem('abrakadabra-music-favorites');
      setCart(savedCart ? JSON.parse(savedCart) : []);
      setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
      setDemoUser(window.localStorage.getItem('abrakadabra-music-user') === 'true');
    } catch {
      setCart([]); setFavorites([]);
    }
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    try {
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextConstructor) {
        const context = new AudioContextConstructor();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = .78;
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        audioContextRef.current = context;
        audioSourceRef.current = source;
        setAudioAnalyser(analyser);
      }
    } catch {
      setAudioAnalyser(null);
    }
    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 4);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    const onError = () => { setIsPlaying(false); setAudioError('No pudimos cargar este preview de demo.'); };
    audio.addEventListener('timeupdate', onTime); audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended', onEnded); audio.addEventListener('error', onError);
    return () => {
      audio.pause(); audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended', onEnded); audio.removeEventListener('error', onError);
      audioSourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem(MUSIC_TOKEN_KEY)) {
      setAuthLoading(false);
      return;
    }
    getMusicMe()
      .then((data) => setMusicUser(data.user))
      .catch(() => window.localStorage.removeItem(MUSIC_TOKEN_KEY))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchMusicCatalog().then((remoteCatalog) => {
      if (!mounted) return;
      if (remoteCatalog) setCatalog(remoteCatalog);
      setCatalogLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!activeTrack || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = activeTrack.previewUrl || DEMO_AUDIO_URL;
    audio.load();
    audio.currentTime = 0;
    setProgress(0); setAudioError(null);
    if (pendingPlay.current) {
      pendingPlay.current = false;
      audioContextRef.current?.resume();
      audio.play().then(() => setIsPlaying(true)).catch(() => setAudioError('El dispositivo bloqueó la reproducción. Pulsa play para intentar de nuevo.'));
    }
  }, [activeTrack]);

  useEffect(() => {
    try { window.localStorage.setItem('abrakadabra-music-cart', JSON.stringify(cart)); } catch { /* demo persistence is optional */ }
  }, [cart]);
  useEffect(() => {
    try { window.localStorage.setItem('abrakadabra-music-favorites', JSON.stringify(favorites)); } catch { /* demo persistence is optional */ }
  }, [favorites]);
  useEffect(() => {
    try { window.localStorage.setItem('abrakadabra-music-user', String(demoUser)); } catch { /* demo persistence is optional */ }
  }, [demoUser]);

  const playTrack = (track: Track) => {
    if (activeTrack?.id === track.id) { togglePlayback(); return; }
    pendingPlay.current = true; setActiveTrack(track);
  };
  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0 || !Number.isFinite(time)) return;
    const nextTime = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = nextTime;
    setProgress(nextTime);
  };
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;
    if (audio.paused) { audioContextRef.current?.resume(); audio.play().then(() => setIsPlaying(true)).catch(() => setAudioError('Pulsa play otra vez para reproducir el demo.')); }
    else { audio.pause(); setIsPlaying(false); }
  };
  const dismissPlayer = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setProgress(0);
    setActiveTrack(null);
    pendingPlay.current = false;
  };
  const addToCart = (offer: ProductOffer) => {
    const duplicate = cart.some((line) => line.id === offer.id);
    if (duplicate) { setCartNotice('Esta oferta ya está en tu carrito.'); return; }
    const conflict = cart.find((line) => line.releaseId === offer.releaseId && line.kind !== offer.kind);
    if (conflict) { setCartNotice(`“${offer.title}” ya está incluido en “${conflict.title}”. No cambiamos tu carrito automáticamente.`); return; }
    setCart((current) => [...current, offer]); setCartNotice(`Añadido: ${offer.title}`); setCartOpen(false);
    window.setTimeout(() => setCartNotice(null), 3600);
  };
  const removeFromCart = (id: string) => setCart((current) => current.filter((line) => line.id !== id));
  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const loginMusicUser = async (email: string, password: string) => {
    const data = await loginMusic(email, password);
    setMusicUser(data.user);
    setDemoUser(true);
    return data.user;
  };
  const registerMusicUser = async (email: string, username: string, password: string) => {
    const data = await registerMusic({ email, username, password });
    setMusicUser(data.user);
    setDemoUser(true);
    return data.user;
  };
  const logoutMusicUser = () => {
    window.localStorage.removeItem(MUSIC_TOKEN_KEY);
    setMusicUser(null);
    setDemoUser(false);
  };

  return <MusicContext.Provider value={{ catalog, catalogLoading, musicUser, authLoading, loginMusicUser, registerMusicUser, logoutMusicUser, activeTrack, isPlaying, progress, duration, audioError, audioAnalyser, playTrack, seekTo, togglePlayback, dismissPlayer, cart, cartOpen, setCartOpen, addToCart, removeFromCart, cartNotice, favorites, toggleFavorite, demoUser, setDemoUser }}>{children}</MusicContext.Provider>;
}

function Logo() {
  return <Link href="/" className="brand-mark" aria-label="Abrakadabra Music, inicio"><img src="/Logo.png" alt="" /><span><strong>ABRAKADABRA</strong><small>MUSIC</small></span></Link>;
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cart, setCartOpen, demoUser } = useMusic();
  const isArtistRoute = pathname.startsWith('/artists/');
  const isHomeRoute = pathname === '/';
  const links = [['Música', '/releases'], ['Artistas', '/artists'], ['Pistas', '/tracks'], ['Buscar', '/search']];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <header className={`site-header ${isArtistRoute ? 'site-header-artist' : ''} ${isHomeRoute ? 'site-header-home' : ''} ${isArtistRoute && scrolled ? 'is-scrolled' : ''}`}>
    <div className="header-inner">
      <Logo />
      <nav className={`main-nav ${mobileOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        {links.map(([label, href]) => <Link key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? 'active' : ''} onClick={() => setMobileOpen(false)}>{label}</Link>)}
        <a href="https://abrakadabrarealm.com" target="_blank" rel="noreferrer" className="realm-link">Realm ↗</a>
      </nav>
      <div className="header-actions">
        <Link href={demoUser ? '/account' : '/account/login'} className="icon-action" aria-label="Cuenta"><UserRound size={18} /><span className="action-label">Cuenta</span></Link>
        <button className="icon-action cart-action" onClick={() => setCartOpen(true)} aria-label={`Carrito, ${cart.length} productos`}><ShoppingCart size={18} /><span className="action-label">Carrito</span>{cart.length > 0 && <b>{cart.length}</b>}</button>
        <button className="menu-button" aria-label="Abrir menú" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="site-footer"><div><Logo /><p>Una tienda pequeña para escuchar<br />con atención y apoyar directamente.</p></div><div className="footer-links"><span>01 / Música</span><Link href="/artists">Artistas</Link><Link href="/artists#artist-booking">Contrataciones</Link><Link href="/releases">Lanzamientos</Link><Link href="/search">Buscar</Link></div><div className="footer-links"><span>02 / Abrakadabra</span><a href="https://abrakadabrarealm.com" target="_blank" rel="noreferrer">Abrakadabra Realm ↗</a><a href="mailto:hello@abrakadabrarealm.com">Contacto</a><small>Catálogo editorial · COP</small></div></footer>;
}

function SectionHeading({ eyebrow, title, link, href }: { eyebrow: string; title: string; link?: string; href?: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link && href && <Link href={href} className="text-link">{link} <ArrowRight size={16} /></Link>}</div>;
}

function PlayButton({ track, large = false, tabIndex }: { track: Track; large?: boolean; tabIndex?: number }) {
  const { activeTrack, isPlaying, playTrack } = useMusic();
  const active = activeTrack?.id === track.id;
  return <button className={`play-button ${large ? 'large' : ''} ${active && isPlaying ? 'playing' : ''}`} tabIndex={tabIndex} onClick={() => playTrack(track)} aria-label={`${active && isPlaying ? 'Pausar' : 'Escuchar'} demo de ${track.title}`}>{active && isPlaying ? <Pause size={large ? 20 : 15} fill="currentColor" /> : <Play size={large ? 20 : 15} fill="currentColor" />}</button>;
}

function PriceButton({ offer, label = 'Añadir' }: { offer: ProductOffer; label?: string }) {
  const { addToCart } = useMusic();
  return <button className="price-button" onClick={() => addToCart(offer)}><span>{label}</span><strong>{formatCOP(offer.price)}</strong></button>;
}

function ReleaseCard({ release, featured = false }: { release: Release; featured?: boolean }) {
  const { favorites, toggleFavorite, catalog } = useMusic();
  const favorite = favorites.includes(release.id);
  const year = release.date ? new Date(release.date).getFullYear() : null;
  return <article className={`release-card ${featured ? 'featured-card' : ''}`}>
    <div className="cover-wrap"><Link href={`/releases/${release.id}`} aria-label={`Ver lanzamiento ${release.title}`}><AlbumVinylArtwork cover={release.cover} title={release.title} size="card" coverFit={release.id === 'solaris' ? 'contain' : 'cover'} /></Link><button className={`favorite-button ${favorite ? 'saved' : ''}`} onClick={() => toggleFavorite(release.id)} aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button><span className={`demo-stamp ${release.comingSoon ? 'upcoming-stamp' : ''}`}>{release.comingSoon ? 'próximamente' : 'demo'}</span></div>
    <div className="card-meta"><div><p className="card-kicker">{release.type}{year ? ` · ${year}` : release.comingSoon ? ` · Próximamente · ${release.trackCount} pistas` : ' · Demo'}</p><Link href={`/releases/${release.id}`} className="card-title">{release.title}</Link><p className="card-artist">{artistName(release.artistIds, catalog.artists)}</p></div>{release.comingSoon ? <span className="coming-soon-label">Precio por anunciar</span> : release.demoOnly ? <span className="demo-only-label">Solo demo</span> : <PriceButton offer={releaseOffer(release, catalog.artists)} />}</div>
  </article>;
}

function ArtistCard({ artist }: { artist: Artist }) {
  const monogram = artist.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3);
  return <Link href={`/artists/${artist.id}`} className="artist-card"><div className="artist-photo">{artist.image ? <img src={artist.image} alt={`Retrato de ${artist.name}`} /> : <div className="artist-photo-placeholder" style={{ '--artist-color': artist.color } as React.CSSProperties} aria-hidden="true"><span>{monogram}</span><small>IMAGEN PENDIENTE</small></div>}</div><p className="card-kicker">{artist.location}</p><h3>{artist.name}</h3><p className="artist-card-bio">{artist.bio}</p>{artist.genres?.length ? <div className="artist-card-genres">{artist.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div> : null}{artist.highlights?.length ? <p className="artist-card-highlights">{artist.highlights.join(' · ')}</p> : null}<span>Ver perfil <ArrowRight size={14} /></span></Link>;
}

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { addToCart, favorites, toggleFavorite, catalog } = useMusic();
  const saved = favorites.includes(track.id);
  return <div className="track-row"><span className="track-number">{String(index + 1).padStart(2, '0')}</span><PlayButton track={track} /><div className="track-info"><Link href={`/tracks/${track.id}`}>{track.title}</Link><span>{artistName(track.artistIds, catalog.artists)}{track.version ? ` · ${track.version}` : ''}</span></div><div className="track-facts"><span>{track.genre || '—'}</span><span>{track.bpm ? `${track.bpm} BPM` : '—'}</span></div><span className="track-duration">{track.duration}</span><button className={`row-icon ${saved ? 'saved' : ''}`} onClick={() => toggleFavorite(track.id)} aria-label="Guardar pista"><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>{!track.demoOnly && <button className="row-buy" onClick={() => addToCart(trackOffer(track, catalog.artists))} aria-label={`Añadir ${track.title} al carrito`}><Plus size={17} /></button>}</div>;
}

export function PlayerBar() {
  const { activeTrack, isPlaying, progress, duration, seekTo, togglePlayback, dismissPlayer, audioError, setCartOpen, addToCart, catalog } = useMusic();
  if (!activeTrack) return null;
  const ratio = duration ? Math.min(100, (progress / duration) * 100) : 0;
  return <aside className="player-bar" aria-label="Reproductor de demos"><button className="player-close" type="button" onClick={dismissPlayer} aria-label="Cerrar reproductor"><X size={17} /></button><div className="player-art"><img src={activeTrack.cover} alt="" /></div><div className="player-track"><strong>{activeTrack.title}</strong><span>{artistName(activeTrack.artistIds, catalog.artists)} · {activeTrack.demoOnly ? 'preview 0:30' : 'preview'}</span></div><PlayButton track={activeTrack} large /><div className="player-progress"><input className="seek-slider" type="range" min={0} max={Math.max(1, duration)} step={1} value={Math.min(progress, duration)} style={{ '--seek-progress': `${ratio}%` } as React.CSSProperties} onChange={(event) => seekTo(Number(event.currentTarget.value))} aria-label={`Buscar posición en ${activeTrack.title}`} aria-valuetext={`${formatTime(progress)} de ${formatTime(duration)}`} /><div className="player-time"><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div></div>{!activeTrack.demoOnly && <button className="player-buy" onClick={() => addToCart(trackOffer(activeTrack, catalog.artists))}><ShoppingBag size={16} /> <span>Comprar</span></button>}<button className="player-queue" onClick={() => setCartOpen(true)} aria-label="Abrir cola y carrito"><Library size={17} /></button>{audioError && <span className="sr-only" role="status">{audioError}</span>}</aside>;
}

function formatTime(value: number) { const totalSeconds = Math.max(0, Math.floor(value)); return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`; }

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart } = useMusic();
  if (!cartOpen) return null;
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Tu carrito"><div className="drawer-head"><div><p className="eyebrow">Tu selección</p><h2>Carrito <span>{cart.length}</span></h2></div><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X size={20} /></button></div>{cart.length === 0 ? <div className="empty-state"><ShoppingBag size={28} /><h3>Tu carrito está en silencio.</h3><p>Guarda un lanzamiento o una pista para volver a escucharlo aquí.</p><Link href="/releases" className="button button-dark">Explorar música <ArrowRight size={16} /></Link></div> : <><div className="drawer-lines">{cart.map((item) => <div className="cart-line" key={item.id}><img src={item.cover} alt="" /><div><strong>{item.title}</strong><span>{item.artist} · {item.kind === 'release' ? 'lanzamiento' : 'pista'}</span><button onClick={() => removeFromCart(item.id)}>Quitar</button></div><b>{formatCOP(item.price)}</b></div>)}</div><div className="drawer-total"><span>Total provisional</span><strong>{formatCOP(total)}</strong><small>Compra simulada · moneda COP</small><Link href="/checkout" className="button button-red">Ir a checkout <ArrowRight size={16} /></Link></div></>}</aside></div>;
}

export function Notice() { const { cartNotice } = useMusic(); return cartNotice ? <div className="toast" role="status"><Check size={16} /> {cartNotice}</div> : null; }

function HomePageLegacy() {
  const featured = RELEASES[0];
  const featureTrack = TRACKS[0];
  const featuredArtist = artistById('lua-mar') || ARTISTS[0];
  const { playTrack } = useMusic();
  return <>
    <section className="hero container"><div className="hero-copy"><p className="hero-lockup"><span>ABRAKADABRA</span><em>/ MUSIC</em></p><p className="eyebrow">01 / Nueva frecuencia · catálogo demo</p><h1>La música<br /><em>también</em> se colecciona.</h1><p className="hero-intro">Escucha el pulso de artistas que están construyendo la próxima noche. Compra directo, guarda lo que encuentres y vuelve cuando quieras.</p><div className="hero-actions"><button className="button button-red" onClick={() => playTrack(featureTrack)}>Escuchar demo <Play size={16} fill="currentColor" /></button><Link href={`/releases/${featured.id}`} className="button button-ghost">Ver lanzamiento <ArrowRight size={16} /></Link></div><p className="hero-note"><span className="signal-dot" /> Preview sintético de demostración · sin reproducción automática</p></div><div className="hero-art"><div className="hero-photo"><div className="hero-art-index">ABK / 001</div><img src={featuredArtist.image || featured.cover} alt={`Retrato editorial demo de ${featuredArtist.name}`} /><span className="hero-photo-caption">LUA MAR · MEDELLÍN</span></div><div className="hero-cover-inset"><img src={featured.cover} alt="Portada demo de Luz de sal" /><span>LUZ DE SAL<br />EP · 2026</span></div></div></section>
    <section className="signal-strip"><div className="container signal-grid"><span>Escucha</span><i /><span>Explora</span><i /><span>Apoya</span><i /><span>Repite</span><p>ABRAKADABRA MUSIC <small>— una tienda para volver</small></p></div></section>
    <section className="section container"><SectionHeading eyebrow="02 / El pulso" title="Artistas que dejan señal" link="Ver todos" href="/artists" /><div className="artist-grid">{ARTISTS.slice(0, 4).map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div></section>
    <section className="section section-ink"><div className="container"><SectionHeading eyebrow="03 / Recién llegado" title="Lanzamientos para escuchar lento" link="Ver catálogo" href="/releases" /><div className="release-grid">{RELEASES.slice(0, 3).map((release) => <ReleaseCard key={release.id} release={release} />)}</div></div></section>
    <section className="section container tracks-section"><SectionHeading eyebrow="04 / Selección editorial" title="Una pista abre la puerta" link="Todas las pistas" href="/tracks" /><div className="track-list">{TRACKS.slice(0, 5).map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></section>
    <section className="editorial container"><div><p className="eyebrow">05 / Nota de escucha</p><h2>Comprar una canción<br /><em>es dejarla existir.</em></h2></div><div><p>Este catálogo semilla es una demostración de la futura tienda de música de Abrakadabra: un lugar con artistas protagonistas, previews autorizados y compras digitales claras.</p><Link href="/account" className="text-link">Conoce tu biblioteca <ArrowRight size={16} /></Link></div></section>
  </>;
}

function FeaturedPanel({ release, index, active, onHover }: { release: Release; index: number; active: boolean; onHover: () => void }) {
  const year = release.date ? new Date(release.date).getFullYear() : null;
  const { activeTrack, isPlaying, catalog } = useMusic();
  const releasePlaying = isPlaying && Boolean(activeTrack && release.trackIds.includes(activeTrack.id));
  return <article className={`featured-panel ${active ? 'is-active' : ''}`} onMouseEnter={onHover}>
    <div className="featured-panel-media">
      <AlbumVinylArtwork cover={release.cover} title={release.title} size="gallery" isActive={active} isPlaying={releasePlaying} isSpinning coverFit={release.id === 'solaris' ? 'contain' : 'cover'} />
      <Link className="featured-panel-select" href={`/releases/${release.id}`} aria-label={`Abrir lanzamiento ${release.title}`}><span className="sr-only">Abrir lanzamiento {release.title}</span></Link>
      <span className="featured-panel-index">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <div className="featured-panel-info" aria-hidden={!active}>
      <div className="featured-panel-copy">
        <p className="featured-panel-kicker">{release.type}{year ? ` · ${year}` : ' · Demo'} · {artistName(release.artistIds, catalog.artists)}</p>
        <h2>{release.title}</h2>
        <p className="featured-panel-description">{release.description}</p>
        <strong>{release.comingSoon ? 'Próximamente' : release.demoOnly ? 'Demo de escucha' : formatCOP(release.price)}</strong>
      </div>
    </div>
  </article>;
}

function FeaturedGallery() {
  const [activeId, setActiveId] = useState<string | null>('solaris');
  const { catalog, catalogLoading } = useMusic();
  const featuredReleases = [...catalog.releases.filter((release) => release.id === 'solaris'), ...catalog.releases.filter((release) => release.id !== 'solaris')].slice(0, 5);
  return <section className="featured-gallery container" aria-labelledby="featured-gallery-title" onMouseLeave={() => setActiveId('solaris')}>
    <div className="featured-gallery-heading"><p className="eyebrow" id="featured-gallery-title">01 / Archivo abierto</p><p>{catalogLoading ? 'Cargando catálogo…' : 'Pasa por una portada para entrar.'}</p></div>
    <div className="featured-gallery-track" role="list" aria-label="Lanzamientos destacados">
      {featuredReleases.map((release, index) => <FeaturedPanel key={release.id} release={release} index={index} active={activeId === release.id} onHover={() => setActiveId(release.id)} />)}
    </div>
  </section>;
}

function HomePage() {
  const { catalog } = useMusic();
  const [bestSellers, setBestSellers] = useState<Array<{ kind: 'release' | 'track'; id: string; units: number }>>([]);
  useEffect(() => { void fetchMusicBestsellers().then(setBestSellers); }, []);
  const popular = bestSellers.map((item) => item.kind === 'release' ? catalog.releases.find((release) => release.id === item.id) : catalog.tracks.find((track) => track.id === item.id)).filter(Boolean);
  return <div className="homepage-shell">
    <FeaturedGallery />
    <section className="section container"><SectionHeading eyebrow="02 / Artistas destacados" title="Artistas que dejan señal" link="Ver todos" href="/artists" /><div className="artist-grid">{catalog.artists.slice(0, 4).map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div></section>
    <section className="section section-ink"><div className="container"><SectionHeading eyebrow="03 / Recién llegado" title="Lanzamientos para escuchar lento" link="Ver catálogo" href="/releases" /><div className="release-grid">{catalog.releases.slice(0, 3).map((release) => <ReleaseCard key={release.id} release={release} />)}</div></div></section>
    <section className="section container tracks-section"><SectionHeading eyebrow="04 / Selección editorial" title="Una pista abre la puerta" link="Todas las pistas" href="/tracks" /><div className="track-list">{catalog.tracks.slice(0, 5).map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></section>
    <section className="section container"><SectionHeading eyebrow="05 / Artistas para tu evento" title="La música también se vive en directo" link="Ver artistas y contratar" href="/artists#artist-booking" /><div className="artist-grid">{catalog.artists.filter((artist) => artist.hireable).slice(0, 4).map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div></section>
    <section className="section section-ink"><div className="container"><SectionHeading eyebrow="06 / Más vendidos" title="Lo que ya eligió la gente" link="Ver catálogo" href="/releases" />{popular.length ? <div className="release-grid">{popular.slice(0, 3).map((item) => item && ('trackIds' in item ? <ReleaseCard key={`release-${item.id}`} release={item} /> : <article className="release-card best-seller-track" key={`track-${item.id}`}><TrackRow track={item} index={0} /></article>))}</div> : <p className="honest-empty">Aún no hay compras confirmadas para mostrar como más vendidos.</p>}</div></section>
    <section className="section container testimonial-section"><p className="eyebrow">07 / Voces de la pista</p><h2>Opiniones de quienes<br /><em>ya lo escucharon.</em></h2><p>Aún no tenemos testimonios verificados para publicar. Cuando recibamos la primera reseña autorizada, aparecerá aquí con el nombre de su autor.</p></section>
    <section className="editorial container"><div><p className="eyebrow">08 / Licencia de música</p><h2>Escucha, mezcla<br /><em>y respeta la autoría.</em></h2></div><div><p>Consulta las condiciones de uso compartidas para SOLARIS: usos permitidos en eventos y redes, y restricciones para proteger la autoría.</p><Link href="/licencia/solaris" className="text-link">Leer licencia informativa <ArrowRight size={16} /></Link><Link href="/account" className="text-link">Conoce tu biblioteca <ArrowRight size={16} /></Link></div></section>
  </div>;
}

function ArtistBookingForm() {
  const [selectedArtist, setSelectedArtist] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const artistId = new URLSearchParams(window.location.search).get('artist');
    const artist = ARTISTS.find((item) => item.id === artistId && item.hireable);
    if (artist) setSelectedArtist(artist.name);
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('sending'); setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fullName = String(form.get('full_name') || '').trim().split(/\s+/);
    const firstName = fullName.shift() || '';
    const lastName = fullName.join(' ') || 'Por confirmar';
    try {
      const response = await fetch(`${MUSIC_API_URL}/public/forms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form_type: 'djs', first_name: firstName, last_name: lastName, email: form.get('email'), phone_country_code: form.get('country_code'), phone_number: form.get('phone'), interest: `Contratar artista: ${form.get('artist') || 'Por recomendar'}`, social_networks: 'Solicitud enviada desde Abrakadabra Music', hiring_place: form.get('place'), approximate_date: form.get('date'), event_type: form.get('event_type'), event_visibility: form.get('visibility'), performance_hours: form.get('hours'), approximate_guests: form.get('guests') || undefined, description: form.get('details') || 'Solicitud de contratación de artista.' }) });
      if (!response.ok) throw new Error('No pudimos enviar la solicitud. Revisa los datos o inténtalo de nuevo.');
      setState('sent'); setMessage('Solicitud enviada. El equipo de Abrakadabra te contactará para revisar disponibilidad y condiciones.');
      formElement.reset(); setSelectedArtist('');
    } catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'); }
  };
  return <section className="artist-booking" id="artist-booking"><div><p className="eyebrow">Contrataciones / Artistas</p><h2>Cuéntanos sobre<br /><em>tu evento.</em></h2><p>Solicita disponibilidad de un artista. Esta solicitud no confirma una reserva ni fija un precio; el equipo se pondrá en contacto contigo.</p></div><form className="artist-booking-form" onSubmit={submit}><label>Nombre completo<input name="full_name" required minLength={2} autoComplete="name" /></label><label>Correo electrónico<input name="email" type="email" required autoComplete="email" /></label><div className="form-row"><label>Código de país<input name="country_code" type="tel" required pattern="\+\d{1,6}" defaultValue="+57" /></label><label>Teléfono<input name="phone" type="tel" required minLength={4} autoComplete="tel" /></label></div><label>Artista<select name="artist" value={selectedArtist} onChange={(event) => setSelectedArtist(event.target.value)}><option value="">Elige o solicita una recomendación</option>{ARTISTS.filter((artist) => artist.hireable).map((artist) => <option key={artist.id} value={artist.name}>{artist.name}</option>)}</select></label><div className="form-row"><label>Lugar del evento<input name="place" required /></label><label>Fecha aproximada<input name="date" type="date" required /></label></div><div className="form-row"><label>Tipo de evento<input name="event_type" required placeholder="Festival, club, evento privado…" /></label><label>Visibilidad<select name="visibility" defaultValue="private"><option value="private">Privado</option><option value="public">Público</option></select></label></div><div className="form-row"><label>Duración de la presentación<input name="hours" required placeholder="Ej. 2 horas" /></label><label>Asistencia aproximada<input name="guests" placeholder="Opcional" /></label></div><label>Detalles del evento<textarea name="details" rows={4} maxLength={4000} placeholder="Cuéntanos el horario, el tipo de público u otros requisitos." /></label>{message && <p className={state === 'error' ? 'form-error' : 'form-success'} role={state === 'error' ? 'alert' : 'status'}>{message}</p>}<button className="button button-red" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando solicitud…' : 'Enviar solicitud'} <ArrowRight size={15} /></button></form></section>;
}

function SolarisLicensePage() {
  return <PageFrame eyebrow="SOLARIS / Licencia informativa" title="Condiciones de uso" intro="Resumen de las condiciones compartidas para el álbum SOLARIS. No es un contrato personalizado ni sustituye los términos finales de compra."><section className="license-card"><p className="eyebrow">Usos permitidos</p><ul><li>Reproducir la música en eventos, clubes y discotecas.</li><li>Publicar sets que incluyan estas canciones en YouTube o SoundCloud.</li><li>Compartir fragmentos en Instagram y TikTok.</li></ul><p className="eyebrow">Usos no permitidos</p><ul><li>Revender o redistribuir las pistas originales.</li><li>Registrar las obras a nombre propio.</li><li>Afirmar autoría o propiedad sobre la música.</li></ul><p>Los archivos completos, tracklist definitivo, precio, vendedor legal y documento final de licencia se añadirán cuando estén confirmados.</p><Link href="/releases/solaris" className="text-link">Volver a SOLARIS <ArrowRight size={15} /></Link></section></PageFrame>;
}

function ArtistsPage() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Todos');
  const { catalog } = useMusic();
  const genres = ['Todos', 'House', 'Tech House', 'Afro House', 'Techno', 'Trance', 'Ambient'];
  const filtered = catalog.artists.filter((artist) => {
    const matchesQuery = `${artist.name} ${artist.location} ${artist.bio} ${(artist.genres || []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = genre === 'Todos' || artist.genres?.includes(genre);
    return matchesQuery && matchesGenre;
  });
  return <div className="artists-page-shell"><PageFrame eyebrow="02 / Directorio" title="Artistas" intro="Conoce a los artistas de Abrakadabra, descubre su música y consulta disponibilidad para tu próximo evento."><div className="catalog-toolbar"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artista, ciudad o género" aria-label="Buscar artista, ciudad o género" /></label><span>{filtered.length} artistas</span></div><div className="filter-row artist-genre-filters"><div className="filter-tabs" aria-label="Filtrar artistas por género">{genres.map((item) => <button type="button" key={item} className={genre === item ? 'selected' : ''} aria-pressed={genre === item} onClick={() => setGenre(item)}>{item}</button>)}</div></div>{filtered.length ? <div className="artist-grid artist-grid-large">{filtered.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div> : <EmptySearch label="No encontramos artistas con esos filtros." />}<ArtistBookingForm /></PageFrame></div>;
}

function ReleasesPage() { const [filter, setFilter] = useState('Todos'); const { catalog } = useMusic(); const filtered = filter === 'Todos' ? catalog.releases : catalog.releases.filter((release) => release.type === filter); return <div className="releases-page-shell"><PageFrame eyebrow="03 / Catálogo" title="Lanzamientos" intro="Álbumes, EP y sencillos para llevarte la frecuencia completa."><div className="filter-row"><div className="filter-tabs">{['Todos', 'Álbum', 'EP', 'Sencillo'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><span><SlidersHorizontal size={15} /> Orden: recientes</span></div><div className="release-grid release-grid-large">{filtered.map((release) => <ReleaseCard key={release.id} release={release} />)}</div></PageFrame></div>; }

function TracksPage() { const { catalog } = useMusic(); return <div className="tracks-page-shell"><PageFrame eyebrow="04 / Pistas" title="Pistas" intro="La entrada más pequeña a un universo completo. Escucha el preview y compra la pista si está disponible individualmente."><div className="track-list track-list-full">{catalog.tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></PageFrame></div>; }

function SearchPage() {
  type SearchFilter = 'all' | 'album' | 'track' | 'artist';
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const { catalog } = useMusic();
  const submit = (event: FormEvent) => { event.preventDefault(); setSubmitted(query); };
  const normalized = submitted.toLowerCase();
  const tracks = filter !== 'album' && filter !== 'artist' ? catalog.tracks.filter((track) => `${track.title} ${artistName(track.artistIds, catalog.artists)}`.toLowerCase().includes(normalized)) : [];
  const releases = filter !== 'track' && filter !== 'artist' ? catalog.releases.filter((release) => `${release.title} ${artistName(release.artistIds, catalog.artists)}`.toLowerCase().includes(normalized)) : [];
  const artists = filter !== 'album' && filter !== 'track' ? catalog.artists.filter((artist) => `${artist.name} ${artist.location}`.toLowerCase().includes(normalized)) : [];
  const filterOptions: Array<{ id: Exclude<SearchFilter, 'all'>; label: string; Icon: typeof Disc3 }> = [
    { id: 'album', label: 'Filtrar álbumes', Icon: Disc3 },
    { id: 'artist', label: 'Filtrar artistas', Icon: UserRound },
    { id: 'track', label: 'Filtrar canciones', Icon: Music2 },
  ];
  return <div className="search-page-shell"><PageFrame eyebrow="05 / Buscar" title="Encuentra lo que buscas" intro="Busca por artista, lanzamiento o pista dentro del catálogo abierto."><form className="search-hero" onSubmit={submit}><div className="search-hero-control"><span className="search-hero-mark" aria-hidden="true"><Search size={22} /></span><div className="search-hero-field"><span>ARCHIVO ABIERTO / BUSCAR</span><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Artista, lanzamiento o pista" aria-label="Buscar en el catálogo" /></div><button className="search-submit" type="submit" aria-label="Buscar en el catálogo"><Search size={22} /></button></div><div className={`search-filter-rail ${filter !== 'all' ? 'has-filter' : ''}`} aria-label="Filtrar resultados">{filterOptions.map(({ id, label, Icon }) => <button key={id} className={`search-filter-button ${filter === id ? 'selected' : ''}`} type="button" aria-label={label} aria-pressed={filter === id} onClick={() => setFilter((current) => current === id ? 'all' : id)}><Icon size={20} /></button>)}<button className={`search-filter-clear ${filter !== 'all' ? 'is-active' : ''}`} type="button" aria-label="Quitar filtros" title="Quitar filtros" disabled={filter === 'all'} onClick={() => setFilter('all')}><X size={18} /></button></div></form>{submitted && <div className="search-results"><p className="eyebrow">Resultados para “{submitted}”{filter !== 'all' && ` · ${filterOptions.find((item) => item.id === filter)?.label.replace('Filtrar ', '')}`}</p>{artists.length > 0 && <><h2>Artistas</h2><div className="result-chips">{artists.map((artist) => <Link key={artist.id} href={`/artists/${artist.id}`}>{artist.name} <ArrowRight size={14} /></Link>)}</div></>}{releases.length > 0 && <><h2>Lanzamientos</h2><div className="release-grid search-release-grid">{releases.map((release) => <ReleaseCard key={release.id} release={release} />)}</div></>}{tracks.length > 0 && <><h2>Pistas</h2><div className="track-list">{tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></>}{!artists.length && !releases.length && !tracks.length && <EmptySearch label="No encontramos coincidencias. Prueba con otra frecuencia." />}</div>}</PageFrame></div>;
}

function ArtistReleaseCard({ release }: { release: Release }) {
  const { catalog } = useMusic();
  const tracks = release.trackIds.map((trackId) => catalog.tracks.find((track) => track.id === trackId)).filter(Boolean) as Track[];
  const firstTrack = tracks[0];
  const { activeTrack, isPlaying, playTrack } = useMusic();
  const playing = Boolean(firstTrack && activeTrack?.id === firstTrack.id && isPlaying);
  return <article className="artist-release-card"><div className="artist-release-art"><Link href={`/releases/${release.id}`} aria-label={`Ver lanzamiento ${release.title}`}><AlbumVinylArtwork cover={release.cover} title={release.title} size="card" coverFit={release.id === 'solaris' ? 'contain' : 'cover'} /></Link><span className="artist-release-number">{String(catalog.releases.findIndex((item) => item.id === release.id) + 1).padStart(2, '0')}</span><span className={`demo-stamp ${release.comingSoon ? 'upcoming-stamp' : ''}`}>{release.comingSoon ? 'próximamente' : 'demo'}</span></div><div className="artist-release-card-meta"><div><p className="card-kicker">{release.type} · {release.comingSoon ? 'Próximamente' : release.date?.slice(0, 4) || 'Demo'} · {release.trackCount ?? tracks.length} pistas</p><Link href={`/releases/${release.id}`} className="artist-release-title">{release.title}</Link><p className="artist-release-description">{release.description}</p></div><div className="artist-release-card-actions">{firstTrack && <button className={`artist-release-play ${playing ? 'playing' : ''}`} onClick={() => playTrack(firstTrack)}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}<span>{playing ? 'Pausar' : 'Escuchar demo'}</span></button>}{release.comingSoon ? <span className="coming-soon-label">Precio por anunciar</span> : release.demoOnly ? <span className="demo-only-label">Solo demo</span> : <PriceButton offer={releaseOffer(release, catalog.artists)} label="Comprar" />}</div></div></article>;
}

function ArtistPage({ id }: { id: string }) {
  const { catalog } = useMusic();
  const artist = catalog.artists.find((item) => item.id === id) || catalog.artists[0];
  const releases = catalog.releases.filter((release) => release.artistIds.includes(artist.id));
  const tracks = catalog.tracks.filter((track) => track.artistIds.includes(artist.id));
  const firstTrack = tracks[0];
  const [filter, setFilter] = useState('Todos');
  const filteredReleases = filter === 'Todos' ? releases : releases.filter((release) => release.type === filter);
  const releaseCounts = (['Álbum', 'EP', 'Sencillo'] as Release['type'][])
    .map((type) => ({ type, count: releases.filter((release) => release.type === type).length }))
    .filter(({ count }) => count > 0);
  const catalogFacts = tracks.length ? [`${String(tracks.length).padStart(2, '0')} ${tracks.length === 1 ? 'canción en la tienda' : 'canciones en la tienda'}`] : artist.links?.length ? ['Escucha en plataformas'] : [];
  const coverFacts = [...(artist.genres || []), ...(artist.highlights || []), ...catalogFacts, ...releaseCounts.map(({ type, count }) => `${String(count).padStart(2, '0')} ${type === 'Sencillo' ? (count === 1 ? 'sencillo' : 'sencillos') : type === 'Álbum' ? (count === 1 ? 'álbum' : 'álbumes') : 'EP'}`)].join(' · ');
  const initials = artist.name.split(' ').map((word) => word[0]).join('');
  const listeningLink = artist.links?.find((link) => ['Spotify', 'Apple Music', 'Beatport', 'SoundCloud', 'Traxsource'].includes(link.label));
  const { playTrack } = useMusic();
  const titleWords = artist.name.split(' ');
  return <div className="artist-editorial">
    <section className="artist-cover" data-reveal="cover">
      <div className="artist-cover-frame">
        <div className="artist-cover-media">
          {artist.image ? <img src={artist.image} style={{ '--artist-position': artist.imagePosition || 'center', '--artist-position-mobile': artist.imagePositionMobile || artist.imagePosition || 'center' } as React.CSSProperties} alt={`Fotografía editorial de ${artist.name}`} /> : <div className="profile-fallback" style={{ background: `linear-gradient(135deg, ${artist.color}, #11100f 82%)` }} aria-hidden="true" />}
        </div>
        <div className="artist-cover-wash" />
        <div className="artist-cover-content">
          <p className="artist-cover-origin">{artist.location}</p>
          <h1 aria-label={artist.name}>{titleWords.map((word, index) => <span className="artist-title-line" key={`${word}-${index}`}><span>{word}</span></span>)}</h1>
          <p className="artist-cover-facts">{coverFacts}</p>
          <div className="artist-actions">{firstTrack ? <button className="button button-red" onClick={() => playTrack(firstTrack)}><Play size={15} fill="currentColor" /> Escuchar demo</button> : listeningLink ? <a href={listeningLink.url} className="button button-red" target="_blank" rel="noreferrer">Escuchar en {listeningLink.label} ↗</a> : null}<a href="#discografia" className="button button-outline">Explorar música <ArrowRight size={15} /></a>{artist.hireable && <Link href={`/artists?artist=${artist.id}#artist-booking`} className="button button-outline">Consultar disponibilidad <ArrowRight size={15} /></Link>}</div>
        </div>
      </div>
    </section>
    <section className="artist-discography container" id="discografia" data-reveal="section"><div className="artist-discography-heading"><div><p className="eyebrow">01 / Discografía</p><h2>Lanzamientos</h2><p>Álbumes, EP y sencillos para escuchar, explorar y comprar.</p></div><Link href="/releases" className="text-link">Ver catálogo <ArrowRight size={15} /></Link></div><div className="artist-filter-row" role="tablist" aria-label="Filtrar discografía">{['Todos', 'Álbum', 'EP', 'Sencillo'].map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item === 'Todos' ? 'Todos' : `${item}${item === 'Álbum' ? 'es' : item === 'Sencillo' ? 's' : ''}`}</button>)}</div>{filteredReleases.length ? <div className="artist-release-grid">{filteredReleases.map((release) => <ArtistReleaseCard key={release.id} release={release} />)}</div> : <div className="artist-profile-empty"><h3>Aún no hay lanzamientos en la tienda.</h3><p>Consulta los enlaces oficiales del artista para escuchar sus publicaciones.</p>{artist.links?.length ? <nav className="artist-social-links" aria-label={`Plataformas de ${artist.name}`}>{artist.links.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</nav> : null}</div>}</section>
    {tracks.length > 0 && <section className="artist-recordings container" data-reveal="section"><SectionHeading eyebrow="02 / Grabaciones" title="Pistas para entrar" /><div className="track-list">{tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></section>}
    <section className="artist-story container" data-reveal="section"><div><p className="eyebrow">03 / Historia y archivo</p><h2>La noche también<br /><em>deja registro.</em></h2></div><div><p>{artist.story || artist.bio}</p>{artist.links?.length ? <nav className="artist-social-links" aria-label={`Enlaces de ${artist.name}`}>{artist.links.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</nav> : null}{artist.gallery?.length ? <div className="artist-gallery">{artist.gallery.map((image) => <img key={image} src={image} alt={`Archivo de ${artist.name}`} />)}</div> : !artist.image ? <div className="asset-note"><span>Archivo visual pendiente</span><p>Se añadirá una galería cuando haya fotos adicionales autorizadas.</p></div> : null}</div></section>
  </div>;
}

function ReleasePage({ id }: { id: string }) {
  const { catalog } = useMusic();
  const release = catalog.releases.find((item) => item.id === id) || catalog.releases[0];
  const tracks = release ? release.trackIds.map((trackId) => catalog.tracks.find((track) => track.id === trackId)).filter(Boolean) as Track[] : [];
  const { playTrack } = useMusic();
  if (!release) return <PageFrame eyebrow="03 / Catálogo" title="Sin lanzamientos" intro="Todavía no hay contenido publicado."><EmptySearch label="El catálogo está esperando su primera publicación." /></PageFrame>;
  return <div className="release-page-shell"><PageFrame eyebrow={`Lanzamiento / ${release.type}`} title={release.title} intro={release.description}>
    <div className="release-detail"><AlbumVinylArtwork className="release-detail-artwork" cover={release.cover} title={release.title} size="detail" coverFit={release.id === 'solaris' ? 'contain' : 'cover'} /><div className="release-detail-copy"><p className="card-kicker">{artistName(release.artistIds, catalog.artists)}{release.date ? ` · ${release.date}` : release.comingSoon ? ' · Pack digital' : ' · Demo'}</p><h2>{release.comingSoon ? 'Diez tracks para la cabina.' : 'Una obra para escuchar completa.'}</h2><p>{release.comingSoon ? 'Una colección de 8BATZZ y Esteban Arenas pensada para DJs. El pack se publicará cuando estén listos el tracklist y los datos de compra.' : release.demoOnly ? 'Demo de escucha. No está disponible para compra.' : `Incluye ${tracks.length} grabaciones. El precio del conjunto es independiente de la suma de las pistas.`}</p>{release.comingSoon ? <span className="coming-soon-label">Próximamente · precio por anunciar</span> : !release.demoOnly && <PriceButton offer={releaseOffer(release, catalog.artists)} label="Añadir lanzamiento" />}{!release.comingSoon && <button className="text-link plain-button" onClick={() => { const track = tracks[0]; if (track) playTrack(track); }}>Escuchar {release.demoOnly ? 'demo' : 'primer preview'} <Play size={16} /></button>}</div></div>
    {release.comingSoon && release.packageDetails && <section className="release-package-details"><div><p className="eyebrow">El pack</p><h2>Sonido completo.<br /><em>Listo para mezclar.</em></h2></div><div><ul>{release.packageDetails.map((item) => <li key={item}>{item}</li>)}</ul><h3>Licencia de uso</h3><ul className="release-license-list">{release.licenseTerms?.map((item) => <li key={item}>{item}</li>)}</ul><p className="release-package-note">El precio y los nombres de las 10 pistas se anunciarán antes de habilitar la compra.</p></div></section>}
    {release.comingSoon ? <section className="tracklist-detail release-tracklist-pending"><div className="detail-heading"><p className="eyebrow">Tracklist</p><span>{release.trackCount} pistas</span></div><p>Los títulos y previews se añadirán cuando estén definidos para publicación.</p></section> : <div className="tracklist-detail"><div className="detail-heading"><p className="eyebrow">Tracklist</p><span>{tracks.length} pistas · {release.type}</span></div>{tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div>}
  </PageFrame></div>;
}

function TrackPage({ id }: { id: string }) {
  const { catalog, activeTrack, isPlaying, audioAnalyser, progress, duration, playTrack, seekTo, togglePlayback } = useMusic();
  const track = catalog.tracks.find((item) => item.id === id) || catalog.tracks[0];
  const release = track ? catalog.releases.find((item) => item.id === track.releaseId) : undefined;
  if (!track) return <PageFrame eyebrow="04 / Pistas" title="Sin pistas" intro="Todavía no hay contenido publicado."><EmptySearch label="El catálogo está esperando su primera pista." /></PageFrame>;
  const isCurrentTrack = activeTrack?.id === track.id;

  return <div className="track-page-shell"><div className="track-page container">
    <div className="track-page-intro"><p className="eyebrow">Pista / Grabación</p><h1>{track.title}</h1><p>{track.version ? `${track.version} · ${artistName(track.artistIds, catalog.artists)}` : artistName(track.artistIds, catalog.artists)}</p></div>
    <div className="track-detail track-page-detail"><div className="track-detail-art"><img src={track.cover} alt={`Portada relacionada con ${track.title}`} /></div><div className="track-detail-copy"><p className="card-kicker">{track.genre || 'Grabación'} · {track.demoOnly ? 'demo original' : 'preview del catálogo'}</p><h2>{track.version || 'Versión original'}</h2><p>{track.demoOnly ? `Fragmento de escucha de 0:30 · duración de la grabación ${track.duration}.` : `Duración de catálogo ${track.duration}. El preview autorizado se conectará desde el backend cuando el archivo esté cargado.`}</p><div className="track-specs"><span><Clock3 size={15} /> {track.duration}</span><span><Disc3 size={15} /> {release?.title}</span>{track.bpm && <span>{track.bpm} BPM</span>}</div>{track.demoOnly ? <span className="demo-only-label">Solo demo</span> : <PriceButton offer={trackOffer(track, catalog.artists)} label="Comprar pista" />}<Link href={`/releases/${track.releaseId}`} className="text-link">Ver lanzamiento <ArrowRight size={16} /></Link></div></div>
    <TrackVisualizer track={track} isPlaying={isCurrentTrack && isPlaying} analyser={isCurrentTrack ? audioAnalyser : null} progress={isCurrentTrack ? progress : 0} duration={duration} canSeek={isCurrentTrack} onToggle={() => isCurrentTrack ? togglePlayback() : playTrack(track)} onSeek={seekTo} />
  </div></div>;
}

function CartPage() { const { cart, removeFromCart } = useMusic(); const total = cart.reduce((sum, item) => sum + item.price, 0); return <PageFrame eyebrow="06 / Selección" title="Tu carrito" intro="Una vista completa de tus ofertas seleccionadas. La misma selección también vive en el drawer de navegación."><div className="cart-page"><div>{cart.length ? cart.map((item) => <div className="checkout-line" key={item.id}><img src={item.cover} alt="" /><div><strong>{item.title}</strong><span>{item.artist} · {item.kind === 'release' ? 'lanzamiento digital' : 'pista digital'}</span><button className="remove-link" onClick={() => removeFromCart(item.id)}>Quitar</button></div><b>{formatCOP(item.price)}</b></div>) : <div className="empty-state"><ShoppingBag size={27} /><h3>Aún no has elegido una frecuencia.</h3><p>Explora el catálogo y añade un lanzamiento o una pista.</p><Link href="/releases" className="button button-dark">Ver lanzamientos <ArrowRight size={16} /></Link></div>}</div>{cart.length > 0 && <aside className="cart-page-summary"><p className="eyebrow">Total provisional</p><strong>{formatCOP(total)}</strong><small>Moneda COP · entrega digital</small><Link href="/checkout" className="button button-red">Continuar a checkout <ArrowRight size={16} /></Link></aside>}</div></PageFrame>; }

function AccountPage({ subroute = '' }: { subroute?: string }) {
  const router = useRouter();
  const { demoUser, setDemoUser, favorites, cart, musicUser, authLoading, logoutMusicUser } = useMusic();
  const [email, setEmail] = useState('');
  const [libraryCount, setLibraryCount] = useState(0);
  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  useEffect(() => {
    if (!musicUser) return;
    getMusicLibrary().then((items) => setLibraryCount(items.length)).catch(() => setLibraryCount(0));
    getMyArtistApplications().then(setApplications).catch(() => setApplications([]));
  }, [musicUser]);

  if (authLoading) return <PageFrame eyebrow="Cuenta" title="Cargando sesión" intro="Estamos comprobando tu cuenta."><div className="empty-state"><p>Un momento…</p></div></PageFrame>;

  if (subroute === 'login' || subroute === 'register' || (!musicUser && !demoUser)) return <AuthPage mode={subroute === 'register' ? 'register' : 'login'} />;

  const latestApplication = applications[0];
  const applicationNoticeCount = applications.filter((item) => item.status === 'pending' || item.status === 'needs_info').length;
  // `music.create` también puede existir en cuentas administrativas. No es
  // prueba de que la persona haya sido aceptada como artista; el rol artista
  // solo se asigna al aprobar la postulación.
  const isArtist = hasArtistRole(musicUser) && (!latestApplication || latestApplication.status === 'approved');

  return (
    <div className="account-page-shell">
      <PageFrame eyebrow="Cuenta / Demo" title="Hola, escucha" intro="Tu espacio de demostración para guardar, volver a escuchar y revisar compras simuladas.">
        <div className="account-dashboard">
          <aside className="account-nav">
            <div className="account-avatar">AM</div>
            <strong>{musicUser?.email || email || 'amiga@demo.com'}</strong>
            <span>{musicUser ? 'Cuenta Abrakadabra Music' : 'Cuenta de demostración'}</span>
            <Link className="active" href="/account">Resumen</Link>
            <Link href="/account/library">Biblioteca <b>{libraryCount}</b></Link>
            <Link href="/account/favorites">Favoritos <b>{favorites.length}</b></Link>
            <Link href="/account/orders">Pedidos</Link>
            <Link href="/account/applications">Postulaciones {applicationNoticeCount > 0 && <b>{applicationNoticeCount}</b>}</Link>
            {isArtist && <Link href="/account/artist">Studio de artista</Link>}
            <button onClick={() => { logoutMusicUser(); setDemoUser(false); }}>Cerrar sesión</button>
          </aside>
          <div className="account-content">
            <div className="account-metrics">
              <div><span>Biblioteca</span><strong>{libraryCount}</strong><small>{libraryCount ? 'compras disponibles' : 'Aún sin compras'}</small></div>
              <div><span>Favoritos</span><strong>{favorites.length}</strong><small>guardados en este demo</small></div>
              <div><span>Carrito</span><strong>{cart.length}</strong><small>ofertas seleccionadas</small></div>
            </div>
            <div className="account-callout">
              <Sparkles size={20} />
              <div><h3>Tu biblioteca empieza aquí.</h3><p>Cuando completes una compra simulada, este espacio podrá convertirse en tu colección. Por ahora, explora el catálogo semilla.</p></div>
              <Link href="/releases" className="text-link">Explorar <ArrowRight size={16} /></Link>
            </div>
            <div className={`artist-invite-card ${isArtist ? 'is-approved' : latestApplication ? `has-${latestApplication.status}` : ''}`}>
              <div className="artist-invite-mark">{isArtist ? <Check size={20} /> : <Music2 size={20} />}</div>
              <div>
                <p className="eyebrow">{isArtist ? 'Parte del equipo' : 'Para artistas'}</p>
                <h3>{isArtist ? 'Ya eres parte de nuestra selección.' : latestApplication?.status === 'pending' || latestApplication?.status === 'needs_info' ? 'Tu postulación está en revisión.' : latestApplication?.status === 'rejected' ? 'Tu última postulación fue rechazada.' : '¿Tu música tiene algo que decir?'}</h3>
                <p>{isArtist ? 'No necesitas enviar otra postulación. Ya puedes publicar álbumes, EP y sencillos desde tu Studio de artista.' : latestApplication?.status === 'pending' || latestApplication?.status === 'needs_info' ? 'El equipo revisará tu proyecto. Puedes consultar el historial y el estado desde la pestaña Postulaciones.' : latestApplication?.status === 'rejected' ? 'Consulta el motivo y vuelve a intentarlo cuando se habilite tu próximo periodo mensual.' : 'Postúlate a nuestra selección. Revisaremos tu proyecto y, si es aprobado, podrás vender lanzamientos desde tu Studio.'}</p>
                <Link className="button button-red" href={isArtist ? '/account/artist' : '/account/applications'}>{isArtist ? 'Abrir Studio de artista' : latestApplication ? 'Ver mis postulaciones' : 'Quiero postularme'} <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

function AccountFavoritesPage() {
  const { musicUser, authLoading, favorites, catalog } = useMusic();
  const savedReleases = catalog.releases.filter((release) => favorites.includes(release.id));
  const savedTracks = catalog.tracks.filter((track) => favorites.includes(track.id));

  if (authLoading) return <PageFrame eyebrow="Cuenta / Favoritos" title="Cargando favoritos" intro="Estamos recuperando tus guardados."><div className="empty-state"><p>Un momento…</p></div></PageFrame>;
  if (!musicUser) return <PageFrame eyebrow="Cuenta / Favoritos" title="Inicia sesión primero" intro="Tus favoritos están asociados a tu cuenta de Abrakadabra Music."><div className="hero-actions"><Link className="button button-red" href="/account/login">Iniciar sesión <ArrowRight size={16} /></Link><Link className="button button-ghost" href="/account/register">Crear cuenta</Link></div></PageFrame>;

  return <div className="account-page-shell"><PageFrame eyebrow="Cuenta / Favoritos" title="Lo que quieres volver a escuchar" intro="Tus lanzamientos y pistas guardados aparecen aquí para que regreses a ellos cuando quieras.">
    <div className="account-subnav"><Link href="/account">Resumen</Link><Link href="/account/favorites" className="active">Favoritos <b>{favorites.length}</b></Link><Link href="/account/orders">Pedidos</Link><Link href="/account/library">Biblioteca</Link><Link href="/account/applications">Postulaciones</Link></div>
    {favorites.length === 0 ? <div className="empty-state"><Heart size={28} /><h3>Aún no tienes favoritos.</h3><p>Guarda un lanzamiento o una pista con el corazón para encontrarlo aquí.</p><Link className="button button-red" href="/releases">Explorar lanzamientos <ArrowRight size={16} /></Link></div> : <>
      {savedReleases.length > 0 && <section><div className="section-heading"><div><p className="eyebrow">Lanzamientos</p><h2>Tus favoritos</h2></div><span>{savedReleases.length} {savedReleases.length === 1 ? 'lanzamiento' : 'lanzamientos'}</span></div><div className="release-grid">{savedReleases.map((release) => <ReleaseCard key={release.id} release={release} />)}</div></section>}
      {savedTracks.length > 0 && <section className="account-favorites-tracks"><div className="section-heading"><div><p className="eyebrow">Pistas</p><h2>Guardadas para después</h2></div><span>{savedTracks.length} {savedTracks.length === 1 ? 'pista' : 'pistas'}</span></div><div className="track-list">{savedTracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} />)}</div></section>}
    </>}
  </PageFrame></div>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { loginMusicUser, registerMusicUser } = useMusic();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === 'register';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isRegister && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) await registerMusicUser(email.trim(), username.trim(), password);
      else await loginMusicUser(email.trim(), password);
      router.push('/account');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return <div className="account-auth-shell">
    <section className="account-auth-art" aria-label="Abrakadabra Music">
      <Link href="/" className="account-auth-brand"><img src="/Logo.png" alt="" /><span><strong>ABRAKADABRA</strong><small>MUSIC</small></span></Link>
      <div className="account-auth-art-copy"><p className="eyebrow">{isRegister ? 'Tu primera señal' : 'Tu espacio de escucha'}</p><h1>{isRegister ? <>Hazle espacio a<br /><em>tu frecuencia.</em></> : <>La música<br /><em>también es hogar.</em></>}</h1><p>{isRegister ? 'Crea una cuenta para guardar música, comprar lanzamientos y, si eres artista, postular tu proyecto.' : 'Vuelve a tus compras, descubre nuevas voces y acompaña los proyectos que quieres ver crecer.'}</p></div>
      <div className="account-auth-record"><img src="/images/music/vinyl-record.png" alt="" /><span>ABRAKADABRA MUSIC · 01</span></div>
    </section>
    <section className="account-auth-panel">
      <div className="account-auth-panel-top"><span className="eyebrow">Cuenta</span><Link href="/" className="text-link"><ChevronLeft size={15} /> Volver al catálogo</Link></div>
      <div className="auth-panel-content"><p className="eyebrow">{isRegister ? 'Nueva cuenta' : 'Bienvenida de vuelta'}</p><h2>{isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}</h2><p className="auth-panel-intro">{isRegister ? 'Empieza con una cuenta de escucha. La postulación artística se hace después, desde tu perfil.' : 'Accede a tu biblioteca, tus pedidos y tu espacio de artista.'}</p>
        <div className="auth-mode-switch" role="tablist" aria-label="Tipo de acceso"><Link className={!isRegister ? 'active' : ''} href="/account/login">Iniciar sesión</Link><Link className={isRegister ? 'active' : ''} href="/account/register">Crear cuenta</Link></div>
        <form className="auth-form auth-card" onSubmit={submit}>
          {isRegister && <label htmlFor="music-username">Nombre de usuario<span>Será tu identificador dentro de Abrakadabra.</span><input id="music-username" name="username" autoComplete="username" required minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ej. luamar" /></label>}
          <label htmlFor="music-email">Correo electrónico<span>Usaremos este correo para tu cuenta y avisos importantes.</span><input id="music-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" /></label>
          <label htmlFor="music-password">Contraseña<span>Mínimo 8 caracteres. Puedes usar tu gestor de contraseñas.</span><input id="music-password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></label>
          {isRegister && <label htmlFor="music-password-confirm">Repite la contraseña<input id="music-password-confirm" name="password_confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-red auth-submit" disabled={loading} type="submit">{loading ? (isRegister ? 'Creando cuenta…' : 'Abriendo sesión…') : (isRegister ? 'Crear mi cuenta' : 'Iniciar sesión')} <ArrowRight size={16} /></button>
        </form>
        {!isRegister && <Link href="/account/recover" className="auth-recovery">¿Olvidaste tu contraseña?</Link>}
        <p className="auth-legal">Al continuar aceptas usar la plataforma de forma responsable. Tus datos de artista solo se envían al Portal para revisión cuando tú decides postularte.</p>
      </div>
    </section>
  </div>;
}

function applicationStatusLabel(status: ArtistApplication['status']) {
  return status === 'approved' ? 'Aprobada' : status === 'rejected' ? 'Rechazada' : status === 'needs_info' ? 'Necesita información' : 'En revisión';
}

function applicationDateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ArtistApplicationPage() {
  const { musicUser, authLoading } = useMusic();
  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ artist_name: '', country: '', phone_country_code: '+57', phone_number: '', instagram_url: '', motivation: '', experience: '' });

  useEffect(() => {
    if (!musicUser) { setLoading(false); return; }
    getMyArtistApplications().then(setApplications).catch(() => setApplications([])).finally(() => setLoading(false));
  }, [musicUser]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      const created = await createArtistApplication(form);
      setApplications((current) => [created, ...current]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar la postulación');
    } finally { setSaving(false); }
  };

  if (authLoading || loading) return <PageFrame eyebrow="Artistas" title="Preparando tus postulaciones" intro="Estamos comprobando tu cuenta."><div className="empty-state"><p>Un momento…</p></div></PageFrame>;
  if (!musicUser) return <PageFrame eyebrow="Artistas" title="Primero crea tu cuenta" intro="La postulación se vincula a tu cuenta de Abrakadabra Music."><div className="hero-actions"><Link className="button button-red" href="/account/register">Crear cuenta <ArrowRight size={16} /></Link><Link className="button button-ghost" href="/account/login">Ya tengo cuenta</Link></div></PageFrame>;

  const latest = applications[0];
  const isArtist = hasArtistRole(musicUser) && (!latest || latest.status === 'approved');
  const hasActiveApplication = applications.some((item) => item.status === 'pending' || item.status === 'needs_info');
  const now = new Date();
  const hasApplicationThisMonth = applications.some((item) => {
    const date = new Date(item.created_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const canApply = !isArtist && !hasActiveApplication && !hasApplicationThisMonth;

  return <div className="artist-application-shell"><PageFrame eyebrow="Postulaciones artísticas" title={isArtist ? 'Ya eres parte de la selección' : 'Tu camino como artista'} intro={isArtist ? 'Tu cuenta ya puede publicar música desde el Studio. No necesitas enviar nuevas postulaciones.' : 'Aquí puedes consultar tus solicitudes y enviar una nueva cuando el periodo mensual esté disponible.'}>
    {isArtist && <div className="application-status-card application-approved"><span className="application-status-icon"><Check /></span><div><p className="eyebrow">Estado actual</p><h2>Artista aprobado</h2><p>Ya formas parte del equipo de artistas. No es necesario que hagas más postulaciones.</p><Link className="button button-red" href="/account/artist">Abrir Studio de artista <ArrowRight size={16} /></Link></div></div>}
    {!isArtist && latest && <div className={`application-status-card application-${latest.status}`}><span className="application-status-icon">{latest.status === 'rejected' ? <X /> : latest.status === 'approved' ? <Check /> : <Clock3 />}</span><div><p className="eyebrow">Última postulación · {applicationStatusLabel(latest.status)}</p><h2>{latest.status === 'approved' ? 'Aprobación pendiente de activación' : latest.status === 'rejected' ? 'Puedes volver a intentarlo' : latest.status === 'needs_info' ? 'Necesitamos más información' : 'Tu proyecto está en revisión'}</h2><p>{latest.review_notes || (latest.status === 'approved' ? 'La solicitud está aprobada, pero el rol de artista todavía no se ha sincronizado. Actualiza tu sesión o contacta al administrador.' : latest.status === 'rejected' ? 'Revisa el detalle de esta solicitud y espera a que se abra tu siguiente periodo mensual.' : 'Recibimos tus datos. El equipo revisará tu proyecto y te avisará qué sigue.')}</p></div></div>}
    {!isArtist && !canApply && <div className="application-limit-note"><Clock3 size={17} /><p>{hasActiveApplication ? 'Ya tienes una postulación activa. No puedes enviar otra hasta que el equipo la resuelva.' : 'Ya enviaste una postulación este mes. Podrás enviar otra cuando comience el próximo mes.'}</p></div>}
    {canApply && <><div className="application-progress"><span className="active">01 <b>Tu proyecto</b></span><i /><span className="active">02 <b>Revisión</b></span><i /><span>03 <b>Studio</b></span></div>{error && <p className="form-error" role="alert">{error}</p>}<form className="artist-application-form" onSubmit={submit}><div className="application-form-heading"><div><p className="eyebrow">Información básica</p><h2>Tu identidad artística</h2></div><span>Solo puedes enviar una postulación por mes.</span></div><div className="form-row"><label htmlFor="application-artist-name">Nombre artístico<input id="application-artist-name" required value={form.artist_name} onChange={(event) => setForm((current) => ({ ...current, artist_name: event.target.value }))} placeholder="Ej. Lua Mar" /></label><label htmlFor="application-country">País<input id="application-country" required value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Colombia" /></label></div><div className="form-row form-row-phone"><label htmlFor="application-phone-code">Código<input id="application-phone-code" required value={form.phone_country_code} onChange={(event) => setForm((current) => ({ ...current, phone_country_code: event.target.value }))} placeholder="+57" /></label><label htmlFor="application-phone">Número de teléfono<input id="application-phone" type="tel" required value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} placeholder="300 000 0000" /></label><label htmlFor="application-email">Correo de cuenta<input id="application-email" type="email" value={musicUser.email} readOnly /></label></div><label htmlFor="application-instagram">Instagram o enlace principal<span>Si tienes otros enlaces, puedes agregarlos en la descripción.</span><input id="application-instagram" type="url" required value={form.instagram_url} onChange={(event) => setForm((current) => ({ ...current, instagram_url: event.target.value }))} placeholder="https://instagram.com/tu-proyecto" /></label><label htmlFor="application-motivation">¿Por qué quieres vender tu música aquí?<span>Cuéntanos qué estás construyendo y qué esperas encontrar en Abrakadabra.</span><textarea id="application-motivation" required minLength={30} rows={5} value={form.motivation} onChange={(event) => setForm((current) => ({ ...current, motivation: event.target.value }))} placeholder="Quiero compartir…" /></label><label htmlFor="application-experience">¿Dónde has estado o qué has publicado?<span>Incluye presentaciones, proyectos, colaboraciones, enlaces o experiencias relevantes.</span><textarea id="application-experience" required minLength={20} rows={5} value={form.experience} onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))} placeholder="He participado en…" /></label><div className="application-form-footer"><p><Check size={16} /> Revisamos cada proyecto de forma humana.</p><button className="button button-red" disabled={saving} type="submit">{saving ? 'Enviando postulación…' : 'Enviar para revisión'} <ArrowRight size={16} /></button></div></form></>}
    <div className="application-history"><div className="application-history-heading"><div><p className="eyebrow">Historial</p><h2>Postulaciones que has enviado</h2></div><span>{applications.length} {applications.length === 1 ? 'solicitud' : 'solicitudes'}</span></div>{applications.length === 0 ? <div className="empty-state small"><Music2 size={24} /><h3>Aún no hay postulaciones.</h3><p>Cuando quieras presentar tu proyecto, completa el formulario de esta página.</p></div> : <div className="application-history-list">{applications.map((item) => <article key={item.id} className={`application-history-item application-${item.status}`}><div><p className="eyebrow">{applicationDateLabel(item.created_at)}</p><h3>{item.artist_name}</h3><p>{item.country} · {item.phone_country_code} {item.phone_number}</p><a href={item.instagram_url} target="_blank" rel="noreferrer">{item.instagram_url}</a></div><span className="application-badge">{applicationStatusLabel(item.status)}</span></article>)}</div>}</div>
  </PageFrame></div>;
}

function AccountOrdersPage({ view }: { view: 'orders' | 'library' }) {
  const { musicUser, authLoading } = useMusic();
  const [orders, setOrders] = useState<MusicOrder[]>([]);
  const [library, setLibrary] = useState<MusicEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!musicUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMusicOrders(), getMusicLibrary()])
      .then(([nextOrders, nextLibrary]) => { setOrders(nextOrders); setLibrary(nextLibrary); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu cuenta'))
      .finally(() => setLoading(false));
  }, [musicUser]);

  if (authLoading || loading) return <PageFrame eyebrow="Cuenta" title="Cargando" intro="Estamos buscando tus pedidos y tu biblioteca."><div className="empty-state"><p>Un momento…</p></div></PageFrame>;
  if (!musicUser) return <PageFrame eyebrow="Cuenta" title="Inicia sesión primero" intro="Necesitas una cuenta para consultar pedidos y descargas."><Link className="button button-red" href="/account/login">Iniciar sesión <ArrowRight size={16} /></Link></PageFrame>;

  const statusLabel: Record<string, string> = { pending: 'Pendiente', paid: 'Aprobado', cancelled: 'Cancelado', failed: 'Fallido', refunded: 'Reembolsado' };
  return <div className="account-page-shell"><PageFrame eyebrow={`Cuenta / ${view === 'orders' ? 'Pedidos' : 'Biblioteca'}`} title={view === 'orders' ? 'Tus pedidos' : 'Tu biblioteca'} intro={view === 'orders' ? 'Aquí queda el historial de tus compras digitales.' : 'Accede a los lanzamientos y pistas que ya compraste.'}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="account-subnav"><Link href="/account/orders" className={view === 'orders' ? 'active' : ''}>Pedidos</Link><Link href="/account/library" className={view === 'library' ? 'active' : ''}>Biblioteca</Link><Link href="/account">Resumen</Link></div>
    {view === 'orders' ? (orders.length ? <div className="account-record-list">{orders.map((order) => <article className="account-record" key={order.id}><div><p className="eyebrow">Pedido {order.id.slice(0, 8)}</p><h2>{formatCOP(Number(order.total))}</h2><span>{new Date(order.created_at).toLocaleString('es-CO')} · {statusLabel[order.status] || order.status}</span></div><div>{order.items.map((item) => <p key={item.id}>{item.title} <small>{item.item_type === 'release' ? 'lanzamiento' : 'pista'}</small></p>)}</div></article>)}</div> : <div className="empty-state"><Library size={28} /><h3>Aún no tienes pedidos.</h3><p>Cuando completes una compra local, aparecerá aquí.</p><Link className="button button-dark" href="/releases">Explorar música <ArrowRight size={16} /></Link></div>) : (library.length ? <div className="account-record-list">{library.map((item) => <article className="account-record" key={item.id}><div><p className="eyebrow">Acceso digital</p><h2>{item.release_title || item.track_title}</h2><span>{item.release_id ? 'Lanzamiento completo' : 'Pista individual'}</span></div><div>{item.release_id ? <Link className="text-link" href={`/releases/${item.release_id}`}>Ver lanzamiento <ArrowRight size={16} /></Link> : <span className="record-note">Preview y descarga segura próximamente</span>}</div></article>)}</div> : <div className="empty-state"><Library size={28} /><h3>Tu biblioteca está vacía.</h3><p>Aprueba un pedido en el checkout local para generar tu primer acceso.</p><Link className="button button-red" href="/releases">Ver catálogo <ArrowRight size={16} /></Link></div>)}
  </PageFrame></div>;
}

function ArtistStudioPage() {
  const { musicUser, authLoading } = useMusic();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [release, setRelease] = useState<Record<string, unknown> | null>(null);
  const [track, setTrack] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', biography: '', location: '' });
  const [releaseForm, setReleaseForm] = useState({ title: '', type: 'single', price: '0', release_date: '', description: '' });
  const [trackForm, setTrackForm] = useState({ title: '', version: '', price: '0', genre: '', bpm: '', duration_seconds: '' });
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);

  useEffect(() => {
    if (!hasArtistRole(musicUser) || !musicUser?.permissions?.includes('music.create')) {
      setLoading(false);
      return;
    }
    getArtistProfile()
      .then((data) => {
        setProfile(data);
        setProfileForm({ name: String(data.name || ''), biography: String(data.biography || ''), location: String(data.location || '') });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [musicUser]);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo completar la acción');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <PageFrame eyebrow="Studio de artista" title="Cargando" intro="Estamos preparando tu espacio de trabajo."><div className="empty-state"><p>Un momento…</p></div></PageFrame>;
  if (!musicUser) return <PageFrame eyebrow="Studio de artista" title="Inicia sesión primero" intro="Necesitas una cuenta para gestionar música."><Link className="button button-red" href="/account/login">Iniciar sesión <ArrowRight size={16} /></Link></PageFrame>;
  if (!hasArtistRole(musicUser) || !musicUser.permissions?.includes('music.create')) return <PageFrame eyebrow="Studio de artista" title="Acceso pendiente" intro="Tu cuenta todavía no tiene habilitado el rol de artista. Solicítalo al administrador desde el Portal." />;

  return <div className="account-page-shell"><PageFrame eyebrow="Studio de artista" title="Sube tu frecuencia" intro="Crea borradores, adjunta tus archivos y envía cada lanzamiento a revisión editorial.">
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="form-success" role="status">{message}</p>}
    {!profile ? <form className="auth-card" onSubmit={(event) => { event.preventDefault(); void run(async () => { const created = await createArtistProfile(profileForm); setProfile(created); setMessage('Perfil creado. Ya puedes preparar tu primer lanzamiento.'); }); }}>
      <h2>Tu perfil de artista</h2><label htmlFor="artist-name">Nombre artístico<input id="artist-name" required value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} /></label><label htmlFor="artist-location">Ciudad o ubicación<input id="artist-location" value={profileForm.location} onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))} /></label><label htmlFor="artist-bio">Biografía<textarea id="artist-bio" rows={5} value={profileForm.biography} onChange={(event) => setProfileForm((current) => ({ ...current, biography: event.target.value }))} /></label><button className="button button-red" disabled={saving}>{saving ? 'Guardando…' : 'Crear perfil'} <ArrowRight size={16} /></button>
    </form> : <div className="artist-studio-grid">
      <form className="auth-card" onSubmit={(event) => { event.preventDefault(); void run(async () => { const created = await createMusicRelease({ ...releaseForm, price: Number(releaseForm.price), currency: 'COP' }); setRelease(created); setMessage('Lanzamiento creado como borrador.'); }); }}><p className="eyebrow">01 / Lanzamiento</p><h2>{String(profile.name || 'Tu artista')}</h2><label htmlFor="release-title">Título<input id="release-title" required value={releaseForm.title} onChange={(event) => setReleaseForm((current) => ({ ...current, title: event.target.value }))} /></label><label htmlFor="release-type">Tipo<select id="release-type" value={releaseForm.type} onChange={(event) => setReleaseForm((current) => ({ ...current, type: event.target.value }))}><option value="single">Sencillo</option><option value="ep">EP</option><option value="album">Álbum</option></select></label><label htmlFor="release-price">Precio COP<input id="release-price" type="number" min="0" required value={releaseForm.price} onChange={(event) => setReleaseForm((current) => ({ ...current, price: event.target.value }))} /></label><label htmlFor="release-date">Fecha de lanzamiento<input id="release-date" type="date" value={releaseForm.release_date} onChange={(event) => setReleaseForm((current) => ({ ...current, release_date: event.target.value }))} /></label><label htmlFor="release-description">Descripción<textarea id="release-description" rows={4} value={releaseForm.description} onChange={(event) => setReleaseForm((current) => ({ ...current, description: event.target.value }))} /></label><button className="button button-red" disabled={saving}>{saving ? 'Guardando…' : 'Guardar borrador'} <ArrowRight size={16} /></button></form>
      <div className="auth-card"><p className="eyebrow">02 / Archivos</p><h2>{release ? String(release.title) : 'Primero crea un lanzamiento'}</h2><label htmlFor="release-cover">Portada<input id="release-cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!release || saving} onChange={(event) => setCover(event.target.files?.[0] || null)} /></label>{release && cover && <button className="button button-outline" disabled={saving} onClick={() => void run(async () => { await uploadMusicFile(`/music/artist/releases/${String(release.id)}/cover`, cover); setMessage('Portada subida correctamente.'); })}>Subir portada</button>}<p className="form-help">Formatos de imagen: JPG, PNG, WebP o AVIF. Máximo 8 MB.</p></div>
      <form className="auth-card" onSubmit={(event) => { event.preventDefault(); if (!release) return; void run(async () => { const created = await createMusicTrack({ ...trackForm, release_id: release.id, price: Number(trackForm.price), bpm: trackForm.bpm ? Number(trackForm.bpm) : null, duration_seconds: trackForm.duration_seconds ? Number(trackForm.duration_seconds) : null, currency: 'COP' }); setTrack(created); setMessage('Pista creada como borrador.'); }); }}><p className="eyebrow">03 / Pista</p><h2>{track ? String(track.title) : 'Añade una pista'}</h2><label htmlFor="track-title">Título de la pista<input id="track-title" required disabled={!release} value={trackForm.title} onChange={(event) => setTrackForm((current) => ({ ...current, title: event.target.value }))} /></label><label htmlFor="track-version">Versión<input id="track-version" disabled={!release} value={trackForm.version} onChange={(event) => setTrackForm((current) => ({ ...current, version: event.target.value }))} /></label><div className="form-row"><label htmlFor="track-price">Precio COP<input id="track-price" type="number" min="0" disabled={!release} value={trackForm.price} onChange={(event) => setTrackForm((current) => ({ ...current, price: event.target.value }))} /></label><label htmlFor="track-duration">Duración en segundos<input id="track-duration" type="number" min="0" disabled={!release} value={trackForm.duration_seconds} onChange={(event) => setTrackForm((current) => ({ ...current, duration_seconds: event.target.value }))} /></label></div><label htmlFor="track-genre">Género<input id="track-genre" disabled={!release} value={trackForm.genre} onChange={(event) => setTrackForm((current) => ({ ...current, genre: event.target.value }))} /></label><button className="button button-red" disabled={!release || saving}>{saving ? 'Guardando…' : 'Guardar pista'} <ArrowRight size={16} /></button></form>
      <div className="auth-card"><p className="eyebrow">04 / Audio</p><h2>{track ? String(track.title) : 'Primero crea una pista'}</h2><label htmlFor="track-preview">Preview público<input id="track-preview" type="file" accept="audio/*" disabled={!track || saving} onChange={(event) => setPreview(event.target.files?.[0] || null)} /></label>{track && preview && <button className="button button-outline" disabled={saving} onClick={() => void run(async () => { await uploadMusicFile(`/music/artist/tracks/${String(track.id)}/preview`, preview); setMessage('Preview subido correctamente.'); })}>Subir preview</button>}<label htmlFor="track-audio">Audio completo<input id="track-audio" type="file" accept="audio/*" disabled={!track || saving} onChange={(event) => setAudio(event.target.files?.[0] || null)} /></label>{track && audio && <button className="button button-outline" disabled={saving} onClick={() => void run(async () => { await uploadMusicFile(`/music/artist/tracks/${String(track.id)}/audio`, audio); setMessage('Audio completo guardado de forma privada.'); })}>Subir audio completo</button>}<p className="form-help">El preview puede ser público. El máster completo queda fuera de la carpeta pública.</p>{release && <button className="button button-dark" disabled={saving || String(release.status) !== 'draft'} onClick={() => void run(async () => { await submitMusicRelease(String(release.id)); setMessage('Lanzamiento enviado a revisión.'); })}>Enviar lanzamiento a revisión <Check size={16} /></button>}</div>
    </div>}
  </PageFrame></div>;
}

function CheckoutPage() {
  const router = useRouter();
  const { cart, musicUser, authLoading } = useMusic();
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const [order, setOrder] = useState<MusicOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createOrder = async () => {
    if (!musicUser) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const created = await createMusicOrder(cart.map((item) => ({ kind: item.kind, id: item.kind === 'release' ? item.releaseId || item.id.replace('release:', '') : item.trackId || item.id.replace('track:', '') })));
      setOrder(created);
      setSuccess('Pedido creado. El precio fue validado por el backend.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el pedido');
    } finally { setLoading(false); }
  };
  const approveLocally = async () => {
    if (!order) return;
    setLoading(true); setError(null);
    try {
      await simulateMusicPayment(order.id);
      router.push(`/checkout/result?status=approved&order=${order.id}`);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'No se pudo aprobar el pedido local');
    } finally { setLoading(false); }
  };
  return <PageFrame eyebrow="Compra / Demo local" title="Una compra tranquila" intro="Crea un pedido persistente y apruébalo con el simulador local. No se realiza ningún cobro real."><div className="checkout-grid"><div className="checkout-list"><div className="checkout-label">Tu selección · {cart.length} ofertas</div>{cart.length ? cart.map((item) => <div className="checkout-line" key={item.id}><img src={item.cover} alt="" /><div><strong>{item.title}</strong><span>{item.artist} · {item.kind === 'release' ? 'lanzamiento digital' : 'pista digital'}</span></div><b>{formatCOP(item.price)}</b></div>) : <div className="empty-state small"><ShoppingBag size={24} /><h3>El carrito está vacío.</h3><Link href="/releases" className="text-link">Volver al catálogo <ArrowRight size={16} /></Link></div>}</div><div className="checkout-summary"><p className="eyebrow">Resumen provisional</p><div><span>Subtotal</span><strong>{formatCOP(total)}</strong></div><div><span>Entrega</span><strong>Digital</strong></div><hr /><div className="total-row"><span>Total</span><strong>{formatCOP(total)}</strong></div>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}{authLoading ? <p className="simulation-note">Comprobando sesión…</p> : !musicUser ? <><p className="simulation-note">Inicia sesión para que el pedido quede asociado a tu biblioteca.</p><Link href="/account/login" className="button button-red">Iniciar sesión <ArrowRight size={15} /></Link></> : !order ? <button className="button button-red" disabled={!cart.length || loading} onClick={() => void createOrder}>{loading ? 'Creando pedido…' : 'Crear pedido local'} <ArrowRight size={15} /></button> : <><p className="simulation-note">Pedido {order.id.slice(0, 8)} creado. En producción aquí se abrirá la pasarela de pagos.</p><button className="button button-red" disabled={loading} onClick={() => void approveLocally}>{loading ? 'Aprobando…' : 'Simular aprobación local'} <Check size={15} /></button></>}</div></div></PageFrame>;
}

function ResultPage() { const [status, setStatus] = useState('approved'); useEffect(() => { const value = new URLSearchParams(window.location.search).get('status'); if (value) setStatus(value); }, []); const copy: Record<string, [string, string]> = { approved: ['Compra simulada aprobada', 'Tu pedido de demostración quedó registrado en este recorrido. No hubo cobro real.'], pending: ['Compra simulada pendiente', 'El proveedor aún no confirma este pedido de demostración. No hay derechos de descarga asignados.'], rejected: ['Compra simulada rechazada', 'El pago de demostración no fue aprobado. Puedes volver al carrito e intentarlo con otro estado.'], cancelled: ['Compra simulada cancelada', 'Saliste del flujo antes de confirmar. Tu selección permanece disponible.'] }; const current = copy[status] || copy.approved; return <PageFrame eyebrow="Compra / Resultado" title={current[0]} intro={current[1]}><div className={`result-card result-${status}`}><span className="result-icon">{status === 'approved' ? <Check /> : <X />}</span><p className="eyebrow">Estado de demostración</p><h2>{current[0]}</h2><p>{current[1]}</p><div><Link href="/account/orders" className="button button-dark">Ver pedidos <ArrowRight size={16} /></Link><Link href="/releases" className="button button-ghost">Seguir explorando</Link></div></div></PageFrame>; }

function PageFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: ReactNode }) { return <div className="page-frame container"><div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div>{children}</div>; }
function EmptySearch({ label }: { label: string }) { return <div className="empty-search"><Search size={24} /><h3>{label}</h3><p>Prueba con el nombre de un artista, un lanzamiento o una pista del catálogo demo.</p><Link href="/releases" className="text-link">Ver lanzamientos <ArrowRight size={16} /></Link></div>; }

export function RouteContent({ route }: { route: string }) {
  const { catalog } = useMusic();
  const parts = route.split('/').filter(Boolean);
  if (!route) return <HomePage />;
  if (route === 'artists') return <ArtistsPage />;
  if (route === 'djs') return <ArtistsPage />;
  if (route === 'licencia/solaris') return <SolarisLicensePage />;
  if (parts[0] === 'artists') return <ArtistPage id={parts[1] || catalog.artists[0]?.id || ARTISTS[0].id} />;
  if (route === 'releases') return <ReleasesPage />;
  if (parts[0] === 'releases') return <ReleasePage id={parts[1] || catalog.releases[0]?.id || RELEASES[0].id} />;
  if (route === 'tracks') return <TracksPage />;
  if (parts[0] === 'tracks') return <TrackPage id={parts[1] || catalog.tracks[0]?.id || TRACKS[0].id} />;
  if (route === 'search') return <SearchPage />;
  if (route === 'account/artist-application') return <ArtistApplicationPage />;
  if (route === 'account/applications') return <ArtistApplicationPage />;
  if (route === 'account/favorites') return <AccountFavoritesPage />;
  if (parts[0] === 'account' && parts[1] === 'artist') return <ArtistStudioPage />;
  if (route === 'account/orders') return <AccountOrdersPage view="orders" />;
  if (route === 'account/library') return <AccountOrdersPage view="library" />;
  if (parts[0] === 'account') return <AccountPage subroute={parts[1] || ''} />;
  if (route === 'cart') return <CartPage />;
  if (route === 'checkout') return <CheckoutPage />;
  if (parts[0] === 'checkout' && parts[1] === 'result') return <ResultPage />;
  return <PageFrame eyebrow="404 / Frecuencia perdida" title="No encontramos esa ruta" intro="La señal no llegó hasta aquí, pero el catálogo sigue abierto."><EmptySearch label="Vuelve al inicio para seguir escuchando." /></PageFrame>;
}

export function MusicApp({ route }: { route: string }) { return <MusicProvider><Header /><main><div className="route-view" key={route}><RouteContent route={route} /></div></main><Footer /><CartDrawer /><PlayerBar /><Notice /></MusicProvider>; }

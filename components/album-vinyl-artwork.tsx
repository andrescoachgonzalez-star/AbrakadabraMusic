import * as React from 'react';
import Image from 'next/image';

function CoverImage({ src, alt, sizes, priority = false, className }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (src.startsWith('/')) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} draggable={false} />;
  return <img src={src} alt={alt} className={className} draggable={false} decoding="async" loading={priority ? 'eager' : 'lazy'} />;
}

type AlbumVinylArtworkProps = {
  cover?: string;
  title: string;
  size?: 'gallery' | 'card' | 'detail';
  isActive?: boolean;
  isPlaying?: boolean;
  isSpinning?: boolean;
  coverFit?: 'cover' | 'contain';
  className?: string;
};

/**
 * Editorial album artwork: the release sleeve stays square and stable while
 * the reusable vinyl layer reveals itself from behind it.
 */
export default function AlbumVinylArtwork({
  cover,
  title,
  size = 'card',
  isActive = false,
  isPlaying = false,
  isSpinning = false,
  coverFit = 'cover',
  className = '',
}: AlbumVinylArtworkProps) {
  const classes = [
    'album-vinyl-artwork',
    `album-vinyl-artwork--${size}`,
    isActive ? 'is-active' : '',
    isPlaying ? 'is-playing' : '',
    isSpinning ? 'is-spinning' : '',
    coverFit === 'contain' ? 'album-vinyl-artwork--contain' : '',
    className,
  ].filter(Boolean).join(' ');
  const isGallery = size === 'gallery';
  const imageSizes = isGallery ? '(max-width: 620px) 70vw, (max-width: 900px) 40vw, 32vw' : '(max-width: 620px) 92vw, (max-width: 900px) 50vw, 34vw';

  return (
    <div className={classes} data-album-artwork>
      {isGallery && cover && <div className="album-vinyl-gallery-fill" aria-hidden="true"><CoverImage src={cover} alt="" sizes={imageSizes} priority={isActive} /></div>}
      <div className="album-vinyl-shadow" aria-hidden="true" />
      <div className="album-vinyl-disc-layer" aria-hidden="true">
        <img src="/images/music/vinyl-record.png" alt="" draggable={false} />
        {isGallery && cover && <div className="album-vinyl-disc-face"><CoverImage src={cover} alt="" sizes={imageSizes} priority={isActive} /><span /></div>}
      </div>
      <div className="album-vinyl-sleeve">
        {cover ? <CoverImage src={cover} alt={`Portada de ${title}`} sizes={imageSizes} priority={isGallery && isActive} /> : <div className="album-vinyl-cover-fallback" aria-label={`Portada pendiente de ${title}`} />}
      </div>
    </div>
  );
}

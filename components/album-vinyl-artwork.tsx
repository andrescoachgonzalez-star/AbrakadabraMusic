import * as React from 'react';

type AlbumVinylArtworkProps = {
  cover?: string;
  title: string;
  size?: 'gallery' | 'card' | 'detail';
  isActive?: boolean;
  isPlaying?: boolean;
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
  coverFit = 'cover',
  className = '',
}: AlbumVinylArtworkProps) {
  const classes = [
    'album-vinyl-artwork',
    `album-vinyl-artwork--${size}`,
    isActive ? 'is-active' : '',
    isPlaying ? 'is-playing' : '',
    coverFit === 'contain' ? 'album-vinyl-artwork--contain' : '',
    className,
  ].filter(Boolean).join(' ');
  const isGallery = size === 'gallery';

  return (
    <div className={classes} data-album-artwork>
      {isGallery && cover && <div className="album-vinyl-gallery-fill" aria-hidden="true"><img src={cover} alt="" draggable={false} /></div>}
      <div className="album-vinyl-shadow" aria-hidden="true" />
      <div className="album-vinyl-disc-layer" aria-hidden="true">
        <img src="/images/music/vinyl-record.png" alt="" draggable={false} />
      </div>
      <div className="album-vinyl-sleeve">
        {cover ? <img src={cover} alt={`Portada de ${title}`} draggable={false} /> : <div className="album-vinyl-cover-fallback" aria-label={`Portada pendiente de ${title}`} />}
      </div>
    </div>
  );
}

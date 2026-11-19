'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Track } from '@/lib/catalog';

type TrackVisualizerProps = {
  track: Track;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  progress: number;
  duration: number;
  onToggle: () => void;
};

const BAR_COUNT = 56;

function formatTime(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value));
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

export default function TrackVisualizer({ track, isPlaying, analyser, progress, duration, onToggle }: TrackVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRatio = duration ? Math.min(100, (progress / duration) * 100) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frequencyData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const idleData = Array.from({ length: BAR_COUNT }, (_, index) => 0.12 + Math.sin(index * 0.54) * 0.045);
    let frame = 0;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;
      context.clearRect(0, 0, width, height);

      const values = new Array(BAR_COUNT).fill(0);
      if (frequencyData && isPlaying && analyser) {
        analyser.getByteFrequencyData(frequencyData);
        const usefulRange = Math.max(1, Math.floor(frequencyData.length * 0.42));
        for (let index = 0; index < BAR_COUNT; index += 1) {
          const sourceIndex = Math.floor((index / BAR_COUNT) * usefulRange);
          values[index] = Math.min(1, frequencyData[sourceIndex] / 180);
        }
      } else {
        idleData.forEach((value, index) => { values[index] = value; });
      }
      for (let index = 0; index < BAR_COUNT / 2; index += 1) {
        values[BAR_COUNT - 1 - index] = values[index];
      }

      const gap = 5;
      const barWidth = Math.max(2, (width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      values.forEach((value, index) => {
        const wave = reducedMotion ? 0 : Math.sin(frame * 0.035 + index * 0.42) * 0.035;
        const amplitude = Math.max(0.08, Math.min(1, value + wave));
        const barHeight = Math.max(4, amplitude * height * 0.84);
        const x = index * (barWidth + gap);
        const y = centerY - barHeight / 2;
        const gradient = context.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, 'rgba(244,240,233,.96)');
        gradient.addColorStop(.72, 'rgba(244,240,233,.84)');
        gradient.addColorStop(1, 'rgba(223,44,38,.78)');
        context.fillStyle = gradient;
        context.beginPath();
        context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        context.fill();
      });

      if (!reducedMotion) frame += 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    draw();
    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [analyser, isPlaying]);

  return <section className="track-visualizer" aria-label={`Visualizador de ${track.title}`}>
    <div className="track-visualizer-stage">
      <canvas ref={canvasRef} className="track-visualizer-canvas" aria-hidden="true" />
      <button className={`track-visualizer-play ${isPlaying ? 'is-playing' : ''}`} type="button" onClick={onToggle} aria-label={isPlaying ? `Pausar ${track.title}` : `Reproducir ${track.title}`}>
        {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
      </button>
    </div>
    <div className="track-visualizer-progress" aria-hidden="true"><span style={{ width: `${progressRatio}%` }} /></div>
    <div className="track-visualizer-foot"><span>{formatTime(progress)}</span><span>{formatTime(duration)} · {track.demoOnly ? 'demo del artista' : track.previewUrl ? 'preview del catálogo' : 'CC0 demo audio'}</span></div>
  </section>;
}

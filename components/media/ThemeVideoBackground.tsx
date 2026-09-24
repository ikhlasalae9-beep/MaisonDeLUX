'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeVideoBackground({
  darkSrc,
  lightSrc,
  fallbackSrc,
  lightFallbackSrc,
  sourceType,
  className,
  imageClassName,
  videoClassName,
}: {
  darkSrc: string;
  lightSrc?: string;
  fallbackSrc: string;
  lightFallbackSrc?: string;
  sourceType?: string;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayAttemptRef = useRef('');
  const [dark, setDark] = useState(false);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [playingSrc, setPlayingSrc] = useState('');
  const [readyPosters, setReadyPosters] = useState<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setDark(root.classList.contains('dark'));
      setMediaInitialized(true);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const src = dark || !lightSrc ? darkSrc : lightSrc;
  const activePoster = dark && lightFallbackSrc ? fallbackSrc : lightFallbackSrc ?? fallbackSrc;
  const activeSrc = mediaInitialized && readyPosters.includes(activePoster) ? src : '';
  const videoVisible = Boolean(activeSrc) && playingSrc === activeSrc;

  const posterLoaded = (poster: string) => {
    setReadyPosters((current) => current.includes(poster) ? current : [...current, poster]);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    autoplayAttemptRef.current = '';
    setPlayingSrc('');
    video.pause();
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
      video.load();
    };
  }, [activeSrc]);

  const attemptPlayback = () => {
    const video = videoRef.current;
    if (!video || !activeSrc || autoplayAttemptRef.current === activeSrc) return;
    video.muted = true;
    video.defaultMuted = true;
    autoplayAttemptRef.current = activeSrc;
    void video.play().catch(() => setPlayingSrc(''));
  };

  return <div className={cn('absolute inset-0 overflow-hidden', className)}>
    {lightFallbackSrc ? <>
      <Image src={lightFallbackSrc} alt="" fill priority sizes="(min-width: 1024px) 58vw, 100vw" onLoad={() => posterLoaded(lightFallbackSrc)} className={cn('object-cover dark:hidden', imageClassName)} />
      <Image src={fallbackSrc} alt="" fill loading="eager" sizes="(min-width: 1024px) 58vw, 100vw" onLoad={() => posterLoaded(fallbackSrc)} className={cn('hidden object-cover dark:block', imageClassName)} />
    </> : <Image src={fallbackSrc} alt="" fill priority sizes="100vw" onLoad={() => posterLoaded(fallbackSrc)} className={cn('object-cover', imageClassName)} />}
    <video
      key={sourceType ? activeSrc || 'inactive' : undefined}
      ref={videoRef}
      aria-hidden="true"
      src={sourceType ? undefined : activeSrc || undefined}
      autoPlay={Boolean(activeSrc)}
      muted
      loop
      playsInline
      preload="none"
      onCanPlay={attemptPlayback}
      onPlaying={() => setPlayingSrc(activeSrc)}
      onPause={() => setPlayingSrc('')}
      onWaiting={() => setPlayingSrc('')}
      onStalled={() => setPlayingSrc('')}
      onEnded={() => setPlayingSrc('')}
      onError={() => setPlayingSrc('')}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-slow', videoVisible ? 'opacity-100' : 'opacity-0', videoClassName)}
    >
      {sourceType && activeSrc ? <source src={activeSrc} type={sourceType} /> : null}
    </video>
  </div>;
}

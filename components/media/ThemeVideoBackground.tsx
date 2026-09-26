'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  imageUnoptimized = false,
}: {
  darkSrc: string;
  lightSrc?: string;
  fallbackSrc: string;
  lightFallbackSrc?: string;
  sourceType?: string;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
  imageUnoptimized?: boolean;
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
  const activeSrc = !lightSrc ? darkSrc : mediaInitialized && readyPosters.includes(activePoster) ? src : '';
  const videoVisible = Boolean(activeSrc) && playingSrc === activeSrc;
  const posterVisibility = videoVisible ? 'opacity-0' : 'opacity-100';

  const posterLoaded = (poster: string) => {
    setReadyPosters((current) => current.includes(poster) ? current : [...current, poster]);
  };

  const attemptPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeSrc || autoplayAttemptRef.current === activeSrc) return;
    video.muted = true;
    video.defaultMuted = true;
    autoplayAttemptRef.current = activeSrc;
    void video.play().catch(() => {
      if (autoplayAttemptRef.current === activeSrc) autoplayAttemptRef.current = '';
    });
  }, [activeSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    autoplayAttemptRef.current = '';
    setPlayingSrc('');
    video.muted = true;
    video.defaultMuted = true;

    if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setPlayingSrc(activeSrc);
    } else {
      attemptPlayback();
    }

    return () => video.pause();
  }, [activeSrc, attemptPlayback]);

  return <div className={cn('absolute inset-0 overflow-hidden', className)}>
    {lightFallbackSrc ? <>
      <Image src={lightFallbackSrc} alt="" fill priority sizes="(min-width: 1024px) 58vw, 100vw" onLoad={() => posterLoaded(lightFallbackSrc)} className={cn('object-cover transition-opacity duration-slow dark:hidden', posterVisibility, imageClassName)} />
      <Image src={fallbackSrc} alt="" fill loading="eager" sizes="(min-width: 1024px) 58vw, 100vw" onLoad={() => posterLoaded(fallbackSrc)} className={cn('hidden object-cover transition-opacity duration-slow dark:block', posterVisibility, imageClassName)} />
    </> : <Image src={fallbackSrc} alt="" fill priority unoptimized={imageUnoptimized} sizes="100vw" onLoad={() => posterLoaded(fallbackSrc)} className={cn('object-cover transition-opacity duration-slow', posterVisibility, imageClassName)} />}
    <video
      key={sourceType && lightSrc ? activeSrc || 'inactive' : undefined}
      ref={videoRef}
      aria-hidden="true"
      src={sourceType ? undefined : activeSrc || undefined}
      autoPlay={Boolean(activeSrc)}
      muted
      loop
      playsInline
      preload={lightSrc ? 'none' : 'metadata'}
      onLoadedData={attemptPlayback}
      onCanPlay={attemptPlayback}
      onPlaying={() => setPlayingSrc(activeSrc)}
      onError={() => {
        autoplayAttemptRef.current = '';
        setPlayingSrc('');
      }}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-slow', videoVisible ? 'opacity-100' : 'opacity-0', videoClassName)}
    >
      {sourceType && activeSrc ? <source src={activeSrc} type={sourceType} /> : null}
    </video>
  </div>;
}

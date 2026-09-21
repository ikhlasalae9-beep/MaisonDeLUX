'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeVideoBackground({
  darkSrc,
  lightSrc,
  fallbackSrc,
  lightFallbackSrc,
  className,
  imageClassName,
  videoClassName,
}: {
  darkSrc: string;
  lightSrc?: string;
  fallbackSrc: string;
  lightFallbackSrc?: string;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayAttemptRef = useRef('');
  const [dark, setDark] = useState(false);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [playingSrc, setPlayingSrc] = useState('');
  // Default to reduced motion so server-rendered markup never forces autoplay
  // before the browser preference has been read.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setDark(root.classList.contains('dark'));
      setReducedMotion(motion.matches);
      setMediaInitialized(true);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    motion.addEventListener('change', sync);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); };
  }, []);

  const src = dark || !lightSrc ? darkSrc : lightSrc;
  const activeSrc = mediaInitialized ? src : '';
  const videoVisible = !reducedMotion && Boolean(activeSrc) && playingSrc.endsWith(activeSrc);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    autoplayAttemptRef.current = '';
    setPlayingSrc('');
    video.pause();
    video.load();
  }, [activeSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    if (reducedMotion) {
      autoplayAttemptRef.current = '';
      video.pause();
      setPlayingSrc('');
      return;
    }
    if (autoplayAttemptRef.current === activeSrc) return;
    autoplayAttemptRef.current = activeSrc;
    void video.play().catch(() => {
      setPlayingSrc('');
    });
  }, [activeSrc, reducedMotion]);

  return <div className={cn('absolute inset-0 overflow-hidden', className)}>
    {lightFallbackSrc ? <>
      <Image src={lightFallbackSrc} alt="" fill priority sizes="100vw" className={cn('object-cover dark:hidden', imageClassName)} />
      <Image src={fallbackSrc} alt="" fill priority sizes="100vw" className={cn('hidden object-cover dark:block', imageClassName)} />
    </> : <Image src={fallbackSrc} alt="" fill priority sizes="100vw" className={cn('object-cover', imageClassName)} />}
    <video
      ref={videoRef}
      aria-hidden="true"
      src={activeSrc || undefined}
      muted
      loop
      playsInline
      preload={reducedMotion ? 'none' : 'auto'}
      onPlaying={(event) => setPlayingSrc(event.currentTarget.currentSrc)}
      onPause={() => setPlayingSrc('')}
      onWaiting={() => setPlayingSrc('')}
      onStalled={() => setPlayingSrc('')}
      onEnded={() => setPlayingSrc('')}
      onError={() => setPlayingSrc('')}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-slow', videoVisible ? 'opacity-100' : 'opacity-0', videoClassName)}
    />
  </div>;
}

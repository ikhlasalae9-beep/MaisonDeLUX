'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeVideoBackground({
  darkSrc,
  lightSrc,
  fallbackSrc,
  label,
  className,
  imageClassName,
  videoClassName,
}: {
  darkSrc: string;
  lightSrc?: string;
  fallbackSrc: string;
  label: string;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dark, setDark] = useState(false);
  const [readySrc, setReadySrc] = useState('');
  const [failedSrc, setFailedSrc] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setDark(root.classList.contains('dark')); setReducedMotion(motion.matches); };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    motion.addEventListener('change', sync);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); };
  }, []);

  const src = dark || !lightSrc ? darkSrc : lightSrc;
  const canPlay = readySrc === src;
  const failed = failedSrc === src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    const reveal = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReadySrc(src);
    };
    reveal();
    video.addEventListener('loadeddata', reveal);
    video.addEventListener('canplay', reveal);
    return () => {
      video.removeEventListener('loadeddata', reveal);
      video.removeEventListener('canplay', reveal);
    };
  }, [failed, src]);

  return <div className={cn('absolute inset-0 overflow-hidden', className)}>
    <Image src={fallbackSrc} alt="" fill priority sizes="100vw" className={cn('object-cover', imageClassName)} />
    {!failed ? <video
      key={src}
      ref={videoRef}
      aria-label={label}
      autoPlay={!reducedMotion}
      muted
      loop={!reducedMotion}
      playsInline
      preload="auto"
      onCanPlay={() => {
        setReadySrc(src);
        if (!reducedMotion) void videoRef.current?.play().catch(() => setFailedSrc(src));
      }}
      onError={() => setFailedSrc(src)}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-slow', canPlay ? 'opacity-100' : 'opacity-0', videoClassName)}
    ><source src={src} type="video/mp4" /></video> : null}
  </div>;
}

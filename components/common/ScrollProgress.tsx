'use client';

import { useEffect, useRef } from 'react';
import { isRTL } from '@/lib/i18n/config';

interface ScrollProgressProps {
  locale?: string;
}

export function ScrollProgress({ locale = 'fr' }: ScrollProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const rtl = isRTL(locale);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 h-[2.5px] z-[70] pointer-events-none">
      <div ref={barRef}
        style={{
          transform: 'scaleX(0)',
          transformOrigin: rtl ? 'right' : 'left',
        }}
        className="w-full h-full bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400 shadow-[0_0_8px_rgba(29,78,216,0.6)]"
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { LondonNewsLogo } from "./LondonNewsLogo";

export function HomeSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 1150);
    const hideTimer = window.setTimeout(() => setVisible(false), 1650);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-500 ${fading ? "pointer-events-none scale-[1.03] opacity-0" : "opacity-100"}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(2, 8, 20, 0.55) 0%, rgba(2, 8, 20, 0.7) 50%, rgba(2, 8, 20, 0.92) 100%), url(https://london-news-two.vercel.app/images/splashscreen-image.webp)"
        }}
      />
      <div className="absolute inset-0 opacity-60 mix-blend-screen [background:repeating-linear-gradient(90deg,transparent_0,transparent_80px,rgba(255,255,255,0.015)_140px,transparent_220px)]" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <LondonNewsLogo
          imageClassName="drop-shadow-[0_24px_60px_rgba(0,0,0,0.35)] text-[3.7rem] sm:text-[5rem] lg:text-[6.1rem]"
          ariaLabel="London News home"
        />
        <div className="mt-7 h-px w-12 bg-white/35" />
        <p className="mt-5 text-lg font-light text-white/80">Your City. Your Stories.</p>
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="h-[2px] w-60 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-1/3 animate-[slide_1.6s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-[linear-gradient(90deg,transparent,var(--accent),transparent)]" />
          </div>
          <span className="ln-ui text-[11px] uppercase tracking-[0.45em] text-[var(--accent)]">Loading</span>
        </div>
      </div>
      <style jsx>{`
        @keyframes slide {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(350%);
          }
        }
      `}</style>
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from "react";

/* Breakpoints (matches common device widths):
   - mobile:  < 640px   (phones)
   - tablet:  640–1023px (iPad portrait ~768, iPad landscape ~1024 is the edge)
   - desktop: >= 1024px (laptops, iPad Pro landscape, external displays) */
const BREAKPOINTS = { tablet: 640, desktop: 1024, wide: 1440 };

function classify(width) {
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWide = width >= BREAKPOINTS.wide;
  return { width, isMobile, isTablet, isDesktop, isWide };
}

const ViewportContext = createContext(null);

export function ViewportProvider({ children }) {
  const [vp, setVp] = useState(() =>
    classify(typeof window !== "undefined" ? window.innerWidth : 375)
  );

  useEffect(() => {
    let frame = null;
    const onResize = () => {
      // rAF-throttle so dragging/rotating doesn't spam re-renders
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setVp(classify(window.innerWidth));
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <ViewportContext.Provider value={vp}>{children}</ViewportContext.Provider>;
}

export function useViewport() {
  const ctx = useContext(ViewportContext);
  if (!ctx) throw new Error("useViewport must be used within a ViewportProvider");
  return ctx;
}

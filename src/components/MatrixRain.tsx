import { useEffect, useRef } from "react";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const glyphs = "01<>/{}[]REACT_NODE_SQL_SYNC_BUILD";
    let animation = 0;
    let resizeAnimation = 0;
    let lastPaint = 0;
    let frame = 0;
    let width = 0;
    let height = 0;
    let particles: Array<{ x: number; y: number; speed: number; alpha: number; glyph: string; color: number }> = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const divisor = coarse ? 82000 : 56000;
      const count = Math.max(coarse ? 12 : 20, Math.floor((width * height) / divisor));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.1 + Math.random() * (coarse ? 0.12 : 0.22),
        alpha: 0.025 + Math.random() * 0.065,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        color: Math.floor(Math.random() * 12)
      }));
    };

    const paint = (advance: boolean) => {
      context.clearRect(0, 0, width, height);
      context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      particles.forEach((particle, index) => {
        const tint = particle.color === 0
          ? `rgba(255, 42, 42, ${particle.alpha * 0.55})`
          : particle.color < 3
            ? `rgba(94, 17, 116, ${particle.alpha * 0.7})`
            : `rgba(0, 168, 255, ${particle.alpha})`;
        context.fillStyle = tint;
        context.fillText(particle.glyph, particle.x, particle.y);
        if (!advance) return;
        particle.y += particle.speed;
        particle.x += Math.sin((frame + index) * 0.009) * 0.018;
        if (particle.y > height + 20) {
          particle.y = -20;
          particle.x = Math.random() * width;
          particle.glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      });
    };

    const draw = (time: number) => {
      const targetFrameMs = coarse ? 50 : 33;
      if (time - lastPaint >= targetFrameMs) {
        lastPaint = time;
        frame += 1;
        paint(true);
      }
      animation = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (!animation && !reduced && !document.hidden) animation = window.requestAnimationFrame(draw);
    };
    const stop = () => {
      if (animation) window.cancelAnimationFrame(animation);
      animation = 0;
    };
    const handleVisibility = () => document.hidden ? stop() : start();
    const scheduleResize = () => {
      window.cancelAnimationFrame(resizeAnimation);
      resizeAnimation = window.requestAnimationFrame(() => {
        resize();
        paint(false);
      });
    };

    resize();
    paint(false);
    start();
    window.addEventListener("resize", scheduleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.cancelAnimationFrame(resizeAnimation);
      window.removeEventListener("resize", scheduleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />;
}

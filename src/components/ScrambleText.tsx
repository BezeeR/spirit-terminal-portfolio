import { useEffect, useState } from "react";

const glyphs = "01#@$%&*+/<>[]{}";

export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOutput(text);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(18, text.length * 2);
    const interval = window.setInterval(() => {
      const progress = frame / totalFrames;
      const resolved = Math.floor(text.length * progress);
      setOutput(
        text
          .split("")
          .map((character, index) => {
            if (character === " ") return " ";
            if (index < resolved) return character;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join("")
      );
      frame += 1;
      if (frame > totalFrames) {
        window.clearInterval(interval);
        setOutput(text);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [text]);

  return <span className={className}>{output}</span>;
}

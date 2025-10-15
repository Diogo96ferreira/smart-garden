import { useEffect, useRef, useState } from 'react';

function TypingEffect({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }

    const chars = Array.from(text); // ✅ preserva UTF-8 (acentos e emojis)
    let i = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      setDisplayed((prev) => prev + chars[i]);
      i += 1;

      // auto-scroll suave
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }

      if (i < chars.length) {
        timeoutId = window.setTimeout(tick, 20); // velocidade por letra
      }
    };

    let timeoutId = window.setTimeout(tick, 20);

    // cleanup
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className="border-r-2 border-green-700 pr-2 leading-relaxed whitespace-pre-wrap"
      style={{
        fontVariantLigatures: 'none', // 🚫 evita ligaturas "st", "fi"
        fontFamily: 'system-ui, sans-serif', // evita artefactos de serif
      }}
    >
      {displayed}
    </div>
  );
}

export default TypingEffect;

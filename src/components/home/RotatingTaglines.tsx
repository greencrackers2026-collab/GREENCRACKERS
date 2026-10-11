"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

export function RotatingTaglines({ taglines }: { taglines: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (taglines.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % taglines.length), 3200);
    return () => clearInterval(id);
  }, [taglines.length]);

  if (!taglines.length) return null;
  return (
    <p className="relative h-14 overflow-hidden text-lg leading-snug sm:h-8 font-medium text-saffron-400 sm:text-xl" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={i}
          className="absolute inset-x-0"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          ✨ {taglines[i]}
        </m.span>
      </AnimatePresence>
    </p>
  );
}

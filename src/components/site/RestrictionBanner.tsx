"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/Icons";

export function RestrictionBanner({ text }: { text: string }) {
  // Rendered visible on the server (no layout shift); hidden after mount only if dismissed this session.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(sessionStorage.getItem("restriction-dismissed") === "1");
  }, []);
  if (hidden) return null;
  return (
    <div role="note" className="border-b border-saffron-500/30 bg-maroon-900/90 text-sm text-white">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5">
        <span aria-hidden="true">⚠️</span>
        <p className="flex-1 leading-snug text-white/90">
          <strong className="text-gold-300">Important notice: </strong>
          {text}
        </p>
        <button
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-white/10"
          onClick={() => {
            sessionStorage.setItem("restriction-dismissed", "1");
            setHidden(true);
          }}
          aria-label="Dismiss notice"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

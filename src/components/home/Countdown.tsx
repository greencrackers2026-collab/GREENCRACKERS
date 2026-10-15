import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    done: ms === 0,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function Countdown({ target, compact = false }: { target: string; compact?: boolean }) {
  const t = new Date(target).getTime();
  const [left, setLeft] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setLeft(diff(t));
    const id = setInterval(() => setLeft(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  if (left?.done) {
    return <p className="text-lg font-semibold text-gold-300">🪔 Happy Diwali! Festive offers still live.</p>;
  }

  const units: [string, number | undefined][] = [
    ["Days", left?.d],
    ["Hours", left?.h],
    ["Mins", left?.m],
    ["Secs", left?.s],
  ];

  return (
    <div role="timer" aria-label="Time left until Diwali" className="flex gap-2 sm:gap-3">
      {units.map(([label, v]) => (
        <div
          key={label}
          className={`glass flex flex-col items-center rounded-2xl ${compact ? "min-w-14 px-2 py-1.5" : "min-w-[4.25rem] px-3 py-2.5 sm:min-w-20"}`}
        >
          <span className={`font-bold tabular-nums text-gold-300 ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
            {v === undefined ? "--" : String(v).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-white/60 sm:text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}

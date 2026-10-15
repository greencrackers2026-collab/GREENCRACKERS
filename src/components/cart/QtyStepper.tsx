import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  step = 1,
  max = 10000,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5" role="group" aria-label={label}>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full hover:bg-white/10 disabled:opacity-40`}
        onClick={() => onChange(Math.max(value - step, 0))}
        aria-label="Decrease quantity"
        disabled={value <= 0}
      >
        <MinusIcon width={16} height={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={`${size === "sm" ? "w-10 text-sm" : "w-14"} bg-transparent text-center font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none`}
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(Math.max(n, 0), max));
        }}
      />
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full hover:bg-white/10 disabled:opacity-40`}
        onClick={() => onChange(Math.min(value + step, max))}
        aria-label="Increase quantity"
        disabled={value >= max}
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}

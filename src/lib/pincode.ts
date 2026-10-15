import { splitList } from "./format";

export type PincodeResult = { ok: boolean; reason?: string };

/** Instant client-side check. place_order() runs the same rules again in the database. */
export function checkPincode(
  pincode: string,
  cfg: { blocked_pincode_prefixes: string; serviceable_prefixes: string },
): PincodeResult {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return { ok: false, reason: "Enter a valid 6-digit pincode." };
  if (splitList(cfg.blocked_pincode_prefixes).some((p) => pincode.startsWith(p)))
    return {
      ok: false,
      reason:
        "Sorry, sale/delivery of crackers is restricted in your area. You can choose pickup from our licensed shop.",
    };
  const allowed = splitList(cfg.serviceable_prefixes);
  if (allowed.length && !allowed.some((p) => pincode.startsWith(p)))
    return { ok: false, reason: "We don't deliver to this pincode yet. Please contact us." };
  return { ok: true };
}

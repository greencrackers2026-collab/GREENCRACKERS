export type PincodeResult = { ok: boolean; reason?: string };

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** Pure check usable on server and client. */
export function checkPincode(
  pincode: string,
  cfg: { blockedPincodePrefixes: string; serviceablePrefixes: string },
): PincodeResult {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return { ok: false, reason: "Enter a valid 6-digit pincode." };
  if (list(cfg.blockedPincodePrefixes).some((p) => pincode.startsWith(p)))
    return {
      ok: false,
      reason:
        "Sorry, sale/delivery of crackers is restricted in your area. You can choose pickup from our licensed shop.",
    };
  const allowed = list(cfg.serviceablePrefixes);
  if (allowed.length && !allowed.some((p) => pincode.startsWith(p)))
    return { ok: false, reason: "We don't deliver to this pincode yet. Please contact us." };
  return { ok: true };
}

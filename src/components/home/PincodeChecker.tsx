"use client";

import { useState } from "react";
import { checkPincode, type PincodeResult } from "@/lib/pincode";
import { MapPinIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/format";

export function PincodeChecker({
  blockedPincodePrefixes,
  serviceablePrefixes,
  whatsappNumber,
}: {
  blockedPincodePrefixes: string;
  serviceablePrefixes: string;
  whatsappNumber: string;
}) {
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<PincodeResult | null>(null);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        setRes(checkPincode(pin, { blockedPincodePrefixes, serviceablePrefixes }));
      }}
    >
      <label htmlFor="pincode-check" className="label flex items-center gap-1.5">
        <MapPinIcon width={16} height={16} /> Check delivery to your pincode
      </label>
      <div className="flex gap-2">
        <input
          id="pincode-check"
          className="input"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 600040"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setRes(null);
          }}
          aria-describedby="pincode-result"
        />
        <button className="btn btn-ghost shrink-0" type="submit">
          Check
        </button>
      </div>
      <p id="pincode-result" role="status" className="mt-2 min-h-5 text-sm">
        {res &&
          (res.ok ? (
            <span className="text-festive-green">✓ Great! We deliver to {pin}.</span>
          ) : (
            <span className="text-saffron-400">
              {res.reason}{" "}
              {whatsappNumber && (
                <a
                  className="underline"
                  href={waLink(whatsappNumber, `Hi, I'm in pincode ${pin}. Can I order for pickup?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp
                </a>
              )}
            </span>
          ))}
      </p>
    </form>
  );
}

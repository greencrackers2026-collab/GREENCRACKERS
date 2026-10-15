import { useEffect, useState } from "react";
import { uploadPaymentProof } from "@/lib/images";

/** Uploads a UPI payment screenshot and reports the stored file name back to the parent. */
export function PaymentProofUpload({ onUploaded, id = "payment-proof" }: { onUploaded: (name: string | null) => void; id?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setErr(null);
    setDone(false);
    onUploaded(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      onUploaded(await uploadPaymentProof(file));
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        Upload payment screenshot *
      </label>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3 transition hover:bg-white/10 ${
          done ? "border-emerald-400/60 bg-emerald-500/10" : err ? "border-red-400/60" : "border-white/25 bg-white/5"
        }`}
      >
        {preview ? (
          <img src={preview} alt="Your payment screenshot" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="grid h-20 w-14 shrink-0 place-items-center rounded-lg bg-white/10 text-2xl" aria-hidden="true">
            📷
          </span>
        )}
        <span className="text-sm">
          {busy ? (
            "Uploading…"
          ) : done ? (
            <span className="text-festive-green">✓ Screenshot uploaded. Tap to change.</span>
          ) : (
            <>
              <b>Tap to choose</b> the screenshot of your successful payment
              <span className="block text-xs text-white/55">PNG or JPG, up to 8 MB</span>
            </>
          )}
        </span>
      </label>
      <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
      {err && (
        <p className="mt-1 text-sm text-red-300" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-store";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { checkPincode } from "@/lib/pincode";
import { INDIAN_STATES, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { errorMessage, supabase } from "@/lib/supabase";
import type { DeliveryMode, PaymentMethod, PriceQuote, SiteSettings } from "@/lib/types";
import { PaymentProofUpload } from "./PaymentProofUpload";

type Fields = {
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

const EMPTY: Fields = { name: "", phone: "", email: "", address1: "", address2: "", city: "", state: "Tamil Nadu", pincode: "", notes: "" };
const DRAFT_KEY = "checkout-draft-v1";

const loadDraft = (): Fields => {
  try {
    const d = localStorage.getItem(DRAFT_KEY);
    return d ? { ...EMPTY, ...JSON.parse(d) } : EMPTY;
  } catch {
    return EMPTY;
  }
};

export function CheckoutClient({ s }: { s: SiteSettings }) {
  const navigate = useNavigate();
  const items = useCart((st) => st.items);
  const setQty = useCart((st) => st.setQty);
  const clear = useCart((st) => st.clear);

  const methods = useMemo(
    () => [s.upi_available && "UPI", s.cod_enabled && "COD"].filter(Boolean) as PaymentMethod[],
    [s],
  );

  // Address draft is restored from / saved to this browser so a refresh doesn't lose it.
  const [f, setF] = useState<Fields>(loadDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | "form", string>>>({});
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(methods[0] ?? "COD");
  // The store's highlighted coupon (e.g. DIWALI10 = free delivery) is pre-applied; customers can remove it.
  const [couponInput, setCouponInput] = useState(s.auto_coupon?.code ?? "");
  const [coupon, setCoupon] = useState(s.auto_coupon?.code ?? "");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [upiRef, setUpiRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [pricing, setPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...f, notes: "" }));
    } catch {}
  }, [f]);

  const lines = useMemo(() => items.map((i) => ({ kind: i.kind, id: i.id, qty: i.qty })), [items]);

  // The database re-prices the cart (coupon, auto offer, shipping) whenever anything relevant changes.
  useEffect(() => {
    if (!lines.length) {
      setQuote(null);
      return;
    }
    let stale = false;
    setPricing(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("price_cart", {
        p_lines: lines,
        p_coupon_code: coupon || null,
        p_delivery_mode: deliveryMode,
        p_payment_method: paymentMethod,
      });
      if (stale) return;
      if (error) setErrors((p) => ({ ...p, form: errorMessage(error, "Could not calculate prices. Please refresh.") }));
      else setQuote(data as PriceQuote);
      setPricing(false);
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [lines, coupon, deliveryMode, paymentMethod]);

  const pin = f.pincode.length === 6 ? checkPincode(f.pincode, s) : null;
  const pinBlocked = deliveryMode === "DELIVERY" && pin && !pin.ok;

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = k === "pincode" ? e.target.value.replace(/\D/g, "").slice(0, 6) : k === "phone" ? e.target.value.replace(/[^\d+\s-]/g, "") : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (paymentMethod === "UPI" && !paymentProof) {
      setErrors({ form: "Please pay using the UPI QR and upload your payment screenshot." });
      return;
    }
    const parsed = checkoutSchema.safeParse(f);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    if (pinBlocked) {
      setErrors({ pincode: pin?.reason });
      return;
    }
    setSubmitting(true);
    setErrors({});
    const { data, error } = await supabase.rpc("place_order", {
      p: {
        lines,
        ...parsed.data,
        coupon_code: quote?.coupon_code ?? null,
        delivery_mode: deliveryMode,
        payment_method: paymentMethod,
        ...(paymentMethod === "UPI" && { payment_proof: paymentProof, upi_ref: upiRef || null }),
      },
    });
    if (error) {
      setErrors({ form: errorMessage(error) });
      setSubmitting(false);
      return;
    }
    clear();
    navigate(`/order/${(data as { id: string }).id}`);
  }

  if (!items.length)
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl p-10 text-center">
        <p className="text-5xl" aria-hidden="true">🪔</p>
        <p className="mt-4 text-lg">Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary mt-6">
          Browse Crackers
        </Link>
      </div>
    );

  const field = (k: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${k}`} className="label">
        {label}
      </label>
      <input
        id={`f-${k}`}
        className="input"
        value={f[k]}
        onChange={set(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
        {...props}
      />
      {errors[k] && (
        <p id={`e-${k}`} className="mt-1 text-sm text-red-300">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={placeOrder} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <fieldset className="glass rounded-3xl p-5 sm:p-6">
          <legend className="sr-only">Contact details</legend>
          <h2 className="mb-4 text-lg font-bold text-gold-300">1. Contact details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Full name *", { autoComplete: "name", required: true })}
            {field("phone", "Mobile number *", { autoComplete: "tel", inputMode: "tel", placeholder: "10-digit mobile", required: true })}
            <div className="sm:col-span-2">{field("email", "Email (for order updates)", { type: "email", autoComplete: "email" })}</div>
          </div>
        </fieldset>

        <fieldset className="glass rounded-3xl p-5 sm:p-6">
          <legend className="sr-only">Delivery</legend>
          <h2 className="mb-4 text-lg font-bold text-gold-300">2. Delivery</h2>
          <div className="mb-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery mode">
            {(
              [
                ["DELIVERY", "🚚 Home delivery"],
                ["PICKUP", "🏪 Pickup from shop"],
              ] as const
            ).map(([k, label]) => (
              <button
                type="button"
                role="radio"
                aria-checked={deliveryMode === k}
                key={k}
                onClick={() => setDeliveryMode(k)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                  deliveryMode === k ? "border-gold-400 bg-gold-400/15 text-gold-300" : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {deliveryMode === "PICKUP" && (
            <p className="mb-4 rounded-xl bg-white/5 p-3 text-sm text-white/75">
              Pick up from our licensed shop. We&apos;ll call you when your order is packed. Address below is used for your invoice.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("address1", "Address line 1 *", { autoComplete: "address-line1", placeholder: "House no., street" })}</div>
            <div className="sm:col-span-2">{field("address2", "Address line 2", { autoComplete: "address-line2", placeholder: "Area, landmark" })}</div>
            {field("city", "City *", { autoComplete: "address-level2" })}
            <div>
              <label htmlFor="f-state" className="label">
                State *
              </label>
              <select id="f-state" className="input" value={f.state} onChange={set("state")} autoComplete="address-level1" aria-invalid={Boolean(errors.state)}>
                {INDIAN_STATES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              {field("pincode", "Pincode *", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
              {pin && !errors.pincode && (
                <p className={`mt-1 text-sm ${pin.ok ? "text-festive-green" : "text-saffron-400"}`} role="status">
                  {pin.ok ? "✓ Delivery available" : deliveryMode === "PICKUP" ? "Delivery restricted here. Pickup is fine." : pin.reason}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-notes" className="label">
                Delivery notes
              </label>
              <textarea id="f-notes" className="input min-h-20" value={f.notes} onChange={set("notes")} placeholder="Preferred time, landmark…" maxLength={500} />
            </div>
          </div>
          {pinBlocked && (
            <div className="mt-4 rounded-xl border border-saffron-500/40 bg-saffron-500/10 p-3 text-sm">
              We can&apos;t deliver to this pincode. Choose <b>Pickup from shop</b> instead.
            </div>
          )}
        </fieldset>

        <fieldset className="glass rounded-3xl p-5 sm:p-6">
          <legend className="sr-only">Payment method</legend>
          <h2 className="mb-4 text-lg font-bold text-gold-300">3. Payment</h2>
          {methods.length === 0 ? (
            <p className="text-white/70">Online ordering is paused. Please contact us to order.</p>
          ) : (
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    paymentMethod === m ? "border-gold-400 bg-gold-400/10" : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m}
                    checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)}
                    className="mt-1 h-4 w-4 accent-amber-400"
                  />
                  <span>
                    <span className="block font-semibold">{PAYMENT_METHOD_LABEL[m]}</span>
                    <span className="text-sm text-white/65">
                      {m === "UPI" && "Scan our UPI QR, pay, and upload the payment screenshot. Your order is confirmed after we verify it."}
                      {m === "COD" && `Pay in cash when your order arrives. ₹${s.cod_fee} extra COD charges apply.`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {paymentMethod === "UPI" && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-gold-400/30 bg-black/20 p-4 sm:grid-cols-[auto_1fr]">
              {s.upi_qr_image && (
                <div className="mx-auto w-44 rounded-xl bg-white p-2">
                  <img src={s.upi_qr_image} alt="UPI QR code to pay" width={320} height={320} className="h-auto w-full" />
                </div>
              )}
              <div className="space-y-3">
                <p className="text-sm text-white/80">
                  <b className="text-gold-300">Step 1:</b> Scan the QR with GPay, PhonePe, Paytm or any UPI app and pay exactly{" "}
                  <b className="text-lg text-gold-300">{quote ? formatINR(quote.total) : "…"}</b>
                  {s.upi_id && (
                    <>
                      {" "}(UPI ID <b className="font-mono">{s.upi_id}</b>)
                    </>
                  )}
                  .
                </p>
                {s.upi_id && quote && (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.store_name)}&am=${quote.total}&cu=INR&tn=${encodeURIComponent("Crackers order")}`}
                      className="btn btn-primary text-sm sm:hidden"
                    >
                      Pay {formatINR(quote.total)} with UPI app
                    </a>
                    <button
                      type="button"
                      className="btn btn-ghost text-sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(s.upi_id).then(
                          () => setCopied(true),
                          () => setCopied(false),
                        );
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "✓ Copied" : "Copy UPI ID"}
                    </button>
                  </div>
                )}
                <p className="text-xs text-white/55 sm:hidden">On a phone? Tap the button above, or take a screenshot of the QR and scan it from your UPI app&apos;s gallery option.</p>
                <p className="text-sm text-white/80">
                  <b className="text-gold-300">Step 2:</b> Upload the screenshot of the successful payment.
                </p>
                <PaymentProofUpload onUploaded={setPaymentProof} />
                <div>
                  <label htmlFor="f-upiref" className="label">
                    UPI transaction ID / UTR (optional)
                  </label>
                  <input id="f-upiref" className="input" value={upiRef} onChange={(e) => setUpiRef(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} maxLength={30} placeholder="e.g. 412345678901" />
                </div>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="summary-title">
        <div className="glass space-y-4 rounded-3xl p-5 sm:p-6">
          <h2 id="summary-title" className="text-lg font-bold text-gold-300">
            Order summary
          </h2>
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={`${i.kind}-${i.id}`} className="flex gap-3">
                <img src={i.image} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <QtyStepper size="sm" value={i.qty} step={i.step} onChange={(n) => setQty(i.kind, i.id, n)} label={`Quantity of ${i.name}`} />
                    <span className="text-sm font-semibold">{formatINR(i.price * i.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="coupon" className="label">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                className="input uppercase"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="e.g. DIWALI10"
              />
              {coupon ? (
                <button
                  type="button"
                  className="btn btn-ghost shrink-0"
                  onClick={() => {
                    setCoupon("");
                    setCouponInput("");
                  }}
                >
                  Remove
                </button>
              ) : (
                <button type="button" className="btn btn-ghost shrink-0" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>
                  Apply
                </button>
              )}
            </div>
            {coupon && quote?.coupon_message && (
              <p className={`mt-1 text-sm ${quote.coupon_code ? "text-festive-green" : "text-red-300"}`} role="status">
                {quote.coupon_message}
              </p>
            )}
          </div>

          {quote?.errors.map((er) => (
            <p key={er} className="rounded-xl bg-red-500/15 p-2 text-sm text-red-200">
              {er}
            </p>
          ))}

          <dl className={`space-y-2 border-t border-white/10 pt-4 text-sm ${pricing ? "opacity-60" : ""}`} aria-busy={pricing}>
            <Row label="MRP total" value={quote ? <span className="line-through">{formatINR(quote.mrp_total)}</span> : "…"} muted />
            <Row label="Sale price" value={quote ? formatINR(quote.subtotal) : "…"} />
            {quote && quote.auto_discount > 0 && <Row label={`Extra ${s.auto_offer_percent}% off`} value={`− ${formatINR(quote.auto_discount)}`} green />}
            <Row label="Delivery" value={quote ? (quote.shipping_fee ? formatINR(quote.shipping_fee) : "FREE") : "…"} />
            {quote && quote.coupon_discount > 0 && <Row label={`Coupon (${quote.coupon_code})`} value={`− ${formatINR(quote.coupon_discount)}`} green />}
            {quote && quote.cod_fee > 0 && <Row label="COD charges" value={formatINR(quote.cod_fee)} />}
            <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd>{quote ? formatINR(quote.total) : "…"}</dd>
            </div>
            {quote && quote.savings > 0 && (
              <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-center font-semibold text-festive-green">
                🎉 You save {formatINR(quote.savings)} on this order!
              </p>
            )}
            {quote && quote.subtotal < s.auto_offer_threshold && s.auto_offer_percent > 0 && (
              <p className="text-center text-xs text-white/60">
                Add {formatINR(s.auto_offer_threshold - quote.subtotal)} more to get an extra {s.auto_offer_percent}% off
              </p>
            )}
          </dl>

          {errors.form && (
            <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
              {errors.form}
            </p>
          )}
          {quote && !quote.meets_minimum && <p className="text-sm text-saffron-400">Minimum order value is {formatINR(s.min_order_value)}.</p>}

          <button
            type="submit"
            className="btn btn-primary w-full text-base"
            disabled={
              submitting ||
              pricing ||
              !quote ||
              !quote.meets_minimum ||
              quote.errors.length > 0 ||
              methods.length === 0 ||
              Boolean(pinBlocked) ||
              (paymentMethod === "UPI" && !paymentProof)
            }
          >
            {submitting
              ? "Placing order…"
              : paymentMethod === "UPI"
                ? paymentProof
                  ? "Submit Order for Verification"
                  : "Upload payment screenshot first"
                : "Place Order"}
          </button>
          <p className="text-center text-xs text-white/50">
            By placing this order you agree to our <Link to="/terms" className="underline">Terms</Link> and confirm you are 18+.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value, muted, green }: { label: string; value: React.ReactNode; muted?: boolean; green?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-white/50" : ""} ${green ? "text-festive-green" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

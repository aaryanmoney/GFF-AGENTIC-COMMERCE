import React, { useState } from "react";
import { products } from "@/utils/mockData";
import { getProductImage } from "./constants";
import type { PaymentState, ChatMessage } from "@/utils/types";
import { CreditCardIcon, LockClosedIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import icons from "payments-icons-library";
import {
  formatCardNumber,
  formatExpiry,
  getCardType,
} from "@/app/utils/cardUtils";
import { validateCardField } from "@/app/utils/cardValidation";


const getBrandIcon = (brand?: string) => {
  if (!brand) return null;
  try {
    const key = brand.toLowerCase(); 
    const res: any = icons.getIcon(key, "svg");
    return res?.icon_url || null;
  } catch {
    return null;
  }
};

export function RenderData({
  msg,
  onSelectCard,
  onSubmitNewCard,
  paymentState,
  onSelectProduct,
}: {
  msg: ChatMessage;
  onSelectCard: (id: string) => void;
  onSubmitNewCard: (e: React.FormEvent<HTMLFormElement>) => void;
  paymentState: PaymentState;
  onSelectProduct?: (product: any) => void;
}) {
  if (!msg.data) return null;
  const typingNotFinished =
    (msg as any).fullText && msg.text !== (msg as any).fullText;

  const [cardData, setCardData] = useState({
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
    cvv: "",
  });
  const [focused, setFocused] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  const handleInput = (field: string, val: string) => {
    let v = val;
    if (field === "cardNumber") v = formatCardNumber(val);
    if (field === "expiry") v = formatExpiry(val);
    if (field === "cvv") v = v.replace(/[^0-9]/g, "").slice(0, 4);
    if (field === "nameOnCard") v = v.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCardData(d => ({ ...d, [field]: v }));
    setErrors(validateCardField(field, v, errors));
  };
  const canSubmit =
    cardData.cardNumber &&
    cardData.nameOnCard &&
    cardData.expiry &&
    cardData.cvv &&
    Object.keys(errors).length === 0 &&
    paymentState !== "PROCESSING";

  const cardType = getCardType(cardData.cardNumber);

  if (msg.type === "PRODUCT_LIST") {
    if (typingNotFinished) return null;
    const list =
      Array.isArray(msg.data?.products) && msg.data.products.length
        ? msg.data.products
        : products;
    return (
      <div className="mt-3 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {list.map((p: any) => {
          const img = p.image || getProductImage(p.id);
          return (
            <div
              key={p.id}
              className="rounded border border-neutral-700 p-3 flex items-center gap-3 bg-neutral-800/50 fade-in cursor-pointer hover:border-indigo-500/70"
              onClick={() => {
                if (onSelectProduct) {
                  onSelectProduct(p);
                }
              }}
              title={`Buy ${p.title}`}
            >
              {img && (
                <div className="flex-shrink-0">
                  <img
                    src={img}
                    alt={p.title}
                    className="w-14 h-14 object-cover rounded-md border border-neutral-700"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-1 break-words">
                  {p.title}
                </div>
                <div className="text-sm font-semibold">
                  {p.price} {p.currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
}

  if (msg.type === "PRODUCT_CONFIRMATION") {
    if (typingNotFinished) return null;
    const pid = msg.data?.productId || msg.data?.id;
    const img = getProductImage(pid);
    if (!img) return null;
    return (
      <div className="mt-3 flex gap-3 items-start fade-in">
        <img
          src={img}
          alt={pid}
          className="w-20 h-20 object-cover rounded-md border border-neutral-700"
        />
        <div className="text-xs text-neutral-300">
          <div className="font-medium mb-1">
            {msg.data?.productTitle || pid}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "HANDOFF") {
    const toShopping =
      msg.agent === "cashfree" || msg.data?.to === "shopping";
    return (
      <div className="mt-3 text-xs text-amber-400 fade-in">
        {toShopping
          ? "Handing off back to CAIA Agent."
          : "Handed off to Cashfree Payments."}
      </div>
    );
  }

  if (msg.type === "PAYMENT_SHOW_SAVED_CARDS") {
    const cards = msg.data.cards || [];
    return (
      <div className="mt-3 fade-in w-full max-w-md">
        <div className=" rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CreditCardIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-neutral-200">
                Saved Cards
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
              <LockClosedIcon className="w-3.5 h-3.5" />
              Secure
            </div>
          </div>
          <div className="p-4 space-y-3">
            {cards.length === 0 && (
              <div className="text-xs text-neutral-500">
                No saved cards available.
              </div>
            )}
            {cards.map((c: any) => {
              const iconUrl = getBrandIcon(c.brand);
              const isLoading = loadingCardId === c.id && paymentState === "PROCESSING";
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (paymentState === "PROCESSING") return;
                    setLoadingCardId(c.id);
                    onSelectCard(c.id);
                  }}
                  disabled={paymentState === "PROCESSING"}
                  className="group w-full relative flex items-center gap-4 p-4 rounded-xl bg-neutral-800/60 border border-neutral-700 hover:border-emerald-500/50 hover:bg-neutral-800 transition duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-8 flex items-center justify-center rounded-md overflow-hidden">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={c.brand}
                        className="w-10 h-6 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold tracking-wide text-neutral-300">
                        {c.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium tracking-wide text-neutral-200">
                      •••• {c.last4}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-400 flex gap-4">
                      <span>
                        Exp {c.expMonth}/{String(c.expYear).slice(-2)}
                      </span>
                      {c.nameOnCard && <span>{c.nameOnCard}</span>}
                    </div>
                  </div>
                  <div
                    aria-busy={isLoading}
                    className={`ml-auto text-[11px] font-semibold px-3 py-1 rounded-md border
                      ${
                        isLoading
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-transparent text-emerald-400/80 bg-transparent hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                      }
                      transition flex items-center gap-2
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      </>
                    ) : (
                      "Use"
                    )}
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-1 group-hover:ring-emerald-500/40" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "PAYMENT_NEED_NEW_CARD") {
  const [cancelled, setCancelled] = useState(false);

  if (cancelled) {
    return (
      <div className="mt-3 fade-in w-full max-w-md">
        <div className="rounded-2xl border border-red-600/40 bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-xl p-5 text-center">
          <XCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-red-400">
            Payment Cancelled
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            You cancelled the payment process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 fade-in">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-700 bg-neutral-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CreditCardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Add Payment Method</div>
                <div className="text-[11px] text-neutral-400">
                  Enter card details securely
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <LockClosedIcon className="w-4 h-4" />
              Secure
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              ["cardNumber", "nameOnCard", "expiry", "cvv"].forEach(f =>
                setErrors(prevErrors => ({
                  ...prevErrors,
                  ...validateCardField(f, cardData[f as keyof typeof cardData], {})
                }))
              );
              if (!canSubmit) return;
              onSubmitNewCard(e as any);
            }}
            className="p-5 space-y-5"
          >
            <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={e => handleInput("cardNumber", e.target.value)}
                    onFocus={() => setFocused("cardNumber")}
                    onBlur={() => setFocused("")}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.cardNumber
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "cardNumber"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                  />
                  {cardData.cardNumber && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {(() => {
                        const iconUrl = getBrandIcon(cardType);
                        return iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={cardType}
                            className="w-8 h-5 object-contain rounded-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold
                          ${
                            cardType === "visa"
                              ? "bg-blue-600 text-white"
                              : cardType === "mastercard"
                              ? "bg-red-600 text-white"
                              : cardType === "amex"
                              ? "bg-green-600 text-white"
                              : "bg-neutral-600 text-neutral-200"
                          }`}
                          >
                            {cardType === "visa"
                              ? "VISA"
                              : cardType === "mastercard"
                              ? "MC"
                              : cardType === "amex"
                              ? "AMEX"
                              : "CARD"}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-400">{errors.cardNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Name on Card
                </label>
                <input
                  name="nameOnCard"
                  value={cardData.nameOnCard}
                  onChange={e => handleInput("nameOnCard", e.target.value)}
                  onFocus={() => setFocused("nameOnCard")}
                  onBlur={() => setFocused("")}
                  placeholder="JOHN DOE"
                  className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition uppercase
                    ${
                      errors.nameOnCard
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                        : focused === "nameOnCard"
                        ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                        : "border-neutral-600 focus:border-neutral-500"
                    }`}
                  autoComplete="off"
                />
                {errors.nameOnCard && (
                  <p className="text-xs text-red-400">{errors.nameOnCard}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    Expiry (MM/YY)
                  </label>
                  <input
                    name="expiry"
                    value={cardData.expiry}
                    onChange={e => handleInput("expiry", e.target.value)}
                    onFocus={() => setFocused("expiry")}
                    onBlur={() => setFocused("")}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.expiry
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "expiry"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                    maxLength={5}
                  />
                  {errors.expiry && (
                    <p className="text-xs text-red-400">{errors.expiry}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    CVV
                  </label>
                  <input
                    name="cvv"
                    value={cardData.cvv}
                    onChange={e => handleInput("cvv", e.target.value)}
                    onFocus={() => setFocused("cvv")}
                    onBlur={() => setFocused("")}
                    placeholder="123"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.cvv
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "cvv"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-400">{errors.cvv}</p>
                  )}
                </div>
              </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">
                Your data is safe & never exposed to agent.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={paymentState === "PROCESSING"}
                onClick={() => setCancelled(true)}
                className="flex-1 text-xs font-medium rounded-lg border border-red-600 bg-neutral-800/50 hover:bg-red-600/20 disabled:opacity-50 px-4 py-2.5 transition text-red-400"
              >
                Cancel
              </button>
              <button
                disabled={!canSubmit}
                className="flex-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 px-4 py-2.5 flex items-center justify-center gap-2 transition"
              >
                {paymentState === "PROCESSING" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-4 h-4" />
                    Save and Proceed
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


  if (msg.type === "PAYMENT_PROCESSING") {
    return (
      <div className="mt-3 text-xs text-neutral-400">
        Processing payment...
      </div>
    );
  }

  if (msg.type === "PAYMENT_RESULT") {
    const status = (msg.data.status || "SUCCESS").toUpperCase();
    const isSuccess = status === "SUCCESS";
    const brandIcon = getBrandIcon(msg.data.card?.brand);
    return (
      <div className="mt-4 w-full max-w-md fade-in">
        <div
          className={`relative overflow-hidden rounded-2xl border shadow-xl ring-1 backdrop-blur-sm
            ${
              isSuccess
                ? "border-emerald-600/40 ring-emerald-500/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800"
                : "border-red-600/40 ring-red-500/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800"
            }`}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl
                ${isSuccess ? "bg-emerald-600/30" : "bg-red-600/30"}`}
            />
            <div
              className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-10 blur-3xl
                ${isSuccess ? "bg-teal-500/40" : "bg-rose-500/40"}`}
            />
          </div>

            <div className={`px-5 py-4 border-b flex items-center gap-3 relative
              ${isSuccess ? "border-emerald-600/30" : "border-red-600/30"}`}>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner
                ${isSuccess ? "bg-emerald-600/20 border border-emerald-500/30" : "bg-red-600/20 border border-red-500/30"}`}
              >
                {isSuccess ? (
                  <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm font-semibold tracking-wide
                  ${isSuccess ? "text-emerald-400" : "text-red-400"}`}
                >
                  {isSuccess ? "Payment Successful" : "Payment Failed"}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {isSuccess
                    ? "Your order has been confirmed."
                    : (msg.data.errorMessage || "The payment couldn’t be completed.")}
                </div>
              </div>
              {status && (
                <div
                  className={`text-[10px] px-2 py-1 rounded-md font-medium tracking-wide
                  ${isSuccess ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}
                >
                  {status}
                </div>
              )}
            </div>

            <div className="p-5 relative space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-neutral-500">Order ID</p>
                  <p className="font-medium text-neutral-200 break-all">
                    {msg.data.orderId || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-neutral-500">Amount</p>
                  <p className="font-semibold text-neutral-100">
                    {msg.data.amount} {msg.data.currency}
                  </p>
                </div>
                {msg.data.card?.brand && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-neutral-500">Payment Method</p>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/60 border border-neutral-700">
                      <div className="w-11 h-7 rounded-md  flex items-center justify-center overflow-hidden">
                        {brandIcon ? (
                          <img
                            src={brandIcon}
                            alt={msg.data.card.brand}
                            className="w-10 h-5 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold text-neutral-300 uppercase">
                            {msg.data.card.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-neutral-200 font-medium tracking-wide">
                          •••• {msg.data.card.last4}
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {isSuccess ? "Verified" : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {msg.data.notes && (
                <div className="text-[11px] text-neutral-400 leading-relaxed">
                  {msg.data.notes}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {isSuccess && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Secured by encrypted processing.
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    );
  }

  return null;
}